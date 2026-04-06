import React, { useState, useMemo, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, Link, useNavigate, useLocation, Navigate } from 'react-router-dom';

console.log("MyGym App Initializing...");

/**
 * [공통 데이터: 운동 종목 리스트]
 */
const EXERCISE_DATA = {
    '가슴': {
        '프리웨이트': ['벤치프레스', '인클라인 벤치프레스', '덤벨 플라이'],
        '머신': ['체스트 프레스 머신', '펙덱 플라이'],
        '케이블': ['케이블 크로스오버']
    },
    '등': {
        '프리웨이트': ['원암 덤벨로우', '바벨로우', '데드리프트', '레트럴레이즈'],
        '머신': ['렛풀다운', '프론트로우', '로우로우', '시티드로우'],
        '케이블': ['암풀다운']
    },
    '하체': {
        '프리웨이트': ['백 스쿼트', '런지', '루마니안 데드리프트'],
        '머신': ['레그 프레스', '레그 익스텐션', '레그 컬'],
        '케이블': []
    },
    '어깨': {
        '프리웨이트': ['숄더 프레스', '사이드 레트럴 레이즈', '벤트오버 레트럴 레이즈'],
        '머신': ['숄더 프레스 머신'],
        '케이블': ['케이블 페이스 풀']
    },
    '팔': {
        '프리웨이트': ['바벨 컬', '덤벨 컬', '라잉 트라이셉스 익스텐션'],
        '머신': ['암 컬 머신'],
        '케이블': ['푸쉬 다운']
    }
};

/**
 * [공통: 뒤로가기 버튼 컴포넌트]
 */
const BackButton = () => {
    const navigate = useNavigate();
    return (
        <button 
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-6 group"
        >
            <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
            <span className="font-medium">대시보드로 돌아가기</span>
        </button>
    );
};

/**
 * [화면 1: 로그인 및 회원가입 화면]
 */
