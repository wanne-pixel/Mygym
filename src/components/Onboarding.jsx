import React, { useState } from 'react';
import OpenAI from 'openai';
import { supabase } from '../api/supabase';
import { saveWorkoutLogs } from '../api/workoutApi';
import { STORAGE_KEYS } from '../constants/exerciseConstants';

const openai = new OpenAI({
    apiKey: import.meta.env.VITE_OPENAI_API_KEY,
    dangerouslyAllowBrowser: true
});

const INTERVIEW_STEPS = [
    {
        id: 'goal',
        question: '당신의 운동 목표는 무엇인가요?',
        options: [
            { label: '벌크업', value: 'bulk-up', icon: '💪' },
            { label: '다이어트', value: 'diet', icon: '🔥' },
            { label: '건강 관리', value: 'health', icon: '🌿' }
        ]
    },
    {
        id: 'level',
        question: '현재 운동 숙련도는 어느 정도인가요?',
        options: [
            { label: '초보', value: 'beginner', icon: '🐣' },
            { label: '중급', value: 'intermediate', icon: '🏃' },
            { label: '고급', value: 'advanced', icon: '🏋️' }
        ]
    },
    {
        id: 'frequency',
        question: '일주일에 몇 번 운동하실 계획인가요?',
        options: [
            { label: '주 2회', value: '2', icon: '🗓️' },
            { label: '주 3-4회', value: '3-4', icon: '📅' },
            { label: '주 5회 이상', value: '5+', icon: '🔥' }
        ]
    },
    {
        id: 'time',
        question: '하루에 투자할 수 있는 시간은?',
        options: [
            { label: '30분', value: '30m', icon: '⏱️' },
            { label: '1시간', value: '1h', icon: '🕐' },
            { label: '1.5시간 이상', value: '1.5h+', icon: '⏳' }
        ]
    }
];

