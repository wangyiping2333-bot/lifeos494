import React, { useState } from 'react';
import {
  Check,
  Plus,
  Trash2,
  Sparkles,
  Pin,
  Edit2,
  X,
  Flame,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { TodayFocusItem } from '../types';

interface TodayFocusStickyNoteProps {
  focusItems: TodayFocusItem[];
  onAddFocusItem: (text: string) => void;
  onToggleFocusItem: (id: string) => void;
  onDeleteFocusItem: (id: string) => void;
  onUpdateFocusItem: (id: string, text: string) => void;
}

export const TodayFocusStickyNote: React.FC<TodayFocusStickyNoteProps> = ({
  focusItems = [],
  onAddFocusItem,
  onToggleFocusItem,
  onDeleteFocusItem,
  onUpdateFocusItem,
}) => {
  const [inputText, setInputText] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');

  const completedCount = focusItems.filter((i) => i.completed).length;
  const totalCount = focusItems.length;
  const isFull = totalCount >= 3;

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isFull) return;
    onAddFocusItem(inputText.trim());
    setInputText('');
  };

  const startEdit = (item: TodayFocusItem) => {
    setEditingId(item.id);
    setEditingText(item.text);
  };

  const saveEdit = (id: string) => {
    if (editingText.trim()) {
      onUpdateFocusItem(id, editingText.trim());
    }
    setEditingId(null);
  };

  return (
    <div
      id="today-focus-sticky-note"
      className="relative bg-gradient-to-br from-[#FFFDF2] via-[#FEFCE8] to-[#FFF9DE] border border-[#EADB96]/90 rounded-2xl p-3 sm:p-4 shadow-[0_4px_16px_rgba(217,119,6,0.06)] space-y-2.5 transition-all"
    >
      {/* Decorative top tape / pushpin aesthetic badge */}
      <div className="flex items-center justify-between gap-2 pb-2 border-b border-[#EEDB97]/60">
        <div className="flex items-center gap-1.5">
          <div className="w-5 h-5 rounded-full bg-amber-200/80 text-amber-900 flex items-center justify-center text-xs shadow-2xs">
            📌
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="text-xs sm:text-sm font-bold text-[#3B3425] tracking-tight">
                今日重点
              </h3>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-md bg-[#F4E8B8]/80 text-[#5C4F2B] font-semibold">
                {completedCount}/{totalCount} 完成 (限3条)
              </span>
            </div>
          </div>
        </div>

        <div className="text-[10px] text-[#786C4B] font-medium hidden sm:block">
          聚焦核心价值 · 不被琐事分散
        </div>
      </div>

      {/* Focus Items List */}
      <div className="space-y-1.5">
        <AnimatePresence>
          {focusItems.map((item, idx) => {
            const isEditing = editingId === item.id;
            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className={`group flex items-center justify-between gap-2 p-2 rounded-xl border transition-all ${
                  item.completed
                    ? 'bg-[#F9F5E5]/90 border-[#E8DCAC] text-[#7A7156]'
                    : 'bg-white/85 border-[#EFE4BA] text-[#2E281C] shadow-2xs hover:bg-white'
                }`}
              >
                {/* Left: Number + Checkbox + Title */}
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  {/* Number pill */}
                  <span
                    className={`w-4 h-4 rounded-full text-[10px] font-mono font-bold flex items-center justify-center shrink-0 ${
                      item.completed
                        ? 'bg-[#EADEB0] text-[#7A7156]'
                        : 'bg-amber-100 text-amber-900'
                    }`}
                  >
                    {idx + 1}
                  </span>

                  {/* Tactile Checkbox */}
                  <button
                    type="button"
                    onClick={() => onToggleFocusItem(item.id)}
                    className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 transition-all ${
                      item.completed
                        ? 'bg-emerald-600 border-emerald-600 text-white shadow-2xs'
                        : 'bg-white border-[#D6C68F] hover:border-emerald-600'
                    }`}
                    title={item.completed ? '标记为未完成' : '完成此重点'}
                  >
                    {item.completed && <Check className="w-3 h-3 stroke-[3]" />}
                  </button>

                  {/* Text / Input */}
                  {isEditing ? (
                    <input
                      type="text"
                      value={editingText}
                      onChange={(e) => setEditingText(e.target.value)}
                      onBlur={() => saveEdit(item.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') saveEdit(item.id);
                        if (e.key === 'Escape') setEditingId(null);
                      }}
                      autoFocus
                      className="w-full text-xs px-2 py-1 rounded bg-white border border-[#2E281C] text-[#2E281C] focus:outline-none"
                    />
                  ) : (
                    <span
                      onClick={() => onToggleFocusItem(item.id)}
                      className={`text-xs sm:text-[13px] leading-snug cursor-pointer select-none truncate ${
                        item.completed
                          ? 'line-through text-[#8C8266] opacity-80'
                          : 'font-medium text-[#2E281C]'
                      }`}
                      title="点击切换状态"
                    >
                      {item.text}
                    </span>
                  )}
                </div>

                {/* Right Action Buttons */}
                <div className="flex items-center gap-1 shrink-0 opacity-80 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                  {!isEditing && (
                    <button
                      type="button"
                      onClick={() => startEdit(item)}
                      className="p-1 text-[#8C8266] hover:text-[#2E281C] rounded"
                      title="编辑"
                    >
                      <Edit2 className="w-3 h-3" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => onDeleteFocusItem(item.id)}
                    className="p-1 text-[#8C8266] hover:text-rose-600 rounded"
                    title="删除"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {focusItems.length === 0 && (
          <div className="py-2.5 text-center text-xs text-[#8C8266] bg-white/50 rounded-xl border border-dashed border-[#E5D7A4]">
            今日还没有设定重点，写下最重要的 1~3 件事吧 ✨
          </div>
        )}
      </div>

      {/* Add Input or Limit Notice */}
      {!isFull ? (
        <form onSubmit={handleAdd} className="flex items-center gap-1.5 pt-0.5">
          <div className="relative flex-1">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={`写下今日第 ${focusItems.length + 1} 条重点（最多3条）...`}
              className="w-full text-xs px-2.5 py-1.5 rounded-xl bg-white/95 border border-[#E5D7A4] focus:border-[#5C4F2B] focus:outline-none text-[#2E281C] placeholder-[#A3997A] shadow-2xs pr-7 transition-all"
            />
            {inputText && (
              <button
                type="button"
                onClick={() => setInputText('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
          <button
            type="submit"
            disabled={!inputText.trim()}
            className="px-2.5 py-1.5 rounded-xl bg-[#3B3425] hover:bg-[#4F4632] disabled:opacity-40 text-[#FFFDE8] text-xs font-semibold flex items-center gap-1 shrink-0 transition-all shadow-2xs"
          >
            <Plus className="w-3 h-3" />
            <span>添加</span>
          </button>
        </form>
      ) : (
        <div className="flex items-center justify-between text-[11px] text-[#786C4B] bg-[#F7EFCC]/70 px-2.5 py-1.5 rounded-xl border border-[#EADB96]">
          <span className="flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-700 shrink-0" />
            <span>今日重点已达 3 条上限 · 请集中精力执行</span>
          </span>
          <span className="font-mono text-[10px] text-amber-900 font-semibold">3/3 FULL</span>
        </div>
      )}
    </div>
  );
};
