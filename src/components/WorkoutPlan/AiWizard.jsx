import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Dumbbell, ArrowRight, ArrowLeft, Check, Wand2 } from 'lucide-react';
import { generateAiRoutine } from '../../api/aiRoutineApi';
import { getGlobalExerciseCache, getLocalizedNameByKo, setGlobalExerciseCache } from '../../utils/exerciseUtils';
import { fetchAllExercises } from '../../api/exerciseApi';
import { toast } from 'sonner';
import { useWindowSize } from '../../hooks/useWindowSize';
import { trackEvent } from '../../utils/analytics';

const AiWizard = ({ onSave, personalRecords, workoutPreferences, user, workoutLogs }) => {
    const { t, i18n } = useTranslation();
    const { isMobile } = useWindowSize();
    
    const [isGenerating, setIsGenerating] = useState(false);
    const [isLoadingExercises, setIsLoadingExercises] = useState(false);
    const [previewRoutine, setPreviewRoutine] = useState(null);

    // Wizard Steps State
    const [step, setStep] = useState(1);
    const [selectedBodyPart, setSelectedBodyPart] = useState('가슴');
    const [condition, setCondition] = useState('보통');
    const [exerciseCount, setExerciseCount] = useState(5);
    const [setCount, setSetCount] = useState(4);
    const [recommendedHint, setRecommendedHint] = useState('');

    const bodyParts = ['가슴', '등', '하체', '어깨', '팔', 'AI추천'];
    const conditions = ['가볍게', '보통', '최상(고강도)'];

    // Handle exercises pre-fetching and recent logs on mount
    useEffect(() => {
        const loadInitialData = async () => {
            if (getGlobalExerciseCache().length === 0) {
                setIsLoadingExercises(true);
                try {
                    const data = await fetchAllExercises();
                    setGlobalExerciseCache(data);
                } catch (error) {
                    console.error('Failed to pre-fetch exercises:', error);
                    toast.error('운동 데이터를 불러오는 데 실패했습니다.');
                } finally {
                    setIsLoadingExercises(false);
                }
            }

            // AI 추천 부위 힌트 계산
            try {
                const { supabase } = await import('../../api/supabase');
                const sevenDaysAgo = new Date();
                sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
                
                const { data: recentLogs } = await supabase
                    .from('workout_logs')
                    .select('part')
                    .eq('user_id', user.id)
                    .gte('created_at', sevenDaysAgo.toISOString())
                    .order('created_at', { ascending: false });
                    
                let hint = '가슴'; // 기본값
                if (recentLogs && recentLogs.length > 0) {
                    const trainedParts = Array.from(new Set(recentLogs.map(log => log.part).filter(Boolean)));
                    const order = ['가슴', '등', '하체', '어깨', '팔'];
                    
                    const unused = order.filter(part => !trainedParts.includes(part));
                    if (unused.length > 0) {
                        hint = unused[0];
                    } else {
                        // 모든 부위를 다 했다면, 가장 오래 전에 한 부위를 추천 (trainedParts의 마지막 요소)
                        const validTrainedParts = trainedParts.filter(part => order.includes(part));
                        hint = validTrainedParts.length > 0 ? validTrainedParts[validTrainedParts.length - 1] : order[0];
                    }
                }
                setRecommendedHint(`${hint} 차례`);
            } catch (e) {
                console.error('Failed to fetch recent logs for AI recommendation hint:', e);
            }
        };
        loadInitialData();
    }, [user.id]);

    const handleNext = () => setStep(prev => Math.min(prev + 1, 3));
    const handlePrev = () => setStep(prev => Math.max(prev - 1, 1));

    const handleGenerate = async () => {
        setIsGenerating(true);
        try {
            const availableExercises = getGlobalExerciseCache();
            if (!availableExercises || availableExercises.length === 0) {
                throw new Error('사용 가능한 운동 데이터가 없습니다. 새로고침 후 다시 시도해보세요.');
            }

            // 최근 7일간의 운동 부위 추출
            let lastBodyParts = [];
            if (selectedBodyPart === 'AI추천') {
                try {
                    const { supabase } = await import('../../api/supabase');
                    const sevenDaysAgo = new Date();
                    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
                    
                    const { data: recentLogs } = await supabase
                        .from('workout_logs')
                        .select('part')
                        .eq('user_id', user.id)
                        .gte('created_at', sevenDaysAgo.toISOString())
                        .order('created_at', { ascending: false });
                        
                    if (recentLogs) {
                        lastBodyParts = Array.from(new Set(recentLogs.map(log => log.part).filter(Boolean)));
                    }
                } catch (e) {
                    console.error('Failed to fetch recent logs for AI recommendation:', e);
                }
            }

            const result = await generateAiRoutine({
                availableExercises,
                personalRecords,
                targetBodyPart: selectedBodyPart,
                condition: condition,
                exerciseCount: exerciseCount,
                setCount: setCount,
                lastBodyParts: lastBodyParts
            });
            trackEvent('ai_coach_request', { type: 'ai_recommendation', targetBodyPart: selectedBodyPart, userId: user?.id });
            setPreviewRoutine(result);
            setStep(4); // Move to preview step
        } catch (error) {
            console.error(error);
            import('sonner').then(({ toast }) => toast.error(error.message || 'Error generating AI routine'));
        } finally {
            setIsGenerating(false);
        }
    };

    const handleSave = () => {
        if (!previewRoutine) return;
        onSave(previewRoutine);
    };

    if (isLoadingExercises) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 gap-4 text-white">
                <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-slate-400 text-sm font-bold animate-pulse uppercase tracking-widest">
                    운동 데이터를 불러오고 있습니다...
                </p>
            </div>
        );
    }

    return (
        <div className={`${isMobile ? 'p-4' : 'p-8 max-w-2xl mx-auto'} bg-slate-950 min-h-screen pb-24 text-white animate-fade-in`}>
            <h2 className="text-3xl font-black italic text-white uppercase underline decoration-indigo-500 decoration-4 underline-offset-8 mb-8 flex items-center justify-center gap-3">
                <Wand2 className="text-indigo-500 w-8 h-8" />
                AI 루틴 생성
            </h2>

            {step <= 3 && (
                <div className="bg-slate-900/50 p-6 rounded-3xl border border-slate-800 space-y-8">
                    {/* Progress Bar */}
                    <div className="flex justify-between items-center mb-8 relative">
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-slate-800 rounded-full z-0" />
                        <div 
                            className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-indigo-500 rounded-full z-0 transition-all duration-300" 
                            style={{ width: `${((step - 1) / 2) * 100}%` }} 
                        />
                        {[1, 2, 3].map((s) => (
                            <div 
                                key={s} 
                                className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-all ${
                                    step >= s ? 'bg-indigo-500 text-white shadow-[0_0_15px_rgba(99,102,241,0.5)]' : 'bg-slate-800 text-slate-400'
                                }`}
                            >
                                {step > s ? <Check className="w-4 h-4" /> : s}
                            </div>
                        ))}
                    </div>

                    {/* Step 1: Body Part Selection */}
                    {step === 1 && (
                        <div className="space-y-6 animate-fade-in">
                            <div>
                                <h3 className="text-xl font-bold text-white mb-2">Step 1. 오늘 할 부위를 선택하세요</h3>
                                <p className="text-sm text-slate-400">AI추천을 선택하시면 최근 운동 기록을 토대로 추천해 드립니다.</p>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                {bodyParts.map((part) => (
                                    <button
                                        key={part}
                                        onClick={() => setSelectedBodyPart(part)}
                                        className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center justify-center text-center font-bold ${
                                            selectedBodyPart === part
                                                ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-500/20'
                                                : 'bg-slate-800 border-slate-700 text-slate-300 hover:border-slate-500'
                                        }`}
                                    >
                                        <span>{part}</span>
                                        {part === 'AI추천' && recommendedHint && (
                                            <span className={`text-xs mt-1 ${selectedBodyPart === part ? 'text-indigo-200' : 'text-slate-400'}`}>
                                                ({recommendedHint})
                                            </span>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Step 2: Condition Selection */}
                    {step === 2 && (
                        <div className="space-y-6 animate-fade-in">
                            <div>
                                <h3 className="text-xl font-bold text-white mb-2">Step 2. 오늘의 컨디션은 어떠신가요?</h3>
                                <p className="text-sm text-slate-400">선택한 컨디션에 따라 무게와 운동 종류가 조절됩니다.</p>
                            </div>
                            <div className="space-y-3">
                                {conditions.map((cond) => (
                                    <button
                                        key={cond}
                                        onClick={() => setCondition(cond)}
                                        className={`w-full p-5 rounded-2xl border-2 transition-all flex justify-between items-center ${
                                            condition === cond
                                                ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-500/20'
                                                : 'bg-slate-800 border-slate-700 text-slate-300 hover:border-slate-500'
                                        }`}
                                    >
                                        <span className="font-bold text-lg">{cond}</span>
                                        <span className="text-sm opacity-80">
                                            {cond === '가볍게' && '머신 위주, 가벼운 중량'}
                                            {cond === '보통' && '균형잡힌 루틴'}
                                            {cond === '최상(고강도)' && '고중량 프리웨이트 위주'}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Step 3: Exercise & Set Count */}
                    {step === 3 && (
                        <div className="space-y-6 animate-fade-in">
                            <div>
                                <h3 className="text-xl font-bold text-white mb-2">Step 3. 운동량 설정</h3>
                                <p className="text-sm text-slate-400">오늘 진행할 종목 수와 세트 수를 설정하세요.</p>
                            </div>
                            <div className="space-y-6 bg-slate-800/50 p-6 rounded-2xl border border-slate-700">
                                <div className="space-y-3">
                                    <label className="block text-sm font-bold text-slate-300">종목 수 (운동 수)</label>
                                    <div className="flex items-center gap-4">
                                        <input
                                            type="range"
                                            min="3"
                                            max="8"
                                            value={exerciseCount}
                                            onChange={(e) => setExerciseCount(parseInt(e.target.value))}
                                            className="w-full accent-indigo-500"
                                        />
                                        <span className="text-2xl font-black text-indigo-400 w-12 text-center">{exerciseCount}</span>
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <label className="block text-sm font-bold text-slate-300">운동당 세트 수</label>
                                    <div className="flex items-center gap-4">
                                        <input
                                            type="range"
                                            min="3"
                                            max="6"
                                            value={setCount}
                                            onChange={(e) => setSetCount(parseInt(e.target.value))}
                                            className="w-full accent-indigo-500"
                                        />
                                        <span className="text-2xl font-black text-indigo-400 w-12 text-center">{setCount}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Navigation Buttons */}
                    <div className="flex justify-between pt-6 border-t border-slate-800">
                        <button
                            onClick={handlePrev}
                            disabled={step === 1 || isGenerating}
                            className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold transition-all ${
                                step === 1
                                    ? 'opacity-0 pointer-events-none'
                                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                            }`}
                        >
                            <ArrowLeft className="w-5 h-5" /> 이전
                        </button>

                        {step < 3 ? (
                            <button
                                onClick={handleNext}
                                className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold transition-all shadow-lg shadow-indigo-500/20"
                            >
                                다음 <ArrowRight className="w-5 h-5" />
                            </button>
                        ) : (
                            <button
                                onClick={handleGenerate}
                                disabled={isGenerating}
                                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all shadow-lg ${
                                    isGenerating
                                        ? 'bg-indigo-800 text-white/70 cursor-not-allowed'
                                        : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-500/20'
                                }`}
                            >
                                {isGenerating ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        생성 중...
                                    </>
                                ) : (
                                    <>루틴 생성하기 <Wand2 className="w-5 h-5" /></>
                                )}
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* Step 4: Preview (After generation) */}
            {step === 4 && previewRoutine && (
                <div className="space-y-6 animate-fade-in">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-2xl font-black italic text-white uppercase">Today's Routine</h3>
                        <button 
                            onClick={() => setStep(1)}
                            className="text-sm font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                        >
                            <ArrowLeft className="w-4 h-4" /> 다시 설정하기
                        </button>
                    </div>
                    
                    <div className="grid gap-4">
                        {previewRoutine.sessions.map((session, idx) => (
                            <div key={idx} className="p-6 bg-slate-900 border-2 border-indigo-900/30 rounded-3xl flex flex-col justify-between gap-4 transition-all shadow-xl shadow-indigo-900/10">
                                <div>
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center">
                                            <Dumbbell className="w-6 h-6 text-indigo-400" />
                                        </div>
                                        <div>
                                            <h4 className="text-xl font-black text-white">{session.dayId}</h4>
                                            <p className="text-xs font-bold text-indigo-400">{session.target}</p>
                                        </div>
                                    </div>
                                    <div className="mt-4 space-y-2 bg-slate-950 p-4 rounded-2xl border border-slate-800">
                                        {(session.exercises || []).map((ex, exIdx) => (
                                            <div key={exIdx} className="flex justify-between items-center py-2 border-b border-slate-800/50 last:border-0">
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-bold text-slate-200">
                                                        {exIdx + 1}. {getLocalizedNameByKo(ex.name, i18n.language)}
                                                    </span>
                                                    <span className="text-[10px] text-slate-500 font-medium">
                                                        {ex.equipment && ex.equipment !== '맨몸' ? ex.equipment : '맨몸'}
                                                    </span>
                                                </div>
                                                <span className="text-xs font-black text-indigo-400 px-3 py-1 bg-indigo-500/10 rounded-full">
                                                    {ex.targetSets} Sets
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <button
                        onClick={handleSave}
                        className="w-full py-4 mt-4 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-xl text-lg transition-all active:scale-[0.98] shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2"
                    >
                        <Check className="w-6 h-6" /> 운동 시작하기
                    </button>
                </div>
            )}
        </div>
    );
};

export default AiWizard;
