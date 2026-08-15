import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

/**
 * AI Configuration & Client Resolution
 */
function resolveAiConfig(req: express.Request) {
  const customApiKey =
    (req.headers['x-ai-api-key'] as string) ||
    (req.headers['x-gemini-api-key'] as string) ||
    req.body.customApiKey ||
    '';

  let provider = (req.headers['x-ai-provider'] as string) || req.body.provider;
  let model =
    (req.headers['x-ai-model'] as string) ||
    (req.headers['x-gemini-model'] as string) ||
    req.body.model;
  const baseUrl = (req.headers['x-ai-base-url'] as string) || req.body.baseUrl;

  // Auto-detect provider if key is sk-... or model is deepseek
  if (!provider) {
    if (customApiKey && (customApiKey.startsWith('sk-') || (model && model.includes('deepseek')))) {
      provider = 'deepseek';
    } else {
      provider = 'gemini';
    }
  }

  if (!model) {
    model = provider === 'deepseek' ? 'deepseek-chat' : 'gemini-3.7-flash';
  }

  return {
    provider: provider as 'gemini' | 'deepseek',
    apiKey: customApiKey ? customApiKey.trim() : undefined,
    model,
    baseUrl: baseUrl ? baseUrl.trim() : undefined,
  };
}

// Lazy initialize Gemini client
function getGenAI(customApiKey?: string): GoogleGenAI | null {
  const apiKey =
    customApiKey && typeof customApiKey === 'string' && customApiKey.trim()
      ? customApiKey.trim()
      : process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

/**
 * Robust JSON extraction from LLM output
 */
function safeParseJson<T = any>(text: string, fallback: T): T {
  if (!text) return fallback;
  let clean = text.trim();

  // Strip Markdown code block ```json ... ``` or ``` ... ```
  const markdownMatch = clean.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (markdownMatch) {
    clean = markdownMatch[1].trim();
  }

  try {
    return JSON.parse(clean);
  } catch (_) {
    // Attempt to locate outer { ... } or [ ... ]
    const firstBrace = clean.search(/[\{\[]/);
    const lastBrace = clean.search(/[\}\]][^\{\}\]]*$/);
    if (firstBrace !== -1 && lastBrace !== -1) {
      try {
        return JSON.parse(clean.substring(firstBrace, lastBrace + 1));
      } catch (e2) {
        console.error('JSON Substring parse failed:', e2, clean.slice(0, 150));
      }
    }
    return fallback;
  }
}

/**
 * DeepSeek / OpenAI-compatible Chat Completions Executor
 */
