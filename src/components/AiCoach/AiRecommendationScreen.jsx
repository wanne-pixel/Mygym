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
        profile, exerciseDataset, personalRecords, messages, isTyping,
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

    const parseResponseJSON = (content) => {
        if (typeof content !== 'string') return null;
        try {
            // 방어 로직: 마크다운 코드 블록 제거 및 순수 JSON 추출
            const jsonStr = content.replace(/```json|```/g, '').trim();
            const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
            if (!jsonMatch) return null;
            
            const data = JSON.parse(jsonMatch[0]);
            if (Array.isArray(data.routines)) return { type: 'routines', items: data.routines, reason: data.recommendationReason || null };
            return null;
        } catch (e) { 
            console.error('[Parser Error]', e);
            return null; 
        }
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
        console.log('--- [추천 버튼 클릭됨 시작!] ---');
        console.log('현재 프로필 상태:', profile);
        
        if (!profile) { 
            console.warn('프로필 데이터가 없어 요청을 중단합니다.');
            sonnerToast.error(t('aiCoach.profileLoading')); 
            return; 
        }

        setError(null); 
        setShowHardModeOptions(false);
        try { 
            console.log('callRecommendation(balanced) 호출 시도...');
            await callRecommendation('balanced'); 
            console.log('callRecommendation(balanced) 호출 성공');
        } catch (err) { 
            console.error('[sendRecommendationRequest Error]:', err);
            setError(t('aiCoach.fetchError')); 
        } finally {
            console.log('--- [추천 요청 프로세스 종료] ---');
        }
    };

    const sendHardModeRequest = async (hardModeType) => {
        console.log(`--- [하드모드 버튼 클릭됨: ${hardModeType}] ---`);
        console.log('현재 프로필 상태:', profile);

        if (!profile) { 
            console.warn('프로필 데이터가 없어 하드모드 요청을 중단합니다.');
            sonnerToast.error(t('aiCoach.profileLoading')); 
            return; 
        }

        setError(null); 
        setShowHardModeOptions(false);
        try { 
            console.log(`callRecommendation(hard, ${hardModeType}) 호출 시도...`);
            await callRecommendation('hard', hardModeType); 
            console.log(`callRecommendation(hard, ${hardModeType}) 호출 성공`);
        } catch (err) { 
            console.error('[sendHardModeRequest Error]:', err);
            setError(t('aiCoach.fetchError')); 
        } finally {
            console.log('--- [하드모드 요청 프로세스 종료] ---');
        }
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

                    const parsed = parseResponseJSON(msg.text);
                    const isRecommendation = (msg.msgType === 'recommendation' || parsed) && parsed;
                    const isHard = !!msg.isHardMode;

                    return (
                        <div key={msg.id} className="flex items-start gap-3 mb-4 animate-slide-up">
                            <div className="flex-shrink-0 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-[10px] font-black text-white shadow-lg shadow-blue-900/20">AI</div>
                            <div className="flex-1 space-y-4 max-w-[95%]">
                                {!isRecommendation && (
                                    <div className="bg-slate-900/80 border border-white/5 rounded-2xl rounded-tl-none p-4 shadow-xl">
                                        <p className="text-sm text-slate-200 leading-relaxed font-medium whitespace-pre-line">
                                            {typeof msg.text === 'string' ? msg.text.replace(/\{[\s\S]*\}/, '').trim() : msg.text}
                                        </p>
                                    </div>
                                )}

                                {isRecommendation && (
                                    <div className={`border rounded-3xl p-5 space-y-5 shadow-2xl backdrop-blur-sm ${isHard ? 'bg-rose-950/20 border-rose-500/40 shadow-[0_0_15px_rgba(244,63,94,0.15)]' : 'bg-slate-900 border-white/10'}`}>
                                        {parsed.reason && (
                                            <div className="flex items-start gap-2.5 bg-white/5 p-3.5 rounded-2xl border border-white/5">
                                                <TrendingUp size={16} className={isHard ? 'text-rose-400' : 'text-blue-400'} />
                                                <p className="text-xs text-slate-300 leading-relaxed font-bold italic">{parsed.reason}</p>
                                            </div>
                                        )}

                                        <div className="space-y-3">
                                            {parsed.items.map((routine, idx) => {
                                                const key = `${msg.id}_${routine.exercise}_${idx}`;
                                                const isAdded = addedExercises.has(key);
                                                const localizedName = getLocalizedNameByKo(routine.exercise, i18n.language);
                                                const pr = getPRForExercise(routine.exercise);
                                                const exInfo = exerciseDataset.find(e => e.name === routine.exercise || e.name_en === routine.exercise);
                                                const subTarget = routine.sub_target_focus || (i18n.language === 'en' ? exInfo?.subTarget_en : exInfo?.subTarget_ko);

                                                return (
                                                    <div key={idx} className={`rounded-xl border transition-all overflow-hidden ${isAdded ? 'bg-blue-600/10 border-blue-500/50' : isHard ? 'bg-rose-900/30 border-rose-500/40' : 'bg-slate-800/40 border-white/5'}`}>
                                                        <div className="flex items-start sm:items-center gap-3 px-3 sm:px-4 py-3">
                                                            <span className={`text-[9px] sm:text-[10px] font-black uppercase px-2 py-0.5 rounded-md shrink-0 ${isHard ? 'bg-rose-500/20 text-rose-400' : 'bg-blue-500/20 text-blue-400'}`}>
                                                                {routine.part}
                                                            </span>
                                                            <div className="flex-1 min-w-0 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                                                                <h4 className="text-sm font-black text-white italic uppercase break-keep leading-tight">{localizedName}</h4>
                                                                {subTarget && <span className="text-[10px] text-slate-500 font-bold whitespace-nowrap">{subTarget}</span>}
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
                                                        {isHard && routine.sets_data && (
                                                            <div className="px-3 pb-3">
                                                                <div className="bg-slate-950/60 rounded-lg border border-rose-500/20 overflow-hidden shadow-inner">
                                                                    <div className="grid grid-cols-3 bg-rose-500/5 px-3 py-1.5 text-[8px] font-black text-rose-400/60 uppercase tracking-widest border-b border-rose-500/10">
                                                                        <span>Set</span><span className="text-center italic">Intensity</span><span className="text-right">Reps</span>
                                                                    </div>
                                                                    <div className="divide-y divide-rose-500/5">
                                                                        {routine.sets_data.map((set, sIdx) => (
                                                                            <div key={sIdx} className="grid grid-cols-3 px-3 py-2 items-center italic">
                                                                                <span className="text-[10px] font-black text-slate-600">#{sIdx + 1}</span><div className="text-center flex flex-col items-center"><span className="text-xs font-black text-white">{set.kg}kg</span>{set.isDropSet && <span className="text-[7px] text-rose-500 font-black animate-pulse mt-0.5">DROP</span>}</div><span className="text-right text-sm font-black text-rose-500">{set.reps}회</span>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                        <button onClick={goToWorkoutPlan} className={`w-full py-4 mt-2 bg-gradient-to-r text-white rounded-2xl font-black italic text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-all shadow-xl border border-white/10 ${isHard ? 'from-rose-600 to-orange-600 shadow-rose-900/40' : 'from-blue-600 to-indigo-600 shadow-blue-900/40'}`}>
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