const LoginScreen = () => {
    const navigate = useNavigate();
    const [isSignup, setIsSignup] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [passwordConfirm, setPasswordConfirm] = useState('');
    const [isVerified, setIsVerified] = useState(false);

    const [age, setAge] = useState('');
    const [gender, setGender] = useState('');
    const [height, setHeight] = useState('');
    const [weight, setWeight] = useState('');

    const handleVerify = () => {
        if (!email) {
            alert('이메일을 입력해 주세요.');
            return;
        }
        alert('인증 코드가 발송되었습니다.');
        setIsVerified(true);
    };

    const handleSignupComplete = () => {
        if (!isVerified) {
            alert('이메일 인증이 필요합니다.');
            return;
        }
        if (password !== passwordConfirm) {
            alert('비밀번호가 일치하지 않습니다.');
            return;
        }
        alert('회원가입이 완료되었습니다!');
        setIsSignup(false);
    };

    if (isSignup) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen px-6 py-12 animate-fade-in bg-slate-950">
                <div className="w-full max-w-md space-y-8">
                    <div className="text-center">
                        <h2 className="text-4xl font-black italic tracking-tighter text-white uppercase">Join MyGym</h2>
                        <p className="mt-2 text-slate-400 font-medium">새로운 시작을 위한 정보를 입력해 주세요.</p>
                    </div>
                    <div className="space-y-6 bg-slate-900/50 p-8 rounded-3xl border border-slate-800 shadow-2xl">
                        <div className="space-y-4">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block">계정 정보 (필수)</label>
                            <div className="flex gap-2">
                                <input
                                    type="email"
                                    placeholder="아이디(이메일)"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="flex-1 px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-slate-500 transition-all"
                                />
                                <button 
                                    onClick={handleVerify}
                                    className="px-4 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-sm transition-all whitespace-nowrap active:scale-95"
                                >
                                    인증하기
                                </button>
                            </div>
                            <input
                                type="password"
                                placeholder="비밀번호"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-slate-500 transition-all"
                            />
                            <input
                                type="password"
                                placeholder="비밀번호 확인"
                                value={passwordConfirm}
                                onChange={(e) => setPasswordConfirm(e.target.value)}
                                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-slate-500 transition-all"
                            />
                        </div>
                        <div className="space-y-4 pt-6 border-t border-slate-800">
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-1">AI 코칭 추가 정보 (선택)</label>
                                <p className="text-[11px] text-slate-400 mb-4">더 정확한 AI 코칭을 위해 정보를 입력해 주세요 (선택 사항)</p>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <input 
                                    type="number" 
                                    placeholder="나이" 
                                    value={age}
                                    onChange={(e) => setAge(e.target.value)}
                                    className="px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-slate-500 transition-all" 
                                />
                                <select 
                                    value={gender}
                                    onChange={(e) => setGender(e.target.value)}
                                    className="px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-slate-500 transition-all"
                                >
                                    <option value="">성별</option>
                                    <option value="male">남성</option>
                                    <option value="female">여성</option>
                                </select>
                                <input 
                                    type="number" 
                                    placeholder="키 (cm)" 
                                    value={height}
                                    onChange={(e) => setHeight(e.target.value)}
                                    className="px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-slate-500 transition-all" 
                                />
                                <input 
                                    type="number" 
                                    placeholder="몸무게 (kg)" 
                                    value={weight}
                                    onChange={(e) => setWeight(e.target.value)}
                                    className="px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-slate-500 transition-all" 
                                />
                            </div>
                        </div>
                        <div className="pt-2">
                            <button
                                onClick={handleSignupComplete}
                                className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-blue-500/20 active:scale-95 transition-all mb-4"
                            >
                                가입 완료
                            </button>
                            <button
                                onClick={() => setIsSignup(false)}
                                className="w-full text-sm text-slate-500 hover:text-white transition-colors py-2"
                            >
                                이미 계정이 있나요? 로그인하기
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-screen px-6 animate-fade-in">
            <div className="mb-12 text-center">
                <h1 className="text-6xl font-extrabold italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-indigo-600">
                    MyGym
                </h1>
                <p className="mt-2 text-gray-400 font-medium tracking-wide">LEVEL UP YOUR LIMITS</p>
            </div>
            <div className="w-full max-w-sm space-y-4">
                <div className="space-y-2">
                    <input
                        type="text"
                        placeholder="ID"
                        className="w-full px-4 py-4 bg-slate-800 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-slate-500 transition-all"
                    />
                    <input
                        type="password"
                        placeholder="Password"
                        className="w-full px-4 py-4 bg-slate-800 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-slate-500 transition-all"
                    />
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="flex-1 py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg shadow-blue-500/20 active:scale-95 transition-all"
                    >
                        로그인
                    </button>
                    <button
                        onClick={() => setIsSignup(true)}
                        className="flex-1 py-4 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-xl active:scale-95 transition-all"
                    >
                        회원가입
                    </button>
                </div>
            </div>
        </div>
    );
};

/**
 * [신규 화면: 루틴 상세 (Routine Detail)]
 */
