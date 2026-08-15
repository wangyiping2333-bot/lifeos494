import React, { useState } from 'react';
import {
  LineChart,
  Sparkles,
  TrendingUp,
  TrendingDown,
  Clock,
  Compass,
  Layers,
  ArrowRight,
  ShieldAlert,
  CheckCircle,
  RefreshCw,
  Eye,
  PieChart as PieChartIcon,
  X,
  Target,
  Activity,
  Award,
  ChevronRight,
  Info,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { LifeArea, LIFE_AREAS, LifeEvent, LifeState, Principle, TrajectoryPattern, Goal } from '../types';
import { GeminiKeyManager } from '../lib/geminiKey';
import { LifeHeatmap } from './LifeHeatmap';

interface TrajectoryViewProps {
  events?: LifeEvent[];
  states?: LifeState[];
  patterns?: TrajectoryPattern[];
  principles?: Principle[];
  goals?: Goal[];
  onUpdatePatterns: (patterns: TrajectoryPattern[]) => void;
}

// Area color map for SVG pie chart
const AREA_COLORS: Record<LifeArea, { stroke: string; fill: string; text: string; bg: string }> = {
  career: { stroke: '#d97706', fill: '#f59e0b', text: 'text-amber-700', bg: 'bg-amber-100' },
  health: { stroke: '#059669', fill: '#10b981', text: 'text-emerald-700', bg: 'bg-emerald-100' },
  relationship: { stroke: '#e11d48', fill: '#f43f5e', text: 'text-rose-700', bg: 'bg-rose-100' },
  growth: { stroke: '#4f46e5', fill: '#6366f1', text: 'text-indigo-700', bg: 'bg-indigo-100' },
  creation: { stroke: '#9333ea', fill: '#a855f7', text: 'text-purple-700', bg: 'bg-purple-100' },
  life: { stroke: '#57534e', fill: '#78716c', text: 'text-stone-700', bg: 'bg-stone-100' },
};

export const TrajectoryView: React.FC<TrajectoryViewProps> = ({
  events = [],
  states = [],
  patterns = [],
  principles = [],
  goals = [],
  onUpdatePatterns,
}) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedAreaModal, setSelectedAreaModal] = useState<LifeArea | null>(null);
  const [hoveredArea, setHoveredArea] = useState<LifeArea | null>(null);
  const [analysisNote, setAnalysisNote] = useState<string>(
    '正在从外部评价驱动，向内部愿景驱动转变。生活重心逐渐稳固在事业与身体的微小日常积累上。'
  );

  // Compute time / count distribution across 6 Life Areas
  const areaCounts: Record<LifeArea, number> = {
    career: 0,
    health: 0,
    relationship: 0,
    growth: 0,
    creation: 0,
    life: 0,
  };

  events.forEach((evt) => {
    if (areaCounts[evt.area] !== undefined) {
      areaCounts[evt.area] += evt.duration_minutes || 60;
    }
  });

  const totalMinutes = Object.values(areaCounts).reduce((a, b) => a + b, 0) || 1;

  const areaPercentages: Record<LifeArea, number> = {
    career: Math.round((areaCounts.career / totalMinutes) * 100) || 16,
    health: Math.round((areaCounts.health / totalMinutes) * 100) || 16,
    relationship: Math.round((areaCounts.relationship / totalMinutes) * 100) || 16,
    growth: Math.round((areaCounts.growth / totalMinutes) * 100) || 16,
    creation: Math.round((areaCounts.creation / totalMinutes) * 100) || 16,
    life: Math.round((areaCounts.life / totalMinutes) * 100) || 20,
  };

  // SVG Pie chart calculation
  const areaKeys = Object.keys(LIFE_AREAS) as LifeArea[];
  let cumulativeAngle = 0;
  const pieSlices = areaKeys.map((key) => {
    const pct = Math.max(areaPercentages[key] || 5, 4);
    const startAngle = cumulativeAngle;
    const angle = (pct / 100) * 360;
    cumulativeAngle += angle;
    const endAngle = cumulativeAngle;

    // Helper to calculate SVG path for sector
    const radius = 100;
    const innerRadius = 55;
    const cx = 120;
    const cy = 120;

    const startRad = (startAngle - 90) * (Math.PI / 180);
    const endRad = (endAngle - 90) * (Math.PI / 180);

    const x1 = cx + radius * Math.cos(startRad);
    const y1 = cy + radius * Math.sin(startRad);
    const x2 = cx + radius * Math.cos(endRad);
    const y2 = cy + radius * Math.sin(endRad);

    const ix1 = cx + innerRadius * Math.cos(endRad);
    const iy1 = cy + innerRadius * Math.sin(endRad);
    const ix2 = cx + innerRadius * Math.cos(startRad);
    const iy2 = cy + innerRadius * Math.sin(startRad);

    const largeArcFlag = angle > 180 ? 1 : 0;

    const pathData = [
      `M ${x1} ${y1}`,
      `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
      `L ${ix1} ${iy1}`,
      `A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${ix2} ${iy2}`,
      'Z',
    ].join(' ');

    return {
      key,
      meta: LIFE_AREAS[key],
      pct: areaPercentages[key],
      pathData,
      color: AREA_COLORS[key],
      minutes: areaCounts[key],
    };
  });

  // Trigger AI Pattern Discovery
  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    try {
      const res = await fetch('/api/patterns/analyze', {
        method: 'POST',
        headers: GeminiKeyManager.getApiHeaders(),
        body: JSON.stringify({
          allEvents: events,
          allStates: states,
          principles,
        }),
      });
      const data = await res.json();
      if (data.patterns && Array.isArray(data.patterns)) {
        onUpdatePatterns(data.patterns);
      }
      if (data.trajectorySummary) {
        setAnalysisNote(data.trajectorySummary);
      }
    } catch (e) {
      console.error('Analyze failed', e);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Deep-dive data for selected area
  const selectedAreaMeta = selectedAreaModal ? LIFE_AREAS[selectedAreaModal] : null;
  const selectedAreaEvents = selectedAreaModal
    ? events.filter((e) => e.area === selectedAreaModal)
    : [];
  const selectedAreaGoals = selectedAreaModal
    ? goals.filter((g) => g.area === selectedAreaModal)
    : [];
  const selectedAreaPatterns = selectedAreaModal
    ? patterns.filter((p) => p.lifeArea === selectedAreaModal)
    : [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Top Banner */}
      <div className="p-5 rounded-2xl bg-[#F4EFE6] border border-[#E7E0D3] flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-900 flex items-center justify-center">
            <LineChart className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-[#2E2A24]">
              📈 长期轨迹与六大领域全景 (Trajectory & Patterns)
            </h2>
            <p className="text-xs text-[#70695D] mt-0.5">
              不仅记录今天，更看见自己跨越数周、数月的心理循环、能量节律与六大人生领域平衡。
            </p>
          </div>
        </div>

        <button
          onClick={handleAnalyze}
          disabled={isAnalyzing}
          className="px-4 py-2 rounded-xl bg-[#2E2A24] hover:bg-[#433D35] text-[#FAF8F5] text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50"
        >
          {isAnalyzing ? (
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
          )}
          <span>AI 重新演算长期模式</span>
        </button>
      </div>

      {/* Trajectory Evolution Hero Banner */}
      <div className="p-6 rounded-2xl bg-[#FAF8F5] border border-[#E9E4DC] shadow-xs space-y-3">
        <div className="flex items-center gap-2 text-xs font-semibold text-[#7A7264] pb-1 border-b border-[#F0EBE2]">
          <TrendingUp className="w-4 h-4 text-emerald-600" />
          <span>核心轨迹跃迁 (Trajectory Shift)</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs pt-1">
          <div className="p-3.5 rounded-xl bg-stone-100/80 border border-stone-200 space-y-1">
            <span className="text-[10px] font-mono uppercase tracking-wider text-stone-500 font-semibold">
              过去的驱动模式 (Past Loop)
            </span>
            <p className="text-[#5C5548] leading-relaxed">
              外部即时评价 / 焦虑恐慌 ➔ 强行高压行动 ➔ 能量耗竭 ➔ 陷入逃避与自我否定
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-emerald-50/80 border border-emerald-200 space-y-1">
            <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-700 font-semibold">
              现在的生命轨迹 (Current Trajectory)
            </span>
            <p className="text-emerald-950 font-medium leading-relaxed">
              清晰愿景 ➔ 专注微小现实交付 ➔ 获得踏实感与正反馈 ➔ 稳健持续向前
            </p>
          </div>
        </div>

        <p className="text-xs text-[#5C5548] leading-relaxed pt-2 border-t border-[#F0EBE2]">
          💡 <span className="font-medium text-[#2E2A24]">AI 长期观察：</span>
          {analysisNote}
        </p>
      </div>

      {/* SECTION: 6 LIFE AREAS SECTOR / PIE CHART & CLICKABLE DEEP DIVE */}
      <div className="p-5 sm:p-6 rounded-2xl bg-[#FAF8F5] border border-[#E9E4DC] shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#F0EBE2] gap-2">
          <div>
            <h3 className="text-sm sm:text-base font-semibold text-[#2E2A24] flex items-center gap-2">
              <PieChartIcon className="w-4 h-4 text-amber-700" />
              <span>六大人生领域结构扇形图 (点击任一扇区查看单独深度分析)</span>
            </h3>
            <p className="text-xs text-[#7A7264] mt-0.5">
              点击下方扇形图或领域卡片，深入查看对应领域的累计时间、事件簿、目标显化及 AI 专属建议。
            </p>
          </div>
          <span className="text-xs font-mono text-[#8C8477] bg-[#F2EDE4] px-2.5 py-1 rounded-lg">
            总计投入: {Math.round(totalMinutes / 60)} 小时
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Left 5 Cols: Interactive SVG Donut / Pie Chart */}
          <div className="lg:col-span-5 flex flex-col items-center justify-center p-4">
            <div className="relative w-60 h-60 flex items-center justify-center">
              <svg viewBox="0 0 240 240" className="w-full h-full drop-shadow-xs">
                {pieSlices.map((slice) => {
                  const isHovered = hoveredArea === slice.key;
                  return (
                    <path
                      key={slice.key}
                      d={slice.pathData}
                      fill={slice.color.fill}
                      stroke="#FAF8F5"
                      strokeWidth="2.5"
                      className="cursor-pointer transition-all duration-300 hover:opacity-90"
                      style={{
                        transform: isHovered ? 'scale(1.04)' : 'scale(1)',
                        transformOrigin: '120px 120px',
                      }}
                      onMouseEnter={() => setHoveredArea(slice.key)}
                      onMouseLeave={() => setHoveredArea(null)}
                      onClick={() => setSelectedAreaModal(slice.key)}
                    />
                  );
                })}
              </svg>

              {/* Center Donut Hub */}
              <div className="absolute flex flex-col items-center justify-center text-center pointer-events-none">
                {hoveredArea ? (
                  <>
                    <span className="text-xl">{LIFE_AREAS[hoveredArea].emoji}</span>
                    <span className="text-xs font-bold text-[#2E2A24] mt-0.5">
                      {LIFE_AREAS[hoveredArea].label}
                    </span>
                    <span className="text-sm font-bold font-mono text-[#4A4337]">
                      {areaPercentages[hoveredArea]}%
                    </span>
                  </>
                ) : (
                  <>
                    <Compass className="w-5 h-5 text-amber-700" />
                    <span className="text-[11px] font-bold text-[#2E2A24] mt-1">六大领域</span>
                    <span className="text-[9px] text-[#8C8477]">点击扇形钻取</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Right 7 Cols: 6 Area Clickable Cards */}
          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {pieSlices.map((slice) => {
              return (
                <div
                  key={slice.key}
                  onClick={() => setSelectedAreaModal(slice.key)}
                  onMouseEnter={() => setHoveredArea(slice.key)}
                  onMouseLeave={() => setHoveredArea(null)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between space-y-2 group ${
                    hoveredArea === slice.key
                      ? 'bg-white border-[#2E2A24] shadow-md -translate-y-0.5'
                      : 'bg-[#F7F4EE] border-[#E8E2D6] hover:border-[#D5CDC0]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-base">{slice.meta.emoji}</span>
                      <span className="text-xs font-semibold text-[#2E2A24]">
                        {slice.meta.label}
                      </span>
                    </div>
                    <span className="text-xs font-bold font-mono text-[#4A4337]">
                      {slice.pct}%
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full bg-[#EAE4D8] h-1.5 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.max(slice.pct, 4)}%`,
                        backgroundColor: slice.color.fill,
                      }}
                    ></div>
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-[#8C8477] pt-1 border-t border-[#EAE3D6]">
                    <span>累计 {Math.round(slice.minutes / 60)}h · {events.filter((e) => e.area === slice.key).length} 条事件</span>
                    <span className="text-amber-800 font-medium group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
                      <span>查看分析</span>
                      <ChevronRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Multi-Granularity Heatmap (Day, Week, Month, Quarter, Year) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-[#2E2A24] flex items-center gap-1.5">
              <span>🗓️ 多粒度生活与能量热力全景图 (Life Area Heatmap)</span>
            </h3>
            <p className="text-xs text-[#7A7264]">
              支持自由切换「日·24时段」「周·7天矩阵」「月·全月日历」「季度·13周势能」「年·365天全景」，纵览生活重心变迁。
            </p>
          </div>
        </div>

        <LifeHeatmap events={events} states={states} initialGranularity="week" />
      </div>

      {/* Row 3: Recurring Psychological Patterns (心理循环发现) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-[#2E2A24]">
              🔄 AI 识别到的生活与心理循环 (Recurring Patterns)
            </h3>
            <p className="text-xs text-[#7A7264]">
              事实与状态积累足够后，AI 会自动寻找反复出现的模式，帮助你完成「看见 ➔ 松绑 ➔ 升级」。
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {patterns.map((pat) => (
            <div
              key={pat.id}
              className="p-5 rounded-2xl bg-[#FAF8F5] border border-[#E9E4DC] space-y-3 shadow-xs flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span
                    className={`text-[10px] font-medium px-2 py-0.5 rounded ${
                      pat.trendStatus === 'improving'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {pat.trendStatus === 'improving' ? '✓ 正在向好' : '⚠️ 需温和观察'}
                  </span>
                  <span className="text-[10px] text-[#8C8477] font-mono">
                    出现 {pat.frequencyCount} 次
                  </span>
                </div>

                <h4 className="text-sm font-semibold text-[#2E2A24]">{pat.title}</h4>

                <p className="text-xs text-[#6B6457] leading-relaxed">{pat.description}</p>
              </div>

              <div className="space-y-2 pt-2 border-t border-[#F0EBE2] text-xs">
                <div className="p-2.5 rounded-xl bg-[#F6F2EA] border border-[#E8E2D6] space-y-1">
                  <span className="text-[10px] font-semibold text-[#7A7264]">
                    观察到的循环 (Loop)
                  </span>
                  <p className="text-[11px] text-[#3D372E]">{pat.observedLoop}</p>
                </div>

                <div className="p-2.5 rounded-xl bg-[#F0EBE1] border border-[#DDD5C6] space-y-1">
                  <span className="text-[10px] font-semibold text-[#4A4337]">
                    💡 建议视角 (Perspective Shift)
                  </span>
                  <p className="text-[11px] text-[#2E2A24] font-medium">
                    {pat.shiftSuggested}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* INDIVIDUAL LIFE AREA DEEP ANALYSIS MODAL */}
      <AnimatePresence>
        {selectedAreaModal && selectedAreaMeta && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/40 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-[#FAF8F5] rounded-3xl border border-[#E5DFD3] shadow-2xl w-full max-w-2xl p-5 sm:p-7 space-y-5 max-h-[90vh] overflow-y-auto"
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-4 border-b border-[#F0EBE2]">
                <div className="flex items-center gap-3">
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-xs"
                    style={{ backgroundColor: AREA_COLORS[selectedAreaModal].fill + '20' }}
                  >
                    <span>{selectedAreaMeta.emoji}</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-base sm:text-lg text-[#2E2A24]">
                      {selectedAreaMeta.label} · 领域深度透视
                    </h3>
                    <p className="text-xs text-[#7A7264] mt-0.5">
                      占比全期能量: <span className="font-bold font-mono text-[#2E2A24]">{areaPercentages[selectedAreaModal]}%</span> · 累计投入: <span className="font-bold font-mono text-[#2E2A24]">{Math.round((areaCounts[selectedAreaModal] || 0) / 60)} 小时</span>
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedAreaModal(null)}
                  className="p-1.5 text-[#8C8477] hover:text-[#2E2A24] rounded-xl hover:bg-[#EAE3D6] transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Subcategories tags */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-semibold text-[#7A7264]">包含细分子类目：</span>
                <div className="flex flex-wrap gap-1.5">
                  {selectedAreaMeta.subcategories.map((sub, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-0.5 rounded-lg bg-[#EFEAE0] text-[#554E42] text-xs font-medium border border-[#E2DC CF]"
                    >
                      {sub}
                    </span>
                  ))}
                </div>
              </div>

              {/* Connected Goals in this Area */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between text-xs font-semibold text-[#2E2A24]">
                  <span className="flex items-center gap-1.5">
                    <Target className="w-4 h-4 text-rose-600" />
                    <span>该领域绑定的主线目标 ({selectedAreaGoals.length})</span>
                  </span>
                </div>
                {selectedAreaGoals.length === 0 ? (
                  <div className="p-3 rounded-xl bg-[#F6F2EA] text-xs text-[#8C8477] text-center">
                    当前暂无专门绑定在【{selectedAreaMeta.label}】的目标，可在「愿景目标」中新增。
                  </div>
                ) : (
                  <div className="space-y-2">
                    {selectedAreaGoals.map((g) => (
                      <div
                        key={g.id}
                        className="p-3 rounded-xl bg-[#F6F2EA] border border-[#E8E2D6] flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="space-y-0.5">
                          <span className="font-semibold text-[#2E2A24]">{g.title}</span>
                          <p className="text-[11px] text-[#6B6355] line-clamp-1">{g.reality}</p>
                        </div>
                        <span className="font-mono font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                          {g.progressPercent}%
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Area-specific Recurring Patterns */}
              <div className="space-y-2.5">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-[#2E2A24]">
                  <RefreshCw className="w-4 h-4 text-indigo-600" />
                  <span>该领域沉淀的心理循环与模式 ({selectedAreaPatterns.length})</span>
                </div>
                {selectedAreaPatterns.length === 0 ? (
                  <div className="p-3 rounded-xl bg-[#F6F2EA] text-xs text-[#8C8477] text-center">
                    该领域运行较为顺畅，尚未触发高频负向循环。
                  </div>
                ) : (
                  <div className="space-y-2">
                    {selectedAreaPatterns.map((p) => (
                      <div
                        key={p.id}
                        className="p-3 rounded-xl bg-[#F6F2EA] border border-[#E8E2D6] space-y-1.5 text-xs"
                      >
                        <div className="flex items-center justify-between font-semibold text-[#2E2A24]">
                          <span>{p.title}</span>
                          <span className="text-[10px] text-[#8C8477] font-mono">
                            频次 {p.frequencyCount} 次
                          </span>
                        </div>
                        <p className="text-[11px] text-[#696154]">{p.observedLoop}</p>
                        <div className="p-2 rounded-lg bg-white/80 text-[11px] text-amber-950 font-medium">
                          💡 转化视角: {p.shiftSuggested}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Recent Events in this Area */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between text-xs font-semibold text-[#2E2A24]">
                  <span className="flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-stone-700" />
                    <span>该领域近期真实事件簿 ({selectedAreaEvents.length})</span>
                  </span>
                </div>
                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {selectedAreaEvents.slice(0, 8).map((evt) => (
                    <div
                      key={evt.id}
                      className="p-2.5 rounded-xl bg-white border border-[#EAE3D6] flex items-center justify-between gap-2 text-xs"
                    >
                      <div className="min-w-0">
                        <span className="font-medium text-[#2E2A24] truncate block">
                          {evt.description}
                        </span>
                        <span className="text-[10px] text-[#8C8477] font-mono">
                          {evt.date} · {evt.subcategory || evt.category}
                        </span>
                      </div>
                      <span className="text-[11px] font-mono text-[#5C5548] shrink-0 font-semibold">
                        {evt.duration_display || `${evt.duration_minutes || 60}m`}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* AI Guidance Box */}
              <div className="p-4 rounded-2xl bg-[#F0EBE1] border border-[#DDD5C6] space-y-1.5 text-xs text-[#4A4337]">
                <div className="font-semibold text-[#2E2A24] flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-700" />
                  <span>AI 导师关于【{selectedAreaMeta.label}】的平衡建议</span>
                </div>
                <p className="leading-relaxed text-[11px] text-[#554D40]">
                  {selectedAreaModal === 'career' &&
                    '保持每日直播与手工蜡烛的稳定节奏，以高频微小交付建立自尊与安全感；不通过受苦证明努力，让金钱成为诚实创造的自然回报。'}
                  {selectedAreaModal === 'health' &&
                    '力量训练与深度睡眠是托起一切创造的肉体神殿。当感到精神焦虑时，优先回到身体与呼吸，不把休息视为负罪。'}
                  {selectedAreaModal === 'relationship' &&
                    '牢记原则“主动表达，但不负责两个人的关系”。放下对外部即时反馈的苛求，守好心理边界，不让关系单点波动掀翻全盘。'}
                  {selectedAreaModal === 'growth' &&
                    '文献阅读与英语学习正在持续注入认知复利。继续保持每日 30 分钟无压力的微习惯。'}
                  {selectedAreaModal === 'creation' &&
                    '手作蜡烛与草药艺术是你连接内心与物质世界的显化通道。允许灵感自然流淌，每次创造都是对美的赞颂。'}
                  {selectedAreaModal === 'life' &&
                    '整洁的空间与规律的餐饮是一切稳健生活的基石。把空间打扫当做一次沉浸式的心灵熏香仪式。'}
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