async function callDeepSeekChat(params: {
  apiKey: string;
  model: string;
  baseUrl?: string;
  systemInstruction?: string;
  prompt: string;
  jsonMode?: boolean;
}): Promise<string> {
  let endpoint = params.baseUrl ? params.baseUrl.trim().replace(/\/+$/, '') : 'https://api.deepseek.com';
  if (!endpoint.endsWith('/chat/completions')) {
    if (endpoint.endsWith('/v1')) {
      endpoint = `${endpoint}/chat/completions`;
    } else {
      endpoint = `${endpoint}/chat/completions`;
    }
  }

  const isReasoner = params.model.includes('reasoner');

  const messages: any[] = [];
  if (params.systemInstruction && !isReasoner) {
    messages.push({ role: 'system', content: params.systemInstruction });
  }

  let userContent = params.prompt;
  if (isReasoner && params.systemInstruction) {
    userContent = `[System Role & Instructions]\n${params.systemInstruction}\n\n[User Context & Task]\n${params.prompt}`;
  }

  if (params.jsonMode) {
    userContent += '\n\n【输出格式要求】：请严格且只输出标准合法的 JSON 对象，不要添加 markdown 提示词或任何多余文字。';
  }

  messages.push({ role: 'user', content: userContent });

  const body: any = {
    model: params.model,
    messages,
  };

  // DeepSeek-V3 supports response_format: { type: "json_object" }
  if (params.jsonMode && !isReasoner) {
    body.response_format = { type: 'json_object' };
    body.temperature = 0.3;
  }

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${params.apiKey}`,
      'User-Agent': 'LifeOS-Client',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errorText = await res.text();
    let parsedErr = errorText;
    try {
      const j = JSON.parse(errorText);
      parsedErr = j.error?.message || j.message || errorText;
    } catch (_) {}
    throw new Error(`DeepSeek 请求失败 (${res.status}): ${parsedErr}`);
  }

  const data: any = await res.json();
  const choice = data.choices && data.choices[0];
  if (!choice || !choice.message || !choice.message.content) {
    throw new Error('DeepSeek 返回内容为空');
  }

  return choice.message.content;
}

// Health Check
app.get('/api/health', (req, res) => {
  const customApiKey = (req.headers['x-gemini-api-key'] as string) || (req.headers['x-ai-api-key'] as string) || '';
  res.json({
    status: 'ok',
    hasEnvApiKey: !!process.env.GEMINI_API_KEY,
    hasCustomApiKey: !!customApiKey,
    timestamp: new Date().toISOString(),
  });
});

/**
 * 🔑 Validate user's custom API Key & Model (Unified for Gemini & DeepSeek)
 */
async function handleValidate(req: express.Request, res: express.Response) {
  const config = resolveAiConfig(req);

  if (!config.apiKey) {
    return res.status(400).json({ ok: false, error: '请提供有效的 API Key' });
  }

  const startTime = Date.now();

  if (config.provider === 'deepseek') {
    try {
      let endpoint = config.baseUrl || 'https://api.deepseek.com';
      endpoint = endpoint.replace(/\/+$/, '');
      if (!endpoint.endsWith('/chat/completions')) {
        endpoint = `${endpoint}/chat/completions`;
      }

      const pingRes = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${config.apiKey}`,
          'User-Agent': 'LifeOS-Validator',
        },
        body: JSON.stringify({
          model: config.model || 'deepseek-chat',
          messages: [{ role: 'user', content: 'LifeOS connection ping test. Please reply with "OK".' }],
          max_tokens: 10,
        }),
      });

      const latencyMs = Date.now() - startTime;

      if (pingRes.ok) {
        return res.json({
          ok: true,
          message: `DeepSeek API Key 验证成功！已成功连接 ${config.model}，随时可进行高速调用。`,
          provider: 'deepseek',
          model: config.model,
          latencyMs,
        });
      } else {
        const errorText = await pingRes.text();
        let errMsg = errorText;
        try {
          const j = JSON.parse(errorText);
          errMsg = j.error?.message || j.message || errorText;
        } catch (_) {}

        if (pingRes.status === 401) {
          errMsg = '无效的 DeepSeek API Key (401)，请核对是否从 platform.deepseek.com 完整复制。';
        } else if (pingRes.status === 402) {
          errMsg = 'DeepSeek 账户余额不足 (402)，请前往平台充值后重试。';
        } else if (pingRes.status === 429) {
          errMsg = '请求频率超限 (429)，请稍后重试。';
        }

        return res.status(400).json({
          ok: false,
          error: `DeepSeek 验证失败: ${errMsg}`,
          latencyMs,
        });
      }
    } catch (err: any) {
      console.error('DeepSeek Key Validate Error:', err);
      return res.status(400).json({
        ok: false,
        error: `连接 DeepSeek 异常: ${err.message || '网络超时或端点不可达'}`,
        latencyMs: Date.now() - startTime,
      });
    }
  }

  // Fallback: Gemini Validation
  try {
    const ai = new GoogleGenAI({
      apiKey: config.apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    const response = await ai.models.generateContent({
      model: config.model || 'gemini-3.7-flash',
      contents: 'LifeOS ping test. Please reply with "OK".',
    });

    const latencyMs = Date.now() - startTime;

    if (response && response.text) {
      return res.json({
        ok: true,
        message: `Gemini API Key 验证成功！已成功连接 ${config.model}，随时可进行高速调用。`,
        provider: 'gemini',
        model: config.model,
        latencyMs,
      });
    } else {
      return res.status(400).json({
        ok: false,
        error: '模型响应为空，请检查 API Key 权限。',
        latencyMs,
      });
    }
  } catch (err: any) {
    console.error('Gemini Key Validate Error:', err);
    let errorMessage = err.message || 'API Key 验证失败';
    if (errorMessage.includes('API_KEY_INVALID') || errorMessage.includes('invalid API key') || errorMessage.includes('400')) {
      errorMessage = '无效的 API Key，请核对是否从 Google AI Studio 完整复制。';
    } else if (errorMessage.includes('RESOURCE_EXHAUSTED') || errorMessage.includes('429')) {
      errorMessage = '该 API Key 配额已耗尽或请求频率超限，请稍后重试。';
    } else if (errorMessage.includes('PERMISSION_DENIED')) {
      errorMessage = '权限不足，请确认此 API Key 是否已开通 Gemini 相关模型权限。';
    } else if (errorMessage.includes('NOT_FOUND') || errorMessage.includes('404')) {
      errorMessage = `当前选择的模型 (${config.model}) 在您的 API Key 权限下不可用，建议切换到 gemini-2.5-flash。`;
    }
    return res.status(400).json({
      ok: false,
      error: errorMessage,
      latencyMs: Date.now() - startTime,
    });
  }
}

app.post('/api/ai/validate', handleValidate);
app.post('/api/gemini/validate', handleValidate); // Backwards compatibility

/**
 * ☀️ Day Mode Chat & Automatic Event/State/Ledger Extraction
 */
app.post('/api/chat/day', async (req, res) => {
  const { message, history = [], todayEvents = [], principles = [], goals = [] } = req.body;
  const config = resolveAiConfig(req);

  if (!message || typeof message !== 'string') {
    return res.status(400).json({ error: 'Message is required' });
  }

  const systemInstruction = `
你叫 LifeOS AI，是一个以用户为中心的个人生活操作系统核心智能体。
你的定位：一个非常懂用户、准确、具体、有温度的老板 / 运营 / 思考伙伴，而不是冷冰冰的数据库或机械的打卡机。

【用户的人生原则参考】
${principles.map((p: any) => `- ${p.statement}`).join('\n')}

【用户目前的核心目标】
${goals.map((g: any) => `- ${g.title} (成为: ${g.identity})`).join('\n')}

【白天模式的核心原则 (☀️ Day Mode)】
1. 接住：准确理解并共情当前的表达，无论是碎碎念、工作进展、情绪波动、花费开销、还是琐事。
2. 鼓励：具体指出做得好的地方，必须有证据（例如：“你今天虽然很焦虑，但还是完成了2小时直播，这说明情绪没有像过去那样完全接管行动”）。不要说苍白空洞的“你真棒”。
3. 看见：指出用户自己可能没注意到的微小变化、心理边界或成长。
4. 静默记账与事实提取：如果用户提到了任何与金钱相关的支出、收入、转账、采购、收款（如“妈妈给我100块”、“买咖啡35元”、“客户付定金298”、“买蜡烛原料花了145”），在后台提取为账本记录，不需要打扰用户。
5. 白天绝对不要做的事情：
   - 绝不要追问时间、追问时长、追问分类、要求确认！
   - 绝不要在白天突然生成长篇日结复盘或长篇大论的大道理！
   - 绝不要把日常琐事上纲上线成巨大人生哲学问题！
   - 语气保持：柔和、踏实、冷静、有力、不居高临下、像一个信赖的伙伴。

【输出要求】
必须以 JSON 格式输出，包含四部分：
{
  "reply": "你对用户的温暖、敏锐、简洁回应 (2-4句话即可，语气自然温柔有力量)",
  "events": [
    {
      "description": "事实描述（如'直播2小时'、'母亲转账100元'、'健身房力量训练'）",
      "area": "career | health | relationship | growth | creation | life",
      "category": "一级细分名称",
      "subcategory": "选填具体分类",
      "duration_display": "若提及则记录（如'2h'），未提及则填'未知'，绝不瞎猜",
      "amount": 数字或null,
      "confidence": 0.9,
      "interpretation": "选填，AI对该事件与目标/信念的微小关联注解"
    }
  ],
  "states": [
    {
      "primaryMood": "情绪/身心状态（如: '踏实', '焦虑', '疲惫', '有动力', '平静', '被触发', '空虚', '兴奋' 等）",
      "energyLevel": 1到5的数字,
      "contextDescription": "触发上下文"
    }
  ],
  "ledgers": [
    {
      "type": "expense | income | transfer | debt",
      "amount": 数字,
      "category": "分类名称 (如: 餐饮美食, 产品原料, 客户交付, 家庭支持, 日常采购, 学习成长等)",
      "description": "账目摘要",
      "paymentMethod": "微信支付 | 支付宝 | 银行卡 | 现金 (若未提及可默认微信支付)"
    }
  ]
}
`;

  // 1. If DeepSeek is chosen and key provided
  if (config.provider === 'deepseek' && config.apiKey) {
    try {
      const rawOutput = await callDeepSeekChat({
        apiKey: config.apiKey,
        model: config.model,
        baseUrl: config.baseUrl,
        systemInstruction,
        prompt: `用户刚才发来了一条日记/碎碎念：“${message}”。请分析并输出标准 JSON。`,
        jsonMode: true,
      });

      const parsed = safeParseJson(rawOutput, null);
      if (parsed && (parsed.reply || parsed.events || parsed.states || parsed.ledgers)) {
        return res.json({
          reply: parsed.reply || '我在认真听着。每一次诚实的记录都在让生活变得更踏实。',
          extractedEvents: parsed.events || [],
          extractedStates: parsed.states || [],
          extractedLedgers: parsed.ledgers || [],
        });
      }
    } catch (err: any) {
      console.error('DeepSeek Day Chat Error:', err);
    }
  }

  // 2. If Gemini client is available
  const ai = getGenAI(config.apiKey);
  if (ai) {
    try {
      const response = await ai.models.generateContent({
        model: config.model || 'gemini-3.7-flash',
        contents: [{ role: 'user', parts: [{ text: `用户输入: "${message}"` }] }],
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              reply: { type: Type.STRING, description: 'Warm, empathic and concise reply' },
              events: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    description: { type: Type.STRING },
                    area: {
                      type: Type.STRING,
                      enum: ['career', 'health', 'relationship', 'growth', 'creation', 'life'],
                    },
                    category: { type: Type.STRING },
                    subcategory: { type: Type.STRING },
                    duration_display: { type: Type.STRING },
                    amount: { type: Type.NUMBER },
                    confidence: { type: Type.NUMBER },
                    interpretation: { type: Type.STRING },
                  },
                  required: ['description', 'area', 'category', 'duration_display'],
                },
              },
              states: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    primaryMood: { type: Type.STRING },
                    energyLevel: { type: Type.NUMBER },
                    contextDescription: { type: Type.STRING },
                  },
                  required: ['primaryMood', 'energyLevel'],
                },
              },
              ledgers: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    type: { type: Type.STRING, enum: ['expense', 'income', 'transfer', 'debt'] },
                    amount: { type: Type.NUMBER },
                    category: { type: Type.STRING },
                    description: { type: Type.STRING },
                    paymentMethod: { type: Type.STRING },
                  },
                  required: ['type', 'amount', 'category', 'description'],
                },
              },
            },
            required: ['reply', 'events', 'states'],
          },
        },
      });

      const parsed = JSON.parse(response.text || '{}');
      return res.json({
        reply: parsed.reply,
        extractedEvents: parsed.events || [],
        extractedStates: parsed.states || [],
        extractedLedgers: parsed.ledgers || [],
      });
    } catch (err: any) {
      console.error('Gemini Day Chat Error:', err);
    }
  }

  // 3. Fallback rule-based engine
  const mockReply = generateFallbackDayResponse(message, goals);
  const mockExtraction = generateFallbackExtraction(message);
  return res.json({
    reply: mockReply,
    extractedEvents: mockExtraction.events,
    extractedStates: mockExtraction.states,
    extractedLedgers: mockExtraction.ledgers || [],
  });
});

