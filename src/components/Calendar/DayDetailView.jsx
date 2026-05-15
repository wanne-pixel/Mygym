import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../../api/supabase';
import { 
    ChevronLeft, 
    Plus, 
    Calendar, 
    Dumbbell, 
    Activity, 
    History,
    ChevronRight,
    Clock,
    Trash2
} from 'lucide-react';
import { toast } from 'sonner';
import { getLocalizedNameByKo } from '../../utils/exerciseUtils';

const DayDetailView = ({ date, onBack, onGoToRoutine, isMobile }) => {
    const { t, i18n } = useTranslation();
    const [logs, setLogs] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    const fetchLogs = async () => {
        setIsLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // KST 고려한 날짜 범위 설정
            const start = new Date(`${date}T00:00:00`).toISOString();
            const end = new Date(`${date}T23:59:59`).toISOString();

            const { data, error } = await supabase.from('workout_logs')
                .select('*')
                .eq('user_id', user.id)
                .gte('created_at', start)
                .lte('created_at', end)
                .order('created_at', { ascending: true });
                
            if (error) throw error;
            setLogs(data || []);
        } catch (e) { 
            console.error('[DayDetailView Fetch Error]:', e); 
        } finally { 
            setIsLoading(false); 
        }
    };

    useEffect(() => {
        if (date) {
            fetchLogs();
        }
    }, [date]);

    const formatDate = (dateStr) => {
        const d = new Date(dateStr);
        const locale = i18n.language === 'ko' ? 'ko-KR' : 'en-US';
        return new Intl.DateTimeFormat(locale, { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            weekday: 'short'
        }).format(d);
    };

    const handleDeleteLog = async (id, e) => {
        e.stopPropagation();
        if (!window.confirm(t('dayDetail.deleteConfirm', { defaultValue: '정말 삭제하시겠습니까?' }))) return;
        
        try {
            const { error } = await supabase.from('workout_logs').delete().eq('id', id);
            if (error) throw error;
            toast.success(t('dayDetail.deleteSuccess', { defaultValue: '삭제되었습니다.' }));
            setLogs(logs.filter(l => l.id !== id));
        } catch (error) {
            console.error('[DayDetailView Delete Error]:', error);
            toast.error(t('dayDetail.deleteFailed', { defaultValue: '삭제에 실패했습니다.' }));
        }
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4">
                <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-slate-500 font-bold italic animate-pulse uppercase tracking-widest text-[10px]">Loading Records...</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="flex items-center justify-between">
                <button 
                    onClick={onBack}
                    className="p-2 -ml-2 text-slate-400 hover:text-white transition-colors bg-slate-900/50 rounded-full border border-white/5"
                >
                    <ChevronLeft size={24} />
                </button>
                <div className="flex flex-col items-center">
                    <span className="text-[10px] font-black text-blue-500 uppercase tracking-[0.2em] italic mb-0.5">
                        {t('calendar.workoutHistory', { defaultValue: 'WORKOUT HISTORY' })}
                    </span>
                    <h3 className="text-lg font-black text-white italic tracking-tight">{formatDate(date)}</h3>
                </div>
                <div className="w-10" /> {/* Spacer for centering */}
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 gap-4">
                <button
                    onClick={onGoToRoutine}
                    className="group relative overflow-hidden bg-blue-600 hover:bg-blue-500 transition-all p-5 rounded-[2rem] shadow-xl shadow-blue-600/20 flex items-center justify-between"
                >
                    <div className="relative z-10 flex items-center gap-4">
                        <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center shadow-inner">
                            <Plus className="text-white" size={28} strokeWidth={3} />
                        </div>
                        <div className="text-left">
                            <p className="text-[10px] font-black text-blue-100 uppercase tracking-widest mb-0.5 opacity-80 italic">
                                {t('calendar.newSession', { defaultValue: 'NEW SESSION' })}
                            </p>
                            <p className="text-xl font-black text-white italic tracking-tighter uppercase leading-none">
                                {t('calendar.addWorkout', { defaultValue: '운동 추가하기' })}
                            </p>
                        </div>
                    </div>
                    <ChevronRight className="text-white/40 group-hover:text-white group-hover:translate-x-1 transition-all" size={24} />
                    <div className="absolute top-0 right-0 -mr-4 -mt-4 opacity-10 group-hover:scale-110 transition-transform">
                        <Dumbbell size={120} />
                    </div>
                </button>
            </div>

            {/* Logs List */}
            <div className="space-y-4">
                <div className="flex items-center gap-2 px-2">
                    <History size={16} className="text-slate-500" />
                    <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-widest italic">
                        {t('calendar.recordsFound', { count: logs.length, defaultValue: `${logs.length} RECORDS FOUND` })}
                    </h4>
                </div>

                {logs.length === 0 ? (
                    <div className="bg-slate-900/40 border border-dashed border-white/5 rounded-[2.5rem] p-12 flex flex-col items-center justify-center text-center">
                        <div className="w-16 h-16 bg-slate-800/50 rounded-3xl flex items-center justify-center mb-4 text-slate-600">
                            <Calendar size={32} />
                        </div>
                        <p className="text-slate-400 font-bold italic tracking-tight mb-1 uppercase">
                            {t('calendar.noRecords', { defaultValue: '기록이 없습니다' })}
                        </p>
                        <p className="text-slate-600 text-[10px] font-medium max-w-[180px] leading-relaxed">
                            {t('calendar.noRecordsDesc', { defaultValue: '이 날짜에 저장된 운동 데이터가 확인되지 않습니다.' })}
                        </p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {logs.map((log, idx) => {
                            let sets = [];
                            try {
                                sets = typeof log.sets_data === 'string' ? JSON.parse(log.sets_data) : (log.sets_data || []);
                            } catch (e) { sets = []; }

                            return (
                                <div 
                                    key={log.id} 
                                    className="bg-slate-900/60 border border-white/5 rounded-3xl p-5 hover:bg-slate-900 transition-all group relative overflow-hidden animate-in fade-in slide-in-from-right-4 duration-300"
                                    style={{ animationDelay: `${idx * 100}ms` }}
                                >
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="flex flex-col gap-0.5">
                                            <span className="text-[9px] font-black text-blue-500 uppercase tracking-widest italic">
                                                {t(`bodyParts.${log.part}`, { defaultValue: log.part })}
                                            </span>
                                            <h5 className="text-base font-black text-white italic tracking-tight uppercase group-hover:text-blue-400 transition-colors">
                                                {getLocalizedNameByKo(log.exercise, i18n.language)}
                                            </h5>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="flex items-center gap-1.5 bg-slate-800/80 px-2.5 py-1 rounded-full border border-white/5">
                                                <Clock size={10} className="text-slate-500" />
                                                <span className="text-[9px] font-bold text-slate-400">
                                                    {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                            <button 
                                                onClick={(e) => handleDeleteLog(log.id, e)}
                                                className="p-1.5 bg-slate-800/50 hover:bg-red-500/20 text-slate-500 hover:text-red-400 rounded-lg transition-colors"
                                                title="Delete"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>

                                    {sets.length > 0 && (
                                        <div className="grid grid-cols-2 gap-2 mt-4">
                                            <div className="bg-white/5 rounded-2xl p-3 flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-xl bg-blue-500/10 flex items-center justify-center">
                                                    <Activity size={14} className="text-blue-400" />
                                                </div>
                                                <div>
                                                    <p className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter leading-none mb-1">Sets</p>
                                                    <p className="text-sm font-black text-white italic">{sets.length} SETS</p>
                                                </div>
                                            </div>
                                            <div className="bg-white/5 rounded-2xl p-3 flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                                                    <Dumbbell size={14} className="text-emerald-400" />
                                                </div>
                                                <div>
                                                    <p className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter leading-none mb-1">Max Vol</p>
                                                    <p className="text-sm font-black text-white italic">
                                                        {Math.max(...sets.map(s => parseFloat(s.kg) || 0))} KG
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                    
                                    {/* Subtle background icon */}
                                    <div className="absolute -bottom-2 -right-2 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity">
                                        <Dumbbell size={64} />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
            
            {/* Bottom padding to avoid nav collision */}
            <div className="h-12" />
        </div>
    );
};

export default DayDetailView;