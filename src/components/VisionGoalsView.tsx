import React, { useState, useMemo } from 'react';
import {
  Target,
  Sparkles,
  Compass,
  Plus,
  CheckCircle2,
  Edit2,
  Trash2,
  Star,
  Shield,
  Layers,
  ChevronDown,
  ChevronUp,
  Award,
  Archive,
  Calendar,
  Flame,
  Zap,
  RefreshCw,
  Clock,
  Heart,
  Eye,
  Check,
  X,
  MessageSquare,
  Gift,
  Search,
  SlidersHorizontal,
  Bookmark,
  Share2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Goal,
  Principle,
  Vision,
  LifeArea,
  LIFE_AREAS,
  GoalSpiritualPractice,
  GoalBeliefShift,
  GoalTrophy,
  DailyReview,
  LifeEvent,
} from '../types';
import { GeminiKeyManager } from '../lib/geminiKey';

interface VisionGoalsViewProps {
  visions?: Vision[];
  principles?: Principle[];
  goals?: Goal[];
  events?: LifeEvent[];
  reviews?: DailyReview[];
  onAddGoal: (goal: Goal) => void;
  onUpdateGoal: (id: string, updates: Partial<Goal>) => void;
  onDeleteGoal: (id: string) => void;
  onAddEvidence: (goalId: string, text: string) => void;
  onAddPrinciple: (principle: Principle) => void;
  onUpdatePrinciple?: (id: string, updates: Partial<Principle>) => void;
  onDeletePrinciple?: (id: string) => void;
  onAddVision: (vision: Vision) => void;
  onUpdateVision?: (id: string, updates: Partial<Vision>) => void;
  onDeleteVision?: (id: string) => void;
  onOpenMentorPrinciples?: () => void;
}

