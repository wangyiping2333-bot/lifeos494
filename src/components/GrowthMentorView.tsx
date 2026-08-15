import React, { useState, useRef, useEffect } from 'react';
import {
  Brain,
  Sparkles,
  Send,
  BookOpen,
  Compass,
  Lightbulb,
  Target,
  Plus,
  Tag,
  Bookmark,
  CheckCircle2,
  ArrowRight,
  HelpCircle,
  Copy,
  Check,
  Edit2,
  Trash2,
  Layers,
  ChevronRight,
  X,
  Shield,
  RefreshCw,
  MessageSquare,
  Wand2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import {
  DailyReview,
  Goal,
  KnowledgeItem,
  LifeEvent,
  MentorMessage,
  Principle,
  UserPhaseMeta,
} from '../types';
import { GeminiKeyManager } from '../lib/geminiKey';

interface GrowthMentorViewProps {
  userPhase?: UserPhaseMeta;
  principles?: Principle[];
  goals?: Goal[];
  knowledgeItems?: KnowledgeItem[];
  recentEvents?: LifeEvent[];
  recentStates?: any[];
  recentReviews?: DailyReview[];
  onAddKnowledgeItem?: (item: Omit<KnowledgeItem, 'id' | 'createdAt'>) => void;
  onUpdateKnowledgeItem?: (id: string, updates: Partial<KnowledgeItem>) => void;
  onDeleteKnowledgeItem?: (id: string) => void;
  onAddKnowledge?: (item: Omit<KnowledgeItem, 'id' | 'createdAt'>) => void;
  onDeleteKnowledge?: (id: string) => void;
  onAddPrinciple?: (principle: Principle) => void;
  onUpdatePrinciple?: (id: string, updates: Partial<Principle>) => void;
  onDeletePrinciple?: (id: string) => void;
}

export type MentorMode = 'reframe' | 'principles' | 'brainstorm' | 'knowledge' | 'manifestation';

const MENTOR_MODES: {
  id: MentorMode;
  label: string;
  emoji: string;
  desc: string;
  promptExamples: string[];
}[] = [
  {
    id: 'principles',
    label: '人生原则提炼与重塑',
    emoji: '🧭',
    desc: '基于日常碎碎念、复盘与对话，演化沉淀指导人生的核心原则（原则只能在此生成与更新）。',
    promptExamples: [
      '从我近期的生活与复盘中，提炼一条适合我当前阶段的新人生原则',
      '帮我审视现有人生原则，是否有需要升级或重塑的边界？',
      '针对我关于金钱与交付的焦虑，拟定一条定海神针式的核心原则',
    ],
  },
  {
    id: 'reframe',
    label: '深层信念解构',
    emoji: '🔍',
    desc: '剖析卡点背后的底层恐惧、隐藏假设与自我设限，引导第二序认知改变。',
    promptExamples: [
      '探讨我最近对金钱的内疚感和不配得感',
      '当对方没有及时回消息时，我为什么总产生自我怀疑？',
      '我发现我依然有通过“受苦”来证明努力的潜意识，如何解构？',
    ],
  },
  {
    id: 'brainstorm',
    label: '外脑商业与决策推演',
    emoji: '💡',
    desc: '自由职业商业模式推演、最小闭环设计、第一性原理与运营策略。',
    promptExamples: [
      '推演下个月手工蜡烛与占卜咨询的5000+月度交付组合策略',
      '如何把我的塔罗咨询和手工草药蜡烛做成更有复购与转化的产品线？',
      '探讨如何用结构化行动代替焦虑驱动的工作模式',
    ],
  },
  {
    id: 'knowledge',
    label: '原则与知识库共鸣',
    emoji: '📚',
    desc: '调取你的人生原则库与沉淀的思维模型，与当下的具体困惑进行对照启发。',
    promptExamples: [
      '对照我的原则“不让一个人一件事吞掉整个人生”，分析我当前的状态',
      '结合我的“第一序改变 vs 第二序改变”思维模型，给出突破建议',
      '从我的原则库中，找出解决当前注意力涣散的最底层视角',
    ],
  },
  {
    id: 'manifestation',
    label: '显化与高维身份对话',
    emoji: '🌌',
    desc: '与“已经实现自给自足、自尊充盈的未来自己”对话，打破稀缺，唤醒确信。',
    promptExamples: [
      '以“已经拥有稳定现金流与独立边界的我”的视角，对现在的我说几句话',
      '如何将“我是一个能够独立创造价值的手作践行者”的信念深深植入潜意识？',
      '如何看待当前经历的波动？这是宇宙在帮我锻造哪一部分能力？',
    ],
  },
];

export const GrowthMentorView: React.FC<GrowthMentorViewProps> = ({
  userPhase = {
    currentPhase: '经济自主重建期',
    mainQuest: '建立稳定现金流 (5000+/月)',
    keyRecentShift: '正在从外部评价驱动，向内部评价驱动转变',
    recentProgress: '即使关系产生波动，也越来越能够继续自己的生活',
  },
  principles = [],
  goals = [],
  knowledgeItems = [],
  recentEvents = [],
  recentStates = [],
  recentReviews = [],
  onAddKnowledgeItem,
  onUpdateKnowledgeItem,
  onDeleteKnowledgeItem,
  onAddKnowledge,
  onDeleteKnowledge,
  onAddPrinciple,
  onUpdatePrinciple,
  onDeletePrinciple,
}) => {
  const addKnowledge = onAddKnowledgeItem || onAddKnowledge || (() => {});
  const updateKnowledge = onUpdateKnowledgeItem || (() => {});
  const deleteKnowledge = onDeleteKnowledgeItem || onDeleteKnowledge || (() => {});

  const [activeMode, setActiveMode] = useState<MentorMode>('principles');
  const [inputText, setInputText] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [isSynthesizingPrinciples, setIsSynthesizingPrinciples] = useState(false);
  const [mobileTab, setMobileTab] = useState<'chat' | 'knowledge' | 'principles'>('chat');
  const [savedInsightMsgId, setSavedInsightMsgId] = useState<string | null>(null);
  const [adoptedPrincipleId, setAdoptedPrincipleId] = useState<string | null>(null);

  // Suggested principles generated in chat
  const [suggestedPrinciples, setSuggestedPrinciples] = useState<
    Array<{
      tempId: string;
      statement: string;
      why: string;
      category: string;
      action: 'add' | 'update';
      targetId?: string;
    }>
  >([]);

  // Knowledge Item creation/editing modal
  const [isKnowledgeModalOpen, setIsKnowledgeModalOpen] = useState(false);
  const [editingKnowledge, setEditingKnowledge] = useState<KnowledgeItem | null>(null);
  const [kTitle, setKTitle] = useState('');
  const [kContent, setKContent] = useState('');
  const [kCategory, setKCategory] = useState<KnowledgeItem['category']>('mental_model');
  const [kTags, setKTags] = useState('');

  // Messages in Mentor chat
  const [messages, setMessages] = useState<MentorMessage[]>([
    {
      id: 'mentor-init',
      role: 'assistant',
      content: `你好，我是你的 AI 成长导师与高维思维分身。

📌 **重要规则**：你的人生原则体系（Life Principles）由你的日常记录、复盘与我们之间的深度对话沉淀生成。人生原则只能通过与我在此对话生成、演化或修改。

我已深度同步了你的人生阶段（${userPhase?.currentPhase || '经济自主重建期'}）、主线目标、${principles?.length || 0} 条现有原则以及外脑知识库。

你可以点击下方「✨ 提炼演化新原则」或选择不同研讨模式，开启思维对话。`,
      timestamp: '10:00',
      date: new Date().toISOString().split('T')[0],
      mode: 'principles',
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isThinking]);

  const currentModeInfo = MENTOR_MODES.find((m) => m.id === activeMode) || MENTOR_MODES[0];

  // Send message to Mentor chat
  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || inputText;
    if (!text.trim() || isThinking) return;

    const userMsg: MentorMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
      date: new Date().toISOString().split('T')[0],
      mode: activeMode,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsThinking(true);

    try {
      const res = await fetch('/api/mentor/chat', {
        method: 'POST',
        headers: GeminiKeyManager.getApiHeaders(),
        body: JSON.stringify({
          message: text,
          mode: activeMode,
          history: messages.slice(-6),
          phase: userPhase,
          principles,
          goals,
          knowledgeItems,
          recentNotes: recentEvents.slice(0, 10).map((e) => `${e.date}: ${e.raw_note || e.description}`),
        }),
      });

      const data = await res.json();

      const assistantMsg: MentorMessage = {
        id: `mentor-ai-${Date.now()}`,
        role: 'assistant',
        content: data.reply || '我在思考这个问题的底层结构与原则映射...',
        timestamp: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
        date: new Date().toISOString().split('T')[0],
        mode: activeMode,
        keyInsightSummary: data.keyInsightSummary,
      };

      setMessages((prev) => [...prev, assistantMsg]);

      // If in principles mode, check if reply contains a principle proposal
      if (activeMode === 'principles' || text.includes('原则')) {
        detectAndProposePrinciples(data.reply, data.keyInsightSummary);
      }
    } catch (err) {
      console.error('Mentor chat error:', err);
      // Fallback
      setMessages((prev) => [
        ...prev,
        {
          id: `mentor-ai-${Date.now()}`,
          role: 'assistant',
          content: `从你的核心原则来看：“不需要通过痛苦证明自己的价值”。
当我们感到内耗或卡点时，往往是在用旧有的恐惧脚本应对新的成长。
试着问自己：如果我此刻已经拥有了完全的经济自主与稳定的自尊，我会怎么做眼前的这个决定？`,
          timestamp: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
          date: new Date().toISOString().split('T')[0],
          mode: activeMode,
          keyInsightSummary: '焦虑往往源于用旧模式解决新问题；重构自我的身份视角即可破局。',
        },
      ]);
    } finally {
      setIsThinking(false);
    }
  };

  // 1-Click Synthesize Life Principles from Recent Notes & Reviews
  const handleSynthesizePrinciples = async () => {
    setIsSynthesizingPrinciples(true);
    setActiveMode('principles');

    try {
      const recentNotes = recentEvents.map((e) => `${e.date}: ${e.raw_note || e.description}`).slice(0, 15);
      const recentReviewNotes = recentReviews
        .map((r) => `${r.date} 复盘: ${r.eventsSummary?.join('; ')} | 整合: ${r.integrations?.join('; ')}`)
        .slice(0, 10);

      const res = await fetch('/api/principles/synthesize', {
        method: 'POST',
        headers: GeminiKeyManager.getApiHeaders(),
        body: JSON.stringify({
          notes: [...recentNotes, ...recentReviewNotes],
          existingPrinciples: principles,
          userPhase,
          chatHistory: messages.slice(-5),
        }),
      });

      const data = await res.json();

      if (data && Array.isArray(data.newPrinciples) && data.newPrinciples.length > 0) {
        const proposed = data.newPrinciples.map((p: any) => ({
          tempId: `prop-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          statement: p.statement,
          why: p.why || '源自近期生活事件与复盘整合',
          category: p.category || '核心认知',
          action: 'add' as const,
        }));

        setSuggestedPrinciples((prev) => [...proposed, ...prev]);

        const synthesisMsg: MentorMessage = {
          id: `mentor-synth-${Date.now()}`,
          role: 'assistant',
          content: `✨ **原则演化提炼报告**\n\n根据你近期的 ${recentNotes.length} 条碎碎念、复盘记录与内在探索，我为你提炼了以下 **${data.newPrinciples.length} 条新的人生原则建议**。\n\n${data.narrative || '原则是定海神针，帮助你在关系与事业的日常波动中锚定自我。'}\n\n请在下方卡片中点击「✅ 采纳并写入核心人生原则库」以正式生效。`,
          timestamp: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
          date: new Date().toISOString().split('T')[0],
          mode: 'principles',
        };

        setMessages((prev) => [...prev, synthesisMsg]);
      } else {
        const msg: MentorMessage = {
          id: `mentor-synth-${Date.now()}`,
          role: 'assistant',
          content: `你目前沉淀的 ${principles.length} 条原则已经很好地覆盖了当前阶段。如果你有特定的困惑或新的觉察，可以直接发送消息，我们一起推演打磨新原则。`,
          timestamp: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
          date: new Date().toISOString().split('T')[0],
          mode: 'principles',
        };
        setMessages((prev) => [...prev, msg]);
      }
    } catch (e) {
      console.error('Failed to synthesize principles', e);
    } finally {
      setIsSynthesizingPrinciples(false);
    }
  };

  // Helper to extract principle from normal mentor messages
  const detectAndProposePrinciples = (reply: string, insight?: string) => {
    if (!reply) return;
    const match = reply.match(/[“"「]([^”"」]{6,35})[”"」]/);
    if (match && match[1] && (reply.includes('原则') || reply.includes('准则') || reply.includes('定海神针'))) {
      const statement = match[1];
      if (!principles.some((p) => p.statement === statement)) {
        setSuggestedPrinciples((prev) => [
          {
            tempId: `prop-${Date.now()}`,
            statement,
            why: insight || '由 AI 导师研讨对话提炼',
            category: '核心认知',
            action: 'add',
          },
          ...prev,
        ]);
      }
    }
  };

  // Adopt a proposed principle into real principles storage
  const handleAdoptPrinciple = (prop: {
    tempId: string;
    statement: string;
    why: string;
    category: string;
    action: 'add' | 'update';
    targetId?: string;
  }) => {
    if (onAddPrinciple) {
      const newPrinciple: Principle = {
        id: `pr-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        statement: prop.statement,
        why: prop.why,
        category: prop.category,
        createdAt: new Date().toISOString().split('T')[0],
      };
      onAddPrinciple(newPrinciple);
    }
    setAdoptedPrincipleId(prop.tempId);
    setSuggestedPrinciples((prev) => prev.filter((p) => p.tempId !== prop.tempId));
  };

  // 1-click Save Key Insight to Knowledge Vault
  const handleSaveInsightToKnowledge = (insight: string, msgId: string) => {
    if (!insight) return;
    addKnowledge({
      title: insight.length > 20 ? insight.slice(0, 20) + '...' : insight,
      content: insight,
      category: 'reflection',
      source: 'mentor_synthesis',
      tags: ['导师顿悟', activeMode],
    });
    setSavedInsightMsgId(msgId);
    setTimeout(() => setSavedInsightMsgId(null), 3000);
  };

  // Quote knowledge item to chat
  const handleQuoteKnowledge = (item: KnowledgeItem) => {
    setInputText(`【探讨知识条目: ${item.title}】\n结合这句：“${item.content}”，帮我分析一下：`);
    if (mobileTab !== 'chat') {
      setMobileTab('chat');
    }
  };

  // Quote principle to chat
  const handleQuotePrinciple = (p: Principle) => {
    setInputText(`【重塑/探讨原则: “${p.statement}”】\n结合近期的生活状态与复盘，帮我审视并演化这条原则：`);
    setActiveMode('principles');
    if (mobileTab !== 'chat') {
      setMobileTab('chat');
    }
  };

  // Open modal to add knowledge item
  const openCreateKnowledgeModal = () => {
    setEditingKnowledge(null);
    setKTitle('');
    setKContent('');
    setKCategory('mental_model');
    setKTags('思维模型, 原则');
    setIsKnowledgeModalOpen(true);
  };

  const openEditKnowledgeModal = (item: KnowledgeItem) => {
    setEditingKnowledge(item);
    setKTitle(item.title);
    setKContent(item.content);
    setKCategory(item.category);
    setKTags(item.tags.join(', '));
    setIsKnowledgeModalOpen(true);
  };

  const handleSaveKnowledgeForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!kTitle.trim() || !kContent.trim()) return;

    const tagsArr = kTags
      .split(/[,， ]+/)
      .map((t) => t.trim())
      .filter(Boolean);

    if (editingKnowledge) {
      updateKnowledge(editingKnowledge.id, {
        title: kTitle,
        content: kContent,
        category: kCategory,
        tags: tagsArr,
      });
    } else {
      addKnowledge({
        title: kTitle,
        content: kContent,
        category: kCategory,
        source: 'user_note',
        tags: tagsArr,
      });
    }

    setIsKnowledgeModalOpen(false);
    setEditingKnowledge(null);
  };

  return (
    <div className="max-w-7xl mx-auto px-2.5 sm:px-6 py-2.5 sm:py-6 space-y-3 sm:space-y-4">
      {/* Mobile Tab Switcher */}
      <div className="lg:hidden flex items-center bg-[#EAE3D5] p-0.5 rounded-xl border border-[#DCD4C6] gap-0.5 shadow-2xs">
        <button
          onClick={() => setMobileTab('chat')}
          className={`flex-1 py-1.5 px-1.5 rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1 transition-all ${
            mobileTab === 'chat'
              ? 'bg-white text-[#2E2A24] shadow-xs'
              : 'text-[#6E6659] active:text-[#2E2A24]'
          }`}
        >
          <Brain className="w-3.5 h-3.5 text-indigo-700" />
          <span>🧠 导师对话</span>
        </button>
        <button
          onClick={() => setMobileTab('principles')}
          className={`flex-1 py-1.5 px-1.5 rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1 transition-all ${
            mobileTab === 'principles'
              ? 'bg-white text-[#2E2A24] shadow-xs'
              : 'text-[#6E6659] active:text-[#2E2A24]'
          }`}
        >
          <Shield className="w-3.5 h-3.5 text-amber-700" />
          <span>🛡️ 原则库 ({principles.length})</span>
        </button>
        <button
          onClick={() => setMobileTab('knowledge')}
          className={`flex-1 py-1.5 px-1.5 rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1 transition-all ${
            mobileTab === 'knowledge'
              ? 'bg-white text-[#2E2A24] shadow-xs'
              : 'text-[#6E6659] active:text-[#2E2A24]'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5 text-amber-700" />
          <span>📚 外脑库 ({knowledgeItems.length})</span>
        </button>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-6 items-start">
        {/* Left 8 Cols: Dialogue & Cognitive Modes */}
        <div
          className={`lg:col-span-8 space-y-3 sm:space-y-4 ${
            mobileTab === 'chat' ? 'block' : 'hidden lg:block'
          }`}
        >
          {/* Top Banner: Cognitive Modes & 1-Click Synthesize Principles */}
          <div className="p-3 sm:p-5 rounded-xl sm:rounded-2xl bg-gradient-to-r from-[#2E2A24] to-[#433D35] text-[#FAF8F5] shadow-xs space-y-2.5 sm:space-y-3.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div className="flex items-center gap-2 sm:gap-2.5">
                <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-amber-400/20 text-amber-300 flex items-center justify-center shrink-0 border border-amber-400/30">
                  <Brain className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div>
                  <h2 className="text-xs sm:text-base font-semibold text-[#FAF8F5] flex items-center gap-1.5">
                    <span>AI 成长导师 · 认知外脑</span>
                    <span className="text-[9px] sm:text-[10px] font-mono font-normal px-1.5 py-0.2 rounded bg-white/10 text-amber-300">
                      高维视角
                    </span>
                  </h2>
                  <p className="text-[10px] sm:text-xs text-[#D8D1C5] mt-0.5">
                    {currentModeInfo.desc}
                  </p>
                </div>
              </div>

              {/* 1-Click Synthesize Principles Button */}
              <button
                onClick={handleSynthesizePrinciples}
                disabled={isSynthesizingPrinciples}
                className="px-2.5 py-1.5 sm:px-3.5 sm:py-2 rounded-lg sm:rounded-xl bg-amber-400/20 hover:bg-amber-400/30 text-amber-200 border border-amber-400/40 text-[11px] sm:text-xs font-semibold flex items-center justify-center gap-1 transition-all shadow-xs shrink-0 self-start sm:self-auto"
              >
                {isSynthesizingPrinciples ? (
                  <RefreshCw className="w-3 h-3 animate-spin" />
                ) : (
                  <Sparkles className="w-3 h-3 text-amber-300" />
                )}
                <span>提炼演化原则</span>
              </button>
            </div>

            {/* Mode Switcher Buttons */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 pt-0.5">
              {MENTOR_MODES.map((mode) => {
                const isActive = activeMode === mode.id;
                return (
                  <button
                    key={mode.id}
                    onClick={() => setActiveMode(mode.id)}
                    className={`p-1.5 sm:p-2 rounded-lg sm:rounded-xl text-left transition-all border ${
                      isActive
                        ? 'bg-[#FAF8F5] text-[#2E2A24] border-amber-300 shadow-xs font-semibold'
                        : 'bg-white/10 text-[#D8D1C5] border-white/10 hover:bg-white/15'
                    }`}
                  >
                    <div className="flex items-center gap-1 text-[10px] sm:text-xs">
                      <span>{mode.emoji}</span>
                      <span className="truncate">{mode.label}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* AI Principle Proposal Action Cards */}
          {suggestedPrinciples.length > 0 && (
            <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-amber-50 border-2 border-amber-300/90 shadow-md space-y-2 sm:space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-950 flex items-center gap-1">
                  <Shield className="w-3.5 h-3.5 text-amber-700" />
                  <span>✨ 提炼原则提案 ({suggestedPrinciples.length})</span>
                </span>
                <span className="text-[10px] text-amber-800">
                  点击采纳同步至核心原则库
                </span>
              </div>

              <div className="space-y-2">
                {suggestedPrinciples.map((prop) => (
                  <div
                    key={prop.tempId}
                    className="p-2.5 sm:p-3.5 rounded-xl bg-white border border-amber-200 text-xs space-y-1.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-0.5">
                        <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-amber-100 text-amber-900 font-semibold">
                          {prop.category}
                        </span>
                        <h4 className="font-bold text-xs sm:text-sm text-[#2E2A24]">
                          "{prop.statement}"
                        </h4>
                        <p className="text-[11px] sm:text-xs text-[#6B6457]">{prop.why}</p>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => handleAdoptPrinciple(prop)}
                          className="px-2.5 py-1 rounded-lg bg-[#2E2A24] hover:bg-[#433D35] text-white text-[11px] sm:text-xs font-semibold flex items-center gap-1 shadow-xs"
                        >
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span>采纳</span>
                        </button>
                        <button
                          onClick={() =>
                            setSuggestedPrinciples((prev) =>
                              prev.filter((p) => p.tempId !== prop.tempId)
                            )
                          }
                          className="p-1 text-[#8C8477] hover:text-rose-600 rounded-lg"
                          title="忽略"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Chat Container */}
          <div className="bg-[#FAF8F5] border border-[#E9E4DC] rounded-xl sm:rounded-2xl p-2.5 sm:p-5 shadow-xs flex flex-col h-[420px] sm:h-[520px]">
            {/* Scrollable messages */}
            <div className="flex-1 overflow-y-auto space-y-3 sm:space-y-4 pr-1 scrollbar-thin">
              {messages.map((msg) => {
                const isAI = msg.role === 'assistant';
                return (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${isAI ? 'justify-start' : 'justify-end'}`}
                  >
                    <div
                      className={`max-w-[94%] sm:max-w-[84%] rounded-xl sm:rounded-2xl p-2.5 sm:p-4 text-xs sm:text-sm leading-relaxed space-y-1.5 ${
                        isAI
                          ? 'bg-[#F2EDE4] text-[#2E2A24] rounded-bl-xs border border-[#E5DFD4]'
                          : 'bg-[#2E2A24] text-[#FAF8F5] rounded-br-xs'
                      }`}
                    >
                      {isAI && (
                        <div className="flex items-center justify-between gap-1.5 pb-1 border-b border-[#E3DDD1] text-[11px] sm:text-xs text-[#7A7264] font-medium">
                          <div className="flex items-center gap-1">
                            <Sparkles className="w-3 h-3 text-amber-600" />
                            <span>
                              导师 · {MENTOR_MODES.find((m) => m.id === msg.mode)?.label || '深度思维'}
                            </span>
                          </div>
                          <span className="text-[9px] sm:text-[10px] font-mono text-[#A69E90]">
                            {msg.timestamp}
                          </span>
                        </div>
                      )}

                      <div className="whitespace-pre-wrap leading-relaxed">{msg.content}</div>

                      {/* Key Insight */}
                      {msg.keyInsightSummary && (
                        <div className="mt-2 p-2 rounded-lg sm:rounded-xl bg-amber-100/70 border border-amber-300 text-amber-950 text-xs space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold flex items-center gap-1 text-[10px] sm:text-xs text-amber-900">
                              <Lightbulb className="w-3 h-3 text-amber-700" />
                              <span>提炼核心认知：</span>
                            </span>
                            <button
                              onClick={() =>
                                handleSaveInsightToKnowledge(msg.keyInsightSummary!, msg.id)
                              }
                              className="inline-flex items-center gap-1 text-[9px] sm:text-[10px] px-1.5 py-0.5 rounded bg-amber-200/80 hover:bg-amber-300 text-amber-950 font-medium transition-colors"
                            >
                              {savedInsightMsgId === msg.id ? (
                                <>
                                  <Check className="w-2.5 h-2.5 text-emerald-700" />
                                  <span>已存入</span>
                                </>
                              ) : (
                                <>
                                  <Bookmark className="w-2.5 h-2.5 text-amber-800" />
                                  <span>存入知识库</span>
                                </>
                              )}
                            </button>
                          </div>
                          <p className="italic text-[10px] sm:text-xs text-amber-900 font-serif">
                            “{msg.keyInsightSummary}”
                          </p>
                        </div>
                      )}

                      {!isAI && (
                        <div className="text-[9px] text-[#D0C8BC] font-mono text-right">
                          {msg.timestamp}
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}

              {isThinking && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex justify-start"
                >
                  <div className="bg-[#F2EDE4] text-[#70695D] rounded-xl p-2.5 text-xs flex items-center gap-1.5 border border-[#E5DFD4]">
                    <Sparkles className="w-3 h-3 text-amber-600 animate-spin" />
                    <span>正在推演深层认知模型...</span>
                  </div>
                </motion.div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Topic Chips according to mode */}
            <div className="pt-2 pb-1.5 flex items-center gap-1 overflow-x-auto no-scrollbar border-t border-[#EBE6DC] mt-1.5">
              <span className="text-[10px] text-[#8C8477] whitespace-nowrap">
                研讨:
              </span>
              {currentModeInfo.promptExamples.map((chip, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(chip)}
                  disabled={isThinking}
                  className="text-[10px] whitespace-nowrap px-2 py-0.5 rounded-full bg-[#EFEAE0] hover:bg-[#E5DFD2] text-[#4A443B] border border-[#E3DDD0] transition-colors"
                >
                  {chip.length > 16 ? chip.slice(0, 16) + '...' : chip}
                </button>
              ))}
            </div>

            {/* Input Box */}
            <div className="relative mt-1">
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder={`在【${currentModeInfo.label}】模式下探讨思考、演化原则...`}
                rows={2}
                className="w-full resize-none rounded-xl bg-[#F7F4EE] border border-[#DDD6C8] focus:border-[#2E2A24] focus:bg-[#FAF8F5] focus:outline-none p-2.5 sm:p-3 text-xs sm:text-sm text-[#2E2A24] placeholder-[#A0988A] transition-all pr-16 sm:pr-22"
              />

              <div className="absolute right-1.5 sm:right-2.5 bottom-2 sm:bottom-2.5 flex items-center gap-1">
                <button
                  onClick={() => handleSendMessage()}
                  disabled={!inputText.trim() || isThinking}
                  className="px-2.5 py-1.5 sm:px-3.5 sm:py-2 rounded-lg bg-[#2E2A24] hover:bg-[#433D35] disabled:opacity-40 text-[#FAF8F5] text-xs font-medium flex items-center gap-1 transition-all shadow-xs"
                >
                  <span>探讨</span>
                  <Send className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right 4 Cols: Principles Vault & Knowledge Vault */}
        <div
          className={`lg:col-span-4 space-y-4 ${
            mobileTab === 'chat' ? 'hidden lg:block' : 'block'
          }`}
        >
          {/* Life Principles Vault (只能在此对话研讨与演化) */}
          <div
            className={`bg-[#FAF8F5] border border-[#E9E4DC] rounded-2xl p-4 sm:p-5 shadow-xs space-y-3.5 ${
              mobileTab === 'knowledge' ? 'hidden lg:block' : 'block'
            }`}
          >
            <div className="flex items-center justify-between pb-2 border-b border-[#F0EBE2]">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-amber-700" />
                <h3 className="text-xs sm:text-sm font-semibold text-[#2E2A24]">
                  人生原则体系 ({principles.length})
                </h3>
              </div>
              <span className="text-[10px] text-[#8C8477]">仅限导师对话演化</span>
            </div>

            <p className="text-[11px] text-[#7A7264] leading-relaxed">
              原则由日常记录与对话演化生成。点击任一原则可直接与导师研讨重塑。
            </p>

            <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
              {principles.map((p) => (
                <div
                  key={p.id}
                  onClick={() => handleQuotePrinciple(p)}
                  className="p-3 rounded-xl bg-[#F6F2EA] border border-[#E8E2D6] hover:border-amber-400 cursor-pointer transition-all space-y-1.5 group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#EAE3D6] text-[#696153]">
                      {p.category}
                    </span>
                    <span className="text-[10px] text-amber-800 opacity-0 group-hover:opacity-100 transition-opacity font-medium">
                      点击研讨重塑 ➔
                    </span>
                  </div>
                  <h4 className="font-semibold text-xs text-[#2E2A24] leading-snug">
                    "{p.statement}"
                  </h4>
                  <p className="text-[11px] text-[#70685B] leading-relaxed">{p.why}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Knowledge Items Card */}
          <div
            className={`bg-[#FAF8F5] border border-[#E9E4DC] rounded-2xl p-4 sm:p-5 shadow-xs space-y-3.5 ${
              mobileTab === 'principles' ? 'hidden lg:block' : 'block'
            }`}
          >
            <div className="flex items-center justify-between pb-2 border-b border-[#F0EBE2]">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-amber-700" />
                <h3 className="text-xs sm:text-sm font-semibold text-[#2E2A24]">
                  外脑知识库 ({knowledgeItems.length})
                </h3>
              </div>
              <button
                onClick={openCreateKnowledgeModal}
                className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-[#2E2A24] hover:bg-[#433D35] text-white transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>记条感悟</span>
              </button>
            </div>

            <div className="space-y-2.5 max-h-[320px] overflow-y-auto pr-1">
              {knowledgeItems.map((item) => (
                <div
                  key={item.id}
                  className="p-3 rounded-xl bg-[#F6F2EA] border border-[#E8E2D6] hover:border-[#D5CDC0] transition-colors space-y-1.5 group"
                >
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-semibold text-xs text-[#2E2A24] line-clamp-1">
                      {item.title}
                    </h4>
                    <div className="flex items-center gap-1 opacity-90 sm:opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                      <button
                        onClick={() => openEditKnowledgeModal(item)}
                        className="p-1 text-[#7A7264] hover:text-[#2E2A24] rounded"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`确定删除“${item.title}”知识条目吗？`)) {
                            deleteKnowledge(item.id);
                          }
                        }}
                        className="p-1 text-[#9C9487] hover:text-rose-600 rounded"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-[#524B41] leading-relaxed line-clamp-2 font-serif">
                    {item.content}
                  </p>

                  <div className="flex items-center justify-between pt-1 border-t border-[#EAE3D6] text-[10px]">
                    <div className="flex flex-wrap gap-1">
                      {item.tags.slice(0, 2).map((t, idx) => (
                        <span
                          key={idx}
                          className="px-1.5 py-0.2 rounded bg-[#E8E1D2] text-[#635B4E]"
                        >
                          #{t}
                        </span>
                      ))}
                    </div>

                    <button
                      onClick={() => handleQuoteKnowledge(item)}
                      className="inline-flex items-center gap-0.5 text-amber-800 hover:text-amber-950 font-medium"
                    >
                      <span>引用探讨</span>
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Add / Edit Knowledge Modal */}
      <AnimatePresence>
        {isKnowledgeModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/40 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-[#FAF8F5] rounded-2xl border border-[#E5DFD3] shadow-xl w-full max-w-md p-5 space-y-4 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between pb-3 border-b border-[#F0EBE2]">
                <h3 className="font-semibold text-[#2E2A24] flex items-center gap-2 text-sm sm:text-base">
                  <BookOpen className="w-4 h-4 text-amber-700" />
                  <span>{editingKnowledge ? '编辑知识条目' : '新增外脑感悟 / 知识'}</span>
                </h3>
                <button
                  onClick={() => setIsKnowledgeModalOpen(false)}
                  className="p-1 text-[#8C8477] hover:text-[#2E2A24] rounded-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveKnowledgeForm} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-medium text-[#5E584F] mb-1">
                    标题 / 核心命题 *
                  </label>
                  <input
                    type="text"
                    required
                    value={kTitle}
                    onChange={(e) => setKTitle(e.target.value)}
                    placeholder="如：第二序改变模型、金钱流动的能量视角"
                    className="w-full px-3 py-2 rounded-xl bg-[#F7F4EE] border border-[#DDD6C8] text-xs sm:text-sm text-[#2E2A24] focus:outline-none focus:border-[#2E2A24]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#5E584F] mb-1">
                    分类
                  </label>
                  <select
                    value={kCategory}
                    onChange={(e) => setKCategory(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-[#F7F4EE] border border-[#DDD6C8] text-xs text-[#2E2A24] focus:outline-none focus:border-[#2E2A24]"
                  >
                    <option value="mental_model">🧠 思维模型 (Mental Model)</option>
                    <option value="principle">🧭 人生原则 (Principle)</option>
                    <option value="strategy">🎯 商业与行动策略 (Strategy)</option>
                    <option value="belief">✨ 深层信念与显化 (Belief)</option>
                    <option value="reflection">💡 复盘顿悟 (Reflection)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#5E584F] mb-1">
                    沉淀内容 / 启发阐释 *
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={kContent}
                    onChange={(e) => setKContent(e.target.value)}
                    placeholder="详细记录你的认知重构、底层逻辑或推演心得..."
                    className="w-full px-3 py-2 rounded-xl bg-[#F7F4EE] border border-[#DDD6C8] text-xs sm:text-sm text-[#2E2A24] focus:outline-none focus:border-[#2E2A24]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#5E584F] mb-1">
                    标签 (逗号分隔)
                  </label>
                  <input
                    type="text"
                    value={kTags}
                    onChange={(e) => setKTags(e.target.value)}
                    placeholder="如：金钱观, 情绪管理, 第一性原理"
                    className="w-full px-3 py-1.5 rounded-xl bg-[#F7F4EE] border border-[#DDD6C8] text-xs text-[#2E2A24] focus:outline-none focus:border-[#2E2A24]"
                  />
                </div>

                <div className="pt-3 border-t border-[#F0EBE2] flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsKnowledgeModalOpen(false)}
                    className="px-3.5 py-2 rounded-xl text-xs text-[#70695D] hover:bg-[#EBE5DA] transition-colors"
                  >
                    取消
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-[#2E2A24] hover:bg-[#433D35] text-white text-xs font-medium transition-colors shadow-xs"
                  >
                    保存知识条目
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
