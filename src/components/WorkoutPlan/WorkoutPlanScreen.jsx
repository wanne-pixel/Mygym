import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from '../../api/supabase';
import { saveWorkoutLogs } from '../../api/workoutApi';
import ExerciseSelector from '../Exercise/ExerciseSelector';
import { GifModal, GifRenderer } from '../Common/GifUI';
import { getLocalizedNameByKo, getExerciseGif, BODY_PART_I18N, getExerciseUniqueKey } from '../../utils/exerciseUtils';
import { useWindowSize } from '../../hooks/useWindowSize';
import { toast } from 'sonner';

const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const inputCls = "w-full bg-white/5 border border-white/10 rounded-md px-1.5 py-1 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors";

const WorkoutPlanScreen = () => {
    const { t, i18n } = useTranslation();
    const { isMobile } = useWindowSize();
    const [searchParams, setSearchParams] = useSearchParams();

    // Core States
    const [user, setUser] = useState(null);
    const [activeProgram, setActiveProgram] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [personalRecords, setPersonalRecords] = useState({});

    // Wizard States
    const [wizardName, setWizardName] = useState('');
    const [wizardDuration, setWizardDuration] = useState(4); // default 4 weeks
    const [wizardWeekdays, setWizardWeekdays] = useState([]); // Selected days e.g., ['Monday', 'Wednesday']
    const [wizardActiveTab, setWizardActiveTab] = useState(''); // Active day being configured
    const [wizardTemplates, setWizardTemplates] = useState({}); // { Monday: [ { id, name, name_en, body_part, equipment, sets: [{ kg, reps }] } ] }
    const [wizardOverloadType, setWizardOverloadType] = useState('weight'); // 'weight' | 'reps'
    const [wizardOverloadIncrement, setWizardOverloadIncrement] = useState(2.5); // Default increment (2.5kg or 1 rep)

    // Selection state for ExerciseSelector
    const [selection, setSelection] = useState({ part: '', exercise: null, manualName: '' });

    // Active Workout Execution State
    const [activeWorkout, setActiveWorkout] = useState(null); // { weekday, currentWeek, exercises: [...] }

    // Gif preview modal state
    const [modalState, setModalState] = useState({ isOpen: false, gifUrl: '', name: '' });

    const getWeekdayLabel = (day) => {
        const mapping = {
            'Monday': i18n.language === 'ko' ? '월요일' : 'Monday',
            'Tuesday': i18n.language === 'ko' ? '화요일' : 'Tuesday',
            'Wednesday': i18n.language === 'ko' ? '수요일' : 'Wednesday',
            'Thursday': i18n.language === 'ko' ? '목요일' : 'Thursday',
            'Friday': i18n.language === 'ko' ? '금요일' : 'Friday',
            'Saturday': i18n.language === 'ko' ? '토요일' : 'Saturday',
            'Sunday': i18n.language === 'ko' ? '일요일' : 'Sunday'
        };
        return mapping[day] || day;
    };

    const getTodayWeekdayString = () => {
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        return days[new Date().getDay()];
    };

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

    const loadUserDataAndProgram = async () => {
        setIsLoading(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                setUser(session.user);
                
                const records = await fetchExercisePersonalRecords(session.user.id);
                setPersonalRecords(records);

                const { data: profile, error } = await supabase
                    .from('user_profiles')
                    .select('active_program')
                    .eq('user_id', session.user.id)
                    .maybeSingle();
                
                if (error) throw error;
                if (profile && profile.active_program) {
                    setActiveProgram(profile.active_program);
                } else {
                    setActiveProgram(null);
                }
            }
        } catch (err) {
            console.error("Error loading user profile & program:", err);
            toast.error(t('common.serverDelay'));
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadUserDataAndProgram();
    }, []);

    // Wizard handlers
    const toggleWeekday = (day) => {
        setWizardWeekdays(prev => {
            if (prev.includes(day)) {
                const updated = prev.filter(d => d !== day);
                if (wizardActiveTab === day) {
                    setWizardActiveTab(updated[0] || '');
                }
                return updated;
            } else {
                const updated = [...prev, day];
                if (!wizardActiveTab) {
                    setWizardActiveTab(day);
                }
                return updated;
            }
        });
    };

    const handleAddExerciseToTemplate = () => {
        if (!selection.exercise || !wizardActiveTab) return;
        const newItem = {
            id: Date.now() + Math.random(),
            name: selection.exercise.name,
            name_en: selection.exercise.name_en || selection.exercise.name,
            body_part: selection.part,
            equipment: selection.exercise.equipment || '',
            sets: [{ kg: '', reps: '' }]
        };
        setWizardTemplates(prev => ({
            ...prev,
            [wizardActiveTab]: [...(prev[wizardActiveTab] || []), newItem]
        }));
        setSelection({ part: '', exercise: null, manualName: '' });
        toast.success(t('aiCoach.addedToRoutine', { defaultValue: `${selection.exercise.name} added` }));
    };

    const updateTemplateExerciseSet = (day, exId, setIdx, field, value) => {
        setWizardTemplates(prev => {
            const dayList = prev[day] || [];
            const updated = dayList.map(ex => {
                if (ex.id !== exId) return ex;
                const updatedSets = ex.sets.map((s, idx) => {
                    if (idx !== setIdx) return s;
                    return { ...s, [field]: value };
                });
                return { ...ex, sets: updatedSets };
            });
            return { ...prev, [day]: updated };
        });
    };

    const addSetToTemplateExercise = (day, exId) => {
        setWizardTemplates(prev => {
            const dayList = prev[day] || [];
            const updated = dayList.map(ex => {
                if (ex.id !== exId) return ex;
                const lastSet = ex.sets[ex.sets.length - 1];
                return {
                    ...ex,
                    sets: [...ex.sets, { kg: lastSet?.kg ?? '', reps: lastSet?.reps ?? '' }]
                };
            });
            return { ...prev, [day]: updated };
        });
    };

    const removeSetFromTemplateExercise = (day, exId, setIdx) => {
        setWizardTemplates(prev => {
            const dayList = prev[day] || [];
            const updated = dayList.map(ex => {
                if (ex.id !== exId) return ex;
                return {
                    ...ex,
                    sets: ex.sets.filter((_, idx) => idx !== setIdx)
                };
            });
            return { ...prev, [day]: updated };
        });
    };

    const removeExerciseFromTemplate = (day, exId) => {
        setWizardTemplates(prev => ({
            ...prev,
            [day]: (prev[day] || []).filter(ex => ex.id !== exId)
        }));
    };

    const handleStartProgram = async () => {
        if (!wizardName.trim()) {
            toast.error(t('program.validationError'));
            return;
        }
        if (wizardWeekdays.length === 0) {
            toast.error(t('program.validationError'));
            return;
        }
        // Validate each weekday has at least one exercise
        for (const day of wizardWeekdays) {
            const exercises = wizardTemplates[day] || [];
            if (exercises.length === 0) {
                toast.error(t('program.validationError'));
                return;
            }
            for (const ex of exercises) {
                if (ex.sets.length === 0) {
                    toast.error(t('program.validationError'));
                    return;
                }
                for (const set of ex.sets) {
                    if (set.kg === '' || set.reps === '') {
                        toast.error(t('program.validationError'));
                        return;
                    }
                }
            }
        }

        const durationWeeks = parseInt(wizardDuration);
        const startDate = new Date().toISOString().split('T')[0];
        const end = new Date(Date.now() + durationWeeks * 7 * 24 * 60 * 60 * 1000);
        const endDate = end.toISOString().split('T')[0];

        const newProgram = {
            name: wizardName.trim(),
            durationWeeks,
            weekdays: wizardWeekdays,
            overloadType: wizardOverloadType,
            overloadIncrement: parseFloat(wizardOverloadIncrement) || 0,
            startDate,
            endDate,
            templates: wizardTemplates,
            history: {}
        };

        setIsSaving(true);
        try {
            const { error } = await supabase
                .from('user_profiles')
                .update({ active_program: newProgram })
                .eq('user_id', user.id);
            if (error) throw error;
            setActiveProgram(newProgram);
            toast.success(t('workout.saveSuccess'));
        } catch (err) {
            console.error("Error starting program:", err);
            toast.error(t('workout.saveFailed') + err.message);
        } finally {
            setIsSaving(false);
        }
    };

    // Dashboard & Execution handlers
    const handleStartWorkoutSession = (day) => {
        const templateExercises = activeProgram.templates[day] || [];
        const today = new Date();
        const start = new Date(activeProgram.startDate);
        const diffTime = Math.max(0, today.getTime() - start.getTime());
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        const currentWeek = Math.min(activeProgram.durationWeeks, Math.floor(diffDays / 7) + 1);

        const calculatedExercises = templateExercises.map(ex => {
            const calculatedSets = ex.sets.map((set) => {
                let baseKg = parseFloat(set.kg) || 0;
                let baseReps = parseInt(set.reps) || 0;
                let appliedIncrement = 0;
                let targetKg = baseKg;
                let targetReps = baseReps;

                if (currentWeek > 1) {
                    appliedIncrement = (currentWeek - 1) * (activeProgram.overloadIncrement || 0);
                    if (activeProgram.overloadType === 'weight') {
                        targetKg += appliedIncrement;
                    } else if (activeProgram.overloadType === 'reps') {
                        targetReps += Math.round(appliedIncrement);
                    }
                }

                return {
                    id: Date.now() + Math.random(),
                    kg: targetKg,
                    reps: targetReps,
                    completed: false,
                    targetKg,
                    targetReps,
                    appliedIncrement,
                    overloadType: activeProgram.overloadType
                };
            });

            return {
                ...ex,
                sets: calculatedSets
            };
        });

        setActiveWorkout({
            weekday: day,
            currentWeek,
            exercises: calculatedExercises
        });
    };

    const addSetActiveWorkout = (exIdx) => {
        setActiveWorkout(prev => {
            const exercises = [...prev.exercises];
            const ex = exercises[exIdx];
            const lastSet = ex.sets[ex.sets.length - 1];
            const newSet = {
                id: Date.now() + Math.random(),
                kg: lastSet?.kg ?? '',
                reps: lastSet?.reps ?? '',
                completed: false,
                targetKg: lastSet?.targetKg ?? 0,
                targetReps: lastSet?.targetReps ?? 0,
                appliedIncrement: lastSet?.appliedIncrement ?? 0,
                overloadType: lastSet?.overloadType ?? 'weight'
            };
            ex.sets = [...ex.sets, newSet];
            return { ...prev, exercises };
        });
    };

    const removeSetActiveWorkout = (exIdx, setIdx) => {
        setActiveWorkout(prev => {
            const exercises = [...prev.exercises];
            const ex = exercises[exIdx];
            ex.sets = ex.sets.filter((_, idx) => idx !== setIdx);
            return { ...prev, exercises };
        });
    };

    const updateSetActiveWorkout = (exIdx, setIdx, field, value) => {
        setActiveWorkout(prev => {
            const exercises = [...prev.exercises];
            const ex = exercises[exIdx];
            ex.sets = ex.sets.map((s, idx) => idx === setIdx ? { ...s, [field]: value } : s);
            return { ...prev, exercises };
        });
    };

    const handleSaveWorkoutSession = async () => {
        const logsToSave = activeWorkout.exercises.map(item => {
            const completedSets = item.sets.filter(s => s.completed);
            return { ...item, sets: completedSets };
        }).filter(item => item.sets.length > 0);

        if (logsToSave.length === 0) {
            toast.error(t('workout.noValidSets'));
            return;
        }

        setIsSaving(true);
        try {
            const todayStr = new Date().toISOString().split('T')[0];
            const savedAt = new Date(`${todayStr}T12:00:00`).toISOString();
            
            const payload = logsToSave.map(item => {
                const setsData = item.sets.map(s => ({
                    kg: s.kg,
                    reps: s.reps,
                    isDropSet: false,
                    dropKgs: ['', '', '']
                }));
                
                return {
                    user_id: user.id,
                    exercise: getExerciseUniqueKey(item),
                    part: item.body_part,
                    type: item.body_part === '유산소' || item.body_part === 'cardio' ? 'cardio' : 'strength',
                    sets_data: setsData,
                    created_at: savedAt,
                };
            });

            await saveWorkoutLogs(payload);

            const historyKey = `w${activeWorkout.currentWeek}_${activeWorkout.weekday}`;
            const updatedHistory = {
                ...(activeProgram.history || {}),
                [historyKey]: true
            };
            const updatedProgram = {
                ...activeProgram,
                history: updatedHistory
            };

            const { error: profileError } = await supabase
                .from('user_profiles')
                .update({ active_program: updatedProgram })
                .eq('user_id', user.id);

            if (profileError) throw profileError;

            setActiveProgram(updatedProgram);
            setActiveWorkout(null);
            toast.success(t('workout.saveSuccess'));
        } catch (err) {
            console.error("Error saving workout session:", err);
            toast.error(t('workout.saveFailed') + err.message);
        } finally {
            setIsSaving(false);
        }
    };

    const handleQuitProgram = async () => {
        if (!window.confirm(t('program.quitConfirm'))) return;

        setIsSaving(true);
        try {
            const { error } = await supabase
                .from('user_profiles')
                .update({ active_program: null })
                .eq('user_id', user.id);
            if (error) throw error;
            setActiveProgram(null);
            toast.success(t('program.resetProgram'));
        } catch (err) {
            console.error("Error quitting program:", err);
            toast.error(err.message);
        } finally {
            setIsSaving(false);
        }
    };

    const openPreview = (id, name) => {
        const url = getExerciseGif(null, id);
        if (url) setModalState({ isOpen: true, gifUrl: url, name });
    };

    const getPR = (name, equipment, exercise) => {
        if (!personalRecords) return null;

        // 1. Try matching with the new unique key format directly
        const uniqueKey = getExerciseUniqueKey({ name, equipment, exercise });
        if (personalRecords[uniqueKey]) {
            return personalRecords[uniqueKey];
        }

        // 2. Fallback to normalized check for backwards compatibility
        const keys = Object.keys(personalRecords);
        const normalize = (s) => (s || '').replace(/\s/g, '').toLowerCase();
        
        const normUniqueKey = normalize(uniqueKey);
        const foundUnique = keys.find(k => normalize(k) === normUniqueKey);
        if (foundUnique) return personalRecords[foundUnique];

        if (equipment) {
            const withEquip = normalize(`${name}(${equipment})`);
            const found = keys.find(k => normalize(k) === withEquip);
            if (found) return personalRecords[found];
        }
        const normName = normalize(name);
        const foundName = keys.find(k => normalize(k) === normName);
        if (foundName) return personalRecords[foundName];
        if (exercise) {
            const normEx = normalize(exercise);
            const foundEx = keys.find(k => normalize(k) === normEx);
            if (foundEx) return personalRecords[foundEx];
        }
        return null;
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 gap-4 text-white">
                <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-slate-500 text-sm font-bold animate-pulse uppercase tracking-widest">{t('common.loading')}</p>
            </div>
        );
    }

    // Active Workout View
    if (activeWorkout) {
        return (
            <div className={`${isMobile ? 'p-4' : 'p-8 max-w-4xl mx-auto'} bg-slate-950 min-h-screen pb-24 text-white animate-fade-in`}>
                <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-800">
                    <div>
                        <h2 className="text-2xl font-black italic text-white uppercase">
                            {t('program.activeWorkoutTitle', { day: getWeekdayLabel(activeWorkout.weekday) })}
                        </h2>
                        <p className="text-rose-450 font-bold text-xs uppercase tracking-wider mt-1">
                            {t('program.weekProgress', { current: activeWorkout.currentWeek, total: activeProgram.durationWeeks })}
                        </p>
                    </div>
                    <button
                        onClick={() => {
                            if (window.confirm(t('program.cancelConfirm'))) {
                                setActiveWorkout(null);
                            }
                        }}
                        className="px-4 py-2 bg-slate-900 border border-slate-800 text-slate-400 hover:text-white rounded-xl text-xs font-bold transition-all"
                    >
                        {t('program.cancelWorkout')}
                    </button>
                </div>

                <div className="space-y-6">
                    {activeWorkout.exercises.map((item, exIdx) => {
                        const pr = getPR(item.name, item.equipment, item.exercise);
                        return (
                            <div key={item.id} className="bg-slate-900/50 p-6 rounded-3xl border border-slate-800 space-y-4">
                                <div className="flex items-start gap-4">
                                    <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0 bg-slate-950 border border-white/5 shadow-inner">
                                        <GifRenderer exerciseId={item.id} onClick={() => openPreview(item.id, item.name)} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">
                                            {t(BODY_PART_I18N[item.body_part] || item.body_part, { defaultValue: item.body_part })}
                                        </p>
                                        <h4 className="font-black text-white uppercase text-base break-words leading-tight mt-0.5">
                                            {getLocalizedNameByKo(item.name || item.exercise, i18n.language)}
                                            {item.equipment && <span className="text-xs text-slate-500 font-normal ml-2">({item.equipment})</span>}
                                        </h4>
                                        {pr && (
                                            <p className="text-[10px] text-green-400 font-bold mt-1 flex items-center gap-1">
                                                <span className="opacity-70">🏆 {t('workout.bestRecord')}</span>
                                                <span>{pr.kg}kg × {pr.reps}{t('workout.repsUnit')}</span>
                                            </p>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-3 pt-4 border-t border-slate-800">
                                    {item.sets.map((set, setIdx) => {
                                        return (
                                            <div
                                                key={setIdx}
                                                className={`grid grid-cols-[24px_1.2fr_1fr_1fr_auto] gap-3 items-center p-2 rounded-xl transition-all ${
                                                    set.completed ? 'bg-green-500/10 border border-green-500/10' : 'bg-transparent'
                                                }`}
                                            >
                                                <span className="text-xs font-black text-slate-600 italic">{setIdx + 1}</span>

                                                {/* Target indicator */}
                                                <div className="flex flex-col">
                                                    <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Target</span>
                                                    {set.appliedIncrement > 0 ? (
                                                        <span className="text-[10px] text-rose-400 font-black bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20 truncate" title={`${set.overloadType === 'weight' ? 'Weight' : 'Reps'} increment applied`}>
                                                            {set.overloadType === 'weight'
                                                                ? `${set.targetKg}kg (+${set.appliedIncrement}kg)`
                                                                : `${set.targetReps}r (+${set.appliedIncrement}r)`
                                                            }
                                                        </span>
                                                    ) : (
                                                        <span className="text-[10px] text-slate-400 font-bold bg-slate-800 px-2 py-0.5 rounded truncate">
                                                            {set.targetKg}kg / {set.targetReps}r
                                                        </span>
                                                    )}
                                                </div>

                                                {/* Weight input */}
                                                <div className="relative">
                                                    <input
                                                        type="number"
                                                        inputMode="decimal"
                                                        value={set.kg}
                                                        onChange={e => updateSetActiveWorkout(exIdx, setIdx, 'kg', e.target.value)}
                                                        className={inputCls}
                                                        placeholder="0"
                                                    />
                                                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-500 pointer-events-none lowercase">kg</span>
                                                </div>

                                                {/* Reps input */}
                                                <div className="relative">
                                                    <input
                                                        type="number"
                                                        inputMode="numeric"
                                                        value={set.reps}
                                                        onChange={e => updateSetActiveWorkout(exIdx, setIdx, 'reps', e.target.value)}
                                                        className={inputCls}
                                                        placeholder="0"
                                                    />
                                                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-500 pointer-events-none lowercase">{t('workout.repsUnit')}</span>
                                                </div>

                                                {/* Actions / Tick */}
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => updateSetActiveWorkout(exIdx, setIdx, 'completed', !set.completed)}
                                                        className={`w-8 h-8 rounded-xl border flex items-center justify-center transition-all ${
                                                            set.completed
                                                                ? 'bg-green-500 border-green-500 text-white shadow-lg shadow-green-500/20'
                                                                : 'bg-transparent border-slate-700 text-slate-500 hover:border-slate-500'
                                                        }`}
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3.5" d="M5 13l4 4L19 7" />
                                                        </svg>
                                                    </button>
                                                    
                                                    {item.sets.length > 1 && (
                                                        <button
                                                            type="button"
                                                            onClick={() => removeSetActiveWorkout(exIdx, setIdx)}
                                                            className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-500 hover:text-red-400 transition-colors"
                                                        >
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                                                            </svg>
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                                <button
                                    type="button"
                                    onClick={() => addSetActiveWorkout(exIdx)}
                                    className="w-full py-2 bg-slate-950 hover:bg-slate-900 border border-slate-800 rounded-xl text-xs font-bold text-slate-400 hover:text-white transition-all mt-2"
                                >
                                    + {t('workout.addSet')}
                                </button>
                            </div>
                        );
                    })}
                </div>

                <div className="mt-8 space-y-4">
                    <button
                        onClick={handleSaveWorkoutSession}
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
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                                </svg>
                                <span className="italic uppercase tracking-tight">{t('program.saveWorkout')}</span>
                            </>
                        )}
                    </button>
                </div>
                
                <GifModal isOpen={modalState.isOpen} onClose={() => setModalState({ ...modalState, isOpen: false })} gifUrl={modalState.gifUrl} exerciseName={modalState.name} />
            </div>
        );
    }

    // Dashboard View
    if (activeProgram) {
        const totalWorkouts = activeProgram.durationWeeks * activeProgram.weekdays.length;
        const completedWorkouts = Object.keys(activeProgram.history || {}).length;
        const progressPercent = Math.min(100, Math.round((completedWorkouts / totalWorkouts) * 100));

        const today = new Date();
        const start = new Date(activeProgram.startDate);
        const diffTime = Math.max(0, today.getTime() - start.getTime());
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        const currentWeek = Math.min(activeProgram.durationWeeks, Math.floor(diffDays / 7) + 1);

        const todayDayStr = getTodayWeekdayString();
        const isTodayWorkoutScheduled = activeProgram.weekdays.includes(todayDayStr);
        const isTodayWorkoutCompleted = activeProgram.history?.[`w${currentWeek}_${todayDayStr}`];

        return (
            <div className={`${isMobile ? 'p-4' : 'p-8 max-w-6xl mx-auto'} bg-slate-950 min-h-screen pb-24 text-white animate-fade-in`}>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h2 className="text-3xl font-black italic text-white uppercase underline decoration-indigo-500 decoration-4 underline-offset-8 mb-2">
                            {activeProgram.name}
                        </h2>
                        <p className="text-blue-400 font-bold text-sm">
                            {t('program.weekProgress', { current: currentWeek, total: activeProgram.durationWeeks })}
                        </p>
                    </div>
                    <div>
                        <button
                            onClick={handleQuitProgram}
                            disabled={isSaving}
                            className="px-5 py-2.5 bg-rose-600/10 hover:bg-rose-600/25 border border-rose-500/30 hover:border-rose-500/50 text-rose-400 font-black rounded-xl text-sm italic transition-all active:scale-95"
                        >
                            {t('program.quitProgram')}
                        </button>
                    </div>
                </div>

                {/* Progress Card */}
                <div className="bg-slate-900/50 p-6 rounded-3xl border border-slate-800 mb-8">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-black text-slate-400 uppercase tracking-widest">{t('program.programProgress')}</span>
                        <span className="text-lg font-black text-white italic">{progressPercent}%</span>
                    </div>
                    <div className="w-full bg-slate-800 h-3 rounded-full overflow-hidden border border-white/5">
                        <div
                            className="h-full bg-gradient-to-r from-blue-500 to-rose-500 rounded-full transition-all duration-500"
                            style={{ width: `${progressPercent}%` }}
                        />
                    </div>
                    <p className="text-xs text-slate-500 font-bold mt-2 uppercase tracking-wide">
                        {completedWorkouts} / {totalWorkouts} {t('workout.sets', { defaultValue: 'Workouts' }).replace('(', '')} {t('program.completed')}
                    </p>
                </div>

                {/* Today's Action Card */}
                {isTodayWorkoutScheduled && !isTodayWorkoutCompleted && (
                    <div className="bg-gradient-to-r from-blue-600/15 to-rose-600/15 p-8 rounded-3xl border border-blue-500/30 mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div>
                            <span className="bg-blue-500 text-white text-[10px] font-black uppercase px-2.5 py-1 rounded-full tracking-widest">
                                {t('workout.today')}
                            </span>
                            <h3 className="text-2xl font-black text-white mt-2 uppercase italic">
                                {t('program.activeWorkoutTitle', { day: getWeekdayLabel(todayDayStr) })}
                            </h3>
                            <p className="text-xs text-slate-400 mt-1 font-bold">
                                {activeProgram.overloadType === 'weight'
                                    ? `+${(currentWeek - 1) * activeProgram.overloadIncrement}kg overload applied for Week ${currentWeek}`
                                    : `+${(currentWeek - 1) * activeProgram.overloadIncrement} reps overload applied for Week ${currentWeek}`
                                }
                            </p>
                        </div>
                        <button
                            onClick={() => handleStartWorkoutSession(todayDayStr)}
                            className="px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-2xl italic tracking-tight transition-all active:scale-[0.98] shadow-lg shadow-blue-600/30 whitespace-nowrap"
                        >
                            {t('program.startWorkout')}
                        </button>
                    </div>
                )}

                {/* Week's Routines List */}
                <div className="bg-slate-900/50 p-6 rounded-3xl border border-slate-800">
                    <h3 className="text-xl font-bold text-white mb-6 uppercase tracking-wider">{t('program.weekdays')}</h3>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {activeProgram.weekdays.map(day => {
                            const isCompleted = activeProgram.history?.[`w${currentWeek}_${day}`];
                            const exerciseCount = activeProgram.templates[day]?.length || 0;
                            return (
                                <div
                                    key={day}
                                    className={`p-5 border rounded-2xl flex flex-col justify-between gap-4 transition-all ${
                                        isCompleted
                                            ? 'bg-slate-800/30 border-green-500/20 opacity-70'
                                            : 'bg-slate-900 border-slate-700/60'
                                    }`}
                                >
                                    <div>
                                        <div className="flex items-center justify-between">
                                            <h4 className="text-lg font-black text-white italic">{getWeekdayLabel(day)}</h4>
                                            {isCompleted ? (
                                                <span className="bg-green-500/10 text-green-400 text-[10px] font-black px-2 py-0.5 rounded-md border border-green-500/20 uppercase">
                                                    {t('program.completed')}
                                                </span>
                                            ) : (
                                                <span className="bg-slate-700/30 text-slate-400 text-[10px] font-black px-2 py-0.5 rounded-md border border-slate-700/40 uppercase">
                                                    {t('program.pending')}
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-xs text-slate-500 font-bold mt-2 uppercase">
                                            {exerciseCount} {t('workout.todayList', { defaultValue: 'Exercises' }).replace('(', '')}
                                        </p>
                                        <div className="mt-3 space-y-1">
                                            {(activeProgram.templates[day] || []).slice(0, 3).map((ex, idx) => (
                                                <p key={idx} className="text-xs text-slate-400 font-bold truncate">
                                                    • {getLocalizedNameByKo(ex.name, i18n.language)}
                                                </p>
                                            ))}
                                            {exerciseCount > 3 && (
                                                <p className="text-xs text-slate-500 font-bold italic">
                                                    + {exerciseCount - 3} {t('common.more')}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    {!isCompleted && (
                                        <button
                                            onClick={() => handleStartWorkoutSession(day)}
                                            className="w-full py-2 bg-slate-800 hover:bg-slate-750 text-white text-xs font-black rounded-xl italic transition-all active:scale-[0.98] border border-white/5"
                                        >
                                            {t('program.startWorkout')}
                                        </button>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
                
                <GifModal isOpen={modalState.isOpen} onClose={() => setModalState({ ...modalState, isOpen: false })} gifUrl={modalState.gifUrl} exerciseName={modalState.name} />
            </div>
        );
    }

    // Wizard View (ActiveProgram is null)
    return (
        <div className={`${isMobile ? 'p-4' : 'p-8 max-w-6xl mx-auto'} bg-slate-950 min-h-screen pb-24 text-white animate-fade-in`}>
            <h2 className="text-3xl font-black italic text-white uppercase underline decoration-indigo-500 decoration-4 underline-offset-8 mb-8">
                {t('program.title')}
            </h2>

            <div className="grid lg:grid-cols-2 gap-10">
                {/* Configuration form */}
                <div className="bg-slate-900/50 p-6 rounded-3xl border border-slate-800 space-y-6">
                    <div>
                        <label className="text-xs font-black text-slate-400 uppercase tracking-wider block mb-2">
                            {t('program.programName')}
                        </label>
                        <input
                            type="text"
                            value={wizardName}
                            onChange={e => setWizardName(e.target.value)}
                            placeholder={t('program.programNamePlaceholder')}
                            className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-bold"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-black text-slate-400 uppercase tracking-wider block mb-2">
                                {t('program.duration')}
                            </label>
                            <select
                                value={wizardDuration}
                                onChange={e => setWizardDuration(parseInt(e.target.value))}
                                className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-bold opacity-100 bg-none"
                            >
                                <option value="1" className="bg-slate-900">{t('program.duration1Week')}</option>
                                <option value="2" className="bg-slate-900">{t('program.duration2Weeks')}</option>
                                <option value="4" className="bg-slate-900">{t('program.duration4Weeks')}</option>
                            </select>
                        </div>

                        <div>
                            <label className="text-xs font-black text-slate-400 uppercase tracking-wider block mb-2">
                                {t('program.overloadType')}
                            </label>
                            <select
                                value={wizardOverloadType}
                                onChange={e => {
                                    setWizardOverloadType(e.target.value);
                                    setWizardOverloadIncrement(e.target.value === 'weight' ? 2.5 : 1);
                                }}
                                className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-bold opacity-100"
                            >
                                <option value="weight" className="bg-slate-900">{t('program.overloadTypeWeight')}</option>
                                <option value="reps" className="bg-slate-900">{t('program.overloadTypeReps')}</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="text-xs font-black text-slate-400 uppercase tracking-wider block mb-2">
                            {wizardOverloadType === 'weight' ? t('program.weeklyIncrementLabel') : t('program.weeklyRepIncrementLabel')}
                        </label>
                        <input
                            type="number"
                            step={wizardOverloadType === 'weight' ? '0.5' : '1'}
                            value={wizardOverloadIncrement}
                            onChange={e => setWizardOverloadIncrement(parseFloat(e.target.value) || 0)}
                            className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-bold"
                        />
                    </div>

                    <div>
                        <label className="text-xs font-black text-slate-400 uppercase tracking-wider block mb-3">
                            {t('program.selectWeekdays')}
                        </label>
                        <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                            {WEEKDAYS.map(day => {
                                const isSelected = wizardWeekdays.includes(day);
                                return (
                                    <button
                                        key={day}
                                        type="button"
                                        onClick={() => toggleWeekday(day)}
                                        className={`py-2 px-1 text-center rounded-xl text-xs font-black tracking-tighter transition-all ${
                                            isSelected
                                                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                                                : 'bg-slate-950 text-slate-400 border border-white/5 hover:border-slate-800'
                                        }`}
                                    >
                                        {getWeekdayLabel(day).substring(0, 3)}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Routine templates by weekday */}
                    {wizardWeekdays.length > 0 && (
                        <div className="pt-4 border-t border-slate-800 space-y-4">
                            <label className="text-xs font-black text-slate-400 uppercase tracking-wider block">
                                {t('program.routineConfig')}
                            </label>
                            
                            {/* Horizontal Day Tabs */}
                            <div className="flex flex-wrap gap-2">
                                {wizardWeekdays.map(day => (
                                    <button
                                        key={day}
                                        type="button"
                                        onClick={() => setWizardActiveTab(day)}
                                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                                            wizardActiveTab === day
                                                ? 'bg-blue-600 text-white'
                                                : 'bg-slate-950 border border-white/5 text-slate-400 hover:text-white'
                                        }`}
                                    >
                                        {getWeekdayLabel(day)}
                                    </button>
                                ))}
                            </div>

                            {/* Exercises for selected template tab */}
                            <div className="space-y-4">
                                {(!wizardActiveTab || (wizardTemplates[wizardActiveTab] || []).length === 0) ? (
                                    <p className="text-xs text-slate-500 italic py-4">
                                        {t('program.noExercises')}
                                    </p>
                                ) : (
                                    (wizardTemplates[wizardActiveTab] || []).map((ex) => (
                                        <div key={ex.id} className="p-4 bg-slate-950/60 border border-white/5 rounded-2xl space-y-3">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <h4 className="font-bold text-sm text-white uppercase">
                                                        {getLocalizedNameByKo(ex.name, i18n.language)}
                                                    </h4>
                                                    <p className="text-[10px] text-slate-500 uppercase tracking-widest">
                                                        {t(BODY_PART_I18N[ex.body_part] || ex.body_part, { defaultValue: ex.body_part })}
                                                    </p>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => removeExerciseFromTemplate(wizardActiveTab, ex.id)}
                                                    className="p-1 text-slate-500 hover:text-red-400 transition-colors"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                                                    </svg>
                                                </button>
                                            </div>

                                            {/* Sets list */}
                                            <div className="space-y-2">
                                                {ex.sets.map((set, setIdx) => (
                                                    <div key={setIdx} className="grid grid-cols-[20px_1fr_1fr_auto] gap-2 items-center">
                                                        <span className="text-[10px] font-black text-slate-500">{setIdx + 1}</span>
                                                        <div className="relative">
                                                            <input
                                                                type="number"
                                                                placeholder="0"
                                                                value={set.kg}
                                                                onChange={e => updateTemplateExerciseSet(wizardActiveTab, ex.id, setIdx, 'kg', e.target.value)}
                                                                className={inputCls}
                                                            />
                                                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-500 pointer-events-none lowercase">kg</span>
                                                        </div>
                                                        <div className="relative">
                                                            <input
                                                                type="number"
                                                                placeholder="0"
                                                                value={set.reps}
                                                                onChange={e => updateTemplateExerciseSet(wizardActiveTab, ex.id, setIdx, 'reps', e.target.value)}
                                                                className={inputCls}
                                                            />
                                                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-500 pointer-events-none lowercase">{t('workout.repsUnit')}</span>
                                                        </div>
                                                        {ex.sets.length > 1 && (
                                                            <button
                                                                type="button"
                                                                onClick={() => removeSetFromTemplateExercise(wizardActiveTab, ex.id, setIdx)}
                                                                className="text-slate-600 hover:text-red-400 p-1"
                                                            >
                                                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                                                                </svg>
                                                            </button>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                            
                                            <button
                                                type="button"
                                                onClick={() => addSetToTemplateExercise(wizardActiveTab, ex.id)}
                                                className="text-[10px] text-blue-400 font-bold hover:underline"
                                            >
                                                + {t('workout.addSet')}
                                            </button>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}

                    <button
                        type="button"
                        onClick={handleStartProgram}
                        disabled={isSaving}
                        className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-black rounded-xl italic tracking-wide transition-all active:scale-[0.98] shadow-lg shadow-indigo-600/20"
                    >
                        {t('program.startProgram')}
                    </button>
                </div>

                {/* Exercise Selection Panel */}
                <div className="bg-slate-900/50 p-6 rounded-3xl border border-slate-800">
                    <h3 className="text-xl font-bold text-white mb-6 uppercase tracking-wider">{t('workout.addToList')}</h3>
                    {!wizardActiveTab ? (
                        <p className="text-sm text-slate-500 italic">{t('program.selectWeekdays', { defaultValue: 'Select a weekday above to start adding exercises.' })}</p>
                    ) : (
                        <>
                            <ExerciseSelector
                                selection={selection}
                                setSelection={setSelection}
                            />
                            {selection.exercise && (
                                <button
                                    onClick={handleAddExerciseToTemplate}
                                    className="w-full mt-6 py-4 bg-indigo-600 text-white font-black rounded-xl italic active:scale-95 transition-all shadow-lg shadow-indigo-600/20"
                                >
                                    {t('exercise.addToRoutine')} ({getWeekdayLabel(wizardActiveTab)})
                                </button>
                            )}
                        </>
                    )}
                </div>
            </div>
            
            <GifModal isOpen={modalState.isOpen} onClose={() => setModalState({ ...modalState, isOpen: false })} gifUrl={modalState.gifUrl} exerciseName={modalState.name} />
        </div>
    );
};

export default WorkoutPlanScreen;