export const VisionGoalsView: React.FC<VisionGoalsViewProps> = ({
  visions = [],
  principles = [],
  goals = [],
  events = [],
  reviews = [],
  onAddGoal,
  onUpdateGoal,
  onDeleteGoal,
  onAddEvidence,
  onAddPrinciple,
  onUpdatePrinciple,
  onDeletePrinciple,
  onAddVision,
  onUpdateVision,
  onDeleteVision,
  onOpenMentorPrinciples,
}) => {
  const [activeTab, setActiveTab] = useState<'goals' | 'principles' | 'visions' | 'trophies'>('goals');
  const [goalSubFilter, setGoalSubFilter] = useState<'all' | 'short_term' | 'long_term'>('all');
  const [expandedGoalId, setExpandedGoalId] = useState<string | null>(goals[0]?.id || null);
  const [goalSubTabs, setGoalSubTabs] = useState<Record<string, 'reality' | 'spiritual' | 'beliefs'>>({});
  const [showAddForm, setShowAddForm] = useState<Record<string, 'reality' | 'spiritual' | 'beliefs' | null>>({});

  // Quick inputs
  const [newEvidenceInputs, setNewEvidenceInputs] = useState<Record<string, string>>({});
  const [newActionInputs, setNewActionInputs] = useState<Record<string, string>>({});
  const [newSpiritualInputs, setNewSpiritualInputs] = useState<Record<string, { title: string; detail: string; type: string }>>({});
  const [newBeliefInputs, setNewBeliefInputs] = useState<Record<string, { oldB: string; newB: string; insight: string }>>({});

  // AI Extracting state per goal
  const [extractingGoalId, setExtractingGoalId] = useState<string | null>(null);

  // Create / Edit Goal Modal
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null);
  const [goalForm, setGoalForm] = useState<{
    title: string;
    type: 'short_term' | 'long_term';
    area: LifeArea;
    parentId?: string;
    parentVisionId?: string;
    timeframeType: 'fuzzy' | 'exact';
    timeframeFuzzy: string;
    startDate: string;
    targetDate: string;
    reality?: string;
    why?: string;
    identity?: string;
    coreBelief?: string;
  }>({
    title: '',
    type: 'short_term',
    area: 'career',
    parentId: '',
    parentVisionId: '',
    timeframeType: 'fuzzy',
    timeframeFuzzy: '三个月内',
    startDate: new Date().toISOString().split('T')[0],
    targetDate: '',
    reality: '',
    why: '',
    identity: '',
    coreBelief: '',
  });

  // Archive & Trophy Celebration Modal
  const [archivingGoal, setArchivingGoal] = useState<Goal | null>(null);
  const [trophyForm, setTrophyForm] = useState<{
    title: string;
    citation: string;
    icon: string;
    type: 'trophy' | 'certificate' | 'medal';
    personalReward: string;
  }>({
    title: '',
    citation: '',
    icon: '🏆',
    type: 'trophy',
    personalReward: '',
  });

  // Vision Modal State
  const [showVisionModal, setShowVisionModal] = useState(false);
  const [editingVision, setEditingVision] = useState<Vision | null>(null);
  const [visionForm, setVisionForm] = useState<{
    title: string;
    statement: string;
    category: LifeArea;
  }>({
    title: '',
    statement: '',
    category: 'career',
  });

  // Long-term goals list for parent selector
  const longTermGoals = useMemo(() => {
    return goals.filter((g) => g.type === 'long_term' && g.status !== 'archived');
  }, [goals]);

  // Active vs Archived Goals
  const activeGoals = useMemo(() => {
    return goals.filter((g) => g.status !== 'archived');
  }, [goals]);

  const archivedGoals = useMemo(() => {
    return goals.filter((g) => g.status === 'archived');
  }, [goals]);

  // Filtered Goals
  const displayedActiveGoals = useMemo(() => {
    if (goalSubFilter === 'all') return activeGoals;
    return activeGoals.filter((g) => g.type === goalSubFilter);
  }, [activeGoals, goalSubFilter]);

  // Open Create Goal Modal
  const openCreateGoalModal = () => {
    setEditingGoalId(null);
    setGoalForm({
      title: '',
      type: 'short_term',
      area: 'career',
      parentId: longTermGoals[0]?.id || '',
      parentVisionId: visions[0]?.id || '',
      timeframeType: 'fuzzy',
      timeframeFuzzy: '三个月内',
      startDate: new Date().toISOString().split('T')[0],
      targetDate: '',
      reality: '',
      why: '',
      identity: '',
      coreBelief: '',
    });
    setShowGoalModal(true);
  };

  // Open Edit Goal Modal
  const openEditGoalModal = (g: Goal) => {
    setEditingGoalId(g.id);
    setGoalForm({
      title: g.title,
      type: g.type,
      area: g.area || 'career',
      parentId: g.parentId || '',
      parentVisionId: g.parentVisionId || '',
      timeframeType: g.timeframeType || (g.timeframeFuzzy ? 'fuzzy' : 'exact'),
      timeframeFuzzy: g.timeframeFuzzy || '三个月内',
      startDate: g.startDate || new Date().toISOString().split('T')[0],
      targetDate: g.targetDate || '',
      reality: g.reality || '',
      why: g.why || '',
      identity: g.identity || '',
      coreBelief: g.coreBelief || '',
    });
    setShowGoalModal(true);
  };

  // Submit Goal
  const handleSaveGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!goalForm.title.trim()) return;

    if (editingGoalId) {
      onUpdateGoal(editingGoalId, {
        title: goalForm.title,
        type: goalForm.type,
        area: goalForm.area,
        parentId: goalForm.type === 'short_term' ? goalForm.parentId || undefined : undefined,
        parentVisionId: goalForm.parentVisionId || undefined,
        timeframeType: goalForm.timeframeType,
        timeframeFuzzy: goalForm.timeframeType === 'fuzzy' ? goalForm.timeframeFuzzy : undefined,
        startDate: goalForm.startDate,
        targetDate: goalForm.targetDate || undefined,
        reality: goalForm.reality || '日常业务与持续行动',
        why: goalForm.why || '获得自主与成长',
        identity: goalForm.identity || '我正在成为一个能够独立创造价值的人',
        coreBelief: goalForm.coreBelief || '我不需要通过痛苦证明自己的价值',
      });
    } else {
      const newGoal: Goal = {
        id: `g-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        title: goalForm.title,
        type: goalForm.type,
        area: goalForm.area,
        parentId: goalForm.type === 'short_term' ? goalForm.parentId || undefined : undefined,
        parentVisionId: goalForm.parentVisionId || undefined,
        timeframeType: goalForm.timeframeType,
        timeframeFuzzy: goalForm.timeframeType === 'fuzzy' ? goalForm.timeframeFuzzy : undefined,
        startDate: goalForm.startDate,
        targetDate: goalForm.targetDate || undefined,
        reality: goalForm.reality || '日常业务与持续行动',
        why: goalForm.why || '获得自主与成长',
        identity: goalForm.identity || '我正在成为一个能够独立创造价值的人',
        coreBelief: goalForm.coreBelief || '我不需要通过痛苦证明自己的价值',
        evidence: [],
        realityEvidence: [],
        spiritualManifestation: {
          practices: [],
          coreBeliefShifts: [],
          affirmations: [],
          angelNumbers: [],
        },
        visionConnection: goalForm.type === 'short_term' ? '归属长期支柱目标' : '归属核心愿景',
        manifestationNarrative: '正在以稳定的节奏汇聚能量与成果，持续显化于物质世界。',
        progressPercent: 20,
        status: 'active',
        createdAt: new Date().toISOString().split('T')[0],
      };
      onAddGoal(newGoal);
      setExpandedGoalId(newGoal.id);
    }

    setShowGoalModal(false);
    setEditingGoalId(null);
  };

  // Trigger AI Sync Insights & Evidence from Daily Notes
  const handleAiSyncInsights = async (goal: Goal) => {
    setExtractingGoalId(goal.id);
    try {
      const recentNotes = events.map((e) => `${e.date}: ${e.raw_note || e.description}`);
      const recentReviewsText = reviews.map(
        (r) => `${r.date} 复盘: ${r.eventsSummary?.join('; ')} 整合: ${r.integrations?.join('; ')}`
      );

      const res = await fetch('/api/goals/sync-insights', {
        method: 'POST',
        headers: GeminiKeyManager.getApiHeaders(),
        body: JSON.stringify({
          goal,
          recentNotes: [...recentNotes, ...recentReviewsText].slice(0, 15),
          principles,
        }),
      });

      const data = await res.json();
      if (data) {
        const existingReality = goal.realityEvidence || [];
        const newReality = Array.isArray(data.realityEvidence) ? data.realityEvidence : [];
        const combinedReality = [...newReality, ...existingReality].filter(
          (v, i, a) => a.findIndex((t) => t.text === v.text) === i
        );

        const existingSpiritual = goal.spiritualManifestation || {
          practices: [],
          coreBeliefShifts: [],
        };
        const newPractices = Array.isArray(data.spiritualPractices) ? data.spiritualPractices : [];
        const newBeliefs = Array.isArray(data.coreBeliefShifts) ? data.coreBeliefShifts : [];

        const updatedSpiritual = {
          ...existingSpiritual,
          practices: [...newPractices, ...(existingSpiritual.practices || [])],
          coreBeliefShifts: [...newBeliefs, ...(existingSpiritual.coreBeliefShifts || [])],
        };

        const newProgress = Math.min(
          100,
          (goal.progressPercent || 30) + (newReality.length > 0 ? 10 : 0)
        );

        onUpdateGoal(goal.id, {
          realityEvidence: combinedReality,
          spiritualManifestation: updatedSpiritual,
          manifestationNarrative:
            data.manifestationNarrative || goal.manifestationNarrative,
          progressPercent: newProgress,
        });
      }
    } catch (e) {
      console.error('Failed to sync goal insights with AI', e);
    } finally {
      setExtractingGoalId(null);
    }
  };

  // Add Manual Reality Evidence
  const handleAddManualEvidence = (goal: Goal) => {
    const text = newEvidenceInputs[goal.id]?.trim();
    const action = newActionInputs[goal.id]?.trim();
    if (!text) return;

    const newEv = {
      id: `ev-${Date.now()}`,
      text,
      date: new Date().toISOString().split('T')[0],
      actionTaken: action || '日常行动',
    };

    const existing = goal.realityEvidence || [];
    onUpdateGoal(goal.id, {
      realityEvidence: [newEv, ...existing],
      evidence: [text, ...(goal.evidence || [])],
      progressPercent: Math.min(100, (goal.progressPercent || 40) + 5),
    });

    setNewEvidenceInputs({ ...newEvidenceInputs, [goal.id]: '' });
    setNewActionInputs({ ...newActionInputs, [goal.id]: '' });
  };

  // Add Manual Spiritual Practice
  const handleAddManualSpiritual = (goal: Goal) => {
    const input = newSpiritualInputs[goal.id] || { title: '', detail: '', type: 'candle' };
    if (!input.title.trim()) return;

    const newPractice: GoalSpiritualPractice = {
      id: `sp-${Date.now()}`,
      type: (input.type as any) || 'candle',
      title: input.title,
      detail: input.detail || input.title,
      date: new Date().toISOString().split('T')[0],
    };

    const existing = goal.spiritualManifestation || {};
    const updated = {
      ...existing,
      practices: [newPractice, ...(existing.practices || [])],
    };

    onUpdateGoal(goal.id, {
      spiritualManifestation: updated,
    });

    setNewSpiritualInputs({
      ...newSpiritualInputs,
      [goal.id]: { title: '', detail: '', type: 'candle' },
    });
  };

  // Add Manual Belief Shift
  const handleAddManualBelief = (goal: Goal) => {
    const input = newBeliefInputs[goal.id] || { oldB: '', newB: '', insight: '' };
    if (!input.oldB.trim() || !input.newB.trim()) return;

    const newShift: GoalBeliefShift = {
      id: `bs-${Date.now()}`,
      oldBelief: input.oldB,
      newBelief: input.newB,
      insight: input.insight || '完成心理模式松绑与升级',
      date: new Date().toISOString().split('T')[0],
    };

    const existing = goal.spiritualManifestation || {};
    const updated = {
      ...existing,
      coreBeliefShifts: [newShift, ...(existing.coreBeliefShifts || [])],
    };

    onUpdateGoal(goal.id, {
      spiritualManifestation: updated,
    });

    setNewBeliefInputs({
      ...newBeliefInputs,
      [goal.id]: { oldB: '', newB: '', insight: '' },
    });
  };

  // Open Archive & Trophy Modal
  const openArchiveModal = (goal: Goal) => {
    setArchivingGoal(goal);
    setTrophyForm({
      title: `🌟 ${goal.title} · 显化荣耀奖杯`,
      citation: `恭喜你！在持续的踏实交付与灵性确信中，成功达成了目标「${goal.title}」，为人生建立了坚实的现实与心智基石！`,
      icon: '🏆',
      type: 'trophy',
      personalReward: '给自己一份心仪的礼物或一次深度的身心放松犒劳',
    });
  };

  // Confirm Archive & Generate Trophy
  const handleConfirmArchive = () => {
    if (!archivingGoal) return;
    const trophy: GoalTrophy = {
      type: trophyForm.type,
      title: trophyForm.title || `${archivingGoal.title} 成就奖杯`,
      citation: trophyForm.citation,
      completedDate: new Date().toISOString().split('T')[0],
      icon: trophyForm.icon || '🏆',
      personalReward: trophyForm.personalReward || '自我肯定与犒劳',
    };

    onUpdateGoal(archivingGoal.id, {
      status: 'archived',
      progressPercent: 100,
      archivedAt: new Date().toISOString().split('T')[0],
      trophy,
    });

    setArchivingGoal(null);
  };

  // Vision Modal Handlers
  const openCreateVisionModal = () => {
    setEditingVision(null);
    setVisionForm({
      title: '',
      statement: '',
      category: 'career',
    });
    setShowVisionModal(true);
  };

  const openEditVisionModal = (v: Vision) => {
    setEditingVision(v);
    setVisionForm({
      title: v.title,
      statement: v.statement,
      category: (v.category as LifeArea) || 'career',
    });
    setShowVisionModal(true);
  };

  const handleSaveVision = (e: React.FormEvent) => {
    e.preventDefault();
    if (!visionForm.title.trim()) return;

    if (editingVision && onUpdateVision) {
      onUpdateVision(editingVision.id, {
        title: visionForm.title,
        statement: visionForm.statement,
        category: visionForm.category,
      });
    } else {
      const newV: Vision = {
        id: `v-${Date.now()}`,
        title: visionForm.title,
        statement: visionForm.statement,
        category: visionForm.category,
        createdAt: new Date().toISOString().split('T')[0],
      };
      onAddVision(newV);
    }

    setShowVisionModal(false);
    setEditingVision(null);
  };

  return (
    <div className="max-w-7xl mx-auto px-2 sm:px-4 md:px-6 py-2.5 sm:py-5 space-y-3 sm:space-y-4">
      {/* Top Banner */}
      <div className="p-3 sm:p-4 rounded-2xl bg-[#F4EFE6] border border-[#E7E0D3] flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-amber-100 text-amber-900 flex items-center justify-center shrink-0">
            <Compass className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div>
            <h2 className="text-xs sm:text-sm md:text-base font-semibold text-[#2E2A24]">
              🧭 愿景、原则与显化目标
            </h2>
            <p className="text-[10px] sm:text-xs text-[#70695D] line-clamp-1">
              现实行动 · 碎碎念证据 · 灵性仪式 · 心理信念
            </p>
          </div>
        </div>

        {/* Tab Switchers */}
        <div className="flex items-center gap-1 bg-[#EBE4D7] p-1 rounded-xl overflow-x-auto no-scrollbar max-w-full">
          <button
            onClick={() => setActiveTab('goals')}
            className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
              activeTab === 'goals'
                ? 'bg-[#FAF8F5] text-[#2E2A24] shadow-xs font-semibold'
                : 'text-[#6B6457] hover:text-[#2E2A24]'
            }`}
          >
            🎯 目标与显化 ({activeGoals.length})
          </button>
          <button
            onClick={() => setActiveTab('trophies')}
            className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
              activeTab === 'trophies'
                ? 'bg-[#FAF8F5] text-[#2E2A24] shadow-xs font-semibold'
                : 'text-[#6B6457] hover:text-[#2E2A24]'
            }`}
          >
            🏆 荣耀成就 ({archivedGoals.length})
          </button>
          <button
            onClick={() => setActiveTab('principles')}
            className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
              activeTab === 'principles'
                ? 'bg-[#FAF8F5] text-[#2E2A24] shadow-xs font-semibold'
                : 'text-[#6B6457] hover:text-[#2E2A24]'
            }`}
          >
            🛡️ 原则体系 ({principles.length})
          </button>
          <button
            onClick={() => setActiveTab('visions')}
            className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
              activeTab === 'visions'
                ? 'bg-[#FAF8F5] text-[#2E2A24] shadow-xs font-semibold'
                : 'text-[#6B6457] hover:text-[#2E2A24]'
            }`}
          >
            🌟 长期愿景 ({visions.length})
          </button>
        </div>
      </div>

      {/* TAB 1: GOALS & MANIFESTATION */}
      {activeTab === 'goals' && (
        <div className="space-y-2.5 sm:space-y-3">
          {/* Controls Bar & Goal Switcher */}
          <div className="p-2.5 sm:p-3 rounded-2xl bg-[#FAF8F5] border border-[#E9E4DC] shadow-xs flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1 bg-[#EFEAE0] p-0.5 sm:p-1 rounded-xl overflow-x-auto no-scrollbar">
              {[
                { id: 'all' as const, label: '全部' },
                { id: 'short_term' as const, label: '⚡ 短期推进' },
                { id: 'long_term' as const, label: '🏔️ 长期支柱' },
              ].map((filter) => (
                <button
                  key={filter.id}
                  onClick={() => setGoalSubFilter(filter.id)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] sm:text-xs font-medium transition-colors whitespace-nowrap ${
                    goalSubFilter === filter.id
                      ? 'bg-[#FAF8F5] text-[#2E2A24] shadow-xs font-semibold'
                      : 'text-[#7A7264] hover:text-[#2E2A24]'
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>

            <button
              onClick={openCreateGoalModal}
              className="px-3 py-1.5 rounded-xl bg-[#2E2A24] hover:bg-[#433D35] text-[#FAF8F5] text-xs font-medium flex items-center justify-center gap-1 transition-colors shadow-xs"
            >
              <Plus className="w-3.5 h-3.5 text-amber-300" />
              <span>新建目标</span>
            </button>
          </div>

          {/* Quick Horizontal Goal Selector for Fast Navigation */}
          {displayedActiveGoals.length > 1 && (
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
              {displayedActiveGoals.map((g) => {
                const isSelected = expandedGoalId === g.id;
                return (
                  <button
                    key={g.id}
                    onClick={() => setExpandedGoalId(g.id)}
                    className={`px-2.5 py-1 rounded-xl text-[11px] sm:text-xs font-medium whitespace-nowrap flex items-center gap-1.5 transition-all shrink-0 ${
                      isSelected
                        ? 'bg-[#2E2A24] text-[#FAF8F5] shadow-xs font-semibold'
                        : 'bg-[#FAF8F5] text-[#5C5548] border border-[#E9E4DC] hover:border-[#D8CFBF]'
                    }`}
                  >
                    <span>{g.type === 'short_term' ? '⚡' : '🏔️'}</span>
                    <span className="truncate max-w-[110px] sm:max-w-[180px]">{g.title}</span>
                    <span className="text-[10px] font-mono opacity-80">{g.progressPercent || 0}%</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Goals List */}
          <div className="space-y-2.5 sm:space-y-3">
            {displayedActiveGoals.length === 0 ? (
              <div className="p-8 sm:p-12 text-center bg-[#FAF8F5] border border-[#E9E4DC] rounded-2xl space-y-2.5">
                <Target className="w-7 h-7 text-[#A8A093] mx-auto" />
                <p className="text-xs text-[#7A7264]">暂无符合筛选条件的活跃目标</p>
                <button
                  onClick={openCreateGoalModal}
                  className="px-3.5 py-1.5 rounded-xl bg-[#2E2A24] text-white text-xs inline-flex items-center gap-1"
                >
                  <Plus className="w-3 h-3 text-amber-300" />
                  <span>立即新建目标</span>
                </button>
              </div>
            ) : (
              displayedActiveGoals.map((goal) => {
                const isExpanded = expandedGoalId === goal.id;
                const parentLongTerm = goal.parentId
                  ? goals.find((g) => g.id === goal.parentId)
                  : null;
                const parentVision = goal.parentVisionId
                  ? visions.find((v) => v.id === goal.parentVisionId)
                  : null;
                const areaMeta = goal.area ? LIFE_AREAS[goal.area] : null;

                const realityCount =
                  goal.realityEvidence?.length || goal.evidence?.length || 0;
                const spiritualPractices =
                  goal.spiritualManifestation?.practices || [];
                const beliefShifts =
                  goal.spiritualManifestation?.coreBeliefShifts || [];

                const activeSection = goalSubTabs[goal.id] || 'reality';
                const isAddingActive = showAddForm[goal.id] || null;

                return (
                  <div
                    key={goal.id}
                    className="bg-[#FAF8F5] border border-[#E9E4DC] rounded-2xl overflow-hidden shadow-xs hover:border-[#D8CFBF] transition-all"
                  >
                    {/* Goal Header */}
                    <div
                      onClick={() => setExpandedGoalId(isExpanded ? null : goal.id)}
                      className="p-3 sm:p-4 flex items-start justify-between gap-2.5 cursor-pointer select-none bg-[#FCFAF6]"
                    >
                      <div className="space-y-1 flex-1 min-w-0">
                        {/* Tags */}
                        <div className="flex items-center flex-wrap gap-1">
                          <span
                            className={`text-[9px] sm:text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded ${
                              goal.type === 'short_term'
                                ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                : 'bg-indigo-100 text-indigo-900 border border-indigo-300'
                            }`}
                          >
                            {goal.type === 'short_term' ? '⚡ 短期' : '🏔️ 长期'}
                          </span>

                          {areaMeta && (
                            <span className="text-[9px] sm:text-[10px] px-1.5 py-0.5 rounded bg-[#EFEAE0] text-[#5C5548] border border-[#DDD6C8] flex items-center gap-0.5">
                              <span>{areaMeta.emoji}</span>
                              <span>{areaMeta.label}</span>
                            </span>
                          )}

                          {goal.timeframeFuzzy && (
                            <span className="text-[9px] sm:text-[10px] font-mono text-[#7A7264] bg-[#EFEAE0] px-1.5 py-0.5 rounded">
                              ⏱️ {goal.timeframeFuzzy}
                            </span>
                          )}

                          {parentLongTerm && (
                            <span className="text-[9px] sm:text-[10px] text-[#7A7264] truncate max-w-[130px] sm:max-w-[180px]">
                              ➔ {parentLongTerm.title}
                            </span>
                          )}
                          {parentVision && (
                            <span className="text-[9px] sm:text-[10px] text-amber-800 truncate max-w-[130px] sm:max-w-[180px]">
                              ➔ {parentVision.title}
                            </span>
                          )}
                        </div>

                        <h3 className="text-xs sm:text-sm md:text-base font-semibold text-[#2E2A24] leading-snug">
                          {goal.title}
                        </h3>

                        <div className="flex items-center flex-wrap gap-x-2 gap-y-0.5 text-[11px] text-[#6B6457]">
                          <span className="truncate max-w-[200px] sm:max-w-[280px]">
                            👤 {goal.identity}
                          </span>
                          <span>·</span>
                          <span className="text-emerald-700 font-medium whitespace-nowrap">
                            🌱 {realityCount} 证据
                          </span>
                          {spiritualPractices.length > 0 && (
                            <>
                              <span>·</span>
                              <span className="text-purple-700 font-medium whitespace-nowrap">
                                ✨ {spiritualPractices.length} 显化
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Right Progress & Quick Chevron */}
                      <div className="flex items-center gap-2 shrink-0">
                        <div className="text-right">
                          <div className="text-[11px] sm:text-xs font-mono font-bold text-[#2E2A24]">
                            {goal.progressPercent || 0}%
                          </div>
                          <div className="w-12 sm:w-16 bg-[#E8E2D5] h-1.5 rounded-full overflow-hidden mt-0.5">
                            <div
                              className="bg-amber-700 h-full rounded-full transition-all duration-500"
                              style={{ width: `${goal.progressPercent || 0}%` }}
                            ></div>
                          </div>
                        </div>

                        <div className="p-1 rounded-lg hover:bg-[#EAE4D8] text-[#7A7264]">
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </div>
                      </div>
                    </div>

                    {/* Expanded Goal Details */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="px-3 sm:px-4 pb-4 pt-1 border-t border-[#EFE9DF] space-y-2.5"
                        >
                          {/* Top Action Toolbar inside Goal Card */}
                          <div className="flex flex-wrap items-center justify-between gap-1.5 p-2 rounded-xl bg-[#F4EFE6] border border-[#E5DFD2]">
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => handleAiSyncInsights(goal)}
                                disabled={extractingGoalId === goal.id}
                                className="px-2.5 py-1 rounded-lg bg-[#2E2A24] hover:bg-[#433D35] text-white text-[11px] sm:text-xs font-medium flex items-center gap-1 transition-colors disabled:opacity-50 shadow-xs"
                              >
                                {extractingGoalId === goal.id ? (
                                  <RefreshCw className="w-3 h-3 animate-spin" />
                                ) : (
                                  <Sparkles className="w-3 h-3 text-amber-300" />
                                )}
                                <span>AI 从日常提炼证据与显化</span>
                              </button>
                            </div>

                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => openArchiveModal(goal)}
                                className="px-2.5 py-1 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-[11px] sm:text-xs font-medium flex items-center gap-1 transition-colors shadow-xs"
                              >
                                <Award className="w-3 h-3 text-amber-300" />
                                <span>完成归档</span>
                              </button>
                              <button
                                onClick={() => openEditGoalModal(goal)}
                                className="p-1.5 rounded-lg text-[#6E6659] hover:text-[#2E2A24] hover:bg-[#EAE3D6]"
                                title="编辑目标设置"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => {
                                  if (confirm(`确定删除目标“${goal.title}”吗？`)) {
                                    onDeleteGoal(goal.id);
                                  }
                                }}
                                className="p-1.5 rounded-lg text-[#8C8477] hover:text-rose-600 hover:bg-rose-50"
                                title="删除目标"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* 4 Pillars Matrix - Ultra Compact 2x2 Grid */}
                          <div className="grid grid-cols-2 gap-1.5 text-xs">
                            <div className="p-2 rounded-xl bg-[#F6F2EA] border border-[#E8E2D6] space-y-0.5">
                              <span className="text-[10px] font-semibold text-[#7A7264] flex items-center gap-1">
                                <span>🌱 现实交付 (Reality)</span>
                              </span>
                              <p className="text-[11px] text-[#2E2A24] leading-snug line-clamp-2" title={goal.reality}>
                                {goal.reality || '日常持续交付与业务推进'}
                              </p>
                            </div>

                            <div className="p-2 rounded-xl bg-[#F6F2EA] border border-[#E8E2D6] space-y-0.5">
                              <span className="text-[10px] font-semibold text-[#7A7264] flex items-center gap-1">
                                <span>💡 内在动力 (Why)</span>
                              </span>
                              <p className="text-[11px] text-[#2E2A24] leading-snug line-clamp-2" title={goal.why}>
                                {goal.why || '获得内在力量与从容自主'}
                              </p>
                            </div>

                            <div className="p-2 rounded-xl bg-[#F6F2EA] border border-[#E8E2D6] space-y-0.5">
                              <span className="text-[10px] font-semibold text-[#7A7264] flex items-center gap-1">
                                <span>👤 身份认同 (Identity)</span>
                              </span>
                              <p className="text-[11px] text-[#2E2A24] font-medium leading-snug line-clamp-2" title={goal.identity}>
                                {goal.identity || '我正在成为能够独立创造价值的人'}
                              </p>
                            </div>

                            <div className="p-2 rounded-xl bg-[#F6F2EA] border border-[#E8E2D6] space-y-0.5">
                              <span className="text-[10px] font-semibold text-[#7A7264] flex items-center gap-1">
                                <span>🛡️ 核心信念 (Core Belief)</span>
                              </span>
                              <p className="text-[11px] text-[#2E2A24] font-medium leading-snug line-clamp-2" title={goal.coreBelief}>
                                {goal.coreBelief || '我不需要通过痛苦证明自己的价值'}
                              </p>
                            </div>
                          </div>

                          {/* Manifestation Narrative Whisper */}
                          {goal.manifestationNarrative && (
                            <div className="p-2 rounded-xl bg-gradient-to-r from-amber-50/90 to-orange-50/60 border border-amber-200/80 text-[11px] text-amber-950 flex items-start gap-1.5">
                              <Sparkles className="w-3.5 h-3.5 text-amber-700 shrink-0 mt-0.5" />
                              <p className="italic leading-snug">
                                <span className="font-semibold not-italic text-amber-900 mr-1">显化共振:</span>
                                "{goal.manifestationNarrative}"
                              </p>
                            </div>
                          )}

                          {/* SUB-TABS SEGMENTED CONTROL: Reality Evidence vs Spiritual Rituals vs Belief Shifts */}
                          <div className="space-y-2">
                            <div className="flex items-center gap-1 bg-[#EBE4D7] p-1 rounded-xl text-xs overflow-x-auto no-scrollbar">
                              <button
                                onClick={() =>
                                  setGoalSubTabs({ ...goalSubTabs, [goal.id]: 'reality' })
                                }
                                className={`flex-1 min-w-max px-2.5 py-1 rounded-lg text-[11px] sm:text-xs font-medium transition-all flex items-center justify-center gap-1 ${
                                  activeSection === 'reality'
                                    ? 'bg-[#FAF8F5] text-[#2E2A24] font-semibold shadow-xs'
                                    : 'text-[#6B6457] hover:text-[#2E2A24]'
                                }`}
                              >
                                <span>🌱 现实证据</span>
                                <span className="text-[10px] font-mono opacity-80">({realityCount})</span>
                              </button>

                              <button
                                onClick={() =>
                                  setGoalSubTabs({ ...goalSubTabs, [goal.id]: 'spiritual' })
                                }
                                className={`flex-1 min-w-max px-2.5 py-1 rounded-lg text-[11px] sm:text-xs font-medium transition-all flex items-center justify-center gap-1 ${
                                  activeSection === 'spiritual'
                                    ? 'bg-[#FAF8F5] text-[#2E2A24] font-semibold shadow-xs'
                                    : 'text-[#6B6457] hover:text-[#2E2A24]'
                                }`}
                              >
                                <span>🕯️ 显化仪式</span>
                                <span className="text-[10px] font-mono opacity-80">({spiritualPractices.length})</span>
                              </button>

                              <button
                                onClick={() =>
                                  setGoalSubTabs({ ...goalSubTabs, [goal.id]: 'beliefs' })
                                }
                                className={`flex-1 min-w-max px-2.5 py-1 rounded-lg text-[11px] sm:text-xs font-medium transition-all flex items-center justify-center gap-1 ${
                                  activeSection === 'beliefs'
                                    ? 'bg-[#FAF8F5] text-[#2E2A24] font-semibold shadow-xs'
                                    : 'text-[#6B6457] hover:text-[#2E2A24]'
                                }`}
                              >
                                <span>🧠 信念重构</span>
                                <span className="text-[10px] font-mono opacity-80">({beliefShifts.length})</span>
                              </button>
                            </div>

                            {/* SUB-TAB PANEL: REALITY EVIDENCE */}
                            {activeSection === 'reality' && (
                              <div className="p-2.5 rounded-xl bg-[#F8F5EE] border border-[#E8E1D4] space-y-2 text-xs">
                                <div className="max-h-[160px] sm:max-h-[200px] overflow-y-auto no-scrollbar space-y-1.5">
                                  {goal.realityEvidence && goal.realityEvidence.length > 0 ? (
                                    goal.realityEvidence.map((ev) => (
                                      <div
                                        key={ev.id}
                                        className="p-2 rounded-lg bg-white border border-[#EAE3D6] text-xs space-y-0.5"
                                      >
                                        <div className="flex items-center justify-between text-[10px]">
                                          <span className="font-semibold text-emerald-800 flex items-center gap-1">
                                            <span>✓ 行动落地:</span>
                                            <span className="px-1 py-0.2 rounded bg-emerald-50 border border-emerald-200">
                                              {ev.actionTaken || '日常交付'}
                                            </span>
                                          </span>
                                          <span className="text-[#8C8477] font-mono">{ev.date}</span>
                                        </div>
                                        <p className="text-[#2E2A24] text-[11px] leading-snug">{ev.text}</p>
                                      </div>
                                    ))
                                  ) : goal.evidence && goal.evidence.length > 0 ? (
                                    goal.evidence.map((evi, idx) => (
                                      <div
                                        key={idx}
                                        className="p-1.5 rounded-lg bg-white border border-[#EAE3D6] text-[11px] text-[#3D372E] flex items-start gap-1.5"
                                      >
                                        <span className="text-emerald-700 font-bold">✓</span>
                                        <span className="flex-1 leading-snug">{evi}</span>
                                      </div>
                                    ))
                                  ) : (
                                    <p className="text-[11px] text-[#999083] py-1.5 text-center">
                                      暂无现实证据，点击下方快速补充或使用 AI 提炼。
                                    </p>
                                  )}
                                </div>

                                {/* Quick Add Reality Evidence Form */}
                                {isAddingActive === 'reality' ? (
                                  <div className="pt-1.5 border-t border-[#EAE3D6] flex flex-col sm:flex-row gap-1.5">
                                    <input
                                      type="text"
                                      value={newEvidenceInputs[goal.id] || ''}
                                      onChange={(e) =>
                                        setNewEvidenceInputs({
                                          ...newEvidenceInputs,
                                          [goal.id]: e.target.value,
                                        })
                                      }
                                      placeholder="输入今日新发现的现实证据/成果..."
                                      className="flex-1 text-[11px] px-2.5 py-1.5 rounded-lg bg-white border border-[#DDD6C8] focus:outline-none focus:border-[#2E2A24]"
                                    />
                                    <input
                                      type="text"
                                      value={newActionInputs[goal.id] || ''}
                                      onChange={(e) =>
                                        setNewActionInputs({
                                          ...newActionInputs,
                                          [goal.id]: e.target.value,
                                        })
                                      }
                                      placeholder="对应行动 (如: 直播2h)"
                                      className="w-full sm:w-36 text-[11px] px-2.5 py-1.5 rounded-lg bg-white border border-[#DDD6C8] focus:outline-none focus:border-[#2E2A24]"
                                    />
                                    <div className="flex items-center gap-1">
                                      <button
                                        onClick={() => {
                                          handleAddManualEvidence(goal);
                                          setShowAddForm({ ...showAddForm, [goal.id]: null });
                                        }}
                                        className="px-3 py-1.5 rounded-lg bg-[#2E2A24] text-white text-[11px] font-medium whitespace-nowrap"
                                      >
                                        添加
                                      </button>
                                      <button
                                        onClick={() =>
                                          setShowAddForm({ ...showAddForm, [goal.id]: null })
                                        }
                                        className="px-2 py-1.5 text-[#8C8477] text-[11px]"
                                      >
                                        取消
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="pt-1 border-t border-[#EAE3D6] flex justify-end">
                                    <button
                                      onClick={() =>
                                        setShowAddForm({ ...showAddForm, [goal.id]: 'reality' })
                                      }
                                      className="text-[11px] font-medium text-emerald-800 hover:text-emerald-950 flex items-center gap-1"
                                    >
                                      <Plus className="w-3 h-3" />
                                      <span>记录一条现实证据</span>
                                    </button>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* SUB-TAB PANEL: SPIRITUAL RITUALS */}
                            {activeSection === 'spiritual' && (
                              <div className="p-2.5 rounded-xl bg-[#F8F5EE] border border-[#E8E1D4] space-y-2 text-xs">
                                <div className="max-h-[160px] sm:max-h-[200px] overflow-y-auto no-scrollbar space-y-1.5">
                                  {spiritualPractices.length > 0 ? (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                                      {spiritualPractices.map((prac) => (
                                        <div
                                          key={prac.id}
                                          className="p-2 rounded-lg bg-white border border-[#EAE3D6] text-xs space-y-0.5"
                                        >
                                          <div className="flex items-center justify-between text-[9px]">
                                            <span className="font-semibold text-purple-900 bg-purple-50 px-1.5 py-0.2 rounded border border-purple-200">
                                              {prac.type === 'candle' && '🕯️ 点燃蜡烛'}
                                              {prac.type === 'ritual' && '🌿 仪式许愿'}
                                              {prac.type === 'visualization' && '👁️ 视觉化'}
                                              {prac.type === 'affirmation' && '✨ 肯定语'}
                                              {prac.type === 'angel_number' && '🔢 天使数字'}
                                            </span>
                                            <span className="text-[#8C8477] font-mono">{prac.date}</span>
                                          </div>
                                          <h5 className="font-semibold text-[#2E2A24] text-[11px] leading-snug">{prac.title}</h5>
                                          <p className="text-[10px] text-[#696154] leading-snug line-clamp-2">
                                            {prac.detail}
                                          </p>
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <p className="text-[11px] text-[#999083] py-1.5 text-center">
                                      暂无仪式记录，可在日常日记提及或下方快速添加。
                                    </p>
                                  )}
                                </div>

                                {/* Quick Add Spiritual Form */}
                                {isAddingActive === 'spiritual' ? (
                                  <div className="pt-1.5 border-t border-[#EAE3D6] flex flex-col sm:flex-row gap-1.5">
                                    <select
                                      value={newSpiritualInputs[goal.id]?.type || 'candle'}
                                      onChange={(e) =>
                                        setNewSpiritualInputs({
                                          ...newSpiritualInputs,
                                          [goal.id]: {
                                            ...(newSpiritualInputs[goal.id] || {
                                              title: '',
                                              detail: '',
                                              type: 'candle',
                                            }),
                                            type: e.target.value,
                                          },
                                        })
                                      }
                                      className="px-2 py-1 rounded-lg bg-white border border-[#DDD6C8] text-[11px] text-[#2E2A24]"
                                    >
                                      <option value="candle">🕯️ 点燃蜡烛</option>
                                      <option value="ritual">🌿 仪式许愿</option>
                                      <option value="visualization">👁️ 冥想视觉化</option>
                                      <option value="affirmation">✨ 肯定语</option>
                                      <option value="angel_number">🔢 天使数字</option>
                                    </select>
                                    <input
                                      type="text"
                                      value={newSpiritualInputs[goal.id]?.title || ''}
                                      onChange={(e) =>
                                        setNewSpiritualInputs({
                                          ...newSpiritualInputs,
                                          [goal.id]: {
                                            ...(newSpiritualInputs[goal.id] || {
                                              title: '',
                                              detail: '',
                                              type: 'candle',
                                            }),
                                            title: e.target.value,
                                          },
                                        })
                                      }
                                      placeholder="仪式名称 (如: 点燃丰盛蜡烛并许愿)"
                                      className="flex-1 text-[11px] px-2.5 py-1 rounded-lg bg-white border border-[#DDD6C8]"
                                    />
                                    <div className="flex items-center gap-1">
                                      <button
                                        onClick={() => {
                                          handleAddManualSpiritual(goal);
                                          setShowAddForm({ ...showAddForm, [goal.id]: null });
                                        }}
                                        className="px-3 py-1 rounded-lg bg-purple-700 hover:bg-purple-800 text-white text-[11px] font-medium whitespace-nowrap"
                                      >
                                        记录
                                      </button>
                                      <button
                                        onClick={() =>
                                          setShowAddForm({ ...showAddForm, [goal.id]: null })
                                        }
                                        className="px-2 py-1 text-[#8C8477] text-[11px]"
                                      >
                                        取消
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="pt-1 border-t border-[#EAE3D6] flex justify-end">
                                    <button
                                      onClick={() =>
                                        setShowAddForm({ ...showAddForm, [goal.id]: 'spiritual' })
                                      }
                                      className="text-[11px] font-medium text-purple-800 hover:text-purple-950 flex items-center gap-1"
                                    >
                                      <Plus className="w-3 h-3" />
                                      <span>记录一次仪式显化</span>
                                    </button>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* SUB-TAB PANEL: BELIEF SHIFTS */}
                            {activeSection === 'beliefs' && (
                              <div className="p-2.5 rounded-xl bg-[#F8F5EE] border border-[#E8E1D4] space-y-2 text-xs">
                                <div className="max-h-[160px] sm:max-h-[200px] overflow-y-auto no-scrollbar space-y-1.5">
                                  {beliefShifts.length > 0 ? (
                                    beliefShifts.map((shift) => (
                                      <div
                                        key={shift.id}
                                        className="p-2 rounded-lg bg-white border border-[#EAE3D6] text-xs space-y-1"
                                      >
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs">
                                          <div className="p-1.5 rounded-md bg-rose-50 border border-rose-200">
                                            <span className="text-[9px] text-rose-800 font-semibold block">
                                              ⚠️ 觉察到的旧限制信念:
                                            </span>
                                            <p className="text-rose-950 text-[11px] mt-0.5 leading-snug">{shift.oldBelief}</p>
                                          </div>
                                          <div className="p-1.5 rounded-md bg-emerald-50 border border-emerald-200">
                                            <span className="text-[9px] text-emerald-800 font-semibold block">
                                              ✨ 重塑的新赋能信念:
                                            </span>
                                            <p className="text-emerald-950 text-[11px] font-medium mt-0.5 leading-snug">
                                              {shift.newBelief}
                                            </p>
                                          </div>
                                        </div>
                                        {shift.insight && (
                                          <p className="text-[10px] text-[#6E6658] italic pt-0.5">
                                            💡 转化洞察: {shift.insight}
                                          </p>
                                        )}
                                      </div>
                                    ))
                                  ) : (
                                    <p className="text-[11px] text-[#999083] py-1.5 text-center">
                                      尚未记录信念模式，通过日常记录与 AI 提炼可自动识别旧模式并重构。
                                    </p>
                                  )}
                                </div>

                                {/* Quick Add Belief Shift Form */}
                                {isAddingActive === 'beliefs' ? (
                                  <div className="pt-1.5 border-t border-[#EAE3D6] space-y-1.5">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                                      <input
                                        type="text"
                                        value={newBeliefInputs[goal.id]?.oldB || ''}
                                        onChange={(e) =>
                                          setNewBeliefInputs({
                                            ...newBeliefInputs,
                                            [goal.id]: {
                                              ...(newBeliefInputs[goal.id] || {
                                                oldB: '',
                                                newB: '',
                                                insight: '',
                                              }),
                                              oldB: e.target.value,
                                            },
                                          })
                                        }
                                        placeholder="旧限制信念 (如: 必须受苦才配赚钱)"
                                        className="text-[11px] px-2.5 py-1 rounded-lg bg-white border border-[#DDD6C8]"
                                      />
                                      <input
                                        type="text"
                                        value={newBeliefInputs[goal.id]?.newB || ''}
                                        onChange={(e) =>
                                          setNewBeliefInputs({
                                            ...newBeliefInputs,
                                            [goal.id]: {
                                              ...(newBeliefInputs[goal.id] || {
                                                oldB: '',
                                                newB: '',
                                                insight: '',
                                              }),
                                              newB: e.target.value,
                                            },
                                          })
                                        }
                                        placeholder="新赋能信念 (如: 金钱是创造价值的流动)"
                                        className="text-[11px] px-2.5 py-1 rounded-lg bg-white border border-[#DDD6C8]"
                                      />
                                    </div>
                                    <div className="flex items-center justify-end gap-1">
                                      <button
                                        onClick={() => {
                                          handleAddManualBelief(goal);
                                          setShowAddForm({ ...showAddForm, [goal.id]: null });
                                        }}
                                        className="px-3 py-1 rounded-lg bg-[#2E2A24] text-white text-[11px] font-medium"
                                      >
                                        记录信念升级
                                      </button>
                                      <button
                                        onClick={() =>
                                          setShowAddForm({ ...showAddForm, [goal.id]: null })
                                        }
                                        className="px-2 py-1 text-[#8C8477] text-[11px]"
                                      >
                                        取消
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="pt-1 border-t border-[#EAE3D6] flex justify-end">
                                    <button
                                      onClick={() =>
                                        setShowAddForm({ ...showAddForm, [goal.id]: 'beliefs' })
                                      }
                                      className="text-[11px] font-medium text-[#2E2A24] hover:underline flex items-center gap-1"
                                    >
                                      <Plus className="w-3 h-3" />
                                      <span>记录一条信念升级</span>
                                    </button>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* TAB 2: TROPHIES & ARCHIVED HALL OF FAME */}
      {activeTab === 'trophies' && (
        <div className="space-y-4">
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-[#2E2A24] to-[#433D35] text-[#FAF8F5] shadow-xs flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-400/20 text-amber-300 flex items-center justify-center border border-amber-400/30">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-sm sm:text-base text-[#FAF8F5]">
                  🏆 荣耀成就殿堂 · 显化奖杯与奖状
                </h3>
                <p className="text-xs text-[#D8D1C5] mt-0.5">
                  所有已达成并归档的目标在此留存，记录你的坚韧、成长与犒劳见证。
                </p>
              </div>
            </div>
          </div>

          {archivedGoals.length === 0 ? (
            <div className="p-12 text-center bg-[#FAF8F5] border border-[#E9E4DC] rounded-2xl space-y-3">
              <Award className="w-10 h-10 text-[#A8A093] mx-auto" />
              <p className="text-xs text-[#7A7264]">暂无归档奖杯，完成目标后点击「完成归档」即可生成属于你的荣誉证书！</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {archivedGoals.map((g) => {
                const trophy = g.trophy || {
                  type: 'trophy',
                  title: `${g.title} 显化奖杯`,
                  citation: '恭喜你！圆满达成目标！',
                  completedDate: g.archivedAt || '2026-08-15',
                  icon: '🏆',
                  personalReward: '自我肯定与成长见证',
                };

                return (
                  <div
                    key={g.id}
                    className="p-5 rounded-2xl bg-[#FAF8F5] border-2 border-amber-200/80 shadow-md space-y-3 relative overflow-hidden"
                  >
                    <div className="absolute -right-4 -top-4 w-20 h-20 bg-amber-100/50 rounded-full blur-lg pointer-events-none"></div>

                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <span className="text-3xl">{trophy.icon || '🏆'}</span>
                        <div>
                          <span className="text-[10px] font-mono uppercase tracking-wider text-amber-900 font-bold">
                            {trophy.type === 'certificate' ? '📜 荣誉显化证书' : '🌟 专属荣耀奖杯'}
                          </span>
                          <h4 className="font-bold text-sm sm:text-base text-[#2E2A24]">
                            {trophy.title}
                          </h4>
                        </div>
                      </div>

                      <span className="text-[10px] font-mono text-[#8C8477] bg-[#EFEAE0] px-2 py-0.5 rounded">
                        达成于 {trophy.completedDate}
                      </span>
                    </div>

                    <p className="text-xs text-[#4A4337] italic leading-relaxed bg-[#F7F3EA] p-3 rounded-xl border border-[#E9E2D4]">
                      "{trophy.citation}"
                    </p>

                    {trophy.personalReward && (
                      <div className="flex items-center gap-2 text-xs text-amber-950 font-medium bg-amber-50/80 p-2.5 rounded-xl border border-amber-200">
                        <Gift className="w-4 h-4 text-amber-700 shrink-0" />
                        <span>个人犒劳: {trophy.personalReward}</span>
                      </div>
                    )}

                    <div className="pt-2 border-t border-[#F0EBE2] flex items-center justify-between text-[11px] text-[#8C8477]">
                      <span>原目标: {g.title}</span>
                      <button
                        onClick={() => {
                          onUpdateGoal(g.id, { status: 'active' });
                        }}
                        className="text-xs text-amber-900 hover:underline"
                      >
                        重新激活目标
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: LIFE PRINCIPLES (只能通过与 AI 导师对话生成或改变) */}
      {activeTab === 'principles' && (
        <div className="space-y-4">
          <div className="p-4 sm:p-5 rounded-2xl bg-[#FAF8F5] border border-[#E9E4DC] shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#F0EBE2]">
              <div>
                <h3 className="text-sm sm:text-base font-semibold text-[#2E2A24] flex items-center gap-2">
                  <Shield className="w-4 h-4 text-amber-700" />
                  <span>人生原则体系 (Life Principles)</span>
                </h3>
                <p className="text-xs text-[#7A7264] mt-0.5">
                  原则由日常记录与 AI 导师对话沉淀生成，只能在「AI 导师」对话中研讨、演化与确认，不可随意凭空增删。
                </p>
              </div>

              {onOpenMentorPrinciples && (
                <button
                  onClick={onOpenMentorPrinciples}
                  className="px-4 py-2 rounded-xl bg-[#2E2A24] hover:bg-[#433D35] text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
                >
                  <MessageSquare className="w-3.5 h-3.5 text-amber-300" />
                  <span>与 AI 导师对话生成/演化原则</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {principles.map((principle) => (
                <div
                  key={principle.id}
                  className="p-5 rounded-2xl bg-[#F7F4EE] border border-[#E8E2D6] space-y-2.5 shadow-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-[#EFEAE0] text-[#7A7264]">
                      {principle.category}
                    </span>
                    <Shield className="w-3.5 h-3.5 text-amber-700" />
                  </div>
                  <h4 className="text-sm font-semibold text-[#2E2A24] leading-snug">
                    "{principle.statement}"
                  </h4>
                  <p className="text-xs text-[#6B6457] leading-relaxed pt-1 border-t border-[#EAE3D6]">
                    {principle.why}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: LONG-TERM VISIONS (可修改) */}
      {activeTab === 'visions' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-[#7A7264]">
              愿景回答：“我想成为谁？我想过怎样的人生？” 支持自由修改、编辑与新增，作为所有长期目标的总导向。
            </p>
            <button
              onClick={openCreateVisionModal}
              className="px-3 py-1.5 rounded-xl bg-[#2E2A24] hover:bg-[#433D35] text-[#FAF8F5] text-xs font-medium flex items-center gap-1 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>新建长期愿景</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {visions.map((vis) => (
              <div
                key={vis.id}
                className="p-5 rounded-2xl bg-[#FAF8F5] border border-[#E9E4DC] space-y-3 shadow-xs flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm sm:text-base font-semibold text-[#2E2A24] flex items-center gap-1.5">
                      <Star className="w-4 h-4 text-amber-500 fill-amber-400" />
                      <span>{vis.title}</span>
                    </h3>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEditVisionModal(vis)}
                        className="p-1 text-[#7A7264] hover:text-[#2E2A24] rounded-lg hover:bg-[#EAE4D8]"
                        title="修改此愿景"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      {onDeleteVision && (
                        <button
                          onClick={() => {
                            if (confirm(`确定删除愿景“${vis.title}”吗？`)) {
                              onDeleteVision(vis.id);
                            }
                          }}
                          className="p-1 text-[#8C8477] hover:text-rose-600 rounded-lg hover:bg-rose-50"
                          title="删除"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  <p className="text-xs text-[#5C5548] leading-relaxed">{vis.statement}</p>
                </div>

                <div className="pt-2 border-t border-[#F0EBE2] flex items-center justify-between text-[11px] text-[#8C8477]">
                  <span className="font-mono">领域: {vis.category}</span>
                  <span className="font-mono">{vis.createdAt}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL: CREATE / EDIT GOAL */}
      <AnimatePresence>
        {showGoalModal && (
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-[#FAF8F5] border border-[#E0D8CC] rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between pb-3 border-b border-[#EBE5DB]">
                <h3 className="text-sm sm:text-base font-semibold text-[#2E2A24] flex items-center gap-2">
                  <Target className="w-4 h-4 text-rose-600" />
                  <span>{editingGoalId ? '编辑目标' : '新增目标 (Goal)'}</span>
                </h3>
                <button
                  onClick={() => setShowGoalModal(false)}
                  className="p-1 text-[#8C8477] hover:text-[#2E2A24] rounded-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveGoal} className="space-y-3.5 text-xs">
                {/* Title */}
                <div>
                  <label className="block text-[11px] font-medium text-[#5E584F] mb-1">
                    目标名称 *
                  </label>
                  <input
                    type="text"
                    required
                    value={goalForm.title}
                    onChange={(e) => setGoalForm({ ...goalForm, title: e.target.value })}
                    placeholder="如: 每月收入稳定达到 5000+ / 身体力量训练"
                    className="w-full px-3 py-2 rounded-xl bg-[#F7F4EE] border border-[#DDD6C8] text-xs sm:text-sm text-[#2E2A24] focus:outline-none focus:border-[#2E2A24]"
                  />
                </div>

                {/* Type & Life Area */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-medium text-[#5E584F] mb-1">
                      目标类型
                    </label>
                    <select
                      value={goalForm.type}
                      onChange={(e) =>
                        setGoalForm({
                          ...goalForm,
                          type: e.target.value as 'short_term' | 'long_term',
                        })
                      }
                      className="w-full px-2.5 py-1.5 rounded-xl bg-[#F7F4EE] border border-[#DDD6C8] text-xs text-[#2E2A24]"
                    >
                      <option value="short_term">⚡ 短期推进目标</option>
                      <option value="long_term">🏔️ 长期支柱目标</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-[#5E584F] mb-1">
                      归属人生领域
                    </label>
                    <select
                      value={goalForm.area}
                      onChange={(e) =>
                        setGoalForm({ ...goalForm, area: e.target.value as LifeArea })
                      }
                      className="w-full px-2.5 py-1.5 rounded-xl bg-[#F7F4EE] border border-[#DDD6C8] text-xs text-[#2E2A24]"
                    >
                      {Object.entries(LIFE_AREAS).map(([k, meta]) => (
                        <option key={k} value={k}>
                          {meta.emoji} {meta.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Affiliation (Hierarchy) */}
                {goalForm.type === 'short_term' ? (
                  <div>
                    <label className="block text-[11px] font-medium text-[#5E584F] mb-1">
                      归属长期目标 (短期目标对应长期目标)
                    </label>
                    <select
                      value={goalForm.parentId}
                      onChange={(e) => setGoalForm({ ...goalForm, parentId: e.target.value })}
                      className="w-full px-2.5 py-1.5 rounded-xl bg-[#F7F4EE] border border-[#DDD6C8] text-xs text-[#2E2A24]"
                    >
                      <option value="">-- 无特定长期目标关联 --</option>
                      {longTermGoals.map((lg) => (
                        <option key={lg.id} value={lg.id}>
                          🏔️ {lg.title}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div>
                    <label className="block text-[11px] font-medium text-[#5E584F] mb-1">
                      归属长期愿景 (选填)
                    </label>
                    <select
                      value={goalForm.parentVisionId}
                      onChange={(e) =>
                        setGoalForm({ ...goalForm, parentVisionId: e.target.value })
                      }
                      className="w-full px-2.5 py-1.5 rounded-xl bg-[#F7F4EE] border border-[#DDD6C8] text-xs text-[#2E2A24]"
                    >
                      <option value="">-- 选填：关联核心愿景 --</option>
                      {visions.map((v) => (
                        <option key={v.id} value={v.id}>
                          🌟 {v.title} ({v.statement.slice(0, 20)}...)
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Timeframe Type: Fuzzy vs Exact */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-medium text-[#5E584F]">
                      时间期限设定
                    </label>
                    <div className="flex items-center gap-2">
                      <label className="flex items-center gap-1 cursor-pointer">
                        <input
                          type="radio"
                          name="timeframeType"
                          checked={goalForm.timeframeType === 'fuzzy'}
                          onChange={() => setGoalForm({ ...goalForm, timeframeType: 'fuzzy' })}
                        />
                        <span>模糊时间 (推荐)</span>
                      </label>
                      <label className="flex items-center gap-1 cursor-pointer">
                        <input
                          type="radio"
                          name="timeframeType"
                          checked={goalForm.timeframeType === 'exact'}
                          onChange={() => setGoalForm({ ...goalForm, timeframeType: 'exact' })}
                        />
                        <span>起止日期</span>
                      </label>
                    </div>
                  </div>

                  {goalForm.timeframeType === 'fuzzy' ? (
                    <div className="flex gap-2">
                      {['一个月内', '三个月内', '半年内', '今年年底'].map((f) => (
                        <button
                          type="button"
                          key={f}
                          onClick={() => setGoalForm({ ...goalForm, timeframeFuzzy: f })}
                          className={`flex-1 py-1.5 rounded-xl text-xs border transition-colors ${
                            goalForm.timeframeFuzzy === f
                              ? 'bg-[#2E2A24] text-white border-[#2E2A24]'
                              : 'bg-[#F7F4EE] text-[#5A5347] border-[#DDD6C8]'
                          }`}
                        >
                          {f}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] text-[#7A7264] block mb-0.5">开始日期</label>
                        <input
                          type="date"
                          value={goalForm.startDate}
                          onChange={(e) =>
                            setGoalForm({ ...goalForm, startDate: e.target.value })
                          }
                          className="w-full px-2.5 py-1.5 rounded-xl bg-[#F7F4EE] border border-[#DDD6C8] font-mono text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-[#7A7264] block mb-0.5">结束日期</label>
                        <input
                          type="date"
                          value={goalForm.targetDate}
                          onChange={(e) =>
                            setGoalForm({ ...goalForm, targetDate: e.target.value })
                          }
                          className="w-full px-2.5 py-1.5 rounded-xl bg-[#F7F4EE] border border-[#DDD6C8] font-mono text-xs"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Reality & Identity */}
                <div>
                  <label className="block text-[11px] font-medium text-[#5E584F] mb-1">
                    现实行动 (Reality)
                  </label>
                  <input
                    type="text"
                    value={goalForm.reality}
                    onChange={(e) => setGoalForm({ ...goalForm, reality: e.target.value })}
                    placeholder="如: 每日直播2小时、每周交付蜡烛"
                    className="w-full px-3 py-1.5 rounded-xl bg-[#F7F4EE] border border-[#DDD6C8] text-xs text-[#2E2A24]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-[#5E584F] mb-1">
                    我正在成为谁 (Identity)
                  </label>
                  <input
                    type="text"
                    value={goalForm.identity}
                    onChange={(e) => setGoalForm({ ...goalForm, identity: e.target.value })}
                    placeholder="如: 我正在成为一个能够独立创造价值的人"
                    className="w-full px-3 py-1.5 rounded-xl bg-[#F7F4EE] border border-[#DDD6C8] text-xs text-[#2E2A24]"
                  />
                </div>

                <div className="pt-3 border-t border-[#EBE5DB] flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowGoalModal(false)}
                    className="px-3 py-2 rounded-xl text-xs text-[#7A7264] hover:bg-[#EAE4D8]"
                  >
                    取消
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-[#2E2A24] hover:bg-[#433D35] text-white text-xs font-medium shadow-xs"
                  >
                    {editingGoalId ? '保存修改' : '创建目标'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: ARCHIVE GOAL & CELEBRATION TROPHY / CERTIFICATE */}
      <AnimatePresence>
        {archivingGoal && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-[#FAF8F5] border-2 border-amber-300 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto relative"
            >
              <div className="text-center space-y-1">
                <span className="text-4xl">🏆</span>
                <h3 className="text-base sm:text-lg font-bold text-[#2E2A24]">
                  铸就荣耀 · 生成显化奖杯与奖状
                </h3>
                <p className="text-xs text-[#7A7264]">
                  已达成「{archivingGoal.title}」！生成永久保存的成就证书。
                </p>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-[11px] font-semibold text-[#5E584F] mb-1">
                    荣誉形式
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'trophy' as const, label: '🏆 荣耀奖杯' },
                      { id: 'certificate' as const, label: '📜 荣誉奖状' },
                      { id: 'medal' as const, label: '🥇 显化勋章' },
                    ].map((t) => (
                      <button
                        type="button"
                        key={t.id}
                        onClick={() => setTrophyForm({ ...trophyForm, type: t.id })}
                        className={`py-2 rounded-xl text-xs font-semibold border transition-all ${
                          trophyForm.type === t.id
                            ? 'bg-amber-100 text-amber-950 border-amber-400'
                            : 'bg-[#F7F4EE] text-[#696154] border-[#DDD6C8]'
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[#5E584F] mb-1">
                    奖杯名称
                  </label>
                  <input
                    type="text"
                    value={trophyForm.title}
                    onChange={(e) => setTrophyForm({ ...trophyForm, title: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[#F7F4EE] border border-[#DDD6C8] text-xs font-bold text-[#2E2A24]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[#5E584F] mb-1">
                    颁奖嘉奖辞 (Citation)
                  </label>
                  <textarea
                    rows={3}
                    value={trophyForm.citation}
                    onChange={(e) => setTrophyForm({ ...trophyForm, citation: e.target.value })}
                    className="w-full p-3 rounded-xl bg-[#F7F4EE] border border-[#DDD6C8] text-xs text-[#2E2A24] leading-relaxed"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[#5E584F] mb-1">
                    给自己的一份犒劳 / 自我肯定 (Personal Reward)
                  </label>
                  <input
                    type="text"
                    value={trophyForm.personalReward}
                    onChange={(e) =>
                      setTrophyForm({ ...trophyForm, personalReward: e.target.value })
                    }
                    placeholder="如: 犒劳自己一套心仪已久的草药精油 / 享受一次温泉放松"
                    className="w-full px-3 py-2 rounded-xl bg-[#F7F4EE] border border-[#DDD6C8] text-xs text-[#2E2A24]"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-[#EBE5DB] flex items-center justify-end gap-2">
                <button
                  onClick={() => setArchivingGoal(null)}
                  className="px-3.5 py-2 rounded-xl text-xs text-[#7A7264] hover:bg-[#EAE4D8]"
                >
                  暂不归档
                </button>
                <button
                  onClick={handleConfirmArchive}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white text-xs font-bold shadow-md"
                >
                  确认归档并存入殿堂 🏆
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: CREATE / EDIT VISION */}
      <AnimatePresence>
        {showVisionModal && (
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-[#FAF8F5] border border-[#E0D8CC] rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-[#EBE5DB]">
                <h3 className="text-sm sm:text-base font-semibold text-[#2E2A24] flex items-center gap-2">
                  <Star className="w-4 h-4 text-amber-500" />
                  <span>{editingVision ? '修改长期愿景' : '新建长期愿景'}</span>
                </h3>
                <button
                  onClick={() => setShowVisionModal(false)}
                  className="p-1 text-[#8C8477] hover:text-[#2E2A24]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveVision} className="space-y-3.5 text-xs">
                <div>
                  <label className="block text-[11px] font-medium text-[#5E584F] mb-1">
                    愿景标题 *
                  </label>
                  <input
                    type="text"
                    required
                    value={visionForm.title}
                    onChange={(e) => setVisionForm({ ...visionForm, title: e.target.value })}
                    placeholder="如: 经济自主 / 身心强健 / 手作创造"
                    className="w-full px-3 py-2 rounded-xl bg-[#F7F4EE] border border-[#DDD6C8] text-xs sm:text-sm text-[#2E2A24] focus:outline-none focus:border-[#2E2A24]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-[#5E584F] mb-1">
                    愿景陈述 (Statement) *
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={visionForm.statement}
                    onChange={(e) =>
                      setVisionForm({ ...visionForm, statement: e.target.value })
                    }
                    placeholder="详细陈述你所追求的终极状态..."
                    className="w-full p-3 rounded-xl bg-[#F7F4EE] border border-[#DDD6C8] text-xs text-[#2E2A24] leading-relaxed focus:outline-none focus:border-[#2E2A24]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-[#5E584F] mb-1">
                    归属领域
                  </label>
                  <select
                    value={visionForm.category}
                    onChange={(e) =>
                      setVisionForm({ ...visionForm, category: e.target.value as LifeArea })
                    }
                    className="w-full px-2.5 py-1.5 rounded-xl bg-[#F7F4EE] border border-[#DDD6C8] text-xs text-[#2E2A24]"
                  >
                    {Object.entries(LIFE_AREAS).map(([k, meta]) => (
                      <option key={k} value={k}>
                        {meta.emoji} {meta.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="pt-3 border-t border-[#EBE5DB] flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowVisionModal(false)}
                    className="px-3 py-2 rounded-xl text-xs text-[#7A7264] hover:bg-[#EAE4D8]"
                  >
                    取消
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-[#2E2A24] hover:bg-[#433D35] text-white text-xs font-medium shadow-xs"
                  >
                    保存愿景
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
