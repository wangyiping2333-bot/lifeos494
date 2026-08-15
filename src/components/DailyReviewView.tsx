import React, { useState } from 'react';
import {
  Moon,
  Sparkles,
  CheckCircle,
  HelpCircle,
  Edit3,
  Save,
  Check,
  Compass,
  ArrowRight,
  RefreshCw,
  Clock,
  Heart,
  Star,
  ShieldCheck,
  Calendar,
  Layers,
  ChevronRight,
} from 'lucide-react';
import { motion } from 'motion/react';
import { DailyReview, Goal, LifeEvent, LifeState, Principle } from '../types';
import { GeminiKeyManager } from '../lib/geminiKey';

interface DailyReviewViewProps {
  events?: LifeEvent[];
  states?: LifeState[];
  goals?: Goal[];
  principles?: Principle[];
  dailyReviews?: DailyReview[];
  onSaveReview: (review: DailyReview) => void;
  onUpdateEvent: (id: string, updates: Partial<LifeEvent>) => void;
}

export const DailyReviewView: React.FC<DailyReviewViewProps> = ({
  events = [],
  states = [],
  goals = [],
  principles = [],
  dailyReviews = [],
  onSaveReview,
  onUpdateEvent,
}) => {
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeStep, setActiveStep] = useState<'confirm_data' | 'review_content'>('review_content');
  const [isEditing, setIsEditing] = useState(false);

  // Get current date's review or default template
  const currentReview = (dailyReviews || []).find((r) => r?.date === selectedDate);

  // Filter events and states for the chosen date
  const dayEvents = events.filter((e) => e.date === selectedDate);
  const dayStates = states.filter((s) => s.date === selectedDate);

  // Events that have missing duration or time
  const unconfirmedEvents = dayEvents.filter(
    (e) => !e.duration_display || e.duration_display === '未知' || e.status === 'needs_time_confirm'
  );

  // Form State for editing or creating review
  const [reviewForm, setReviewForm] = useState<DailyReview>(
    currentReview || {
      id: `rev-${selectedDate}`,
      date: selectedDate,
      eventsSummary: dayEvents.map((e) => e.description),
      successes: [
        '在面临内在情绪波动（如家庭金钱敏感与外部回复不确定）时，依然稳稳完成了2小时直播与业务交付。',
        '主动把隐秘的不安表达出来并加以觉察，没有任由自我怀疑侵蚀行动力。',
      ],
      gratitudes: [
        '感谢客户对手工蜡烛的信任与购买，让创造力产生了现实的回响。',
        '感谢身体在运动后回馈我的踏实感。',
        '感谢今天出现的每一次情绪触发，让我看清了内心深处尚未解开的结。',
      ],
      integrations: [
        '母亲转账100元 -> 触碰到对过去匮乏历史的敏感记忆 -> 产生了“接受资助等于无能”的习惯性防御 -> 经过梳理，开始明白爱并不剥夺我的独立。',
      ],
      blindSpots: [
        '似乎潜意识中依然存在一个隐藏假设：“必须通过承受痛苦与高压，才能证明自己的独立价值”。值得持续观察并温柔放下。',
      ],
      goalConnections: [
        '今天的直播与手作交付，直接为【每月收入稳定达到5000+】提供了现实证据。',
        '守住情绪边界，就是践行“我正在成为一个能够独立自我肯定的人”的真实体现。',
      ],
      manifestationNarrative:
        '正在从“危机驱动”平稳转向“稳定创造”。宇宙正在回应你每一次踏实的行动与真诚的觉察，金钱与机会正以自然健康的方式向你靠拢。',
      innerCompass: {
        bodyWilling: true,
        heartPeaceful: true,
        proactiveChoice: true,
        facingReality: true,
        moreComplete: true,
        alignmentScore: 8.5,
        reflectionNotes: '今天虽然有微小扰动，但核心行动全为主动选择，身心一致性良好。',
      },
      confirmedData: true,
      createdAt: new Date().toISOString(),
    }
  );

  // Switch date
  const handleSelectDate = (date: string) => {
    setSelectedDate(date);
    const existing = dailyReviews.find((r) => r.date === date);
    if (existing) {
      setReviewForm(existing);
      setActiveStep('review_content');
    } else {
      const filteredEvts = events.filter((e) => e.date === date);
      setReviewForm({
        id: `rev-${date}`,
        date,
        eventsSummary: filteredEvts.map((e) => e.description),
        successes: [],
        gratitudes: [],
        integrations: [],
        blindSpots: [],
        goalConnections: [],
        manifestationNarrative: '',
        innerCompass: {
          bodyWilling: true,
          heartPeaceful: true,
          proactiveChoice: true,
          facingReality: true,
          moreComplete: true,
          alignmentScore: 8,
          reflectionNotes: '',
        },
        confirmedData: false,
        createdAt: new Date().toISOString(),
      });
      setActiveStep(unconfirmedEvents.length > 0 ? 'confirm_data' : 'review_content');
    }
  };

  // Generate with Gemini
  const handleGenerateReview = async () => {
    setIsGenerating(true);
    try {
       const response = await fetch('/api/review/generate', {
         method: 'POST',
         headers: GeminiKeyManager.getApiHeaders(),
         body: JSON.stringify({
          date: selectedDate,
          events: dayEvents,
          states: dayStates,
          rawNotes: dayEvents.map((e) => e.raw_note),
          goals,
          principles,
        }),
      });

      const data = await response.json();
      const updatedReview: DailyReview = {
        ...reviewForm,
        eventsSummary: data.eventsSummary || dayEvents.map((e) => e.description),
        successes: data.successes || [],
        gratitudes: data.gratitudes || [],
        integrations: data.integrations || [],
        blindSpots: data.blindSpots || [],
        goalConnections: data.goalConnections || [],
        manifestationNarrative: data.manifestationNarrative || '',
        innerCompass: {
          ...reviewForm.innerCompass,
          alignmentScore: data.innerCompassScore || 8,
          reflectionNotes: data.compassObservation || '',
        },
        confirmedData: true,
      };

      setReviewForm(updatedReview);
      onSaveReview(updatedReview);
      setActiveStep('review_content');
    } catch (err) {
      console.error('Review generation failed:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = () => {
    onSaveReview(reviewForm);
    setIsEditing(false);
  };

  // Quick fill event duration
  const handleQuickFillEvent = (eventId: string, duration: string) => {
    onUpdateEvent(eventId, {
      duration_display: duration,
      status: 'confirmed',
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-6 space-y-5">
      {/* Top Banner: Night Mode Overview */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-[#2A2621] to-[#3D372F] text-[#FAF8F5] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-indigo-900/60 text-indigo-200 border border-indigo-700/50 flex items-center justify-center shrink-0">
            <Moon className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-semibold tracking-tight">
                🌙 晚间模式：日结复盘与整合
              </h2>
              <span className="text-[10px] sm:text-[11px] font-mono px-1.5 py-0.5 rounded bg-white/10 text-[#E0D8CC]">
                {selectedDate}
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-[#C8C0B2] mt-0.5">
              将今日零散输入，自动转化为7大维度结构化事实、真实证据与愿景连接。
            </p>
          </div>
        </div>

        {/* Generate / Action Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleGenerateReview}
            disabled={isGenerating}
            className="w-full sm:w-auto px-3.5 py-2 rounded-xl bg-[#FAF8F5] hover:bg-[#EDE7DC] text-[#2E2A24] text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-xs disabled:opacity-50"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-700" />
                <span>AI 正在深度整合复盘...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5 text-amber-700" />
                <span>AI 一键深度日结</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Date Switcher & Steps Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-[#EAE4D8]">
        {/* Date Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto">
          {['2026-08-15', '2026-08-14', '2026-08-13'].map((d) => (
            <button
              key={d}
              onClick={() => handleSelectDate(d)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                selectedDate === d
                  ? 'bg-[#2E2A24] text-[#FAF8F5]'
                  : 'bg-[#EFEAE0] text-[#6E6659] hover:bg-[#E5DFD2]'
              }`}
            >
              {d === new Date().toISOString().split('T')[0] ? `今天 (${d.slice(5)})` : d.slice(5)}
            </button>
          ))}
        </div>

        {/* Sub-steps */}
        <div className="flex items-center gap-2">
          {unconfirmedEvents.length > 0 && (
            <button
              onClick={() => setActiveStep('confirm_data')}
              className={`px-3 py-1 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors ${
                activeStep === 'confirm_data'
                  ? 'bg-amber-100 text-amber-900 border border-amber-300'
                  : 'bg-[#F2EDE4] text-[#7A7264] hover:bg-[#EAE4D8]'
              }`}
            >
              <HelpCircle className="w-3.5 h-3.5 text-amber-600" />
              <span>待补全时间 ({unconfirmedEvents.length})</span>
            </button>
          )}

          <button
            onClick={() => setActiveStep('review_content')}
            className={`px-3 py-1 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors ${
              activeStep === 'review_content'
                ? 'bg-[#2E2A24] text-[#FAF8F5]'
                : 'bg-[#F2EDE4] text-[#7A7264] hover:bg-[#EAE4D8]'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>7 大维度复盘表</span>
          </button>
        </div>
      </div>

      {/* Step 1: Missing Data Quick Confirm (If selected or pending) */}
      {activeStep === 'confirm_data' && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-5 rounded-2xl bg-[#FFFDF9] border border-amber-200 space-y-4"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-600" />
              <h3 className="text-sm font-semibold text-[#2E2A24]">
                Step 1: 数据确认（白天未填写的耗时/时间）
              </h3>
            </div>
            <span className="text-xs text-[#7A7264]">
              允许留空或点击快捷填补，无需强求精准
            </span>
          </div>

          {unconfirmedEvents.length === 0 ? (
            <div className="text-xs text-emerald-800 py-3 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              <span>所有今日事件的时间均已清晰，可以查看完整复盘。</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {unconfirmedEvents.map((evt) => (
                <div
                  key={evt.id}
                  className="p-3.5 rounded-xl bg-[#FAF8F5] border border-[#E9E4DC] space-y-2 text-xs"
                >
                  <div className="font-medium text-[#2E2A24] flex items-center justify-between">
                    <span>{evt.description}</span>
                    <span className="text-[10px] text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                      时间待补
                    </span>
                  </div>
                  <p className="text-[11px] text-[#7A7264]">原声: "{evt.raw_note}"</p>
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="text-[10px] text-[#8C8477]">快捷填入:</span>
                    {['30min', '1h', '2h', '3h'].map((dur) => (
                      <button
                        key={dur}
                        onClick={() => handleQuickFillEvent(evt.id, dur)}
                        className="px-2 py-0.5 rounded bg-[#EFEAE0] hover:bg-[#E5DFD2] text-[#4A443B] text-[11px] transition-colors"
                      >
                        {dur}
                      </button>
                    ))}
                    <button
                      onClick={() => handleQuickFillEvent(evt.id, '不记得/留空')}
                      className="px-2 py-0.5 rounded bg-stone-100 hover:bg-stone-200 text-stone-600 text-[10px]"
                    >
                      不记得
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="flex justify-end pt-2">
            <button
              onClick={() => setActiveStep('review_content')}
              className="px-4 py-2 rounded-xl bg-[#2E2A24] text-[#FAF8F5] text-xs font-medium flex items-center gap-1.5 hover:bg-[#433D35]"
            >
              <span>确认完毕，查看 7 大维度复盘</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </motion.div>
      )}

      {/* Step 2: 7-Part Daily Review Main Board */}
      {activeStep === 'review_content' && (
        <div className="space-y-6">
          {/* Action Bar */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-[#7A7264]">
              <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
              <span>7 大维度复盘报告</span>
              <span>·</span>
              <span>事实与解读严格分离</span>
            </div>

            <div className="flex items-center gap-2">
              {isEditing ? (
                <button
                  onClick={handleSave}
                  className="px-3 py-1.5 rounded-lg bg-emerald-700 text-white text-xs font-medium flex items-center gap-1 hover:bg-emerald-800 transition-colors"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>保存修改</span>
                </button>
              ) : (
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-3 py-1.5 rounded-lg bg-[#EFEAE0] hover:bg-[#E5DFD2] text-[#4A443B] text-xs font-medium flex items-center gap-1 transition-colors"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>编辑内容</span>
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* ① 今日发生 (纯事实) */}
            <div className="p-5 rounded-2xl bg-[#FAF8F5] border border-[#E9E4DC] shadow-xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-[#F0EBE2]">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-stone-200 text-stone-700 text-xs font-serif flex items-center justify-center font-bold">
                    1
                  </span>
                  <h3 className="text-sm font-semibold text-[#2E2A24]">
                    ① 今日发生 · 纯事实
                  </h3>
                </div>
                <span className="text-[10px] text-[#8C8477] uppercase tracking-wider font-mono">
                  Facts Only
                </span>
              </div>

              {isEditing ? (
                <textarea
                  value={reviewForm.eventsSummary.join('\n')}
                  onChange={(e) =>
                    setReviewForm({
                      ...reviewForm,
                      eventsSummary: e.target.value.split('\n').filter(Boolean),
                    })
                  }
                  rows={4}
                  className="w-full text-xs p-2.5 rounded-xl border border-[#D5CDC0] bg-[#FFFDF9]"
                />
              ) : (
                <ul className="space-y-2 text-xs text-[#4A443B] leading-relaxed">
                  {reviewForm.eventsSummary.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-[#8C8477] font-mono mt-0.5">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                  {reviewForm.eventsSummary.length === 0 && (
                    <p className="text-[#999083] italic">暂无记录的事实事件</p>
                  )}
                </ul>
              )}
            </div>

            {/* ② 今日成功 (具体证据) */}
            <div className="p-5 rounded-2xl bg-[#FAF8F5] border border-[#E9E4DC] shadow-xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-[#F0EBE2]">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-serif flex items-center justify-center font-bold">
                    2
                  </span>
                  <h3 className="text-sm font-semibold text-[#2E2A24]">
                    ② 今日成功 · 真实证据
                  </h3>
                </div>
                <span className="text-[10px] text-emerald-700 font-medium">
                  Evidence of Progress
                </span>
              </div>

              {isEditing ? (
                <textarea
                  value={reviewForm.successes.join('\n')}
                  onChange={(e) =>
                    setReviewForm({
                      ...reviewForm,
                      successes: e.target.value.split('\n').filter(Boolean),
                    })
                  }
                  rows={4}
                  className="w-full text-xs p-2.5 rounded-xl border border-[#D5CDC0] bg-[#FFFDF9]"
                />
              ) : (
                <ul className="space-y-2 text-xs text-[#2E2A24] leading-relaxed">
                  {reviewForm.successes.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      <span className="font-medium text-[#2E2A24]">{item}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* ③ 今日感恩 (真实细节) */}
            <div className="p-5 rounded-2xl bg-[#FAF8F5] border border-[#E9E4DC] shadow-xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-[#F0EBE2]">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-rose-100 text-rose-800 text-xs font-serif flex items-center justify-center font-bold">
                    3
                  </span>
                  <h3 className="text-sm font-semibold text-[#2E2A24]">
                    ③ 今日感恩 · 真实瞬间
                  </h3>
                </div>
                <span className="text-[10px] text-rose-700 font-medium">
                  Organic Gratitude
                </span>
              </div>

              {isEditing ? (
                <textarea
                  value={reviewForm.gratitudes.join('\n')}
                  onChange={(e) =>
                    setReviewForm({
                      ...reviewForm,
                      gratitudes: e.target.value.split('\n').filter(Boolean),
                    })
                  }
                  rows={4}
                  className="w-full text-xs p-2.5 rounded-xl border border-[#D5CDC0] bg-[#FFFDF9]"
                />
              ) : (
                <ul className="space-y-2 text-xs text-[#4A443B] leading-relaxed">
                  {reviewForm.gratitudes.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <Heart className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* ④ 今日整合 (心理与生活重连) */}
            <div className="p-5 rounded-2xl bg-[#FAF8F5] border border-[#E9E4DC] shadow-xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-[#F0EBE2]">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-800 text-xs font-serif flex items-center justify-center font-bold">
                    4
                  </span>
                  <h3 className="text-sm font-semibold text-[#2E2A24]">
                    ④ 今日整合 · 串联暗流
                  </h3>
                </div>
                <span className="text-[10px] text-amber-700 font-medium">
                  Dot Connecting
                </span>
              </div>

              {isEditing ? (
                <textarea
                  value={reviewForm.integrations.join('\n')}
                  onChange={(e) =>
                    setReviewForm({
                      ...reviewForm,
                      integrations: e.target.value.split('\n').filter(Boolean),
                    })
                  }
                  rows={4}
                  className="w-full text-xs p-2.5 rounded-xl border border-[#D5CDC0] bg-[#FFFDF9]"
                />
              ) : (
                <ul className="space-y-2.5 text-xs text-[#4A443B] leading-relaxed">
                  {reviewForm.integrations.map((item, idx) => (
                    <li key={idx} className="p-2.5 rounded-xl bg-[#F6F2EA] border border-[#E8E2D6]">
                      {item}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* ⑤ 今日盲区 (温和推测) */}
            <div className="p-5 rounded-2xl bg-[#FAF8F5] border border-[#E9E4DC] shadow-xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-[#F0EBE2]">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-800 text-xs font-serif flex items-center justify-center font-bold">
                    5
                  </span>
                  <h3 className="text-sm font-semibold text-[#2E2A24]">
                    ⑤ 今日盲区 · 温和洞察
                  </h3>
                </div>
                <span className="text-[10px] text-indigo-700 font-medium">
                  Hidden Assumptions
                </span>
              </div>

              {isEditing ? (
                <textarea
                  value={reviewForm.blindSpots.join('\n')}
                  onChange={(e) =>
                    setReviewForm({
                      ...reviewForm,
                      blindSpots: e.target.value.split('\n').filter(Boolean),
                    })
                  }
                  rows={4}
                  className="w-full text-xs p-2.5 rounded-xl border border-[#D5CDC0] bg-[#FFFDF9]"
                />
              ) : (
                <ul className="space-y-2 text-xs text-[#4A443B] leading-relaxed">
                  {reviewForm.blindSpots.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2 p-2.5 rounded-xl bg-indigo-50/60 border border-indigo-100">
                      <span className="text-indigo-600 font-bold">🔍</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* ⑥ 目标与愿景连接 */}
            <div className="p-5 rounded-2xl bg-[#FAF8F5] border border-[#E9E4DC] shadow-xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-[#F0EBE2]">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-purple-100 text-purple-800 text-xs font-serif flex items-center justify-center font-bold">
                    6
                  </span>
                  <h3 className="text-sm font-semibold text-[#2E2A24]">
                    ⑥ 目标连接 · 我正在成为谁
                  </h3>
                </div>
                <span className="text-[10px] text-purple-700 font-medium">
                  Identity Evidence
                </span>
              </div>

              {isEditing ? (
                <textarea
                  value={reviewForm.goalConnections.join('\n')}
                  onChange={(e) =>
                    setReviewForm({
                      ...reviewForm,
                      goalConnections: e.target.value.split('\n').filter(Boolean),
                    })
                  }
                  rows={4}
                  className="w-full text-xs p-2.5 rounded-xl border border-[#D5CDC0] bg-[#FFFDF9]"
                />
              ) : (
                <ul className="space-y-2 text-xs text-[#4A443B] leading-relaxed">
                  {reviewForm.goalConnections.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <Star className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* ⑦ 显化叙事 / 宇宙同步 (Full Width Feature Card) */}
          <div className="p-6 rounded-2xl bg-gradient-to-br from-[#F5EFEB] via-[#FAF6F0] to-[#EFE7DE] border border-[#E2D8CC] shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#E5DDD2]">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-amber-200 text-amber-900 text-xs font-serif flex items-center justify-center font-bold">
                  7
                </span>
                <h3 className="text-sm font-semibold text-[#2E2A24]">
                  ⑦ 显化与愿景叙事 · 能量与象征意义
                </h3>
              </div>
              <span className="text-[11px] text-amber-800 font-medium px-2 py-0.5 rounded bg-amber-100/70">
                Manifestation & Sync
              </span>
            </div>

            {isEditing ? (
              <textarea
                value={reviewForm.manifestationNarrative}
                onChange={(e) =>
                  setReviewForm({
                    ...reviewForm,
                    manifestationNarrative: e.target.value,
                  })
                }
                rows={3}
                className="w-full text-xs p-3 rounded-xl border border-[#D5CDC0] bg-[#FFFDF9]"
              />
            ) : (
              <p className="text-xs text-[#3D372E] leading-relaxed font-serif italic pl-2 border-l-2 border-amber-600">
                "{reviewForm.manifestationNarrative}"
              </p>
            )}
          </div>

          {/* Inner Compass Alignment Card */}
          <div className="p-5 rounded-2xl bg-[#FAF8F5] border border-[#E9E4DC] shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#F0EBE2]">
              <div className="flex items-center gap-2">
                <Compass className="w-4 h-4 text-amber-700" />
                <h3 className="text-sm font-semibold text-[#2E2A24]">
                  内在指南针 · 身心一致性评估 (Alignment)
                </h3>
              </div>
              <div className="flex items-center gap-1 text-xs">
                <span className="text-[#7A7264]">对齐度:</span>
                <span className="font-bold text-amber-800 font-mono text-sm">
                  {reviewForm.innerCompass.alignmentScore}/10
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 text-xs">
              <div
                className={`p-2.5 rounded-xl border flex flex-col gap-1 ${
                  reviewForm.innerCompass.bodyWilling
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                    : 'bg-stone-50 border-stone-200 text-stone-600'
                }`}
              >
                <span className="text-[10px] text-[#7A7264]">身体感觉</span>
                <span className="font-medium">
                  {reviewForm.innerCompass.bodyWilling ? '✓ 身体愿意' : '✕ 过于紧绷'}
                </span>
              </div>

              <div
                className={`p-2.5 rounded-xl border flex flex-col gap-1 ${
                  reviewForm.innerCompass.heartPeaceful
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                    : 'bg-stone-50 border-stone-200 text-stone-600'
                }`}
              >
                <span className="text-[10px] text-[#7A7264]">内心状态</span>
                <span className="font-medium">
                  {reviewForm.innerCompass.heartPeaceful ? '✓ 心里踏实' : '✕ 伴随焦躁'}
                </span>
              </div>

              <div
                className={`p-2.5 rounded-xl border flex flex-col gap-1 ${
                  reviewForm.innerCompass.proactiveChoice
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                    : 'bg-stone-50 border-stone-200 text-stone-600'
                }`}
              >
                <span className="text-[10px] text-[#7A7264]">动力来源</span>
                <span className="font-medium">
                  {reviewForm.innerCompass.proactiveChoice ? '✓ 主动选择' : '✕ 恐惧驱动'}
                </span>
              </div>

              <div
                className={`p-2.5 rounded-xl border flex flex-col gap-1 ${
                  reviewForm.innerCompass.facingReality
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                    : 'bg-stone-50 border-stone-200 text-stone-600'
                }`}
              >
                <span className="text-[10px] text-[#7A7264]">现实态度</span>
                <span className="font-medium">
                  {reviewForm.innerCompass.facingReality ? '✓ 面对现实' : '✕ 逃避麻木'}
                </span>
              </div>

              <div
                className={`col-span-2 sm:col-span-1 p-2.5 rounded-xl border flex flex-col gap-1 ${
                  reviewForm.innerCompass.moreComplete
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                    : 'bg-stone-50 border-stone-200 text-stone-600'
                }`}
              >
                <span className="text-[10px] text-[#7A7264]">做完感受</span>
                <span className="font-medium">
                  {reviewForm.innerCompass.moreComplete ? '✓ 更完整' : '✕ 更内耗'}
                </span>
              </div>
            </div>

            {reviewForm.innerCompass.reflectionNotes && (
              <p className="text-xs text-[#5C5548] bg-[#F6F2EA] p-3 rounded-xl border border-[#EAE3D6]">
                🧭 {reviewForm.innerCompass.reflectionNotes}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