/**
 * 🧠 AI Growth Mentor (成长导师 / 思维外脑 / 知识库对话分身)
 */
app.post('/api/mentor/chat', async (req, res) => {
  const {
    message,
    mode = 'reframe', // 'reframe' | 'brainstorm' | 'knowledge' | 'manifestation'
    history = [],
    phase,
    principles = [],
    goals = [],
    knowledgeItems = [],
    recentReviews = [],
  } = req.body;
  const config = resolveAiConfig(req);

  if (!message || typeof message !== 'string') {
    return res.status(400).json({ error: 'Message is required' });
  }

  const modeDescriptions: Record<string, string> = {
    reframe: '【深层信念解构与认知重构】：帮助用户看穿当前纠结/内耗背后的底层恐惧、隐藏假设、非黑即白思维或受害者脚本，提供第二序改变的重构视角。',
    brainstorm: '【外脑思维碰撞与商业/策略进化】：针对用户的自由职业商业模式、产品开发、现金流路径、运营与交付进行结构化推演与第一性原理推导。',
    knowledge: '【个人原则与知识库共鸣】：调取用户的核心原则库与沉淀的思维模型，将当下的困惑与过往沉淀的人生智慧进行对照，给出高浓度的洞察。',
    manifestation: '【显化与高维身份对话】：以“已经实现经济自主、自尊充盈、丰盛自由的未来分身”的视角，对当下的自己说话，打破稀缺感，唤醒丰盛信念。',
  };

  const systemInstruction = `
你叫 LifeOS「成长导师与外脑分身」(AI Growth Mentor & Outer Brain)。
你是用户的高维智慧分身、战略外脑与认知教练。
区别于白天模式只做安静倾听和记账，你的任务是：深度对话、思维碰撞、感悟提炼、原则共鸣与知识库活化。

【当前对话模式】：${modeDescriptions[mode] || modeDescriptions.reframe}

【用户的核心人生资产与背景】：
- 当前人生阶段: ${phase?.currentPhase || '经济自主重建期'} (主线任务: ${phase?.mainQuest || '建立稳定现金流 (5000+/月)'})
- 核心愿景与身份: ${goals.map((g: any) => `目标: ${g.title} | 成为: ${g.identity} | 信念: ${g.coreBelief}`).join('\n')}
- 用户的人生原则库 (Principles):
${principles.map((p: any) => `- ${p.statement} (底层逻辑: ${p.why || ''})`).join('\n')}
- 用户积累的个人知识库 (Knowledge Vault):
${knowledgeItems.map((k: any) => `[${k.title}]: ${k.content}`).join('\n')}

【导师对话原则】：
1. 见树更见林：不陷在鸡毛蒜皮的抱怨里，而是敏锐抓住背后的模式（Pattern）与深层信念（Belief）。
2. 精准而富有启发：运用苏格拉底提问法、第一性原理、第二序改变等认知框架，言之有物，直击痛点。
3. 调动知识库：适时引用用户的某条原则或过去日结中的顿悟，让用户感受到思维的累积与连续性。
4. 结构清晰有力量：语言要有智慧感、沉着、深邃，避免空洞鸡汤或机械说教，最后提炼出一句核心认知金句 (keyInsightSummary)。

【输出格式要求】：
请以标准 JSON 格式输出：
{
  "reply": "深入透彻的解答与研讨（分段清晰，富有启发性与框架感）",
  "keyInsightSummary": "提炼出的一句可被存入知识库的高浓度认知顿悟/思维模型金句",
  "suggestedActions": ["1-2个具体可执行的微小下一步"],
  "citedPrinciples": ["引用到的原则或知识条目名称"]
}
`;

  // 1. If DeepSeek is chosen
  if (config.provider === 'deepseek' && config.apiKey) {
    try {
      const rawOutput = await callDeepSeekChat({
        apiKey: config.apiKey,
        model: config.model,
        baseUrl: config.baseUrl,
        systemInstruction,
        prompt: `用户在【${mode}】模式下向你提问/探讨：“${message}”。请提供深度导师思考与结构化建议。`,
        jsonMode: true,
      });

      const parsed = safeParseJson(rawOutput, null);
      if (parsed && parsed.reply) {
        return res.json({
          reply: parsed.reply,
          keyInsightSummary: parsed.keyInsightSummary || '',
          suggestedActions: parsed.suggestedActions || [],
          citedPrinciples: parsed.citedPrinciples || [],
        });
      }
    } catch (err: any) {
      console.error('DeepSeek Mentor Chat Error:', err);
    }
  }

  // 2. If Gemini is available
  const ai = getGenAI(config.apiKey);
  if (ai) {
    try {
      const response = await ai.models.generateContent({
        model: config.model || 'gemini-3.7-flash',
        contents: [{ role: 'user', parts: [{ text: `模式: ${mode}\n用户探讨内容: "${message}"` }] }],
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              reply: { type: Type.STRING, description: 'Deep mentor response with insightful perspectives' },
              keyInsightSummary: { type: Type.STRING, description: 'One-sentence high-density cognitive insight' },
              suggestedActions: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              citedPrinciples: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
            },
            required: ['reply'],
          },
        },
      });

      const parsed = JSON.parse(response.text || '{}');
      return res.json({
        reply: parsed.reply,
        keyInsightSummary: parsed.keyInsightSummary || '',
        suggestedActions: parsed.suggestedActions || [],
        citedPrinciples: parsed.citedPrinciples || [],
      });
    } catch (err: any) {
      console.error('Gemini Mentor Chat Error:', err);
    }
  }

  // 3. Fallback Mentor Engine
  return res.json({
    reply: `我理解你所说的这个困惑。从你的核心原则来看，“不需要通过痛苦证明自己的价值”。

当我们感到被一件事卡住时，通常不是行动本身出了问题，而是我们在用【第一序改变】试图硬撑。
当你把注意力从“外界是否及时回应”或“短期是否立即见效”抽离出来，回到你能够完全控制的最小闭环上时，能量自然就会重新聚拢。

试着问自己：如果我此刻已经拥有了完全的经济自主和稳定的自尊，我会怎么做眼前的这个决定？`,
    keyInsightSummary: '焦虑往往源于用旧模式解决新问题；切换到第二序改变，重构自我的身份视角。',
    suggestedActions: [
      '停止在低能量状态下做重大决策或频繁确认外界反馈',
      '聚焦今天最微小的一件价值交付，重新建立身心掌控感',
    ],
    citedPrinciples: ['不需要通过痛苦证明自己的价值', '不让一个人、一件事吞掉整个人生'],
  });
});

