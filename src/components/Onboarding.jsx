import React, { useState, useEffect } from 'react';
import { supabase } from '../api/supabase';
import { saveWorkoutLogs } from '../api/workoutApi';
import { STORAGE_KEYS } from '../constants/exerciseConstants';
import EXERCISE_DATASET from '../data/exercises.json';

const STEPS = {
    WELCOME: 1,
    GOAL: 2,
    LEVEL: 3,
    FREQUENCY: 4,
    EQUIPMENT: 5,
    BODY_INFO: 6,
    LIMITATIONS: 7,
    FINISH: 8,
    GENERATING: 9
};

const Onboarding = ({ onComplete }) => {
    const [step, setStep] = useState(STEPS.WELCOME);
    const [isGenerating, setIsGenerating] = useState(false);
    const [loadingTimeout, setLoadingTimeout] = useState(false);
    const [formData, setFormData] = useState({
        goal: '',
        experience_level: '',
        weekly_frequency: 3,
        equipment_access: '',
        height: '',
        weight: '',
        age: '',
        gender: '',
        limitations: []
    });

    useEffect(() => {
        let timer;
        if (isGenerating) {
            timer = setTimeout(() => {
                setLoadingTimeout(true);
                console.log('[Onboarding] 30초 경과, 건너뛰기 옵션 활성화');
            }, 30000);
        }
        return () => clearTimeout(timer);
    }, [isGenerating]);

    const updateData = (fields) => setFormData(prev => ({ ...prev, ...fields }));

    const handleNext = () => setStep(prev => prev + 1);
    const handleBack = () => setStep(prev => prev - 1);

    const toggleLimitation = (limit) => {
        setFormData(prev => ({
            ...prev,
            limitations: prev.limitations.includes(limit)
                ? prev.limitations.filter(l => l !== limit)
                : [...prev.limitations, limit]
        }));
    };

    const generateInitialRoutine = async () => {
        setStep(STEPS.GENERATING);
        setIsGenerating(true);
        console.log('[Onboarding] 시작, formData:', formData);
        
        try {
            // 1단계: Supabase 프로필 저장
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('로그인이 필요합니다.');

            const { error: profileError } = await supabase
                .from('user_profiles')
                .upsert([{
                    user_id: user.id,
                    goal: formData.goal,
                    experience_level: formData.experience_level,
                    weekly_frequency: parseInt(formData.weekly_frequency),
                    equipment_access: formData.equipment_access,
                    height: formData.height ? parseInt(formData.height) : null,
                    weight: formData.weight ? parseFloat(formData.weight) : null,
                    age: formData.age ? parseInt(formData.age) : null,
                    gender: formData.gender || null,
                    limitations: formData.limitations
                }]);

            if (profileError) {
                console.error('[Onboarding] 프로필 저장 실패:', profileError);
                throw profileError;
            }

            // 2단계: AI 루틴 생성 (Timeout 설정)
            
            const fetchAIResponse = async () => {
                const prompt = `당신은 퍼스널 트레이너입니다. 다음 프로필을 분석해 첫 운동 루틴을 추천하세요.

사용자 정보:
- 목표: ${formData.goal}
- 경험: ${formData.experience_level}
- 주당 횟수: ${formData.weekly_frequency}회
- 기구: ${formData.equipment_access}
- 제한사항: ${formData.limitations.join(', ') || '없음'}

규칙:
1. 초보자는 전신 운동 3-4개, 기본 동작 위주.
2. 제한사항이 있다면 해당 관절에 무리가 가지 않는 대체 운동을 선택하세요.
3. 운동 이름은 반드시 한국어로 작성하세요.
4. 반드시 아래 JSON 형식으로만 답변하세요. 어떠한 인사말이나 마크다운(\`\`\`) 기호 없이 순수한 JSON 객체 형식으로만 대답하세요.

{
  "message": "환영 메시지 (2-3문장)",
  "routine": [
    {
      "name": "운동 이름",
      "part": "부위(가슴|등|하체|어깨|팔|허리/코어|유산소)",
      "sets": [
        {"kg": 10, "reps": 12, "isDropSet": false}
      ]
    }
  ]
}`;

                const { data, error } = await supabase.functions.invoke('ai-coach', {
                    body: { type: 'onboarding', prompt },
                });
                if (error) throw error;
                if (data.error) throw new Error(data.error);
                return JSON.parse(data.content);
            };

            // AI 호출에 25초 타임아웃 적용 (AbortController 대신 Promise.race 사용)
            const timeoutPromise = new Promise((_, reject) => 
                setTimeout(() => reject(new Error('AI 응답 지연 (Timeout)')), 25000)
            );

            let content;
            try {
                content = await Promise.race([fetchAIResponse(), timeoutPromise]);
                console.log('[Onboarding] Step 2 완료: AI 루틴 생성 성공:', content);
            } catch (aiError) {
                console.error('[Onboarding] AI 루틴 생성 지연 또는 실패:', aiError);
                content = {
                    message: "AI 분석이 지연되어 기본 루틴을 제공합니다. 프로필은 저장되었으니 AI 코치 탭에서 맞춤 추천을 받아보세요!",
                    routine: [
                        { name: "스쿼트", part: "하체", sets: [{ kg: 10, reps: 12, isDropSet: false }] },
                        { name: "푸시업", part: "가슴", sets: [{ kg: 0, reps: 10, isDropSet: false }] },
                        { name: "플랭크", part: "허리/코어", sets: [{ kg: 0, reps: 30, isDropSet: false }] }
                    ]
                };
            }
            
            // 3단계: localStorage 저장
            console.log('[Onboarding] Step 3: localStorage 저장 시작');
            const today = new Date().toISOString().split('T')[0];
            const routineData = content.routine.map(item => {
                const exMatch = EXERCISE_DATASET.find(e => e.name === item.name);
                return {
                    user_id: user.id,
                    exercise: item.name,
                    part: item.part,
                    type: (item.part === '유산소' || item.part === 'cardio') ? 'cardio' : 'strength',
                    sets_data: item.sets,
                    created_at: `${today}T12:00:00Z`
                };
            });

            const storageKey = `mygym_routine_${today}`;
            localStorage.setItem(storageKey, JSON.stringify(routineData.map((d, idx) => ({
                id: Date.now() + idx,
                name: d.exercise,
                body_part: d.part,
                sets: d.sets_data,
                completed: false
            }))));
            console.log('[Onboarding] Step 3 완료: localStorage 저장 성공');

            if (content.message) alert(content.message);
            onComplete();
        } catch (error) {
            console.error('[Onboarding] 최종 에러 발생:', error);
            alert(`온보딩 실패: ${error.message}\n기본 화면으로 이동합니다.`);
            onComplete();
        } finally {
            setIsGenerating(false);
        }
    };

    const renderStep = () => {
        const totalSteps = 7;
        const currentStepNum = step;

        const CardOption = ({ label, subLabel, value, targetField, icon }) => (
            <button
                onClick={() => { updateData({ [targetField]: value }); handleNext(); }}
                className={`w-full p-5 mb-3 rounded-2xl border-2 text-left transition-all ${formData[targetField] === value ? 'border-blue-500 bg-blue-500/10' : 'border-white/5 bg-slate-900/50 hover:border-slate-700'}`}
            >
                <div className="flex items-center gap-4">
                    {icon && <span className="text-2xl">{icon}</span>}
                    <div>
                        <div className="font-black text-white">{label}</div>
                        {subLabel && <div className="text-xs text-slate-500 font-bold">{subLabel}</div>}
                    </div>
                </div>
            </button>
        );

        switch (step) {
            case STEPS.WELCOME:
                return (
                    <div className="text-center animate-fade-in">
                        <div className="w-24 h-24 bg-blue-600 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-blue-600/20">
                            <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                        </div>
                        <h1 className="text-4xl font-black text-white italic tracking-tighter mb-4">WELCOME TO MYGYM</h1>
                        <p className="text-slate-400 font-bold leading-relaxed mb-12">몇 가지 질문으로 당신에게 딱 맞는<br/>최적의 운동 플랜을 설계해 드릴게요.</p>
                        <button onClick={handleNext} className="w-full py-5 bg-blue-600 text-white font-black rounded-2xl italic text-lg shadow-xl shadow-blue-600/20 active:scale-95 transition-all">시작하기</button>
                    </div>
                );

            case STEPS.GOAL:
                return (
                    <div className="animate-slide-up">
                        <h2 className="text-2xl font-black text-white italic mb-8">당신의 운동 목표는?</h2>
                        <CardOption label="근력 증가" subLabel="더 무거운 무게를 들고 싶어요" value="strength" targetField="goal" icon="💪" />
                        <CardOption label="근육 성장" subLabel="멋진 몸을 만들고 싶어요" value="hypertrophy" targetField="goal" icon="🔥" />
                        <CardOption label="체중 감량" subLabel="지방을 태우고 싶어요" value="weight_loss" targetField="goal" icon="🏃" />
                        <CardOption label="현상 유지" subLabel="건강한 체력을 유지하고 싶어요" value="maintenance" targetField="goal" icon="🌿" />
                    </div>
                );

            case STEPS.LEVEL:
                return (
                    <div className="animate-slide-up">
                        <h2 className="text-2xl font-black text-white italic mb-8">운동 경험이 어느 정도인가요?</h2>
                        <CardOption label="초보" subLabel="3개월 미만 (기초부터 차근차근)" value="beginner" targetField="experience_level" icon="🐣" />
                        <CardOption label="중급" subLabel="3개월 ~ 2년 (익숙한 동작 위주)" value="intermediate" targetField="experience_level" icon="🏋️" />
                        <CardOption label="고급" subLabel="2년 이상 (고강도 트레이닝)" value="advanced" targetField="experience_level" icon="🏆" />
                    </div>
                );

            case STEPS.FREQUENCY:
                return (
                    <div className="animate-slide-up">
                        <h2 className="text-2xl font-black text-white italic mb-8">일주일에 몇 번 운동하시나요?</h2>
                        <div className="grid grid-cols-3 gap-3 mb-8">
                            {[2, 3, 4, 5, 6, 7].map(num => (
                                <button
                                    key={num}
                                    onClick={() => updateData({ weekly_frequency: num })}
                                    className={`py-6 rounded-2xl font-black border-2 transition-all ${formData.weekly_frequency === num ? 'border-blue-500 bg-blue-500 text-white' : 'border-white/5 bg-slate-900/50 text-slate-500'}`}
                                >
                                    {num}회
                                </button>
                            ))}
                        </div>
                        <button onClick={handleNext} className="w-full py-5 bg-blue-600 text-white font-black rounded-2xl italic active:scale-95 transition-all">다음 단계</button>
                    </div>
                );

            case STEPS.EQUIPMENT:
                return (
                    <div className="animate-slide-up">
                        <h2 className="text-2xl font-black text-white italic mb-8">어떤 환경에서 운동하시나요?</h2>
                        <CardOption label="집 (맨몸)" subLabel="도구 없이 어디서든" value="home" targetField="equipment_access" icon="🏠" />
                        <CardOption label="홈짐 (덤벨/벤치)" subLabel="기본적인 장비 보유" value="home_gym" targetField="equipment_access" icon="📦" />
                        <CardOption label="헬스장" subLabel="모든 기구 사용 가능" value="full_gym" targetField="equipment_access" icon="🏢" />
                    </div>
                );

            case STEPS.BODY_INFO:
                return (
                    <div className="animate-slide-up">
                        <div className="flex justify-between items-center mb-8">
                            <h2 className="text-2xl font-black text-white italic">신체 정보 (선택)</h2>
                            <button onClick={handleNext} className="text-slate-500 font-bold text-sm">건너뛰기</button>
                        </div>
                        <div className="space-y-4 mb-8">
                            <div className="grid grid-cols-2 gap-4">
                                <input type="number" placeholder="키 (cm)" value={formData.height} onChange={e => updateData({ height: e.target.value })} className="w-full bg-slate-900 border border-white/5 rounded-2xl p-5 text-white font-bold outline-none focus:border-blue-500" />
                                <input type="number" placeholder="몸무게 (kg)" value={formData.weight} onChange={e => updateData({ weight: e.target.value })} className="w-full bg-slate-900 border border-white/5 rounded-2xl p-5 text-white font-bold outline-none focus:border-blue-500" />
                            </div>
                            <input type="number" placeholder="나이" value={formData.age} onChange={e => updateData({ age: e.target.value })} className="w-full bg-slate-900 border border-white/5 rounded-2xl p-5 text-white font-bold outline-none focus:border-blue-500" />
                            <div className="grid grid-cols-2 gap-4">
                                <button onClick={() => updateData({ gender: 'male' })} className={`py-4 rounded-2xl font-black border-2 ${formData.gender === 'male' ? 'border-blue-500 bg-blue-500/10 text-white' : 'border-white/5 bg-slate-900/50 text-slate-500'}`}>남성</button>
                                <button onClick={() => updateData({ gender: 'female' })} className={`py-4 rounded-2xl font-black border-2 ${formData.gender === 'female' ? 'border-blue-500 bg-blue-500/10 text-white' : 'border-white/5 bg-slate-900/50 text-slate-500'}`}>여성</button>
                            </div>
                        </div>
                        <button onClick={handleNext} className="w-full py-5 bg-blue-600 text-white font-black rounded-2xl italic active:scale-95 transition-all">다음 단계</button>
                    </div>
                );

            case STEPS.LIMITATIONS:
                const limits = [
                    { key: 'knee', label: '무릎', icon: '🦵' },
                    { key: 'back', label: '허리', icon: '🧘' },
                    { key: 'shoulder', label: '어깨', icon: '💪' },
                    { key: 'wrist', label: '손목', icon: '✋' }
                ];
                return (
                    <div className="animate-slide-up">
                        <div className="flex justify-between items-center mb-8">
                            <h2 className="text-2xl font-black text-white italic">부상/제한사항 (선택)</h2>
                            <button onClick={handleNext} className="text-slate-500 font-bold text-sm">건너뛰기</button>
                        </div>
                        <div className="grid grid-cols-2 gap-4 mb-12">
                            {limits.map(l => (
                                <button
                                    key={l.key}
                                    onClick={() => toggleLimitation(l.key)}
                                    className={`p-6 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all ${formData.limitations.includes(l.key) ? 'border-rose-500 bg-rose-500/10 text-white' : 'border-white/5 bg-slate-900/50 text-slate-500'}`}
                                >
                                    <span className="text-3xl">{l.icon}</span>
                                    <span className="font-black">{l.label}</span>
                                </button>
                            ))}
                        </div>
                        <button onClick={handleNext} className="w-full py-5 bg-blue-600 text-white font-black rounded-2xl italic shadow-2xl shadow-blue-600/20 active:scale-95 transition-all uppercase tracking-tighter">다음 단계</button>
                    </div>
                );

            case STEPS.FINISH:
                return (
                    <div className="text-center space-y-6 animate-fade-in">
                        <div className="w-24 h-24 bg-green-500 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-green-500/20">
                            <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="4"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                        </div>
                        <h2 className="text-3xl font-black text-white italic tracking-tighter uppercase">READY TO GO!</h2>
                        <p className="text-slate-400 font-bold leading-relaxed">
                            모든 준비가 완료되었습니다!<br/>
                            입력하신 정보는 달력 화면 우측 상단<br/>
                            '개인정보' 버튼에서 언제든 수정할 수 있습니다.
                        </p>
                        <button 
                            onClick={generateInitialRoutine} 
                            className="w-full py-5 bg-blue-600 text-white font-black rounded-2xl italic text-lg shadow-xl shadow-blue-600/20 active:scale-95 transition-all uppercase tracking-tighter"
                        >
                            분석 시작 및 플랜 생성
                        </button>
                    </div>
                );

            case STEPS.GENERATING:
                return (
                    <div className="text-center py-12 animate-fade-in">
                        <div className="w-20 h-20 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-8" />
                        <h2 className="text-2xl font-black text-white italic mb-4">당신만을 위한 첫 루틴 설계 중...</h2>
                        <p className="text-slate-500 font-bold mb-8">AI 코치가 최적의 운동을 선별하고 있습니다.</p>
                        
                        {loadingTimeout && (
                            <button 
                                onClick={onComplete}
                                className="px-6 py-3 bg-slate-800 text-slate-300 rounded-xl font-bold border border-white/5 hover:bg-slate-700 transition-all"
                            >
                                분석 생략하고 바로 시작하기
                            </button>
                        )}
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <div className="fixed inset-0 z-[100] bg-slate-950 flex items-center justify-center p-6">
            <div className="w-full max-w-md">
                {step > STEPS.WELCOME && step < STEPS.GENERATING && (
                    <div className="mb-12">
                        <div className="flex justify-between text-[10px] font-black text-slate-600 uppercase mb-2">
                            <span>Step {step - 1} / 6</span>
                            <span>{Math.round(((step - 1) / 6) * 100)}%</span>
                        </div>
                        <div className="h-1 bg-slate-900 rounded-full overflow-hidden">
                            <div 
                                className="h-full bg-blue-600 transition-all duration-500" 
                                style={{ width: `${((step - 1) / 6) * 100}%` }}
                            />
                        </div>
                        <button onClick={handleBack} className="mt-4 text-slate-500 hover:text-white transition-colors">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
                        </button>
                    </div>
                )}
                {renderStep()}
            </div>
        </div>
    );
};

export default Onboarding;
