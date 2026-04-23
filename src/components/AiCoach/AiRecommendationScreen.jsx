import React, { useState, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Target, Flame, Dumbbell, TrendingUp, Plus, Check, Loader2, AlertCircle } from 'lucide-react';
import ChatMessage from '../ChatMessage';
import { useAiCoach } from './useAiCoach';
import { getLocalizedNameByKo } from '../../utils/exerciseUtils';

const AiRecommendationScreen = () => {
    const { t, i18n } = useTranslation();

    const HARD_MODE_OPTIONS = useMemo(() => [
        { label: t('aiCoach.hardModes.lowWeightHighRep'), value: 'hard_mode_low_weight', description: t('aiCoach.hardModes.lowWeightHighRepDesc') },
        { label: t('aiCoach.hardModes.highWeightLowRep'), value: 'hard_mode_high_weight', description: t('aiCoach.hardModes.highWeightLowRepDesc') },
        { label: t('aiCoach.hardModes.progressiveOverload'), value: 'hard_mode_progressive', description: t('aiCoach.hardModes.progressiveOverloadDesc') },
        { label: t('aiCoach.hardModes.dropSet'), value: 'hard_mode_drop_set', description: t('aiCoach.hardModes.dropSetDesc') },
    ], [t]);

    const {
        profile,
        messages,
        isTyping,
        handleSendMessage,
        handleManualReset,
        insertRoutineToDb,
        callRecommendation,
    } = useAiCoach();

    const [inputText, setInputText] = useState('');
    const [showHardModeOptions, setShowHardModeOptions] = useState(false);
    const [addedExercises, setAddedExercises] = useState(new Set());
    const [isInserting, setIsInserting] = useState(null); 
    const [toast, setToast] = useState(null);
    const [error, setError] = useState(null);

    const showToast = useCallback((message) => {
        setToast(message);
        setTimeout(() => setToast(null), 2500);
    }, []);

    const handleAddRoutine = async (routine, index, msgId) => {
        const key = `${msgId}_${routine.exercise}_${index}`;
        if (addedExercises.has(key)) return;

        setIsInserting(key);
        try {
            await insertRoutineToDb(routine);
            setAddedExercises(prev => new Set(prev).add(key));
            const localizedName = getLocalizedNameByKo(routine.exercise, i18n.language);
            showToast(`${localizedName} ${t('aiCoach.addedToRoutine')}`);
        } catch (err) {
            alert(t('workout.saveFailed') + err.message);
        } finally {
            setIsInserting(null);
        }
    };

    const parseResponseJSON = (content) => {
        if (typeof content !== 'string') return null;
        try {
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            if (!jsonMatch) return null;
            const data = JSON.parse(jsonMatch[0]);
            
            if (Array.isArray(data.routines)) {
                return {
                    type: 'routines',
                    items: data.routines,
                    reason: data.recommendationReason || null
                };
            }
            if (Array.isArray(data.routine)) return { type: 'routines', items: data.routine };
            return null;
        } catch (e) {
            return null;
        }
    };

    const sendRecommendationRequest = async () => {
        if (!profile) { alert(t('aiCoach.profileLoading')); return; }
        setError(null);
        setShowHardModeOptions(false);
        try {
            await callRecommendation('balanced');
        } catch (err) {
            setError(t('aiCoach.fetchError'));
        }
    };

    const sendHardModeRequest = async (hardModeType) => {
        if (!profile) { alert(t('aiCoach.profileLoading')); return; }
        setError(null);
        setShowHardModeOptions(false);
        try {
            await callRecommendation('hard', hardModeType);
        } catch (err) {
            setError(t('aiCoach.fetchError'));
        }
    };

    const onSendMessage = () => {
        if (!inputText.trim()) return;
        handleSendMessage(inputText.trim());
        setInputText('');
    };

    const handleResetWithInput = () => {
        handleManualReset();
        setInputText('');
        setError(null);
    };

    const addedCount = addedExercises.size;

    return (
        <div className="flex flex-col h-screen bg-slate-950 w-full max-w-6xl mx-auto border-x border-white/5 pb-20 relative overflow-hidden">
            {toast && (
                <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[150] bg-blue-600 text-white text-xs font-black px-6 py-3 rounded-full shadow-2xl shadow-blue-600/40 animate-slide-up flex items-center gap-2 border border-white/10">
                    <Check size={16} /> {toast}
                </div>
            )}

            <div className="p-4 border-b border-white/5 bg-slate-900/50 backdrop-blur-md sticky top-0 z-10 flex items-center gap-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                <h2 className="text-sm font-black text-white italic uppercase tracking-tighter">{t('aiCoach.title')}</h2>
                {addedCount > 0 && (
                    <span className="bg-blue-600 text-white text-[9px] font-black px-2 py-0.5 rounded-full uppercase">
                        {addedCount} {t('aiCoach.selectedCount')}
                    </span>
                )}
                <button onClick={handleResetWithInput} className="text-[9px] font-bold text-slate-500 uppercase hover:text-slate-300 ml-auto">
                    {t('aiCoach.reset')}
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar pb-32">
                {messages.map((msg) => {
                    if (msg.type === 'user') return <ChatMessage key={msg.id} msg={msg} />;

                    // AI 메시지 렌더링
                    const parsed = parseResponseJSON(msg.text);
                    const isRecommendation = msg.msgType === 'recommendation' && parsed;
                    const isMsgHardMode = typeof msg.text === 'string' && msg.text.toLowerCase().includes('hard_mode');

                    return (
                        <div key={msg.id} className="flex items-start gap-3 mb-4 animate-slide-up">
                            <div className="flex-shrink-0 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-[10px] font-black text-white shadow-lg shadow-blue-900/20">AI</div>
                            <div className="flex-1 space-y-4 max-w-[85%]">
                                
                                {/* 1. 일반 텍스트 렌더링 (추천이 아니거나 파싱 실패 시 fallback) */}
                                {!isRecommendation && (
                                    <div className="bg-slate-900/80 border border-white/5 rounded-2xl rounded-tl-none p-4 shadow-xl">
                                        <p className="text-sm text-slate-200 leading-relaxed font-medium whitespace-pre-line">
                                            {/* JSON이 포함된 텍스트일 경우 텍스트 부분만 추출, 아니면 전체 출력 */}
                                            {typeof msg.text === 'string' ? msg.text.replace(/\{[\s\S]*\}/, '').trim() : msg.text}
                                        </p>
                                    </div>
                                )}

                                {/* 2. 루틴 카드 렌더링 (추천 타입이고 파싱 성공 시) */}
                                {isRecommendation && (
                                    <div className={`border rounded-3xl p-5 space-y-5 shadow-2xl backdrop-blur-sm ${isMsgHardMode ? 'bg-rose-950/20 border-rose-500/30' : 'bg-slate-900 border-white/10'}`}>
                                        {parsed.reason && (
                                            <div className="flex items-start gap-2.5 bg-white/5 p-3.5 rounded-2xl border border-white/5">
                                                <TrendingUp size={16} className={isMsgHardMode ? 'text-rose-400' : 'text-blue-400'} />
                                                <p className="text-xs text-slate-300 leading-relaxed font-bold italic">{parsed.reason}</p>
                                            </div>
                                        )}

                                        <div className="space-y-3">
                                            {parsed.items.map((routine, idx) => {
                                                const key = `${msg.id}_${routine.exercise}_${idx}`;
                                                const isAdded = addedExercises.has(key);
                                                const loading = isInserting === key;
                                                const localizedName = getLocalizedNameByKo(routine.exercise, i18n.language);

                                                return (
                                                    <div key={idx} className={`rounded-2xl p-4 border transition-all ${isAdded ? 'bg-blue-600/10 border-blue-500/50 animate-success-pulse' : 'bg-slate-800/50 border-white/5'}`}>
                                                        <div className="flex justify-between items-start mb-4">
                                                            <div>
                                                                <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md mb-1.5 inline-block ${isMsgHardMode ? 'bg-rose-500/20 text-rose-400' : 'bg-blue-500/20 text-blue-400'}`}>
                                                                    {routine.part}
                                                                </span>
                                                                <h4 className="text-sm font-black text-white italic uppercase">{localizedName}</h4>
                                                            </div>
                                                            <button
                                                                onClick={() => handleAddRoutine(routine, idx, msg.id)}
                                                                disabled={isAdded || loading}
                                                                className={`p-2.5 rounded-xl transition-all active:scale-90 ${isAdded ? 'bg-blue-600 text-white cursor-default' : isMsgHardMode ? 'bg-rose-600 hover:bg-rose-500 text-white' : 'bg-blue-600 hover:bg-blue-500 text-white'}`}
                                                            >
                                                                {loading ? <Loader2 size={16} className="animate-spin" /> : isAdded ? <Check size={16} /> : <Plus size={16} />}
                                                            </button>
                                                        </div>

                                                        <div className="overflow-hidden rounded-xl border border-white/5 bg-slate-950/30">
                                                            <table className="w-full text-left border-collapse">
                                                                <thead>
                                                                    <tr className="bg-white/5">
                                                                        <th className="px-3 py-2 text-[9px] font-black text-slate-500 uppercase tracking-widest border-b border-white/5">Set</th>
                                                                        <th className="px-3 py-2 text-[9px] font-black text-slate-500 uppercase tracking-widest border-b border-white/5">Weight</th>
                                                                        <th className="px-3 py-2 text-[9px] font-black text-slate-500 uppercase tracking-widest border-b border-white/5 text-right">Reps</th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody>
                                                                    {routine.sets_data?.map((set, sIdx) => (
                                                                        <tr key={sIdx} className="border-b border-white/5 last:border-0">
                                                                            <td className="px-3 py-2 text-[10px] font-bold text-slate-400">#{sIdx + 1}</td>
                                                                            <td className="px-3 py-2 text-[11px] font-black text-white">
                                                                                {set.kg}kg
                                                                                {set.isDropSet && <span className="ml-1.5 text-[8px] text-rose-400 font-black animate-pulse">DROP</span>}
                                                                            </td>
                                                                            <td className="px-3 py-2 text-[11px] font-black text-white text-right">{set.reps}회</td>
                                                                        </tr>
                                                                    ))}
                                                                </tbody>
                                                            </table>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                        <p className="text-[9px] text-slate-500 text-center font-bold animate-pulse uppercase tracking-widest">{t('aiCoach.addHint')}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
                {isTyping && (
                    <div className="flex items-center gap-2 text-blue-400 italic text-xs animate-pulse ml-2">
                        <Loader2 size={14} className="animate-spin" />
                        {t('aiCoach.analyzing')}
                    </div>
                )}
                {error && (
                    <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 p-4 rounded-2xl text-red-400 text-xs font-bold mx-2">
                        <AlertCircle size={16} />
                        {error}
                    </div>
                )}
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