/**
 * 🌙 Evening Mode: Generate 7-Part Structured Daily Review (日结复盘)
 */
app.post('/api/review/generate', async (req, res) => {
  const { date, events = [], states = [], rawNotes = [], goals = [], principles = [] } = req.body;
  const config = resolveAiConfig(req);

  const systemInstruction = `
你叫 LifeOS 的日结复盘智能体。在夜晚，帮助用户将今天发生的零散事实、情绪、行动与长期愿景进行整合。

【日结结构必须固定为以下 7 部分】：
① 今日发生 (eventsSummary): 纯事实列表，不要包含主观解释。
② 今日成功 (successes): 真实进步列表。重点：具体、有证据！例如“虽然关系情绪有波动，但依然完成了2小时直播工作”。
③ 今日感恩 (gratitudes): 从生活里真实发现的感恩瞬间（人、身体、机会、美好细节）。
④ 今日整合 (integrations): 把零碎的碎碎念与深层信念重新连接（例如：妈妈转账100元 -> 联想到家庭与负债 -> 联想到自我评价）。
⑤ 今日盲区 (blindSpots): 指出用户自己可能没有意识到的隐藏假设。必须使用“可能、似乎、值得观察”等温和推测词，严禁武断定性！
⑥ 目标与愿景连接 (goalConnections): 将今天的具体行动连接到用户的长远目标和“正在成为谁”的 Identity 证据。
⑦ 显化叙事 / 宇宙同步 (manifestationNarrative): 结合能量、同步性、积极象征与未来叙事的温暖总结。

【输入数据】
- 今日事件: ${JSON.stringify(events)}
- 今日状态: ${JSON.stringify(states)}
- 用户原声碎碎念: ${JSON.stringify(rawNotes)}
- 核心目标: ${JSON.stringify(goals.map((g: any) => ({ title: g.title, identity: g.identity, coreBelief: g.coreBelief })))}
- 人生原则: ${JSON.stringify(principles.map((p: any) => p.statement))}

【输出 JSON 格式】：
{
  "eventsSummary": ["..."],
  "successes": ["..."],
  "gratitudes": ["..."],
  "integrations": ["..."],
  "blindSpots": ["..."],
  "goalConnections": ["..."],
  "manifestationNarrative": "...",
  "innerCompassScore": 8.5,
  "compassObservation": "..."
}
`;

  // 1. If DeepSeek is chosen and key provided
  if (config.provider === 'deepseek' && config.apiKey) {
    try {
      const rawOutput = await callDeepSeekChat({
        apiKey: config.apiKey,
        model: config.model,
        baseUrl: config.baseUrl,
        systemInstruction,
        prompt: `请为日期 ${date} 生成完整的 7 部分日结复盘 JSON。`,
        jsonMode: true,
      });

      const parsed = safeParseJson(rawOutput, null);
      if (parsed && parsed.eventsSummary && parsed.successes) {
        return res.json(parsed);
      }
    } catch (err: any) {
      console.error('DeepSeek Review Error:', err);
    }
  }

  // 2. If Gemini is available
  const ai = getGenAI(config.apiKey);
  if (ai) {
    try {
      const response = await ai.models.generateContent({
        model: config.model || 'gemini-3.7-flash',
        contents: [{ role: 'user', parts: [{ text: `请为日期 ${date} 生成完整的日结复盘` }] }],
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              eventsSummary: { type: Type.ARRAY, items: { type: Type.STRING } },
              successes: { type: Type.ARRAY, items: { type: Type.STRING } },
              gratitudes: { type: Type.ARRAY, items: { type: Type.STRING } },
              integrations: { type: Type.ARRAY, items: { type: Type.STRING } },
              blindSpots: { type: Type.ARRAY, items: { type: Type.STRING } },
              goalConnections: { type: Type.ARRAY, items: { type: Type.STRING } },
              manifestationNarrative: { type: Type.STRING },
              innerCompassScore: { type: Type.NUMBER, description: 'Alignment rating 1-10' },
              compassObservation: { type: Type.STRING },
            },
            required: [
              'eventsSummary',
              'successes',
              'gratitudes',
              'integrations',
              'blindSpots',
              'goalConnections',
              'manifestationNarrative',
              'innerCompassScore',
              'compassObservation',
            ],
          },
        },
      });

      const parsed = JSON.parse(response.text || '{}');
      return res.json(parsed);
    } catch (err: any) {
      console.error('Gemini Review Error:', err);
    }
  }

  // 3. Fallback review
  const mockReview = generateFallbackReview(date, events, states, rawNotes, goals);
  return res.json(mockReview);
});

