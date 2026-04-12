import React, { useState, useMemo, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, Link, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import './i18n';
import { CUSTOM_EXERCISES } from './src/data/customExercises';
import ApiViewer from './src/components/ApiViewer';
import { supabase } from './src/api/supabase';

console.log("MyGym App Initializing with Custom Exercise Data...");

/**
 * [Common: Exercise Detail Modal]
 */
const ExerciseModal = ({ exercise, onClose }) => {
    const { t } = useTranslation();
    if (!exercise) return null;
    
    const data = {
        name: exercise.name,
        target: exercise.target,
        equipment: exercise.equipment,
        image: exercise.imageUrl || exercise.image
    };

    const handleImgError = (e) => {
        e.target.onerror = null;
        e.target.src = 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=400&h=300&fit=crop';
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-fade-in">
            <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md" onClick={onClose}></div>
            <div className="relative bg-slate-900 border border-white/10 w-full max-w-lg rounded-[2.5rem] overflow-hidden shadow-2xl animate-scale-up">
                <button 
                    onClick={onClose}
                    className="absolute top-6 right-6 z-20 p-2.5 bg-slate-950/50 hover:bg-slate-950 text-white rounded-full transition-all hover:rotate-90"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
                
                <div className="relative h-72">
                    <img 
                        src={data.image} 
                        alt={data.name} 
                        className="w-full h-full object-cover" 
                        referrerPolicy="no-referrer"
                        onError={handleImgError}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent"></div>
                </div>
                
                <div className="p-8 -mt-12 relative z-10">
                    <div className="mb-8">
                        <div className="flex gap-2 mb-3">
                            <span className="bg-blue-500/20 text-blue-400 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest border border-blue-500/20">
                                {data.target}
                            </span>
                            <span className="bg-slate-800 text-slate-400 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest border border-slate-700">
                                {data.equipment}
                            </span>
                        </div>
                        <h3 className="text-4xl font-black text-white italic tracking-tighter mb-2 uppercase">{data.name}</h3>
                    </div>
                </div>
            </div>
        </div>
    );
};

/**
 * [Common: Exercise Selector]
 */
const ExerciseSelector = ({ selection, setSelection, onExerciseSelect }) => {
    const { t } = useTranslation();
    const [modalExercise, setModalExercise] = useState(null);

    const parts = [
        { key: 'chest', label: t('chest') },
        { key: 'back_part', label: t('back_part') },
        { key: 'legs', label: t('legs') },
        { key: 'shoulders', label: t('shoulders') },
        { key: 'arms', label: t('arms') }
    ];

    const handlePartClick = (p) => {
        setSelection({ part: p, type: '', exercise: '' });
    };

    const handleTypeClick = (tKey) => {
        setSelection({ ...selection, type: tKey, exercise: '' });
    };

    const handleExerciseClick = (exName) => {
        setSelection({ ...selection, exercise: exName });
        if (onExerciseSelect) onExerciseSelect(exName);
    };

    const filteredExercises = useMemo(() => {
        if (!selection.part || !selection.type) return [];
        return CUSTOM_EXERCISES.filter(ex => ex.part === selection.part && ex.type === selection.type);
    }, [selection.part, selection.type]);

    return (
        <div className="space-y-8">
            <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4 block px-1">{t('step1_select_part')}</label>
                <div className="grid grid-cols-3 gap-2">
                    {parts.map(p => (
                        <button 
                            key={p.key} 
                            onClick={() => handlePartClick(p.key)} 
                            className={`py-4 rounded-2xl font-black text-xs tracking-tighter transition-all duration-300 ${selection.part === p.key ? 'bg-blue-600 text-white shadow-xl shadow-blue-600/30 ring-2 ring-blue-400/50' : 'bg-slate-800/50 text-slate-400 hover:bg-slate-800 hover:text-slate-200 border border-slate-700/50'}`}
                        >
                            {p.label.toUpperCase()}
                        </button>
                    ))}
                </div>
            </div>

            {selection.part && (
                <div className="animate-fade-in">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4 block px-1">{t('step2_select_type')}</label>
                    <div className="flex gap-2">
                        {[
                            { key: 'free_weights', label: t('free_weights') },
                            { key: 'machine', label: t('machine') },
                            { key: 'cable', label: t('cable') }
                        ].map(type => (
                            <button 
                                key={type.key} 
                                onClick={() => handleTypeClick(type.key)} 
                                className={`flex-1 py-4 rounded-2xl font-black text-xs tracking-tighter transition-all duration-300 ${selection.type === type.key ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/30 ring-2 ring-indigo-400/50' : 'bg-slate-800/50 text-slate-400 hover:bg-slate-800 hover:text-slate-200 border border-slate-700/50'}`}
                            >
                                {type.label.toUpperCase()}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {selection.type && (
                <div className="animate-fade-in space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] block mb-4 px-1">{t('step3_select_exercise')}</label>
                    
                    {filteredExercises.length === 0 ? (
                        <div className="py-16 text-center bg-slate-900/50 rounded-[2rem] border border-white/5 border-dashed">
                            <p className="text-slate-500 italic text-sm font-medium">해당 부위와 기구에 맞는 운동이 없습니다.</p>
                        </div>
                    ) : (
                        filteredExercises.map((ex) => {
                            const handleImgError = (e) => {
                                e.target.onerror = null;
                                e.target.src = 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=400&h=300&fit=crop';
                            };
                            
                            return (
                                <div 
                                    key={ex.id}
                                    onClick={() => handleExerciseClick(ex.name)}
                                    className={`group relative flex items-center justify-between p-4 rounded-[1.5rem] cursor-pointer transition-all duration-500 border ${selection.exercise === ex.name ? 'bg-blue-600/10 border-blue-500 ring-1 ring-blue-500/50' : 'bg-slate-800/30 border-white/5 hover:border-slate-600 hover:bg-slate-800/50'}`}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="relative w-16 h-16 rounded-2xl overflow-hidden shadow-lg border border-white/5 group-hover:scale-105 transition-transform duration-500">
                                            <img src={ex.imageUrl || ex.image} className="w-full h-full object-cover" alt={ex.name} referrerPolicy="no-referrer" onError={handleImgError} />
                                            <div className="absolute inset-0 bg-slate-950/20 group-hover:bg-transparent transition-colors"></div>
                                        </div>
                                        <div>
                                            <p className={`text-base font-black italic tracking-tight uppercase transition-colors ${selection.exercise === ex.name ? 'text-blue-400' : 'text-white'}`}>{ex.name}</p>
                                            <div className="flex gap-2 mt-1">
                                                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">{ex.target}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <button onClick={(e) => { e.stopPropagation(); setModalExercise(ex); }} className="p-2.5 text-slate-500 hover:text-blue-400 bg-slate-900/50 rounded-xl transition-all hover:scale-110 active:scale-95">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                    </button>
                                </div>
                            );
                        })
                    )}
                </div>
            )}
            
            <ExerciseModal exercise={modalExercise} onClose={() => setModalExercise(null)} />
        </div>
    );
};

const LanguageToggle = () => {
    const { t, i18n } = useTranslation();
    const currentLang = i18n.language;
    return (
        <button onClick={() => i18n.changeLanguage(currentLang === 'ko' ? 'en' : 'ko')} className="flex items-center gap-2 bg-slate-800/50 hover:bg-slate-800 border border-slate-700 px-3 py-1.5 rounded-full transition-all active:scale-95 group shadow-lg shadow-black/20">
            <svg className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" /></svg>
            <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{t('lang_toggle')}</span>
        </button>
    );
};

const BackButton = () => {
    const navigate = useNavigate();
    const { t } = useTranslation();
    return (
        <button onClick={() => navigate('/dashboard')} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-6 group">
            <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
            <span className="font-medium">{t('back')}</span>
        </button>
    );
};

/**
 * [Screen 1: Login and Sign Up]
 */
const LoginScreen = () => {
    const { t } = useTranslation();
    const [isSignup, setIsSignup] = useState(false);
    
    // 폼 상태 관리
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [passwordConfirm, setPasswordConfirm] = useState('');
    const [age, setAge] = useState('');
    const [gender, setGender] = useState('');
    const [height, setHeight] = useState('');
    const [weight, setWeight] = useState('');
    
    const [isLoading, setIsLoading] = useState(false);

    // 로그인 로직
    const handleLogin = async () => {
        if (!email || !password) {
            alert('이메일과 비밀번호를 입력해주세요.');
            return;
        }
        setIsLoading(true);
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        setIsLoading(false);
        
        if (error) {
            if (error.message.includes('Email not confirmed')) {
                alert('이메일 인증이 완료되지 않았습니다. 가입하신 이메일의 수신함을 확인해주세요.');
            } else {
                alert('로그인 실패: ' + error.message);
            }
        }
    };

    // 상세 회원가입 및 이메일 전송 로직
    const handleSignupComplete = async () => {
        if (!email || !password) {
            alert('이메일과 비밀번호는 필수입니다.');
            return;
        }
        if (password !== passwordConfirm) {
            alert(t('alert_pw_mismatch'));
            return;
        }
        
        setIsLoading(true);
        // Supabase 회원가입 호출 (개인정보는 메타데이터로 저장)
        const { data, error } = await supabase.auth.signUp({ 
            email, 
            password,
            options: {
                data: {
                    age: age ? parseInt(age) : null,
                    gender: gender || null,
                    height: height ? parseFloat(height) : null,
                    weight: weight ? parseFloat(weight) : null
                }
            }
        });
        setIsLoading(false);

        if (error) {
            alert('회원가입 실패: ' + error.message);
        } else {
            // 이메일 확인이 필요한 경우 (Supabase 설정에 따라)
            if (data?.user && data?.user?.identities && data?.user?.identities.length === 0) {
                 alert('이미 존재하는 이메일입니다.');
            } else {
                 alert('가입하신 이메일로 인증 메일이 발송되었습니다!\n이메일의 링크를 클릭하여 인증을 완료한 후 로그인해주세요.');
                 setIsSignup(false);
                 setPassword('');
                 setPasswordConfirm('');
            }
        }
    };

    // 회원가입 화면
    if (isSignup) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen px-6 py-12 animate-fade-in bg-slate-950 relative">
                <div className="absolute top-6 right-6"><LanguageToggle /></div>
                <div className="w-full max-sm space-y-8">
                    <button onClick={() => setIsSignup(false)} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-4 group">
                        <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
                        <span className="font-medium">{t('back')}</span>
                    </button>
                    <div className="text-center">
                        <h2 className="text-4xl font-black italic tracking-tighter text-white uppercase">{t('signup')}</h2>
                        <p className="mt-2 text-slate-400 font-medium">상세 정보를 입력하고 AI 코칭을 받아보세요.</p>
                    </div>
                    
                    <div className="space-y-6 bg-slate-900/50 p-8 rounded-3xl border border-slate-800 shadow-2xl">
                        {/* 필수 정보 영역 */}
                        <div className="space-y-4">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block">필수 정보</label>
                            <input
                                type="email"
                                placeholder="이메일 주소"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-slate-500 transition-all"
                            />
                            <input
                                type="password"
                                placeholder={t('pw_placeholder')}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-slate-500 transition-all"
                            />
                            <input
                                type="password"
                                placeholder={t('pw_confirm_placeholder')}
                                value={passwordConfirm}
                                onChange={(e) => setPasswordConfirm(e.target.value)}
                                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-slate-500 transition-all"
                            />
                        </div>

                        {/* 선택 정보 영역 (AI 코치 연동) */}
                        <div className="space-y-4 pt-6 border-t border-slate-800">
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-1">{t('ai_coaching_info_optional')}</label>
                                <p className="text-[11px] text-slate-400 mb-4">{t('ai_coaching_info_desc')}</p>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <input 
                                    type="number" 
                                    placeholder={t('age_placeholder')}
                                    value={age}
                                    onChange={(e) => setAge(e.target.value)}
                                    className="px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-slate-500 transition-all" 
                                />
                                <select 
                                    value={gender}
                                    onChange={(e) => setGender(e.target.value)}
                                    className="px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-slate-500 transition-all appearance-none"
                                >
                                    <option value="">{t('gender_placeholder')}</option>
                                    <option value="male">{t('male')}</option>
                                    <option value="female">{t('female')}</option>
                                </select>
                                <input 
                                    type="number" 
                                    placeholder={t('height_placeholder')}
                                    value={height}
                                    onChange={(e) => setHeight(e.target.value)}
                                    className="px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-slate-500 transition-all" 
                                />
                                <input 
                                    type="number" 
                                    placeholder={t('weight_placeholder')}
                                    value={weight}
                                    onChange={(e) => setWeight(e.target.value)}
                                    className="px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-slate-500 transition-all" 
                                />
                            </div>
                        </div>

                        <div className="pt-4">
                            <button
                                onClick={handleSignupComplete}
                                disabled={isLoading}
                                className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-blue-500/20 active:scale-95 transition-all mb-4"
                            >
                                {isLoading ? '처리 중...' : t('signup_complete_button')}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // 로그인 화면
    return (
        <div className="flex flex-col items-center justify-center min-h-screen px-6 animate-fade-in relative bg-slate-950">
            <div className="absolute top-6 right-6"><LanguageToggle /></div>
            <div className="mb-12 text-center">
                <h1 className="text-6xl font-extrabold italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-indigo-600">
                    {t('welcome_title')}
                </h1>
                <p className="mt-2 text-gray-400 font-medium tracking-wide uppercase">{t('welcome_subtitle')}</p>
            </div>
            <div className="w-full max-sm space-y-4">
                <div className="space-y-2">
                    <input
                        type="email"
                        placeholder="이메일 주소"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-4 py-4 bg-slate-800 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-slate-500 transition-all"
                    />
                    <input
                        type="password"
                        placeholder={t('pw_placeholder')}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full px-4 py-4 bg-slate-800 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-slate-500 transition-all"
                    />
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={handleLogin}
                        disabled={isLoading}
                        className="flex-1 py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg shadow-blue-500/20 active:scale-95 transition-all"
                    >
                        {isLoading ? '로딩중...' : t('login')}
                    </button>
                    <button
                        onClick={() => setIsSignup(true)}
                        className="flex-1 py-4 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-xl active:scale-95 transition-all"
                    >
                        {t('signup')}
                    </button>
                </div>
            </div>
        </div>
    );
};

const WorkoutDetailScreen = () => {
    const { t } = useTranslation();
    const location = useLocation();
    const { date, logs } = location.state || { date: '?', logs: [] };
    
    return (
        <div className="p-4 md:p-12 max-w-4xl mx-auto animate-fade-in bg-slate-950 min-h-screen relative">
            <div className="absolute top-4 right-4"><LanguageToggle /></div>
            <BackButton />
            <div className="mb-6">
                <h2 className="text-3xl font-black italic tracking-tighter text-white">
                    {date} {t('training_details')}
                </h2>
            </div>

            <div className="space-y-4">
                {logs.length === 0 ? (
                    <div className="py-20 text-center bg-slate-900/50 rounded-[2rem] border border-dashed border-slate-800">
                        <p className="text-slate-500 italic">기록된 데이터가 없습니다.</p>
                    </div>
                ) : (
                    logs.map((log, idx) => (
                        <div key={idx} className="bg-slate-900/40 border border-white/5 p-4 md:p-6 rounded-[1.5rem] shadow-2xl relative overflow-hidden group">
                            <div className="absolute top-0 left-0 w-1 h-full bg-blue-600"></div>
                            <div className="flex items-center justify-between mb-3">
                                <div>
                                    <div className="flex gap-1 mb-1">
                                        <span className="bg-blue-600 text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest text-white">
                                            {t(log.part)}
                                        </span>
                                        <span className="bg-slate-800 text-slate-400 text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest border border-slate-700">
                                            {t(log.type)}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <h3 className="text-lg md:text-xl font-black italic text-white uppercase tracking-tighter leading-none">{log.exercise}</h3>
                                        <span className="text-xs font-black text-slate-500 italic uppercase leading-none">{log.sets_count} SETS</span>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-1">
                                {log.sets_data.map((s, sIdx) => (
                                    <div key={sIdx} className="flex items-center justify-between py-1.5 px-4 bg-slate-950/50 rounded-lg border border-white/5 transition-all hover:border-blue-500/30">
                                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{sIdx + 1} SET</span>
                                        <div className="flex gap-4 items-center">
                                            <span className="text-xs font-bold text-white w-12 text-right">{s.weight}kg</span>
                                            <span className="text-xs font-bold text-blue-400 w-12 text-right">{s.reps} r</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

const WorkoutSetupScreen = () => {
    const { t } = useTranslation();
    const [step, setStep] = useState(1);
    const [selection, setSelection] = useState({ part: '', type: '', exercise: '' });
    const [numSets, setNumSets] = useState('');
    const [setsData, setSetsData] = useState([]);
    const [addedExercises, setAddedExercises] = useState([]);
    const [isSaving, setIsSaving] = useState(false);

    const handleNumSetsChange = (e) => {
        const val = parseInt(e.target.value) || 0;
        setNumSets(e.target.value);
        if (val > 0) {
            setSetsData(prev => {
                const newData = new Array(val).fill(null).map((_, i) => prev[i] || { weight: '', reps: '' });
                return newData;
            });
        } else {
            setSetsData([]);
        }
    };

    const handleSetDataChange = (index, field, value) => {
        const newData = [...setsData];
        newData[index] = { ...newData[index], [field]: value };
        setSetsData(newData);
    };

    const isRecordEnabled = useMemo(() => {
        const nSets = parseInt(numSets);
        const allSetsFilled = setsData.length > 0 && setsData.length === nSets && setsData.every(s => s.weight !== '' && s.reps !== '' && parseFloat(s.weight) >= 0 && parseInt(s.reps) > 0);
        return nSets > 0 && allSetsFilled && selection.exercise !== '';
    }, [numSets, setsData, selection.exercise]);

    const handleAddOrUpdateExercise = async () => {
        if (!isRecordEnabled || isSaving) return;
        setIsSaving(true);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                alert('로그인이 필요한 서비스입니다.');
                setIsSaving(false);
                return;
            }

            const newLog = {
                user_id: user.id,
                part: selection.part,
                type: selection.type,
                exercise: selection.exercise,
                sets_count: parseInt(numSets),
                sets_data: setsData,
                is_completed: true
            };

            const { error } = await supabase.from('workout_logs').insert([newLog]);
            if (error) throw error;

            alert('성공적으로 기록이 저장되었습니다!');
            setAddedExercises([...addedExercises, { ...newLog, id: Date.now() }]);
            setNumSets('');
            setSetsData([]);
            setStep(1);
            setSelection({ part: '', type: '', exercise: '' });

        } catch (error) {
            console.error('Error saving workout:', error);
            alert('저장 중 오류가 발생했습니다: ' + error.message);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = (id) => {
        if (confirm('이 기록을 화면에서 지우시겠습니까? (DB에서는 삭제되지 않습니다)')) {
            setAddedExercises(prev => prev.filter(ex => ex.id !== id));
        }
    };

    return (
        <div className="p-8 md:p-12 max-w-4xl mx-auto animate-fade-in bg-slate-950 min-h-screen relative">
            <div className="absolute top-6 right-6"><LanguageToggle /></div>
            <BackButton />
            <div className="mb-8">
                <h2 className="text-3xl font-black italic text-white uppercase tracking-tighter underline decoration-blue-500 decoration-4 underline-offset-8">
                    {t('routine_record_title')}
                </h2>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-6">
                    <ExerciseSelector selection={selection} setSelection={setSelection} onExerciseSelect={() => setStep(4)} />
                    
                    {step >= 4 && (
                        <div className="animate-fade-in space-y-6 bg-slate-800/30 p-6 rounded-2xl border border-slate-700">
                            <div>
                                <label className="text-[10px] font-bold text-slate-500 uppercase mb-2 block tracking-tighter">SETS</label>
                                <input type="number" value={numSets} onChange={handleNumSetsChange} className="w-full bg-slate-900 border border-slate-700 p-3 rounded-xl text-white text-center font-bold focus:ring-2 focus:ring-blue-500 outline-none" placeholder="0" />
                            </div>
                            {setsData.length > 0 && (
                                <div className="space-y-3 animate-slide-down">
                                    <label className="text-[10px] font-bold text-blue-500 uppercase block tracking-widest">{t('sets_detail_record')}</label>
                                    <div className="space-y-2">
                                        {setsData.map((s, idx) => (
                                            <div key={idx} className="flex items-center gap-3 bg-slate-900/50 p-3 rounded-xl border border-slate-800">
                                                <span className="text-xs font-bold text-slate-600 w-8">{idx + 1}S</span>
                                                <div className="flex-1 flex gap-2">
                                                    <input type="number" value={s.weight} onChange={(e) => handleSetDataChange(idx, 'weight', e.target.value)} className="w-full bg-slate-900 border border-slate-700 p-2 rounded-lg text-white text-right font-bold focus:border-blue-500 outline-none text-sm" placeholder="KG" />
                                                    <input type="number" value={s.reps} onChange={(e) => handleSetDataChange(idx, 'reps', e.target.value)} className="w-full bg-slate-900 border border-slate-700 p-2 rounded-lg text-white text-right font-bold focus:border-indigo-500 outline-none text-sm" placeholder="REPS" />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                            <button 
                                onClick={handleAddOrUpdateExercise} 
                                disabled={!isRecordEnabled || isSaving} 
                                className={`w-full py-4 font-black rounded-xl italic tracking-tighter transition-all ${isRecordEnabled && !isSaving ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/20' : 'bg-slate-700 text-slate-500 cursor-not-allowed'}`}
                            >
                                {isSaving ? '저장 중...' : t('record_button')}
                            </button>
                        </div>
                    )}
                </div>
                <div className="bg-slate-900/50 rounded-3xl border border-slate-800 p-6">
                    <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2"><span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>현재 세션에 추가된 기록 ({addedExercises.length})</h3>
                    <div className="space-y-4">
                        {addedExercises.length === 0 ? (<p className="text-slate-600 text-center py-12 italic text-sm">{t('no_recorded_routines')}</p>) : (addedExercises.map((ex, idx) => (
                            <div key={ex.id} className="bg-slate-800 p-4 rounded-xl border border-slate-700 group relative">
                                <div className="flex justify-between items-start mb-3">
                                    <div>
                                        <span className="text-[10px] font-bold text-blue-400 block uppercase">{t(ex.part)} / {t(ex.type)}</span>
                                        <span className="font-bold text-white text-lg">{ex.exercise}</span>
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={() => handleDelete(ex.id)} className="p-2 bg-slate-700 hover:bg-rose-600 text-white rounded-lg transition-colors"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                                    </div>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {ex.sets_data.map((s, i) => (
                                        <div key={i} className="px-3 py-1 bg-slate-900 rounded-lg border border-slate-700 text-[11px] flex flex-col items-center min-w-[50px]">
                                            <span className="text-slate-500 text-[9px] mb-1">{i+1}S</span>
                                            <span className="text-white font-bold">{s.weight}kg</span>
                                            <span className="text-indigo-400 font-medium">{s.reps}R</span>
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-3 text-right"><span className="text-xs font-bold text-slate-500 uppercase">Total {ex.sets_count} Sets</span></div>
                            </div>
                        )))}
                    </div>
                </div>
            </div>
        </div>
    );
};

const WorkoutPlanScreen = () => {
    const { t } = useTranslation();
    const [selection, setSelection] = useState({ part: '', type: '', exercise: '' });
    const [planList, setPlanList] = useState([]);
    const [recordingIndex, setRecordingIndex] = useState(null);
    const [numSets, setNumSets] = useState('');
    const [setsData, setSetsData] = useState([]);
    const [isSaving, setIsSaving] = useState(false);

    const handleAddToList = () => {
        if (!selection.exercise) return;
        const newItem = {
            id: Date.now(),
            part: selection.part,
            type: selection.type,
            exercise: selection.exercise,
            isCompleted: false
        };
        setPlanList([...planList, newItem]);
        setSelection({ part: '', type: '', exercise: '' });
    };

    const startRecording = (index) => {
        setRecordingIndex(index);
        setNumSets('');
        setSetsData([]);
    };

    const handleNumSetsChange = (e) => {
        const val = parseInt(e.target.value) || 0;
        setNumSets(e.target.value);
        if (val > 0) {
            setSetsData(new Array(val).fill(null).map(() => ({ weight: '', reps: '' })));
        } else {
            setSetsData([]);
        }
    };

    const handleSetDataChange = (index, field, value) => {
        const newData = [...setsData];
        newData[index] = { ...newData[index], [field]: value };
        setSetsData(newData);
    };

    const handleFinishRecording = async () => {
        if (recordingIndex === null || isSaving) return;
        
        const nSets = parseInt(numSets);
        const allSetsFilled = setsData.length > 0 && setsData.length === nSets && setsData.every(s => s.weight !== '' && s.reps !== '');
        
        if (!allSetsFilled) {
            alert('모든 세트의 정보를 입력해주세요.');
            return;
        }

        setIsSaving(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('로그인이 필요합니다.');

            const targetExercise = planList[recordingIndex];
            const newLog = {
                user_id: user.id,
                part: targetExercise.part,
                type: targetExercise.type,
                exercise: targetExercise.exercise,
                sets_count: nSets,
                sets_data: setsData,
                is_completed: true
            };

            const { error } = await supabase.from('workout_logs').insert([newLog]);
            if (error) throw error;

            const newPlanList = [...planList];
            newPlanList[recordingIndex].isCompleted = true;
            setPlanList(newPlanList);
            setRecordingIndex(null);
            alert('기록이 완료되었습니다!');
        } catch (error) {
            alert('저장 오류: ' + error.message);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="p-6 md:p-12 max-w-6xl mx-auto animate-fade-in bg-slate-950 min-h-screen relative">
            <div className="absolute top-6 right-6"><LanguageToggle /></div>
            <BackButton />
            
            <div className="mb-8">
                <h2 className="text-3xl font-black italic text-white uppercase tracking-tighter underline decoration-indigo-500 decoration-4 underline-offset-8">
                    {t('routine_compose_title')}
                </h2>
                <p className="text-slate-400 mt-2 font-medium">오늘 수행할 운동들을 미리 구성하고 기록해보세요.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                {/* 왼쪽: 운동 추가 */}
                <div className="space-y-6">
                    <div className="bg-slate-900/50 p-6 rounded-3xl border border-slate-800">
                        <ExerciseSelector selection={selection} setSelection={setSelection} />
                        {selection.exercise && (
                            <button 
                                onClick={handleAddToList}
                                className="w-full mt-6 py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-xl italic tracking-tighter transition-all shadow-lg shadow-indigo-600/20 active:scale-95"
                            >
                                리스트에 추가하기
                            </button>
                        )}
                    </div>
                </div>

                {/* 오른쪽: 오늘 할 운동 리스트 */}
                <div className="space-y-6">
                    <div className="bg-slate-900/50 p-6 rounded-3xl border border-slate-800 min-h-[400px]">
                        <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                            <span className="w-2 h-2 bg-indigo-500 rounded-full"></span>
                            오늘의 운동 리스트 ({planList.length})
                        </h3>
                        
                        <div className="space-y-4">
                            {planList.length === 0 ? (
                                <div className="py-20 text-center">
                                    <p className="text-slate-600 italic">왼쪽에서 운동을 선택해 리스트를 구성하세요.</p>
                                </div>
                            ) : (
                                planList.map((item, idx) => (
                                    <div key={item.id} className={`p-5 rounded-2xl border transition-all ${item.isCompleted ? 'bg-slate-800/20 border-emerald-500/30' : 'bg-slate-800/60 border-slate-700'}`}>
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <span className="text-[10px] font-bold text-indigo-400 block uppercase mb-1">{t(item.part)} / {t(item.type)}</span>
                                                <h4 className={`text-lg font-bold ${item.isCompleted ? 'text-slate-500 line-through' : 'text-white'}`}>{item.exercise}</h4>
                                            </div>
                                            {item.isCompleted ? (
                                                <div className="flex items-center gap-2 text-emerald-400 font-black italic text-sm">
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                                                    COMPLETED
                                                </div>
                                            ) : (
                                                <button 
                                                    onClick={() => startRecording(idx)}
                                                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-black italic rounded-lg transition-all active:scale-95"
                                                >
                                                    기록하기
                                                </button>
                                            )}
                                        </div>

                                        {/* 기록 폼 (해당 아이템을 기록 중일 때만 표시) */}
                                        {recordingIndex === idx && (
                                            <div className="mt-6 pt-6 border-t border-slate-700 space-y-4 animate-slide-down">
                                                <div className="flex items-center justify-between">
                                                    <label className="text-xs font-bold text-slate-400">세트 수</label>
                                                    <input 
                                                        type="number" 
                                                        value={numSets} 
                                                        onChange={handleNumSetsChange}
                                                        placeholder="0"
                                                        className="w-16 bg-slate-900 border border-slate-700 p-2 rounded-lg text-white text-center font-bold outline-none focus:ring-1 focus:ring-blue-500"
                                                    />
                                                </div>

                                                {setsData.length > 0 && (
                                                    <div className="space-y-2">
                                                        {setsData.map((s, sIdx) => (
                                                            <div key={sIdx} className="flex gap-2">
                                                                <div className="flex-1 flex items-center bg-slate-900 border border-slate-700 rounded-lg px-3">
                                                                    <span className="text-[10px] text-slate-500 font-bold mr-2">{sIdx + 1}S</span>
                                                                    <input 
                                                                        type="number" 
                                                                        value={s.weight} 
                                                                        onChange={(e) => handleSetDataChange(sIdx, 'weight', e.target.value)}
                                                                        placeholder="KG" 
                                                                        className="w-full bg-transparent p-2 text-white text-right font-bold outline-none text-xs"
                                                                    />
                                                                </div>
                                                                <div className="flex-1 flex items-center bg-slate-900 border border-slate-700 rounded-lg px-3">
                                                                    <input 
                                                                        type="number" 
                                                                        value={s.reps} 
                                                                        onChange={(e) => handleSetDataChange(sIdx, 'reps', e.target.value)}
                                                                        placeholder="REPS" 
                                                                        className="w-full bg-transparent p-2 text-white text-right font-bold outline-none text-xs"
                                                                    />
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}

                                                <div className="flex gap-2">
                                                    <button 
                                                        onClick={() => setRecordingIndex(null)}
                                                        className="flex-1 py-3 bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold rounded-xl transition-all"
                                                    >
                                                        취소
                                                    </button>
                                                    <button 
                                                        onClick={handleFinishRecording}
                                                        disabled={isSaving}
                                                        className="flex-[2] py-3 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black italic rounded-xl transition-all shadow-lg shadow-emerald-600/20"
                                                    >
                                                        {isSaving ? '저장 중...' : '기록 완료'}
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const AIRecommendationScreen = () => {
    const { t } = useTranslation();
    const [userData, setUserData] = useState(null);
    const [recentLogs, setRecentLogs] = useState([]);
    const [messages, setMessages] = useState([
        { id: 1, type: 'ai', text: '안녕하세요! 당신의 AI 코치입니다. 오늘 어떤 운동을 도와드릴까요?' }
    ]);
    const [inputText, setInputText] = useState('');
    const [isTyping, setIsTyping] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    setUserData(user.user_metadata);
                    
                    // 최근 7일간의 기록 가져오기
                    const sevenDaysAgo = new Date();
                    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
                    
                    const { data: logs, error } = await supabase
                        .from('workout_logs')
                        .select('*')
                        .eq('user_id', user.id)
                        .gte('created_at', sevenDaysAgo.toISOString())
                        .order('created_at', { ascending: false });
                    
                    if (error) throw error;
                    setRecentLogs(logs || []);
                }
            } catch (err) {
                console.error('Data loading error:', err);
            }
        };
        fetchData();
    }, []);

    const generateAIResponse = async (prompt) => {
        try {
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${import.meta.env.VITE_GEMINI_API_KEY}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }]
                })
            });

            if (!response.ok) {
                const errText = await response.text();
                throw new Error(errText);
            }

            const data = await response.json();
            return data.candidates?.[0]?.content?.parts?.[0]?.text || "죄송합니다. 답변을 생성하는 중 오류가 발생했습니다.";
        } catch (error) {
            console.error("AI API Error:", error);
            return `API 오류: ${error.message}`;
        }
    };

    const handleSendMessage = async (customText = null) => {
        const textToSend = customText || inputText;
        if (!textToSend.trim() || isTyping) return;

        // 1. 사용자 메시지 추가
        const userMsg = { id: Date.now(), type: 'user', text: textToSend };
        setMessages(prev => [...prev, userMsg]);
        setInputText('');
        setIsTyping(true);

        // 2. 프롬프트 엔지니어링 고도화
        const systemPrompt = `너는 상위 1% 엘리트 퍼스널 트레이너 'MyGym AI 코치'야. 일반적인 챗봇처럼 장황하게 말하지 말고, 전문가처럼 핵심만 명확하고 단호하게 말해. 다음 규칙을 무조건 지켜:
- 사용자의 체격(키, 몸무게, 성별, 나이)을 분석하여 현실적이고 부상 위험이 없는 세트 수와 중량(kg) 가이드라인을 제안할 것.
- 제공된 '최근 7일 운동 기록'을 반드시 분석하여, 최근에 사용한 근육군은 피하고 휴식할 수 있도록 교차 부위(분할 운동)를 추천할 것.
- 루틴을 추천할 때는 [운동 종목명] - [세트 및 횟수] - [추천 중량] - [선정 이유]를 가독성 좋은 불릿 포인트(-) 리스트 형태로 정리할 것.`;

        const logSummary = recentLogs.length > 0 
            ? recentLogs.map(l => `${new Date(l.created_at).toLocaleDateString()}: ${t(l.part)}(${l.exercise})`).join('\n') 
            : '최근 7일간 기록 없음';

        const userContext = `나이: ${userData?.age || '미입력'}세
성별: ${userData?.gender || '미입력'}
키: ${userData?.height || '미입력'}cm
몸무게: ${userData?.weight || '미입력'}kg
최근 7일 운동 기록:
${logSummary}`;

        const fullPrompt = `${systemPrompt}\n\n[사용자 데이터]\n${userContext}\n\n[사용자 질문]: ${textToSend}`;
        
        console.log("Structured Prompt for AI:", fullPrompt);

        // 3. AI 응답 받기
        const aiText = await generateAIResponse(fullPrompt);
        
        const aiMsg = { id: Date.now() + 1, type: 'ai', text: aiText };
        setMessages(prev => [...prev, aiMsg]);
        setIsTyping(false);
    };

    return (
        <div className="flex flex-col h-screen bg-slate-950 animate-fade-in relative max-w-2xl mx-auto border-x border-white/5">
            {/* Header */}
            <div className="p-4 border-b border-white/5 flex items-center justify-between bg-slate-900/50 backdrop-blur-md sticky top-0 z-10">
                <div className="flex items-center gap-3">
                    <BackButton />
                    <div className="flex items-center gap-3 ml-2">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                        </div>
                        <div>
                            <h2 className="text-sm font-black text-white leading-none uppercase tracking-tighter italic">AI MyGym Coach</h2>
                            <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1 mt-1">
                                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></span> Online
                            </span>
                        </div>
                    </div>
                </div>
                <LanguageToggle />
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar pb-32">
                {messages.map((msg) => (
                    <div key={msg.id} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'} animate-slide-up`}>
                        <div className={`max-w-[85%] p-4 rounded-[1.5rem] text-sm leading-relaxed ${
                            msg.type === 'user' 
                            ? 'bg-blue-600 text-white rounded-tr-none shadow-xl shadow-blue-600/10' 
                            : 'bg-slate-800 text-slate-200 rounded-tl-none border border-white/5'
                        }`}>
                            <p className="whitespace-pre-wrap">{msg.text}</p>
                        </div>
                    </div>
                ))}
                {isTyping && (
                    <div className="flex justify-start">
                        <div className="bg-slate-800 p-4 rounded-2xl rounded-tl-none border border-white/5 flex gap-1">
                            <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce"></span>
                            <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce delay-75"></span>
                            <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce delay-150"></span>
                        </div>
                    </div>
                )}
            </div>

            {/* Input Area */}
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-slate-950 via-slate-950 to-transparent">
                <div className="max-w-xl mx-auto space-y-3">
                    {/* Quick Actions */}
                    <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                        <button 
                            onClick={() => handleSendMessage("내 체형에 맞는 루틴 추천해줘")}
                            className="whitespace-nowrap px-4 py-2 bg-slate-900 border border-white/5 rounded-full text-[11px] font-bold text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
                        >
                            📋 루틴 추천
                        </button>
                        <button 
                            onClick={() => handleSendMessage("최근 운동 평가해줘")}
                            className="whitespace-nowrap px-4 py-2 bg-slate-900 border border-white/5 rounded-full text-[11px] font-bold text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
                        >
                            📊 운동 평가
                        </button>
                        <button 
                            onClick={() => handleSendMessage("단백질 섭취량 계산해줘")}
                            className="whitespace-nowrap px-4 py-2 bg-slate-900 border border-white/5 rounded-full text-[11px] font-bold text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
                        >
                            🍗 영양 조언
                        </button>
                    </div>

                    <div className="relative group">
                        <input 
                            type="text"
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                            placeholder="코치에게 질문하기..."
                            className="w-full bg-slate-900/80 backdrop-blur-md border border-white/10 rounded-2xl py-4 pl-5 pr-14 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-2xl"
                        />
                        <button 
                            onClick={() => handleSendMessage()}
                            disabled={!inputText.trim() || isTyping}
                            className="absolute right-2 top-2 bottom-2 px-4 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-600 transition-all active:scale-95 shadow-lg shadow-blue-600/20"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 19l9-2-9-18-9 18 9 2zm0 0v-8" /></svg>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const MonthlyCalendar = ({ workoutGroups = {} }) => {
    const navigate = useNavigate();
    const { t } = useTranslation();
    const daysOfWeek = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth();
    const currentDate = today.getDate();
    
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
    const lastDateOfMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    
    const calendarDays = [];
    for (let i = 0; i < firstDayOfMonth; i++) calendarDays.push(null);
    for (let i = 1; i <= lastDateOfMonth; i++) calendarDays.push(i);

    return (
        <div className="mt-4 md:mt-10 p-5 md:p-6 bg-slate-800/50 rounded-2xl border border-slate-700/50">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-md md:text-lg font-bold text-white uppercase tracking-tighter">
                    {currentMonth + 1}{t('month_label')} {t('training_calendar')}
                </h3>
            </div>
            <div className="grid grid-cols-7 gap-1 md:gap-2">
                {daysOfWeek.map(day => (<div key={day} className="text-center text-[10px] md:text-xs font-black text-slate-500 py-2 uppercase">{day}</div>))}
                {calendarDays.map((date, idx) => {
                    const workoutInfo = date ? workoutGroups[date] : null;
                    const isToday = date === currentDate;

                    return (
                        <div 
                            key={idx} 
                            onClick={() => workoutInfo && navigate('/routine-detail', { state: { date: workoutInfo.dateString, logs: workoutInfo.logs } })}
                            className={`aspect-square flex flex-col items-center justify-center relative group ${workoutInfo ? 'cursor-pointer' : ''}`}
                        >
                            {date && (
                                <>
                                    {isToday ? (
                                        <div className="absolute inset-1 bg-blue-600 rounded-full"></div>
                                    ) : workoutInfo ? (
                                        <div className="absolute inset-1 bg-transparent border-2 border-red-500 rounded-full animate-pulse"></div>
                                    ) : null}
                                    <span className={`relative z-10 text-[11px] md:text-sm font-bold ${isToday ? 'text-white' : (workoutInfo ? 'text-white' : 'text-slate-400')}`}>
                                        {date}
                                    </span>
                                    {workoutInfo && (
                                        <span className="relative z-10 text-[8px] text-slate-400 font-bold mt-0.5 line-clamp-1 text-center px-1">
                                            {workoutInfo.partsDisplay}
                                        </span>
                                    )}
                                </>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

const DashboardScreen = () => {
    const navigate = useNavigate();
    const { t } = useTranslation();
    const [workoutGroups, setWorkoutGroups] = useState({});
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchRecentLogs = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) return;

                const { data, error } = await supabase
                    .from('workout_logs')
                    .select('*')
                    .eq('user_id', user.id)
                    .order('created_at', { ascending: false })
                    .limit(200);

                if (error) throw error;

                if (data) {
                    const days = ['일', '월', '화', '수', '목', '금', '토'];
                    const groups = {};
                    const today = new Date();
                    const currentMonth = today.getMonth();
                    const currentYear = today.getFullYear();

                    data.forEach(log => {
                        const d = new Date(log.created_at);
                        const logMonth = d.getMonth();
                        const logYear = d.getFullYear();
                        const logDate = d.getDate();

                        if (logMonth === currentMonth && logYear === currentYear) {
                            if (!groups[logDate]) {
                                const dateStr = `${logMonth + 1}/${logDate}(${days[d.getDay()]})`;
                                groups[logDate] = {
                                    dateString: dateStr,
                                    parts: new Set(),
                                    logs: []
                                };
                            }
                            groups[logDate].parts.add(t(log.part));
                            groups[logDate].logs.push(log);
                        }
                    });

                    // 부위 텍스트 가공
                    Object.keys(groups).forEach(date => {
                        groups[date].partsDisplay = Array.from(groups[date].parts).join(',');
                    });

                    setWorkoutGroups(groups);
                }
            } catch (error) {
                console.error("데이터 불러오기 에러:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchRecentLogs();
    }, [t]);

    return (
        <div className="flex flex-col md:flex-row min-h-screen animate-fade-in overflow-x-hidden relative bg-slate-950">
            <div className="absolute top-6 right-6 z-20 flex gap-2">
                <LanguageToggle />
                <button 
                    onClick={() => supabase.auth.signOut()}
                    className="bg-slate-800/50 hover:bg-rose-500/20 border border-slate-700 px-3 py-1.5 rounded-full transition-all active:scale-95 group shadow-lg shadow-black/20"
                >
                    <span className="text-[10px] font-black text-slate-300 group-hover:text-rose-400 uppercase tracking-widest">
                        LOGOUT
                    </span>
                </button>
            </div>
            <div className="w-full md:w-1/2 p-4 md:p-12 border-b md:border-b-0 md:border-r border-slate-800 bg-slate-950 flex flex-col justify-center">
                <div className="mb-2 md:mb-6">
                    <h2 className="text-xl md:text-2xl font-bold flex items-center gap-2 text-white">
                        <span className="w-1.5 h-6 bg-blue-500 rounded-full"></span>
                        나의 운동 현황
                    </h2>
                </div>
                
                {isLoading ? (
                    <div className="text-slate-500 text-center py-4">기록을 불러오는 중...</div>
                ) : (
                    <MonthlyCalendar workoutGroups={workoutGroups} />
                )}
            </div>
            <div className="w-full md:w-1/2 flex flex-col h-auto md:h-screen">
                <button onClick={() => navigate('/routine-record')} className="h-[220px] md:flex-1 group relative overflow-hidden bg-slate-900 flex flex-col items-center justify-center transition-all hover:bg-slate-800 border-b border-slate-800 md:border-b-0">
                    <div className="absolute inset-0 opacity-10 bg-[url('https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=800')] bg-cover bg-center group-hover:scale-110 transition-transform duration-700"></div>
                    <div className="relative z-10 flex flex-col items-center">
                        <div className="w-12 h-12 md:w-14 md:h-14 bg-blue-600 rounded-2xl flex items-center justify-center mb-3 shadow-lg shadow-blue-600/30 group-hover:rotate-12 transition-transform"><svg className="w-6 h-6 md:w-7 md:h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg></div>
                        <span className="text-lg md:text-xl font-black italic text-white tracking-tighter">{t('routine_record_title')}</span>
                        <p className="text-slate-400 text-[10px] md:text-xs mt-1 uppercase">Routine Record</p>
                    </div>
                </button>
                <button onClick={() => navigate('/routine-compose')} className="h-[220px] md:flex-1 group relative overflow-hidden bg-indigo-950 flex flex-col items-center justify-center transition-all hover:bg-indigo-900 border-b border-slate-800 md:border-b-0">
                    <div className="absolute inset-0 opacity-10 bg-[url('https://images.unsplash.com/photo-1434494878577-86c23bcb06b9?q=80&w=800')] bg-cover bg-center group-hover:scale-110 transition-transform duration-700"></div>
                    <div className="relative z-10 flex flex-col items-center">
                        <div className="w-12 h-12 md:w-14 md:h-14 bg-indigo-600 rounded-2xl flex items-center justify-center mb-3 shadow-lg shadow-indigo-600/30 group-hover:rotate-6 transition-transform"><svg className="w-6 h-6 md:w-7 md:h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg></div>
                        <span className="text-lg md:text-xl font-black italic text-white tracking-tighter">{t('routine_compose_title')}</span>
                        <p className="text-slate-400 text-[10px] md:text-xs mt-1 uppercase">Routine Compose</p>
                    </div>
                </button>
                <button onClick={() => navigate('/ai-coach')} className="h-[220px] md:flex-1 group relative overflow-hidden bg-blue-700 flex flex-col items-center justify-center transition-all hover:bg-blue-600">
                    <div className="absolute inset-0 opacity-20 bg-[url('https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=800')] bg-cover bg-center group-hover:scale-110 transition-transform duration-700"></div>
                    <div className="relative z-10 flex flex-col items-center">
                        <div className="w-12 h-12 md:w-14 md:h-14 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mb-3 border border-white/30 group-hover:-rotate-12 transition-transform"><svg className="w-6 h-6 md:w-7 md:h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg></div>
                        <span className="text-lg md:text-xl font-black italic text-white tracking-tighter">{t('ai_coach')}</span>
                        <p className="text-blue-100 text-[10px] md:text-xs mt-1 uppercase">Ai Coach</p>
                    </div>
                </button>
            </div>
        </div>
    );
};

const App = () => {
    const [session, setSession] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setLoading(false);
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
        });

        return () => subscription.unsubscribe();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-slate-950 text-white font-bold italic tracking-tighter text-2xl animate-pulse">
                INITIALIZING...
            </div>
        );
    }

    if (!session) {
        return <LoginScreen />;
    }

    return (
        <BrowserRouter>
            <div className="min-h-screen bg-slate-950 text-slate-50 selection:bg-blue-500/30 font-sans">
                <React.Suspense fallback={<div className="flex items-center justify-center min-h-screen text-white font-bold italic tracking-tighter text-2xl animate-pulse">LOADING...</div>}>
                    <Routes>
                        <Route path="/" element={<DashboardScreen />} />
                        <Route path="/dashboard" element={<DashboardScreen />} />
                        <Route path="/routine-detail" element={<WorkoutDetailScreen />} />
                        <Route path="/routine-record" element={<WorkoutSetupScreen />} />
                        <Route path="/routine-compose" element={<WorkoutPlanScreen />} />
                        <Route path="/ai-coach" element={<AIRecommendationScreen />} />
                        <Route path="/api-view" element={<ApiViewer />} />
                        <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                </React.Suspense>
            </div>
        </BrowserRouter>
    );
};

const root = createRoot(document.getElementById('root'));
root.render(<App />);





