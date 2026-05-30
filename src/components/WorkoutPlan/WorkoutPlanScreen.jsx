import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from '../../api/supabase';
import { PART_MAP } from '../../constants/exerciseConstants';
import { saveWorkoutLogs } from '../../api/workoutApi';
import ExerciseSelector from '../Exercise/ExerciseSelector';
import { GifModal, GifRenderer } from '../Common/GifUI';
import { getLocalizedNameByKo, getExerciseGif, BODY_PART_I18N } from '../../utils/exerciseUtils';
import { useWindowSize } from '../../hooks/useWindowSize';
import { toast } from 'sonner';

const WorkoutPlanScreen = () => {
    const { t, i18n } = useTranslation();
    const { isMobile } = useWindowSize();
    const [searchParams, setSearchParams] = useSearchParams();
    const dateParam = searchParams.get('date');
    const targetDate = dateParam || new Date().toISOString().split('T')[0];
    const storageKey = `mygym_routine_${targetDate}`;
    const isToday = targetDate === new Date().toISOString().split('T')[0];

    const [selection, setSelection] = useState({ part: '', exercise: null, manualName: '' });
    const [planList, setPlanList] = useState(() => JSON.parse(localStorage.getItem(storageKey) || '[]'));
    const [modalState, setModalState] = useState({ isOpen: false, gifUrl: '', name: '' });
    const [isSaving, setIsSaving] = useState(false);
    const [personalRecords, setPersonalRecords] = useState({});

    const fetchExercisePersonalRecords = async (userId) => {
        try {
            const { data: logs } = await supabase
                .from('workout_logs')
                .select('exercise, sets_data')
                .eq('user_id', userId);

            if (!logs || logs.length === 0) return {};

            const records = {};
            logs.forEach(log => {
                const exerciseName = log.exercise;
                let sets = Array.isArray(log.sets_data) ? log.sets_data : JSON.parse(log.sets_data || '[]');
                sets.forEach(set => {
                    const kg = parseFloat(set.kg) || 0;
                    const reps = parseInt(set.reps) || 0;
                    if (!records[exerciseName] || kg > records[exerciseName].kg) {
                        records[exerciseName] = { kg, reps };
                    }
                });
            });
            return records;
        } catch (e) {
            console.error('[PR] 조회 실패:', e);
            return {};
        }
    };

    useEffect(() => {
        const loadData = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                const uid = session.user.id;
                const records = await fetchExercisePersonalRecords(uid);
                setPersonalRecords(records);
            }
        };
        loadData();
    }, []);

    useEffect(() => {
        setPlanList(JSON.parse(localStorage.getItem(storageKey) || '[]'));
    }, [storageKey]);

    useEffect(() => { localStorage.setItem(storageKey, JSON.stringify(planList)); }, [planList, storageKey]);

    const isCardio = (item) => item.body_part === '유산소' || item.body_part === 'cardio';

    const makeDefaultSet = (item, prevSet = null) => {
        if (isCardio(item)) return { level: prevSet?.level ?? '', minutes: prevSet?.minutes ?? '' };
        const kg = prevSet?.isDropSet ? (prevSet?.dropKgs?.[0] ?? '') : (prevSet?.kg ?? '');
        return { kg, reps: prevSet?.reps ?? '', isDropSet: false, dropKgs: ['', '', ''] };
    };

    const handleAddToList = () => {
        if (!selection.exercise) return;
        const newItem = { id: Date.now(), ...selection.exercise, body_part: selection.part, completed: false };
        newItem.sets = [makeDefaultSet(newItem)];
        setPlanList(prev => [...prev, newItem]);
        setSelection({ part: '', exercise: null, manualName: '' });
    };

    const toggleCompleted = (exIdx) => {
        setPlanList(prev => prev.map((item, i) => i === exIdx ? { ...item, completed: !item.completed } : item));
    };

    const updateSet = (exIdx, setIdx, field, value) => {
        setPlanList(prev => prev.map((item, i) => {
            if (i !== exIdx) return item;
            return { ...item, sets: item.sets.map((s, j) => j === setIdx ? { ...s, [field]: value } : s) };
        }));
    };

    const addSet = (exIdx) => {
        setPlanList(prev => prev.map((item, i) => {
            if (i !== exIdx) return item;
            const prevSet = item.sets?.[item.sets.length - 1] ?? null;
            return { ...item, sets: [...(item.sets || []), makeDefaultSet(item, prevSet)] };
        }));
    };

    const removeSet = (exIdx, setIdx) => {
        setPlanList(prev => prev.map((item, i) => {
            if (i !== exIdx) return item;
            return { ...item, sets: item.sets.filter((_, j) => j !== setIdx) };
        }));
    };

    const toggleDropSet = (exIdx, setIdx) => {
        setPlanList(prev => prev.map((item, i) => {
            if (i !== exIdx) return item;
            return { ...item, sets: item.sets.map((s, j) => {
                if (j !== setIdx) return s;
                return s.isDropSet
                    ? { ...s, isDropSet: false, kg: s.dropKgs?.[0] ?? '' }
                    : { ...s, isDropSet: true, dropKgs: [s.kg, '', ''] };
            })};
        }));
    };

    const handleSaveWorkout = async () => {
        console.log('[handleSaveWorkout] Started. planList:', planList);
        
        // window.confirm이 브라우저에서 차단될 가능성을 고려하여 일단 주석 처리하거나 로그 추가
        // if (!window.confirm(t('workout.saveConfirm'))) return;

        try {
            const { data: { session } } = await supabase.auth.getSession();
            const user = session?.user;
            console.log('[handleSaveWorkout] User session:', user?.id);

            if (!user) {
                toast.error(t('common.loginRequired'));
                return;
            }

            const logsToSave = planList
                .map(item => {
                    const cardio = isCardio(item);
                    const filteredSets = (item.sets || []).filter(s => {
                        if (cardio) return String(s.level) !== '' || String(s.minutes) !== '';
                        if (s.isDropSet) return s.dropKgs?.some(k => String(k) !== '') || String(s.reps) !== '';
                        return String(s.kg) !== '' || String(s.reps) !== '';
                    });
                    return { ...item, sets: filteredSets };
                })
                .filter(item => item.sets.length > 0);

            console.log('[handleSaveWorkout] Valid logs to save:', logsToSave);

            if (logsToSave.length === 0) { 
                toast.error(t('workout.noValidSets')); 
                return; 
            }

            setIsSaving(true);

            const savedAt = new Date(`${targetDate}T12:00:00`).toISOString();
            const payload = logsToSave.map(item => ({
                user_id: user.id,
                exercise: item.equipment ? `${item.name} (${item.equipment})` : (item.name || item.exercise),
                part: item.body_part,
                type: isCardio(item) ? 'cardio' : 'strength',
                sets_data: item.sets,
                created_at: savedAt,
            }));

            console.log('[handleSaveWorkout] Final payload for Supabase:', payload);

            await saveWorkoutLogs(payload);

            console.log('[handleSaveWorkout] Save successful!');
            localStorage.removeItem(storageKey);
            setPlanList([]);
            toast.success(t('workout.saveSuccess'));
            
            // 약간의 지연 후 이동 (토스트 확인용)
            setTimeout(() => {
                setSearchParams({ tab: '달력' });
            }, 500);

        } catch (e) {
            console.error('[handleSaveWorkout] Error during save:', e);
            const errMsg = e?.message || (typeof e === 'string' ? e : JSON.stringify(e));
            toast.error(t('workout.saveFailed') + errMsg);
        } finally {
            setIsSaving(false);
            console.log('[handleSaveWorkout] Finished.');
        }
    };

    const openPreview = (id, name) => {
        const url = getExerciseGif(null, id);
        if (url) setModalState({ isOpen: true, gifUrl: url, name });
    };

    const inputCls = "w-full bg-white/5 border border-white/10 rounded-md px-1.5 py-1 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors";

    const dateLabelLocale = i18n.language === 'ko' ? 'ko-KR' : 'en-US';

    return (
        <div className={`${isMobile ? 'p-4' : 'p-8 max-w-6xl mx-auto'} bg-slate-950 min-h-screen pb-24`}>
            <h2 className="text-3xl font-black italic text-white uppercase underline decoration-indigo-500 decoration-4 underline-offset-8 mb-1">{t('workout.title')}</h2>
            {!isToday && (
                <p className="text-blue-400 font-bold text-sm mb-8">{new Date(targetDate + 'T12:00:00').toLocaleDateString(dateLabelLocale, { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' })} {t('workout.log')}</p>
            )}
            {isToday && <div className="mb-8" />}
            <div className="grid lg:grid-cols-2 gap-10">
                <div className="bg-slate-900/50 p-6 rounded-3xl border border-slate-800">
                    <ExerciseSelector
                        selection={selection}
                        setSelection={setSelection}
                    />
                    {selection.exercise && <button onClick={handleAddToList} className="w-full mt-6 py-4 bg-indigo-600 text-white font-black rounded-xl italic active:scale-95 transition-all shadow-lg shadow-indigo-600/20">{t('workout.addToList')}</button>}
                </div>
                <div className="bg-slate-900/50 p-6 rounded-3xl border border-slate-800 min-h-[400px] flex flex-col">
                    <h3 className="text-xl font-bold text-white mb-6">{t('workout.todayList')}{planList.length})</h3>
                    <div className="space-y-4 flex-1">
                        {planList.map((item, exIdx) => {
                            const cardio = isCardio(item);
                            const sets = item.sets || [];
                            const exerciseKey = item.equipment ? `${item.name} (${item.equipment})` : (item.name || item.exercise);
                            const pr = personalRecords[exerciseKey];
                            return (
                                <div key={item.id} className={`p-4 border rounded-2xl space-y-4 transition-all ${item.completed ? 'bg-slate-800/30 border-green-500/30 opacity-70' : 'bg-slate-800/60 border-slate-700'}`}>
                                    <div className="flex items-start gap-3">
                                        <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0 bg-slate-900 border border-white/5">
                                            <GifRenderer exerciseId={item.id} onClick={() => openPreview(item.id, item.name)} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">{t(BODY_PART_I18N[item.body_part] || item.body_part, { defaultValue: item.body_part })}</p>
                                            <h4 className={`font-black text-white uppercase break-words leading-tight ${isMobile ? 'text-base' : 'text-sm'}`}>{getLocalizedNameByKo(item.name || item.exercise, i18n.language)}</h4>
                                            {pr && (
                                                <p className="text-[10px] text-green-400 font-bold mt-1 flex items-center gap-1">
                                                    <span className="opacity-70">🏆 {t('workout.bestRecord')}</span>
                                                    <span>{pr.kg}kg × {pr.reps}{t('workout.repsUnit')}</span>
                                                </p>
                                            )}
                                        </div>
                                        <div className="flex flex-col items-end gap-2 shrink-0">
                                            <button onClick={() => setPlanList(prev => prev.filter(p => p.id !== item.id))} className="p-1 text-slate-500 hover:text-white transition-colors">
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                                            </button>
                                            <button
                                                onClick={() => toggleCompleted(exIdx)}
                                                className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-[10px] font-black border transition-all active:scale-95 ${item.completed ? 'bg-green-500/20 text-green-400 border-green-500' : 'bg-transparent text-blue-400 border-blue-500'}`}
                                            >
                                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"/></svg>
                                                {item.completed ? t('workout.done') : t('workout.complete')}
                                            </button>
                                        </div>
                                    </div>

                                    <div className="space-y-3 pt-2 border-t border-white/5">
                                        {sets.length === 0 ? (
                                            <button onClick={() => addSet(exIdx)} className="w-full py-3 text-xs font-bold text-indigo-400 border border-dashed border-indigo-800/60 rounded-xl hover:border-indigo-600 transition-all bg-indigo-500/5">
                                                + {t('workout.addSet')}
                                            </button>
                                        ) : sets.map((set, setIdx) => {
                                            const isLast = setIdx === sets.length - 1;
                                            return (
                                                <div key={setIdx} className="grid grid-cols-[20px_1fr_1fr_auto_32px] gap-2 items-center">
                                                    <span className="text-[10px] font-black text-slate-600 italic">{setIdx + 1}</span>

                                                    {cardio ? (
                                                        <div className="relative">
                                                            <input type="number" inputMode="decimal" value={set.level} onChange={e => updateSet(exIdx, setIdx, 'level', e.target.value)} className={`${inputCls} pr-8`} placeholder="0" />
                                                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-500 pointer-events-none uppercase">{t('workout.levelPrefix')}</span>
                                                        </div>
                                                    ) : set.isDropSet ? (
                                                        <div className="grid grid-cols-3 gap-1">
                                                            {[0, 1, 2].map(di => (
                                                                <input key={di} type="number" inputMode="decimal" value={set.dropKgs[di]} onChange={e => { const d = [...set.dropKgs]; d[di] = e.target.value; updateSet(exIdx, setIdx, 'dropKgs', d); }} className={inputCls} placeholder="-" />
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <div className="relative">
                                                            <input type="number" inputMode="decimal" value={set.kg} onChange={e => updateSet(exIdx, setIdx, 'kg', e.target.value)} className={`${inputCls} pr-7`} placeholder="0" />
                                                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-500 pointer-events-none lowercase">kg</span>
                                                        </div>
                                                    )}

                                                    {cardio ? (
                                                        <div className="relative">
                                                            <input type="number" inputMode="numeric" value={set.minutes} onChange={e => updateSet(exIdx, setIdx, 'minutes', e.target.value)} className={`${inputCls} pr-6`} placeholder="0" />
                                                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-500 pointer-events-none lowercase">{t('workout.minuteUnit')}</span>
                                                        </div>
                                                    ) : (
                                                        <div className="relative">
                                                            <input type="number" inputMode="numeric" value={set.reps} onChange={e => updateSet(exIdx, setIdx, 'reps', e.target.value)} className={`${inputCls} pr-6`} placeholder="0" />
                                                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-500 pointer-events-none lowercase">{t('workout.repsUnit')}</span>
                                                        </div>
                                                    )}

                                                    {!cardio && (
                                                        <label className="flex flex-col items-center gap-0.5 cursor-pointer px-1">
                                                            <input type="checkbox" checked={!!set.isDropSet} onChange={() => toggleDropSet(exIdx, setIdx)} className="w-3.5 h-3.5 rounded border-white/10 bg-white/5 checked:bg-red-500 accent-red-500 transition-all" />
                                                            <span className="text-[8px] font-black text-slate-500 uppercase">{t('workout.drop')}</span>
                                                        </label>
                                                    )}

                                                    <div className="flex justify-end">
                                                        {isLast ? (
                                                            <button onClick={() => addSet(exIdx)} className="w-8 h-8 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-90 text-white flex items-center justify-center text-lg font-black transition-all shadow-lg shadow-blue-600/20">+</button>
                                                        ) : (
                                                            <button onClick={() => removeSet(exIdx, setIdx)} className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-500 hover:text-red-400 hover:bg-red-400/10 transition-all">
                                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"/></svg>
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    {planList.length > 0 && (
                        <div className="mt-8 space-y-4">
                            <button
                                onClick={handleSaveWorkout}
                                disabled={isSaving}
                                className={`w-full py-5 rounded-2xl font-black text-lg transition-all active:scale-[0.98] flex items-center justify-center gap-3 shadow-2xl
                                    ${isSaving ? 'bg-blue-600 opacity-70 cursor-not-allowed text-white' : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/30'}`}
                            >
                                {isSaving ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        <span>{t('common.saving')}</span>
                                    </>
                                ) : (
                                    <>
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"/></svg>
                                        <span className="italic uppercase tracking-tight">{t('workout.saveWorkout')}</span>
                                    </>
                                )}
                            </button>
                            <p className="text-center text-[10px] font-bold text-slate-500 uppercase tracking-widest">{t('workout.saveHint', { defaultValue: 'ALL PROGRESS WILL BE SAVED TO YOUR CALENDAR' })}</p>
                        </div>
                    )}
                </div>
            </div>
            <div className="h-24 lg:hidden" /> {/* Additional spacing for mobile nav */}
            <GifModal isOpen={modalState.isOpen} onClose={() => setModalState({ ...modalState, isOpen: false })} gifUrl={modalState.gifUrl} exerciseName={modalState.name} />
        </div>
    );
};

export default WorkoutPlanScreen;
