import React, { useState, useMemo, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, Link, useNavigate, useLocation, Navigate, useSearchParams } from 'react-router-dom';
import { CUSTOM_EXERCISES } from './src/data/customExercises';
import ApiViewer from './src/components/ApiViewer';
import { supabase } from './src/api/supabase';
import OpenAI from 'openai';

// OpenAI 인스턴스 생성 (Vite 환경변수 사용 및 브라우저 호출 허용)
const openai = new OpenAI({
    apiKey: import.meta.env.VITE_OPENAI_API_KEY,
    dangerouslyAllowBrowser: true
});

console.log("MyGym App Initializing with Custom Exercise Data...");

/**
 * [Common: User Profile Modal]
 */
const UserProfileModal = ({ isOpen, onClose, userData, onUpdate }) => {
    if (!isOpen) return null;
    
    const [profile, setProfile] = useState({
        age: userData?.age || '',
        height: userData?.height || '',
        weight: userData?.weight || '',
        gender: userData?.gender || '',
        skeletal_muscle_mass: userData?.skeletal_muscle_mass || '',
        body_fat_mass: userData?.body_fat_mass || '',
        body_fat_percentage: userData?.body_fat_percentage || '',
        bmr: userData?.bmr || '',
        visceral_fat_level: userData?.visceral_fat_level || ''
    });

    const [isSaving, setIsSaving] = useState(false);

    const handleSave = async () => {
        setIsSaving(true);
        const { error } = await supabase.auth.updateUser({
            data: { ...profile }
        });
        setIsSaving(false);
        if (error) {
            alert('저장 실패: ' + error.message);
        } else {
            alert('저장되었습니다.');
            onUpdate();
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md" onClick={onClose}></div>
            <div className="relative bg-slate-900 border border-white/10 w-full max-w-lg rounded-[2.5rem] p-8 shadow-2xl max-h-[90vh] overflow-y-auto custom-scrollbar">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-2xl font-black text-white italic">내 정보 설정</h3>
                    <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>
                
                <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-[10px] font-black text-slate-500 uppercase block mb-1">나이</label>
                            <input type="number" value={profile.age} onChange={e => setProfile({...profile, age: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white focus:ring-2 focus:ring-blue-500 outline-none" placeholder="세" />
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-slate-500 uppercase block mb-1">성별</label>
                            <select value={profile.gender} onChange={e => setProfile({...profile, gender: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white focus:ring-2 focus:ring-blue-500 outline-none">
                                <option value="">선택</option>
                                <option value="male">남성</option>
                                <option value="female">여성</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-slate-500 uppercase block mb-1">키 (cm)</label>
                            <input type="number" value={profile.height} onChange={e => setProfile({...profile, height: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white focus:ring-2 focus:ring-blue-500 outline-none" placeholder="cm" />
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-slate-500 uppercase block mb-1">몸무게 (kg)</label>
                            <input type="number" value={profile.weight} onChange={e => setProfile({...profile, weight: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white focus:ring-2 focus:ring-blue-500 outline-none" placeholder="kg" />
                        </div>
                    </div>

                    <div className="pt-4 border-t border-slate-800">
                        <label className="text-xs font-black text-blue-400 uppercase block mb-4">인바디 정보</label>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-[10px] font-black text-slate-500 uppercase block mb-1">골격근량 (kg)</label>
                                <input type="number" value={profile.skeletal_muscle_mass} onChange={e => setProfile({...profile, skeletal_muscle_mass: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white focus:ring-2 focus:ring-blue-500 outline-none" />
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-slate-500 uppercase block mb-1">체지방량 (kg)</label>
                                <input type="number" value={profile.body_fat_mass} onChange={e => setProfile({...profile, body_fat_mass: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white focus:ring-2 focus:ring-blue-500 outline-none" />
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-slate-500 uppercase block mb-1">체지방률 (%)</label>
                                <input type="number" value={profile.body_fat_percentage} onChange={e => setProfile({...profile, body_fat_percentage: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white focus:ring-2 focus:ring-blue-500 outline-none" />
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-slate-500 uppercase block mb-1">기초대사량 (kcal)</label>
                                <input type="number" value={profile.bmr} onChange={e => setProfile({...profile, bmr: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white focus:ring-2 focus:ring-blue-500 outline-none" />
                            </div>
                            <div className="col-span-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase block mb-1">내장지방레벨</label>
                                <input type="number" value={profile.visceral_fat_level} onChange={e => setProfile({...profile, visceral_fat_level: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white focus:ring-2 focus:ring-blue-500 outline-none" />
                            </div>
                        </div>
                    </div>

                    <div className="pt-6 flex gap-3">
                        <button onClick={onClose} className="flex-1 py-4 bg-slate-800 text-white font-bold rounded-xl transition-all hover:bg-slate-700">취소</button>
                        <button onClick={handleSave} disabled={isSaving} className="flex-1 py-4 bg-blue-600 text-white font-bold rounded-xl transition-all shadow-lg shadow-blue-600/20 hover:bg-blue-500 disabled:opacity-50">{isSaving ? '저장 중...' : '저장하기'}</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

/**
 * [Common: Exercise Detail Modal]
 */
const ExerciseModal = ({ exercise, onClose }) => {
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
    const [modalExercise, setModalExercise] = useState(null);
    const [manualName, setManualName] = useState(selection.manualName || '');

    useEffect(() => {
        if (selection.manualName !== undefined && selection.manualName !== manualName) {
            setManualName(selection.manualName);
        }
    }, [selection.manualName]);

    const bodyParts = [
        { key: 'chest', label: '가슴' },
        { key: 'shoulders', label: '어깨' },
        { key: 'back_part', label: '등' },
        { key: 'legs', label: '하체' },
        { key: 'arms', label: '팔' },
        { key: 'cardio', label: '유산소' }
    ];

    const categories = ['머신', '프리웨이트', '케이블'];

    const handlePartClick = (p) => {
        setSelection({ part: p, category: '', exercise: '', manualName: '' });
        setManualName('');
    };

    const handleCategoryClick = (c) => {
        setSelection({ ...selection, category: c, exercise: '', manualName: '' });
        setManualName('');
    };

    const handleExerciseClick = (exName) => {
        const isManual = exName === '직접 입력';
        setSelection({ ...selection, exercise: exName, manualName: isManual ? manualName : '' });
        if (onExerciseSelect && !isManual) onExerciseSelect(exName);
    };

    const handleManualNameChange = (val) => {
        setManualName(val);
        setSelection({ ...selection, manualName: val });
    };

    const filteredExercises = useMemo(() => {
        if (!selection.part) return [];
        if (selection.part === 'cardio') {
            return CUSTOM_EXERCISES.filter(ex => ex.part === 'cardio');
        }
        if (!selection.category) return [];
        return CUSTOM_EXERCISES.filter(ex => ex.part === selection.part && ex.equipment === selection.category);
    }, [selection.part, selection.category]);

    return (
        <div className="space-y-8">
            {/* Selection Summary */}
            {(selection.part || selection.category || selection.exercise) && (
                <div className="p-4 bg-blue-600/10 border border-blue-500/20 rounded-2xl animate-fade-in">
                    <div className="flex flex-wrap items-center gap-2 text-[10px] font-black text-blue-400 uppercase tracking-widest">
                        {selection.part && <span>{bodyParts.find(p => p.key === selection.part)?.label}</span>}
                        {selection.category && (
                            <>
                                <svg className="w-3 h-3 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7"/></svg>
                                <span>{selection.category}</span>
                            </>
                        )}
                        {selection.exercise && (
                            <>
                                <svg className="w-3 h-3 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7"/></svg>
                                <span className="text-white">{selection.exercise === '직접 입력' ? (selection.manualName || '직접 입력 중...') : selection.exercise}</span>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* Step 1: Body Part */}
            <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4 block px-1">Step 1. 부위 선택</label>
                <div className="grid grid-cols-3 gap-2">
                    {bodyParts.map(p => (
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

            {/* Step 2: Category (Weightlifting only) */}
            {selection.part && selection.part !== 'cardio' && (
                <div className="animate-fade-in">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4 block px-1">Step 2. 기구 분류</label>
                    <div className="grid grid-cols-3 gap-2">
                        {categories.map(c => (
                            <button 
                                key={c} 
                                onClick={() => handleCategoryClick(c)} 
                                className={`py-4 rounded-2xl font-black text-xs tracking-tighter transition-all duration-300 ${selection.category === c ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/30 ring-2 ring-indigo-400/50' : 'bg-slate-800/50 text-slate-400 hover:bg-slate-800 hover:text-slate-200 border border-slate-700/50'}`}
                            >
                                {c}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Step 3: Exercise Selection */}
            {(selection.part === 'cardio' || selection.category) && (
                <div className="animate-fade-in space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] block mb-4 px-1">Step {selection.part === 'cardio' ? '2' : '3'}. 종목 선택</label>
                    
                    {filteredExercises.map((ex) => (
                        <div key={ex.id} className="space-y-3">
                            <div 
                                onClick={() => handleExerciseClick(ex.name)}
                                className={`group relative flex items-center justify-between p-4 rounded-[1.5rem] cursor-pointer transition-all duration-500 border ${selection.exercise === ex.name ? 'bg-blue-600/10 border-blue-500 ring-1 ring-blue-500/50' : 'bg-slate-800/30 border-white/5 hover:border-slate-600 hover:bg-slate-800/50'}`}
                            >
                                <div className="flex items-center gap-4">
                                    <div>
                                        <p className={`text-base font-black italic tracking-tight uppercase transition-colors ${selection.exercise === ex.name ? 'text-blue-400' : 'text-white'}`}>{ex.name}</p>
                                        <div className="flex gap-2 mt-1">
                                            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">{ex.equipment}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            {ex.name === '직접 입력' && selection.exercise === '직접 입력' && (
                                <div className="px-2 animate-slide-down">
                                    <input 
                                        type="text" 
                                        value={manualName}
                                        onChange={(e) => handleManualNameChange(e.target.value)}
                                        onBlur={() => { if(onExerciseSelect && manualName.trim()) onExerciseSelect('직접 입력'); }}
                                        placeholder="운동 이름 입력"
                                        className="w-full bg-slate-900 border border-blue-500/50 rounded-xl p-3 text-white placeholder-slate-600 focus:ring-2 focus:ring-blue-500 outline-none text-sm font-bold"
                                    />
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
            
            <ExerciseModal exercise={modalExercise} onClose={() => setModalExercise(null)} />
        </div>
    );
};

const BackButton = () => {
    const navigate = useNavigate();
    return (
        <button onClick={() => navigate('/dashboard')} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-6 group">
            <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
            <span className="font-medium">돌아가기</span>
        </button>
    );
};

/**
 * [Screen 1: Login and Sign Up]
 */
const LoginScreen = () => {
    const [isSignup, setIsSignup] = useState(false);
    
    // 폼 상태 관리
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [passwordConfirm, setPasswordConfirm] = useState('');
    
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

    // 소셜 로그인 (Google)
    const handleGoogleLogin = async () => {
        const { error } = await supabase.auth.signInWithOAuth({ 
            provider: 'google',
            options: {
                redirectTo: window.location.origin
            }
        });
        if (error) alert('구글 로그인 실패: ' + error.message);
    };

    // 상세 회원가입 및 이메일 전송 로직
    const handleSignupComplete = async () => {
        if (!email || !password) {
            alert('이메일과 비밀번호는 필수입니다.');
            return;
        }
        if (password !== passwordConfirm) {
            alert('비밀번호가 일치하지 않습니다.');
            return;
        }
        
        setIsLoading(true);
        const { data, error } = await supabase.auth.signUp({ 
            email, 
            password
        });
        setIsLoading(false);

        if (error) {
            alert('회원가입 실패: ' + error.message);
        } else {
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
                <div className="w-full max-sm space-y-8">
                    <button onClick={() => setIsSignup(false)} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-4 group">
                        <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
                        <span className="font-medium">돌아가기</span>
                    </button>
                    <div className="text-center">
                        <h2 className="text-4xl font-black italic tracking-tighter text-white uppercase">회원가입</h2>
                        <p className="mt-2 text-slate-400 font-medium">간편하게 가입하고 운동 기록을 시작하세요.</p>
                    </div>
                    
                    <div className="space-y-6 bg-slate-900/50 p-8 rounded-3xl border border-slate-800 shadow-2xl">
                        <div className="space-y-4">
                            <input
                                type="email"
                                placeholder="이메일 주소"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-slate-500 transition-all"
                            />
                            <input
                                type="password"
                                placeholder="비밀번호"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                            <input
                                type="password"
                                placeholder="비밀번호 확인"
                                value={passwordConfirm}
                                onChange={(e) => setPasswordConfirm(e.target.value)}
                                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>

                        <div className="pt-4">
                            <button
                                onClick={handleSignupComplete}
                                disabled={isLoading}
                                className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-blue-500/20 active:scale-95 transition-all mb-4"
                            >
                                {isLoading ? '처리 중...' : '가입 완료'}
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
            <div className="mb-12 text-center">
                <h1 className="text-6xl font-extrabold italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-indigo-600">
                    MyGym
                </h1>
                <p className="mt-2 text-gray-400 font-medium tracking-wide uppercase">LEVEL UP YOUR LIMITS</p>
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
                        placeholder="비밀번호"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full px-4 py-4 bg-slate-800 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-slate-500 transition-all"
                    />
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={handleLogin}
                        disabled={isLoading}
                        className="flex-1 py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg shadow-blue-600/20 active:scale-95 transition-all"
                    >
                        {isLoading ? '로딩중...' : '로그인'}
                    </button>
                    <button
                        onClick={() => setIsSignup(true)}
                        className="flex-1 py-4 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-xl active:scale-95 transition-all"
                    >
                        회원가입
                    </button>
                </div>
                <div className="pt-2">
                    <button
                        onClick={handleGoogleLogin}
                        className="w-full py-4 bg-white hover:bg-gray-100 text-slate-900 font-bold rounded-xl shadow-lg active:scale-95 transition-all flex items-center justify-center gap-3"
                    >
                        <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5" alt="G" />
                        Google로 시작하기
                    </button>
                </div>
            </div>
        </div>
    );
};

const WorkoutDetailScreen = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [searchParams] = useSearchParams();
    const queryDate = searchParams.get('date');
    const { date: dateStrFromState } = location.state || { date: '?' };
    
    const [logs, setLogs] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchLogs = async () => {
        if (!queryDate) return;
        setIsLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const start = `${queryDate}T00:00:00`;
            const end = `${queryDate}T23:59:59`;

            const { data, error } = await supabase
                .from('workout_logs')
                .select('*')
                .eq('user_id', user.id)
                .gte('created_at', start)
                .lte('created_at', end)
                .order('created_at', { ascending: true });

            if (error) throw error;
            setLogs(data || []);
        } catch (error) {
            console.error("Error fetching logs:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();
    }, [queryDate]);

    const handleDelete = async (id) => {
        if (!confirm('정말 삭제하시겠습니까?')) return;
        const { error } = await supabase.from('workout_logs').delete().eq('id', id);
        if (error) {
            alert('삭제 실패: ' + error.message);
        } else {
            alert('삭제되었습니다.');
            fetchLogs();
        }
    };

    const handleEdit = (log) => {
        navigate(`/routine-record?id=${log.id}&date=${queryDate}`);
    };
    
    return (
        <div className="p-4 md:p-12 max-w-4xl mx-auto animate-fade-in bg-slate-950 min-h-screen relative">
            <BackButton />
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <h2 className="text-3xl font-black italic tracking-tighter text-white">
                    {dateStrFromState} 트레이닝 상세
                </h2>
                <button 
                    onClick={() => navigate(`/routine-record${queryDate ? `?date=${queryDate}` : ''}`)}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg shadow-blue-600/20 active:scale-95 transition-all text-center"
                >
                    운동 추가하기
                </button>
            </div>

            <div className="space-y-4">
                {isLoading ? (
                    <div className="py-20 text-center text-slate-500 italic">기록을 불러오는 중...</div>
                ) : logs.length === 0 ? (
                    <div className="py-20 text-center bg-slate-900/50 rounded-[2rem] border border-dashed border-slate-800">
                        <p className="text-slate-500 italic">운동 기록이 없습니다.</p>
                    </div>
                ) : (
                    logs.map((log, idx) => (
                        <div key={log.id || idx} className="bg-slate-900/40 border border-white/5 p-4 md:p-6 rounded-[1.5rem] shadow-2xl relative overflow-hidden group">
                            <div className="absolute top-0 left-0 w-1 h-full bg-blue-600"></div>
                            <div className="flex items-center justify-between mb-3">
                                <div>
                                    <div className="flex gap-1 mb-1">
                                        <span className="bg-blue-600 text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest text-white">
                                            {log.part === 'chest' ? '가슴' : log.part === 'back_part' ? '등' : log.part === 'legs' ? '하체' : log.part === 'shoulders' ? '어깨' : log.part === 'arms' ? '팔' : log.part === 'cardio' ? '유산소' : log.part}
                                        </span>
                                        <span className="bg-slate-800 text-slate-400 text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest border border-slate-700">
                                            {log.type}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <h3 className="text-lg md:text-xl font-black italic text-white uppercase tracking-tighter leading-none">{log.exercise}</h3>
                                        {log.part !== 'cardio' && <span className="text-xs font-black text-slate-500 italic uppercase leading-none">{log.sets_count} SETS</span>}
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button 
                                        onClick={() => handleEdit(log)}
                                        className="p-2 bg-slate-800 hover:bg-blue-600 text-slate-400 hover:text-white rounded-lg transition-all"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                    </button>
                                    <button 
                                        onClick={() => handleDelete(log.id)}
                                        className="p-2 bg-slate-800 hover:bg-rose-600 text-slate-400 hover:text-white rounded-lg transition-all"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-1">
                                {log.part === 'cardio' ? (
                                    <div className="flex items-center justify-between py-3 px-4 bg-slate-950/50 rounded-lg border border-white/5 transition-all hover:border-blue-500/30">
                                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">DURATION</span>
                                        <span className="text-base font-black text-blue-400 italic">{log.sets_data[0]?.duration || '0분 0초'}</span>
                                    </div>
                                ) : (
                                    log.sets_data.map((s, sIdx) => (
                                        <div key={sIdx} className="flex items-center justify-between py-1.5 px-4 bg-slate-950/50 rounded-lg border border-white/5 transition-all hover:border-blue-500/30">
                                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{sIdx + 1} SET</span>
                                            <div className="flex gap-4 items-center">
                                                <span className="text-xs font-bold text-white w-12 text-right">{s.weight}kg</span>
                                                <span className="text-xs font-bold text-blue-400 w-12 text-right">{s.reps} r</span>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

const WorkoutSetupScreen = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [step, setStep] = useState(1);
    const [selection, setSelection] = useState({ part: '', category: '', exercise: '', manualName: '' });
    const [setsData, setSetsData] = useState([{ weight: '', reps: '' }]);
    const [cardioMinutes, setCardioMinutes] = useState('');
    const [cardioSeconds, setCardioSeconds] = useState('');
    const [addedExercises, setAddedExercises] = useState([]);
    const [isSaving, setIsSaving] = useState(false);
    const [isInitialLoading, setIsInitialLoading] = useState(false);
    const [lastRecord, setLastRecord] = useState(null);

    const queryDate = searchParams.get('date');
    const editId = searchParams.get('id');

    // Fetch last record when exercise is selected
    useEffect(() => {
        const fetchLastRecord = async () => {
            const exerciseName = selection.exercise === '직접 입력' ? selection.manualName : selection.exercise;
            if (!exerciseName) {
                setLastRecord(null);
                return;
            }

            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) return;

                const { data, error } = await supabase
                    .from('workout_logs')
                    .select('sets_data')
                    .eq('user_id', user.id)
                    .eq('exercise', exerciseName)
                    .order('created_at', { ascending: false })
                    .limit(1);

                if (error) throw error;
                if (data && data.length > 0) {
                    const lastSets = data[0].sets_data;
                    if (lastSets && lastSets.length > 0) {
                        // Use the first set of the last session as a representative record
                        setLastRecord(lastSets[0]);
                    }
                } else {
                    setLastRecord(null);
                }
            } catch (err) {
                console.error("Error fetching last record:", err);
            }
        };

        fetchLastRecord();
    }, [selection.exercise, selection.manualName]);

    useEffect(() => {
        const fetchExistingLog = async () => {
            if (!editId) return;
            setIsInitialLoading(true);
            try {
                const { data, error } = await supabase
                    .from('workout_logs')
                    .select('*')
                    .eq('id', editId)
                    .single();

                if (error) throw error;
                if (data) {
                    setSelection({
                        part: data.part,
                        category: data.type,
                        exercise: CUSTOM_EXERCISES.find(ex => ex.name === data.exercise) ? data.exercise : '직접 입력',
                        manualName: CUSTOM_EXERCISES.find(ex => ex.name === data.exercise) ? '' : data.exercise
                    });
                    
                    if (data.part === 'cardio') {
                        const durationMatch = data.sets_data[0]?.duration?.match(/(\d+)분 (\d+)초/);
                        if (durationMatch) {
                            setCardioMinutes(durationMatch[1]);
                            setCardioSeconds(durationMatch[2]);
                        }
                    } else {
                        setSetsData(data.sets_data);
                    }
                    setStep(4);
                }
            } catch (err) {
                console.error("Error fetching log for edit:", err);
                alert("기록을 불러오지 못했습니다.");
            } finally {
                setIsInitialLoading(false);
            }
        };

        fetchExistingLog();
    }, [editId]);

    const handleAddSet = () => {
        const lastSet = setsData[setsData.length - 1];
        setSetsData([...setsData, { weight: lastSet.weight, reps: lastSet.reps }]);
    };

    const handleDeleteSet = (index) => {
        if (setsData.length <= 1) return;
        setSetsData(setsData.filter((_, i) => i !== index));
    };

    const handleSetDataChange = (index, field, value) => {
        const newData = [...setsData];
        newData[index] = { ...newData[index], [field]: value };
        setSetsData(newData);
    };

    const handleLoadLastRecord = () => {
        if (!lastRecord) return;
        const newData = setsData.map(s => ({
            weight: lastRecord.weight || '',
            reps: lastRecord.reps || ''
        }));
        setSetsData(newData);
    };

    const isRecordEnabled = useMemo(() => {
        const isExerciseReady = selection.exercise !== '' && (selection.exercise !== '직접 입력' || (selection.manualName && selection.manualName.trim() !== ''));
        if (!isExerciseReady) return false;

        if (selection.part === 'cardio') {
            const mins = parseInt(cardioMinutes) || 0;
            const secs = parseInt(cardioSeconds) || 0;
            return mins >= 0 && secs >= 0 && (mins > 0 || secs > 0);
        } else {
            const allSetsFilled = setsData.length > 0 && setsData.every(s => s.weight !== '' && s.reps !== '' && parseFloat(s.weight) >= 0 && parseInt(s.reps) > 0);
            return allSetsFilled;
        }
    }, [setsData, selection, cardioMinutes, cardioSeconds]);

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

            const exerciseName = selection.exercise === '직접 입력' ? selection.manualName : selection.exercise;
            const exInfo = CUSTOM_EXERCISES.find(ex => ex.name === selection.exercise && ex.part === selection.part);

            const finalSetsData = selection.part === 'cardio' 
                ? [{ duration: `${cardioMinutes || 0}분 ${cardioSeconds || 0}초` }] 
                : setsData;

            // Determine target date
            let targetDate = queryDate ? new Date(queryDate) : new Date();
            if (queryDate) {
                targetDate.setHours(12, 0, 0, 0);
            }

            const logData = {
                user_id: user.id,
                part: selection.part,
                type: exInfo?.equipment || selection.category || '기타',
                exercise: exerciseName,
                sets_count: selection.part === 'cardio' ? 1 : setsData.length,
                sets_data: finalSetsData,
                is_completed: true
            };

            if (editId) {
                const { error } = await supabase
                    .from('workout_logs')
                    .update(logData)
                    .eq('id', editId);
                if (error) throw error;
                alert('기록이 수정되었습니다!');
                navigate(-1);
            } else {
                const { error } = await supabase
                    .from('workout_logs')
                    .insert([{ ...logData, created_at: targetDate.toISOString() }]);
                if (error) throw error;
                alert('성공적으로 기록이 저장되었습니다!');
                setAddedExercises([...addedExercises, { ...logData, id: Date.now() }]);
                setSetsData([{ weight: '', reps: '' }]);
                setCardioMinutes('');
                setCardioSeconds('');
                setStep(1);
                setSelection({ part: '', category: '', exercise: '', manualName: '' });
            }

        } catch (error) {
            console.error('Error saving workout:', error);
            alert('저장 중 오류가 발생했습니다: ' + error.message);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteLog = (id) => {
        if (confirm('이 기록을 화면에서 지우시겠습니까? (DB에서는 삭제되지 않습니다)')) {
            setAddedExercises(prev => prev.filter(ex => ex.id !== id));
        }
    };

    return (
        <div className="p-8 md:p-12 max-w-4xl mx-auto animate-fade-in bg-slate-950 min-h-screen relative">
            <BackButton />
            <div className="mb-8">
                <h2 className="text-3xl font-black italic text-white uppercase tracking-tighter underline decoration-blue-500 decoration-4 underline-offset-8">
                    루틴 기록
                </h2>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-6">
                    <ExerciseSelector selection={selection} setSelection={setSelection} onExerciseSelect={() => setStep(4)} />
                    
                    {step >= 4 && (
                        <div className="animate-fade-in space-y-6 bg-slate-800/30 p-6 rounded-2xl border border-slate-700">
                            {selection.part === 'cardio' ? (
                                <div className="space-y-4">
                                    <label className="text-[10px] font-bold text-blue-500 uppercase block tracking-widest">운동 시간 입력</label>
                                    <div className="flex items-center gap-4 bg-slate-900/50 p-4 rounded-xl border border-slate-800">
                                        <div className="flex-1 flex items-center gap-2">
                                            <input type="number" value={cardioMinutes} onChange={e => setCardioMinutes(e.target.value)} className="w-full bg-slate-900 border border-slate-700 p-3 rounded-lg text-white text-right font-bold focus:border-blue-500 outline-none" placeholder="0" />
                                            <span className="text-slate-400 font-bold">분</span>
                                        </div>
                                        <div className="flex-1 flex items-center gap-2">
                                            <input type="number" value={cardioSeconds} onChange={e => setCardioSeconds(e.target.value)} className="w-full bg-slate-900 border border-slate-700 p-3 rounded-lg text-white text-right font-bold focus:border-blue-500 outline-none placeholder-slate-700" placeholder="0" />
                                            <span className="text-slate-400 font-bold">초</span>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="flex justify-between items-end px-1">
                                        <label className="text-[10px] font-bold text-blue-500 uppercase block tracking-widest">세트별 상세 기록 (KG / REPS)</label>
                                        {lastRecord && (
                                            <div className="flex flex-col items-end">
                                                <span className="text-[9px] font-black text-slate-500 uppercase italic">Last: {lastRecord.weight}kg x {lastRecord.reps}회</span>
                                                <button onClick={handleLoadLastRecord} className="text-[9px] font-black text-blue-400 uppercase hover:underline">기록 불러오기</button>
                                            </div>
                                        )}
                                    </div>
                                    <div className="space-y-2">
                                        {setsData.map((s, idx) => (
                                            <div key={idx} className="flex items-center gap-3 bg-slate-900/50 p-3 rounded-xl border border-slate-800 group transition-all hover:border-slate-600">
                                                <span className="text-xs font-bold text-slate-600 w-8">{idx + 1}S</span>
                                                <div className="flex-1 flex gap-2">
                                                    <div className="flex-1 relative">
                                                        <input type="number" value={s.weight} onChange={(e) => handleSetDataChange(idx, 'weight', e.target.value)} className="w-full bg-slate-900 border border-slate-700 p-2 rounded-lg text-white text-right font-bold focus:border-blue-500 outline-none text-sm placeholder:text-slate-800" placeholder={lastRecord?.weight || "KG"} />
                                                    </div>
                                                    <div className="flex-1 relative">
                                                        <input type="number" value={s.reps} onChange={(e) => handleSetDataChange(idx, 'reps', e.target.value)} className="w-full bg-slate-900 border border-slate-700 p-2 rounded-lg text-white text-right font-bold focus:border-blue-500 outline-none text-sm placeholder:text-slate-800" placeholder={lastRecord?.reps || "REPS"} />
                                                    </div>
                                                </div>
                                                {setsData.length > 1 && (
                                                    <button onClick={() => handleDeleteSet(idx)} className="p-2 text-slate-600 hover:text-rose-500 transition-colors">
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                    <button 
                                        onClick={handleAddSet}
                                        className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs border border-white/5 transition-all active:scale-95"
                                    >
                                        + 세트 추가
                                    </button>
                                </div>
                            )}
                            <button 
                                onClick={handleAddOrUpdateExercise} 
                                disabled={!isRecordEnabled || isSaving} 
                                className={`w-full py-4 font-black rounded-xl italic tracking-tighter transition-all ${isRecordEnabled && !isSaving ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/20' : 'bg-slate-700 text-slate-500 cursor-not-allowed'}`}
                            >
                                {isSaving ? '저장 중...' : '기록하기'}
                            </button>
                        </div>
                    )}
                </div>
                <div className="bg-slate-900/50 rounded-3xl border border-slate-800 p-6">
                    <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2"><span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>현재 세션에 추가된 기록 ({addedExercises.length})</h3>
                    <div className="space-y-4">
                        {addedExercises.length === 0 ? (<p className="text-slate-600 text-center py-12 italic text-sm">기록된 루틴이 없습니다.</p>) : (addedExercises.map((ex, idx) => (
                            <div key={ex.id} className="bg-slate-800 p-4 rounded-xl border border-slate-700 group relative">
                                <div className="flex justify-between items-start mb-3">
                                    <div>
                                        <span className="text-[10px] font-bold text-blue-400 block uppercase">
                                            {ex.part === 'chest' ? '가슴' : ex.part === 'back_part' ? '등' : ex.part === 'legs' ? '하체' : ex.part === 'shoulders' ? '어깨' : ex.part === 'arms' ? '팔' : ex.part === 'cardio' ? '유산소' : ex.part} / {ex.type}
                                        </span>
                                        <span className="font-bold text-white text-lg">{ex.exercise}</span>
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={() => handleDeleteLog(ex.id)} className="p-2 bg-slate-700 hover:bg-rose-600 text-white rounded-lg transition-colors"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                                    </div>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {ex.part === 'cardio' ? (
                                        <div className="px-4 py-2 bg-slate-900 rounded-lg border border-slate-700">
                                            <span className="text-blue-400 font-black italic">{ex.sets_data[0]?.duration}</span>
                                        </div>
                                    ) : (
                                        ex.sets_data.map((s, i) => (
                                            <div key={i} className="px-3 py-1 bg-slate-900 rounded-lg border border-slate-700 text-[11px] flex flex-col items-center min-w-[50px]">
                                                <span className="text-slate-500 text-[9px] mb-1">{i+1}S</span>
                                                <span className="text-white font-bold">{s.weight}kg</span>
                                                <span className="text-indigo-400 font-medium">{s.reps}R</span>
                                            </div>
                                        ))
                                    )}
                                </div>
                                <div className="mt-3 text-right"><span className="text-xs font-bold text-slate-500 uppercase">{ex.part === 'cardio' ? 'Cardio Session' : `Total ${ex.sets_count} Sets`}</span></div>
                            </div>
                        )))}
                    </div>
                </div>
            </div>
        </div>
    );
};

const WorkoutPlanScreen = () => {
    const [searchParams] = useSearchParams();
    const [selection, setSelection] = useState({ part: '', category: '', exercise: '', manualName: '' });
    const [planList, setPlanList] = useState(() => {
        const saved = localStorage.getItem('mygym_today_routine');
        return saved ? JSON.parse(saved) : [];
    });
    const [recordingIndex, setRecordingIndex] = useState(null);
    const [setsData, setSetsData] = useState([]);
    const [cardioMinutes, setCardioMinutes] = useState('');
    const [cardioSeconds, setCardioSeconds] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [lastRecord, setLastRecord] = useState(null);

    const queryDate = searchParams.get('date');

    useEffect(() => {
        localStorage.setItem('mygym_today_routine', JSON.stringify(planList));
    }, [planList]);

    const handleAddToList = () => {
        if (!selection.exercise || (selection.exercise === '직접 입력' && (!selection.manualName || !selection.manualName.trim()))) return;
        const newItem = {
            id: Date.now(),
            part: selection.part,
            category: selection.category,
            exercise: selection.exercise,
            manualName: selection.manualName,
            isCompleted: false
        };
        setPlanList([...planList, newItem]);
        setSelection({ part: '', category: '', exercise: '', manualName: '' });
    };

    const startRecording = async (index) => {
        const item = planList[index];
        const exerciseName = item.exercise === '직접 입력' ? item.manualName : item.exercise;
        
        setRecordingIndex(index);
        setCardioMinutes('');
        setCardioSeconds('');
        setLastRecord(null);

        // Fetch last record
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data, error } = await supabase
                    .from('workout_logs')
                    .select('sets_data')
                    .eq('user_id', user.id)
                    .eq('exercise', exerciseName)
                    .order('created_at', { ascending: false })
                    .limit(1);

                if (!error && data && data.length > 0) {
                    setLastRecord(data[0].sets_data[0]);
                }
            }
        } catch (e) { console.error(e); }

        // Use AI suggested values if available, otherwise fetch last record or default
        if (item.suggestedWeight !== undefined || item.suggestedReps !== undefined) {
            setSetsData([{ weight: item.suggestedWeight || '', reps: item.suggestedReps || '' }]);
        } else {
            setSetsData([{ weight: '', reps: '' }]);
        }
    };

    const handleAddSet = () => {
        const lastSet = setsData[setsData.length - 1];
        setSetsData([...setsData, { weight: lastSet.weight, reps: lastSet.reps }]);
    };

    const handleDeleteSet = (index) => {
        if (setsData.length <= 1) return;
        setSetsData(setsData.filter((_, i) => i !== index));
    };

    const handleSetDataChange = (index, field, value) => {
        const newData = [...setsData];
        newData[index] = { ...newData[index], [field]: value };
        setSetsData(newData);
    };

    const handleLoadLastRecord = () => {
        if (!lastRecord) return;
        const newData = setsData.map(s => ({
            weight: lastRecord.weight || '',
            reps: lastRecord.reps || ''
        }));
        setSetsData(newData);
    };

    const handleFinishRecording = async () => {
        if (recordingIndex === null || isSaving) return;
        
        const targetExercise = planList[recordingIndex];
        let finalSetsData = [];
        let finalSetsCount = 0;

        if (targetExercise.part === 'cardio') {
            const mins = parseInt(cardioMinutes) || 0;
            const secs = parseInt(cardioSeconds) || 0;
            if (mins <= 0 && secs <= 0) {
                alert('운동 시간을 입력해주세요.');
                return;
            }
            finalSetsData = [{ duration: `${mins}분 ${secs}초` }];
            finalSetsCount = 1;
        } else {
            const allSetsFilled = setsData.length > 0 && setsData.every(s => s.weight !== '' && s.reps !== '');
            if (!allSetsFilled) {
                alert('모든 세트의 정보를 입력해주세요.');
                return;
            }
            finalSetsData = setsData;
            finalSetsCount = setsData.length;
        }

        setIsSaving(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('로그인이 필요합니다.');

            const exerciseName = targetExercise.exercise === '직접 입력' ? targetExercise.manualName : targetExercise.exercise;
            const exInfo = CUSTOM_EXERCISES.find(ex => ex.name === targetExercise.exercise && ex.part === targetExercise.part);

            // Determine target date
            const targetDate = queryDate ? new Date(queryDate) : new Date();
            if (queryDate) {
                targetDate.setHours(12, 0, 0, 0);
            }

            const newLog = {
                user_id: user.id,
                part: targetExercise.part,
                type: exInfo?.equipment || targetExercise.category || '기타',
                exercise: exerciseName,
                sets_count: finalSetsCount,
                sets_data: finalSetsData,
                is_completed: true,
                created_at: targetDate.toISOString()
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

    const handleDeleteFromList = (id) => {
        if (!confirm('이 운동을 리스트에서 삭제하시겠습니까?')) return;
        setPlanList(prev => prev.filter(item => item.id !== id));
    };

    // Helper component to fetch and display PR for an exercise
    const PersonalRecordDisplay = ({ exerciseName }) => {
        const [pr, setPr] = useState(null);

        useEffect(() => {
            const fetchPR = async () => {
                try {
                    const { data: { user } } = await supabase.auth.getUser();
                    if (!user) return;

                    const { data, error } = await supabase
                        .from('workout_logs')
                        .select('sets_data')
                        .eq('user_id', user.id)
                        .eq('exercise', exerciseName);

                    if (error) throw error;
                    
                    if (data && data.length > 0) {
                        let maxWeight = 0;
                        let maxReps = 0;
                        
                        data.forEach(log => {
                            log.sets_data.forEach(set => {
                                const w = parseFloat(set.weight) || 0;
                                const r = parseInt(set.reps) || 0;
                                if (w > maxWeight || (w === maxWeight && r > maxReps)) {
                                    maxWeight = w;
                                    maxReps = r;
                                }
                            });
                        });
                        
                        if (maxWeight > 0) {
                            setPr({ weight: maxWeight, reps: maxReps });
                        }
                    }
                } catch (e) {
                    console.error("PR fetch error", e);
                }
            };
            fetchPR();
        }, [exerciseName]);

        if (!pr) return null;
        return (
            <span className="text-[10px] font-black text-slate-500 ml-2 italic lowercase opacity-80">
                (best: {pr.weight}kg x {pr.reps}회)
            </span>
        );
    };

    return (
        <div className="p-6 md:p-12 max-w-6xl mx-auto animate-fade-in bg-slate-950 min-h-screen relative">
            <BackButton />
            
            <div className="mb-8">
                <h2 className="text-3xl font-black italic text-white uppercase tracking-tighter underline decoration-indigo-500 decoration-4 underline-offset-8">
                    루틴 구성
                </h2>
                <p className="text-slate-400 mt-2 font-medium">오늘 수행할 운동들을 미리 구성하고 기록해보세요.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                {/* 왼쪽: 운동 추가 */}
                <div className="space-y-6">
                    <div className="bg-slate-900/50 p-6 rounded-3xl border border-slate-800">
                        <ExerciseSelector selection={selection} setSelection={setSelection} />
                        {(selection.exercise && (selection.exercise !== '직접 입력' || (selection.manualName && selection.manualName.trim()))) && (
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
                                    <div key={item.id} className={`p-5 rounded-2xl border transition-all ${item.isCompleted ? 'bg-slate-800/20 border-emerald-500/30' : 'bg-slate-800/60 border-slate-700 hover:border-slate-500'}`}>
                                        <div className="flex justify-between items-start">
                                            <div className="flex-1">
                                                <span className="text-[10px] font-bold text-indigo-400 block uppercase mb-1">
                                                    {item.part === 'chest' ? '가슴' : item.part === 'back_part' ? '등' : item.part === 'legs' ? '하체' : item.part === 'shoulders' ? '어깨' : item.part === 'arms' ? '팔' : item.part === 'cardio' ? '유산소' : item.part}
                                                    {item.category && ` / ${item.category}`}
                                                </span>
                                                <h4 className={`text-lg font-bold flex items-center flex-wrap ${item.isCompleted ? 'text-slate-500 line-through' : 'text-white'}`}>
                                                    {item.exercise === '직접 입력' ? item.manualName : item.exercise}
                                                    {item.part !== 'cardio' && <PersonalRecordDisplay exerciseName={item.exercise === '직접 입력' ? item.manualName : item.exercise} />}
                                                </h4>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {item.isCompleted ? (
                                                    <div className="flex items-center gap-2 text-emerald-400 font-black italic text-sm">
                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                                                        COMPLETED
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-2">
                                                        <button 
                                                            onClick={() => startRecording(idx)}
                                                            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-black italic rounded-lg transition-all active:scale-95 shadow-lg shadow-blue-600/20"
                                                        >
                                                            기록하기
                                                        </button>
                                                        <button 
                                                            onClick={() => handleDeleteFromList(item.id)}
                                                            className="p-2 bg-slate-700/50 hover:bg-rose-600/80 text-slate-400 hover:text-white rounded-lg transition-all active:scale-90 border border-white/5"
                                                        >
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* 기록 폼 (해당 아이템을 기록 중일 때만 표시) */}
                                        {recordingIndex === idx && (
                                            <div className="mt-6 pt-6 border-t border-slate-700 space-y-4 animate-slide-down">
                                                {item.part === 'cardio' ? (
                                                    <div className="space-y-4">
                                                        <label className="text-xs font-bold text-slate-400">운동 시간</label>
                                                        <div className="flex items-center gap-3">
                                                            <div className="flex-1 flex items-center bg-slate-900 border border-slate-700 rounded-lg px-3">
                                                                <input type="number" value={cardioMinutes} onChange={e => setCardioMinutes(e.target.value)} placeholder="0" className="w-full bg-transparent p-2 text-white text-right font-bold outline-none text-xs" />
                                                                <span className="text-[10px] text-slate-500 font-bold ml-1">분</span>
                                                            </div>
                                                            <div className="flex-1 flex items-center bg-slate-900 border border-slate-700 rounded-lg px-3">
                                                                <input type="number" value={cardioSeconds} onChange={e => setCardioSeconds(e.target.value)} placeholder="0" className="w-full bg-transparent p-2 text-white text-right font-bold outline-none text-xs" />
                                                                <span className="text-[10px] text-slate-500 font-bold ml-1">초</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <div className="flex justify-between items-end mb-2">
                                                            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">상세 기록</label>
                                                            {lastRecord && (
                                                                <button onClick={handleLoadLastRecord} className="text-[9px] font-black text-blue-400 uppercase hover:underline">기록 불러오기 ({lastRecord.weight}kg x {lastRecord.reps})</button>
                                                            )}
                                                        </div>
                                                        <div className="space-y-2">
                                                            {setsData.map((s, sIdx) => (
                                                                <div key={sIdx} className="flex gap-2 items-center">
                                                                    <div className="flex-1 flex items-center bg-slate-900 border border-slate-700 rounded-lg px-3">
                                                                        <span className="text-[10px] text-slate-500 font-bold mr-2">{sIdx + 1}S</span>
                                                                        <input 
                                                                            type="number" 
                                                                            value={s.weight} 
                                                                            onChange={(e) => handleSetDataChange(sIdx, 'weight', e.target.value)}
                                                                            placeholder={lastRecord?.weight || "KG"} 
                                                                            className="w-full bg-transparent p-2 text-white text-right font-bold outline-none text-xs"
                                                                        />
                                                                    </div>
                                                                    <div className="flex-1 flex items-center bg-slate-900 border border-slate-700 rounded-lg px-3">
                                                                        <input 
                                                                            type="number" 
                                                                            value={s.reps} 
                                                                            onChange={(e) => handleSetDataChange(sIdx, 'reps', e.target.value)}
                                                                            placeholder={lastRecord?.reps || "REPS"} 
                                                                            className="w-full bg-transparent p-2 text-white text-right font-bold outline-none text-xs"
                                                                        />
                                                                    </div>
                                                                    {setsData.length > 1 && (
                                                                        <button onClick={() => handleDeleteSet(sIdx)} className="p-1 text-slate-600 hover:text-rose-500 transition-colors">
                                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            ))}
                                                        </div>
                                                        <button 
                                                            onClick={handleAddSet}
                                                            className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-400 font-bold rounded-xl text-[10px] border border-white/5 transition-all"
                                                        >
                                                            + 세트 추가
                                                        </button>
                                                    </>
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
    const [userData, setUserData] = useState(null);
    const [recentLogs, setRecentLogs] = useState([]);
    const [messages, setMessages] = useState(() => {
        const saved = localStorage.getItem('aiCoachChatHistory');
        return saved ? JSON.parse(saved) : [
            { id: 1, type: 'ai', text: '안녕하세요! 당신의 데이터 기반 전문 PT 코치입니다. 최근 기록을 바탕으로 최적의 루틴을 제안해 드릴게요. 무엇을 도와드릴까요?' }
        ];
    });
    const [inputText, setInputText] = useState('');
    const [isTyping, setIsTyping] = useState(false);

    useEffect(() => {
        localStorage.setItem('aiCoachChatHistory', JSON.stringify(messages));
    }, [messages]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    setUserData(user.user_metadata);
                    
                    // 정교한 분석을 위해 최근 50개의 기록을 가져옴
                    const { data: logs, error } = await supabase
                        .from('workout_logs')
                        .select('*')
                        .eq('user_id', user.id)
                        .order('created_at', { ascending: false })
                        .limit(50);
                    
                    if (error) throw error;
                    setRecentLogs(logs || []);
                }
            } catch (err) {
                console.error('Data loading error:', err);
            }
        };
        fetchData();
    }, []);

    const handleClearHistory = () => {
        if (confirm('대화 내역을 모두 초기화하시겠습니까?')) {
            localStorage.removeItem('aiCoachChatHistory');
            setMessages([
                { id: 1, type: 'ai', text: '안녕하세요! 당신의 데이터 기반 전문 PT 코치입니다. 최근 기록을 바탕으로 최적의 루틴을 제안해 드릴게요. 무엇을 도와드릴까요?' }
            ]);
        }
    };

    const generateAIResponse = async (messages) => {
        try {
            const response = await openai.chat.completions.create({
                model: 'gpt-4o-mini',
                messages: messages,
                temperature: 0
            });

            return response.choices[0].message.content || "죄송합니다. 답변을 생성하는 중 오류가 발생했습니다.";
        } catch (error) {
            console.error('OpenAI API Error:', error);
            return `OpenAI Error: ${error.message}`;
        }
    };

    const handleSendMessage = async (customText = null, displayUiText = null) => {
        let textToDisplay = displayUiText || customText || inputText;
        let textForApi = customText || inputText;

        if (!textForApi.trim() || isTyping) return;

        // 1. 데이터 가공 (전체 기록 기반 부위별 최근 수행일 분석)
        const partMap = { chest: '가슴', back_part: '등', legs: '하체', shoulders: '어깨', arms: '팔', cardio: '유산소' };
        
        // 부위별 마지막 운동일 추출
        const lastTrained = {};
        recentLogs.forEach(l => {
            if (!lastTrained[l.part]) {
                lastTrained[l.part] = new Date(l.created_at).toLocaleString();
            }
        });

        const formattedHistory = recentLogs.length > 0 
            ? recentLogs.slice(0, 15).map(l => `${new Date(l.created_at).toLocaleDateString()}: ${partMap[l.part] || l.part} (${l.exercise})`).join('\n')
            : '없음';

        const userContext = `
[오늘 날짜]
${new Date().toLocaleString()}

[사용자 신체 정보]
나이: ${userData?.age || '미입력'}세, 성별: ${userData?.gender || '미입력'}, 키: ${userData?.height || '미입력'}cm, 현재 체중: ${userData?.weight || '미입력'}kg
골격근량: ${userData?.skeletal_muscle_mass || '미입력'}kg, 체지방률: ${userData?.body_fat_percentage || '미입력'}%

[부위별 마지막 운동 일시 (전수 조사 결과)]
가슴: ${lastTrained['chest'] || '기록 없음'}
등: ${lastTrained['back_part'] || '기록 없음'}
하체: ${lastTrained['legs'] || '기록 없음'}
어깨: ${lastTrained['shoulders'] || '기록 없음'}
팔: ${lastTrained['arms'] || '기록 없음'}

[최근 운동 로그]
${formattedHistory}`;

        // 타겟 선정 로직 강화 (날짜 기반 정교화)
        const TARGET_SELECTION_RULE = `
[타겟 부위 선정 로직]
1. 사용자의 전체 운동 기록을 전수 조사하여 가슴, 등, 하체 부위별로 '가장 최근에 운동한 날짜'와 오늘 날짜의 차이(휴식 일수)를 계산하라.
2. 어제(또는 24시간 이내) 운동한 부위는 오늘 추천 목록에서 절대적으로 제외하라.
3. 기록이 아예 없는 부위가 있다면 휴식 일수를 '무한대'로 간주하여 최우선으로 추천하라.
4. 가슴, 등, 하체 중 위 로직을 거쳐 휴식 일수가 가장 긴 단 하나의 타겟 부위를 선정하라.
5. '오늘의 운동루틴'과 '하드모드' 모두 반드시 이 동일한 분석 로직을 거쳐 동일한 타겟 부위를 선정해야 한다.`;

        if (textToDisplay === "오늘의 운동루틴 추천해 줘") {
            textForApi = `${TARGET_SELECTION_RULE} 
위 원칙으로 선정된 타겟 부위를 위해 반드시 4~5개 종목의 전체 루틴을 [ROUTINE_DATA] 배열에 담아줘.`;
        }

        if (textToDisplay === "⚡ 하드모드") {
            textForApi = `${TARGET_SELECTION_RULE} 
지금은 하드모드 1단계 질문이야. 분석된 타겟 부위를 말하며 '1. 볼륨업' 또는 '2. 강도업' 중 선택하라고 파이팅 넘치게 물어봐. 절대 [ROUTINE_DATA]를 출력하지 마.`;
        }

        // 사용자 메시지 추가
        const userMsg = { id: Date.now(), type: 'user', text: textToDisplay };
        setMessages(prev => [...prev, userMsg]);
        setInputText('');
        setIsTyping(true);

        const systemRole = `너는 데이터 기반 전문 PT 코치야. 

[하드모드 2단계 규칙]
사용자가 1단계 질문에 답변하면 루틴을 제공하라:
1. 타겟 고정: 이전 단계에서 분석한 타겟 부위를 절대 변경하지 마라.
2. 루틴 구성: 반드시 4~6개 종목으로 구성하라.
   - '볼륨업' 선택 시: 5~6개 종목.
   - '강도업' 선택 시: 4~5개 종목 구성, 마지막 1~2개 종목명에 '(드롭)' 포함.
3. 중량: 이전 기록보다 2.5~5kg 증량 제안 (기록 없으면 0). JSON 'weight'는 숫자만 허용.
4. 형식: 마지막에 [ROUTINE_DATA: [...]] JSON 배열 포함.

[대화 원칙]
- 말투: 3~4문장의 간결한 전문 말투. 번호 매기기 금지.
- 컨텍스트: ${userContext}`;

        const history = messages.slice(-6).map(m => ({
            role: m.type === 'ai' ? 'assistant' : 'user',
            content: m.text
        }));

        const apiMessages = [
            { role: "system", content: systemRole },
            ...history,
            { role: "user", content: textForApi }
        ];
        
        const aiText = await generateAIResponse(apiMessages);
        console.log("🔥 [1] AI 원본 응답:", aiText);
        const aiMsg = { id: Date.now() + 1, type: 'ai', text: aiText };
        setMessages(prev => [...prev, aiMsg]);
        setIsTyping(false);
    };

    const handleAddRoutineItem = (item) => {
        try {
            const saved = localStorage.getItem('mygym_today_routine');
            const currentRoutine = saved ? JSON.parse(saved) : [];
            
            // 데이터 키 유연성 보정 (궁극의 데이터 정제)
            const name = item.name || item.Name || item.운동명 || item.운동이름 || item.exercise || "알 수 없는 운동";
            const sets = item.sets || item.Sets || item.세트 || 0;
            const reps = item.reps || item.Reps || item.횟수 || item.반복수 || 0;
            const weight = item.weight || item.Weight || item.무게 || item.중량 || 0;

            // 기존 커스텀 운동 데이터에서 부위와 카테고리 정보 찾기
            const exInfo = CUSTOM_EXERCISES.find(ex => ex.name.toLowerCase().includes(name.toLowerCase()));
            
            const newItem = {
                id: Date.now() + Math.random(),
                part: exInfo?.part || 'etc',
                category: exInfo?.equipment || '기타',
                exercise: name,
                manualName: '',
                isCompleted: false,
                suggestedSets: sets,
                suggestedReps: reps,
                suggestedWeight: weight
            };

            const updatedRoutine = [...currentRoutine, newItem];
            localStorage.setItem('mygym_today_routine', JSON.stringify(updatedRoutine));
            window.dispatchEvent(new Event('storage'));
            return true;
        } catch (e) {
            console.error("Routine add error", e);
            return false;
        }
    };

    const MessageBubble = ({ msg }) => {
        const [addedItems, setAddedItems] = useState([]);

        // ROUTINE_DATA 태그를 찾기 위한 정규식 (객체 {} 또는 배열 [] 모두 대응)
        const routineRegex = /\[ROUTINE_DATA:\s*(\{.*?\}|\[.*?\])\]/gs;
        
        const parts = [];
        let lastIndex = 0;
        let match;

        while ((match = routineRegex.exec(msg.text)) !== null) {
            if (match.index > lastIndex) {
                parts.push({ type: 'text', content: msg.text.substring(lastIndex, match.index) });
            }

            try {
                const extractedText = match[1];
                console.log("🔥 [2] 추출된 JSON 문자열:", extractedText);

                // 1. 파싱
                let parsed = JSON.parse(extractedText);
                
                // 2. 객체 안에 배열이 숨어있는 경우 추출 (예: { routines: [...] })
                if (!Array.isArray(parsed)) {
                    const arrayKey = Object.keys(parsed).find(key => Array.isArray(parsed[key]));
                    parsed = arrayKey ? parsed[arrayKey] : [parsed];
                }
                
                // 3. 평탄화 및 키(Key) 강제 매핑 (궁극의 데이터 정제)
                const safeRoutineData = parsed.flat(Infinity).map(item => ({
                    name: item.name || item.Name || item.운동명 || item.운동이름 || item.exercise || "알 수 없는 운동",
                    sets: item.sets || item.Sets || item.세트 || 0,
                    reps: item.reps || item.Reps || item.횟수 || item.반복수 || 0,
                    weight: item.weight || item.Weight || item.무게 || item.중량 || 0
                }));

                console.log("🔥 [3] 정제 및 매핑 완료된 최종 데이터:", safeRoutineData);
                parts.push({ type: 'routine_list', data: safeRoutineData });
            } catch (e) {
                console.error("JSON parse error in message bubble", e);
                parts.push({ type: 'text', content: match[0] });
            }

            lastIndex = routineRegex.lastIndex;
        }

        if (lastIndex < msg.text.length) {
            parts.push({ type: 'text', content: msg.text.substring(lastIndex) });
        }

        const onAddItem = (item, itemIdx) => {
            const success = handleAddRoutineItem(item);
            if (success) {
                setAddedItems(prev => [...prev, itemIdx]);
            }
        };

        return (
            <div className={`flex flex-col ${msg.type === 'user' ? 'items-end' : 'items-start'} animate-slide-up`}>
                <div className={`max-w-[90%] p-4 rounded-[1.5rem] text-sm leading-relaxed ${
                    msg.type === 'user' 
                    ? 'bg-blue-600 text-white rounded-tr-none shadow-xl shadow-blue-600/10' 
                    : 'bg-slate-800 text-slate-200 rounded-tl-none border border-white/5'
                }`}>
                    {parts.map((part, idx) => {
                        if (part.type === 'text') {
                            return <span key={idx} className="whitespace-pre-wrap">{part.content}</span>;
                        } else {
                            console.log("🔥 [4] 화면에 그릴 리스트 데이터:", part.data);
                            return (
                                <div key={idx} className="mt-4 space-y-2 bg-slate-900/50 p-3 rounded-2xl border border-white/5">
                                    <div className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-3 px-1">추천 루틴 리스트</div>
                                    {part.data.map((item, itemIdx) => {
                                        const isAdded = addedItems.includes(itemIdx);
                                        
                                        return (
                                            <div key={itemIdx} className="flex justify-between items-center bg-slate-800/50 p-3 rounded-xl border border-white/5 group transition-all hover:border-indigo-500/30">
                                                <div className="flex flex-col">
                                                    <span className="text-white font-black italic uppercase tracking-tighter text-base mb-1">
                                                        {item.name}
                                                    </span>
                                                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                                                        {item.sets}세트 x {item.reps}회 {item.weight > 0 ? `(${item.weight}kg)` : ''}
                                                    </span>
                                                </div>
                                                <button 
                                                    onClick={() => !isAdded && onAddItem(item, itemIdx)}
                                                    className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
                                                        isAdded 
                                                        ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' 
                                                        : 'bg-slate-700 hover:bg-indigo-600 text-slate-300 hover:text-white active:scale-90 shadow-lg shadow-black/20'
                                                    }`}
                                                >
                                                    {isAdded ? (
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                                                    ) : (
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                                                    )}
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            );
                        }
                    })}
                </div>
            </div>
        );
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
                
                <button 
                    onClick={handleClearHistory}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white text-[10px] font-black uppercase rounded-lg border border-white/5 transition-all active:scale-95"
                >
                    대화 초기화
                </button>
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar pb-32">
                {messages.map((msg) => (
                    <MessageBubble key={msg.id} msg={msg} />
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
                            onClick={() => handleSendMessage("오늘의 운동루틴 추천해 줘")}
                            className="whitespace-nowrap px-5 py-2.5 bg-slate-900 border border-white/10 hover:border-indigo-500/50 rounded-full text-[11px] font-black text-slate-300 hover:text-white transition-all shadow-xl active:scale-95 flex items-center gap-2 group"
                        >
                            <span className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse group-hover:bg-indigo-400"></span>
                            🔥 오늘의 운동루틴
                        </button>
                        <button 
                            onClick={() => handleSendMessage("⚡ 하드모드")}
                            className="whitespace-nowrap px-5 py-2.5 bg-gradient-to-r from-orange-600 to-rose-600 border border-white/10 rounded-full text-[11px] font-black text-white transition-all shadow-xl active:scale-95 flex items-center gap-2 group"
                        >
                            ⚡ 하드모드
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

const MonthlyCalendar = ({ workoutGroups = {}, currentViewDate, onMonthChange }) => {
    const navigate = useNavigate();
    const daysOfWeek = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
    
    const year = currentViewDate.getFullYear();
    const month = currentViewDate.getMonth();
    
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const lastDateOfMonth = new Date(year, month + 1, 0).getDate();
    
    const calendarDays = [];
    for (let i = 0; i < firstDayOfMonth; i++) calendarDays.push(null);
    for (let i = 1; i <= lastDateOfMonth; i++) calendarDays.push(i);

    const today = new Date();
    const isToday = (date) => date === today.getDate() && month === today.getMonth() && year === today.getFullYear();

    const partLabels = {
        chest: '가슴',
        shoulders: '어깨',
        back_part: '등',
        legs: '하체',
        arms: '팔',
        cardio: '유산소'
    };

    return (
        <div className="mt-2 md:mt-6 p-4 md:p-6 bg-slate-800/50 rounded-[2.5rem] border border-slate-700/50 shadow-2xl w-full">
            <div className="flex justify-between items-center mb-4 px-4">
                <button onClick={() => onMonthChange(-1)} className="p-4 hover:bg-slate-700 rounded-full text-white transition-colors">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" /></svg>
                </button>
                <h3 className="text-xl md:text-3xl font-black text-white uppercase italic tracking-tighter">
                    {year}년 {month + 1}월
                </h3>
                <button onClick={() => onMonthChange(1)} className="p-4 hover:bg-slate-700 rounded-full text-white transition-colors">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" /></svg>
                </button>
            </div>
            <div className="grid grid-cols-7 gap-x-1 gap-y-1 md:gap-4">
                {daysOfWeek.map(day => (
                    <div key={day} className="text-center text-[10px] md:text-sm font-black text-slate-500 py-2 uppercase tracking-widest flex items-center justify-center">
                        {day}
                    </div>
                ))}
                {calendarDays.map((date, idx) => {
                    const workoutInfo = date ? workoutGroups[date] : null;
                    const todayActive = date && isToday(date);

                    // Get unique parts for this day
                    const uniqueParts = workoutInfo ? [...new Set(workoutInfo.logs.map(l => l.part))] : [];

                    return (
                        <div 
                            key={idx} 
                            onClick={() => {
                                if (!date) return;
                                const selectedDate = new Date(year, month, date);
                                const days = ['일', '월', '화', '수', '목', '금', '토'];
                                const dateStrForDisplay = `${month + 1}/${date}(${days[selectedDate.getDay()]})`;
                                
                                const yyyy = selectedDate.getFullYear();
                                const mm = String(selectedDate.getMonth() + 1).padStart(2, '0');
                                const dd = String(selectedDate.getDate()).padStart(2, '0');
                                const formattedDate = `${yyyy}-${mm}-${dd}`;

                                navigate(`/routine-detail?date=${formattedDate}`, { 
                                    state: { 
                                        date: dateStrForDisplay
                                    } 
                                });
                            }}
                            className={`flex flex-col items-center justify-start py-1 md:py-2 relative group cursor-pointer hover:bg-slate-700/30 rounded-[2.5rem] transition-all duration-300 min-h-[60px] md:min-h-[100px] border border-transparent hover:border-white/5 w-full overflow-hidden`}

                        >
                            {date && (
                                <div className="flex flex-col items-center justify-center w-full">
                                    <div className="relative flex items-center justify-center w-8 h-8 md:w-10 md:h-10 mb-0.5">
                                        {todayActive && (
                                            <div className="absolute inset-0 bg-blue-600 rounded-full shadow-lg shadow-blue-600/30"></div>
                                        )}
                                        {workoutInfo && (
                                            <div className="absolute inset-0 border-2 md:border-[3px] border-rose-500 rounded-full animate-pulse shadow-lg shadow-rose-500/20"></div>
                                        )}
                                        <span className={`relative z-10 text-sm md:text-lg font-black italic tracking-tighter text-white leading-none`}>
                                            {date}
                                        </span>
                                    </div>
                                    
                                    <div className="flex flex-wrap justify-center gap-0.5 max-w-full px-1 overflow-hidden">
                                        {uniqueParts.map(p => (
                                            <span key={p} className="text-[7px] md:text-[9px] font-black text-slate-300 leading-tight uppercase tracking-tight bg-slate-800/80 px-1 py-0.5 rounded-md border border-white/10 whitespace-nowrap">
                                                {partLabels[p] || p}
                                            </span>
                                        ))}
                                    </div>
                                </div>
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
    const [workoutGroups, setWorkoutGroups] = useState({});
    const [isLoading, setIsLoading] = useState(true);
    const [currentViewDate, setCurrentViewDate] = useState(new Date());
    const [userData, setUserData] = useState(null);
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

    const today = new Date();

    const fetchLogs = async (viewDate) => {
        setIsLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            setUserData(user.user_metadata);

            const year = viewDate.getFullYear();
            const month = viewDate.getMonth();
            
            // Start and End of the month
            const startDate = new Date(year, month, 1, 0, 0, 0).toISOString();
            const endDate = new Date(year, month + 1, 0, 23, 59, 59).toISOString();

            const { data, error } = await supabase
                .from('workout_logs')
                .select('*')
                .eq('user_id', user.id)
                .gte('created_at', startDate)
                .lte('created_at', endDate)
                .order('created_at', { ascending: true });

            if (error) throw error;

            const groups = {};
            data.forEach(log => {
                const d = new Date(log.created_at);
                const logDate = d.getDate();
                if (!groups[logDate]) {
                    groups[logDate] = {
                        logs: []
                    };
                }
                groups[logDate].logs.push(log);
            });
            setWorkoutGroups(groups);
        } catch (error) {
            console.error("데이터 불러오기 에러:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs(currentViewDate);
    }, [currentViewDate]);

    const handleMonthChange = (offset) => {
        const newDate = new Date(currentViewDate.getFullYear(), currentViewDate.getMonth() + offset, 1);
        const monthDiff = (newDate.getFullYear() - today.getFullYear()) * 12 + (newDate.getMonth() - today.getMonth());
        
        if (monthDiff < -3 || monthDiff > 3) {
            alert('이전 3개월부터 이후 3개월까지의 기록만 확인할 수 있습니다.');
            return;
        }
        setCurrentViewDate(newDate);
    };

    const handleProfileUpdate = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) setUserData(user.user_metadata);
    };

    return (
        <div className="flex flex-col md:flex-row min-h-screen animate-fade-in overflow-x-hidden relative bg-slate-950">
            <div className="absolute top-6 right-6 z-20 flex gap-3">
                <button 
                    onClick={() => setIsProfileModalOpen(true)}
                    className="bg-slate-800/80 hover:bg-slate-700 border border-slate-700 px-4 py-2 rounded-full transition-all active:scale-95 flex items-center gap-2 shadow-xl backdrop-blur-md"
                >
                    <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                    <span className="text-xs font-black text-white uppercase tracking-wider">내 정보</span>
                </button>
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
                    <div className="min-h-[300px] flex items-center justify-center text-slate-500 italic">기록을 불러오는 중...</div>
                ) : (
                    <MonthlyCalendar 
                        workoutGroups={workoutGroups} 
                        currentViewDate={currentViewDate}
                        onMonthChange={handleMonthChange}
                    />
                )}
            </div>
            
            <div className="w-full md:w-1/2 flex flex-col h-auto md:h-screen">
                <button onClick={() => navigate('/routine-record')} className="h-[220px] md:flex-1 group relative overflow-hidden bg-slate-900 flex flex-col items-center justify-center transition-all hover:bg-slate-800 border-b border-slate-800 md:border-b-0">
                    <div className="absolute inset-0 opacity-10 bg-[url('https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=800')] bg-cover bg-center group-hover:scale-110 transition-transform duration-700"></div>
                    <div className="relative z-10 flex flex-col items-center">
                        <div className="w-12 h-12 md:w-14 md:h-14 bg-blue-600 rounded-2xl flex items-center justify-center mb-3 shadow-lg shadow-blue-600/30 group-hover:rotate-12 transition-transform"><svg className="w-6 h-6 md:w-7 md:h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg></div>
                        <span className="text-lg md:text-xl font-black italic text-white tracking-tighter">루틴 기록</span>
                        <p className="text-slate-400 text-[10px] md:text-xs mt-1 uppercase">Routine Record</p>
                    </div>
                </button>
                <button onClick={() => navigate('/routine-compose')} className="h-[220px] md:flex-1 group relative overflow-hidden bg-indigo-950 flex flex-col items-center justify-center transition-all hover:bg-indigo-900 border-b border-slate-800 md:border-b-0">
                    <div className="absolute inset-0 opacity-10 bg-[url('https://images.unsplash.com/photo-1434494878577-86c23bcb06b9?q=80&w=800')] bg-cover bg-center group-hover:scale-110 transition-transform duration-700"></div>
                    <div className="relative z-10 flex flex-col items-center">
                        <div className="w-12 h-12 md:w-14 md:h-14 bg-indigo-600 rounded-2xl flex items-center justify-center mb-3 shadow-lg shadow-indigo-600/30 group-hover:rotate-6 transition-transform"><svg className="w-6 h-6 md:w-7 md:h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg></div>
                        <span className="text-lg md:text-xl font-black italic text-white tracking-tighter">루틴 구성</span>
                        <p className="text-slate-400 text-[10px] md:text-xs mt-1 uppercase">Routine Compose</p>
                    </div>
                </button>
                <button onClick={() => navigate('/ai-coach')} className="h-[220px] md:flex-1 group relative overflow-hidden bg-blue-700 flex flex-col items-center justify-center transition-all hover:bg-blue-600">
                    <div className="absolute inset-0 opacity-20 bg-[url('https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=800')] bg-cover bg-center group-hover:scale-110 transition-transform duration-700"></div>
                    <div className="relative z-10 flex flex-col items-center">
                        <div className="w-12 h-12 md:w-14 md:h-14 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mb-3 border border-white/30 group-hover:-rotate-12 transition-transform"><svg className="w-6 h-6 md:w-7 md:h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg></div>
                        <span className="text-lg md:text-xl font-black italic text-white tracking-tighter">Ai코치</span>
                        <p className="text-blue-100 text-[10px] md:text-xs mt-1 uppercase">Ai Coach</p>
                    </div>
                </button>
            </div>

            <UserProfileModal 
                isOpen={isProfileModalOpen} 
                onClose={() => setIsProfileModalOpen(false)} 
                userData={userData}
                onUpdate={handleProfileUpdate}
            />
        </div>
    );
};

const AppContent = () => {
    const navigate = useNavigate();
    const [session, setSession] = useState(null);
    const [isInitializing, setIsInitializing] = useState(true);
    const [isTimeout, setIsTimeout] = useState(false);

    useEffect(() => {
        // 1. 초기 세션 확인
        const initializeAuth = async () => {
            try {
                const { data: { session: initialSession } } = await supabase.auth.getSession();
                setSession(initialSession);
                
                // OAuth 콜백 상태(hash/code)가 아니라면 즉시 초기화 완료
                const isOAuthFlow = window.location.hash.includes('access_token') || window.location.search.includes('code=');
                if (!isOAuthFlow && !initialSession) {
                    setIsInitializing(false);
                }
            } catch (err) {
                console.error("Auth init error:", err);
                setIsInitializing(false);
            }
        };

        initializeAuth();

        // 2. 인증 상태 변화 감시 (OAuth 리다이렉트 대응 핵심)
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, currentSession) => {
            setSession(currentSession);
            
            if (currentSession) {
                setIsInitializing(false);
                // 세션이 확인되면 대시보드로 이동 (URL 조작 없이 자연스러운 전환 유도)
                if (window.location.pathname === '/' || window.location.pathname === '/login') {
                    navigate('/dashboard', { replace: true });
                }
            } else if (event === 'SIGNED_OUT') {
                setSession(null);
                setIsInitializing(false);
                navigate('/', { replace: true });
            }
        });

        // 3. 5초 타임아웃 예외 처리
        const timer = setTimeout(() => {
            if (isInitializing) {
                setIsTimeout(true);
            }
        }, 5000);

        return () => {
            subscription.unsubscribe();
            clearTimeout(timer);
        };
    }, [navigate]);

    // 타임아웃 발생 시 UI
    if (isInitializing && isTimeout) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 text-white p-6 text-center">
                <div className="w-20 h-20 bg-rose-500/20 rounded-3xl flex items-center justify-center mb-6 border border-rose-500/30">
                    <svg className="w-10 h-10 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                </div>
                <h2 className="text-2xl font-black italic tracking-tighter mb-2">로그인이 지연되고 있습니다.</h2>
                <p className="text-slate-400 mb-8 font-medium">네트워크 연결을 확인하거나 다시 시도해 주세요.</p>
                <button 
                    onClick={() => window.location.assign('/')}
                    className="px-8 py-4 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-2xl transition-all active:scale-95 shadow-xl"
                >
                    로그인 화면으로 돌아가기
                </button>
            </div>
        );
    }

    // 초기화 중 UI
    if (isInitializing) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 text-white">
                <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-6"></div>
                <div className="font-bold italic tracking-tighter text-2xl animate-pulse text-center">
                    인증 정보 확인 중...
                </div>
            </div>
        );
    }

    // 미인증 시 로그인 화면
    if (!session) {
        return <LoginScreen />;
    }

    // 인증 완료 시 메인 앱 라우터
    return (
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
    );
};

const App = () => {
    return (
        <BrowserRouter>
            <AppContent />
        </BrowserRouter>
    );
};

const root = createRoot(document.getElementById('root'));
root.render(<App />);
