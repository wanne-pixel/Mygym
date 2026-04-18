import React, { useState } from 'react';
import { Target, Flame, Dumbbell, TrendingUp } from 'lucide-react';
import ChatMessage from '../ChatMessage';
import { useAiCoach } from './useAiCoach';
import AiExerciseCard from './AiExerciseCard';

const AiRecommendationScreen = () => {
    const { 
        profile, 
        recentStats, 
        messages, 
        isTyping, 
        handleSendMessage, 
        handleManualReset, 
        addExerciseToRoutine, 
        callOpenAI 
    } = useAiCoach();
    
    const [inputText, setInputText] = useState('');
    const [showHardModeOptions, setShowHardModeOptions] = useState(false);
    const [currentRecommendationMode, setCurrentRecommendationMode] = useState('balanced');

    const parseRoutineFromResponse = (content) => {
        try {
            const jsonMatch = content.match(/```json[\s\S]*?```/);
            if (!jsonMatch) return null;
            const jsonStr = jsonMatch[0].replace(/```json|```/g, '').trim();
            const data = JSON.parse(jsonStr);
            return data.routine || null;
        } catch (e) {
            console.error('Failed to parse JSON routine from AI response', e);
            return null;
        }
    };

    const sendRecommendationRequest = async (mode) => {
        if (!profile) { alert("프로필 정보를 불러오는 중입니다. 잠시 후 다시 시도해 주세요."); return; }
        setCurrentRecommendationMode('balanced');
        let displayMessage = '🎯 오늘의 루틴 추천';
        let aiPrompt = "나의 프로필과 최근 운동 기록을 분석해서 오늘 할 균형잡힌 운동 루틴을 추천해줘. 부족한 부위가 있으면 보완하고 점진적 과부하 원칙을 적용해줘. 오늘 하루 루틴만 3-5개 운동으로 구성해서 JSON 형식으로 응답해줘.";
        
        await handleSendMessage(displayMessage, aiPrompt);
    };

    const sendHardModeRequest = async (hardModeType) => {
        if (!profile || !recentStats) {
            alert("프로필 정보를 불러오는 중입니다. 잠시 후 다시 시도해주세요.");
            return;
        }

        setCurrentRecommendationMode('hard');
        setShowHardModeOptions(false);

        const modeLabels = {
            low_weight_high_reps: '🔥 저중량 고반복',
            high_weight_low_reps: '🔥 고중량 저반복',
            progressive_overload: '🔥 점진적 중량증가',
            drop_sets: '🔥 드롭세트'
        };

        const modeInstructions = {
            low_weight_high_reps: `저중량 고반복 하드모드...`,
            high_weight_low_reps: `고중량 저반복 하드모드...`,
            progressive_overload: `점진적 중량증가 하드모드...`,
            drop_sets: `드롭세트 하드모드...`
        };

        let displayMessage = modeLabels[hardModeType];
        let aiPrompt = `나의 프로필과 최근 운동 기록, 최고 기록을 분석해서 다음 하드모드 루틴을 추천해줘:\n\n${modeInstructions[hardModeType]}\n\n중요: ... (생략 동일 로직) ...`;

        await handleSendMessage(displayMessage, aiPrompt);
    };

    const onSendMessage = () => {
        if (!inputText.trim()) return;
        handleSendMessage(inputText.trim());
        setInputText('');
    };

    return (
        <div className="flex flex-col h-screen bg-slate-950 max-w-2xl mx-auto border-x border-white/5 pb-20 relative">
            <div className="p-4 border-b border-white/5 bg-slate-900/50 backdrop-blur-md sticky top-0 z-10 flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    <h2 className="text-sm font-black text-white italic uppercase tracking-tighter">AI PT COACH</h2>
                </div>
                <button 
                    onClick={handleManualReset}
                    className="text-[9px] font-bold text-slate-500 uppercase hover:text-slate-300"
                >
                    초기화
                </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar pb-32">
                {messages.map((msg, idx) => {
                    if (msg.type === 'user') {
                        return <ChatMessage key={msg.id} msg={msg} />;
                    }

                    const routine = parseRoutineFromResponse(msg.text);
                    const sections = msg.text.split(/\*\*\d\.\s*/);
                    const analysis = sections[1]?.split('\n')[0] || '';
                    const direction = sections[2]?.split('\n')[0] || '';
                    const caution = sections[4]?.split('\n')[0] || '';
                    const motivation = sections[5]?.split('\n')[0] || '';

                    return (
                        <div key={msg.id} className="flex items-start gap-3 mb-4 animate-slide-up">
                            <div className="flex-shrink-0 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-[10px] font-black text-white shadow-lg shadow-blue-900/20">AI</div>
                            <div className="flex-1 bg-slate-900/80 border border-white/5 rounded-2xl rounded-tl-none p-4 space-y-3 max-w-[85%] shadow-xl overflow-hidden">
                                {analysis && (
                                    <div className="bg-blue-600/10 border-l-4 border-blue-500 pl-3 py-2 rounded-r">
                                        <p className="text-[10px] text-blue-400 font-black mb-1 uppercase tracking-widest flex items-center gap-1.5"><TrendingUp size={12} /> 📊 상태분석</p>
                                        <p className="text-sm text-slate-200 leading-relaxed font-medium">{analysis}</p>
                                    </div>
                                )}
                                {routine && routine.length > 0 && (
                                    <div className="space-y-2 pt-2">
                                        <p className="text-[10px] text-slate-500 font-bold flex items-center gap-1.5 uppercase tracking-widest"><Dumbbell size={12} className="text-blue-500" /> 운동을 탭하여 추가</p>
                                        <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
                                            {routine.map((exercise, exIdx) => (
                                                <AiExerciseCard key={exIdx} exercise={exercise} mode={currentRecommendationMode} onAdd={addExerciseToRoutine} />
                                            ))}
                                        </div>
                                    </div>
                                )}
                                {!analysis && !routine && <p className="text-sm text-slate-200 leading-relaxed whitespace-pre-line font-medium">{msg.text}</p>}
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
                            <div className="grid grid-cols-2 gap-2">
                                {['low_weight_high_reps', 'high_weight_low_reps', 'progressive_overload', 'drop_sets'].map(mode => (
                                    <button key={mode} onClick={() => sendHardModeRequest(mode)} className="bg-rose-600/10 hover:bg-rose-600/20 border border-rose-500/20 rounded-xl py-3 px-4 text-left active:scale-95 transition-all">
                                        <p className="text-xs font-black text-white italic">{mode.replace(/_/g, ' ').toUpperCase()}</p>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
                <div className="relative">
                    <input type="text" value={inputText} onChange={e => setInputText(e.target.value)} onKeyPress={e => e.key === 'Enter' && onSendMessage()} placeholder="코치에게 질문하기..." className="w-full bg-slate-900 border border-white/10 rounded-2xl py-4 pl-5 pr-14 text-sm text-white focus:ring-2 focus:ring-blue-500 outline-none" />
                    <button onClick={onSendMessage} className="absolute right-2 top-2 bottom-2 px-4 bg-blue-600 text-white rounded-xl font-bold active:scale-90 transition-transform">↑</button>
                </div>
            </div>
        </div>
    );
};

export default AiRecommendationScreen;
