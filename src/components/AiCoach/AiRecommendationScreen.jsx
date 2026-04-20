import React, { useState, useCallback } from 'react';
import { Target, Flame, Dumbbell, TrendingUp, Plus, Check } from 'lucide-react';
import ChatMessage from '../ChatMessage';
import { useAiCoach } from './useAiCoach';

const HARD_MODE_OPTIONS = [
    { label: '저중량 고반복', value: 'low_weight_high_reps', description: '근지구력 향상, 근육 펌핑' },
    { label: '고중량 저반복', value: 'high_weight_low_reps', description: '근력 증가, 파워 향상' },
    { label: '점진적 과부하', value: 'progressive_overload', description: '지속적인 중량 증가' },
    { label: '드롭 세트',   value: 'drop_sets',            description: '중량 감소하며 한계까지' },
];

const AiRecommendationScreen = () => {
    const {
        profile,
        recentStats,
        messages,
        isTyping,
        handleSendMessage,
        handleManualReset,
        addExerciseToRoutine,
        callRecommendation,
    } = useAiCoach();

    const [inputText, setInputText] = useState('');
    const [showHardModeOptions, setShowHardModeOptions] = useState(false);
    const [currentRecommendationMode, setCurrentRecommendationMode] = useState('balanced');
    const [addedExercises, setAddedExercises] = useState(new Set());
    const [toast, setToast] = useState(null);

    const showToast = useCallback((message) => {
        setToast(message);
        setTimeout(() => setToast(null), 2000);
    }, []);

    const handleAddExercise = useCallback((exercise, isHard) => {
        const key = exercise.name;
        if (addedExercises.has(key)) return;
        addExerciseToRoutine(exercise, isHard);
        setAddedExercises(prev => new Set(prev).add(key));
        showToast(`${exercise.name}이(가) 루틴에 추가되었습니다`);
    }, [addedExercises, addExerciseToRoutine, showToast]);

    const parseResponseJSON = (content) => {
        try {
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            if (!jsonMatch) return null;
            const data = JSON.parse(jsonMatch[0]);
            if (Array.isArray(data.recommendations)) return {
                type: 'recommendations',
                items: data.recommendations,
                intro: data.intro || null,
                tip: data.tip || null,
            };
            if (Array.isArray(data.routine)) return { type: 'routine', items: data.routine };
            if (Array.isArray(data.exercises)) return { type: 'routine', items: data.exercises };
            return null;
        } catch (e) {
            console.error('Failed to parse JSON from AI response', e);
            return null;
        }
    };

    const sendRecommendationRequest = async () => {
        if (!profile) { alert("프로필 정보를 불러오는 중입니다. 잠시 후 다시 시도해 주세요."); return; }
        setCurrentRecommendationMode('balanced');
        await callRecommendation('balanced');
    };

    const sendHardModeRequest = async (hardModeType) => {
        if (!profile || !recentStats) {
            alert("프로필 정보를 불러오는 중입니다. 잠시 후 다시 시도해주세요.");
            return;
        }
        const option = HARD_MODE_OPTIONS.find(o => o.value === hardModeType);
        setCurrentRecommendationMode('hard');
        setShowHardModeOptions(false);
        await callRecommendation('hard', hardModeType, option?.label);
    };

    const onSendMessage = () => {
        if (!inputText.trim()) return;
        handleSendMessage(inputText.trim());
        setInputText('');
    };

    const addedCount = addedExercises.size;

    return (
        <div className="flex flex-col h-screen bg-slate-950 max-w-2xl mx-auto border-x border-white/5 pb-20 relative">
            {/* 토스트 */}
            {toast && (
                <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-green-600 text-white text-xs font-bold px-4 py-2 rounded-full shadow-lg animate-slide-up">
                    ✓ {toast}
                </div>
            )}

            <div className="p-4 border-b border-white/5 bg-slate-900/50 backdrop-blur-md sticky top-0 z-10 flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    <h2 className="text-sm font-black text-white italic uppercase tracking-tighter">AI PT COACH</h2>
                    {addedCount > 0 && (
                        <span className="ml-1 bg-green-600 text-white text-[9px] font-black px-2 py-0.5 rounded-full uppercase">
                            {addedCount}개 선택됨
                        </span>
                    )}
                </div>
                <button
                    onClick={handleManualReset}
                    className="text-[9px] font-bold text-slate-500 uppercase hover:text-slate-300"
                >
                    초기화
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar pb-32">
                {messages.map((msg) => {
                    if (msg.type === 'user') {
                        return <ChatMessage key={msg.id} msg={msg} />;
                    }

                    const parsed = parseResponseJSON(msg.text);
                    const plainText = msg.text.replace(/\{[\s\S]*\}/, '').replace(/```json/gi, '').replace(/```/gi, '').trim();

                    return (
                        <div key={msg.id} className="flex items-start gap-3 mb-4 animate-slide-up">
                            <div className="flex-shrink-0 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-[10px] font-black text-white shadow-lg shadow-blue-900/20">AI</div>
                            <div className="flex-1 bg-slate-900/80 border border-white/5 rounded-2xl rounded-tl-none p-4 space-y-4 max-w-[85%] shadow-xl overflow-hidden">

                                {plainText && (
                                    <div className="bg-blue-600/10 border-l-4 border-blue-500 pl-3 py-2 rounded-r">
                                        <p className="text-[10px] text-blue-400 font-black mb-1 uppercase tracking-widest flex items-center gap-1.5"><TrendingUp size={12} /> 📊 코치 가이드</p>
                                        <p className="text-sm text-slate-200 leading-relaxed font-medium whitespace-pre-line">{plainText}</p>
                                    </div>
                                )}

                                {parsed && parsed.items.length > 0 && (
                                    <div className="bg-purple-600/10 border border-purple-500/30 rounded-2xl p-4 space-y-4">
                                        {/* 앞 멘트 */}
                                        {parsed.intro && (
                                            <p className="text-sm text-slate-200 leading-relaxed font-medium">{parsed.intro}</p>
                                        )}

                                        {/* 헤더 */}
                                        <div className="flex items-center justify-between border-b border-white/10 pb-2">
                                            <p className="text-[10px] text-slate-400 font-bold flex items-center gap-1.5 uppercase tracking-widest">
                                                <Dumbbell size={14} className="text-blue-500" /> 맞춤 운동 루틴
                                            </p>
                                            <span className="text-[10px] text-blue-500 font-black italic">{parsed.items.length} EXERCISES</span>
                                        </div>

                                        {/* 운동 카드 */}
                                        <div className="space-y-2">
                                            {parsed.items.map((exercise, exIdx) => {
                                                const isAdded = addedExercises.has(exercise.name);
                                                const isRecommendation = parsed.type === 'recommendations';
                                                const hasRecord = exercise.best_record && exercise.best_record !== '기록없음';

                                                return (
                                                    <div key={exIdx} className={`bg-slate-800/40 rounded-xl p-3 border transition-colors ${isAdded ? 'border-green-500/40' : 'border-white/5 hover:border-blue-500/30'}`}>
                                                        {/* 운동명 + 부위|기록 + 버튼 */}
                                                        <div className="flex items-center justify-between gap-2 mb-1.5">
                                                            <h4 className="text-sm font-black text-white italic uppercase truncate">{exercise.name}</h4>
                                                            <div className="flex items-center gap-2 flex-shrink-0">
                                                                <div className="flex items-center gap-1.5">
                                                                    <span className="text-[10px] text-blue-500 font-bold uppercase">{exercise.part}</span>
                                                                    {isRecommendation && (
                                                                        <>
                                                                            <span className="text-slate-600 text-[10px]">|</span>
                                                                            <span className={`text-[10px] font-black ${hasRecord ? 'text-yellow-400' : 'text-slate-600'}`}>
                                                                                {exercise.best_record || '기록없음'}
                                                                            </span>
                                                                        </>
                                                                    )}
                                                                </div>
                                                                <button
                                                                    onClick={() => handleAddExercise(exercise, currentRecommendationMode === 'hard')}
                                                                    disabled={isAdded}
                                                                    className={`p-1.5 rounded-lg text-white transition-all active:scale-90 flex-shrink-0 ${
                                                                        isAdded
                                                                            ? 'bg-green-600 cursor-default'
                                                                            : 'bg-blue-600 hover:bg-blue-500'
                                                                    }`}
                                                                >
                                                                    {isAdded ? <Check size={14} /> : <Plus size={14} />}
                                                                </button>
                                                            </div>
                                                        </div>

                                                        {/* routine 타입: sets 표시 */}
                                                        {!isRecommendation && exercise.sets?.length > 0 && (
                                                            <div className="flex gap-2 mb-1.5">
                                                                {exercise.sets.map((set, sIdx) => (
                                                                    <div key={sIdx} className="bg-slate-900/60 px-2 py-1 rounded text-[10px] text-slate-300 font-medium border border-white/5">
                                                                        {set.kg ? `${set.kg}kg × ` : ''}{set.reps}회
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}

                                                        {(exercise.description || exercise.advice) && (
                                                            <p className="text-[11px] text-slate-400 leading-relaxed line-clamp-2 italic">
                                                                "{exercise.advice || exercise.description}"
                                                            </p>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>

                                        <p className="text-[9px] text-slate-500 text-center font-bold animate-pulse uppercase tracking-widest">
                                            각 운동의 + 버튼을 눌러 루틴에 추가하세요
                                        </p>

                                        {/* 뒤 멘트 */}
                                        {parsed.tip && (
                                            <p className="text-sm text-slate-200 leading-relaxed font-medium">💪 {parsed.tip}</p>
                                        )}
                                    </div>
                                )}

                                {!plainText && !parsed && (
                                    <p className="text-sm text-slate-200 leading-relaxed whitespace-pre-line font-medium">
                                        {msg.text}
                                    </p>
                                )}
                            </div>
                        </div>
                    );
                })}
                {isTyping && <div className="text-slate-500 italic text-xs animate-pulse ml-2">코치가 데이터를 분석 중...</div>}
            </div>

            <div className="absolute bottom-20 left-0 right-0 p-4 bg-gradient-to-t from-slate-950 via-slate-950 to-transparent space-y-4">
                <div className="space-y-3">
                    <div className="flex gap-3">
                        <button onClick={() => sendRecommendationRequest('balanced')} className="flex-1 py-3.5 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black italic text-xs flex items-center justify-center gap-2 active:scale-95 transition-all shadow-lg shadow-blue-600/20"><Target size={16} /> 오늘의 루틴 추천</button>
                        <button onClick={() => setShowHardModeOptions(!showHardModeOptions)} className="flex-1 py-3.5 bg-rose-600 hover:bg-rose-500 text-white rounded-2xl font-black italic text-xs flex items-center justify-center gap-2 active:scale-95 transition-all shadow-lg shadow-rose-600/20"><Flame size={16} /> 하드모드</button>
                    </div>
                    {showHardModeOptions && (
                        <div className="bg-slate-900/80 border border-rose-500/30 rounded-2xl p-3 space-y-3 animate-slide-up shadow-2xl backdrop-blur-md">
                            <p className="text-[10px] text-slate-500 font-bold text-center">데이터가 2주 이상 쌓여야 정확한 하드모드 추천이 가능합니다.</p>
                            <div className="grid grid-cols-2 gap-2">
                                {HARD_MODE_OPTIONS.map(({ label, value, description }) => (
                                    <button key={value} onClick={() => sendHardModeRequest(value)} className="bg-rose-600/10 hover:bg-rose-600/20 border border-rose-500/20 rounded-xl py-3 px-4 text-left active:scale-95 transition-all">
                                        <p className="text-xs font-black text-white">{label}</p>
                                        <p className="text-[10px] text-rose-300/70 mt-0.5">{description}</p>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
                <div className="relative">
                    <input type="text" value={inputText} onChange={e => setInputText(e.target.value)} onKeyDown={e => e.key === 'Enter' && onSendMessage()} placeholder="코치에게 질문하기..." className="w-full bg-slate-900 border border-white/10 rounded-2xl py-4 pl-5 pr-14 text-sm text-white focus:ring-2 focus:ring-blue-500 outline-none" />
                    <button onClick={onSendMessage} className="absolute right-2 top-2 bottom-2 px-4 bg-blue-600 text-white rounded-xl font-bold active:scale-90 transition-transform">↑</button>
                </div>
            </div>
        </div>
    );
};

export default AiRecommendationScreen;
