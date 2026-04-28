import React, { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Target, Flame, Dumbbell, TrendingUp, Plus, Check, Loader2, AlertCircle, PlayCircle, Award } from 'lucide-react';
import { toast as sonnerToast } from 'sonner';
import ChatMessage from '../ChatMessage';
import { useAiCoach } from './useAiCoach';
import { getLocalizedNameByKo } from '../../utils/exerciseUtils';

const AiRecommendationScreen = () => {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();

    const HARD_MODE_OPTIONS = useMemo(() => [
        { label: t('aiCoach.hardModes.lowWeightHighRep'), value: 'hard_mode_low_weight', description: t('aiCoach.hardModes.lowWeightHighRepDesc') },
        { label: t('aiCoach.hardModes.highWeightLowRep'), value: 'hard_mode_high_weight', description: t('aiCoach.hardModes.highWeightLowRepDesc') },
        { label: t('aiCoach.hardModes.progressiveOverload'), value: 'hard_mode_progressive', description: t('aiCoach.hardModes.progressiveOverloadDesc') },
        { label: t('aiCoach.hardModes.dropSet'), value: 'hard_mode_drop_set', description: t('aiCoach.hardModes.dropSetDesc') },
    ], [t]);

    const {
        profile, exerciseDataset, personalRecords, messages, setMessages, isTyping,
        handleSendMessage, handleManualReset, callRecommendation,
    } = useAiCoach();

    const [inputText, setInputText] = useState('');
    const [showHardModeOptions, setShowHardModeOptions] = useState(false);
    const [addedExercises, setAddedExercises] = useState(new Set());
    const [cart, setCart] = useState({});
    const [toastMsg, setToastMsg] = useState(null);
    const [error, setError] = useState(null);

    const showToast = useCallback((message) => {
        setToastMsg(message);
        setTimeout(() => setToastMsg(null), 2500);
    }, []);

    const handleAddRoutine = (routine, index, msgId) => {
        const key = `${msgId}_${routine.exercise}_${index}`;
        if (addedExercises.has(key)) {
            setAddedExercises(prev => { const next = new Set(prev); next.delete(key); return next; });
            setCart(prev => { const next = { ...prev }; delete next[key]; return next; });
        } else {
            const newItem = {
                id: Date.now() + Math.random(),
                name: routine.exercise,
                body_part: routine.part,
                completed: false,
                sets: (routine.sets_data || []).map(s => ({
                    kg: s.kg, reps: s.reps, isDropSet: s.isDropSet || false, dropKgs: ['', '', '']
                }))
            };
            setAddedExercises(prev => new Set(prev).add(key));
            setCart(prev => ({ ...prev, [key]: newItem }));
            const localizedName = getLocalizedNameByKo(routine.exercise, i18n.language);
            showToast(`${localizedName} ${t('aiCoach.addedToCart')}`);
        }
    };

    const handleBatchAdd = (routines, msgId, selectedMode = 'today_routine') => {
        if (!routines || routines.length === 0) return;

        const selectedRoutines = routines.filter((r, idx) =>
            addedExercises.has(`${msgId}_${r.exercise}_${idx}`)
        );

        if (selectedRoutines.length === 0) {
            sonnerToast.error(t('aiCoach.selectAtLeastOne', { defaultValue: '운동을 1개 이상 선택해주세요' }));
            return;
        }

        const today = new Date().toISOString().split('T')[0];
        const storageKey = `mygym_routine_${today}`;
        const currentPlan = JSON.parse(localStorage.getItem(storageKey) || '[]');
        const total = selectedRoutines.length;

        const newItems = selectedRoutines.map((r, idx) => {
            const normalizedName = r.exercise?.trim().toLowerCase() ?? '';
            const exInfo = exerciseDataset.find(e =>
                e.name?.trim().toLowerCase() === normalizedName ||
                e.name_en?.trim().toLowerCase() === normalizedName
            );
            const isLastThree = idx >= total - 3;
            return {
                id: exInfo?.id ?? (Date.now() + Math.random() + idx),
                name: r.exercise,
                body_part: r.part,
                completed: false,
                sets: buildSetsForMode(selectedMode, r.exercise, isLastThree)
            };
        });

        localStorage.setItem(storageKey, JSON.stringify([...currentPlan, ...newItems]));
        sonnerToast.success(t('aiCoach.batchAddSuccess'));
        navigate('/app?tab=루틴구성');
    };

    const goToWorkoutPlan = () => {
        const selectedItems = Object.values(cart);
        if (selectedItems.length > 0) {
            const today = new Date().toISOString().split('T')[0];
            const storageKey = `mygym_routine_${today}`;
            const currentPlan = JSON.parse(localStorage.getItem(storageKey) || '[]');
            localStorage.setItem(storageKey, JSON.stringify([...currentPlan, ...selectedItems]));
            sonnerToast.success(t('aiCoach.batchAddSuccess'));
        }
        navigate('/app?tab=루틴구성');
    };

    const sendRecommendationRequest = async () => {
        if (!profile) { sonnerToast.error(t('aiCoach.profileLoading')); return; }
        setError(null); setShowHardModeOptions(false);
        const userMsg = i18n.language === 'en' ? "Recommend today's routine" : "오늘의 루틴 추천해줘";
        setMessages(prev => [...prev, { id: Date.now(), type: 'user', text: userMsg }]);
        try { await callRecommendation('balanced'); } catch (err) { setError(t('aiCoach.fetchError')); }
    };

    const sendHardModeRequest = async (hardModeType) => {
        if (!profile) { sonnerToast.error(t('aiCoach.profileLoading')); return; }
        setError(null); setShowHardModeOptions(false);
        const hardMsgMap = i18n.language === 'en' ? {
            hard_mode_low_weight:  "Recommend hard mode (Low Weight High Reps)",
            hard_mode_high_weight: "Recommend hard mode (High Weight Low Reps)",
            hard_mode_progressive: "Recommend hard mode (Pyramid Set)",
            hard_mode_drop_set:    "Recommend hard mode (Drop Set)",
        } : {
            hard_mode_low_weight:  "하드모드(저중량 고반복) 추천해줘",
            hard_mode_high_weight: "하드모드(고중량 저반복) 추천해줘",
            hard_mode_progressive: "하드모드(피라미드 세트) 추천해줘",
            hard_mode_drop_set:    "하드모드(드롭세트) 추천해줘",
        };
        const userMsg = hardMsgMap[hardModeType] || (i18n.language === 'en' ? "Recommend hard mode" : "하드모드 추천해줘");
        setMessages(prev => [...prev, { id: Date.now(), type: 'user', text: userMsg }]);
        try { await callRecommendation('hard', hardModeType); } catch (err) { setError(t('aiCoach.fetchError')); }
    };

    const onSendMessage = () => {
        if (!inputText.trim()) return;
        handleSendMessage(inputText.trim());
        setInputText('');
    };

    const handleResetWithInput = () => {
        handleManualReset(); setInputText(''); setError(null); setAddedExercises(new Set()); setCart({});
    };

    const getPRForExercise = (exerciseName) => {
        if (!exerciseName || !personalRecords) return null;
        const normalizedInput = exerciseName.trim().toLowerCase();
        if (personalRecords[exerciseName]) return personalRecords[exerciseName];
        const foundKey = Object.keys(personalRecords).find(k => k.trim().toLowerCase() === normalizedInput);
        return foundKey ? personalRecords[foundKey] : null;
    };

    const buildSetsForMode = (selectedMode, exerciseName, isLastThree = false) => {
        const pr = getPRForExercise(exerciseName);
        const prKg = pr?.kg || 0;
        const kg = (ratio) => prKg > 0 ? Math.round(prKg * ratio) : 0;

        switch (selectedMode) {
            case 'hard_mode_low_weight':
                return [0.30, 0.40, 0.55, 0.70].map((r, i) => ({
                    kg: kg(r), reps: [20, 20, 15, 15][i], isDropSet: false, dropKgs: ['', '', '']
                }));
            case 'hard_mode_high_weight':
                return [0.80, 0.90, 1.00, 1.20].map((r, i) => ({
                    kg: kg(r), reps: [10, 10, 8, 6][i], isDropSet: false, dropKgs: ['', '', '']
                }));
            case 'hard_mode_progressive':
                return [0.60, 0.70, 0.85, 1.00, 0.85, 0.70].map((r, i) => ({
                    kg: kg(r), reps: [15, 13, 10, 10, 13, 15][i], isDropSet: false, dropKgs: ['', '', '']
                }));
            case 'hard_mode_drop_set':
                return Array.from({ length: 4 }, () => ({
                    kg: 0, reps: 0, isDropSet: isLastThree, dropKgs: ['', '', '']
                }));
            default:
                return [{ kg: 0, reps: 0, isDropSet: false, dropKgs: ['', '', ''] }];
        }
    };

    return (
        <div className="flex flex-col h-screen bg-slate-950 w-full max-w-6xl mx-auto border-x border-white/5 pb-20 relative overflow-hidden">
            {toastMsg && (
                <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[150] bg-blue-600 text-white text-xs font-black px-6 py-3 rounded-full shadow-2xl shadow-blue-600/40 animate-slide-up flex items-center gap-2 border border-white/10">
                    <Check size={16} /> {toastMsg}
                </div>
            )}

            <div className="p-4 border-b border-white/5 bg-slate-900/50 backdrop-blur-md sticky top-0 z-10 flex items-center gap-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                <h2 className="text-sm font-black text-white italic uppercase tracking-tighter">{t('aiCoach.title')}</h2>
                {addedExercises.size > 0 && (
                    <span className="bg-blue-600 text-white text-[9px] font-black px-2 py-0.5 rounded-full uppercase animate-success-pulse">
                        {addedExercises.size} {t('aiCoach.selectedCount')}
                    </span>
                )}
                <button onClick={handleResetWithInput} className="text-[9px] font-bold text-slate-500 uppercase hover:text-slate-300 ml-auto">
                    {t('aiCoach.reset')}
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar pb-32">
                {messages.map((msg) => {
                    if (msg.type === 'user') return <ChatMessage key={msg.id} msg={msg} />;

                    const routineData = msg.parsedData;
                    const isRecommendation = msg.msgType === 'recommendation' && routineData;
                    const isHard = !!msg.isHardMode;

                    return (
                        <div key={msg.id} className="flex items-start gap-3 mb-4 animate-slide-up">
                            <div className="flex-shrink-0 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-[10px] font-black text-white shadow-lg shadow-blue-900/20">AI</div>
                            <div className="flex-1 space-y-4 max-w-[95%]">
                                
                                <div className="bg-slate-900/80 border border-white/5 rounded-2xl rounded-tl-none p-4 shadow-xl">
                                    <p className="text-sm text-slate-200 leading-relaxed font-medium whitespace-pre-line">
                                        {isRecommendation 
                                            ? (routineData.reason || t('aiCoach.recommendationReason', { defaultValue: '오늘의 추천 루틴입니다.' })) 
                                            : (() => {
                                                const cleanedText = typeof msg.text === 'string' ? msg.text.replace(/\{[\s\S]*\}/, '').trim() : msg.text;
                                                if (cleanedText) return cleanedText;
                                                if (msg.parsedData) return t('aiCoach.analysisComplete', { defaultValue: '추천 루틴 분석이 완료되었습니다. 아래 카드를 확인해 주세요.' });
                                                return msg.text;
                                              })()
                                        }
                                    </p>
                                </div>

                                {isRecommendation && (
                                    <div className={`border rounded-3xl p-5 space-y-5 shadow-2xl backdrop-blur-sm ${isHard ? 'bg-rose-950/20 border-rose-500/40 shadow-[0_0_15px_rgba(244,63,94,0.15)]' : 'bg-slate-900 border-white/10'}`}>
                                        <div className="space-y-3">
                                            {routineData.routines.map((routine, idx) => {
                                                const key = `${msg.id}_${routine.exercise}_${idx}`;
                                                const isAdded = addedExercises.has(key);
                                                const localizedName = getLocalizedNameByKo(routine.exercise, i18n.language);
                                                const pr = getPRForExercise(routine.exercise);
                                                const exInfo = exerciseDataset.find(e => e.name === routine.exercise || e.name_en === routine.exercise);
                                                const subTarget = routine.sub_target_focus || (i18n.language === 'en' ? exInfo?.subTarget_en : exInfo?.subTarget_ko);

                                                return (
                                                    <div key={idx} className={`rounded-xl border transition-all overflow-hidden ${isAdded ? 'bg-blue-600/10 border-blue-500/50' : isHard ? 'bg-rose-900/30 border-rose-500/40' : 'bg-slate-800/40 border-white/5'}`}>
                                                        <div className="flex items-start sm:items-center gap-3 px-3 sm:px-4 py-3">
                                                            <div className="flex-1 min-w-0 grid grid-cols-[auto_1fr] items-center gap-x-2 gap-y-0.5 sm:flex sm:flex-row sm:items-center sm:gap-3">
                                                                <div className="flex flex-col items-start gap-0.5 sm:contents">
                                                                    <span className={`text-[9px] sm:text-[10px] font-black uppercase px-2 py-0.5 rounded-md shrink-0 ${isHard ? 'bg-rose-500/20 text-rose-400' : 'bg-blue-500/20 text-blue-400'}`}>
                                                                        {routine.part}
                                                                    </span>
                                                                    {(routine.equipment || exInfo?.equipment) && (
                                                                        <span className="text-[10px] text-slate-400 font-bold whitespace-nowrap">
                                                                            {routine.equipment || exInfo?.equipment}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <div className="flex flex-col gap-0.5 sm:contents">
                                                                    <h4 className="text-sm font-black text-white italic uppercase break-keep leading-tight">{localizedName}</h4>
                                                                    {subTarget && <span className="text-[10px] text-slate-500 font-bold whitespace-nowrap">{subTarget}</span>}
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-3 shrink-0 ml-auto sm:ml-0">
                                                                <div className="flex flex-col items-end gap-0.5 min-w-[80px]">
                                                                    {pr ? (<><div className="flex items-center gap-1 opacity-70"><Award size={10} className="text-yellow-500" /><span className="text-[8px] font-black text-slate-500 uppercase tracking-tighter">BEST</span></div><span className="text-[11px] font-black text-slate-300 whitespace-nowrap">{pr.kg}kg x {pr.reps}회</span></>) : (<span className="text-[10px] font-bold text-slate-700 italic">기록 없음</span>)}
                                                                </div>
                                                                <button onClick={() => handleAddRoutine(routine, idx, msg.id)} className={`p-2.5 rounded-xl transition-all active:scale-90 ${isAdded ? 'bg-blue-600 text-white' : isHard ? 'bg-rose-700 hover:bg-rose-600 text-white border border-rose-500/30' : 'bg-slate-700/50 text-slate-400 hover:text-white'}`}>
                                                                    {isAdded ? <Check size={16} /> : <Plus size={16} />}
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                        <button onClick={() => handleBatchAdd(routineData.routines, msg.id, msg.selectedMode)} className={`w-full py-4 mt-2 bg-gradient-to-r text-white rounded-2xl font-black italic text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-all shadow-xl border border-white/10 ${isHard ? 'from-rose-600 to-orange-600 shadow-rose-900/40' : 'from-blue-600 to-indigo-600 shadow-blue-900/40'}`}>
                                            <PlayCircle size={20} />{t('aiCoach.startTodayWorkout', { defaultValue: '오늘 운동 시작하기' })}
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
                {isTyping && (<div className="flex items-center gap-2 text-blue-400 italic text-xs animate-pulse ml-2"><Loader2 size={14} className="animate-spin" />{t('aiCoach.analyzing')}</div>)}
                {error && (<div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 p-4 rounded-2xl text-red-400 text-xs font-bold mx-2"><AlertCircle size={16} />{error}</div>)}
            </div>

            <div className="absolute bottom-20 left-0 right-0 p-4 bg-gradient-to-t from-slate-950 via-slate-950 to-transparent space-y-4">
                <div className="space-y-3">
                    <div className="flex gap-3">
                        <button onClick={sendRecommendationRequest} className="flex-1 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black italic text-xs flex items-center justify-center gap-2 active:scale-95 transition-all shadow-lg shadow-blue-600/20 border border-white/10"><Target size={18} /> {t('aiCoach.recommendToday')}</button>
                        <button onClick={() => setShowHardModeOptions(!showHardModeOptions)} className="flex-1 py-4 bg-rose-600 hover:bg-rose-500 text-white rounded-2xl font-black italic text-xs flex items-center justify-center gap-2 active:scale-95 transition-all shadow-lg shadow-rose-600/20 border border-white/10"><Flame size={18} /> {t('aiCoach.hardMode')}</button>
                    </div>
                    {showHardModeOptions && (
                        <div className="bg-slate-900 border border-rose-500/30 rounded-3xl p-4 space-y-3 animate-slide-up shadow-2xl backdrop-blur-xl">
                            <div className="grid grid-cols-2 gap-2.5">
                                {HARD_MODE_OPTIONS.map(({ label, value, description }) => (
                                    <button key={value} onClick={() => sendHardModeRequest(value)} className="bg-rose-600/5 hover:bg-rose-600/15 border border-rose-500/10 hover:border-rose-500/30 rounded-2xl py-4 px-4 text-left active:scale-95 transition-all group">
                                        <p className="text-xs font-black text-white group-hover:text-rose-400 transition-colors">{label}</p>
                                        <p className="text-[9px] text-slate-500 mt-1 font-medium leading-tight">{description}</p>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
                <div className="relative group">
                    <input type="text" value={inputText} onChange={e => setInputText(e.target.value)} onKeyDown={e => e.key === 'Enter' && onSendMessage()} placeholder={t('aiCoach.inputPlaceholder')} className="w-full bg-slate-900 border border-white/10 rounded-2xl py-4 pl-5 pr-14 text-sm text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all focus:bg-slate-800" />
                    <button onClick={onSendMessage} className="absolute right-2 top-2 bottom-2 px-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold active:scale-90 transition-all shadow-lg">↑</button>
                </div>
            </div>
        </div>
    );
};

export default AiRecommendationScreen;
