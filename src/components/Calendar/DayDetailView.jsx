import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../../api/supabase';
import { saveWorkoutLogs } from '../../api/workoutApi';
import { 
    ChevronLeft, 
    Plus, 
    Calendar, 
    Dumbbell, 
    Activity, 
    History,
    ChevronRight,
    Trash2
} from 'lucide-react';
import { toast } from 'sonner';
import { getLocalizedNameByKo, getExerciseUniqueKey } from '../../utils/exerciseUtils';
import ExerciseSearchModal from '../WorkoutPlan/ExerciseSearchModal';
import { trackEvent } from '../../utils/analytics';

const inputCls = "w-full bg-slate-950/50 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors";

const DayDetailView = ({ date, onBack, onGoToRoutine, isMobile }) => {
    const { t, i18n } = useTranslation();
    const [logs, setLogs] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    
    // Add exercise state
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [draftExercise, setDraftExercise] = useState(null);
    const [isSaving, setIsSaving] = useState(false);

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

    const handleSelectExercise = (ex) => {
        setDraftExercise({
            ...ex,
            sets: [{ kg: '', reps: '', isDropSet: false, dropKgs: ['', '', ''] }]
        });
        setIsSearchOpen(false);
    };

    const updateDraftSet = (idx, field, value) => {
        setDraftExercise(prev => {
            const newSets = [...prev.sets];
            newSets[idx] = { ...newSets[idx], [field]: value };
            return { ...prev, sets: newSets };
        });
    };

    const addDraftSet = () => {
        setDraftExercise(prev => {
            const lastSet = prev.sets[prev.sets.length - 1];
            return {
                ...prev,
                sets: [...prev.sets, { 
                    kg: lastSet?.kg || '', 
                    reps: lastSet?.reps || '',
                    isDropSet: lastSet?.isDropSet || false,
                    dropKgs: lastSet?.dropKgs ? [...lastSet.dropKgs] : ['', '', '']
                }]
            };
        });
    };

    const removeDraftSet = (idx) => {
        setDraftExercise(prev => ({
            ...prev,
            sets: prev.sets.filter((_, i) => i !== idx)
        }));
    };

    const handleSaveDraft = async () => {
        if (!draftExercise) return;
        
        const isCardio = draftExercise.body_part === '유산소' || draftExercise.body_part === 'cardio' || draftExercise.body_part === 'Cardio';
        const isHiking = isCardio && (draftExercise.name?.includes('등산') || draftExercise.name_en?.toLowerCase()?.includes('hiking'));
        
        // Filter out empty sets
        const validSets = draftExercise.sets.filter(s => {
            if (isHiking) return s.kg && s.reps; // name and time
            if (s.isDropSet) return s.dropKgs && s.dropKgs.some(v => v !== '') && s.reps !== '';
            return (s.kg !== '' && s.reps !== '');
        });

        if (validSets.length === 0) {
            toast.error(t('workout.noValidSets', '입력된 세트 정보가 없습니다.'));
            return;
        }

        setIsSaving(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            const savedAt = new Date(`${date}T12:00:00`).toISOString();

            const setsData = validSets.map(s => ({
                kg: s.isDropSet ? '' : s.kg,
                reps: s.reps,
                isDropSet: !!s.isDropSet,
                dropKgs: s.isDropSet ? (s.dropKgs || ['', '', '']) : ['', '', '']
            }));

            const payload = {
                user_id: user.id,
                exercise: getExerciseUniqueKey({ name: draftExercise.name, equipment: draftExercise.equipment }),
                part: draftExercise.body_part || '기타',
                type: isCardio ? 'cardio' : 'strength',
                sets_data: setsData,
                created_at: savedAt,
            };

            await saveWorkoutLogs([payload]);
            trackEvent('workout_saved', { type: 'draft_save', userId: user?.id });
            toast.success(t('workout.saveSuccess', '운동이 추가되었습니다.'));
            setDraftExercise(null);
            fetchLogs();
        } catch (err) {
            console.error("Error saving individual exercise:", err);
            toast.error(t('workout.saveFailed', '저장에 실패했습니다.'));
        } finally {
            setIsSaving(false);
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
                    onClick={() => setIsSearchOpen(true)}
                    className="group relative overflow-hidden bg-blue-600 hover:bg-blue-500 transition-all p-5 rounded-[2rem] shadow-xl shadow-blue-600/20 flex items-center justify-between"
                >
                    <div className="relative z-10 flex items-center gap-4">
                        <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center shadow-inner">
                            <Plus className="text-white" size={28} strokeWidth={3} />
                        </div>
                        <div className="text-left">
                            <p className="text-[10px] font-black text-blue-100 uppercase tracking-widest mb-0.5 opacity-80 italic">
                                ADD EXERCISE
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

            {/* Draft Exercise Inline Form */}
            {draftExercise && (
                <div className="bg-indigo-900/20 border border-indigo-500/30 rounded-3xl p-5 mb-2 animate-in fade-in zoom-in-95">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest bg-indigo-500/10 px-2 py-0.5 rounded-full">
                                새 운동 기록
                            </span>
                            <h4 className="font-black text-white uppercase text-base mt-2">
                                {getLocalizedNameByKo(draftExercise.name, i18n.language)}
                                {draftExercise.equipment && <span className="text-xs font-normal text-slate-400 ml-2">({draftExercise.equipment})</span>}
                            </h4>
                        </div>
                        <button onClick={() => setDraftExercise(null)} className="p-1 text-slate-400 hover:text-rose-400 transition-colors">
                            ✕
                        </button>
                    </div>

                    <div className="space-y-3">
                        {draftExercise.sets.map((set, idx) => {
                            const isCardio = draftExercise.body_part === '유산소' || draftExercise.body_part === 'cardio' || draftExercise.body_part === 'Cardio';
                            const isHiking = isCardio && (draftExercise.name?.includes('등산') || draftExercise.name_en?.toLowerCase()?.includes('hiking'));
                            
                            return (
                                <div key={idx} className="flex flex-col gap-1">
                                    <div className="flex gap-2 items-center">
                                        <span className="text-xs font-black text-slate-500 w-4">{idx + 1}</span>
                                        <div className="flex-[3] relative">
                                            {!set.isDropSet ? (
                                                <div className="relative">
                                                    <input
                                                        type={isHiking ? "text" : "number"}
                                                        value={set.kg || ''}
                                                        onChange={e => updateDraftSet(idx, 'kg', e.target.value)}
                                                        className={`${inputCls} pr-8 text-xs sm:text-sm`}
                                                        placeholder={isHiking ? "산 이름" : (isCardio ? "거리" : "무게")}
                                                    />
                                                    <span className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-500 font-bold pointer-events-none">
                                                        {isHiking ? "" : (isCardio ? "km" : "kg")}
                                                    </span>
                                                </div>
                                            ) : (
                                                <div className="flex gap-1 relative">
                                                    {[0, 1, 2].map(dropIdx => (
                                                        <div key={dropIdx} className="relative flex-1">
                                                            <input
                                                                type="number"
                                                                value={set.dropKgs?.[dropIdx] || ''}
                                                                onChange={e => {
                                                                    const newDropKgs = [...(set.dropKgs || ['', '', ''])];
                                                                    newDropKgs[dropIdx] = e.target.value;
                                                                    updateDraftSet(idx, 'dropKgs', newDropKgs);
                                                                }}
                                                                className={`${inputCls} pl-1 pr-5 text-center text-xs sm:text-sm`}
                                                                placeholder=""
                                                            />
                                                            <span className="absolute right-1 sm:right-1.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-500 font-bold pointer-events-none">
                                                                kg
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1 relative">
                                            <input
                                                type="number"
                                                value={set.reps}
                                                onChange={e => updateDraftSet(idx, 'reps', e.target.value)}
                                                className={`${inputCls} pr-7 text-xs sm:text-sm`}
                                                placeholder={isCardio ? "시간" : ""}
                                            />
                                            <span className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-500 font-bold pointer-events-none">
                                                {isCardio ? "분" : "회"}
                                            </span>
                                        </div>
                                        {draftExercise.sets.length > 1 && (
                                            <button onClick={() => removeDraftSet(idx)} className="p-2 text-slate-500 hover:text-rose-400 transition-colors">
                                                <Trash2 size={16} />
                                            </button>
                                        )}
                                    </div>
                                    {!isCardio && (
                                        <div className="pl-6">
                                            <label className="flex items-center gap-1.5 text-[10px] text-slate-400 cursor-pointer w-max select-none">
                                                <input 
                                                    type="checkbox" 
                                                    checked={set.isDropSet || false}
                                                    onChange={e => updateDraftSet(idx, 'isDropSet', e.target.checked)}
                                                    className="w-3 h-3 rounded border-slate-700 bg-slate-900/50 text-indigo-500 focus:ring-indigo-500 focus:ring-offset-slate-900"
                                                />
                                                드롭세트
                                            </label>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    <div className="flex gap-3 mt-5">
                        <button 
                            onClick={addDraftSet}
                            className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-white text-sm font-bold rounded-xl transition-colors"
                        >
                            + 세트 추가
                        </button>
                        <button 
                            onClick={handleSaveDraft}
                            disabled={isSaving}
                            className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-black rounded-xl transition-colors shadow-lg shadow-indigo-600/20 disabled:opacity-50"
                        >
                            {isSaving ? '저장 중...' : '운동 저장'}
                        </button>
                    </div>
                </div>
            )}

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
                                            <button 
                                                onClick={(e) => handleDeleteLog(log.id, e)}
                                                className="p-1.5 bg-slate-800/50 hover:bg-red-500/20 text-slate-500 hover:text-red-400 rounded-lg transition-colors"
                                                title="Delete"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>

                                    {sets.length > 0 && (() => {
                                        const isCardio = log.part === '유산소' || log.part === 'cardio' || log.part === 'Cardio';
                                        const isHiking = isCardio && (log.exercise?.includes('등산') || log.exercise?.toLowerCase()?.includes('hiking'));
                                        
                                        const totalDuration = sets.reduce((sum, s) => sum + (parseInt(s.reps) || 0), 0);
                                        const totalDistance = isHiking 
                                            ? [...new Set(sets.map(s => s.kg).filter(Boolean))].join(', ')
                                            : sets.reduce((sum, s) => sum + (parseFloat(s.kg) || 0), 0);

                                        return (
                                            <div className="grid grid-cols-2 gap-2 mt-4">
                                                <div className="bg-white/5 rounded-2xl p-3 flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-xl bg-blue-500/10 flex items-center justify-center">
                                                        <Activity size={14} className="text-blue-400" />
                                                    </div>
                                                    <div>
                                                        <p className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter leading-none mb-1">
                                                            {isCardio ? t('workout.totalDuration', { defaultValue: 'Total Time' }) : 'Sets'}
                                                        </p>
                                                        <p className="text-sm font-black text-white italic">
                                                            {isCardio ? `${totalDuration} MIN` : `${sets.length} SETS`}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="bg-white/5 rounded-2xl p-3 flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                                                        {isCardio && isHiking ? (
                                                            <Activity size={14} className="text-emerald-400" />
                                                        ) : (
                                                            <Dumbbell size={14} className="text-emerald-400" />
                                                        )}
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <p className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter leading-none mb-1">
                                                            {isCardio 
                                                                ? (isHiking ? t('workout.mountainName', { defaultValue: 'Mountain' }) : t('workout.totalDistance', { defaultValue: 'Total Dist' }))
                                                                : 'Max Vol'
                                                            }
                                                        </p>
                                                        <p className="text-sm font-black text-white italic truncate" title={isCardio && isHiking ? totalDistance : undefined}>
                                                            {isCardio 
                                                                ? (isHiking ? (totalDistance || '-') : `${typeof totalDistance === 'number' ? totalDistance.toFixed(2).replace(/\.00$/, '') : totalDistance} KM`)
                                                                : `${Math.max(...sets.map(s => parseFloat(s.kg) || 0))} KG`
                                                            }
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })()}
                                    
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

            {/* Modal for selecting exercise */}
            <ExerciseSearchModal 
                isOpen={isSearchOpen}
                onClose={() => setIsSearchOpen(false)}
                onAdd={handleSelectExercise}
            />
        </div>
    );
};

export default DayDetailView;