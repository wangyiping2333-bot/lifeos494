/**
 * Helper utilities for managing user-provided custom Gemini & DeepSeek API Keys & Models
 */

export type AiProvider = 'gemini' | 'deepseek';

const STORAGE_KEY_PROVIDER = 'lifeos_custom_ai_provider';
const STORAGE_KEY_GEMINI_KEY = 'lifeos_custom_gemini_api_key';
const STORAGE_KEY_GEMINI_MODEL = 'lifeos_custom_gemini_model';
const STORAGE_KEY_DEEPSEEK_KEY = 'lifeos_custom_deepseek_api_key';
const STORAGE_KEY_DEEPSEEK_MODEL = 'lifeos_custom_deepseek_model';
const STORAGE_KEY_DEEPSEEK_BASE_URL = 'lifeos_custom_deepseek_base_url';

export const GEMINI_MODELS = [
  {
    id: 'gemini-3.7-flash',
    name: 'Gemini 3.7 Flash',
    desc: '推荐：响应极快、推理敏锐、深度理解生活暗流',
    recommended: true,
  },
  {
    id: 'gemini-2.5-flash',
    name: 'Gemini 2.5 Flash',
    desc: '轻量高效，适合日常极速对话与事件提取',
  },
  {
    id: 'gemini-2.5-pro',
    name: 'Gemini 2.5 Pro',
    desc: '超强长文本推理，适合深度复杂日结与长期轨迹分析',
  },
];

export const DEEPSEEK_MODELS = [
  {
    id: 'deepseek-chat',
    name: 'DeepSeek-V3 (Chat)',
    desc: '推荐：通用对话、事实提取与日结复盘，响应迅速，极高性价比',
    recommended: true,
  },
  {
    id: 'deepseek-reasoner',
    name: 'DeepSeek-R1 (Reasoner)',
    desc: '深度思考模型：强大思维链 (CoT) 推理，深入挖掘生活隐藏假设与复杂模式',
  },
];