/**
 * 🧭 Synthesize / Evolve Life Principles from Daily Records & Mentor Dialogue
 */
app.post('/api/principles/synthesize', async (req, res) => {
  const { notes = [], events = [], states = [], currentPrinciples = [], mentorChat = [] } = req.body;
  const config = resolveAiConfig(req);

  const prompt = `
你叫 LifeOS AI 人生原则提炼导师。
请分析用户近期的日常记录、身心状态、行为事件、AI导师研讨以及已有人生原则，提炼并演化出 3-6 条高浓度、具备定海神针作用的【人生原则】。

【原则的定义与要求】：
1. 原则是应对不确定性、边界冲突、情绪内耗的底层决策准则（例如：“不需要通过痛苦证明自己的价值”、“不让一个人一件事吞掉整个人生”）。
2. 每条原则包含：
   - statement: 原则金句（简练、有力、有觉察）
   - category: 核心信念 | 边界管理 | 亲密关系 | 行动指南 | 财富金钱 | 身心自尊
   - why: 原则背后的底层逻辑与创伤/经验反思
   - suggestedAction: 日常践行指南

【输入素材】：
- 已有原则: ${JSON.stringify(currentPrinciples)}
- 近期碎碎念: ${JSON.stringify(notes.slice(0, 15))}
- 行为事件: ${JSON.stringify(events.slice(0, 15))}
- 导师对话摘要: ${JSON.stringify(mentorChat.slice(-6))}

请以标准 JSON 格式输出：
{
  "synthesizedPrinciples": [
    {
      "statement": "原则陈述",
      "category": "分类",
      "why": "底层逻辑与反思阐述",
      "suggestedAction": "践行建议"
    }
  ],
  "evolutionNotes": "本次原则演化的核心突破与认知跃迁概述"
}
`;

  // 1. DeepSeek
  if (config.provider === 'deepseek' && config.apiKey) {
    try {
      const raw = await callDeepSeekChat({
        apiKey: config.apiKey,
        model: config.model,
        baseUrl: config.baseUrl,
        prompt,
        jsonMode: true,
      });
      const parsed = safeParseJson(raw, null);
      if (parsed && parsed.synthesizedPrinciples) {
        return res.json(parsed);
      }
    } catch (e) {
      console.error('DeepSeek principle synthesize error:', e);
    }
  }

  // 2. Gemini
  const ai = getGenAI(config.apiKey);
  if (ai) {
    try {
      const response = await ai.models.generateContent({
        model: config.model || 'gemini-3.7-flash',
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: {
          responseMimeType: 'application/json',
        },
      });
      const parsed = safeParseJson(response.text || '{}', null);
      if (parsed && parsed.synthesizedPrinciples) {
        return res.json(parsed);
      }
    } catch (e) {
      console.error('Gemini principle synthesize error:', e);
    }
  }

  // 3. Fallback
  return res.json({
    synthesizedPrinciples: [
      {
        statement: '不需要通过痛苦证明自己的价值。',
        category: '核心信念',
        why: '过去的创伤容易让人把受苦误解为努力，真正的创造是顺畅且坚定的。',
        suggestedAction: '在焦虑驱动时暂停盲动，回归身体呼吸。',
      },
      {
        statement: '不让一个人、一件事吞掉整个人生。',
        category: '边界管理',
        why: '生活是由六大领域构成的丰盛整体，任何单点波动都不足以打翻全盘。',
        suggestedAction: '当某领域产生压力时，主动向身体或创造领域借力。',
      },
      {
        statement: '主动表达，但不负责两个人的关系。',
        category: '亲密关系',
        why: '我负责真实清晰地表达我的感受与需求，对方的回应属于对方的课题。',
        suggestedAction: '放下对即时反馈的强求，守好自尊边界。',
      },
      {
        statement: '金钱是诚实创造价值后的自然能量流动。',
        category: '财富金钱',
        why: '卸下对收费的内疚感与匮乏焦虑，把注意力放在高质量交付上。',
        suggestedAction: '认真做好每一次手作与咨询，坦然接受报酬。',
      },
    ],
    evolutionNotes: '正在从外部评价驱动转向内在自主， principles 逐渐聚焦于自尊稳固与业务交付。',
  });
});

/**
 * 🎯 Extract Goal Evidence, Real-world Actions, & Spiritual Manifestation from Daily Logs
 */
