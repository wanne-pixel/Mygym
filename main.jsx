import React, { useState, useMemo, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, Link, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { CUSTOM_EXERCISES } from './src/data/customExercises';
import ApiViewer from './src/components/ApiViewer';
import { supabase } from './src/api/supabase';

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
    const [manualName, setManualName] = useState('');

    const parts = [
        { key: 'chest', label: '가슴' },
        { key: 'shoulders', label: '어깨' },
        { key: 'back_part', label: '등' },
        { key: 'legs', label: '하체' },
        { key: 'arms', label: '팔' },
        { key: 'cardio', label: '유산소' }
    ];

    const handlePartClick = (p) => {
        setSelection({ part: p, exercise: '', manualName: '' });
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
        return CUSTOM_EXERCISES.filter(ex => ex.part === selection.part);
    }, [selection.part]);

    return (
        <div className="space-y-8">
            <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4 block px-1">Step 1. 부위 선택</label>
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
                <div className="animate-fade-in space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] block mb-4 px-1">Step 2. 종목 선택</label>
                    
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
    const { date, logs = [] } = location.state || { date: '?', logs: [] };
    const [todayWeight, setTodayWeight] = useState('');

    const handleWeightSave = async () => {
        if (!todayWeight) return;
        const { error } = await supabase.auth.updateUser({
            data: { weight: parseFloat(todayWeight) }
        });
        if (error) alert('실패: ' + error.message);
        else alert('오늘의 체중이 저장되었습니다.');
    };
    
    return (
        <div className="p-4 md:p-12 max-w-4xl mx-auto animate-fade-in bg-slate-950 min-h-screen relative">
            <BackButton />
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <h2 className="text-3xl font-black italic tracking-tighter text-white">
                    {date} 트레이닝 상세
                </h2>
                <button 
                    onClick={() => navigate('/routine-record')}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg shadow-blue-600/20 active:scale-95 transition-all text-center"
                >
                    운동 추가하기
                </button>
            </div>

            <div className="mb-8 p-6 bg-slate-900/50 rounded-2xl border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-slate-800 rounded-xl flex items-center justify-center">
                        <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 6l3 12h12l3-12H3z" /></svg>
                    </div>
                    <div>
                        <label className="text-[10px] font-black text-slate-500 uppercase block mb-1">오늘의 체중 입력</label>
                        <div className="flex items-center">
                            <input 
                                type="number" 
                                value={todayWeight}
                                onChange={(e) => setTodayWeight(e.target.value)}
                                placeholder="0.0"
                                className="bg-transparent text-2xl font-black text-white outline-none w-20"
                            />
                            <span className="text-slate-400 font-bold ml-1">kg</span>
                        </div>
                    </div>
                </div>
                <button 
                    onClick={handleWeightSave}
                    className="w-full md:w-auto px-8 py-3 bg-slate-800 hover:bg-slate-700 text-white text-sm font-bold rounded-xl transition-all active:scale-95"
                >
                    체중 저장
                </button>
            </div>

            <div className="space-y-4">
                {logs.length === 0 ? (
                    <div className="py-20 text-center bg-slate-900/50 rounded-[2rem] border border-dashed border-slate-800">
                        <p className="text-slate-500 italic">운동 기록이 없습니다.</p>
                    </div>
                ) : (
                    logs.map((log, idx) => (
                        <div key={idx} className="bg-slate-900/40 border border-white/5 p-4 md:p-6 rounded-[1.5rem] shadow-2xl relative overflow-hidden group">
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
    const [step, setStep] = useState(1);
    const [selection, setSelection] = useState({ part: '', exercise: '', manualName: '' });
    const [numSets, setNumSets] = useState('');
    const [setsData, setSetsData] = useState([]);
    const [cardioMinutes, setCardioMinutes] = useState('');
    const [cardioSeconds, setCardioSeconds] = useState('');
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
        const isExerciseReady = selection.exercise !== '' && (selection.exercise !== '직접 입력' || (selection.manualName && selection.manualName.trim() !== ''));
        if (!isExerciseReady) return false;

        if (selection.part === 'cardio') {
            const mins = parseInt(cardioMinutes) || 0;
            const secs = parseInt(cardioSeconds) || 0;
            return mins >= 0 && secs >= 0 && (mins > 0 || secs > 0);
        } else {
            const nSets = parseInt(numSets);
            const allSetsFilled = setsData.length > 0 && setsData.length === nSets && setsData.every(s => s.weight !== '' && s.reps !== '' && parseFloat(s.weight) >= 0 && parseInt(s.reps) > 0);
            return nSets > 0 && allSetsFilled;
        }
    }, [numSets, setsData, selection, cardioMinutes, cardioSeconds]);

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

            const newLog = {
                user_id: user.id,
                part: selection.part,
                type: exInfo?.equipment || '기타',
                exercise: exerciseName,
                sets_count: selection.part === 'cardio' ? 1 : parseInt(numSets),
                sets_data: finalSetsData,
                is_completed: true
            };

            const { error } = await supabase.from('workout_logs').insert([newLog]);
            if (error) throw error;

            alert('성공적으로 기록이 저장되었습니다!');
            setAddedExercises([...addedExercises, { ...newLog, id: Date.now() }]);
            setNumSets('');
            setSetsData([]);
            setCardioMinutes('');
            setCardioSeconds('');
            setStep(1);
            setSelection({ part: '', exercise: '', manualName: '' });

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
                                            <input type="number" value={cardioSeconds} onChange={e => setCardioSeconds(e.target.value)} className="w-full bg-slate-900 border border-slate-700 p-3 rounded-lg text-white text-right font-bold focus:border-blue-500 outline-none" placeholder="0" />
                                            <span className="text-slate-400 font-bold">초</span>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-500 uppercase mb-2 block tracking-tighter">SETS</label>
                                        <input type="number" value={numSets} onChange={handleNumSetsChange} className="w-full bg-slate-900 border border-slate-700 p-3 rounded-xl text-white text-center font-bold focus:ring-2 focus:ring-blue-500 outline-none" placeholder="0" />
                                    </div>
                                    {setsData.length > 0 && (
                                        <div className="space-y-3 animate-slide-down">
                                            <label className="text-[10px] font-bold text-blue-500 uppercase block tracking-widest">세트별 상세 기록 (KG / REPS)</label>
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
                                </>
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
                                        <button onClick={() => handleDelete(ex.id)} className="p-2 bg-slate-700 hover:bg-rose-600 text-white rounded-lg transition-colors"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
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
    const [selection, setSelection] = useState({ part: '', exercise: '', manualName: '' });
    const [planList, setPlanList] = useState([]);
    const [recordingIndex, setRecordingIndex] = useState(null);
    const [numSets, setNumSets] = useState('');
    const [setsData, setSetsData] = useState([]);
    const [cardioMinutes, setCardioMinutes] = useState('');
    const [cardioSeconds, setCardioSeconds] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const handleAddToList = () => {
        if (!selection.exercise || (selection.exercise === '직접 입력' && (!selection.manualName || !selection.manualName.trim()))) return;
        const newItem = {
            id: Date.now(),
            part: selection.part,
            exercise: selection.exercise,
            manualName: selection.manualName,
            isCompleted: false
        };
        setPlanList([...planList, newItem]);
        setSelection({ part: '', exercise: '', manualName: '' });
    };

    const startRecording = (index) => {
        setRecordingIndex(index);
        setNumSets('');
        setSetsData([]);
        setCardioMinutes('');
        setCardioSeconds('');
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
            const nSets = parseInt(numSets);
            const allSetsFilled = setsData.length > 0 && setsData.length === nSets && setsData.every(s => s.weight !== '' && s.reps !== '');
            if (!allSetsFilled) {
                alert('모든 세트의 정보를 입력해주세요.');
                return;
            }
            finalSetsData = setsData;
            finalSetsCount = nSets;
        }

        setIsSaving(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('로그인이 필요합니다.');

            const exerciseName = targetExercise.exercise === '직접 입력' ? targetExercise.manualName : targetExercise.exercise;
            const exInfo = CUSTOM_EXERCISES.find(ex => ex.name === targetExercise.exercise && ex.part === targetExercise.part);

            const newLog = {
                user_id: user.id,
                part: targetExercise.part,
                type: exInfo?.equipment || '기타',
                exercise: exerciseName,
                sets_count: finalSetsCount,
                sets_data: finalSetsData,
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
                                    <div key={item.id} className={`p-5 rounded-2xl border transition-all ${item.isCompleted ? 'bg-slate-800/20 border-emerald-500/30' : 'bg-slate-800/60 border-slate-700'}`}>
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <span className="text-[10px] font-bold text-indigo-400 block uppercase mb-1">
                                                    {item.part === 'chest' ? '가슴' : item.part === 'back_part' ? '등' : item.part === 'legs' ? '하체' : item.part === 'shoulders' ? '어깨' : item.part === 'arms' ? '팔' : item.part === 'cardio' ? '유산소' : item.part}
                                                </span>
                                                <h4 className={`text-lg font-bold ${item.isCompleted ? 'text-slate-500 line-through' : 'text-white'}`}>{item.exercise === '직접 입력' ? item.manualName : item.exercise}</h4>
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