export const GeminiKeyManager = {
  getProvider(): AiProvider {
    if (typeof window === 'undefined') return 'gemini';
    return (localStorage.getItem(STORAGE_KEY_PROVIDER) as AiProvider) || 'gemini';
  },

  setProvider(provider: AiProvider): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEY_PROVIDER, provider);
  },

  getApiKey(provider?: AiProvider): string {
    if (typeof window === 'undefined') return '';
    const p = provider || this.getProvider();
    if (p === 'deepseek') {
      return localStorage.getItem(STORAGE_KEY_DEEPSEEK_KEY) || '';
    }
    return localStorage.getItem(STORAGE_KEY_GEMINI_KEY) || '';
  },

  setApiKey(key: string, provider?: AiProvider): void {
    if (typeof window === 'undefined') return;
    const p = provider || this.getProvider();
    const storageKey = p === 'deepseek' ? STORAGE_KEY_DEEPSEEK_KEY : STORAGE_KEY_GEMINI_KEY;
    if (!key || !key.trim()) {
      localStorage.removeItem(storageKey);
    } else {
      localStorage.setItem(storageKey, key.trim());
    }
  },

  clearApiKey(provider?: AiProvider): void {
    if (typeof window === 'undefined') return;
    const p = provider || this.getProvider();
    const storageKey = p === 'deepseek' ? STORAGE_KEY_DEEPSEEK_KEY : STORAGE_KEY_GEMINI_KEY;
    localStorage.removeItem(storageKey);
  },

  clearAllKeys(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(STORAGE_KEY_GEMINI_KEY);
    localStorage.removeItem(STORAGE_KEY_DEEPSEEK_KEY);
  },

  getModel(provider?: AiProvider): string {
    if (typeof window === 'undefined') return 'gemini-3.7-flash';
    const p = provider || this.getProvider();
    if (p === 'deepseek') {
      return localStorage.getItem(STORAGE_KEY_DEEPSEEK_MODEL) || 'deepseek-chat';
    }
    return localStorage.getItem(STORAGE_KEY_GEMINI_MODEL) || 'gemini-3.7-flash';
  },

  setModel(model: string, provider?: AiProvider): void {
    if (typeof window === 'undefined') return;
    const p = provider || this.getProvider();
    const storageKey = p === 'deepseek' ? STORAGE_KEY_DEEPSEEK_MODEL : STORAGE_KEY_GEMINI_MODEL;
    localStorage.setItem(storageKey, model);
  },

  getBaseUrl(provider?: AiProvider): string {
    if (typeof window === 'undefined') return 'https://api.deepseek.com';
    const p = provider || this.getProvider();
    if (p === 'deepseek') {
      return localStorage.getItem(STORAGE_KEY_DEEPSEEK_BASE_URL) || 'https://api.deepseek.com';
    }
    return '';
  },

  setBaseUrl(url: string, provider?: AiProvider): void {
    if (typeof window === 'undefined') return;
    const p = provider || this.getProvider();
    if (p === 'deepseek') {
      if (!url || !url.trim()) {
        localStorage.setItem(STORAGE_KEY_DEEPSEEK_BASE_URL, 'https://api.deepseek.com');
      } else {
        localStorage.setItem(STORAGE_KEY_DEEPSEEK_BASE_URL, url.trim().replace(/\/+$/, ''));
      }
    }
  },

  getApiHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    const provider = this.getProvider();
    const key = this.getApiKey(provider);
    const model = this.getModel(provider);
    const baseUrl = this.getBaseUrl(provider);

    headers['x-ai-provider'] = provider;
    if (key) {
      headers['x-ai-api-key'] = key;
      headers['x-gemini-api-key'] = key; // Backwards compatibility
    }
    if (model) {
      headers['x-ai-model'] = model;
      headers['x-gemini-model'] = model; // Backwards compatibility
    }
    if (baseUrl && provider === 'deepseek') {
      headers['x-ai-base-url'] = baseUrl;
    }

    return headers;
  },

  hasCustomKey(): boolean {
    const provider = this.getProvider();
    const key = this.getApiKey(provider);
    return Boolean(key && key.length > 5);
  },

  getActiveConfigInfo(): {
    provider: AiProvider;
    providerName: string;
    model: string;
    hasKey: boolean;
    label: string;
  } {
    const provider = this.getProvider();
    const key = this.getApiKey(provider);
    const model = this.getModel(provider);
    const hasKey = Boolean(key && key.length > 5);

    let providerName = 'Google Gemini';
    let modelName = model;

    if (provider === 'deepseek') {
      providerName = 'DeepSeek';
      const m = DEEPSEEK_MODELS.find((item) => item.id === model);
      modelName = m ? m.name : model;
    } else {
      const m = GEMINI_MODELS.find((item) => item.id === model);
      modelName = m ? m.name : model;
    }

    return {
      provider,
      providerName,
      model,
      hasKey,
      label: hasKey ? `${providerName} (${modelName})` : '默认环境',
    };
  },

  async validateKey(params: {
    provider: AiProvider;
    key: string;
    model?: string;
    baseUrl?: string;
  }): Promise<{
    success: boolean;
    message: string;
    latencyMs?: number;
  }> {
    const startTime = Date.now();
    try {
      const response = await fetch('/api/ai/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: params.provider,
          customApiKey: params.key.trim(),
          model: params.model,
          baseUrl: params.baseUrl,
        }),
      });

      const latencyMs = Date.now() - startTime;
      const data = await response.json();

      if (response.ok && data.ok) {
        return {
          success: true,
          message: data.message || `API Key 验证通过，已成功连通 ${params.provider} 智能引擎！`,
          latencyMs,
        };
      } else {
        return {
          success: false,
          message: data.error || data.message || '验证失败，请检查 API Key 是否正确或具有有效配额。',
          latencyMs,
        };
      }
    } catch (err: any) {
      return {
        success: false,
        message: err.message || '网络连接超时或服务器异常',
        latencyMs: Date.now() - startTime,
      };
    }
  },
};

// Aliases for compatibility
export const SUPPORTED_MODELS = GEMINI_MODELS;
export const AiKeyManager = GeminiKeyManager;