app.post('/api/goals/sync-insights', async (req, res) => {
  const { goal, events = [], rawNotes = [], states = [], patterns = [] } = req.body;
  const config = resolveAiConfig(req);

  const prompt = `
你叫 LifeOS 目标与显化智能分析体。
请针对用户设定的特定目标【${goal.title}】（类型: ${goal.type}, 身份: ${goal.identity || ''}），扫描并深度匹配用户近期的碎碎念、现实事件、身心状态以及长期轨迹。

【分析并提取以下几大部分】：
1. 现实证据与实际行动 (evidenceItems): 识别出哪些事实、交付、练习属于该目标的现实推进证据。
2. 灵性显化、信念与心理内容 (spiritualPractices):
   - 比如：做了仪式、点了蜡烛、给自己许愿了、视觉化了、肯定语 (Affirmations)、天使数字 (如 111, 777, 888)、宇宙同步性事件。
   - 心理学的核心信念模式的发现以及改变（例如：从“受苦证明努力”转变成“我值得丰盛”）。
3. 导师与长期轨迹专属洞见 (mentorInsights): 该目标在长期轨迹与心理循环中的关键启示。

【输入数据】：
- 目标详情: ${JSON.stringify(goal)}
- 近期事件: ${JSON.stringify(events.slice(0, 20))}
- 近期碎碎念: ${JSON.stringify(rawNotes.slice(0, 20))}
- 近期状态: ${JSON.stringify(states.slice(0, 15))}
- 长期模式: ${JSON.stringify(patterns.slice(0, 5))}

请以标准 JSON 输出：
{
  "evidenceItems": [
    {
      "text": "现实证据与具体行动描述",
      "date": "YYYY-MM-DD",
      "actionTaken": "执行的具体行动"
    }
  ],
  "spiritualPractices": [
    {
      "type": "ritual | candle | affirmation | angel_number | visualization | belief_shift | universe_synchronicity",
      "title": "灵性实践或信念转变标题",
      "detail": "详细描述（如点了金钱丰盛蜡烛、看到888天使数字、完成了丰盛视觉化等）",
      "date": "YYYY-MM-DD"
    }
  ],
  "mentorInsights": [
    "提炼的导师专属洞见"
  ],
  "suggestedProgressPercent": 75,
  "manifestationNarrative": "更新后的温暖显化叙事"
}
`;

  // 1. DeepSeek
  if (config.provider === 'deepseek' && config.apiKey) {
    try {
      const raw = await callDeepSeekChat({
        apiKey: config.apiKey,
        model: config.model,
        baseUrl: config.baseUrl,
        prompt,
        jsonMode: true,
      });
      const parsed = safeParseJson(raw, null);
      if (parsed && (parsed.evidenceItems || parsed.spiritualPractices)) {
        return res.json(parsed);
      }
    } catch (e) {
      console.error('DeepSeek goal sync error:', e);
    }
  }

  // 2. Gemini
  const ai = getGenAI(config.apiKey);
  if (ai) {
    try {
      const response = await ai.models.generateContent({
        model: config.model || 'gemini-3.7-flash',
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: {
          responseMimeType: 'application/json',
        },
      });
      const parsed = safeParseJson(response.text || '{}', null);
      if (parsed && (parsed.evidenceItems || parsed.spiritualPractices)) {
        return res.json(parsed);
      }
    } catch (e) {
      console.error('Gemini goal sync error:', e);
    }
  }

  // 3. Fallback
  return res.json({
    evidenceItems: [
      {
        text: '完成今日 2 小时专场直播与客户咨询互动，稳定输出业务',
        date: new Date().toISOString().split('T')[0],
        actionTaken: '直播交付',
      },
      {
        text: '完成定制草药魔法蜡烛产品制作与打包寄送',
        date: new Date().toISOString().split('T')[0],
        actionTaken: '产品闭环交付',
      },
    ],
    spiritualPractices: [
      {
        type: 'candle',
        title: '点燃丰盛仪式草药蜡烛',
        detail: '点燃天然大豆草药蜡烛，在香气中静心许愿，锚定自食其力的安全感。',
        date: new Date().toISOString().split('T')[0],
      },
      {
        type: 'affirmation',
        title: '每日核心肯定语',
        detail: '“我不需要通过痛苦证明自己的价值，财富是我创造价值的自然副产物。”',
        date: new Date().toISOString().split('T')[0],
      },
      {
        type: 'belief_shift',
        title: '核心信念模式升级',
        detail: '从过去的“为接受家庭资助感到羞愧自责”，转变为“允许爱流动，同时专注搭建属于自己的稳定现金流”。',
        date: new Date().toISOString().split('T')[0],
      },
      {
        type: 'angel_number',
        title: '天使数字共时性 888',
        detail: '在整理账本与订单时看到 888，象征丰盛之流正在顺畅汇聚。',
        date: new Date().toISOString().split('T')[0],
      },
    ],
    mentorInsights: [
      '微小现实行动的持续积累，正在从底层重构你的神经反应回路，彻底瓦解旧有的匮乏感。',
    ],
    suggestedProgressPercent: 78,
    manifestationNarrative: '正在从“危机与恐惧驱动”平稳转向“充盈与稳定创造”。你所付出的每一份专注与觉察，都在向宇宙发射清晰的丰盛信号。',
  });
});

/**
 * 📈 Trajectory & Recurring Pattern Discovery
 */