const Onboarding = ({ onComplete }) => {
    const [phase, setPhase] = useState(1); // 1: Interview, 2: Body Metrics, 3: Generating, 4: Briefing
    const [currentStep, setCurrentStep] = useState(0);
    const [answers, setAnswers] = useState({});
    const [bodyMetrics, setBodyMetrics] = useState({
        age: '', height: '', weight: '', gender: '',
        skeletal_muscle_mass: '', body_fat_mass: '', body_fat_percentage: '',
        bmr: '', visceral_fat_level: ''
    });
    const [planExplanation, setPlanExplanation] = useState('');

    const handleOptionSelect = (value) => {
        const newAnswers = { ...answers, [INTERVIEW_STEPS[currentStep].id]: value };
        setAnswers(newAnswers);
        
        if (currentStep < INTERVIEW_STEPS.length - 1) {
            setCurrentStep(currentStep + 1);
        } else {
            setPhase(2);
        }
    };

    const handleMetricChange = (field, value) => {
        setBodyMetrics(prev => ({ ...prev, [field]: value }));
    };

    const generateRoutine = async () => {
        setPhase(3);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('User not found');

            // Save body metrics to user metadata and localStorage
            const cleanedMetrics = Object.fromEntries(
                Object.entries(bodyMetrics).filter(([_, v]) => v !== '')
            );
            
            await supabase.auth.updateUser({
                data: { ...cleanedMetrics, ...answers }
            });
            localStorage.setItem(STORAGE_KEYS.USER_BODY_INFO, JSON.stringify(cleanedMetrics));

            const hasMetrics = Object.keys(cleanedMetrics).length > 0;
            const metricsContext = hasMetrics 
                ? `User Body Metrics: ${JSON.stringify(cleanedMetrics)}`
                : 'User did not provide body metrics (standard routine needed).';

            const prompt = `
            You are a professional PT coach. Generate a 1-week (7 days) workout routine and a brief explanation.
            
            User Profile:
            - Goal: ${answers.goal}
            - Level: ${answers.level}
            - Frequency: ${answers.frequency} times per week
            - Available Time: ${answers.time} per session
            ${metricsContext}

            Mode: ${hasMetrics ? 'ULTRA-PERSONALIZED (based on body metrics)' : 'STANDARD-PERSONALIZED'}

            Rules for Localization:
            - ALL exercise names ("exercise" field) MUST be in Korean only. (e.g., "벤치 프레스" instead of "Bench Press").
            - For EACH exercise, provide the English name in "nameEn" for GIF matching (e.g., "Barbell Bench Press").

            Rules for Beginner Optimization (if Level is 'beginner'):
            - DO NOT provide complex split routines. Use a Full-Body (무분할) routine for every active day.
            - Limit main workout to 3-4 CORE COMPOUND exercises (e.g., Squats, Lat Pulldowns, Push-ups).
            - EXCLUDE isolation exercises for small muscles like arms (biceps/triceps) or shoulders (lateral raises).
            - Include exactly 10-15 minutes of light cardio at the end of each session.

            General Requirements:
            1. Every session MUST follow this structure: [Dynamic Stretching (5 min) -> Main Workout -> Cardio & Static Stretching (5-15 min)].
            2. Volume adjustment:
               - If time is '30m': Limit main workout to 3-4 essential exercises.
               - If time is '1h': Include 5-6 exercises with standard sets.
               - If time is '1.5h+': Include 7-8 exercises with more sets and auxiliary movements.
            3. The frequency is ${answers.frequency} times per week. For other days, mark them as 'Rest Day'.
            4. Output MUST be a valid JSON object with two keys: "explanation" (string) and "routine" (array of objects).
            
            Explanation Requirement:
            - Write 3-4 lines in Korean explaining WHY this routine was designed based on the user's 4 inputs (Goal, Level, Frequency, Time). 
            - Use a professional yet friendly and encouraging tone (e.g., PT 코치 말투).

            JSON Structure for "routine" array elements:
            {
                "user_id": "${user.id}",
                "part": "가슴" | "등" | "하체" | "어깨" | "팔" | "코어" | "유산소",
                "type": "strength" | "cardio",
                "exercise": "운동 이름 (반드시 한국어)",
                "nameEn": "English Name of Exercise",
                "sets_count": number,
                "sets_data": [
                    { "weight": number, "reps": number } // For cardio/stretching, use { "duration": "10분 0초" }
                ],
                "is_completed": false,
                "created_at": "YYYY-MM-DDTHH:mm:ssZ" // Distribute across 7 days starting from today (${new Date().toISOString()})
            }

            ONLY output the JSON object. No conversational text.
            `;

            const response = await openai.chat.completions.create({
                model: 'gpt-4o-mini',
                messages: [{ role: 'system', content: 'You are a professional fitness planner.' }, { role: 'user', content: prompt }],
                response_format: { type: "json_object" }
            });

            const content = JSON.parse(response.choices[0].message.content);
            const routineData = content.routine || content.workouts || content.data;
            const explanation = content.explanation || '회원님의 목표와 성향에 맞춘 최적의 1주일 루틴이 생성되었습니다.';

            if (Array.isArray(routineData)) {
                await saveWorkoutLogs(routineData);
            }

            setPlanExplanation(explanation);
            setPhase(4);
        } catch (error) {
            console.error('Error generating routine:', error);
            alert('루틴 생성 중 오류가 발생했습니다. 다시 시도해 주세요.');
            setPhase(2);
        }
    };

    const finishOnboarding = () => {
        localStorage.setItem('isFirstUser', 'false');
        onComplete();
    };

    const renderInterview = () => {
        const step = INTERVIEW_STEPS[currentStep];
        return (
            <div className="space-y-8 animate-slide-up">
                <div className="space-y-2">
                    <span className="text-blue-500 font-black text-xs uppercase tracking-widest">Step {currentStep + 1}</span>
                    <h2 className="text-3xl font-black text-white italic tracking-tighter leading-tight">{step.question}</h2>
                </div>

                <div className="grid grid-cols-1 gap-3">
                    {step.options.map((option) => (
                        <button
                            key={option.value}
                            onClick={() => handleOptionSelect(option.value)}
                            className={`group flex items-center justify-between p-6 rounded-3xl border transition-all duration-300 ${answers[step.id] === option.value ? 'bg-blue-600 border-blue-400 shadow-xl shadow-blue-600/20' : 'bg-slate-900 border-slate-800 hover:border-slate-600'}`}
                        >
                            <div className="flex items-center gap-4">
                                <span className="text-3xl">{option.icon}</span>
                                <span className={`text-lg font-bold ${answers[step.id] === option.value ? 'text-white' : 'text-slate-300 group-hover:text-white'}`}>{option.label}</span>
                            </div>
                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${answers[step.id] === option.value ? 'bg-white border-white' : 'border-slate-700'}`}>
                                {answers[step.id] === option.value && <div className="w-2 h-2 bg-blue-600 rounded-full" />}
                            </div>
                        </button>
                    ))}
                </div>

                {currentStep > 0 && (
                    <button 
                        onClick={() => setCurrentStep(currentStep - 1)}
                        className="w-full py-4 text-slate-500 font-bold hover:text-white transition-colors"
                    >
                        이전 단계로
                    </button>
                )}
            </div>
        );
    };

    const renderBodyMetrics = () => {
        return (
            <div className="space-y-8 animate-slide-up max-h-[80vh] overflow-y-auto pr-2 custom-scrollbar">
                <div className="space-y-4">
                    <div className="bg-blue-600/10 border border-blue-500/20 p-4 rounded-2xl">
                        <p className="text-blue-400 text-xs font-bold leading-relaxed">
                            💡 내 정보 입력은 선택 사항이며, 입력하신 데이터는 더 정교한 AI 코칭에 활용됩니다. 
                            입력하신 정보는 추후 [설정] 메뉴에서 언제든지 변경하실 수 있습니다.
                        </p>
                    </div>
                    <h2 className="text-3xl font-black text-white italic tracking-tighter leading-tight">신체 정보를 알려주세요</h2>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-500 uppercase ml-1">나이</label>
                        <input type="number" value={bodyMetrics.age} onChange={e => handleMetricChange('age', e.target.value)} className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-4 text-white focus:ring-2 focus:ring-blue-500 outline-none font-bold" placeholder="세" />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-500 uppercase ml-1">성별</label>
                        <select value={bodyMetrics.gender} onChange={e => handleMetricChange('gender', e.target.value)} className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-4 text-white focus:ring-2 focus:ring-blue-500 outline-none font-bold">
                            <option value="">선택</option>
                            <option value="male">남성</option>
                            <option value="female">여성</option>
                        </select>
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-500 uppercase ml-1">키 (cm)</label>
                        <input type="number" value={bodyMetrics.height} onChange={e => handleMetricChange('height', e.target.value)} className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-4 text-white focus:ring-2 focus:ring-blue-500 outline-none font-bold" placeholder="cm" />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-500 uppercase ml-1">몸무게 (kg)</label>
                        <input type="number" value={bodyMetrics.weight} onChange={e => handleMetricChange('weight', e.target.value)} className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-4 text-white focus:ring-2 focus:ring-blue-500 outline-none font-bold" placeholder="kg" />
                    </div>
                </div>

                <div className="pt-4 border-t border-slate-800 space-y-4">
                    <label className="text-xs font-black text-blue-400 uppercase tracking-widest block">인바디 정보 (선택)</label>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-500 uppercase ml-1">골격근량 (kg)</label>
                            <input type="number" value={bodyMetrics.skeletal_muscle_mass} onChange={e => handleMetricChange('skeletal_muscle_mass', e.target.value)} className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-4 text-white focus:ring-2 focus:ring-blue-500 outline-none font-bold" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-500 uppercase ml-1">체지방량 (kg)</label>
                            <input type="number" value={bodyMetrics.body_fat_mass} onChange={e => handleMetricChange('body_fat_mass', e.target.value)} className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-4 text-white focus:ring-2 focus:ring-blue-500 outline-none font-bold" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-500 uppercase ml-1">체지방률 (%)</label>
                            <input type="number" value={bodyMetrics.body_fat_percentage} onChange={e => handleMetricChange('body_fat_percentage', e.target.value)} className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-4 text-white focus:ring-2 focus:ring-blue-500 outline-none font-bold" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-500 uppercase ml-1">기초대사량</label>
                            <input type="number" value={bodyMetrics.bmr} onChange={e => handleMetricChange('bmr', e.target.value)} className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-4 text-white focus:ring-2 focus:ring-blue-500 outline-none font-bold" />
                        </div>
                        <div className="col-span-2 space-y-1">
                            <label className="text-[10px] font-black text-slate-500 uppercase ml-1">내장지방레벨</label>
                            <input type="number" value={bodyMetrics.visceral_fat_level} onChange={e => handleMetricChange('visceral_fat_level', e.target.value)} className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-4 text-white focus:ring-2 focus:ring-blue-500 outline-none font-bold" />
                        </div>
                    </div>
                </div>

                <div className="pt-6 space-y-3">
                    <button
                        onClick={generateRoutine}
                        className="w-full py-5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black rounded-3xl shadow-2xl shadow-blue-600/30 active:scale-95 transition-all text-xl italic tracking-tighter uppercase"
                    >
                        나만의 맞춤 루틴 생성하기
                    </button>
                    <button 
                        onClick={() => setPhase(1)}
                        className="w-full py-4 text-slate-500 font-bold hover:text-white transition-colors"
                    >
                        이전 단계로
                    </button>
                </div>
            </div>
        );
    };

    const renderGenerating = () => (
        <div className="text-center space-y-6 animate-pulse">
            <div className="w-20 h-20 bg-blue-600/20 rounded-3xl flex items-center justify-center mx-auto border border-blue-500/30">
                <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
            <h2 className="text-2xl font-black italic text-white tracking-tighter">AI가 당신만을 위한<br />1주일 루틴을 설계하고 있습니다...</h2>
            <p className="text-slate-500 font-medium">잠시만 기다려 주세요.</p>
        </div>
    );

    const renderBriefing = () => (
        <div className="space-y-8 animate-slide-up text-center">
            <div className="space-y-4">
                <div className="w-20 h-20 bg-blue-600 rounded-3xl flex items-center justify-center mx-auto shadow-2xl shadow-blue-600/40">
                    <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </div>
                <h2 className="text-3xl font-black text-white italic tracking-tighter uppercase leading-tight">분석이 완료되었습니다!</h2>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-8 rounded-[2rem] relative group">
                <div className="absolute -top-3 left-8 px-3 py-1 bg-blue-600 rounded-full text-[10px] font-black text-white uppercase tracking-widest">AI PT Briefing</div>
                <p className="text-slate-300 font-bold leading-relaxed text-lg break-keep italic">
                    "{planExplanation}"
                </p>
            </div>

            <div className="pt-4 space-y-4">
                <button
                    onClick={finishOnboarding}
                    className="w-full py-5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black rounded-3xl shadow-2xl shadow-blue-600/30 active:scale-95 transition-all text-xl italic tracking-tighter uppercase"
                >
                    내 운동 스케줄 확인하기
                </button>
                <p className="text-slate-500 text-xs font-bold">이제부터 당신의 성장을 함께하겠습니다.</p>
            </div>
        </div>
    );

    return (
        <div className="fixed inset-0 z-[200] bg-slate-950 flex items-center justify-center p-6 animate-fade-in overflow-hidden">
            <div className="w-full max-w-md relative">
                {/* Progress Bar */}
                {phase < 3 && (
                    <div className="flex gap-2 mb-12">
                        {[...Array(5)].map((_, idx) => (
                            <div 
                                key={idx} 
                                className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${
                                    (phase === 1 && idx <= currentStep) || (phase === 2 && idx <= 4) ? 'bg-blue-600' : 'bg-slate-800'
                                }`}
                            />
                        ))}
                    </div>
                )}

                {phase === 1 && renderInterview()}
                {phase === 2 && renderBodyMetrics()}
                {phase === 3 && renderGenerating()}
                {phase === 4 && renderBriefing()}
            </div>
        </div>
    );
};

export default Onboarding;
