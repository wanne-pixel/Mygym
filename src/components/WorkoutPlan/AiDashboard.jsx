import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../../api/supabase';
import { saveWorkoutLogs } from '../../api/workoutApi';
import { getLocalizedNameByKo, getExerciseUniqueKey, BODY_PART_I18N } from '../../utils/exerciseUtils';
import { useWindowSize } from '../../hooks/useWindowSize';
import { toast } from 'sonner';
import ExerciseSearchModal from './ExerciseSearchModal';
import { trackEvent } from '../../utils/analytics';

const inputCls = "w-full bg-white/5 border border-white/10 rounded-md px-1.5 py-1 text-xs sm:text-sm text-white focus:outline-none focus:border-blue-500 transition-colors";

const AiDashboard = ({ activeProgram, user, personalRecords, setActiveProgram }) => {
    const { t, i18n } = useTranslation();
    const { isMobile } = useWindowSize();
    
    const [isSaving, setIsSaving] = useState(false);
    const [isSessionSaved, setIsSessionSaved] = useState(false);
    const [selectedTab, setSelectedTab] = useState(activeProgram.current_session_index || 0);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    const initialSession = activeProgram.sessions[selectedTab];
    const [activeWorkout, setActiveWorkout] = useState(initialSession ? JSON.parse(JSON.stringify(initialSession)) : null);

    React.useEffect(() => {
        const session = activeProgram.sessions[selectedTab];
        const alreadyCompleted = session?.isCompleted === true;
        setIsSessionSaved(alreadyCompleted);

        const programId = activeProgram?.start_date ? new Date(activeProgram.start_date).getTime() : 'legacy';
        const storageKey = `gym_active_workout_${user.id}_${programId}_${selectedTab}`;
        const savedWorkout = localStorage.getItem(storageKey);

        if (savedWorkout && !alreadyCompleted) {
            try {
                const parsed = JSON.parse(savedWorkout);
                setActiveWorkout(parsed);
                return;
            } catch (err) {
                console.error("Failed to parse saved workout", err);
            }
        }

        if (session) {
            setActiveWorkout(JSON.parse(JSON.stringify(session)));
        } else {
            setActiveWorkout(null);
        }
    }, [selectedTab, activeProgram.sessions, user.id]);

    React.useEffect(() => {
        if (!activeWorkout || isSessionSaved) return;
        const programId = activeProgram?.start_date ? new Date(activeProgram.start_date).getTime() : 'legacy';
        const storageKey = `gym_active_workout_${user.id}_${programId}_${selectedTab}`;
        localStorage.setItem(storageKey, JSON.stringify(activeWorkout));
    }, [activeWorkout, user.id, selectedTab, isSessionSaved]);

    const handleQuitProgram = async () => {
        if (!window.confirm(t('program.quitConfirm', 'Are you sure you want to quit the current program?'))) return;

        setIsSaving(true);
        try {
            const { error } = await supabase
                .from('user_profiles')
                .update({ active_program: null })
                .eq('user_id', user.id);
            if (error) throw error;
            
            for (let i = 0; i < 7; i++) {
                localStorage.removeItem(`gym_active_workout_${user.id}_${i}`);
            }
            // 프로그램 키 기반 localStorage도 정리
            const programId = activeProgram?.start_date ? new Date(activeProgram.start_date).getTime() : 'legacy';
            for (let i = 0; i < 7; i++) {
                localStorage.removeItem(`gym_active_workout_${user.id}_${programId}_${i}`);
            }
            localStorage.removeItem('mygym_active_program');

            setActiveProgram(null);
            toast.success(t('program.resetProgram', 'Program reset'));
        } catch (err) {
            console.error("Error quitting program:", err);
            toast.error(err.message);
        } finally {
            setIsSaving(false);
        }
    };

    const getPR = (name, equipment, exercise) => {
        if (!personalRecords) return null;

        const uniqueKey = getExerciseUniqueKey({ name, equipment, exercise });
        if (personalRecords[uniqueKey]) {
            return personalRecords[uniqueKey];
        }

        const keys = Object.keys(personalRecords);
        const normalize = (s) => (s || '').replace(/\s/g, '').toLowerCase();
        
        // 정규화된 키로 정확 매칭 시도
        const normUniqueKey = normalize(uniqueKey);
        const foundUnique = keys.find(k => normalize(k) === normUniqueKey);
        if (foundUnique) return personalRecords[foundUnique];

        // 장비 포함 키로 매칭 시도
        if (equipment) {
            const withEquip = normalize(`${name}(${equipment})`);
            const found = keys.find(k => normalize(k) === withEquip);
            if (found) return personalRecords[found];
        }

        // 장비가 없는 옛날 기록(이름만 있는 기록)을 하위 호환용으로 매칭
        const normName = normalize(name);
        const foundName = keys.find(k => normalize(k) === normName);
        if (foundName) return personalRecords[foundName];

        return null;
    };

    const updateSetActiveWorkout = (exIdx, setIdx, field, value) => {
        setActiveWorkout(prev => {
            const exercises = [...prev.exercises];
            const ex = exercises[exIdx];
            ex.sets = ex.sets.map((s, idx) => idx === setIdx ? { ...s, [field]: value } : s);
            return { ...prev, exercises };
        });
    };

    const addSetActiveWorkout = (exIdx) => {
        setActiveWorkout(prev => {
            const exercises = [...prev.exercises];
            const ex = exercises[exIdx];
            const lastSet = ex.sets[ex.sets.length - 1];
            const newSet = {
                kg: lastSet?.kg ?? '',
                reps: lastSet?.reps ?? '',
                completed: false,
                isDropSet: lastSet?.isDropSet || false,
                dropKgs: lastSet?.dropKgs ? [...lastSet.dropKgs] : ['', '', '']
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

    const handleMoveExercise = (exIdx, direction) => {
        if (direction === 'up' && exIdx === 0) return;
        if (direction === 'down' && exIdx === (activeWorkout.exercises || []).length - 1) return;

        setActiveWorkout(prev => {
            const exercises = [...prev.exercises];
            const targetIdx = direction === 'up' ? exIdx - 1 : exIdx + 1;
            [exercises[exIdx], exercises[targetIdx]] = [exercises[targetIdx], exercises[exIdx]];
            return { ...prev, exercises };
        });
    };

    const handleDeleteExercise = (exIdx) => {
        if (!window.confirm(t('workout.deleteExerciseConfirm', '이 운동을 삭제하시겠습니까?'))) return;
        setActiveWorkout(prev => ({
            ...prev,
            exercises: prev.exercises.filter((_, idx) => idx !== exIdx)
        }));
    };

    const handleAddExercise = (ex) => {
        const uniqueKey = getExerciseUniqueKey({ name: ex.name, equipment: ex.equipment });
        const prRecord = personalRecords?.[uniqueKey];

        const targetSets = 5;
        const repScheme = [15, 15, 13, 13, 10];
        const sets = Array.from({ length: targetSets }, (_, i) => ({ kg: '', reps: repScheme[i] || 10, completed: false }));

        if (prRecord && prRecord.kg > 0) {
            const prKg = prRecord.kg;
            const maxCount = prRecord.maxKgCount || 1;
            const step = prRecord.predictedStep || 5;

            if (maxCount === 1) {
                sets[4].kg = prKg;
                for (let i = 3; i >= 0; i--) {
                    let rec = sets[i + 1].kg - step;
                    sets[i].kg = rec > 0 ? rec : '';
                }
            } else {
                sets[3].kg = prKg;
                sets[4].kg = prKg + step; 
                for (let i = 2; i >= 0; i--) {
                    let rec = sets[i + 1].kg - step;
                    sets[i].kg = rec > 0 ? rec : '';
                }
            }
        }

        const newExercise = {
            id: ex.id,
            name: ex.name,
            name_en: ex.name_en,
            body_part: ex.body_part || '',
            equipment: ex.equipment || '',
            targetSets,
            targetReps: 15,
            sets
        };

        setActiveWorkout(prev => ({
            ...prev,
            exercises: [...prev.exercises, newExercise]
        }));
    };

    const handleSaveWorkoutSession = async () => {
        if (!activeWorkout) return;

        const logsToSave = (activeWorkout.exercises || []).map(item => {
            const completedSets = (item.sets || []).filter(s => s.completed);
            return { ...item, sets: completedSets };
        }).filter(item => (item.sets || []).length > 0);

        if (logsToSave.length === 0) {
            toast.error(t('workout.noValidSets', 'No completed sets to save'));
            return;
        }

        setIsSaving(true);
        try {
            const todayStr = new Date().toISOString().split('T')[0];
            const savedAt = new Date(`${todayStr}T12:00:00`).toISOString();
            
            const payload = logsToSave.map(item => {
                const setsData = (item.sets || []).map(s => ({
                    kg: s.isDropSet ? '' : s.kg,
                    reps: s.reps,
                    isDropSet: !!s.isDropSet,
                    dropKgs: s.isDropSet ? (s.dropKgs || ['', '', '']) : ['', '', '']
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
            trackEvent('workout_saved', { type: 'session_complete', exerciseCount: logsToSave.length, userId: user?.id });

            const updatedProgram = {
                ...activeProgram,
                current_session_index: selectedTab
            };
            
            // Update the session data in the program so that completed sets remain checked
            updatedProgram.sessions[selectedTab] = { ...activeWorkout, isCompleted: true };

            const { error: profileError } = await supabase
                .from('user_profiles')
                .update({ active_program: updatedProgram })
                .eq('user_id', user.id);

            if (profileError) throw profileError;

            // localStorage 동기화
            const programId = activeProgram?.start_date ? new Date(activeProgram.start_date).getTime() : 'legacy';
            localStorage.removeItem(`gym_active_workout_${user.id}_${programId}_${selectedTab}`);
            localStorage.removeItem(`gym_active_workout_${user.id}_${selectedTab}`);
            localStorage.setItem('mygym_active_program', JSON.stringify(updatedProgram));

            setActiveProgram(updatedProgram);
            setIsSessionSaved(true);
            toast.success(t('workout.saveSuccess', 'Workout saved'));
            
            // Keep completed state; don't reset form
        } catch (err) {
            console.error("Error saving workout session:", err);
            toast.error(t('workout.saveFailed', 'Save failed: ') + err.message);
        } finally {
            setIsSaving(false);
        }
    };

    if (!activeWorkout) {
        return (
            <div className={`${isMobile ? 'p-4' : 'p-8 max-w-4xl mx-auto'} bg-slate-950 min-h-screen pb-24 text-white text-center animate-fade-in flex flex-col items-center justify-center`}>
                <p className="text-slate-400 mb-8">No active workout available.</p>
                <button
                    onClick={handleQuitProgram}
                    className="px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-2xl italic tracking-tight transition-all active:scale-[0.98] shadow-lg shadow-indigo-600/30 whitespace-nowrap"
                >
                    Start New Routine
                </button>
            </div>
        );
    }

    return (
        <div className={`${isMobile ? 'p-4' : 'p-8 max-w-4xl mx-auto'} bg-slate-950 min-h-screen pb-24 text-white animate-fade-in`}>
            {/* Top Tabs for Day Selection */}
            <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
                {activeProgram.sessions.map((session, idx) => {
                    const isCompleted = session.isCompleted === true;
                    return (
                        <button
                            key={idx}
                            onClick={() => setSelectedTab(idx)}
                            className={`px-4 py-2.5 rounded-xl text-sm font-black italic whitespace-nowrap transition-all flex items-center gap-2 ${
                                selectedTab === idx
                                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                                    : isCompleted
                                        ? 'bg-green-900/30 border border-green-500/30 text-green-400'
                                        : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
                            }`}
                        >
                            {session.dayId || `Day ${idx + 1}`}
                            {isCompleted && <span className="text-green-400">✅</span>}
                        </button>
                    );
                })}
            </div>

            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8 pb-4 border-b border-slate-800">
                <div>
                    <h2 className="font-black italic uppercase flex flex-col gap-1">
                        <span className="text-3xl text-indigo-400">
                            {activeWorkout.dayId} {(activeWorkout.target || '').split(': ')[0] ? `(${(activeWorkout.target || '').split(': ')[0]})` : ''}
                        </span>
                        <span className="text-xl text-slate-200">
                            {(activeWorkout.target || '').split(': ').slice(1).join(': ') || activeWorkout.target || ''}
                        </span>
                    </h2>
                    <p className="text-rose-450 font-bold text-xs uppercase tracking-wider mt-3 text-rose-400">
                        {(activeWorkout.exercises || []).length} Exercises Today
                    </p>
                </div>
                
                <div className="flex flex-col items-end gap-3 mt-4 md:mt-0">
                    <button
                        onClick={handleQuitProgram}
                        disabled={isSaving}
                        className="px-4 py-2 bg-rose-600/10 hover:bg-rose-600/25 border border-rose-500/30 hover:border-rose-500/50 text-rose-400 rounded-xl text-xs font-bold transition-all"
                    >
                        🔄 새로운 AI 루틴 생성
                    </button>
                    <span className="text-sm font-bold text-slate-500 italic">
                        {new Date().getDate()}일({['일', '월', '화', '수', '목', '금', '토'][new Date().getDay()]})
                    </span>
                </div>
            </div>

            {/* ✅ COMPLETED STATE — show instead of exercise list */}
            {isSessionSaved && (
                <div className="flex flex-col items-center justify-center py-20 gap-6 text-center">
                    <div className="text-8xl animate-bounce">🏆</div>
                    <div>
                        <h3 className="text-2xl font-black text-green-400 uppercase italic mb-2">운동 완료!</h3>
                        <p className="text-slate-400 font-bold">{activeWorkout.target} 운동이 저장되었습니다.</p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3 mt-4">
                        <button
                            onClick={() => setIsSessionSaved(false)}
                            className="px-6 py-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-black rounded-2xl transition-all text-sm"
                        >
                            📋 운동 기록 다시 보기
                        </button>
                        <button
                            onClick={handleQuitProgram}
                            className="px-6 py-3 bg-rose-600/20 hover:bg-rose-600/30 border border-rose-500/40 text-rose-300 font-black rounded-2xl transition-all text-sm"
                        >
                            🔄 새로운 AI 루틴 생성
                        </button>
                    </div>
                </div>
            )}

            {/* Normal workout content — hidden when completed */}
            {!isSessionSaved && (
            <>

            <div className="space-y-6">
                {(activeWorkout.exercises || []).map((item, exIdx) => {
                    const pr = getPR(item.name, item.equipment, item.exercise);
                    const isCardio = item.body_part === '유산소' || item.body_part === 'cardio' || item.body_part === 'Cardio';
                    const isHiking = isCardio && (item.name?.includes('등산') || item.name_en?.toLowerCase()?.includes('hiking'));
                    
                    return (
                        <div key={item.id || exIdx} className="bg-slate-900/50 p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-800 space-y-4">
                            <div className="flex items-start gap-4">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">
                                            {t(BODY_PART_I18N[item.body_part] || item.body_part, { defaultValue: item.body_part })}
                                        </p>
                                    </div>
                                    <h4 className="font-black text-white uppercase text-base break-words leading-tight mt-0.5">
                                        {getLocalizedNameByKo(item.name || item.exercise, i18n.language)}
                                        {item.equipment && <span className="text-xs text-slate-500 font-normal ml-2">({item.equipment})</span>}
                                    </h4>
                                    {pr && (
                                        <p className="text-[10px] text-green-400 font-bold mt-1 flex items-center gap-1">
                                            <span className="opacity-70">🏆 {t('workout.bestRecord', 'Best Record')}</span>
                                            <span>{pr.kg}kg × {pr.reps}{t('workout.repsUnit', 'reps')}</span>
                                        </p>
                                    )}
                                </div>
                                <div className="flex flex-col gap-1 items-end">
                                    <div className="flex bg-slate-800 rounded-lg overflow-hidden border border-slate-700">
                                        <button 
                                            onClick={() => handleMoveExercise(exIdx, 'up')} 
                                            disabled={exIdx === 0}
                                            className="px-2 py-1.5 text-slate-400 hover:text-white hover:bg-slate-700 disabled:opacity-30 transition-colors"
                                        >
                                            ▲
                                        </button>
                                        <button 
                                            onClick={() => handleMoveExercise(exIdx, 'down')} 
                                            disabled={exIdx === (activeWorkout.exercises || []).length - 1}
                                            className="px-2 py-1.5 text-slate-400 hover:text-white hover:bg-slate-700 disabled:opacity-30 transition-colors border-l border-slate-700"
                                        >
                                            ▼
                                        </button>
                                    </div>
                                    <button 
                                        onClick={() => handleDeleteExercise(exIdx)}
                                        className="p-1.5 text-slate-500 hover:text-rose-400 transition-colors rounded-lg hover:bg-rose-400/10"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-3 pt-4 border-t border-slate-800">
                                {(item.sets || []).map((set, setIdx) => {
                                    return (
                                        <div
                                            key={setIdx}
                                            className={`flex flex-col gap-1 p-1.5 sm:p-2 rounded-xl transition-all ${
                                                set.completed ? 'bg-green-500/10 border border-green-500/10' : 'bg-transparent'
                                            }`}
                                        >
                                            <div className="grid grid-cols-[16px_3fr_1fr_auto] sm:grid-cols-[24px_3fr_1fr_auto] gap-2 sm:gap-3 items-center">
                                                <span className="text-xs font-black text-slate-600 italic">{setIdx + 1}</span>

                                                {/* Weight / Distance / Mountain Name input */}
                                                <div className="relative">
                                                    {!set.isDropSet ? (
                                                        <div className="relative">
                                                            <input
                                                                type={isHiking ? "text" : "number"}
                                                                inputMode={isHiking ? "text" : "decimal"}
                                                                step={isCardio && !isHiking ? "any" : undefined}
                                                                value={set.kg || ''}
                                                                onChange={e => updateSetActiveWorkout(exIdx, setIdx, 'kg', e.target.value)}
                                                                className={`${inputCls} pr-7 sm:pr-8 text-xs sm:text-sm`}
                                                                placeholder={isHiking ? t('workout.mountainName', { defaultValue: '산이름' }) : "0"}
                                                            />
                                                            {isCardio ? (
                                                                !isHiking && <span className="absolute right-1.5 sm:right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-500 pointer-events-none lowercase">km</span>
                                                            ) : (
                                                                <span className="absolute right-1.5 sm:right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-500 pointer-events-none lowercase">kg</span>
                                                            )}
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
                                                                            updateSetActiveWorkout(exIdx, setIdx, 'dropKgs', newDropKgs);
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

                                                {/* Reps / Time input */}
                                                <div className="relative">
                                                    <input
                                                        type="number"
                                                        inputMode="numeric"
                                                        value={set.reps || ''}
                                                        onChange={e => updateSetActiveWorkout(exIdx, setIdx, 'reps', e.target.value)}
                                                        className={`${inputCls} pr-7 sm:pr-8 text-xs sm:text-sm`}
                                                        placeholder={item.targetReps || "0"}
                                                    />
                                                    <span className="absolute right-1.5 sm:right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-500 pointer-events-none lowercase">
                                                        {isCardio ? '분' : t('workout.repsUnit', 'reps')}
                                                    </span>
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
                                                    
                                                    {(item.sets || []).length > 1 && (
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
                                            {!isCardio && (
                                                <div className="pl-6 sm:pl-8">
                                                    <label className="flex items-center gap-1.5 text-[10px] sm:text-[11px] text-slate-400 cursor-pointer w-max select-none">
                                                        <input 
                                                            type="checkbox" 
                                                            checked={set.isDropSet || false}
                                                            onChange={e => updateSetActiveWorkout(exIdx, setIdx, 'isDropSet', e.target.checked)}
                                                            className="w-3 h-3 sm:w-3.5 sm:h-3.5 rounded border-slate-700 bg-slate-900/50 text-indigo-500 focus:ring-indigo-500 focus:ring-offset-slate-900"
                                                        />
                                                        드롭세트
                                                    </label>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                            <button
                                type="button"
                                onClick={() => addSetActiveWorkout(exIdx)}
                                className="w-full py-2 bg-slate-950 hover:bg-slate-900 border border-slate-800 rounded-xl text-xs font-bold text-slate-400 hover:text-white transition-all mt-2"
                            >
                                + {t('workout.addSet', 'Add Set')}
                            </button>
                        </div>
                    );
                })}
            </div>
            
            <div className="mt-8">
                <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="w-full py-4 border-2 border-dashed border-slate-700 hover:border-indigo-500 hover:bg-indigo-500/10 text-slate-400 hover:text-white font-bold rounded-2xl transition-all flex items-center justify-center gap-2"
                >
                    <span className="text-xl">+</span> 새로운 운동 추가
                </button>
            </div>

            <div className="mt-12 sticky bottom-4 z-20 pb-4">
                <button
                    onClick={handleSaveWorkoutSession}
                    disabled={isSaving}
                    className={`w-full py-5 rounded-2xl font-black text-lg transition-all active:scale-[0.98] flex items-center justify-center gap-3 shadow-2xl
                        ${isSaving ? 'bg-blue-600 opacity-70 cursor-not-allowed text-white' : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/30'}`}
                >
                    {isSaving ? (
                        <>
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            <span>{t('common.saving', 'Saving...')}</span>
                        </>
                    ) : (
                        <>
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                            </svg>
                            <span className="italic uppercase tracking-tight">Finish Workout</span>
                        </>
                    )}
                </button>
            </div>

            <ExerciseSearchModal 
                isOpen={isAddModalOpen} 
                onClose={() => setIsAddModalOpen(false)} 
                onAdd={handleAddExercise} 
            />
            </>
            )}
        </div>
    );
};

export default AiDashboard;
