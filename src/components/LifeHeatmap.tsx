import React, { useState, useMemo } from 'react';
import {
  Calendar,
  Clock,
  ChevronLeft,
  ChevronRight,
  Filter,
  Sparkles,
  BarChart3,
  Flame,
  Activity,
  Layers,
  CheckCircle2,
  Info,
  Heart,
  TrendingUp,
} from 'lucide-react';
import { LifeArea, LIFE_AREAS, LifeEvent, LifeState } from '../types';

export type HeatmapGranularity = 'day' | 'week' | 'month' | 'quarter' | 'year';
export type HeatmapMetric = 'duration' | 'count' | 'energy';

interface LifeHeatmapProps {
  events?: LifeEvent[];
  states?: LifeState[];
  initialGranularity?: HeatmapGranularity;
  onSelectDate?: (dateStr: string) => void;
}

// Color shades based on intensity (0 to 4)
const INTENSITY_COLORS = [
  'bg-[#EFEAE0] text-transparent hover:border-[#D5CDC0]', // 0: None
  'bg-[#D8D0C3] text-[#2E2A24] hover:bg-[#CBC2B4]', // 1: Low
  'bg-[#B8AC99] text-[#FAF8F5] hover:bg-[#A89C89]', // 2: Medium
  'bg-[#7A6E5E] text-[#FAF8F5] hover:bg-[#6A5E4E]', // 3: High
  'bg-[#2E2A24] text-[#FAF8F5] hover:bg-[#1E1A14]', // 4: Peak
];

const AREA_COLOR_MAP: Record<LifeArea, { light: string; mid: string; deep: string; border: string }> = {
  career: {
    light: 'bg-amber-100/90 text-amber-900',
    mid: 'bg-amber-300 text-amber-950',
    deep: 'bg-amber-600 text-white',
    border: 'border-amber-400',
  },
  health: {
    light: 'bg-emerald-100/90 text-emerald-900',
    mid: 'bg-emerald-300 text-emerald-950',
    deep: 'bg-emerald-600 text-white',
    border: 'border-emerald-400',
  },
  relationship: {
    light: 'bg-rose-100/90 text-rose-900',
    mid: 'bg-rose-300 text-rose-950',
    deep: 'bg-rose-600 text-white',
    border: 'border-rose-400',
  },
  growth: {
    light: 'bg-indigo-100/90 text-indigo-900',
    mid: 'bg-indigo-300 text-indigo-950',
    deep: 'bg-indigo-600 text-white',
    border: 'border-indigo-400',
  },
  creation: {
    light: 'bg-purple-100/90 text-purple-900',
    mid: 'bg-purple-300 text-purple-950',
    deep: 'bg-purple-600 text-white',
    border: 'border-purple-400',
  },
  life: {
    light: 'bg-stone-200 text-stone-900',
    mid: 'bg-stone-400 text-white',
    deep: 'bg-stone-700 text-white',
    border: 'border-stone-500',
  },
};

