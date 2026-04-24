import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
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
    const { t } = useTranslation();
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
            if (!user) throw new Error(t('common.loginRequired'));

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
            toast.error(`${t('onboarding.setupFailed')}: ${error.message}\n${t('onboarding.goHome')}`);
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
                        <h1 className="text-4xl font-black text-white italic tracking-tighter mb-4">{t('onboarding.welcome')}</h1>
                        <p className="text-slate-400 font-bold leading-relaxed mb-12">{t('onboarding.subtitle')}</p>
                        <button onClick={handleNext} className="w-full py-5 bg-blue-600 text-white font-black rounded-2xl italic text-lg shadow-xl shadow-blue-600/20 active:scale-95 transition-all">{t('onboarding.start')}</button>
                    </div>
                );

            case STEPS.GOAL: {
                const goalOptions = [
                    { label: t('onboarding.goal.strength'), subLabel: t('onboarding.goal.strengthDesc'), value: 'strength', icon: '💪' },
                    { label: t('onboarding.goal.hypertrophy'), subLabel: t('onboarding.goal.hypertrophyDesc'), value: 'hypertrophy', icon: '🔥' },
                    { label: t('onboarding.goal.weightLoss'), subLabel: t('onboarding.goal.weightLossDesc'), value: 'weight_loss', icon: '🏃' },
                    { label: t('onboarding.goal.maintenance'), subLabel: t('onboarding.goal.maintenanceDesc'), value: 'maintenance', icon: '🌿' },
                ];
                return (
                    <div className="animate-slide-up">
                        <h2 className="text-2xl font-black text-white italic mb-1">{t('onboarding.goal.title')}</h2>
                        <p className="text-xs text-slate-500 font-bold mb-8 uppercase tracking-widest">{t('onboarding.goal.maxSelect')}</p>
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
                            {t('common.next')}
                        </button>
                    </div>
                );
            }

            case STEPS.LEVEL:
                return (
                    <div className="animate-slide-up">
                        <h2 className="text-2xl font-black text-white italic mb-8">{t('onboarding.level.title')}</h2>
                        <CardOption label={t('onboarding.level.beginner')} subLabel={t('onboarding.level.beginnerDesc')} value="beginner" targetField="experience_level" icon="🐣" />
                        <CardOption label={t('onboarding.level.intermediate')} subLabel={t('onboarding.level.intermediateDesc')} value="intermediate" targetField="experience_level" icon="🏋️" />
                        <CardOption label={t('onboarding.level.advanced')} subLabel={t('onboarding.level.advancedDesc')} value="advanced" targetField="experience_level" icon="🏆" />
                    </div>
                );

            case STEPS.FREQUENCY:
                return (
                    <div className="animate-slide-up">
                        <h2 className="text-2xl font-black text-white italic mb-8">{t('onboarding.frequency.title')}</h2>
                        <div className="grid grid-cols-3 gap-3 mb-8">
                            {[2, 3, 4, 5, 6, 7].map(num => (
                                <button
                                    key={num}
                                    onClick={() => updateData({ weekly_frequency: num })}
                                    className={`py-6 rounded-2xl font-black border-2 transition-all ${formData.weekly_frequency === num ? 'border-blue-500 bg-blue-500 text-white' : 'border-white/5 bg-slate-900/50 text-slate-500'}`}
                                >
                                    {num}{t('onboarding.frequency.unit')}
                                </button>
                            ))}
                        </div>
                        <button onClick={handleNext} className="w-full py-5 bg-blue-600 text-white font-black rounded-2xl italic active:scale-95 transition-all">{t('common.next')}</button>
                    </div>
                );

            case STEPS.AVAILABLE_TIME:
                return (
                    <div className="animate-slide-up">
                        <h2 className="text-2xl font-black text-white italic mb-8">{t('onboarding.availableTime.title')}</h2>
                        <CardOption label={t('onboarding.availableTime.under30')} subLabel={t('onboarding.availableTime.under30Desc')} value="30분 이하" targetField="available_time" icon="⚡" />
                        <CardOption label={t('onboarding.availableTime.30to60')} subLabel={t('onboarding.availableTime.30to60Desc')} value="30분~1시간" targetField="available_time" icon="🕐" />
                        <CardOption label={t('onboarding.availableTime.60to90')} subLabel={t('onboarding.availableTime.60to90Desc')} value="1시간~1.5시간" targetField="available_time" icon="🕑" />
                        <CardOption label={t('onboarding.availableTime.over90')} subLabel={t('onboarding.availableTime.over90Desc')} value="1.5시간 이상" targetField="available_time" icon="🏋️" />
                    </div>
                );

            case STEPS.EQUIPMENT:
                return (
                    <div className="animate-slide-up">
                        <h2 className="text-2xl font-black text-white italic mb-8">{t('onboarding.equipment.title')}</h2>
                        <CardOption label={t('onboarding.equipment.bodyweight')} subLabel={t('onboarding.equipment.bodyweightDesc')} value="home" targetField="equipment_access" icon="🏠" />
                        <CardOption label={t('onboarding.equipment.homeGym')} subLabel={t('onboarding.equipment.homeGymDesc')} value="home_gym" targetField="equipment_access" icon="📦" />
                        <CardOption label={t('onboarding.equipment.gym')} subLabel={t('onboarding.equipment.gymDesc')} value="full_gym" targetField="equipment_access" icon="🏢" />
                    </div>
                );

            case STEPS.BODY_INFO:
                return (
                    <div className="animate-slide-up">
                        <div className="flex justify-between items-center mb-8">
                            <h2 className="text-2xl font-black text-white italic">{t('onboarding.bodyInfo.title')}</h2>
                            <button onClick={handleNext} className="text-slate-500 font-bold text-sm">{t('common.skip')}</button>
                        </div>
                        <div className="space-y-4 mb-8">
                            <div className="grid grid-cols-2 gap-4">
                                <input type="number" placeholder={t('onboarding.bodyInfo.height')} value={formData.height} onChange={e => updateData({ height: e.target.value })} className="w-full bg-slate-900 border border-white/5 rounded-2xl p-5 text-white font-bold outline-none focus:border-blue-500" />
                                <input type="number" placeholder={t('onboarding.bodyInfo.weight')} value={formData.weight} onChange={e => updateData({ weight: e.target.value })} className="w-full bg-slate-900 border border-white/5 rounded-2xl p-5 text-white font-bold outline-none focus:border-blue-500" />
                            </div>
                            <input type="number" placeholder={t('onboarding.bodyInfo.age')} value={formData.age} onChange={e => updateData({ age: e.target.value })} className="w-full bg-slate-900 border border-white/5 rounded-2xl p-5 text-white font-bold outline-none focus:border-blue-500" />
                            <div className="grid grid-cols-2 gap-4">
                                <button onClick={() => updateData({ gender: 'male' })} className={`py-4 rounded-2xl font-black border-2 ${formData.gender === 'male' ? 'border-blue-500 bg-blue-500/10 text-white' : 'border-white/5 bg-slate-900/50 text-slate-500'}`}>{t('common.male')}</button>
                                <button onClick={() => updateData({ gender: 'female' })} className={`py-4 rounded-2xl font-black border-2 ${formData.gender === 'female' ? 'border-blue-500 bg-blue-500/10 text-white' : 'border-white/5 bg-slate-900/50 text-slate-500'}`}>{t('common.female')}</button>
                            </div>
                        </div>
                        <button onClick={handleNext} className="w-full py-5 bg-blue-600 text-white font-black rounded-2xl italic active:scale-95 transition-all">{t('common.next')}</button>
                    </div>
                );

            case STEPS.LIMITATIONS: {
                const limits = [
                    { key: 'knee', label: t('onboarding.limitations.knee'), icon: '🦵' },
                    { key: 'back', label: t('onboarding.limitations.lowerBack'), icon: '🧘' },
                    { key: 'shoulder', label: t('onboarding.limitations.shoulder'), icon: '💪' },
                    { key: 'wrist', label: t('onboarding.limitations.wrist'), icon: '✋' }
                ];
                return (
                    <div className="animate-slide-up">
                        <div className="flex justify-between items-center mb-8">
                            <h2 className="text-2xl font-black text-white italic">{t('onboarding.limitations.title')}</h2>
                            <button onClick={handleNext} className="text-slate-500 font-bold text-sm">{t('common.skip')}</button>
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
                        <button onClick={handleNext} className="w-full py-5 bg-blue-600 text-white font-black rounded-2xl italic shadow-2xl shadow-blue-600/20 active:scale-95 transition-all uppercase tracking-tighter">{t('common.next')}</button>
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
                            {t('onboarding.allReady')}<br/>
                            {t('onboarding.editNote')}
                        </p>
                        <button
                            onClick={handleFinish}
                            className="w-full py-5 bg-blue-600 text-white font-black rounded-2xl italic text-lg shadow-xl shadow-blue-600/20 active:scale-95 transition-all uppercase tracking-tighter"
                        >
                            {t('onboarding.complete')}
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
