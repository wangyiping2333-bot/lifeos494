import React, { useState } from 'react';
import {
  Layers,
  Search,
  Filter,
  Plus,
  Clock,
  Tag,
  DollarSign,
  Info,
  Calendar,
  CheckCircle,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { LifeArea, LIFE_AREAS, LifeEvent } from '../types';

interface TimelineViewProps {
  events?: LifeEvent[];
  onAddEvent: (event: Omit<LifeEvent, 'id'>) => void;
  onDeleteEvent: (id: string) => void;
}

export const TimelineView: React.FC<TimelineViewProps> = ({
  events = [],
  onAddEvent,
  onDeleteEvent,
}) => {
  const [selectedArea, setSelectedArea] = useState<LifeArea | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  const [newEvent, setNewEvent] = useState<Partial<LifeEvent>>({
    date: new Date().toISOString().split('T')[0],
    description: '',
    area: 'career',
    category: '业务执行',
    duration_display: '1h',
    amount: undefined,
    raw_note: '',
  });

  const filteredEvents = events.filter((evt) => {
    if (selectedArea !== 'all' && evt.area !== selectedArea) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        evt.description.toLowerCase().includes(q) ||
        evt.raw_note.toLowerCase().includes(q) ||
        evt.category.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleCreate = () => {
    if (!newEvent.description) return;
    onAddEvent({
      date: newEvent.date || new Date().toISOString().split('T')[0],
      description: newEvent.description,
      area: (newEvent.area as LifeArea) || 'career',
      category: newEvent.category || '业务执行',
      duration_display: newEvent.duration_display || '未知',
      amount: newEvent.amount,
      raw_note: newEvent.raw_note || newEvent.description,
      confidence: 1.0,
      status: 'confirmed',
    });
    setShowAddModal(false);
    setNewEvent({
      date: new Date().toISOString().split('T')[0],
      description: '',
      area: 'career',
      category: '业务执行',
      duration_display: '1h',
      amount: undefined,
      raw_note: '',
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-2 sm:px-4 md:px-6 py-3 sm:py-5 space-y-2.5 sm:space-y-4">
      {/* Top Banner */}
      <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-[#F4EFE6] border border-[#E7E0D3] flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-stone-200 text-stone-800 flex items-center justify-center shrink-0">
            <Layers className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h2 className="text-xs sm:text-sm font-semibold text-[#2E2A24] truncate">
              📝 生活事件簿 (Events Log)
            </h2>
            <p className="text-[10px] sm:text-xs text-[#70695D] truncate">
              客观事实记录 · 剥离情绪与AI解读
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-2.5 py-1.5 rounded-lg bg-[#2E2A24] hover:bg-[#433D35] text-[#FAF8F5] text-xs font-medium flex items-center gap-1 transition-colors shrink-0 shadow-xs"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>补录事件</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-[#FAF8F5] p-2 sm:p-3 rounded-xl sm:rounded-2xl border border-[#E9E4DC] space-y-2">
        {/* Search */}
        <div className="relative w-full">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[#8C8477]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索事件描述、原声或分类..."
            className="w-full text-xs pl-7 pr-3 py-1.5 rounded-lg bg-[#F6F2EA] border border-[#DDD6C8] focus:outline-none focus:border-[#2E2A24]"
          />
        </div>

        {/* Life Area Filters */}
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar max-w-full pb-0.5">
          <button
            onClick={() => setSelectedArea('all')}
            className={`px-2 py-1 rounded-lg text-xs whitespace-nowrap transition-colors shrink-0 ${
              selectedArea === 'all'
                ? 'bg-[#2E2A24] text-[#FAF8F5] font-medium'
                : 'text-[#6E6659] hover:bg-[#EFEAE0]'
            }`}
          >
            全部 ({events.length})
          </button>
          {(Object.keys(LIFE_AREAS) as LifeArea[]).map((key) => {
            const meta = LIFE_AREAS[key];
            const count = events.filter((e) => e.area === key).length;
            return (
              <button
                key={key}
                onClick={() => setSelectedArea(key)}
                className={`px-2 py-1 rounded-lg text-xs whitespace-nowrap flex items-center gap-1 transition-colors shrink-0 ${
                  selectedArea === key
                    ? 'bg-[#2E2A24] text-[#FAF8F5] font-medium'
                    : 'text-[#6E6659] hover:bg-[#EFEAE0]'
                }`}
              >
                <span>{meta.emoji}</span>
                <span>{meta.label.split('/')[0]}</span>
                <span className="font-mono text-[10px] opacity-70">({count})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Events Table / Timeline Cards (Optimized for Chinese line density: ~20 chars across without wasting margins) */}
      <div className="space-y-1.5 sm:space-y-2">
        {filteredEvents.map((evt) => {
          const meta = LIFE_AREAS[evt.area] || LIFE_AREAS.life;
          return (
            <div
              key={evt.id}
              className="p-2 sm:p-3 rounded-xl bg-[#FAF8F5] border border-[#E9E4DC] hover:border-[#D8CFBF] transition-all shadow-2xs space-y-1 text-xs"
            >
              {/* Header meta line */}
              <div className="flex items-center justify-between gap-1.5 pb-0.5 border-b border-[#F0ECE4]">
                <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                  <span className="text-xs">{meta.emoji}</span>
                  <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-[#EFEAE0] text-[#7A7264] font-medium">
                    {meta.label} · {evt.category}
                  </span>
                  {evt.amount && (
                    <span className="font-mono font-semibold text-[10px] text-amber-800 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                      ¥{evt.amount}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1.5 shrink-0 font-mono text-[10px] text-[#8C8477]">
                  <span>{evt.date}</span>
                  {evt.duration_display && evt.duration_display !== '未知' ? (
                    <span className="px-1.5 py-0.2 rounded bg-[#ECE6DA] text-[#2E2A24] font-medium">
                      {evt.duration_display}
                    </span>
                  ) : (
                    <span className="text-amber-700">待补时</span>
                  )}
                  <button
                    onClick={() => onDeleteEvent(evt.id)}
                    className="text-[#A69E90] hover:text-rose-600 p-0.5 transition-colors"
                    title="删除记录"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* Main Full-Width Row: Description */}
              <div className="w-full">
                <p className="font-medium text-xs sm:text-sm text-[#2E2A24] leading-snug break-words">
                  {evt.description}
                </p>
              </div>

              {/* Raw User Note */}
              {evt.raw_note && evt.raw_note !== evt.description && (
                <p className="text-[11px] text-[#7A7264] flex items-start gap-1 leading-snug">
                  <span className="text-[#A0988A] shrink-0">原声:</span>
                  <span className="break-words">"{evt.raw_note}"</span>
                </p>
              )}

              {/* AI Separation Note */}
              {evt.interpretation && (
                <div className="p-1.5 rounded-lg bg-[#F6F2EA] border border-[#E9E2D5] text-[11px] text-[#5C5548] flex items-start gap-1.5 leading-snug">
                  <Sparkles className="w-3 h-3 text-amber-600 shrink-0 mt-0.5" />
                  <span className="break-words">
                    <strong className="text-[#3D372E]">AI 解读：</strong>
                    {evt.interpretation}
                  </span>
                </div>
              )}
            </div>
          );
        })}

        {filteredEvents.length === 0 && (
          <div className="p-8 text-center text-xs text-[#8C8477] bg-[#FAF8F5] rounded-xl border border-[#E9E4DC]">
            没有找到匹配的生活事件记录
          </div>
        )}
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-3">
          <div className="bg-[#FAF8F5] border border-[#E0D8CC] rounded-2xl max-w-md w-full p-4 sm:p-5 shadow-xl space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#EBE5DB]">
              <h3 className="text-xs sm:text-sm font-semibold text-[#2E2A24]">手动补录生活事件</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-[#8C8477] hover:text-[#2E2A24] text-xs"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2.5 text-xs">
              <div>
                <label className="block text-[11px] font-medium text-[#7A7264] mb-1">
                  客观事件描述
                </label>
                <input
                  type="text"
                  value={newEvent.description}
                  onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                  placeholder="例如: 直播2小时 / 健身房练腿"
                  className="w-full p-2 rounded-xl bg-[#F6F2EA] border border-[#DDD6C8] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-medium text-[#7A7264] mb-1">
                    生活领域
                  </label>
                  <select
                    value={newEvent.area}
                    onChange={(e) =>
                      setNewEvent({ ...newEvent, area: e.target.value as LifeArea })
                    }
                    className="w-full p-2 rounded-xl bg-[#F6F2EA] border border-[#DDD6C8] focus:outline-none"
                  >
                    {(Object.keys(LIFE_AREAS) as LifeArea[]).map((k) => (
                      <option key={k} value={k}>
                        {LIFE_AREAS[k].emoji} {LIFE_AREAS[k].label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-[#7A7264] mb-1">
                    时长/耗时
                  </label>
                  <input
                    type="text"
                    value={newEvent.duration_display}
                    onChange={(e) =>
                      setNewEvent({ ...newEvent, duration_display: e.target.value })
                    }
                    placeholder="例如: 2h / 45min"
                    className="w-full p-2 rounded-xl bg-[#F6F2EA] border border-[#DDD6C8] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-[#7A7264] mb-1">
                  原声/备注
                </label>
                <textarea
                  value={newEvent.raw_note}
                  onChange={(e) => setNewEvent({ ...newEvent, raw_note: e.target.value })}
                  placeholder="当时的真实想法或原话..."
                  rows={2}
                  className="w-full p-2 rounded-xl bg-[#F6F2EA] border border-[#DDD6C8] focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#EBE5DB]">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-3 py-1.5 rounded-lg text-xs text-[#7A7264]"
              >
                取消
              </button>
              <button
                onClick={handleCreate}
                className="px-4 py-1.5 rounded-xl bg-[#2E2A24] text-[#FAF8F5] text-xs font-semibold hover:bg-[#433D35] shadow-xs"
              >
                保存事件
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
