import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Sparkles,
  Mic,
  MicOff,
  Sun,
  Flame,
  ArrowRight,
  Clock,
  Tag,
  Smile,
  Heart,
  Plus,
  Compass,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Edit2,
  Trash2,
  X,
  Layers,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ChatMessage,
  Goal,
  LifeArea,
  LIFE_AREAS,
  LifeEvent,
  LifeState,
  Principle,
  TodayFocusItem,
} from '../types';
import { GeminiKeyManager } from '../lib/geminiKey';
import { TodayFocusStickyNote } from './TodayFocusStickyNote';

interface DayModeViewProps {
  events: LifeEvent[];
  states: LifeState[];
  focusItems?: TodayFocusItem[];
  goals: Goal[];
  principles: Principle[];
  onAddEvent: (event: Omit<LifeEvent, 'id'>) => void;
  onUpdateEvent?: (id: string, updates: Partial<LifeEvent>) => void;
  onDeleteEvent?: (id: string) => void;
  onAddState: (state: Omit<LifeState, 'id'>) => void;
  onUpdateState?: (id: string, updates: Partial<LifeState>) => void;
  onDeleteState?: (id: string) => void;
  onAddFocusItem?: (text: string) => void;
  onToggleFocusItem?: (id: string) => void;
  onDeleteFocusItem?: (id: string) => void;
  onUpdateFocusItem?: (id: string, text: string) => void;
  onGoToReview: () => void;
}

const SAMPLE_CHIPS = [
  '今天下午播了两个小时，然后给客户做了一个手作蜡烛',
  '给客户做完咨询后感觉能量很充沛，很有价值感',
  '刚刚去健身房练了腿，挺累但心里很踏实',
  '突然有一阵焦虑，但深呼吸后允许它待了一会儿',
  '给自己的愿景点了蜡烛，做了10分钟未来视觉化显化',
  '把拖延两天的方案写完了，专注的感觉真好',
];

