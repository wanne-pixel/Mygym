import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Dumbbell } from 'lucide-react';
import { generateAiRoutine } from '../../api/aiRoutineApi';
import { getGlobalExerciseCache, getLocalizedNameByKo, setGlobalExerciseCache } from '../../utils/exerciseUtils';
import { fetchAllExercises } from '../../api/exerciseApi';
import { toast } from 'sonner';
import { useWindowSize } from '../../hooks/useWindowSize';

const AiWizard = ({ onSave, personalRecords, workoutPreferences, user }) => {
    const { t, i18n } = useTranslation();
    const { isMobile } = useWindowSize();
    
    const [isGenerating, setIsGenerating] = useState(false);
    const [isLoadingExercises, setIsLoadingExercises] = useState(false);
    const [previewRoutine, setPreviewRoutine] = useState(null);

    // Handle exercises pre-fetching on mount
    useEffect(() => {
        const loadExercises = async () => {
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
        };
        loadExercises();
    }, []);

    const handleGenerate = async () => {
        setIsGenerating(true);
        try {
            const availableExercises = getGlobalExerciseCache();
            if (!availableExercises || availableExercises.length === 0) {
                throw new Error('사용 가능한 운동 데이터가 없습니다. 새로고침 후 다시 시도해보세요.');
            }

            const result = await generateAiRoutine({
                daysCount: workoutPreferences?.days_per_week || 4,
                availableExercises,
                personalRecords,
                workoutPreferences
            });
            setPreviewRoutine(result);
        } catch (error) {
            console.error(error);
            toast.error(error.message || 'Error generating AI routine');
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
        <div className={`${isMobile ? 'p-4' : 'p-8 max-w-4xl mx-auto'} bg-slate-950 min-h-screen pb-24 text-white animate-fade-in`}>
            <h2 className="text-3xl font-black italic text-white uppercase underline decoration-blue-500 decoration-4 underline-offset-8 mb-8 flex items-center justify-center gap-3">
                <Dumbbell className="text-blue-500 w-8 h-8" />
                운동
            </h2>

            <div className="bg-slate-900/50 p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-800 space-y-6">
                <div className="bg-indigo-950/20 border border-indigo-900/50 rounded-2xl p-4 space-y-2">
                    <p className="text-xs font-black text-indigo-400 uppercase tracking-widest">💡 AI Smart Engine Guideline</p>
                    <p className="text-sm text-slate-400 font-medium leading-relaxed">
                        AI가 설정된 4일(가슴, 등, 하체, 어깨) 세션에 맞춰 **분할 방식, 하루 종목 6개 구성, 선호 장비(바벨/덤벨/머신), 선피로 훈련 기법** 등을 매주 다양하게 조합하여 최적의 루틴을 설계합니다. 큰 부위는 같은 날 겹치지 않게 스마트하게 배정됩니다.
                    </p>
                </div>

                <button
                    onClick={handleGenerate}
                    disabled={isGenerating}
                    className={`w-full py-4 rounded-xl font-black italic text-lg transition-all active:scale-[0.98] flex items-center justify-center gap-3 shadow-2xl ${
                        isGenerating ? 'bg-indigo-600 opacity-70 cursor-not-allowed text-white' : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30'
                    }`}
                >
                    {isGenerating ? (
                        <>
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            <span>Generating Routine...</span>
                        </>
                    ) : (
                        <span>AI 루틴생성</span>
                    )}
                </button>
            </div>

            {previewRoutine && (
                <div className="mt-8 space-y-6">
                    <h3 className="text-2xl font-black italic text-white uppercase">Preview</h3>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {previewRoutine.sessions.map((session, idx) => (
                            <div key={idx} className="p-5 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col justify-between gap-4 transition-all">
                                <div>
                                    <h4 className="text-lg font-black text-white italic">{session.dayId}</h4>
                                    <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mt-1">
                                        Target: {session.target}
                                    </p>
                                    <div className="mt-3 space-y-1">
                                        {(session.exercises || []).map((ex, exIdx) => (
                                            <p key={exIdx} className="text-xs text-slate-400 font-bold truncate">
                                                • {getLocalizedNameByKo(ex.name, i18n.language)}{ex.equipment && ex.equipment !== '맨몸' ? `(${ex.equipment})` : ''} ({ex.targetSets} sets)
                                            </p>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <button
                        onClick={handleSave}
                        className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-xl italic tracking-wide transition-all active:scale-[0.98] shadow-lg shadow-blue-600/30"
                    >
                        Save & Start Routine
                    </button>
                </div>
            )}
        </div>
    );
};

export default AiWizard;
