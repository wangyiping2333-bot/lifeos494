import React from 'react';
import {
  Compass,
  Sun,
  Moon,
  Sparkles,
  Target,
  LineChart,
  Layers,
  Flame,
  Database,
  CheckCircle2,
  Key,
  Brain,
} from 'lucide-react';
import { UserPhaseMeta } from '../types';
import { GeminiKeyManager } from '../lib/geminiKey';

export type AppTabType =
  | 'day'
  | 'mentor'
  | 'review'
  | 'vision_goals'
  | 'trajectory'
  | 'timeline';

interface HeaderProps {
  currentTab: AppTabType;
  onSelectTab: (tab: AppTabType) => void;
  userPhase: UserPhaseMeta;
  todayPendingReviewsCount: number;
  onOpenDataModal: () => void;
  onOpenCompassModal: () => void;
  onOpenApiKeyModal: () => void;
  hasCustomApiKey?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onSelectTab,
  userPhase,
  todayPendingReviewsCount,
  onOpenDataModal,
  onOpenCompassModal,
  onOpenApiKeyModal,
  hasCustomApiKey = false,
}) => {
  const activeAi = GeminiKeyManager.getActiveConfigInfo();
  const todayStr = new Date().toLocaleDateString('zh-CN', {
    month: 'short',
    day: 'numeric',
    weekday: 'short',
  });

  return (
    <header className="sticky top-0 z-40 bg-[#FAF8F5]/95 backdrop-blur-md border-b border-[#E8E2D6] pt-[env(safe-area-inset-top,0px)]">
      {/* Mobile Top Bar (< md screens): Compact Single-Row UI */}
      <div className="flex md:hidden items-center justify-between px-3 h-11 border-b border-[#F0ECE4]/60">
        {/* Left: Brand + Date Pill */}
        <div className="flex items-center gap-1.5">
          <div className="w-6 h-6 rounded-md bg-[#2E2A24] text-[#FAF8F5] flex items-center justify-center font-serif text-[10px] font-bold shadow-2xs shrink-0">
            OS
          </div>
          <div>
            <div className="flex items-center gap-1 leading-none">
              <span className="text-[11px] font-bold text-[#2E2A24] tracking-tight">LifeOS</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            </div>
            <span className="text-[9px] text-[#8C8477] font-mono leading-none block mt-0.5">
              {todayStr}
            </span>
          </div>
        </div>

        {/* Right: Quick Action Pills with Comfortable Touch Targets */}
        <div className="flex items-center gap-1">
          {/* Phase / Compass Quick Chip */}
          <button
            onClick={onOpenCompassModal}
            className="flex items-center gap-1 px-2 py-1 rounded-lg bg-[#F0EBE1] active:bg-[#E4DDCF] text-[#4A443B] text-[10px] font-medium transition-colors border border-[#E2DDD2]"
            title="内在指南针与身心一致性"
          >
            <Compass className="w-3 h-3 text-amber-700 shrink-0" />
            <span className="max-w-[62px] truncate">{userPhase?.currentPhase?.slice(0, 4) || '重建期'}</span>
          </button>

          {/* AI Key Status Button */}
          <button
            onClick={onOpenApiKeyModal}
            className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-medium transition-colors border ${
              hasCustomApiKey
                ? activeAi.provider === 'deepseek'
                  ? 'bg-blue-50 text-blue-950 border-blue-200 active:bg-blue-100'
                  : 'bg-emerald-50 text-emerald-950 border-emerald-200 active:bg-emerald-100'
                : 'bg-[#F0EBE1] text-[#5E584F] border-[#E2DDD2] active:bg-[#E7E0D3]'
            }`}
            title="配置专属 API Key"
          >
            <Key
              className={`w-3 h-3 ${
                hasCustomApiKey
                  ? activeAi.provider === 'deepseek'
                    ? 'text-blue-700'
                    : 'text-emerald-600'
                  : 'text-amber-700'
              }`}
            />
            <span>
              {hasCustomApiKey
                ? activeAi.provider === 'deepseek'
                  ? 'DeepSeek'
                  : 'Gemini'
                : 'Key'}
            </span>
          </button>

          {/* Data Backup / Export */}
          <button
            onClick={onOpenDataModal}
            className="p-1.5 text-[#787165] active:text-[#2E2A24] active:bg-[#EAE4D8] bg-[#F4EFE6] border border-[#E2DDD2] rounded-lg transition-colors shrink-0"
            title="数据备份与导出"
          >
            <Database className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Desktop Top Banner (>= md screens) */}
      <div className="hidden md:block">
        <div className="max-w-7xl mx-auto px-6 py-1.5 flex items-center justify-between gap-2 text-xs border-b border-[#F0ECE4]">
          <div className="flex items-center gap-3 text-[#5E584F]">
            <span className="inline-flex items-center gap-1.5 font-medium text-[#2E2A24]">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              LifeOS
            </span>
            <span className="text-[#D0C9BE]">|</span>
            <div className="flex items-center gap-1">
              <span className="text-[#8C8477]">当前阶段:</span>
              <span className="font-medium text-[#2E2A24] bg-[#F2EDE4] px-2 py-0.5 rounded text-[11px] whitespace-nowrap">
                🧭 {userPhase?.currentPhase || '经济自主重建期'}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[#D0C9BE]">|</span>
              <span className="text-[#8C8477]">主线:</span>
              <span className="font-medium text-[#2E2A24] bg-[#F2EDE4] px-2 py-0.5 rounded text-[11px] whitespace-nowrap">
                🌟 {userPhase?.mainQuest || '建立稳定现金流 (5000+/月)'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Custom API Key Button */}
            <button
              onClick={onOpenApiKeyModal}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs transition-colors border ${
                hasCustomApiKey
                  ? activeAi.provider === 'deepseek'
                    ? 'bg-blue-50 text-blue-950 border-blue-200 hover:bg-blue-100'
                    : 'bg-emerald-50 text-emerald-900 border-emerald-200 hover:bg-emerald-100'
                  : 'bg-[#F0EBE1] text-[#5E584F] border-transparent hover:bg-[#E7E0D3]'
              }`}
              title="配置专属 Gemini / DeepSeek API Key"
            >
              <Key
                className={`w-3.5 h-3.5 ${
                  hasCustomApiKey
                    ? activeAi.provider === 'deepseek'
                      ? 'text-blue-700'
                      : 'text-emerald-600'
                    : 'text-amber-700'
                }`}
              />
              <span className="font-medium">
                {hasCustomApiKey ? (
                  <span className="flex items-center gap-1">
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        activeAi.provider === 'deepseek' ? 'bg-blue-600' : 'bg-emerald-500'
                      }`}
                    ></span>
                    <span>{activeAi.provider === 'deepseek' ? 'DeepSeek' : 'Gemini'} (已启用)</span>
                  </span>
                ) : (
                  <span>AI Key 通道</span>
                )}
              </span>
            </button>

            <button
              onClick={onOpenCompassModal}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#F0EBE1] hover:bg-[#E7E0D3] text-[#4A443B] text-xs transition-colors"
              title="身心一致性自检"
            >
              <Compass className="w-3.5 h-3.5 text-amber-700" />
              <span>内在指南针</span>
            </button>

            <button
              onClick={onOpenDataModal}
              className="p-1.5 text-[#787165] hover:text-[#2E2A24] hover:bg-[#EFEAE0] rounded-lg transition-colors"
              title="数据备份与导出"
            >
              <Database className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Desktop Main Nav Bar */}
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#2E2A24] text-[#FAF8F5] flex items-center justify-center font-serif text-sm shadow-xs shrink-0">
              OS
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-sm font-semibold tracking-tight text-[#2E2A24]">
                  LifeOS
                </h1>
                <span className="text-[10px] font-mono px-1.5 py-0.2 bg-[#EFEAE0] text-[#787165] rounded">
                  v2.5
                </span>
              </div>
              <p className="text-[11px] text-[#8C8477]">
                用户只管生活和表达，AI 负责记录与外脑思考
              </p>
            </div>
          </div>

          <nav className="flex items-center gap-1 bg-[#EFEAE0]/80 p-1 rounded-xl border border-[#E3DDD1]">
            <button
              onClick={() => onSelectTab('day')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                currentTab === 'day'
                  ? 'bg-[#FAF8F5] text-[#2E2A24] shadow-xs font-semibold'
                  : 'text-[#6B6457] hover:text-[#2E2A24] hover:bg-[#FAF8F5]/50'
              }`}
            >
              <Sun className="w-3.5 h-3.5 text-amber-600" />
              <span>☀️ 今日生活</span>
            </button>

            <button
              onClick={() => onSelectTab('mentor')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                currentTab === 'mentor'
                  ? 'bg-[#FAF8F5] text-[#2E2A24] shadow-xs font-semibold'
                  : 'text-[#6B6457] hover:text-[#2E2A24] hover:bg-[#FAF8F5]/50'
              }`}
            >
              <Brain className="w-3.5 h-3.5 text-purple-600" />
              <span>🧠 成长导师</span>
            </button>

            <button
              onClick={() => onSelectTab('review')}
              className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                currentTab === 'review'
                  ? 'bg-[#FAF8F5] text-[#2E2A24] shadow-xs font-semibold'
                  : 'text-[#6B6457] hover:text-[#2E2A24] hover:bg-[#FAF8F5]/50'
              }`}
            >
              <Moon className="w-3.5 h-3.5 text-indigo-600" />
              <span>🌙 晚间日结</span>
              {todayPendingReviewsCount > 0 && (
                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
              )}
            </button>

            <button
              onClick={() => onSelectTab('vision_goals')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                currentTab === 'vision_goals'
                  ? 'bg-[#FAF8F5] text-[#2E2A24] shadow-xs font-semibold'
                  : 'text-[#6B6457] hover:text-[#2E2A24] hover:bg-[#FAF8F5]/50'
              }`}
            >
              <Target className="w-3.5 h-3.5 text-rose-600" />
              <span>🎯 愿景目标</span>
            </button>

            <button
              onClick={() => onSelectTab('trajectory')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                currentTab === 'trajectory'
                  ? 'bg-[#FAF8F5] text-[#2E2A24] shadow-xs font-semibold'
                  : 'text-[#6B6457] hover:text-[#2E2A24] hover:bg-[#FAF8F5]/50'
              }`}
            >
              <LineChart className="w-3.5 h-3.5 text-emerald-600" />
              <span>📈 长期轨迹</span>
            </button>

            <button
              onClick={() => onSelectTab('timeline')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                currentTab === 'timeline'
                  ? 'bg-[#FAF8F5] text-[#2E2A24] shadow-xs font-semibold'
                  : 'text-[#6B6457] hover:text-[#2E2A24] hover:bg-[#FAF8F5]/50'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-stone-600" />
              <span>📝 事件簿</span>
            </button>
          </nav>

          <div className="flex items-center text-xs text-[#8C8477] font-mono">
            {todayStr}
          </div>
        </div>
      </div>
    </header>
  );
};