app.post('/api/patterns/analyze', async (req, res) => {
  const { allEvents = [], allStates = [], principles = [] } = req.body;
  const config = resolveAiConfig(req);

  const prompt = `
根据用户过去一段时间的事件和身心状态，深度分析其心理循环 (Patterns) 与长期轨迹变化 (Trajectory)。
严格区分：RAW EVENT -> STATE -> AI INTERPRETATION -> PATTERN -> INSIGHT。
发现用户身心与生活中的模式，例如：
1. 关系不确定性 -> 焦虑 -> 注意力被转移
2. 获得具体外部反馈 -> 行动力增强
3. 愿景清晰 -> 微小行动 -> 踏实感积累

事件集: ${JSON.stringify(allEvents.slice(0, 30))}
状态集: ${JSON.stringify(allStates.slice(0, 30))}
原则: ${JSON.stringify(principles)}

请输出标准 JSON 格式：
{
  "patterns": [
    {
      "title": "模式标题",
      "description": "详细描述",
      "triggerEvent": "触发诱因",
      "observedLoop": "观察到的心理循环",
      "shiftSuggested": "建设性行动建议",
      "lifeArea": "career | health | relationship | growth | creation | life",
      "trendStatus": "improving | stable | watch"
    }
  ],
  "trajectorySummary": "宏观长期轨迹总结",
  "areaBalanceAdvice": "六大领域精力分配建议"
}
`;

  // 1. DeepSeek
  if (config.provider === 'deepseek' && config.apiKey) {
    try {
      const rawOutput = await callDeepSeekChat({
        apiKey: config.apiKey,
        model: config.model,
        baseUrl: config.baseUrl,
        prompt,
        jsonMode: true,
      });

      const parsed = safeParseJson(rawOutput, null);
      if (parsed && parsed.patterns) {
        return res.json(parsed);
      }
    } catch (err: any) {
      console.error('DeepSeek Pattern Analyze Error:', err);
    }
  }

  // 2. Gemini
  const ai = getGenAI(config.apiKey);
  if (ai) {
    try {
      const response = await ai.models.generateContent({
        model: config.model || 'gemini-3.7-flash',
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              patterns: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    description: { type: Type.STRING },
                    triggerEvent: { type: Type.STRING },
                    observedLoop: { type: Type.STRING },
                    shiftSuggested: { type: Type.STRING },
                    lifeArea: {
                      type: Type.STRING,
                      enum: ['career', 'health', 'relationship', 'growth', 'creation', 'life'],
                    },
                    trendStatus: { type: Type.STRING, enum: ['improving', 'stable', 'watch'] },
                  },
                  required: ['title', 'description', 'triggerEvent', 'observedLoop', 'shiftSuggested', 'lifeArea', 'trendStatus'],
                },
              },
              trajectorySummary: { type: Type.STRING },
              areaBalanceAdvice: { type: Type.STRING },
            },
            required: ['patterns', 'trajectorySummary', 'areaBalanceAdvice'],
          },
        },
      });

      return res.json(JSON.parse(response.text || '{}'));
    } catch (err: any) {
      console.error('Pattern Analyze Error:', err);
    }
  }

  // 3. Fallback patterns
  return res.json({
    patterns: generateFallbackPatterns(),
    trajectorySummary: '正在从外部评价驱动转向内在愿景驱动，生活重心逐渐稳固在事业与身体的微小日常积累上。',
    areaBalanceAdvice: '事业与成长投入保持在健康比例，可适当增加身体恢复与深度休息时间。',
  });
});

// Helper Fallback Engines when API Key is pending or offline
function generateFallbackDayResponse(message: string, goals: any[]): string {
  const lower = message.toLowerCase();
  if (lower.includes('妈妈') || lower.includes('100') || lower.includes('钱') || lower.includes('转账')) {
    return '我听到了。那份难受很真实，往往不是因为钱本身，而是触碰到了深层对自我价值和家庭经济的敏感开关。你允许自己有这种感受，并且把它说出来，本身就是在为它松绑。';
  }
  if (lower.includes('没回') || lower.includes('男生') || lower.includes('微信') || lower.includes('烦')) {
    return '注意到了你的烦躁。但你可能没发现，这次你没有急着通过对方的即时回复去确认自己的价值，而是把焦点放回了自己这里。这已经是边界意识的进步。';
  }
  if (lower.includes('直播') || lower.includes('播了') || lower.includes('客户') || lower.includes('蜡烛') || lower.includes('单')) {
    return '即使今天可能有各种杂乱情绪，你依然把属于自己的业务稳稳完成了。这就是正在成为独立创造者的现实证据，给今天踏实的行动点赞。';
  }
  if (lower.includes('健身') || lower.includes('运动') || lower.includes('跑步') || lower.includes('拉伸')) {
    return '身体有动起来，整个人就会更落实在当下。做完之后整个人感觉踏实一些了吗？';
  }
  if (lower.includes('醒') || lower.includes('起床') || lower.includes('睡')) {
    return '收到。按照自己的身体节奏开启这一天，慢慢来，今天的生活就在眼前。';
  }
  return '我在认真听着。每一次诚实的表达，都在帮我们把碎片化的感受慢慢串联成清晰的生活轨迹。';
}

function generateFallbackExtraction(message: string): { events: any[]; states: any[]; ledgers: any[] } {
  const events: any[] = [];
  const states: any[] = [];
  const ledgers: any[] = [];

  const lower = message.toLowerCase();

  // Extract monetary numbers if mentioned e.g. "100块", "28元", "花了145", "收款298", "收了300"
  const moneyMatch = message.match(/(?:花了|付了|支出了|买了|用了|消费|早餐|午餐|晚餐|咖啡|原料|租金)\s*(\d+(?:\.\d+)?)\s*(?:元|块|rmb|¥)?/i) ||
                     message.match(/(\d+(?:\.\d+)?)\s*(?:元|块|rmb|¥)/i);
  
  const isIncome = message.includes('收入') || message.includes('收款') || message.includes('成交') || message.includes('付定金') || message.includes('到账') || message.includes('转账给我') || (message.includes('给我') && message.includes('100'));
  
  if (moneyMatch && parseFloat(moneyMatch[1])) {
    const num = parseFloat(moneyMatch[1]);
    if (isIncome) {
      ledgers.push({
        type: 'income',
        amount: num,
        category: message.includes('客户') || message.includes('咨询') || message.includes('蜡烛') ? '业务收入' : '家庭支持',
        description: message.length > 20 ? message.slice(0, 20) : message,
        paymentMethod: '微信支付',
      });
    } else {
      ledgers.push({
        type: 'expense',
        amount: num,
        category: message.includes('吃') || message.includes('咖啡') || message.includes('餐') ? '餐饮美食' : message.includes('原料') || message.includes('蜡烛') ? '手作原料' : '日常支出',
        description: message.length > 20 ? message.slice(0, 20) : message,
        paymentMethod: '微信支付',
      });
    }
  }

  if (message.includes('直播')) {
    const durMatch = message.match(/(\d+)\s*(小时|h|个钟)/i);
    events.push({
      description: durMatch ? `直播 ${durMatch[1]} 小时` : '直播业务',
      area: 'career',
      category: '业务执行',
      subcategory: '直播',
      duration_display: durMatch ? `${durMatch[1]}h` : '未知',
      confidence: 0.95,
      interpretation: '稳定现金流与表达能力的日常锻炼',
    });
    states.push({
      primaryMood: '有动力',
      energyLevel: 4,
      contextDescription: '完成直播交付',
    });
  }

  if (message.includes('蜡烛') || message.includes('客户') || message.includes('交付')) {
    events.push({
      description: '为客户制作蜡烛/产品交付',
      area: 'career',
      category: '客户交付',
      subcategory: '手工蜡烛',
      duration_display: '未知',
      confidence: 0.9,
      interpretation: '独立产品价值闭环的体现',
    });
  }

  if (message.includes('健身') || message.includes('运动') || message.includes('跑步')) {
    events.push({
      description: '健身房训练/身体锻炼',
      area: 'health',
      category: '力量与有氧',
      subcategory: '力量训练',
      duration_display: '未知',
      confidence: 0.9,
      interpretation: '身心能量基石积累',
    });
    states.push({
      primaryMood: '踏实',
      energyLevel: 4,
      contextDescription: '运动后身心充沛',
    });
  }

  if (message.includes('妈妈') && (message.includes('100') || message.includes('钱') || message.includes('转账'))) {
    events.push({
      description: '母亲转账100元',
      area: 'relationship',
      category: '家庭互动',
      subcategory: '父母',
      amount: 100,
      duration_display: '瞬时',
      confidence: 0.95,
      interpretation: '触发了关于家庭经济与自尊价值的情绪反射',
    });
    states.push({
      primaryMood: '被触发',
      energyLevel: 2,
      contextDescription: '接受家庭经济资助时的价值感冲突',
    });
    if (ledgers.length === 0) {
      ledgers.push({
        type: 'transfer',
        amount: 100,
        category: '家庭支持',
        description: '母亲转账',
        paymentMethod: '微信转账',
      });
    }
  }

  if (message.includes('没回') || message.includes('烦') || message.includes('男生')) {
    states.push({
      primaryMood: '焦虑',
      energyLevel: 2,
      contextDescription: '关系不确定性带来的注意力牵扯',
    });
  }

  if (events.length === 0) {
    events.push({
      description: message.length > 30 ? message.slice(0, 30) + '...' : message,
      area: 'life',
      category: '日常记录',
      duration_display: '未知',
      confidence: 0.8,
    });
  }

  return { events, states, ledgers };
}

