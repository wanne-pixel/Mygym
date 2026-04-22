import React, { useState } from 'react';
import { supabase } from '../api/supabase';

const STEPS = {
    WELCOME: 1,
    GOAL: 2,
    LEVEL: 3,
    FREQUENCY: 4,
    AVAILABLE_TIME: 5,
    EQUIPMENT: 6,
    BODY_INFO: 7,
    LIMITATIONS: 8,
    FINISH: 9
};

const Onboarding = ({ onComplete }) => {
    const [step, setStep] = useState(STEPS.WELCOME);
    const [formData, setFormData] = useState({
        goals: [],
        experience_level: '',
        weekly_frequency: 3,
        available_time: '',
        equipment_access: '',
        height: '',
        weight: '',
        age: '',
        gender: '',
        limitations: []
    });

    const updateData = (fields) => setFormData(prev => ({ ...prev, ...fields }));
    const handleNext = () => setStep(prev => prev + 1);
    const handleBack = () => setStep(prev => prev - 1);

    const toggleGoal = (value) => {
        setFormData(prev => {
            const isSelected = prev.goals.includes(value);
            if (isSelected) return { ...prev, goals: prev.goals.filter(g => g !== value) };
            if (prev.goals.length >= 2) return prev;
            return { ...prev, goals: [...prev.goals, value] };
        });
    };

    const toggleLimitation = (limit) => {
        setFormData(prev => ({
            ...prev,
            limitations: prev.limitations.includes(limit)
                ? prev.limitations.filter(l => l !== limit)
                : [...prev.limitations, limit]
        }));
    };

    const handleFinish = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('로그인이 필요합니다.');

            const { error: profileError } = await supabase
                .from('user_profiles')
                .upsert([{
                    user_id: user.id,
                    goal: formData.goals[0] || '',
                    goals: formData.goals,
                    experience_level: formData.experience_level,
                    weekly_frequency: parseInt(formData.weekly_frequency),
                    available_time: formData.available_time || null,
                    equipment_access: formData.equipment_access,
                    height: formData.height ? parseInt(formData.height) : null,
                    weight: formData.weight ? parseFloat(formData.weight) : null,
                    age: formData.age ? parseInt(formData.age) : null,
                    gender: formData.gender || null,
                    limitations: formData.limitations
                }]);

            if (profileError) throw profileError;
            onComplete();
        } catch (error) {
            console.error('[Onboarding] 에러:', error);
            alert(`설정 실패: ${error.message}\n기본 화면으로 이동합니다.`);
            onComplete();
        }
    };

    const renderStep = () => {
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

            case STEPS.GOAL: {
                const goalOptions = [
                    { label: '근력 증가', subLabel: '더 무거운 무게를 들고 싶어요', value: 'strength', icon: '💪' },
                    { label: '근육 성장', subLabel: '멋진 몸을 만들고 싶어요', value: 'hypertrophy', icon: '🔥' },
                    { label: '체중 감량', subLabel: '지방을 태우고 싶어요', value: 'weight_loss', icon: '🏃' },
                    { label: '현상 유지', subLabel: '건강한 체력을 유지하고 싶어요', value: 'maintenance', icon: '🌿' },
                ];
                return (
                    <div className="animate-slide-up">
                        <h2 className="text-2xl font-black text-white italic mb-1">당신의 운동 목표는?</h2>
                        <p className="text-xs text-slate-500 font-bold mb-8 uppercase tracking-widest">(최대 2개까지 선택 가능)</p>
                        {goalOptions.map(opt => (
                            <button
                                key={opt.value}
                                onClick={() => toggleGoal(opt.value)}
                                className={`w-full p-5 mb-3 rounded-2xl border-2 text-left transition-all ${formData.goals.includes(opt.value) ? 'border-blue-500 bg-blue-500/10' : 'border-white/5 bg-slate-900/50 hover:border-slate-700'}`}
                            >
                                <div className="flex items-center gap-4">
                                    <span className="text-2xl">{opt.icon}</span>
                                    <div className="flex-1">
                                        <div className="font-black text-white">{opt.label}</div>
                                        <div className="text-xs text-slate-500 font-bold">{opt.subLabel}</div>
                                    </div>
                                    {formData.goals.includes(opt.value) && (
                                        <span className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center shrink-0">
                                            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"/></svg>
                                        </span>
                                    )}
                                </div>
                            </button>
                        ))}
                        <button
                            onClick={handleNext}
                            disabled={formData.goals.length === 0}
                            className="w-full py-5 mt-2 bg-blue-600 disabled:opacity-30 text-white font-black rounded-2xl italic active:scale-95 transition-all"
                        >
                            다음 단계
                        </button>
                    </div>
                );
            }

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

            case STEPS.AVAILABLE_TIME:
                return (
                    <div className="animate-slide-up">
                        <h2 className="text-2xl font-black text-white italic mb-8">주중 운동 가능 시간은 얼마나 되나요?</h2>
                        <CardOption label="30분 이하" subLabel="짧지만 집중적으로" value="30분 이하" targetField="available_time" icon="⚡" />
                        <CardOption label="30분~1시간" subLabel="적당한 여유로 알차게" value="30분~1시간" targetField="available_time" icon="🕐" />
                        <CardOption label="1시간~1.5시간" subLabel="충분한 볼륨 트레이닝" value="1시간~1.5시간" targetField="available_time" icon="🕑" />
                        <CardOption label="1.5시간 이상" subLabel="고강도 풀 루틴 가능" value="1.5시간 이상" targetField="available_time" icon="🏋️" />
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

            case STEPS.LIMITATIONS: {
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
            }

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
                            onClick={handleFinish}
                            className="w-full py-5 bg-blue-600 text-white font-black rounded-2xl italic text-lg shadow-xl shadow-blue-600/20 active:scale-95 transition-all uppercase tracking-tighter"
                        >
                            설정 완료
                        </button>
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <div className="fixed inset-0 z-[100] bg-slate-950 flex items-center justify-center p-6">
            <div className="w-full max-w-md">
                {step > STEPS.WELCOME && step < STEPS.FINISH && (
                    <div className="mb-12">
                        <div className="flex justify-between text-[10px] font-black text-slate-600 uppercase mb-2">
                            <span>Step {step - 1} / 7</span>
                            <span>{Math.round(((step - 1) / 7) * 100)}%</span>
                        </div>
                        <div className="h-1 bg-slate-900 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-blue-600 transition-all duration-500"
                                style={{ width: `${((step - 1) / 7) * 100}%` }}
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
