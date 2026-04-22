import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

const PART_I18N = {
    '가슴': 'bodyParts.chest',
    '등': 'bodyParts.back',
    '어깨': 'bodyParts.shoulder',
    '하체': 'bodyParts.lower',
    '팔': 'bodyParts.arms',
    '허리/코어': 'bodyParts.core',
    '코어': 'bodyParts.core',
    '유산소': 'workout.cardio',
};

const MonthlyCalendar = ({ workoutGroups, currentViewDate, onMonthChange, onDayClick, isMobile }) => {
    const { t, i18n } = useTranslation();
    const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
    const year = currentViewDate.getFullYear();
    const month = currentViewDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const lastDate = new Date(year, month + 1, 0).getDate();
    const calendarDays = [
        ...Array(firstDay).fill(null),
        ...[...Array(lastDate).keys()].map(i => i + 1),
        ...Array(Math.max(0, 42 - firstDay - lastDate)).fill(null)
    ];
    const today = new Date();
    const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;
    const isFutureMonth = new Date(year, month, 1) > new Date(today.getFullYear(), today.getMonth(), 1);

    const monthLabel = useMemo(() => {
        const locale = i18n.language === 'ko' ? 'ko-KR' : 'en-US';
        return new Intl.DateTimeFormat(locale, { year: 'numeric', month: 'long' }).format(new Date(year, month, 1));
    }, [year, month, i18n.language]);

    const achievementRate = useMemo(() => {
        if (isFutureMonth) return null;
        const denominator = isCurrentMonth ? today.getDate() : lastDate;
        const workedDays = Object.keys(workoutGroups).filter(key => {
            const [y, m] = key.split('-').map(Number);
            return y === year && m === month + 1;
        }).length;
        return Math.round((workedDays / denominator) * 100);
    }, [workoutGroups, year, month, isCurrentMonth, isFutureMonth, lastDate]);

    const translatePart = (part) => t(PART_I18N[part] || part, { defaultValue: part });

    return (
        <div className={`bg-slate-800/50 rounded-[2.5rem] border border-slate-700/50 shadow-2xl ${isMobile ? 'p-4 text-sm' : 'p-6 text-base'}`}>
            <div className="flex justify-between items-center mb-6 px-2">
                <button
                    onClick={() => onMonthChange(-1)}
                    className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-700/50 hover:bg-slate-600 active:scale-90 active:bg-slate-500 transition-all text-white text-xl font-bold"
                >‹</button>
                <h3 className="text-2xl font-black text-white italic">{monthLabel}</h3>
                <button
                    onClick={() => onMonthChange(1)}
                    className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-700/50 hover:bg-slate-600 active:scale-90 active:bg-slate-500 transition-all text-white text-xl font-bold"
                >›</button>
            </div>
            <div className="grid grid-cols-7 gap-1">
                {days.map(d => <div key={d} className="text-center text-[10px] font-black text-slate-500 py-2 uppercase">{d}</div>)}
                {calendarDays.map((d, i) => {
                    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                    const info = d ? workoutGroups[dateStr] : null;
                    const isToday = d && today.getDate() === d && today.getMonth() === month && today.getFullYear() === year;
                    return (
                        <div
                            key={i}
                            onClick={() => d && onDayClick(dateStr)}
                            className={`flex flex-col items-center justify-center rounded-2xl relative transition-all ${isMobile ? 'h-16' : 'h-20'} ${d ? 'cursor-pointer hover:bg-slate-700/50 active:scale-90 active:bg-slate-600/50' : ''}`}
                        >
                            {d && (() => {
                                const parts = info ? [...new Set(info.logs.map(l => l.part))] : [];
                                const moreLabel = i18n.language === 'ko' ? '외' : '+';
                                const partsLabel = parts.length === 1
                                    ? translatePart(parts[0])
                                    : parts.length === 2
                                        ? `${translatePart(parts[0])}·${translatePart(parts[1])}`
                                        : parts.length >= 3
                                            ? `${translatePart(parts[0])} ${moreLabel} ${parts.length - 1}`
                                            : '';
                                return (
                                    <>
                                        <div className={`w-8 h-8 flex items-center justify-center rounded-full transition-all ${isToday ? 'bg-blue-500 shadow-lg shadow-blue-500/30' : info ? 'border-2 border-red-400' : ''}`}>
                                            <span className="text-sm font-black text-white">{d}</span>
                                        </div>
                                        {isToday && info && <span className="w-1.5 h-1.5 bg-red-400 rounded-full mt-0.5" />}
                                        {partsLabel && <span className="text-[9px] text-gray-400 mt-0.5 text-center leading-tight px-0.5">{partsLabel}</span>}
                                    </>
                                );
                            })()}
                        </div>
                    );
                })}
            </div>
            <div className="flex justify-end mt-4 px-2">
                {achievementRate !== null ? (
                    <span className="text-xs text-gray-400">{t('calendar.achievementRate')} <span className="text-white font-black">{achievementRate}%</span></span>
                ) : (
                    <span className="text-xs text-gray-400">{t('calendar.achievementRate')} <span className="text-slate-500">-</span></span>
                )}
            </div>
        </div>
    );
};

export default MonthlyCalendar;