function generateFallbackReview(date: string, events: any[], states: any[], rawNotes: any[], goals: any[]) {
  return {
    eventsSummary: [
      '完成了既定的事业交付与直播互动',
      '进行了身体运动锻炼，保持体能输入',
      '记录了关于人际与家庭互动的真实心理波动',
      '完成了当天的碎碎念与情绪梳理',
    ],
    successes: [
      '在面对情绪起伏（如关系不确定与金钱敏感触发）时，没有让情绪完全接管行动，依然完成了现实业务。',
      '主动将隐秘的不安表达出来，而不是压抑在心底，展现了对自我真实体验的接纳。',
      '身体训练与工作节奏保持了基本稳定，给生活打下了踏实的锚点。',
    ],
    gratitudes: [
      '感谢客户对手工蜡烛/产品的信任与支持，创造了真实的价值流动。',
      '感谢自己的身体在疲惫时依然愿意配合运动与呼吸。',
      '感谢生命中每一个微小的生活瞬间，让我一步步看清自己的真实渴望。',
    ],
    integrations: [
      '妈妈转账100元 -> 触碰到了过去的经济匮乏记忆 -> 产生“接受帮助即等于自己无能”的反射 -> 经过反思，开始理解爱与价值并不冲突。',
      '他人回复慢 -> 习惯性自我怀疑 -> 及时把注意力收回到手头创造中 -> 建立独立的情绪边界。',
    ],
    blindSpots: [
      '似乎潜意识中依然存在一种隐藏假设：“必须通过承受痛苦与高压，才能证明自己的独立价值”。值得持续观察并温柔放下。',
      '有时可能将对方的沉默等同于对自己的否定，其实对方的状态大概率只与对方自身有关。',
    ],
    goalConnections: [
      '今天的直播与产品制作，直接为【每月收入稳定达到5000+】提供了现实证据。',
      '情绪边界的每一次守住，都是在践行“我正在成为一个能够独立自我肯定的人”的 Identity。',
    ],
    manifestationNarrative:
      '正在从“危机与恐惧驱动”平稳转向“充盈与稳定创造”。你所付出的每一份专注与觉察，都在向宇宙发射清晰的信号：你已经准备好迎接丰盛与自由。',
    innerCompassScore: 8.5,
    compassObservation: '身心一致性较高：虽然存在情绪扰动，但行动是出于愿景的主动选择，而非恐惧逃避。',
  };
}

function generateFallbackPatterns(): any[] {
  return [
    {
      title: '关系不确定性 -> 注意力被转移',
      description: '当亲密对象回复延迟或态度不明确时，容易诱发背景焦虑，并下意识打乱正在进行的工作节奏。',
      triggerEvent: '未及时收到消息 / 暧昧对象态度模糊',
      observedLoop: '外界无回应 -> 自我怀疑 -> 频繁看手机 -> 工作中断 -> 懊恼',
      shiftSuggested: '将注意力锚定在身体感觉和当前创造物上，提醒自己：主动表达，但不负责两个人的关系。',
      lifeArea: 'relationship',
      trendStatus: 'improving',
    },
    {
      title: '接受亲近之人帮助 -> 触发价值感防御',
      description: '当家人提供微小金钱或关怀时，可能下意识联想到家庭沉重历史，并将接受帮助等同于自我失败。',
      triggerEvent: '父母转账 / 给予关怀',
      observedLoop: '收到资助 -> 羞耻/难受 -> 紧绷抵触 -> 责怪自己不够争气',
      shiftSuggested: '尝试将金钱视为纯粹的爱的流动，允许自己被爱，把精力集中在当下的现金流建设上。',
      lifeArea: 'relationship',
      trendStatus: 'watch',
    },
    {
      title: '微小具体交付 -> 迅速建立踏实感',
      description: '每当完成一个具体的蜡烛制作、播完一场直播或看完整篇文献，身心能量状态会迅速从虚浮转为踏实。',
      triggerEvent: '启动微小行动（制作一件产品 / 播完1场）',
      observedLoop: '启动困难/轻微抗拒 -> 专注投入 -> 交付完成 -> 踏实充盈 -> 自信上升',
      shiftSuggested: '继续降低启动阻力，不求完美，依靠微小行动的正反馈驱动生活。',
      lifeArea: 'career',
      trendStatus: 'improving',
    },
  ];
}

async function startServer() {
  // Mount Vite middleware in development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`LifeOS Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
