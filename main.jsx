import React, { useState, useMemo, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, useNavigate, useLocation, Navigate, useSearchParams } from 'react-router-dom';
import EXERCISE_DATASET from './src/data/exercises.json';
import ApiViewer from './src/components/ApiViewer';
import { supabase } from './src/api/supabase';
import OpenAI from 'openai';
import ChatMessage from './src/components/ChatMessage';
import { BODY_PARTS, PART_MAP, STORAGE_KEYS } from './src/constants/exerciseConstants';
import { fetchLastExerciseRecord, saveWorkoutLogs } from './src/api/workoutApi';
import BottomNav from './src/components/BottomNav';
import Onboarding from './src/components/Onboarding';

// OpenAI 인스턴스 생성
const openai = new OpenAI({
    apiKey: import.meta.env.VITE_OPENAI_API_KEY,
    dangerouslyAllowBrowser: true
});

/**
 * [Utility: Perfect GIF Matching]
 */
export const getExerciseGif = (nameEn, exerciseId) => {
    if (!nameEn && !exerciseId) return null;
    
    // 1. ID가 있으면 최우선으로 매칭 (가장 정확)
    if (exerciseId) {
        const ex = EXERCISE_DATASET.find(e => e.id === exerciseId);
        if (ex) return `/${ex.gif_url}`;
    }
    
    // 2. 이름으로 정확히 일치하는 항목 찾기
    if (nameEn) {
        const ex = EXERCISE_DATASET.find(e => e.name.toLowerCase() === nameEn.toLowerCase());
        if (ex) return `/${ex.gif_url}`;
    }

    return null;
};

/**
 * [Full-screen GIF Modal]
 */
const GifModal = ({ isOpen, onClose, gifUrl, exerciseName }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 animate-fade-in">
            <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-xl" onClick={onClose}></div>
            <div className="relative w-full max-w-2xl bg-slate-900 rounded-[2.5rem] overflow-hidden shadow-2xl border border-white/10 animate-scale-up">
                <div className="absolute top-6 right-6 z-10">
                    <button 
                        onClick={onClose}
                        className="p-3 bg-slate-800/80 hover:bg-slate-700 text-white rounded-full transition-all active:scale-90 border border-white/10"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>
                
                <div className="aspect-square w-full bg-slate-950 flex items-center justify-center p-8">
                    <img 
                        src={gifUrl} 
                        alt={exerciseName} 
                        className="w-full h-full object-contain rounded-2xl shadow-2xl"
                    />
                </div>
                
                <div className="p-8 bg-gradient-to-t from-slate-950 to-slate-900 border-t border-white/5">
                    <h3 className="text-2xl font-black italic text-white uppercase tracking-tighter text-center">
                        {exerciseName}
                    </h3>
                </div>
            </div>
        </div>
    );
};

const GifRenderer = ({ nameEn, exerciseId, className = "w-full h-full object-cover", onClick }) => {
    const gifUrl = getExerciseGif(nameEn, exerciseId);
    
    if (!gifUrl) {
        return (
            <div className={`bg-slate-800 flex flex-col items-center justify-center gap-2 ${className}`}>
                <svg className="w-8 h-8 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
            </div>
        );
    }
    
    return (
        <img 
            src={gifUrl} 
            alt="Exercise Preview" 
            className={`${className} cursor-pointer hover:scale-110 transition-transform duration-500`}
            loading="lazy"
            onClick={onClick}
        />
    );
};

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
            localStorage.setItem(STORAGE_KEYS.USER_BODY_INFO, JSON.stringify(profile));
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
 * [Common: Exercise Selector - Refactored for exercises.json]
 */
