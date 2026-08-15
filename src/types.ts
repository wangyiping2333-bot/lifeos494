export type LifeArea = 'career' | 'health' | 'relationship' | 'growth' | 'creation' | 'life';

export interface LifeAreaMeta {
  id: LifeArea;
  label: string;
  emoji: string;
  color: string;
  bgColor: string;
  borderColor: string;
  subcategories: string[];
}

export const LIFE_AREAS: Record<LifeArea, LifeAreaMeta> = {
  career: {
    id: 'career',
    label: '事业 / 财富',
    emoji: '💰',
    color: 'text-amber-700',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
    subcategories: ['直播', '客户沟通', '客户交付', '占卜/咨询', '仪式/蜡烛', '产品开发', '内容创作', '运营营销', '日常工作', '收入', '支出', '还款/负债', '资产配置'],
  },
  health: {
    id: 'health',
    label: '身体 / 健康',
    emoji: '🫀',
    color: 'text-emerald-700',
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-200',
    subcategories: ['睡眠', '饮食', '力量训练', '有氧运动', '步行', '拉伸', '呼吸练习', '冥想', '身体恢复', '身体护理'],
  },
  relationship: {
    id: 'relationship',
    label: '关系',
    emoji: '❤️',
    color: 'text-rose-700',
    bgColor: 'bg-rose-50',
    borderColor: 'border-rose-200',
    subcategories: ['亲密关系', '约会/暧昧', '家庭/父母', '朋友社交', '关系心理', '安全感观察', '边界确立'],
  },
  growth: {
    id: 'growth',
    label: '成长 / 学习',
    emoji: '🧠',
    color: 'text-indigo-700',
    bgColor: 'bg-indigo-50',
    borderColor: 'border-indigo-200',
    subcategories: ['英语听力/口语', '商业与运营', '直播学习', 'AI探索', '心理与哲学', '塔罗与占星', '神秘学文献', '思维模型'],
  },
  creation: {
    id: 'creation',
    label: '创造 / 兴趣',
    emoji: '🎨',
    color: 'text-purple-700',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
    subcategories: ['艺术与审美', '手工与蜡烛制作', '水晶与装置', '摄影与视频', '创意灵感', '新领域探索'],
  },
  life: {
    id: 'life',
    label: '生活',
    emoji: '🏠',
    color: 'text-stone-700',
    bgColor: 'bg-stone-50',
    borderColor: 'border-stone-200',
    subcategories: ['家务与打扫', '空间整理', '做饭餐饮', '采购', '出行与行政', '深度休息', '娱乐放松'],
  },
};

export interface LifeEvent {
  id: string;
  date: string; // YYYY-MM-DD
  time_start?: string; // e.g. "14:00" or undefined
  time_end?: string; // e.g. "16:00" or undefined
  duration_minutes?: number; // e.g. 120 or undefined
  duration_display?: string; // e.g. "2h" or "未知"
  description: string; // 事实描述
  area: LifeArea;
  category: string;
  subcategory?: string;
  amount?: number; // optional money amount
  raw_note: string; // 用户的原始表达
  confidence: number; // 0 - 1
  status: 'confirmed' | 'needs_time_confirm' | 'auto_logged';
  associatedState?: string; // e.g. "踏实", "略有疲惫"
  interpretation?: string; // AI解读（与事实分离）
}

export interface LifeState {
  id: string;
  date: string;
  timestamp: string;
  primaryMood: string; // e.g. 开心, 焦虑, 平静, 疲惫, 有动力, 踏实, 被触发, 空虚, 兴奋, 有安全感
  energyLevel: number; // 1 to 5
  contextDescription: string;
  rawNote: string;
  innerCompassAligned?: boolean;
}

export interface Vision {
  id: string;
  title: string;
  statement: string;
  category: string;
  createdAt: string;
}

export interface Principle {
  id: string;
  statement: string;
  category: string;
  why: string;
  createdAt: string;
}

export interface GoalSpiritualPractice {
  id: string;
  type: 'ritual' | 'candle' | 'affirmation' | 'angel_number' | 'visualization' | 'belief_shift' | 'universe_synchronicity';
  title: string;
  detail: string;
  date: string;
}

export interface GoalBeliefShift {
  id: string;
  oldBelief: string;
  newBelief: string;
  insight: string;
  date: string;
}

export interface GoalTrophy {
  type: 'trophy' | 'certificate' | 'medal';
  title: string;
  citation: string;
  completedDate: string;
  icon: string;
  personalReward?: string;
}