export const LifeHeatmap: React.FC<LifeHeatmapProps> = ({
  events = [],
  states = [],
  initialGranularity = 'week',
  onSelectDate,
}) => {
  const [granularity, setGranularity] = useState<HeatmapGranularity>(initialGranularity);
  const [metric, setMetric] = useState<HeatmapMetric>('duration');
  const [selectedAreaFilter, setSelectedAreaFilter] = useState<LifeArea | 'all'>('all');
  const [referenceDate, setReferenceDate] = useState<Date>(new Date());
  
  // Hover or clicked cell inspector state
  const [selectedCellInfo, setSelectedCellInfo] = useState<{
    title: string;
    subtitle?: string;
    area?: LifeArea;
    totalMinutes: number;
    eventCount: number;
    events: LifeEvent[];
    state?: LifeState;
  } | null>(null);

  // Helper date formatters
  const formatDateKey = (d: Date): string => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getIntensityLevel = (minutes: number, count: number): number => {
    if (metric === 'count') {
      if (count === 0) return 0;
      if (count === 1) return 1;
      if (count === 2) return 2;
      if (count === 3) return 3;
      return 4;
    }
    // Duration metric
    if (minutes === 0) return 0;
    if (minutes < 30) return 1;
    if (minutes < 90) return 2;
    if (minutes < 180) return 3;
    return 4;
  };

  // Cell background calculation
  const getCellBg = (minutes: number, count: number, area?: LifeArea) => {
    const level = getIntensityLevel(minutes, count);
    if (level === 0) return INTENSITY_COLORS[0];

    if (selectedAreaFilter !== 'all' && area && selectedAreaFilter === area) {
      const areaTheme = AREA_COLOR_MAP[area];
      if (level <= 1) return areaTheme.light;
      if (level <= 3) return areaTheme.mid;
      return areaTheme.deep;
    }

    if (area && selectedAreaFilter === 'all') {
      // Elegant warm gradient or domain theme
      const areaTheme = AREA_COLOR_MAP[area];
      if (level <= 1) return areaTheme.light;
      if (level <= 2) return areaTheme.mid;
      return areaTheme.deep;
    }

    return INTENSITY_COLORS[level];
  };

  // Navigation handlers
  const handlePrev = () => {
    const next = new Date(referenceDate);
    if (granularity === 'day') {
      next.setDate(next.getDate() - 1);
    } else if (granularity === 'week') {
      next.setDate(next.getDate() - 7);
    } else if (granularity === 'month') {
      next.setMonth(next.getMonth() - 1);
    } else if (granularity === 'quarter') {
      next.setMonth(next.getMonth() - 3);
    } else if (granularity === 'year') {
      next.setFullYear(next.getFullYear() - 1);
    }
    setReferenceDate(next);
    setSelectedCellInfo(null);
  };

  const handleNext = () => {
    const next = new Date(referenceDate);
    if (granularity === 'day') {
      next.setDate(next.getDate() + 1);
    } else if (granularity === 'week') {
      next.setDate(next.getDate() + 7);
    } else if (granularity === 'month') {
      next.setMonth(next.getMonth() + 1);
    } else if (granularity === 'quarter') {
      next.setMonth(next.getMonth() + 3);
    } else if (granularity === 'year') {
      next.setFullYear(next.getFullYear() + 1);
    }
    setReferenceDate(next);
    setSelectedCellInfo(null);
  };

  const handleToday = () => {
    setReferenceDate(new Date());
    setSelectedCellInfo(null);
  };

  // Title header text for current period
  const periodLabel = useMemo(() => {
    const y = referenceDate.getFullYear();
    const m = referenceDate.getMonth() + 1;
    const d = referenceDate.getDate();

    if (granularity === 'day') {
      const weekDayStr = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][
        referenceDate.getDay()
      ];
      return `${y}年${m}月${d}日 (${weekDayStr})`;
    }

    if (granularity === 'week') {
      // Calculate week start and end
      const dayOfWeek = referenceDate.getDay() || 7; // Mon = 1, Sun = 7
      const start = new Date(referenceDate);
      start.setDate(start.getDate() - (dayOfWeek - 1));
      const end = new Date(start);
      end.setDate(end.getDate() + 6);

      const startMonth = start.getMonth() + 1;
      const startDay = start.getDate();
      const endMonth = end.getMonth() + 1;
      const endDay = end.getDate();

      return `${y}年 ${startMonth}月${startDay}日 - ${endMonth}月${endDay}日 (第 ${getWeekNumber(referenceDate)} 周)`;
    }

    if (granularity === 'month') {
      return `${y}年 ${m}月`;
    }

    if (granularity === 'quarter') {
      const q = Math.floor((m - 1) / 3) + 1;
      const startMonth = (q - 1) * 3 + 1;
      const endMonth = q * 3;
      return `${y}年 第${q}季度 (Q${q}: ${startMonth}月 - ${endMonth}月)`;
    }

    if (granularity === 'year') {
      return `${y} 年度全景`;
    }

    return '';
  }, [referenceDate, granularity]);

  function getWeekNumber(d: Date): number {
    const target = new Date(d.valueOf());
    const dayNr = (d.getDay() + 6) % 7;
    target.setDate(target.getDate() - dayNr + 3);
    const firstThursday = target.valueOf();
    target.setMonth(0, 1);
    if (target.getDay() !== 4) {
      target.setMonth(0, 1 + ((4 - target.getDay() + 7) % 7));
    }
    return 1 + Math.ceil((firstThursday - target.valueOf()) / 604800000);
  }

  // Filtered areas to render
  const visibleAreas = useMemo(() => {
    if (selectedAreaFilter === 'all') {
      return (Object.keys(LIFE_AREAS) as LifeArea[]);
    }
    return [selectedAreaFilter];
  }, [selectedAreaFilter]);

  // ==========================================
  // 1. DAY VIEW COMPUTATION (24 Hours Matrix)
  // ==========================================
  const dayViewData = useMemo(() => {
    const targetDateStr = formatDateKey(referenceDate);
    const dayEvents = events.filter((e) => e.date === targetDateStr);
    const dayState = states.find((s) => s.date === targetDateStr);

    // 24 Hour blocks: 0 to 23
    const hours = Array.from({ length: 24 }, (_, i) => i);

    // Matrix: area -> hour -> { events, totalMinutes, count }
    const matrix: Record<LifeArea, Array<{ hour: number; events: LifeEvent[]; totalMinutes: number; count: number }>> = {
      career: [],
      health: [],
      relationship: [],
      growth: [],
      creation: [],
      life: [],
    };

    (Object.keys(LIFE_AREAS) as LifeArea[]).forEach((area) => {
      matrix[area] = hours.map((hour) => {
        // Match events occurring in this hour (by start time or duration distribution)
        const hourEvents = dayEvents.filter((e) => {
          if (e.area !== area) return false;
          if (e.time_start) {
            const startHour = parseInt(e.time_start.split(':')[0], 10);
            if (!isNaN(startHour)) {
              if (e.time_end) {
                const endHour = parseInt(e.time_end.split(':')[0], 10);
                return hour >= startHour && hour <= endHour;
              }
              const durationHours = Math.ceil((e.duration_minutes || 60) / 60);
              return hour >= startHour && hour < startHour + Math.max(1, durationHours);
            }
          }
          // If no specific time_start, assign roughly or show if any
          return false;
        });

        // Unscheduled events fallback if no specific hours
        const unscheduledAreaEvents = dayEvents.filter(
          (e) => e.area === area && (!e.time_start || isNaN(parseInt(e.time_start.split(':')[0], 10)))
        );

        let totalMinutes = hourEvents.reduce((acc, curr) => acc + (curr.duration_minutes || 45), 0);
        let count = hourEvents.length;

        // If whole day has events without exact hours, spread them in active blocks (e.g. 10:00, 15:00, 20:00)
        if (unscheduledAreaEvents.length > 0) {
          if (hour === 10 || hour === 15 || hour === 20) {
            const partIdx = hour === 10 ? 0 : hour === 15 ? 1 : 2;
            const ev = unscheduledAreaEvents[partIdx % unscheduledAreaEvents.length];
            if (ev && !hourEvents.some((he) => he.id === ev.id)) {
              hourEvents.push(ev);
              totalMinutes += ev.duration_minutes || 60;
              count += 1;
            }
          }
        }

        return {
          hour,
          events: hourEvents,
          totalMinutes,
          count,
        };
      });
    });

    const totalDayMinutes = dayEvents.reduce((a, b) => a + (b.duration_minutes || 60), 0);

    return {
      dateStr: targetDateStr,
      dayEvents,
      dayState,
      hours,
      matrix,
      totalDayMinutes,
    };
  }, [events, states, referenceDate]);

  // ==========================================
  // 2. WEEK VIEW COMPUTATION (7 Days Matrix)
  // ==========================================
  const weekViewData = useMemo(() => {
    const dayOfWeek = referenceDate.getDay() || 7;
    const start = new Date(referenceDate);
    start.setDate(start.getDate() - (dayOfWeek - 1));

    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      const dateStr = formatDateKey(d);
      const weekDayName = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'][i];
      return {
        date: d,
        dateStr,
        weekDayName,
        monthDay: `${d.getMonth() + 1}/${d.getDate()}`,
        isToday: dateStr === formatDateKey(new Date()),
      };
    });

    const matrix: Record<LifeArea, Array<{ dateStr: string; events: LifeEvent[]; totalMinutes: number; count: number }>> = {
      career: [],
      health: [],
      relationship: [],
      growth: [],
      creation: [],
      life: [],
    };

    (Object.keys(LIFE_AREAS) as LifeArea[]).forEach((area) => {
      matrix[area] = days.map((day) => {
        const dayAreaEvents = events.filter((e) => e.date === day.dateStr && e.area === area);
        const totalMinutes = dayAreaEvents.reduce((a, b) => a + (b.duration_minutes || 60), 0);
        return {
          dateStr: day.dateStr,
          events: dayAreaEvents,
          totalMinutes,
          count: dayAreaEvents.length,
        };
      });
    });

    // Daily states
    const dailyStates = days.map((day) => {
      return {
        dateStr: day.dateStr,
        state: states.find((s) => s.date === day.dateStr),
        totalEvents: events.filter((e) => e.date === day.dateStr).length,
      };
    });

    return {
      days,
      matrix,
      dailyStates,
    };
  }, [events, states, referenceDate]);

  // ==========================================
  // 3. MONTH VIEW COMPUTATION (Days of Month)
  // ==========================================
  const monthViewData = useMemo(() => {
    const y = referenceDate.getFullYear();
    const m = referenceDate.getMonth();
    const daysInMonth = new Date(y, m + 1, 0).getDate();

    const days = Array.from({ length: daysInMonth }, (_, i) => {
      const d = new Date(y, m, i + 1);
      const dateStr = formatDateKey(d);
      const dayOfWeek = d.getDay();
      return {
        dayNum: i + 1,
        date: d,
        dateStr,
        dayOfWeek,
        isWeekend: dayOfWeek === 0 || dayOfWeek === 6,
        isToday: dateStr === formatDateKey(new Date()),
      };
    });

    const matrix: Record<LifeArea, Array<{ dateStr: string; dayNum: number; events: LifeEvent[]; totalMinutes: number; count: number }>> = {
      career: [],
      health: [],
      relationship: [],
      growth: [],
      creation: [],
      life: [],
    };

    (Object.keys(LIFE_AREAS) as LifeArea[]).forEach((area) => {
      matrix[area] = days.map((day) => {
        const dayAreaEvents = events.filter((e) => e.date === day.dateStr && e.area === area);
        const totalMinutes = dayAreaEvents.reduce((a, b) => a + (b.duration_minutes || 60), 0);
        return {
          dateStr: day.dateStr,
          dayNum: day.dayNum,
          events: dayAreaEvents,
          totalMinutes,
          count: dayAreaEvents.length,
        };
      });
    });

    // Monthly Calendar 7xN Grid
    const firstDayIndex = (new Date(y, m, 1).getDay() + 6) % 7; // Mon = 0
    const totalSlots = Math.ceil((firstDayIndex + daysInMonth) / 7) * 7;

    const calendarGrid = Array.from({ length: totalSlots }, (_, idx) => {
      const dayNumber = idx - firstDayIndex + 1;
      if (dayNumber <= 0 || dayNumber > daysInMonth) {
        return null;
      }
      const d = new Date(y, m, dayNumber);
      const dateStr = formatDateKey(d);
      const dayEvents = events.filter((e) => e.date === dateStr);
      const dayState = states.find((s) => s.date === dateStr);
      const totalMinutes = dayEvents.reduce((a, b) => a + (b.duration_minutes || 60), 0);

      // Area distribution for this day
      const areaHits: Record<LifeArea, number> = {
        career: 0,
        health: 0,
        relationship: 0,
        growth: 0,
        creation: 0,
        life: 0,
      };
      dayEvents.forEach((e) => {
        areaHits[e.area] = (areaHits[e.area] || 0) + 1;
      });

      return {
        dayNumber,
        dateStr,
        dayEvents,
        dayState,
        totalMinutes,
        areaHits,
        isToday: dateStr === formatDateKey(new Date()),
      };
    });

    return {
      days,
      matrix,
      calendarGrid,
      daysInMonth,
    };
  }, [events, states, referenceDate]);

  // ==========================================
  // 4. QUARTER VIEW COMPUTATION (13 Weeks)
  // ==========================================
  const quarterViewData = useMemo(() => {
    const y = referenceDate.getFullYear();
    const m = referenceDate.getMonth();
    const q = Math.floor(m / 3); // 0, 1, 2, 3
    const qStartMonth = q * 3;
    const qStartDate = new Date(y, qStartMonth, 1);
    const qEndDate = new Date(y, qStartMonth + 3, 0);

    // Divide quarter into weeks (approx 13 weeks)
    const weeks: Array<{
      weekIndex: number;
      label: string;
      startDate: Date;
      endDate: Date;
      startStr: string;
      endStr: string;
    }> = [];

    let current = new Date(qStartDate);
    let wIdx = 1;
    while (current <= qEndDate) {
      const wStart = new Date(current);
      const wEnd = new Date(current);
      wEnd.setDate(wEnd.getDate() + 6);
      if (wEnd > qEndDate) {
        wEnd.setTime(qEndDate.getTime());
      }

      weeks.push({
        weekIndex: wIdx,
        label: `W${wIdx} (${wStart.getMonth() + 1}/${wStart.getDate()})`,
        startDate: wStart,
        endDate: wEnd,
        startStr: formatDateKey(wStart),
        endStr: formatDateKey(wEnd),
      });

      current.setDate(current.getDate() + 7);
      wIdx++;
    }

    const matrix: Record<
      LifeArea,
      Array<{ weekLabel: string; events: LifeEvent[]; totalMinutes: number; count: number; startStr: string; endStr: string }>
    > = {
      career: [],
      health: [],
      relationship: [],
      growth: [],
      creation: [],
      life: [],
    };

    (Object.keys(LIFE_AREAS) as LifeArea[]).forEach((area) => {
      matrix[area] = weeks.map((w) => {
        const weekEvents = events.filter((e) => {
          return e.area === area && e.date >= w.startStr && e.date <= w.endStr;
        });
        const totalMinutes = weekEvents.reduce((a, b) => a + (b.duration_minutes || 60), 0);
        return {
          weekLabel: w.label,
          events: weekEvents,
          totalMinutes,
          count: weekEvents.length,
          startStr: w.startStr,
          endStr: w.endStr,
        };
      });
    });

    // 3 Months overview
    const monthsOverview = [0, 1, 2].map((offset) => {
      const monthNum = qStartMonth + offset + 1;
      const monthStartStr = `${y}-${String(monthNum).padStart(2, '0')}-01`;
      const monthEndDate = new Date(y, monthNum, 0);
      const monthEndStr = formatDateKey(monthEndDate);
      const monthEvents = events.filter((e) => e.date >= monthStartStr && e.date <= monthEndStr);
      const totalMinutes = monthEvents.reduce((a, b) => a + (b.duration_minutes || 60), 0);

      return {
        monthNum,
        monthName: `${monthNum}月`,
        totalEvents: monthEvents.length,
        totalHours: Math.round((totalMinutes / 60) * 10) / 10,
      };
    });

    return {
      quarterNum: q + 1,
      weeks,
      matrix,
      monthsOverview,
    };
  }, [events, referenceDate]);

  // ==========================================
  // 5. YEAR VIEW COMPUTATION (52 Weeks & 12 Months)
  // ==========================================
  const yearViewData = useMemo(() => {
    const y = referenceDate.getFullYear();

    // 12 Months matrix
    const months = Array.from({ length: 12 }, (_, i) => {
      const monthNum = i + 1;
      const startStr = `${y}-${String(monthNum).padStart(2, '0')}-01`;
      const endDate = new Date(y, monthNum, 0);
      const endStr = formatDateKey(endDate);
      return {
        monthNum,
        monthName: `${monthNum}月`,
        startStr,
        endStr,
      };
    });

    const monthMatrix: Record<
      LifeArea,
      Array<{ monthNum: number; monthName: string; events: LifeEvent[]; totalMinutes: number; count: number }>
    > = {
      career: [],
      health: [],
      relationship: [],
      growth: [],
      creation: [],
      life: [],
    };

    (Object.keys(LIFE_AREAS) as LifeArea[]).forEach((area) => {
      monthMatrix[area] = months.map((m) => {
        const monthAreaEvents = events.filter((e) => {
          return e.area === area && e.date >= m.startStr && e.date <= m.endStr;
        });
        const totalMinutes = monthAreaEvents.reduce((a, b) => a + (b.duration_minutes || 60), 0);
        return {
          monthNum: m.monthNum,
          monthName: m.monthName,
          events: monthAreaEvents,
          totalMinutes,
          count: monthAreaEvents.length,
        };
      });
    });

    // 52 Weeks Grid (GitHub style 7 x 52)
    const startDate = new Date(y, 0, 1);
    // Align to Monday
    const startDayOfWeek = (startDate.getDay() + 6) % 7; // Mon = 0
    const totalDays = 365 + (new Date(y, 1, 29).getMonth() === 1 ? 1 : 0);

    const yearDays = Array.from({ length: totalDays }, (_, i) => {
      const d = new Date(y, 0, i + 1);
      const dateStr = formatDateKey(d);
      let dayEvents = events.filter((e) => e.date === dateStr);
      if (selectedAreaFilter !== 'all') {
        dayEvents = dayEvents.filter((e) => e.area === selectedAreaFilter);
      }
      const totalMinutes = dayEvents.reduce((a, b) => a + (b.duration_minutes || 60), 0);
      const dayState = states.find((s) => s.date === dateStr);

      return {
        dateStr,
        date: d,
        dayOfWeek: (d.getDay() + 6) % 7, // 0 = Mon, 6 = Sun
        totalMinutes,
        count: dayEvents.length,
        dayEvents,
        dayState,
      };
    });

    // Group into 53 weeks columns
    const weeksCols: Array<Array<(typeof yearDays)[0] | null>> = [];
    let currentWeek: Array<(typeof yearDays)[0] | null> = Array(startDayOfWeek).fill(null);

    yearDays.forEach((item) => {
      currentWeek.push(item);
      if (currentWeek.length === 7) {
        weeksCols.push(currentWeek);
        currentWeek = [];
      }
    });

    if (currentWeek.length > 0) {
      while (currentWeek.length < 7) {
        currentWeek.push(null);
      }
      weeksCols.push(currentWeek);
    }

    const yearEvents = events.filter((e) => e.date.startsWith(`${y}-`));
    const totalYearMinutes = yearEvents.reduce((a, b) => a + (b.duration_minutes || 60), 0);
    const activeDaysCount = new Set(yearEvents.map((e) => e.date)).size;

    return {
      year: y,
      months,
      monthMatrix,
      weeksCols,
      totalYearMinutes,
      activeDaysCount,
      totalYearEvents: yearEvents.length,
    };
  }, [events, states, referenceDate, selectedAreaFilter]);

  // Dynamic summary stats for current view
  const currentPeriodStats = useMemo(() => {
    let currentPeriodEvents: LifeEvent[] = [];

    if (granularity === 'day') {
      currentPeriodEvents = dayViewData.dayEvents;
    } else if (granularity === 'week') {
      const start = weekViewData.days[0]?.dateStr;
      const end = weekViewData.days[6]?.dateStr;
      currentPeriodEvents = events.filter((e) => e.date >= start && e.date <= end);
    } else if (granularity === 'month') {
      const y = referenceDate.getFullYear();
      const m = String(referenceDate.getMonth() + 1).padStart(2, '0');
      currentPeriodEvents = events.filter((e) => e.date.startsWith(`${y}-${m}-`));
    } else if (granularity === 'quarter') {
      const y = referenceDate.getFullYear();
      const q = Math.floor(referenceDate.getMonth() / 3);
      const startM = String(q * 3 + 1).padStart(2, '0');
      const endM = String(q * 3 + 3).padStart(2, '0');
      currentPeriodEvents = events.filter((e) => {
        const em = e.date.slice(5, 7);
        return e.date.startsWith(`${y}-`) && em >= startM && em <= endM;
      });
    } else {
      const y = referenceDate.getFullYear();
      currentPeriodEvents = events.filter((e) => e.date.startsWith(`${y}-`));
    }

    const totalMinutes = currentPeriodEvents.reduce((a, b) => a + (b.duration_minutes || 60), 0);
    const totalHours = Math.round((totalMinutes / 60) * 10) / 10;
    const totalCount = currentPeriodEvents.length;

    // Top area
    const areaCounts: Record<string, number> = {};
    currentPeriodEvents.forEach((e) => {
      areaCounts[e.area] = (areaCounts[e.area] || 0) + (e.duration_minutes || 60);
    });
    let topArea: LifeArea = 'career';
    let maxM = -1;
    Object.entries(areaCounts).forEach(([k, v]) => {
      if (v > maxM) {
        maxM = v;
        topArea = k as LifeArea;
      }
    });

    return {
      totalHours,
      totalCount,
      topArea: maxM > 0 ? topArea : null,
      activeDays: new Set(currentPeriodEvents.map((e) => e.date)).size,
    };
  }, [events, granularity, referenceDate, dayViewData, weekViewData]);

  return (
    <div className="space-y-4">
      {/* 1. Header Controls: Granularity Tabs & Navigation Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-4 rounded-2xl bg-[#FAF8F5] border border-[#E9E4DC] shadow-xs">
        {/* Granularity Switcher: 日 / 周 / 月 / 季度 / 年 */}
        <div className="flex items-center gap-1 bg-[#EFEAE0] p-1 rounded-xl border border-[#E0D8CA] self-start sm:self-auto overflow-x-auto">
          <button
            onClick={() => setGranularity('day')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap flex items-center gap-1.5 ${
              granularity === 'day'
                ? 'bg-[#2E2A24] text-[#FAF8F5] shadow-xs'
                : 'text-[#6B6457] hover:text-[#2E2A24] hover:bg-[#FAF8F5]/60'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>日视图 (Day)</span>
          </button>

          <button
            onClick={() => setGranularity('week')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap flex items-center gap-1.5 ${
              granularity === 'week'
                ? 'bg-[#2E2A24] text-[#FAF8F5] shadow-xs'
                : 'text-[#6B6457] hover:text-[#2E2A24] hover:bg-[#FAF8F5]/60'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>周视图 (Week)</span>
          </button>

          <button
            onClick={() => setGranularity('month')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap flex items-center gap-1.5 ${
              granularity === 'month'
                ? 'bg-[#2E2A24] text-[#FAF8F5] shadow-xs'
                : 'text-[#6B6457] hover:text-[#2E2A24] hover:bg-[#FAF8F5]/60'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>月视图 (Month)</span>
          </button>

          <button
            onClick={() => setGranularity('quarter')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap flex items-center gap-1.5 ${
              granularity === 'quarter'
                ? 'bg-[#2E2A24] text-[#FAF8F5] shadow-xs'
                : 'text-[#6B6457] hover:text-[#2E2A24] hover:bg-[#FAF8F5]/60'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>季度视图 (Quarter)</span>
          </button>

          <button
            onClick={() => setGranularity('year')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap flex items-center gap-1.5 ${
              granularity === 'year'
                ? 'bg-[#2E2A24] text-[#FAF8F5] shadow-xs'
                : 'text-[#6B6457] hover:text-[#2E2A24] hover:bg-[#FAF8F5]/60'
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            <span>年视图 (Year)</span>
          </button>
        </div>

        {/* Date Navigator + Today button */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-[#F5F0E6] border border-[#E2DBD0] rounded-xl px-2 py-1">
            <button
              onClick={handlePrev}
              className="p-1 rounded-lg hover:bg-[#EBE4D8] text-[#5C5548] hover:text-[#2E2A24] transition-colors"
              title="前一时段"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="text-xs font-semibold text-[#2E2A24] px-2 min-w-[140px] text-center font-mono">
              {periodLabel}
            </span>

            <button
              onClick={handleNext}
              className="p-1 rounded-lg hover:bg-[#EBE4D8] text-[#5C5548] hover:text-[#2E2A24] transition-colors"
              title="后一时段"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={handleToday}
            className="px-2.5 py-1.5 rounded-xl bg-[#EFEAE0] hover:bg-[#E5DFD2] text-[#4A443B] text-xs font-medium transition-colors border border-[#DDD5C6]"
          >
            回到当前
          </button>
        </div>
      </div>

      {/* 2. Secondary Filter Bar: Metric (时长/频次) & Area Highlighting Filter */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 rounded-xl bg-[#F6F2EA] border border-[#E8E2D6] text-xs">
        {/* Life Area Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 max-w-full">
          <span className="text-[11px] text-[#7A7264] flex items-center gap-1 shrink-0 font-medium mr-1">
            <Filter className="w-3 h-3" />
            <span>领域过滤:</span>
          </span>

          <button
            onClick={() => setSelectedAreaFilter('all')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all shrink-0 ${
              selectedAreaFilter === 'all'
                ? 'bg-[#2E2A24] text-[#FAF8F5]'
                : 'bg-[#EAE4D7] text-[#5C5548] hover:bg-[#DDD5C6]'
            }`}
          >
            全部 6 大领域
          </button>

          {(Object.keys(LIFE_AREAS) as LifeArea[]).map((areaKey) => {
            const meta = LIFE_AREAS[areaKey];
            const isSelected = selectedAreaFilter === areaKey;
            return (
              <button
                key={areaKey}
                onClick={() => setSelectedAreaFilter(areaKey)}
                className={`px-2 py-1 rounded-lg text-[11px] font-medium transition-all shrink-0 flex items-center gap-1 ${
                  isSelected
                    ? `${meta.bgColor} ${meta.color} border ${meta.borderColor} font-bold shadow-2xs`
                    : 'bg-[#EAE4D7]/80 text-[#6B6457] hover:bg-[#DDD5C6]'
                }`}
              >
                <span>{meta.emoji}</span>
                <span>{meta.label.split('/')[0]}</span>
              </button>
            );
          })}
        </div>

        {/* Metric Selector (Duration vs Count) */}
        <div className="flex items-center gap-1 shrink-0 ml-auto">
          <span className="text-[11px] text-[#7A7264]">热力指标:</span>
          <div className="flex items-center bg-[#E5DFD2] p-0.5 rounded-lg">
            <button
              onClick={() => setMetric('duration')}
              className={`px-2 py-0.5 rounded-md text-[10px] font-medium transition-all ${
                metric === 'duration'
                  ? 'bg-[#FAF8F5] text-[#2E2A24] shadow-2xs font-semibold'
                  : 'text-[#6B6457] hover:text-[#2E2A24]'
              }`}
            >
              投入时长 (h/m)
            </button>
            <button
              onClick={() => setMetric('count')}
              className={`px-2 py-0.5 rounded-md text-[10px] font-medium transition-all ${
                metric === 'count'
                  ? 'bg-[#FAF8F5] text-[#2E2A24] shadow-2xs font-semibold'
                  : 'text-[#6B6457] hover:text-[#2E2A24]'
              }`}
            >
              事件频次 (条)
            </button>
          </div>
        </div>
      </div>

      {/* 3. Heatmap Display Area (Dynamic based on Granularity) */}
      <div className="p-5 rounded-2xl bg-[#FAF8F5] border border-[#E9E4DC] shadow-xs space-y-4">
        {/* ========================================================================= */}
        {/* VIEW 1: DAY VIEW (24-Hour Time Block Heatmap) */}
        {/* ========================================================================= */}
        {granularity === 'day' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs pb-2 border-b border-[#F0ECE4]">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-[#2E2A24]">
                  🕒 24 小时生活领域时段热力分布 (00:00 - 23:00)
                </span>
                {dayViewData.dayState && (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-medium">
                    能量指数: {dayViewData.dayState.energyLevel}/5 · {dayViewData.dayState.primaryMood}
                  </span>
                )}
              </div>
              <span className="text-[11px] text-[#8C8477]">
                当日共记录 {dayViewData.dayEvents.length} 条事件 · 约{' '}
                {Math.round((dayViewData.totalDayMinutes / 60) * 10) / 10} 小时
              </span>
            </div>

            <div className="overflow-x-auto pb-2 scrollbar-thin">
              <table className="w-full min-w-[700px] text-xs">
                <thead>
                  <tr>
                    <th className="text-left py-2 font-medium text-[#7A7264] w-28">领域</th>
                    {dayViewData.hours.map((h) => (
                      <th
                        key={h}
                        className={`text-center py-1 font-mono text-[10px] ${
                          h >= 9 && h <= 18 ? 'text-[#2E2A24] font-semibold' : 'text-[#A0988A]'
                        }`}
                      >
                        {h}:00
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F0ECE4]">
                  {visibleAreas.map((areaKey) => {
                    const meta = LIFE_AREAS[areaKey];
                    const hourDataList = dayViewData.matrix[areaKey];

                    return (
                      <tr key={areaKey} className="hover:bg-[#F6F2EA]/50 transition-colors">
                        <td className="py-2.5 text-[#2E2A24] font-medium flex items-center gap-1.5 pr-2">
                          <span>{meta.emoji}</span>
                          <span className="text-[11px] truncate">{meta.label.split('/')[0]}</span>
                        </td>
                        {hourDataList.map((slot) => {
                          const level = getIntensityLevel(slot.totalMinutes, slot.count);
                          const bgClass = getCellBg(slot.totalMinutes, slot.count, areaKey);

                          return (
                            <td key={slot.hour} className="text-center py-1 px-0.5">
                              <div
                                onClick={() => {
                                  if (slot.count > 0) {
                                    setSelectedCellInfo({
                                      title: `${dayViewData.dateStr} ${slot.hour}:00 - ${slot.hour + 1}:00`,
                                      subtitle: `${meta.emoji} ${meta.label}`,
                                      area: areaKey,
                                      totalMinutes: slot.totalMinutes,
                                      eventCount: slot.count,
                                      events: slot.events,
                                    });
                                  }
                                }}
                                className={`w-6 h-6 sm:w-7 sm:h-7 mx-auto rounded-md cursor-pointer transition-all flex items-center justify-center border border-transparent ${bgClass}`}
                                title={`${meta.label} [${slot.hour}:00]: ${
                                  slot.count > 0
                                    ? `${slot.count} 条记录 (${slot.totalMinutes} 分钟)`
                                    : '无活动'
                                }`}
                              >
                                {slot.count > 0 && (
                                  <span className="text-[9px] font-mono font-bold">
                                    {metric === 'count'
                                      ? slot.count
                                      : `${Math.round(slot.totalMinutes)}m`}
                                  </span>
                                )}
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Time Blocks Quick Guide */}
            <div className="flex items-center justify-between text-[11px] text-[#7A7264] pt-2 border-t border-[#F0ECE4]">
              <div className="flex items-center gap-4">
                <span>🌅 晨间 (6-9)</span>
                <span>☀️ 日间深度 (9-18)</span>
                <span>🌆 傍晚复盘 (18-21)</span>
                <span>🌙 夜间休整 (21-24)</span>
              </div>
              <span className="text-[#999081]">点击任一有色色块查看时段事实卡片</span>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 2: WEEK VIEW (7-Day Area Matrix) */}
        {/* ========================================================================= */}
        {granularity === 'week' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs pb-2 border-b border-[#F0ECE4]">
              <span className="font-semibold text-[#2E2A24]">
                🗓️ 本周 7 天六大生活领域投入热力矩阵
              </span>
              <span className="text-[11px] text-[#8C8477]">
                跨越 7 天节奏分析 · 观察周末与工作日节律
              </span>
            </div>

            <div className="overflow-x-auto pb-1 scrollbar-thin">
              <table className="w-full min-w-[500px] text-xs">
                <thead>
                  <tr>
                    <th className="text-left py-2 font-medium text-[#7A7264] w-28">领域</th>
                    {weekViewData.days.map((d) => (
                      <th
                        key={d.dateStr}
                        className={`text-center py-2 font-mono ${
                          d.isToday
                            ? 'text-amber-900 font-bold bg-amber-100/60 rounded-t-lg'
                            : 'text-[#6B6457]'
                        }`}
                      >
                        <div className="text-[11px]">{d.weekDayName}</div>
                        <div className="text-[9px] text-[#9E9587] font-normal">{d.monthDay}</div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F0ECE4]">
                  {visibleAreas.map((areaKey) => {
                    const meta = LIFE_AREAS[areaKey];
                    const dayDataList = weekViewData.matrix[areaKey];

                    return (
                      <tr key={areaKey} className="hover:bg-[#F6F2EA]/50 transition-colors">
                        <td className="py-2.5 text-[#2E2A24] font-medium flex items-center gap-1.5 pr-2">
                          <span>{meta.emoji}</span>
                          <span className="text-[11px] truncate">{meta.label.split('/')[0]}</span>
                        </td>

                        {dayDataList.map((slot) => {
                          const bgClass = getCellBg(slot.totalMinutes, slot.count, areaKey);

                          return (
                            <td key={slot.dateStr} className="text-center py-1.5 px-1">
                              <div
                                onClick={() => {
                                  if (slot.count > 0) {
                                    setSelectedCellInfo({
                                      title: `${slot.dateStr} 活动`,
                                      subtitle: `${meta.emoji} ${meta.label}`,
                                      area: areaKey,
                                      totalMinutes: slot.totalMinutes,
                                      eventCount: slot.count,
                                      events: slot.events,
                                      state: states.find((s) => s.date === slot.dateStr),
                                    });
                                  }
                                }}
                                className={`w-8 h-8 sm:w-10 sm:h-9 mx-auto rounded-lg cursor-pointer transition-all flex flex-col items-center justify-center border border-transparent shadow-2xs ${bgClass}`}
                                title={`${slot.dateStr} [${meta.label}]: ${slot.count} 条记录 · ${slot.totalMinutes} 分钟`}
                              >
                                {slot.count > 0 ? (
                                  <>
                                    <span className="text-[10px] font-mono font-bold leading-tight">
                                      {metric === 'count'
                                        ? slot.count
                                        : `${Math.round((slot.totalMinutes / 60) * 10) / 10}h`}
                                    </span>
                                    <span className="text-[8px] opacity-80 leading-none">
                                      {slot.count}件
                                    </span>
                                  </>
                                ) : (
                                  <span className="text-[10px] opacity-20">·</span>
                                )}
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}

                  {/* Daily Mood & Energy summary row */}
                  <tr className="bg-[#F3EFE7]/80">
                    <td className="py-2 text-[11px] font-semibold text-[#5C5548]">
                      ⚡ 身心状态 / 能量
                    </td>
                    {weekViewData.dailyStates.map((ds) => (
                      <td key={ds.dateStr} className="text-center py-2 px-1">
                        {ds.state ? (
                          <div
                            onClick={() => {
                              setSelectedCellInfo({
                                title: `${ds.dateStr} 身心状态`,
                                subtitle: `能量值: ${ds.state?.energyLevel}/5 · ${ds.state?.primaryMood}`,
                                totalMinutes: 0,
                                eventCount: ds.totalEvents,
                                events: events.filter((e) => e.date === ds.dateStr),
                                state: ds.state,
                              });
                            }}
                            className="cursor-pointer hover:scale-105 transition-transform"
                            title={`${ds.dateStr}: 能量 ${ds.state.energyLevel}/5 (${ds.state.primaryMood})`}
                          >
                            <span className="text-[11px] font-bold text-emerald-800">
                              ⚡{ds.state.energyLevel}
                            </span>
                            <div className="text-[9px] text-[#7A7264] truncate max-w-[45px] mx-auto">
                              {ds.state.primaryMood}
                            </div>
                          </div>
                        ) : (
                          <span className="text-[10px] text-[#A8A092]">-</span>
                        )}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 3: MONTH VIEW (Monthly Calendar & Days Grid) */}
        {/* ========================================================================= */}
        {granularity === 'month' && (
          <div className="space-y-5">
            {/* Mode A: Monthly Calendar Grid with Area Dots */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs pb-2 border-b border-[#F0ECE4]">
                <span className="font-semibold text-[#2E2A24]">
                  🌕 月度全景日历热力图 ({monthViewData.daysInMonth} 天)
                </span>
                <span className="text-[11px] text-[#8C8477]">
                  色块越深表示投入时间越密集 · 点按日期查看当日所有记录
                </span>
              </div>

              {/* 7 Columns Week Grid */}
              <div className="grid grid-cols-7 gap-1.5 sm:gap-2 text-xs">
                {['周一', '周二', '周三', '周四', '周五', '周六', '周日'].map((w, idx) => (
                  <div
                    key={w}
                    className={`text-center py-1 font-semibold text-[11px] ${
                      idx >= 5 ? 'text-amber-800' : 'text-[#7A7264]'
                    }`}
                  >
                    {w}
                  </div>
                ))}

                {monthViewData.calendarGrid.map((slot, idx) => {
                  if (!slot) {
                    return (
                      <div
                        key={`empty-${idx}`}
                        className="h-14 sm:h-16 rounded-xl bg-[#FAF8F5]/30 border border-transparent"
                      />
                    );
                  }

                  const level = getIntensityLevel(slot.totalMinutes, slot.dayEvents.length);
                  const isPeak = level >= 3;

                  return (
                    <div
                      key={slot.dateStr}
                      onClick={() => {
                        setSelectedCellInfo({
                          title: `${slot.dateStr} 当日记录`,
                          subtitle: `${slot.dayEvents.length} 条生活事件 · 共 ${
                            Math.round((slot.totalMinutes / 60) * 10) / 10
                          } 小时`,
                          totalMinutes: slot.totalMinutes,
                          eventCount: slot.dayEvents.length,
                          events: slot.dayEvents,
                          state: slot.dayState,
                        });
                        if (onSelectDate) onSelectDate(slot.dateStr);
                      }}
                      className={`h-14 sm:h-16 p-1.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                        slot.isToday ? 'ring-2 ring-amber-500 ring-offset-1' : ''
                      } ${
                        slot.dayEvents.length > 0
                          ? 'bg-[#F2ECE1] border-[#DFD7C9] hover:border-[#2E2A24]'
                          : 'bg-[#F9F6F0] border-[#EFE9DE] hover:bg-[#F3EFE6]'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span
                          className={`font-mono text-[11px] font-semibold ${
                            slot.isToday
                              ? 'bg-amber-500 text-white w-4 h-4 rounded-full flex items-center justify-center'
                              : 'text-[#4A443B]'
                          }`}
                        >
                          {slot.dayNumber}
                        </span>

                        {slot.dayState && (
                          <span
                            className="text-[9px] px-1 py-0.2 rounded bg-emerald-100 text-emerald-800 font-mono"
                            title={`能量: ${slot.dayState.energyLevel}/5`}
                          >
                            ⚡{slot.dayState.energyLevel}
                          </span>
                        )}
                      </div>

                      {/* Area presence dots */}
                      <div className="flex items-center gap-0.5 overflow-hidden">
                        {(Object.keys(LIFE_AREAS) as LifeArea[]).map((ak) => {
                          const count = slot.areaHits[ak] || 0;
                          if (count === 0) return null;
                          return (
                            <span
                              key={ak}
                              className="text-[9px] leading-none"
                              title={`${LIFE_AREAS[ak].label}: ${count}条`}
                            >
                              {LIFE_AREAS[ak].emoji}
                            </span>
                          );
                        })}
                      </div>

                      {/* Bottom duration/count indicator */}
                      <div className="text-[9px] text-[#7A7264] font-mono flex items-center justify-between">
                        <span>
                          {slot.totalMinutes > 0
                            ? `${Math.round((slot.totalMinutes / 60) * 10) / 10}h`
                            : ''}
                        </span>
                        {slot.dayEvents.length > 0 && (
                          <span className="opacity-70 font-sans">{slot.dayEvents.length}条</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 4: QUARTER VIEW (13 Weeks Trajectory) */}
        {/* ========================================================================= */}
        {granularity === 'quarter' && (
          <div className="space-y-5">
            <div className="flex items-center justify-between text-xs pb-2 border-b border-[#F0ECE4]">
              <span className="font-semibold text-[#2E2A24]">
                📊 第 {quarterViewData.quarterNum} 季度 13 周生活重心迁移热力图
              </span>
              <span className="text-[11px] text-[#8C8477]">
                按周追踪 6 大领域势能变化 · 识别中长期失衡与爆发期
              </span>
            </div>

            {/* Months 3-Block Summary */}
            <div className="grid grid-cols-3 gap-3">
              {quarterViewData.monthsOverview.map((mo) => (
                <div
                  key={mo.monthNum}
                  className="p-3 rounded-xl bg-[#F6F2EA] border border-[#E8E2D6] space-y-1 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-[#2E2A24]">{mo.monthName}</span>
                    <span className="font-mono text-emerald-800 font-medium">
                      {mo.totalHours} 小时
                    </span>
                  </div>
                  <div className="text-[11px] text-[#7A7264]">
                    共记录事实 {mo.totalEvents} 条
                  </div>
                </div>
              ))}
            </div>

            {/* 13 Weeks Table Matrix */}
            <div className="overflow-x-auto pb-2 scrollbar-thin">
              <table className="w-full min-w-[650px] text-xs">
                <thead>
                  <tr>
                    <th className="text-left py-2 font-medium text-[#7A7264] w-28">领域</th>
                    {quarterViewData.weeks.map((w) => (
                      <th
                        key={w.weekIndex}
                        className="text-center py-2 font-mono text-[10px] text-[#6B6457]"
                      >
                        <div>W{w.weekIndex}</div>
                        <div className="text-[8px] text-[#9E9587]">
                          {w.startDate.getMonth() + 1}/{w.startDate.getDate()}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F0ECE4]">
                  {visibleAreas.map((areaKey) => {
                    const meta = LIFE_AREAS[areaKey];
                    const weekDataList = quarterViewData.matrix[areaKey];

                    return (
                      <tr key={areaKey} className="hover:bg-[#F6F2EA]/50 transition-colors">
                        <td className="py-2.5 text-[#2E2A24] font-medium flex items-center gap-1.5 pr-2">
                          <span>{meta.emoji}</span>
                          <span className="text-[11px] truncate">{meta.label.split('/')[0]}</span>
                        </td>

                        {weekDataList.map((slot, widx) => {
                          const bgClass = getCellBg(slot.totalMinutes, slot.count, areaKey);

                          return (
                            <td key={widx} className="text-center py-1.5 px-0.5">
                              <div
                                onClick={() => {
                                  if (slot.count > 0) {
                                    setSelectedCellInfo({
                                      title: `第 ${quarterViewData.quarterNum} 季度 W${widx + 1} (${slot.startStr} ~ ${slot.endStr})`,
                                      subtitle: `${meta.emoji} ${meta.label}`,
                                      area: areaKey,
                                      totalMinutes: slot.totalMinutes,
                                      eventCount: slot.count,
                                      events: slot.events,
                                    });
                                  }
                                }}
                                className={`w-7 h-7 sm:w-8 sm:h-8 mx-auto rounded-lg cursor-pointer transition-all flex items-center justify-center border border-transparent shadow-2xs ${bgClass}`}
                                title={`${meta.label} [W${widx + 1}]: ${slot.count} 条 · ${Math.round(slot.totalMinutes / 60)}h`}
                              >
                                {slot.count > 0 && (
                                  <span className="text-[9px] font-mono font-bold">
                                    {metric === 'count'
                                      ? slot.count
                                      : `${Math.round(slot.totalMinutes / 60)}h`}
                                  </span>
                                )}
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 5: YEAR VIEW (GitHub 52-Week Contribution Grid + 12-Month Matrix) */}
        {/* ========================================================================= */}
        {granularity === 'year' && (
          <div className="space-y-6">
            {/* Top Stat Banner for Year */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-xl bg-[#F6F2EA] border border-[#E8E2D6] text-xs">
                <span className="text-[#7A7264] text-[11px]">年度累计事实记录</span>
                <div className="text-lg font-bold text-[#2E2A24] font-mono mt-0.5">
                  {yearViewData.totalYearEvents} <span className="text-xs font-normal">条</span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-[#F6F2EA] border border-[#E8E2D6] text-xs">
                <span className="text-[#7A7264] text-[11px]">年度专注与生活投入</span>
                <div className="text-lg font-bold text-emerald-900 font-mono mt-0.5">
                  {Math.round((yearViewData.totalYearMinutes / 60) * 10) / 10}{' '}
                  <span className="text-xs font-normal">小时</span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-[#F6F2EA] border border-[#E8E2D6] text-xs">
                <span className="text-[#7A7264] text-[11px]">活跃打卡天数</span>
                <div className="text-lg font-bold text-amber-900 font-mono mt-0.5">
                  {yearViewData.activeDaysCount} <span className="text-xs font-normal">天</span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-[#F6F2EA] border border-[#E8E2D6] text-xs">
                <span className="text-[#7A7264] text-[11px]">年度生活连续性</span>
                <div className="text-lg font-bold text-indigo-900 font-mono mt-0.5">
                  {Math.round((yearViewData.activeDaysCount / 365) * 100)}%
                </div>
              </div>
            </div>

            {/* 52-Week GitHub Style Annual Heatmap */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs pb-1 border-b border-[#F0ECE4]">
                <span className="font-semibold text-[#2E2A24] flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5 text-amber-600" />
                  <span>365 天年度生命足迹网格 (Annual Contribution Matrix)</span>
                </span>
                <span className="text-[11px] text-[#8C8477]">
                  {selectedAreaFilter === 'all'
                    ? '全领域沉淀'
                    : `当前仅高亮: ${LIFE_AREAS[selectedAreaFilter].label}`}
                </span>
              </div>

              <div className="overflow-x-auto pb-2 scrollbar-thin">
                <div className="flex gap-1 min-w-[760px] p-1">
                  {yearViewData.weeksCols.map((week, wIdx) => (
                    <div key={wIdx} className="flex flex-col gap-1">
                      {week.map((dayItem, dIdx) => {
                        if (!dayItem) {
                          return (
                            <div
                              key={`empty-${dIdx}`}
                              className="w-3 h-3 rounded-2xs bg-transparent"
                            />
                          );
                        }

                        const level = getIntensityLevel(dayItem.totalMinutes, dayItem.count);
                        const bgClass =
                          level === 0
                            ? 'bg-[#EAE4D7] hover:border-[#BDB3A2]'
                            : selectedAreaFilter !== 'all'
                            ? getCellBg(dayItem.totalMinutes, dayItem.count, selectedAreaFilter)
                            : INTENSITY_COLORS[level];

                        return (
                          <div
                            key={dayItem.dateStr}
                            onClick={() => {
                              if (dayItem.count > 0) {
                                setSelectedCellInfo({
                                  title: `${dayItem.dateStr} 年度记录`,
                                  subtitle: `${dayItem.count} 条生活事实 · ${Math.round(
                                    dayItem.totalMinutes / 60
                                  )} 小时`,
                                  totalMinutes: dayItem.totalMinutes,
                                  eventCount: dayItem.count,
                                  events: dayItem.dayEvents,
                                  state: dayItem.dayState,
                                });
                              }
                            }}
                            className={`w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-2xs cursor-pointer transition-transform hover:scale-125 border border-transparent ${bgClass}`}
                            title={`${dayItem.dateStr}: ${dayItem.count} 条记录 (${Math.round(
                              dayItem.totalMinutes / 60
                            )} 小时)`}
                          />
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>

              {/* Intensity Legend */}
              <div className="flex items-center justify-between text-[10px] text-[#8C8477] pt-1">
                <span>1月</span>
                <span>3月</span>
                <span>5月</span>
                <span>7月</span>
                <span>9月</span>
                <span>11月</span>
                <span>12月</span>

                <div className="flex items-center gap-1 ml-auto">
                  <span>少</span>
                  <div className="w-2.5 h-2.5 rounded-2xs bg-[#EAE4D7]" />
                  <div className="w-2.5 h-2.5 rounded-2xs bg-[#D8D0C3]" />
                  <div className="w-2.5 h-2.5 rounded-2xs bg-[#B8AC99]" />
                  <div className="w-2.5 h-2.5 rounded-2xs bg-[#7A6E5E]" />
                  <div className="w-2.5 h-2.5 rounded-2xs bg-[#2E2A24]" />
                  <span>多</span>
                </div>
              </div>
            </div>

            {/* 12 Months × 6 Areas Summary Matrix */}
            <div className="space-y-3 pt-2">
              <h4 className="text-xs font-semibold text-[#2E2A24]">
                📅 12 个月度各领域深层热力分布
              </h4>

              <div className="overflow-x-auto pb-1 scrollbar-thin">
                <table className="w-full min-w-[600px] text-xs">
                  <thead>
                    <tr>
                      <th className="text-left py-2 font-medium text-[#7A7264] w-28">领域</th>
                      {yearViewData.months.map((m) => (
                        <th
                          key={m.monthNum}
                          className="text-center py-2 font-mono text-[10px] text-[#6B6457]"
                        >
                          {m.monthName}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F0ECE4]">
                    {visibleAreas.map((areaKey) => {
                      const meta = LIFE_AREAS[areaKey];
                      const monthDataList = yearViewData.monthMatrix[areaKey];

                      return (
                        <tr key={areaKey} className="hover:bg-[#F6F2EA]/50 transition-colors">
                          <td className="py-2 text-[#2E2A24] font-medium flex items-center gap-1.5 pr-2">
                            <span>{meta.emoji}</span>
                            <span className="text-[11px] truncate">{meta.label.split('/')[0]}</span>
                          </td>

                          {monthDataList.map((slot) => {
                            const bgClass = getCellBg(slot.totalMinutes, slot.count, areaKey);

                            return (
                              <td key={slot.monthNum} className="text-center py-1.5 px-0.5">
                                <div
                                  onClick={() => {
                                    if (slot.count > 0) {
                                      setSelectedCellInfo({
                                        title: `${yearViewData.year}年 ${slot.monthName} 总结`,
                                        subtitle: `${meta.emoji} ${meta.label}`,
                                        area: areaKey,
                                        totalMinutes: slot.totalMinutes,
                                        eventCount: slot.count,
                                        events: slot.events,
                                      });
                                    }
                                  }}
                                  className={`w-7 h-7 sm:w-8 sm:h-8 mx-auto rounded-lg cursor-pointer transition-all flex items-center justify-center border border-transparent shadow-2xs ${bgClass}`}
                                  title={`${slot.monthName} [${meta.label}]: ${slot.count} 条 · ${Math.round(
                                    slot.totalMinutes / 60
                                  )}h`}
                                >
                                  {slot.count > 0 && (
                                    <span className="text-[9px] font-mono font-bold">
                                      {metric === 'count'
                                        ? slot.count
                                        : `${Math.round(slot.totalMinutes / 60)}h`}
                                    </span>
                                  )}
                                </div>
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 4. Cell Inspector Card (Detail View when clicking on any active cell) */}
      {selectedCellInfo && (
        <div className="p-4 rounded-2xl bg-[#FFFDF9] border border-[#DDD5C6] shadow-sm space-y-3 animate-in fade-in duration-200">
          <div className="flex items-center justify-between pb-2 border-b border-[#EFEAE0]">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-900 flex items-center justify-center font-bold text-xs">
                🔍
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-semibold text-[#2E2A24]">
                  {selectedCellInfo.title}
                </h4>
                {selectedCellInfo.subtitle && (
                  <p className="text-[11px] text-[#7A7264]">{selectedCellInfo.subtitle}</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono bg-[#EFEAE0] text-[#5C5548] px-2 py-0.5 rounded">
                共 {selectedCellInfo.eventCount} 条记录 ·{' '}
                {Math.round((selectedCellInfo.totalMinutes / 60) * 10) / 10} 小时
              </span>
              <button
                onClick={() => setSelectedCellInfo(null)}
                className="text-[#8C8477] hover:text-[#2E2A24] text-xs p-1 rounded hover:bg-[#EFEAE0]"
              >
                ✕
              </button>
            </div>
          </div>

          {/* State details if available */}
          {selectedCellInfo.state && (
            <div className="p-2.5 rounded-xl bg-emerald-50/80 border border-emerald-200 text-xs flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="w-3.5 h-3.5 text-emerald-700" />
                <span className="font-semibold text-emerald-950">
                  身心状态: {selectedCellInfo.state.primaryMood}
                </span>
                <span className="text-emerald-800 text-[11px]">
                  (能量: {selectedCellInfo.state.energyLevel}/5)
                </span>
              </div>
              {selectedCellInfo.state.contextDescription && (
                <span className="text-[11px] text-emerald-900/80 truncate max-w-[280px]">
                  {selectedCellInfo.state.contextDescription}
                </span>
              )}
            </div>
          )}

          {/* Events list in this slot */}
          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {selectedCellInfo.events.map((evt) => {
              const meta = LIFE_AREAS[evt.area];
              return (
                <div
                  key={evt.id}
                  className="p-2.5 rounded-xl bg-[#FAF8F5] border border-[#E9E4DC] text-xs flex items-start justify-between gap-3"
                >
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] px-1.5 py-0.2 rounded font-medium bg-[#EFEAE0] text-[#5C5548]">
                        {meta.emoji} {meta.label.split('/')[0]}
                      </span>
                      <span className="text-[10px] text-[#8C8477] font-mono">
                        {evt.category} {evt.subcategory ? `· ${evt.subcategory}` : ''}
                      </span>
                      {evt.time_start && (
                        <span className="text-[10px] text-stone-500 font-mono">
                          🕒 {evt.time_start} {evt.time_end ? `- ${evt.time_end}` : ''}
                        </span>
                      )}
                    </div>
                    <p className="text-[#2E2A24] font-medium leading-relaxed">
                      {evt.description}
                    </p>
                    {evt.interpretation && (
                      <p className="text-[11px] text-[#7A7264] italic">
                        💡 {evt.interpretation}
                      </p>
                    )}
                  </div>

                  <div className="shrink-0 text-right">
                    <span className="text-[11px] font-mono font-semibold text-[#5C5548]">
                      {evt.duration_display || `${evt.duration_minutes || 60}m`}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