const ExerciseSelector = ({ selection, setSelection, onExerciseSelect }) => {
    const [searchTerm, setSearchTerm] = useState('');

    const handlePartClick = (p) => {
        setSelection({ part: p, exercise: null, manualName: '' });
        setSearchTerm('');
    };

    const handleExerciseClick = (ex) => {
        setSelection({ 
            ...selection, 
            exercise: ex,
            manualName: ''
        });
        if (onExerciseSelect) onExerciseSelect(ex.name);
    };

    const filteredExercises = useMemo(() => {
        if (!selection.part) return [];
        let list = EXERCISE_DATASET.filter(ex => ex.body_part === selection.part);
        if (searchTerm.trim()) {
            list = list.filter(ex => 
                ex.name.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }
        return list;
    }, [selection.part, searchTerm]);

    return (
        <div className="space-y-8">
            {/* Selection Summary */}
            {(selection.part || selection.exercise) && (
                <div className="p-4 bg-blue-600/10 border border-blue-500/20 rounded-2xl animate-fade-in">
                    <div className="flex flex-wrap items-center gap-2 text-[10px] font-black text-blue-400 uppercase tracking-widest">
                        {selection.part && <span>{BODY_PARTS.find(p => p.key === selection.part)?.label}</span>}
                        {selection.exercise && (
                            <>
                                <svg className="w-3 h-3 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7"/></svg>
                                <span className="text-white uppercase">{selection.exercise.name}</span>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* Step 1: Body Part */}
            <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4 block px-1">Step 1. 부위 선택</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {BODY_PARTS.map(p => (
                        <button 
                            key={p.key} 
                            onClick={() => handlePartClick(p.key)} 
                            className={`py-3 rounded-2xl font-black text-[10px] sm:text-xs tracking-tighter transition-all duration-300 ${selection.part === p.key ? 'bg-blue-600 text-white shadow-xl shadow-blue-600/30 ring-2 ring-blue-400/50' : 'bg-slate-800/50 text-slate-400 hover:bg-slate-800 hover:text-slate-200 border border-slate-700/50'}`}
                        >
                            {p.label.toUpperCase()}
                        </button>
                    ))}
                </div>
            </div>

            {/* Step 2: Search and List */}
            {selection.part && (
                <div className="animate-fade-in space-y-4">
                    <div className="relative">
                        <input 
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="운동 명칭 검색 (English)..."
                            className="w-full bg-slate-900 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                        />
                        <svg className="absolute left-3 top-3.5 w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
                    </div>

                    <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                        {filteredExercises.length === 0 ? (
                            <p className="text-center py-10 text-slate-500 italic text-xs">검색 결과가 없습니다.</p>
                        ) : (
                            filteredExercises.map((ex) => (
                                <div 
                                    key={ex.id}
                                    onClick={() => handleExerciseClick(ex)}
                                    className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all border ${selection.exercise?.id === ex.id ? 'bg-blue-600/20 border-blue-500' : 'bg-slate-800/30 border-white/5 hover:border-slate-600'}`}
                                >
                                    <div className="w-10 h-10 rounded-lg overflow-hidden bg-slate-900 shrink-0">
                                        <GifRenderer exerciseId={ex.id} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className={`text-xs font-black italic uppercase truncate ${selection.exercise?.id === ex.id ? 'text-blue-400' : 'text-white'}`}>{ex.name}</p>
                                        <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">{ex.equipment}</span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
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
 * [Screen: Login]
 */
const LoginScreen = () => {
    const [isSignup, setIsSignup] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [passwordConfirm, setPasswordConfirm] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleLogin = async () => {
        if (!email || !password) {
            alert('이메일과 비밀번호를 입력해주세요.');
            return;
        }
        setIsLoading(true);
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        setIsLoading(false);
        if (error) alert('로그인 실패: ' + error.message);
    };

    const handleGoogleLogin = async () => {
        const { error } = await supabase.auth.signInWithOAuth({ 
            provider: 'google',
            options: { redirectTo: window.location.origin }
        });
        if (error) alert('구글 로그인 실패: ' + error.message);
    };

    const handleSignupComplete = async () => {
        if (!email || !password) { alert('이메일과 비밀번호는 필수입니다.'); return; }
        if (password !== passwordConfirm) { alert('비밀번호가 일치하지 않습니다.'); return; }
        
        setIsLoading(true);
        const { data, error } = await supabase.auth.signUp({ email, password });
        setIsLoading(false);

        if (error) {
            alert('회원가입 실패: ' + error.message);
        } else {
            alert('가입하신 이메일로 인증 메일이 발송되었습니다!');
            setIsSignup(false);
        }
    };

    if (isSignup) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen px-6 py-12 animate-fade-in bg-slate-950">
                <div className="w-full max-sm space-y-8">
                    <button onClick={() => setIsSignup(false)} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-4 group">
                        <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
                        <span className="font-medium">돌아가기</span>
                    </button>
                    <div className="text-center">
                        <h2 className="text-4xl font-black italic tracking-tighter text-white uppercase">회원가입</h2>
                    </div>
                    <div className="space-y-4 bg-slate-900/50 p-8 rounded-3xl border border-slate-800">
                        <input type="email" placeholder="이메일" value={email} onChange={e => setEmail(e.target.value)} className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-blue-500 outline-none" />
                        <input type="password" placeholder="비밀번호" value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white focus:ring-2 focus:ring-blue-500 outline-none" />
                        <input type="password" placeholder="비밀번호 확인" value={passwordConfirm} onChange={e => setPasswordConfirm(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white focus:ring-2 focus:ring-blue-500 outline-none" />
                        <button onClick={handleSignupComplete} disabled={isLoading} className="w-full py-4 bg-blue-600 text-white font-bold rounded-xl active:scale-95 transition-all">가입 완료</button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-screen px-6 bg-slate-950">
            <div className="mb-12 text-center">
                <h1 className="text-6xl font-extrabold italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-indigo-600">MyGym</h1>
                <p className="mt-2 text-gray-400 font-medium tracking-wide uppercase italic">Level up your limits</p>
            </div>
            <div className="w-full max-sm space-y-4">
                <input type="email" placeholder="이메일" value={email} onChange={e => setEmail(e.target.value)} className="w-full px-4 py-4 bg-slate-800 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-blue-500 outline-none" />
                <input type="password" placeholder="비밀번호" value={password} onChange={e => setPassword(e.target.value)} className="w-full px-4 py-4 bg-slate-800 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-blue-500 outline-none" />
                <div className="flex gap-3">
                    <button onClick={handleLogin} disabled={isLoading} className="flex-1 py-4 bg-blue-600 text-white font-bold rounded-xl active:scale-95 transition-all">로그인</button>
                    <button onClick={() => setIsSignup(true)} className="flex-1 py-4 bg-slate-700 text-white font-bold rounded-xl active:scale-95 transition-all">회원가입</button>
                </div>
                <button onClick={handleGoogleLogin} className="w-full py-4 bg-white text-slate-900 font-bold rounded-xl flex items-center justify-center gap-3 active:scale-95 transition-all">
                    <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5" alt="G" /> Google로 시작하기
                </button>
            </div>
        </div>
    );
};

const WorkoutDetailScreen = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const queryDate = searchParams.get('date');
    const [logs, setLogs] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchLogs = async () => {
        if (!queryDate) return;
        setIsLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            const { data, error } = await supabase.from('workout_logs').select('*').eq('user_id', user.id).gte('created_at', `${queryDate}T00:00:00`).lte('created_at', `${queryDate}T23:59:59`).order('created_at', { ascending: true });
            if (error) throw error;
            setLogs(data || []);
        } catch (e) { console.error(e); } finally { setIsLoading(false); }
    };

    useEffect(() => { fetchLogs(); }, [queryDate]);

    const handleDelete = async (id) => {
        if (!confirm('삭제하시겠습니까?')) return;
        const { error } = await supabase.from('workout_logs').delete().eq('id', id);
        if (!error) fetchLogs();
    };

    return (
        <div className="p-4 md:p-12 max-w-4xl mx-auto bg-slate-950 min-h-screen pb-24">
            <BackButton />
            <h2 className="text-3xl font-black italic text-white mb-8">{queryDate} 트레이닝 상세</h2>
            <div className="space-y-4">
                {isLoading ? <div className="text-center text-slate-500 italic">로딩 중...</div> : logs.map(log => (
                    <div key={log.id} className="bg-slate-900/40 border border-white/5 p-6 rounded-[1.5rem] relative overflow-hidden group">
                        <div className="absolute top-0 left-0 w-1 h-full bg-blue-600"></div>
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <span className="bg-blue-600 text-[8px] font-black px-2 py-0.5 rounded-full uppercase text-white mb-1 inline-block">{PART_MAP[log.part] || log.part}</span>
                                <h3 className="text-xl font-black italic text-white uppercase tracking-tighter">{log.exercise}</h3>
                            </div>
                            <button onClick={() => handleDelete(log.id)} className="p-2 bg-slate-800 hover:bg-rose-600 text-slate-400 hover:text-white rounded-lg transition-all"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                        </div>
                        <div className="space-y-1">
                            {log.part === 'cardio' ? <div className="text-blue-400 font-black">{log.sets_data[0]?.duration}</div> : log.sets_data.map((s, idx) => (
                                <div key={idx} className="flex justify-between py-1 px-3 bg-slate-950/50 rounded-lg text-xs font-bold">
                                    <span className="text-slate-500">{idx + 1} SET</span>
                                    <span className="text-white">{s.weight}kg x {s.reps}회</span>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const WorkoutSetupScreen = () => {
    const [searchParams] = useSearchParams();
    const [selection, setSelection] = useState({ part: '', exercise: null, manualName: '' });
    const [setsData, setSetsData] = useState([{ weight: '', reps: '' }]);
    const [cardioMinutes, setCardioMinutes] = useState('');
    const [cardioSeconds, setCardioSeconds] = useState('');
    const [addedExercises, setAddedExercises] = useState([]);
    const [isSaving, setIsSaving] = useState(false);
    const queryDate = searchParams.get('date');

    const handleAddOrUpdateExercise = async () => {
        if (!selection.exercise || isSaving) return;
        setIsSaving(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            const logData = {
                user_id: user.id,
                part: selection.part,
                type: selection.exercise.equipment,
                exercise: selection.exercise.name,
                exercise_id: selection.exercise.id,
                sets_count: selection.part === 'cardio' ? 1 : setsData.length,
                sets_data: selection.part === 'cardio' ? [{ duration: `${cardioMinutes}분 ${cardioSeconds}초` }] : setsData,
                is_completed: true,
                created_at: queryDate ? new Date(queryDate).toISOString() : new Date().toISOString()
            };
            const { error } = await supabase.from('workout_logs').insert([logData]);
            if (error) throw error;
            setAddedExercises([...addedExercises, { ...logData, id: Date.now() }]);
            setSelection({ part: '', exercise: null, manualName: '' });
            alert('기록 완료!');
        } catch (e) { alert(e.message); } finally { setIsSaving(false); }
    };

    return (
        <div className="p-8 max-w-4xl mx-auto bg-slate-950 min-h-screen pb-24">
            <h2 className="text-3xl font-black italic text-white uppercase mb-8">루틴 기록</h2>
            <div className="grid lg:grid-cols-2 gap-8">
                <div className="space-y-6">
                    <ExerciseSelector selection={selection} setSelection={setSelection} />
                    {selection.exercise && (
                        <div className="bg-slate-800/30 p-6 rounded-2xl border border-slate-700 space-y-6">
                            {selection.part === 'cardio' ? (
                                <div className="flex gap-4">
                                    <input type="number" placeholder="분" value={cardioMinutes} onChange={e => setCardioMinutes(e.target.value)} className="w-full bg-slate-900 p-3 rounded-lg text-white font-bold" />
                                    <input type="number" placeholder="초" value={cardioSeconds} onChange={e => setCardioSeconds(e.target.value)} className="w-full bg-slate-900 p-3 rounded-lg text-white font-bold" />
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {setsData.map((s, idx) => (
                                        <div key={idx} className="flex gap-2 items-center bg-slate-900 p-2 rounded-xl border border-slate-800">
                                            <span className="text-[10px] text-slate-500 w-8 text-center">{idx + 1}S</span>
                                            <input type="number" placeholder="KG" value={s.weight} onChange={e => { const nd = [...setsData]; nd[idx].weight = e.target.value; setSetsData(nd); }} className="flex-1 bg-slate-950 p-2 rounded text-white text-xs outline-none" />
                                            <input type="number" placeholder="회" value={s.reps} onChange={e => { const nd = [...setsData]; nd[idx].reps = e.target.value; setSetsData(nd); }} className="flex-1 bg-slate-950 p-2 rounded text-white text-xs outline-none" />
                                            <button onClick={() => setSetsData(setsData.filter((_, i) => i !== idx))} className="text-slate-600 px-2">×</button>
                                        </div>
                                    ))}
                                    <button onClick={() => setSetsData([...setsData, { weight: '', reps: '' }])} className="w-full py-2 bg-slate-800 text-slate-400 text-[10px] rounded-xl">+ 세트 추가</button>
                                </div>
                            )}
                            <button onClick={handleAddOrUpdateExercise} className="w-full py-4 bg-blue-600 text-white font-black rounded-xl italic">기록하기</button>
                        </div>
                    )}
                </div>
                <div className="bg-slate-900/50 rounded-3xl p-6 border border-slate-800">
                    <h3 className="text-xl font-bold text-white mb-6">최근 추가됨</h3>
                    <div className="space-y-4">
                        {addedExercises.map(ex => (
                            <div key={ex.id} className="bg-slate-800 p-4 rounded-xl border border-slate-700">
                                <p className="text-[10px] text-blue-400 uppercase font-bold">{PART_MAP[ex.part]} / {ex.type}</p>
                                <p className="font-bold text-white">{ex.exercise}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

const WorkoutPlanScreen = () => {
    const [selection, setSelection] = useState({ part: '', exercise: null, manualName: '' });
    const [planList, setPlanList] = useState(() => JSON.parse(localStorage.getItem(STORAGE_KEYS.TODAY_ROUTINE) || '[]'));
    const [modalState, setModalState] = useState({ isOpen: false, gifUrl: '', name: '' });

    useEffect(() => { localStorage.setItem(STORAGE_KEYS.TODAY_ROUTINE, JSON.stringify(planList)); }, [planList]);

    const handleAddToList = () => {
        if (!selection.exercise) return;
        setPlanList([...planList, { id: Date.now(), ...selection.exercise, body_part: selection.part, isCompleted: false }]);
        setSelection({ part: '', exercise: null, manualName: '' });
    };

    const openPreview = (id, name) => {
        const url = getExerciseGif(null, id);
        if (url) setModalState({ isOpen: true, gifUrl: url, name });
    };

    return (
        <div className="p-6 md:p-12 max-w-6xl mx-auto bg-slate-950 min-h-screen pb-24">
            <h2 className="text-3xl font-black italic text-white uppercase underline decoration-indigo-500 decoration-4 underline-offset-8 mb-8">루틴 구성</h2>
            <div className="grid lg:grid-cols-2 gap-10">
                <div className="bg-slate-900/50 p-6 rounded-3xl border border-slate-800">
                    <ExerciseSelector selection={selection} setSelection={setSelection} />
                    {selection.exercise && <button onClick={handleAddToList} className="w-full mt-6 py-4 bg-indigo-600 text-white font-black rounded-xl italic active:scale-95 transition-all">리스트에 추가하기</button>}
                </div>
                <div className="bg-slate-900/50 p-6 rounded-3xl border border-slate-800 min-h-[400px]">
                    <h3 className="text-xl font-bold text-white mb-6">오늘의 운동 리스트 ({planList.length})</h3>
                    <div className="space-y-4">
                        {planList.map(item => (
                            <div key={item.id} className="p-4 bg-slate-800/60 border border-slate-700 rounded-2xl flex items-center gap-4">
                                <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0 bg-slate-900">
                                    <GifRenderer exerciseId={item.id} onClick={() => openPreview(item.id, item.name)} />
                                </div>
                                <div className="flex-1">
                                    <p className="text-[10px] font-bold text-indigo-400 uppercase">{PART_MAP[item.body_part]}</p>
                                    <h4 className="text-sm font-bold text-white uppercase">{item.name}</h4>
                                </div>
                                <button onClick={() => setPlanList(planList.filter(p => p.id !== item.id))} className="p-2 text-slate-500 hover:text-white">×</button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            <GifModal isOpen={modalState.isOpen} onClose={() => setModalState({ ...modalState, isOpen: false })} gifUrl={modalState.gifUrl} exerciseName={modalState.name} />
        </div>
    );
};

const AIRecommendationScreen = () => {
    const [recentLogs, setRecentLogs] = useState([]);
    const [messages, setMessages] = useState(() => JSON.parse(localStorage.getItem(STORAGE_KEYS.CHAT_HISTORY) || '[{"id":1,"type":"ai","text":"안녕하세요! 공식 운동 메뉴얼을 기반으로 최적의 루틴을 제안해 드립니다. 어떤 운동을 하고 싶으신가요?"}]'));
    const [inputText, setInputText] = useState('');
    const [isTyping, setIsTyping] = useState(false);

    useEffect(() => { localStorage.setItem(STORAGE_KEYS.CHAT_HISTORY, JSON.stringify(messages)); }, [messages]);

    useEffect(() => {
        const fetchRecent = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data } = await supabase.from('workout_logs').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(20);
                setRecentLogs(data || []);
            }
        };
        fetchRecent();
    }, []);

    const handleSendMessage = async (text = inputText) => {
        if (!text.trim() || isTyping) return;
        setMessages([...messages, { id: Date.now(), type: 'user', text }]);
        setInputText('');
        setIsTyping(true);

        const EXERCISE_MENU = EXERCISE_DATASET.slice(0, 300).map(ex => ex.name).join(', ');
        const systemRole = `너는 전문 PT 코치야. 
        [중요 규칙]
        1. 반드시 아래 [공식 운동 리스트]에 존재하는 영어 이름(name)을 'nameEn' 키값으로 사용해야 한다. 다른 이름은 절대 안 된다.
        2. [ROUTINE_DATA] JSON 형식으로 답변 끝에 포함하라.
        3. 'nameEn'은 반드시 [공식 운동 리스트]의 영어 이름과 토씨 하나 틀리지 않고 일치해야 하며, 'name'에는 해당 운동의 한국어 번역 이름을 넣어야 한다.
        4. 루틴 항목: { "name": "바벨 벤치 프레스" (UI 표시용 한국어), "nameEn": "barbell bench press" (JSON 매칭용 공식 영어), "part": "가슴|등|하체|어깨|팔|코어|유산소", "sets": 4, "reps": 12, "weight": 0 }
        
        [공식 운동 리스트 (일부)]
        ${EXERCISE_MENU}`;

        try {
            const response = await openai.chat.completions.create({
                model: 'gpt-4o-mini',
                messages: [{ role: 'system', content: systemRole }, ...messages.slice(-5).map(m => ({ role: m.type === 'ai' ? 'assistant' : 'user', content: m.text })), { role: 'user', content: text }],
                temperature: 0.5
            });
            setMessages(prev => [...prev, { id: Date.now() + 1, type: 'ai', text: response.choices[0].message.content }]);
        } catch (e) { console.error(e); } finally { setIsTyping(false); }
    };

    const handleAddRoutineBatch = (items) => {
        const saved = JSON.parse(localStorage.getItem(STORAGE_KEYS.TODAY_ROUTINE) || '[]');
        const newItems = items.map(item => {
            const ex = EXERCISE_DATASET.find(e => e.name.toLowerCase() === item.nameEn.toLowerCase());
            const PART_REVERSE = { '가슴': 'chest', '등': 'back', '어깨': 'shoulders', '하체': 'upper legs', '팔': 'upper arms', '코어': 'waist', '유산소': 'cardio' };
            return {
                id: Date.now() + Math.random(),
                exercise: item.name, // UI 표시용 한국어 이름 저장
                exercise_id: ex?.id,
                name: item.name,
                nameEn: item.nameEn,
                body_part: PART_REVERSE[item.part] || 'chest',
                equipment: ex?.equipment || '기타',
                suggestedSets: item.sets,
                suggestedReps: item.reps,
                suggestedWeight: item.weight,
                isCompleted: false
            };
        });
        localStorage.setItem(STORAGE_KEYS.TODAY_ROUTINE, JSON.stringify([...saved, ...newItems]));
        alert('루틴에 추가되었습니다!');
        return true;
    };

    return (
        <div className="flex flex-col h-screen bg-slate-950 max-w-2xl mx-auto border-x border-white/5 pb-20 relative">
            <div className="p-4 border-b border-white/5 bg-slate-900/50 backdrop-blur-md sticky top-0 z-10 flex justify-between items-center">
                <h2 className="text-sm font-black text-white italic uppercase tracking-tighter">AI PT COACH</h2>
                <button onClick={() => { setMessages([{ id: 1, type: 'ai', text: "내역을 초기화했습니다." }]); localStorage.removeItem(STORAGE_KEYS.CHAT_HISTORY); }} className="text-[9px] font-bold text-slate-500 uppercase">초기화</button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar pb-32">
                {messages.map(msg => <ChatMessage key={msg.id} msg={msg} onAddRoutineItem={handleAddRoutineBatch} />)}
                {isTyping && <div className="text-slate-500 italic text-xs animate-pulse">코치가 생각 중...</div>}
            </div>
            <div className="absolute bottom-20 left-0 right-0 p-4 bg-gradient-to-t from-slate-950 via-slate-950 to-transparent">
                <div className="flex gap-2 mb-2"><button onClick={() => handleSendMessage("오늘 가슴 운동 루틴 추천해 줘")} className="text-[10px] bg-slate-900 border border-white/10 px-3 py-1.5 rounded-full text-slate-400">🔥 가슴 루틴</button><button onClick={() => handleSendMessage("유산소 포함 전신 루틴 알려줘")} className="text-[10px] bg-slate-900 border border-white/10 px-3 py-1.5 rounded-full text-slate-400">⚡ 전신 루틴</button></div>
                <div className="relative">
                    <input type="text" value={inputText} onChange={e => setInputText(e.target.value)} onKeyPress={e => e.key === 'Enter' && handleSendMessage()} placeholder="질문하기..." className="w-full bg-slate-900 border border-white/10 rounded-2xl py-4 pl-5 pr-14 text-sm text-white focus:ring-2 focus:ring-blue-500 outline-none" />
                    <button onClick={() => handleSendMessage()} className="absolute right-2 top-2 bottom-2 px-4 bg-blue-600 text-white rounded-xl font-bold">↑</button>
                </div>
            </div>
        </div>
    );
};

const CalendarScreen = () => {
    const [currentViewDate, setCurrentViewDate] = useState(new Date());
    const [workoutGroups, setWorkoutGroups] = useState({});
    const [userData, setUserData] = useState(null);
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    const fetchLogs = async () => {
        setIsLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            setUserData(user.user_metadata);
            const { data } = await supabase.from('workout_logs').select('*').eq('user_id', user.id);
            const groups = {};
            data?.forEach(log => {
                const d = new Date(log.created_at).getDate();
                if (!groups[d]) groups[d] = { logs: [] };
                groups[d].logs.push(log);
            });
            setWorkoutGroups(groups);
        } catch (e) { console.error(e); } finally { setIsLoading(false); }
    };

    useEffect(() => { fetchLogs(); }, []);

    return (
        <div className="p-4 md:p-12 flex flex-col justify-center bg-slate-950 min-h-screen pb-24">
            <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-black italic text-white uppercase tracking-tighter">My Workout Hub</h2>
                <button onClick={() => setIsProfileModalOpen(true)} className="p-2 bg-slate-800 rounded-full"><svg className="w-5 h-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20"><path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"/></svg></button>
            </div>
            <MonthlyCalendar workoutGroups={workoutGroups} currentViewDate={currentViewDate} onMonthChange={(off) => setCurrentViewDate(new Date(currentViewDate.getFullYear(), currentViewDate.getMonth() + off, 1))} onDayClick={(d, f, s) => {}} />
            <UserProfileModal isOpen={isProfileModalOpen} onClose={() => setIsProfileModalOpen(false)} userData={userData} onUpdate={fetchLogs} />
        </div>
    );
};

const MonthlyCalendar = ({ workoutGroups, currentViewDate, onMonthChange, onDayClick }) => {
    const navigate = useNavigate();
    const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
    const year = currentViewDate.getFullYear();
    const month = currentViewDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const lastDate = new Date(year, month + 1, 0).getDate();
    const calendarDays = [...Array(firstDay).fill(null), ...[...Array(lastDate).keys()].map(i => i + 1)];

    return (
        <div className="bg-slate-800/50 p-6 rounded-[2.5rem] border border-slate-700/50 shadow-2xl">
            <div className="flex justify-between items-center mb-6 px-4">
                <button onClick={() => onMonthChange(-1)} className="text-white text-2xl font-bold">‹</button>
                <h3 className="text-2xl font-black text-white italic">{year}년 {month + 1}월</h3>
                <button onClick={() => onMonthChange(1)} className="text-white text-2xl font-bold">›</button>
            </div>
            <div className="grid grid-cols-7 gap-1">
                {days.map(d => <div key={d} className="text-center text-[10px] font-black text-slate-500 py-2 uppercase">{d}</div>)}
                {calendarDays.map((d, i) => {
                    const info = d ? workoutGroups[d] : null;
                    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                    return (
                        <div key={i} onClick={() => d && navigate(`/routine-detail?date=${dateStr}`)} className={`h-16 flex flex-col items-center justify-center rounded-2xl relative cursor-pointer hover:bg-slate-700/30 transition-all ${d && new Date().getDate() === d && new Date().getMonth() === month ? 'bg-blue-600/20' : ''}`}>
                            {d && <span className="text-sm font-black text-white">{d}</span>}
                            {info && <div className="absolute bottom-2 flex gap-0.5">{[...new Set(info.logs.map(l => l.part))].map(p => <span key={p} className="w-1 h-1 bg-rose-500 rounded-full"></span>)}</div>}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

const MainAppLayout = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const activeTab = searchParams.get('tab') || '달력';
    return (
        <div className="relative min-h-screen bg-slate-950">
            <main>{activeTab === '달력' && <CalendarScreen />}{activeTab === '루틴기록' && <WorkoutSetupScreen />}{activeTab === '루틴구성' && <WorkoutPlanScreen />}{activeTab === 'AI코치' && <AIRecommendationScreen />}</main>
            <BottomNav activeTab={activeTab} onTabChange={(tab) => setSearchParams({ tab })} />
        </div>
    );
};

const AppContent = () => {
    const navigate = useNavigate();
    const [session, setSession] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => { setSession(session); setIsLoading(false); });
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => { setSession(session); if (session) navigate('/app', { replace: true }); else navigate('/', { replace: true }); });
        return () => subscription.unsubscribe();
    }, [navigate]);

    if (isLoading) return <div className="flex items-center justify-center min-h-screen text-white font-black italic animate-pulse">MYGYM LOADING...</div>;
    if (!session) return <LoginScreen />;

    return (
        <Routes>
            <Route path="/" element={<MainAppLayout />} />
            <Route path="/app" element={<MainAppLayout />} />
            <Route path="/routine-detail" element={<WorkoutDetailScreen />} />
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
};

const App = () => (<BrowserRouter><AppContent /></BrowserRouter>);
const root = createRoot(document.getElementById('root'));
root.render(<App />);