const WorkoutDetailScreen = () => {
    const location = useLocation();
    const data = location.state?.data || { name: '?', part: '기록 없음' };
    const dummyRecords = [
        { name: '데드리프트', sets: 3, reps: 15, weight: 100 },
        { name: '랫풀다운', sets: 4, reps: 12, weight: 60 },
        { name: '바벨 로우', sets: 3, reps: 10, weight: 40 },
    ];
    return (
        <div className="p-8 md:p-12 max-w-4xl mx-auto animate-fade-in">
            <BackButton />
            <div className="mb-10">
                <span className="px-3 py-1 bg-blue-600 text-[10px] font-bold rounded-full uppercase tracking-widest text-white mb-2 inline-block">
                    {data.name}요일 기록
                </span>
                <h2 className="text-4xl font-black italic tracking-tighter text-white">
                    {data.part} 트레이닝 상세
                </h2>
            </div>
            <div className="space-y-4">
                {dummyRecords.map((record, i) => (
                    <div key={i} className="bg-slate-800/50 border border-slate-700 p-6 rounded-2xl flex justify-between items-center group hover:border-blue-500/50 transition-colors">
                        <div>
                            <h3 className="text-xl font-bold text-white mb-1">{record.name}</h3>
                            <p className="text-slate-400 text-sm font-medium">{record.sets} SETS × {record.reps} REPS</p>
                        </div>
                        <div className="text-right">
                            <span className="text-2xl font-black text-blue-500 italic">{record.weight}kg</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

/**
 * [신규 화면: 루틴 기록 (Routine Record)]
 */
const WorkoutSetupScreen = () => {
    const [step, setStep] = useState(1);
    const [selection, setSelection] = useState({ part: '', type: '', exercise: '' });
    const [numSets, setNumSets] = useState('');
    const [setsData, setSetsData] = useState([]);
    const [addedExercises, setAddedExercises] = useState([]);
    const [editingId, setEditingId] = useState(null);

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

    const handleAddOrUpdateExercise = () => {
        if (!isRecordEnabled) return;
        const newEntry = { ...selection, sets: numSets, setsData: [...setsData], id: editingId || Date.now() };
        if (editingId) {
            setAddedExercises(prev => prev.map(ex => ex.id === editingId ? newEntry : ex));
            setEditingId(null);
        } else {
            setAddedExercises([...addedExercises, newEntry]);
        }
        setNumSets('');
        setSetsData([]);
        setStep(1);
        setSelection({ part: '', type: '', exercise: '' });
    };

    const handleDelete = (id) => {
        if (confirm('이 루틴 기록을 삭제하시겠습니까?')) {
            setAddedExercises(prev => prev.filter(ex => ex.id !== id));
        }
    };

    const handleEdit = (ex) => {
        setSelection({ part: ex.part, type: ex.type, exercise: ex.exercise });
        setNumSets(ex.sets);
        setSetsData([...ex.setsData]);
        setEditingId(ex.id);
        setStep(4);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <div className="p-8 md:p-12 max-w-4xl mx-auto animate-fade-in">
            <BackButton />
            <div className="mb-8">
                <h2 className="text-3xl font-black italic text-white uppercase tracking-tighter underline decoration-blue-500 decoration-4 underline-offset-8">
                    루틴 기록
                </h2>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-6">
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 block">Step 1. 부위 선택</label>
                        <div className="grid grid-cols-3 gap-2">
                            {['가슴', '등', '하체', '어깨', '팔'].map(p => (
                                <button key={p} onClick={() => { setSelection({ ...selection, part: p }); setStep(2); }} className={`py-3 rounded-xl font-bold text-sm transition-all ${selection.part === p ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>{p}</button>
                            ))}
                        </div>
                    </div>
                    {step >= 2 && (
                        <div className="animate-fade-in">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 block">Step 2. 종류 선택</label>
                            <div className="flex gap-2">
                                {['프리웨이트', '머신', '케이블'].map(t => (
                                    <button key={t} onClick={() => { setSelection({ ...selection, type: t }); setStep(3); }} className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all ${selection.type === t ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>{t}</button>
                                ))}
                            </div>
                        </div>
                    )}
                    {step >= 3 && (
                        <div className="animate-fade-in">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 block">Step 3. 세부 종목</label>
                            <select 
                                value={selection.exercise} 
                                onChange={(e) => { setSelection({ ...selection, exercise: e.target.value }); setStep(4); }} 
                                className="w-full bg-slate-800 border border-slate-700 text-white p-4 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                            >
                                <option value="">종목을 선택하세요</option>
                                {(EXERCISE_DATA[selection.part]?.[selection.type] || []).map(ex => (
                                    <option key={ex} value={ex}>{ex}</option>
                                ))}
                            </select>
                        </div>
                    )}
                    {step >= 4 && (
                        <div className="animate-fade-in space-y-6 bg-slate-800/30 p-6 rounded-2xl border border-slate-700">
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
                            <button onClick={handleAddOrUpdateExercise} disabled={!isRecordEnabled} className={`w-full py-4 font-black rounded-xl italic tracking-tighter transition-all ${isRecordEnabled ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/20' : 'bg-slate-700 text-slate-500 cursor-not-allowed'}`}>{editingId ? '수정 완료' : '기록하기'}</button>
                        </div>
                    )}
                </div>
                <div className="bg-slate-900/50 rounded-3xl border border-slate-800 p-6">
                    <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2"><span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>현재 기록된 루틴 ({addedExercises.length})</h3>
                    <div className="space-y-4">
                        {addedExercises.length === 0 ? (<p className="text-slate-600 text-center py-12 italic text-sm">기록된 루틴이 없습니다.</p>) : (addedExercises.map((ex, idx) => (
                            <div key={ex.id} className="bg-slate-800 p-4 rounded-xl border border-slate-700 group relative">
                                <div className="flex justify-between items-start mb-3">
                                    <div>
                                        <span className="text-[10px] font-bold text-blue-400 block uppercase">{ex.part} / {ex.type}</span>
                                        <span className="font-bold text-white text-lg">{ex.exercise}</span>
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={() => handleEdit(ex)} className="p-2 bg-slate-700 hover:bg-blue-600 text-white rounded-lg transition-colors"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg></button>
                                        <button onClick={() => handleDelete(ex.id)} className="p-2 bg-slate-700 hover:bg-rose-600 text-white rounded-lg transition-colors"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                                    </div>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {ex.setsData.map((s, i) => (
                                        <div key={i} className="px-3 py-1 bg-slate-900 rounded-lg border border-slate-700 text-[11px] flex flex-col items-center min-w-[50px]">
                                            <span className="text-slate-500 text-[9px] mb-1">{i+1}S</span>
                                            <span className="text-white font-bold">{s.weight}kg</span>
                                            <span className="text-indigo-400 font-medium">{s.reps}R</span>
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-3 text-right"><span className="text-xs font-bold text-slate-500 uppercase">Total {ex.sets} Sets</span></div>
                            </div>
                        )))}
                    </div>
                </div>
            </div>
        </div>
    );
};

/**
 * [신규 화면: 루틴 구성 (Routine Compose)]
 */
const WorkoutPlanScreen = () => {
    const [planList, setPlanList] = useState([]);
    const [selection, setSelection] = useState({ part: '', type: '', exercise: '' });
    const [recordingId, setRecordingId] = useState(null);
    const [tempSets, setTempSets] = useState([{ weight: '', reps: '' }]);

    const addExerciseToPlan = () => {
        if (!selection.exercise) return;
        const newEntry = {
            id: Date.now(),
            ...selection,
            sets: [],
            isCompleted: false
        };
        setPlanList([...planList, newEntry]);
        setSelection({ ...selection, exercise: '' });
    };

    const startRecording = (id) => {
        const item = planList.find(ex => ex.id === id);
        setRecordingId(id);
        setTempSets(item.sets.length > 0 ? [...item.sets] : [{ weight: '', reps: '' }]);
    };

    const handleSetChange = (index, field, value) => {
        const nextSets = [...tempSets];
        nextSets[index] = { ...nextSets[index], [field]: value };
        setTempSets(nextSets);
    };

    const addSetField = () => {
        setTempSets([...tempSets, { weight: '', reps: '' }]);
    };

    const removeSetField = (index) => {
        setTempSets(tempSets.filter((_, i) => i !== index));
    };

    const finishRecording = () => {
        setPlanList(prev => prev.map(ex => 
            ex.id === recordingId 
            ? { ...ex, sets: [...tempSets], isCompleted: true } 
            : ex
        ));
        setRecordingId(null);
    };

    const deleteFromPlan = (id) => {
        setPlanList(planList.filter(ex => ex.id !== id));
        if (recordingId === id) setRecordingId(null);
    };

    return (
        <div className="p-6 md:p-12 max-w-6xl mx-auto animate-fade-in mb-20">
            <BackButton />
            <div className="mb-8">
                <h2 className="text-3xl font-black italic text-white uppercase tracking-tighter underline decoration-indigo-500 decoration-4 underline-offset-8">
                    오늘의 루틴 구성
                </h2>
                <p className="text-slate-400 mt-2 text-sm">먼저 운동 리스트를 만들고, 훈련 중 기록을 입력하세요.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                {/* 왼쪽: 운동 추가 영역 */}
                <div className="lg:col-span-1 space-y-6 bg-slate-900/50 p-6 rounded-3xl border border-slate-800">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <span className="w-2 h-2 bg-indigo-500 rounded-full"></span>운동 추가
                    </h3>
                    <div className="space-y-4">
                        <div>
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-2">부위</label>
                            <div className="grid grid-cols-3 gap-2">
                                {Object.keys(EXERCISE_DATA).map(p => (
                                    <button 
                                        key={p} 
                                        onClick={() => setSelection({ part: p, type: '', exercise: '' })}
                                        className={`py-2 rounded-lg text-xs font-bold transition-all ${selection.part === p ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400'}`}
                                    >
                                        {p}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {selection.part && (
                            <div className="animate-slide-down">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-2">종류</label>
                                <div className="flex gap-2">
                                    {Object.keys(EXERCISE_DATA[selection.part]).map(t => (
                                        <button 
                                            key={t} 
                                            onClick={() => setSelection({ ...selection, type: t, exercise: '' })}
                                            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${selection.type === t ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400'}`}
                                        >
                                            {t}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {selection.type && (
                            <div className="animate-slide-down">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-2">종목</label>
                                <select 
                                    value={selection.exercise}
                                    onChange={(e) => setSelection({ ...selection, exercise: e.target.value })}
                                    className="w-full bg-slate-800 border border-slate-700 text-white p-3 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                                >
                                    <option value="">운동을 선택하세요</option>
                                    {EXERCISE_DATA[selection.part][selection.type].map(ex => (
                                        <option key={ex} value={ex}>{ex}</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        <button 
                            onClick={addExerciseToPlan}
                            disabled={!selection.exercise}
                            className={`w-full py-3 rounded-xl font-black italic uppercase tracking-tighter transition-all ${selection.exercise ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20' : 'bg-slate-800 text-slate-600'}`}
                        >
                            리스트에 추가
                        </button>
                    </div>
                </div>

                {/* 중앙: 오늘의 리스트 */}
                <div className="lg:col-span-2 space-y-4">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
                        <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>오늘의 리스트 ({planList.length})
                    </h3>

                    {planList.length === 0 ? (
                        <div className="py-20 text-center bg-slate-900/30 rounded-3xl border border-slate-800 border-dashed">
                            <p className="text-slate-500 italic text-sm">먼저 운동을 추가해 주세요.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {planList.map((item) => (
                                <div key={item.id} className={`bg-slate-900 border transition-all rounded-2xl overflow-hidden ${recordingId === item.id ? 'border-indigo-500 ring-1 ring-indigo-500' : 'border-slate-800'}`}>
                                    <div className="p-5 flex justify-between items-center">
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-[9px] font-black px-2 py-0.5 bg-slate-800 text-slate-400 rounded uppercase">{item.part}</span>
                                                {item.isCompleted && <span className="text-[9px] font-black px-2 py-0.5 bg-emerald-500/20 text-emerald-400 rounded uppercase tracking-tighter">완료</span>}
                                            </div>
                                            <h4 className={`font-bold text-lg ${item.isCompleted ? 'text-slate-500' : 'text-white'}`}>{item.exercise}</h4>
                                            {item.sets.length > 0 && (
                                                <p className="text-[11px] text-indigo-400 font-bold mt-1 uppercase tracking-widest">{item.sets.length} Sets Completed</p>
                                            )}
                                        </div>
                                        <div className="flex gap-2">
                                            {!item.isCompleted ? (
                                                <button 
                                                    onClick={() => startRecording(item.id)}
                                                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black italic rounded-lg transition-all active:scale-95"
                                                >
                                                    기록하기
                                                </button>
                                            ) : (
                                                <button 
                                                    onClick={() => startRecording(item.id)}
                                                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-black italic rounded-lg transition-all"
                                                >
                                                    수정
                                                </button>
                                            )}
                                            <button 
                                                onClick={() => deleteFromPlan(item.id)}
                                                className="p-2 text-slate-600 hover:text-rose-500 transition-colors"
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                            </button>
                                        </div>
                                    </div>

                                    {/* 기록용 동적 폼 */}
                                    {recordingId === item.id && (
                                        <div className="bg-slate-800/50 p-5 border-t border-slate-700 animate-slide-down">
                                            <div className="space-y-3 mb-4">
                                                {tempSets.map((s, idx) => (
                                                    <div key={idx} className="flex items-center gap-3">
                                                        <span className="text-[10px] font-bold text-slate-500 w-6">{idx + 1}S</span>
                                                        <input 
                                                            type="number" 
                                                            placeholder="KG" 
                                                            value={s.weight}
                                                            onChange={(e) => handleSetChange(idx, 'weight', e.target.value)}
                                                            className="flex-1 bg-slate-900 border border-slate-700 rounded-lg p-2 text-white text-sm font-bold focus:outline-none focus:border-indigo-500"
                                                        />
                                                        <input 
                                                            type="number" 
                                                            placeholder="REPS" 
                                                            value={s.reps}
                                                            onChange={(e) => handleSetChange(idx, 'reps', e.target.value)}
                                                            className="flex-1 bg-slate-900 border border-slate-700 rounded-lg p-2 text-white text-sm font-bold focus:outline-none focus:border-indigo-500"
                                                        />
                                                        <button onClick={() => removeSetField(idx)} className="text-slate-600 hover:text-rose-500">
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                            <div className="flex gap-2">
                                                <button 
                                                    onClick={addSetField}
                                                    className="flex-1 py-2 bg-slate-700 hover:bg-slate-600 text-white text-[11px] font-bold rounded-lg transition-all"
                                                >
                                                    + 세트 추가
                                                </button>
                                                <button 
                                                    onClick={finishRecording}
                                                    className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold rounded-lg transition-all shadow-lg shadow-emerald-500/20"
                                                >
                                                    기록 완료
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

/**
 * [신규 화면: Ai코치 (AI Coach)]
 */
const AIRecommendationScreen = () => {
    return (
        <div className="p-8 md:p-12 max-w-4xl mx-auto animate-fade-in">
            <BackButton />
            <div className="bg-gradient-to-br from-indigo-900/40 to-blue-900/40 border border-blue-500/30 rounded-[2rem] p-8 md:p-12 relative overflow-hidden shadow-2xl">
                <div className="absolute top-0 right-0 p-8 opacity-10"><svg className="w-32 h-32 text-blue-400" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z" /></svg></div>
                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-6"><div className="px-3 py-1 bg-blue-500 text-[10px] font-black text-white rounded-md tracking-widest animate-pulse">AI ANALYZING...</div></div>
                    <h2 className="text-4xl md:text-5xl font-black italic tracking-tighter text-white mb-8 leading-tight">TODAY'S <br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400 underline decoration-blue-500/50">SMART PICK</span></h2>
                    <div className="bg-slate-900/60 backdrop-blur-md border border-white/5 p-6 rounded-2xl mb-10"><p className="text-slate-200 text-lg leading-relaxed font-medium">"최근 <span className="text-blue-400 font-bold">등</span>과 <span className="text-blue-400 font-bold">가슴</span> 운동을 하셨고 크레아틴을 섭취 중이시니, 오늘은 폭발적인 에너지를 낼 수 있는 <span className="text-indigo-400 font-bold">하체 프리웨이트 훈련</span>을 추천합니다!"</p></div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {[{ name: '백 스쿼트', desc: '강력한 하체 파워를 위한 필수 코스', diff: '상' }, { name: '루마니안 데드리프트', desc: '후면 사슬의 근신경계 자극 극대화', diff: '중' }].map((rec, i) => (
                            <div key={i} className="bg-white/5 border border-white/10 p-5 rounded-2xl flex justify-between items-center group hover:bg-white/10 transition-all cursor-pointer">
                                <div><h4 className="text-xl font-bold text-white group-hover:text-blue-400 transition-colors">{rec.name}</h4><p className="text-slate-400 text-xs mt-1">{rec.desc}</p></div>
                                <span className="w-8 h-8 rounded-full border border-blue-500/50 flex items-center justify-center text-[10px] font-black text-blue-400">{rec.diff}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

/**
 * [화면 2: 메인 대시보드 화면]
 */
const DashboardScreen = () => {
    const navigate = useNavigate();
    const recentDays = useMemo(() => {
        const days = ['일', '월', '화', '수', '목', '금', '토'];
        const result = [];
        const today = new Date();
        for (let i = 5; i >= 1; i--) {
            const d = new Date();
            d.setDate(today.getDate() - i);
            result.push({ name: days[d.getDay()], part: ['가슴', '하체', '휴식', '어깨', '등'][Math.floor(Math.random() * 5)] });
        }
        return result;
    }, []);

    const getBadgeColor = (part) => {
        switch (part) {
            case '가슴': return 'bg-rose-500/20 text-rose-400 border-rose-500/30';
            case '하체': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
            case '어깨': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
            case '등': return 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30';
            default: return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
        }
    };

    return (
        <div className="flex flex-col md:flex-row min-h-screen animate-fade-in overflow-x-hidden">
            <div className="w-full md:w-1/2 p-6 md:p-12 border-b md:border-b-0 md:border-r border-slate-800 bg-slate-950 flex flex-col justify-center">
                <div className="mb-8 md:mb-10">
                    <h2 className="text-xl md:text-2xl font-bold flex items-center gap-2 text-white"><span className="w-1.5 h-6 bg-blue-500 rounded-full"></span>최근 루틴 기록</h2>
                    <p className="text-slate-400 text-xs md:text-sm mt-1">지난 5일간의 트레이닝 결과입니다.</p>
                </div>
                <div className="grid grid-cols-5 gap-2 md:gap-3">
                    {recentDays.map((day, idx) => (
                        <div key={idx} className="flex flex-col items-center gap-3 md:gap-4 group">
                            <span className="text-slate-500 font-semibold text-[10px] md:text-sm">{day.name}</span>
                            <div onClick={() => navigate('/routine-detail', { state: { data: day } })} className={`w-full py-2.5 md:py-3 px-1 md:px-2 rounded-lg md:rounded-xl border text-center text-[9px] md:text-xs font-bold cursor-pointer transition-all active:scale-90 hover:scale-105 ${getBadgeColor(day.part)}`}>{day.part}</div>
                        </div>
                    ))}
                </div>
                <div className="mt-10 md:mt-12 p-5 md:p-6 bg-slate-800/50 rounded-2xl border border-slate-700/50">
                    <h3 className="text-md md:text-lg font-bold text-slate-200">Weekly Summary</h3>
                    <div className="mt-4 flex items-end gap-2 h-20 md:h-24">
                        {[40, 70, 45, 90, 65].map((val, i) => (
                            <div key={i} className="flex-1 bg-blue-500/20 rounded-t-lg relative group"><div className="absolute bottom-0 w-full bg-blue-600 rounded-t-lg" style={{ height: `${val}%` }}></div></div>
                        ))}
                    </div>
                </div>
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
                <button onClick={() => navigate('/routine-compose')} className="h-[220px] md:flex-1 group relative overflow-hidden bg-indigo-950 flex flex-col items-center justify-center transition-all hover:bg-indigo-950 border-b border-slate-800 md:border-b-0">
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
        </div>
    );
};

const App = () => {
    return (
        <BrowserRouter>
            <div className="min-h-screen bg-slate-950 text-slate-50 selection:bg-blue-500/30 font-sans">
                <Routes>
                    <Route path="/" element={<LoginScreen />} />
                    <Route path="/dashboard" element={<DashboardScreen />} />
                    <Route path="/routine-detail" element={<WorkoutDetailScreen />} />
                    <Route path="/routine-record" element={<WorkoutSetupScreen />} />
                    <Route path="/routine-compose" element={<WorkoutPlanScreen />} />
                    <Route path="/ai-coach" element={<AIRecommendationScreen />} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </div>
        </BrowserRouter>
    );
};

const root = createRoot(document.getElementById('root'));
root.render(<App />);