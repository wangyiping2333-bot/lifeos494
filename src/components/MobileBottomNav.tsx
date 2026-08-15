import React from 'react';
import { Sun, Brain, Moon, Compass } from 'lucide-react';
import { AppTabType } from './Header';

interface MobileBottomNavProps {
  currentTab: AppTabType;
  onSelectTab: (tab: AppTabType) => void;
  todayPendingReviewsCount: number;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  currentTab,
  onSelectTab,
  todayPendingReviewsCount,
}) => {
  const isCompassActive =
    currentTab === 'vision_goals' || currentTab === 'trajectory' || currentTab === 'timeline';

  const tabs = [
    {
      id: 'day' as const,
      label: '今日生活',
      shortLabel: '今日',
      icon: Sun,
      color: 'text-amber-700',
      activeBg: 'bg-amber-100/90 text-amber-950',
      isActive: currentTab === 'day',
    },
    {
      id: 'review' as const,
      label: '晚间日结',
      shortLabel: '日结',
      icon: Moon,
      color: 'text-indigo-700',
      activeBg: 'bg-indigo-100/90 text-indigo-950',
      isActive: currentTab === 'review',
      badge: todayPendingReviewsCount > 0,
    },
    {
      id: 'mentor' as const,
      label: '成长导师',
      shortLabel: '导师',
      icon: Brain,
      color: 'text-purple-700',
      activeBg: 'bg-purple-100/90 text-purple-950',
      isActive: currentTab === 'mentor',
    },
    {
      id: 'vision_goals' as const,
      label: '人生罗盘',
      shortLabel: '罗盘',
      icon: Compass,
      color: 'text-rose-700',
      activeBg: 'bg-rose-100/90 text-rose-950',
      isActive: isCompassActive,
    },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#FAF8F5]/96 backdrop-blur-xl border-t border-[#E5DFD4] px-1.5 py-0.5 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] pb-[calc(env(safe-area-inset-bottom,4px)+2px)]">
      <div className="flex items-center justify-around max-w-md mx-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = tab.isActive;
          return (
            <button
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              className={`flex-1 py-1 rounded-xl flex flex-col items-center justify-center transition-all min-h-[44px] ${
                isActive
                  ? 'text-[#2E2A24] font-semibold'
                  : 'text-[#827A6D] active:text-[#2E2A24]'
              }`}
            >
              <div
                className={`px-2.5 py-0.5 rounded-full transition-all relative flex items-center justify-center ${
                  isActive ? `${tab.activeBg} shadow-2xs scale-102` : ''
                }`}
              >
                <Icon
                  className={`w-3.5 h-3.5 transition-transform ${
                    isActive ? `${tab.color} stroke-[2.4]` : 'text-[#7D766A] stroke-[1.8]'
                  }`}
                />
                {tab.badge && (
                  <span className="absolute -top-0.5 right-0.5 w-2 h-2 rounded-full bg-amber-500 ring-2 ring-[#FAF8F5]"></span>
                )}
              </div>
              <span
                className={`text-[10px] mt-0.5 leading-none transition-colors ${
                  isActive ? 'text-[#2E2A24] font-bold' : 'text-[#7D766A]'
                }`}
              >
                {tab.shortLabel}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