export interface Goal {
  id: string;
  title: string;
  type: 'short_term' | 'long_term';
  area?: LifeArea; // 所属六大人生领域
  parentId?: string; // 短期目标归属的长期目标 ID
  parentVisionId?: string; // 长期目标归属的长期愿景 ID (选填)
  timeframeType?: 'fuzzy' | 'exact'; // 模糊时间 vs 精确时间
  timeframeFuzzy?: string; // e.g. "三个月内", "半年内", "近期两周内", "2026年Q4"
  startDate?: string; // YYYY-MM-DD
  targetDate?: string; // YYYY-MM-DD
  reality: string; // 现实要做什么 (直播、产品、交付等)
  why: string; // 为什么想要 (自由、选择权、安全感)
  identity: string; // 我正在成为谁 (正在成为能够独立创造价值的人)
  coreBelief: string; // 核心信念
  evidence: string[]; // 现实证据积累 (文本列表)
  realityEvidence?: Array<{
    id: string;
    text: string;
    date: string;
    actionTaken?: string;
  }>;
  spiritualManifestation?: {
    practices?: GoalSpiritualPractice[];
    coreBeliefShifts?: GoalBeliefShift[];
    affirmations?: string[];
    angelNumbers?: string[];
  };
  visionConnection: string; // 长期愿景连接
  manifestationNarrative: string; // 显化与积极叙事
  progressPercent: number;
  status: 'active' | 'completed' | 'archived';
  archivedAt?: string;
  trophy?: GoalTrophy;
  createdAt: string;
}

export interface DailyReview {
  id: string;
  date: string;
  eventsSummary: string[]; // ① 今日发生（纯事实）
  successes: string[]; // ② 今日成功（具体证据）
  gratitudes: string[]; // ③ 今日感恩（真实细节）
  integrations: string[]; // ④ 今日整合（心理与生活连接）
  blindSpots: string[]; // ⑤ 今日盲区（可能假设，带温和语气）
  goalConnections: string[]; // ⑥ 目标/愿景连接
  manifestationNarrative: string; // ⑦ 显化叙事 / 宇宙同步与意义
  innerCompass: {
    bodyWilling: boolean;
    heartPeaceful: boolean;
    proactiveChoice: boolean;
    facingReality: boolean;
    moreComplete: boolean;
    alignmentScore: number; // 1 - 10
    reflectionNotes: string;
  };
  confirmedData: boolean;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  date: string;
  extractedEvents?: Partial<LifeEvent>[];
  extractedStates?: Partial<LifeState>[];
  mode?: 'day_echo' | 'review_prompt' | 'compass_reflection';
}

export interface KnowledgeItem {
  id: string;
  title: string;
  content: string;
  category: 'mental_model' | 'principle' | 'reflection' | 'strategy' | 'belief';
  source: 'user_note' | 'review_insight' | 'mentor_synthesis';
  tags: string[];
  createdAt: string;
  updatedAt?: string;
}

export interface MentorMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  date: string;
  mode: 'reframe' | 'principles' | 'brainstorm' | 'knowledge' | 'manifestation';
  citedKnowledgeIds?: string[];
  keyInsightSummary?: string;
}

export interface TrajectoryPattern {
  id: string;
  title: string;
  description: string;
  triggerEvent: string;
  observedLoop: string;
  shiftSuggested: string;
  firstObservedDate: string;
  lastObservedDate: string;
  frequencyCount: number;
  lifeArea: LifeArea;
  trendStatus: 'improving' | 'stable' | 'watch';
}

export interface UserPhaseMeta {
  currentPhase: string; // e.g. "经济自主重建期"
  mainQuest: string; // e.g. "建立稳定现金流 (5000+/月)"
  keyRecentShift: string; // e.g. "正在从外部评价驱动，向内部评价驱动转变"
  recentProgress: string; // e.g. "即使关系产生波动，也越来越能够继续自己的生活"
}

export interface TodayFocusItem {
  id: string;
  text: string;
  completed: boolean;
  date?: string; // YYYY-MM-DD
  createdAt: string;
}

export interface TodoItem {
  id: string;
  date: string; // YYYY-MM-DD
  title: string;
  completed: boolean;
  completedAt?: string;
  area: LifeArea;
  estimatedMinutes?: number; // e.g. 15, 30, 60, 120
  priority?: 'high' | 'medium' | 'low';
  convertedToEventId?: string; // ID of the LifeEvent if bridged/connected
  rawNote?: string;
  createdAt: string;
}
