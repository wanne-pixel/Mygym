import React, { useState } from 'react';
import OpenAI from 'openai';
import { supabase } from '../api/supabase';
import { saveWorkoutLogs } from '../api/workoutApi';

const openai = new OpenAI({
    apiKey: import.meta.env.VITE_OPENAI_API_KEY,
    dangerouslyAllowBrowser: true
});

const STEPS = [
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
            { label: '1시간', block: true, value: '1h', icon: '🕐' },
            { label: '1.5시간 이상', value: '1.5h+', icon: '⏳' }
        ]
    }
];

const WelcomeInterview = ({ onComplete }) => {
    const [currentStep, setCurrentStep] = useState(0);
    const [answers, setAnswers] = useState({});
    const [isGenerating, setIsGenerating] = useState(false);

    const handleOptionSelect = (value) => {
        const newAnswers = { ...answers, [STEPS[currentStep].id]: value };
        setAnswers(newAnswers);
        
        if (currentStep < STEPS.length - 1) {
            setCurrentStep(currentStep + 1);
        }
    };

    const generateRoutine = async () => {
        setIsGenerating(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('User not found');

            const prompt = `
            You are a professional PT coach. Generate a 1-week (7 days) workout routine for a user with the following profile:
            - Goal: ${answers.goal}
            - Level: ${answers.level}
            - Frequency: ${answers.frequency} times per week
            - Available Time: ${answers.time} per session

            Requirements:
            1. Every session MUST follow this structure: [Dynamic Stretching (5 min) -> Main Workout -> Cardio & Static Stretching (5-10 min)].
            2. Volume adjustment:
               - If time is '30m': Limit main workout to 3-4 essential compound exercises.
               - If time is '1h': Include 5-6 exercises with standard sets.
               - If time is '1.5h+': Include 7-8 exercises with more sets and auxiliary movements.
            3. The frequency is ${answers.frequency} times per week. For other days, mark them as 'Rest Day'.
            4. Output MUST be a valid JSON array of objects, where each object represents a single exercise record.
            
            JSON Structure for each exercise object:
            {
                "user_id": "${user.id}",
                "part": "chest" | "back_part" | "legs" | "shoulders" | "arms" | "abs" | "cardio" | "stretching",
                "type": "기구" | "프리웨이트" | "맨몸" | "유산소" | "스트레칭",
                "exercise": "Exercise Name",
                "sets_count": number,
                "sets_data": [
                    { "weight": number, "reps": number } // For cardio/stretching, use { "duration": "5분 0초" }
                ],
                "is_completed": false,
                "created_at": "YYYY-MM-DDTHH:mm:ssZ" // Distribute across 7 days starting from today (${new Date().toISOString()})
            }

            Ensure 'created_at' corresponds to the correct day of the week.
            ONLY output the JSON array. No conversational text.
            `;

            const response = await openai.chat.completions.create({
                model: 'gpt-4o-mini',
                messages: [{ role: 'system', content: 'You are a professional fitness planner.' }, { role: 'user', content: prompt }],
                response_format: { type: "json_object" }
            });

            const content = JSON.parse(response.choices[0].message.content);
            const routineData = content.routine || content.workouts || content.data || (Array.isArray(content) ? content : Object.values(content)[0]);

            if (Array.isArray(routineData)) {
                await saveWorkoutLogs(routineData);
            }

            localStorage.setItem('isFirstUser', 'false');
            onComplete();
        } catch (error) {
            console.error('Error generating routine:', error);
            alert('루틴 생성 중 오류가 발생했습니다. 다시 시도해 주세요.');
        } finally {
            setIsGenerating(false);
        }
    };

    const step = STEPS[currentStep];

    return (
        <div className="fixed inset-0 z-[200] bg-slate-950 flex items-center justify-center p-6 animate-fade-in">
            <div className="w-full max-w-md">
                {/* Progress Bar */}
                <div className="flex gap-2 mb-12">
                    {STEPS.map((_, idx) => (
                        <div 
                            key={idx} 
                            className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${idx <= currentStep ? 'bg-blue-600' : 'bg-slate-800'}`}
                        />
                    ))}
                </div>

                {isGenerating ? (
                    <div className="text-center space-y-6 animate-pulse">
                        <div className="w-20 h-20 bg-blue-600/20 rounded-3xl flex items-center justify-center mx-auto border border-blue-500/30">
                            <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                        </div>
                        <h2 className="text-2xl font-black italic text-white tracking-tighter">AI가 당신만을 위한<br />1주일 루틴을 설계하고 있습니다...</h2>
                        <p className="text-slate-500 font-medium">잠시만 기다려 주세요.</p>
                    </div>
                ) : (
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

                        {currentStep === STEPS.length - 1 && answers[step.id] && (
                            <button
                                onClick={generateRoutine}
                                className="w-full py-5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black rounded-3xl shadow-2xl shadow-blue-600/30 active:scale-95 transition-all text-xl italic tracking-tighter uppercase mt-8 animate-bounce-subtle"
                            >
                                나만의 맞춤 루틴 생성하기
                            </button>
                        )}

                        {currentStep > 0 && (
                            <button 
                                onClick={() => setCurrentStep(currentStep - 1)}
                                className="w-full py-4 text-slate-500 font-bold hover:text-white transition-colors"
                            >
                                이전 단계로
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default WelcomeInterview;