export const DayModeView: React.FC<DayModeViewProps> = ({
  events,
  states,
  focusItems = [],
  goals,
  principles,
  onAddEvent,
  onUpdateEvent,
  onDeleteEvent,
  onAddState,
  onUpdateState,
  onDeleteState,
  onAddFocusItem = () => {},
  onToggleFocusItem = () => {},
  onDeleteFocusItem = () => {},
  onUpdateFocusItem = () => {},
  onGoToReview,
}) => {
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(true);
  const [mobileTab, setMobileTab] = useState<'chat' | 'records'>('chat');

  // Edit Modals
  const [editingEvent, setEditingEvent] = useState<LifeEvent | null>(null);

  // Chat message stream
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-init',
      role: 'assistant',
      content:
        '今天过得怎么样？随时在这里碎碎念、讲事情、讲情绪或工作。你只管真实表达，生活事实与身心状态我都会为你静默梳理，随时可查看和编辑。',
      timestamp: '10:00',
      date: new Date().toISOString().split('T')[0],
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // Filter today's events and states
  const todayStr = new Date().toISOString().split('T')[0];
  const todayEvents = events.filter((e) => e.date === todayStr);
  const todayStates = states.filter((s) => s.date === todayStr);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isSending]);

  // Speech Recognition setup
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recog = new SpeechRecognition();
      recog.continuous = false;
      recog.interimResults = false;
      recog.lang = 'zh-CN';
      recog.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInputText((prev) => (prev ? `${prev} ${transcript}` : transcript));
        setIsListening(false);
      };
      recog.onerror = () => {
        setIsListening(false);
      };
      recog.onend = () => {
        setIsListening(false);
      };
      recognitionRef.current = recog;
    } else {
      setSpeechSupported(false);
    }
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      // Fallback simulated voice note
      setInputText('今天下午播了两个小时，给客户做了蜡烛，收到咨询费298元');
      return;
    }
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch {
        setIsListening(false);
      }
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || inputText;
    if (!text.trim() || isSending) return;

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
      date: todayStr,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsSending(true);

    try {
      const response = await fetch('/api/chat/day', {
        method: 'POST',
        headers: GeminiKeyManager.getApiHeaders(),
        body: JSON.stringify({
          message: text,
          history: messages.slice(-6),
          todayEvents,
          principles,
          goals,
        }),
      });

      const data = await response.json();

      // 1. Background silent ingestion of events
      if (data.extractedEvents && Array.isArray(data.extractedEvents)) {
        data.extractedEvents.forEach((ev: any) => {
          onAddEvent({
            date: todayStr,
            description: ev.description,
            area: (ev.area as LifeArea) || 'life',
            category: ev.category || '日常',
            subcategory: ev.subcategory,
            duration_display: ev.duration_display || '未知',
            amount: ev.amount,
            raw_note: text,
            confidence: ev.confidence || 0.9,
            status: ev.duration_display === '未知' ? 'needs_time_confirm' : 'confirmed',
            interpretation: ev.interpretation,
          });
        });
      }

      // 2. Background silent ingestion of states
      if (data.extractedStates && Array.isArray(data.extractedStates)) {
        data.extractedStates.forEach((st: any) => {
          onAddState({
            date: todayStr,
            timestamp: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
            primaryMood: st.primaryMood || '平静',
            energyLevel: st.energyLevel || 3,
            contextDescription: st.contextDescription || text,
            rawNote: text,
          });
        });
      }

      const assistantMsg: ChatMessage = {
        id: `msg-ai-${Date.now()}`,
        role: 'assistant',
        content: data.reply || '我在听，这些真实感受与行动已经在为你积攒轨迹。',
        timestamp: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
        date: todayStr,
        extractedEvents: data.extractedEvents,
        extractedStates: data.extractedStates,
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      console.error('Send message error:', err);
      // Local fallback
      const fallbackReply = '收到。已为你记下这一刻的体验。';
      const assistantMsg: ChatMessage = {
        id: `msg-ai-${Date.now()}`,
        role: 'assistant',
        content: fallbackReply,
        timestamp: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
        date: todayStr,
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-2 sm:px-5 py-2.5 sm:py-5 space-y-2.5 sm:space-y-4">
      {/* 📌 Today's Key Focus Sticky Note (Tactile Post-it, Max 3 items) */}
      <TodayFocusStickyNote
        focusItems={focusItems}
        onAddFocusItem={onAddFocusItem}
        onToggleFocusItem={onToggleFocusItem}
        onDeleteFocusItem={onDeleteFocusItem}
        onUpdateFocusItem={onUpdateFocusItem}
      />

      {/* Mobile Tab Switcher (Visible only on < lg screens) */}
      <div className="lg:hidden flex items-center bg-[#EAE3D5] p-0.5 rounded-xl border border-[#DCD4C6] gap-0.5 shadow-2xs">
        <button
          onClick={() => setMobileTab('chat')}
          className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
            mobileTab === 'chat'
              ? 'bg-white text-[#2E2A24] shadow-xs'
              : 'text-[#6E6659] active:text-[#2E2A24]'
          }`}
        >
          <Sun className="w-3.5 h-3.5 text-amber-600" />
          <span>心流倾诉</span>
        </button>

        <button
          onClick={() => setMobileTab('records')}
          className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
            mobileTab === 'records'
              ? 'bg-white text-[#2E2A24] shadow-xs'
              : 'text-[#6E6659] active:text-[#2E2A24]'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          <span>今日事实 ({todayEvents.length})</span>
        </button>
      </div>

      {/* Main Grid: Left 8 Cols (Chat) / Right 4 Cols (Real-time Records) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 lg:gap-5 items-start">
        {/* Left 8 Cols: Dialogue & Stream-of-Consciousness Center */}
        <div
          className={`lg:col-span-8 space-y-3 sm:space-y-4 ${
            mobileTab === 'chat' ? 'block' : 'hidden lg:block'
          }`}
        >
          {/* Top Inspiration Anchor Banner */}
          <div className="p-2.5 sm:p-4 rounded-xl sm:rounded-2xl bg-[#F4EFE6] border border-[#E7E0D3] flex items-center justify-between gap-2.5">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                <Sun className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
              </div>
              <div className="min-w-0">
                <h2 className="text-xs sm:text-sm font-semibold text-[#2E2A24] truncate">
                  ☀️ 白天模式：只管生活与表达
                </h2>
                <p className="text-[10px] sm:text-xs text-[#70695D] truncate">
                  随时倾诉。AI 默默记录事件，绝不打扰。
                </p>
              </div>
            </div>

            <button
              onClick={onGoToReview}
              className="inline-flex items-center gap-1 px-2 py-1 sm:px-3 sm:py-1.5 rounded-lg bg-[#2E2A24] hover:bg-[#433D35] text-[#FAF8F5] text-[11px] sm:text-xs font-medium transition-colors shadow-xs shrink-0"
            >
              <span>晚间日结</span>
              <ArrowRight className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            </button>
          </div>

          {/* Chat Container */}
          <div className="bg-[#FAF8F5] border border-[#E9E4DC] rounded-xl sm:rounded-2xl p-2.5 sm:p-5 shadow-xs flex flex-col h-[400px] sm:h-[500px]">
            {/* Scrollable messages area */}
            <div className="flex-1 overflow-y-auto space-y-2.5 sm:space-y-3.5 pr-1 scrollbar-thin">
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[94%] sm:max-w-[80%] rounded-xl sm:rounded-2xl p-2.5 sm:p-4 text-xs sm:text-sm leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-[#2E2A24] text-[#FAF8F5] rounded-br-xs'
                        : 'bg-[#F2EDE4] text-[#2E2A24] rounded-bl-xs border border-[#E5DFD4]'
                    }`}
                  >
                    {/* Header line for AI */}
                    {msg.role === 'assistant' && (
                      <div className="flex items-center gap-1.5 mb-1 text-[11px] sm:text-xs text-[#7A7264] font-medium">
                        <Sparkles className="w-3 h-3 text-amber-600" />
                        <span>LifeOS 思考伙伴</span>
                        <span className="text-[9px] sm:text-[10px] text-[#A69E90] font-mono ml-auto">
                          {msg.timestamp}
                        </span>
                      </div>
                    )}

                    <div className="whitespace-pre-wrap leading-relaxed">{msg.content}</div>

                    {/* Silent capture badges */}
                    {((msg.extractedEvents && msg.extractedEvents.length > 0) ||
                      (msg.extractedLedgers && msg.extractedLedgers.length > 0)) && (
                      <div className="mt-2 pt-1.5 border-t border-[#E3DDD2] space-y-1">
                        <div className="text-[10px] font-medium text-[#736B5E] flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>已在后台静默提取：</span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {msg.extractedEvents?.map((ev, idx) => (
                            <span
                              key={`ev-${idx}`}
                              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] bg-[#EAE4D8] text-[#4A4337] border border-[#DDD5C7]"
                            >
                              <span>{LIFE_AREAS[ev.area as LifeArea]?.emoji || '🌱'}</span>
                              <span className="font-medium">{ev.description}</span>
                              {ev.duration_display && ev.duration_display !== '未知' && (
                                <span className="text-[9px] text-[#827A6C]">
                                  ({ev.duration_display})
                                </span>
                              )}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {msg.role === 'user' && (
                      <div className="text-[9px] text-[#D0C8BC] font-mono text-right mt-0.5">
                        {msg.timestamp}
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}

              {isSending && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex justify-start"
                >
                  <div className="bg-[#F2EDE4] text-[#70695D] rounded-xl p-2.5 text-xs flex items-center gap-1.5 border border-[#E5DFD4]">
                    <Sparkles className="w-3 h-3 text-amber-600 animate-spin" />
                    <span>正在用心理解你的表达与梳理现实事件...</span>
                  </div>
                </motion.div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Prompt Chips */}
            <div className="pt-2 pb-1.5 flex items-center gap-1 overflow-x-auto no-scrollbar border-t border-[#EBE6DC] mt-1.5">
              <span className="text-[10px] text-[#8C8477] whitespace-nowrap">试着说:</span>
              {SAMPLE_CHIPS.map((chip, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(chip)}
                  disabled={isSending}
                  className="text-[10px] whitespace-nowrap px-2 py-0.5 rounded-full bg-[#EFEAE0] hover:bg-[#E5DFD2] text-[#4A443B] border border-[#E3DDD0] transition-colors"
                >
                  {chip.length > 14 ? chip.slice(0, 14) + '...' : chip}
                </button>
              ))}
            </div>

            {/* Big Expressive Input Box */}
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
                placeholder="随时碎碎念、讲事情、讲情绪、聊工作、聊身体..."
                rows={2}
                className="w-full resize-none rounded-xl bg-[#F7F4EE] border border-[#DDD6C8] focus:border-[#2E2A24] focus:bg-[#FAF8F5] focus:outline-none p-2.5 sm:p-3 text-xs sm:text-sm text-[#2E2A24] placeholder-[#A0988A] transition-all pr-18 sm:pr-22"
              />

              <div className="absolute right-1.5 sm:right-2.5 bottom-2 sm:bottom-2.5 flex items-center gap-1">
                <button
                  onClick={toggleListening}
                  className={`p-1.5 rounded-lg transition-colors ${
                    isListening
                      ? 'bg-rose-500 text-white animate-pulse'
                      : 'text-[#7A7264] hover:bg-[#EBE5DA] hover:text-[#2E2A24]'
                  }`}
                  title={isListening ? '停止语音' : '语音输入'}
                >
                  {isListening ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                </button>

                <button
                  onClick={() => handleSendMessage()}
                  disabled={!inputText.trim() || isSending}
                  className="px-2.5 py-1.5 rounded-lg bg-[#2E2A24] hover:bg-[#433D35] disabled:opacity-40 text-[#FAF8F5] text-xs font-medium flex items-center gap-1 transition-all shadow-xs"
                >
                  <span>发送</span>
                  <Send className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right 4 Cols: Today's Reality Stream & State Monitor */}
        <div
          className={`lg:col-span-4 space-y-3 sm:space-y-4 ${
            mobileTab === 'records' ? 'block' : 'hidden lg:block'
          }`}
        >
          {/* Today's Events Extracted */}
          <div className="bg-[#FAF8F5] border border-[#E9E4DC] rounded-xl sm:rounded-2xl p-3 sm:p-5 shadow-xs">
            <div className="flex items-center justify-between mb-2.5 pb-2 border-b border-[#F0EBE2]">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                <h3 className="text-xs sm:text-sm font-semibold text-[#2E2A24]">
                  今日现实发生 ({todayEvents.length})
                </h3>
              </div>
              <span className="text-[10px] sm:text-[11px] text-[#8C8477] font-mono">
                {todayStr}
              </span>
            </div>

            {todayEvents.length === 0 ? (
              <div className="text-center py-5 text-xs text-[#999083] space-y-1">
                <p>今天还没有记录事件</p>
                <p className="text-[10px] text-[#A69E90]">在心流表达中说话，AI 就会自动提取</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1">
                {todayEvents.map((evt) => {
                  const areaMeta = LIFE_AREAS[evt.area] || LIFE_AREAS.life;
                  return (
                    <div
                      key={evt.id}
                      className="p-2 sm:p-2.5 rounded-lg sm:rounded-xl bg-[#F6F2EA] border border-[#E8E2D6] text-xs space-y-1 hover:border-[#D5CDC0] transition-colors group"
                    >
                      <div className="flex items-start justify-between gap-1.5">
                        <div className="flex items-center gap-1.5 font-medium text-[#2E2A24]">
                          <span className="text-xs">{areaMeta.emoji}</span>
                          <span className="text-xs">{evt.description}</span>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          {evt.duration_display && (
                            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[#ECE5D8] text-[#5C5548] whitespace-nowrap">
                              {evt.duration_display}
                            </span>
                          )}
                          <button
                            onClick={() => setEditingEvent(evt)}
                            className="p-1 text-[#7A7264] hover:text-[#2E2A24] rounded opacity-90 sm:opacity-0 group-hover:opacity-100 transition-opacity"
                            title="编辑"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                          {onDeleteEvent && (
                            <button
                              onClick={() => onDeleteEvent(evt.id)}
                              className="p-1 text-[#9C9487] hover:text-rose-600 rounded opacity-90 sm:opacity-0 group-hover:opacity-100 transition-opacity"
                              title="删除"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[10px] sm:text-[11px] text-[#7A7264]">
                        <span>{areaMeta.label} · {evt.category}</span>
                        {evt.amount && (
                          <span className="font-mono text-amber-800 font-medium">
                            ¥{evt.amount}
                          </span>
                        )}
                      </div>

                      {evt.interpretation && (
                        <p className="text-[10px] text-[#8A8173] italic pt-1 border-t border-[#EBE4D6]">
                          💡 {evt.interpretation}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Today's States Extracted */}
          <div className="bg-[#FAF8F5] border border-[#E9E4DC] rounded-xl sm:rounded-2xl p-3 sm:p-5 shadow-xs">
            <div className="flex items-center justify-between mb-2.5 pb-2 border-b border-[#F0EBE2]">
              <div className="flex items-center gap-1.5">
                <Heart className="w-3.5 h-3.5 text-rose-500" />
                <h3 className="text-xs sm:text-sm font-semibold text-[#2E2A24]">
                  今日身心状态 ({todayStates.length})
                </h3>
              </div>
              <span className="text-[10px] text-[#8C8477]">自动感知</span>
            </div>

            {todayStates.length === 0 ? (
              <div className="text-center py-4 text-xs text-[#999083]">
                情绪与能量随自然对话自动沉淀
              </div>
            ) : (
              <div className="space-y-1.5 max-h-[140px] overflow-y-auto pr-1">
                {todayStates.map((st) => (
                  <div
                    key={st.id}
                    className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-[#F6F2EA] border border-[#E8E2D6] flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-[#EAE3D5] text-[#3D372E] shrink-0">
                        {st.primaryMood}
                      </span>
                      <span className="text-[10px] sm:text-[11px] text-[#6E6659] truncate max-w-[120px] sm:max-w-[140px]">
                        {st.contextDescription}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 font-mono text-[9px] sm:text-[10px] text-[#8C8477] shrink-0">
                      <span>能量:</span>
                      <span className="font-semibold text-[#2E2A24]">
                        {st.energyLevel}/5
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Evening Review Call to Action Card */}
          <div className="p-3 sm:p-5 rounded-xl sm:rounded-2xl bg-gradient-to-br from-[#2E2A24] to-[#423C34] text-[#FAF8F5] shadow-xs space-y-2.5">
            <div className="flex items-center gap-1.5 text-amber-300 text-xs font-medium">
              <Sparkles className="w-3.5 h-3.5" />
              <span>日落时分 · 晚间整合</span>
            </div>
            <p className="text-[11px] sm:text-xs text-[#D8D1C5] leading-relaxed">
              今天的事情差不多发生完了？进入日结，让 AI 寻找真实的进步、盲区、感恩与长远愿景连接。
            </p>
            <button
              onClick={onGoToReview}
              className="w-full py-2 rounded-lg sm:rounded-xl bg-[#FAF8F5] hover:bg-[#F2ECE2] text-[#2E2A24] text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
            >
              <span>开启今日 7 大维度日结</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Edit Event Modal */}
      <AnimatePresence>
        {editingEvent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/40 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#FAF8F5] rounded-2xl border border-[#E5DFD3] shadow-xl w-full max-w-md p-5 space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-[#F0EBE2]">
                <h3 className="font-semibold text-[#2E2A24] text-sm sm:text-base">
                  编辑今日事件
                </h3>
                <button
                  onClick={() => setEditingEvent(null)}
                  className="p-1 text-[#8C8477] hover:text-[#2E2A24] rounded-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-[#5E584F] mb-1">
                    事件描述
                  </label>
                  <input
                    type="text"
                    value={editingEvent.description}
                    onChange={(e) =>
                      setEditingEvent({ ...editingEvent, description: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-[#F7F4EE] border border-[#DDD6C8] text-xs sm:text-sm text-[#2E2A24] focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-medium text-[#5E584F] mb-1">
                      所属领域
                    </label>
                    <select
                      value={editingEvent.area}
                      onChange={(e) =>
                        setEditingEvent({ ...editingEvent, area: e.target.value as any })
                      }
                      className="w-full px-2.5 py-1.5 rounded-xl bg-[#F7F4EE] border border-[#DDD6C8] text-xs text-[#2E2A24] focus:outline-none"
                    >
                      {Object.entries(LIFE_AREAS).map(([k, v]) => (
                        <option key={k} value={k}>
                          {v.emoji} {v.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[#5E584F] mb-1">
                      时长显示
                    </label>
                    <input
                      type="text"
                      value={editingEvent.duration_display || ''}
                      onChange={(e) =>
                        setEditingEvent({ ...editingEvent, duration_display: e.target.value })
                      }
                      placeholder="如：2h, 45m"
                      className="w-full px-2.5 py-1.5 rounded-xl bg-[#F7F4EE] border border-[#DDD6C8] text-xs font-mono text-[#2E2A24] focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#5E584F] mb-1">
                    分类名称
                  </label>
                  <input
                    type="text"
                    value={editingEvent.category}
                    onChange={(e) =>
                      setEditingEvent({ ...editingEvent, category: e.target.value })
                    }
                    className="w-full px-3 py-1.5 rounded-xl bg-[#F7F4EE] border border-[#DDD6C8] text-xs text-[#2E2A24] focus:outline-none"
                  />
                </div>

                <div className="pt-2 border-t border-[#F0EBE2] flex items-center justify-end gap-2">
                  <button
                    onClick={() => setEditingEvent(null)}
                    className="px-3.5 py-1.5 rounded-xl text-xs text-[#70695D] hover:bg-[#EBE5DA]"
                  >
                    取消
                  </button>
                  <button
                    onClick={() => {
                      if (onUpdateEvent && editingEvent) {
                        onUpdateEvent(editingEvent.id, editingEvent);
                      }
                      setEditingEvent(null);
                    }}
                    className="px-4 py-1.5 rounded-xl bg-[#2E2A24] text-white text-xs font-medium"
                  >
                    保存更新
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
