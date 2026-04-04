const { useState, useMemo, useEffect } = React;

/**
 * [공통: 뒤로가기 버튼 컴포넌트]
 */
const BackButton = ({ onClick }) => (
    <button 
        onClick={onClick}
        className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-6 group"
    >
        <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
        </svg>
        <span className="font-medium">대시보드로 돌아가기</span>
    </button>
);

/**
 * [화면 1: 로그인 화면]
 */
const LoginScreen = ({ onLogin }) => {
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
                        onClick={onLogin}
                        className="flex-1 py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg shadow-blue-500/20 active:scale-95 transition-all"
                    >
                        로그인
                    </button>
                    <button
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
 * [신규 화면: 운동 상세 기록 (Workout Detail)]
 */
const WorkoutDetailScreen = ({ data, onBack }) => {
    const dummyRecords = [
        { name: '데드리프트', sets: 3, reps: 15, weight: 100 },
        { name: '랫풀다운', sets: 4, reps: 12, weight: 60 },
        { name: '바벨 로우', sets: 3, reps: 10, weight: 40 },
    ];

    return (
        <div className="p-8 md:p-12 max-w-4xl mx-auto animate-fade-in">
            <BackButton onClick={onBack} />
            
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
 * [신규 화면: 운동 구성 (Workout Setup)]
 */
const WorkoutSetupScreen = ({ onBack }) => {
    const [step, setStep] = useState(1);
    const [selection, setSelection] = useState({ part: '', type: '', exercise: '' });
    const [input, setInput] = useState({ weight: '', reps: '', sets: '' });
    const [addedSets, setAddedSets] = useState([]);

    const handleAddSet = () => {
        if (!input.weight || !input.reps) return;
        setAddedSets([...addedSets, { ...selection, ...input, id: Date.now() }]);
        setInput({ ...input, weight: '', reps: '' });
    };

    return (
        <div className="p-8 md:p-12 max-w-4xl mx-auto animate-fade-in">
            <BackButton onClick={onBack} />

            <div className="mb-8">
                <h2 className="text-3xl font-black italic text-white uppercase tracking-tighter underline decoration-blue-500 decoration-4 underline-offset-8">
                    운동 구성하기
                </h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* 입력 섹션 */}
                <div className="space-y-6">
                    {/* 1단계: 부위 */}
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 block">Step 1. 부위 선택</label>
                        <div className="grid grid-cols-3 gap-2">
                            {['가슴', '등', '하체', '어깨', '팔'].map(p => (
                                <button 
                                    key={p}
                                    onClick={() => { setSelection({ ...selection, part: p }); setStep(2); }}
                                    className={`py-3 rounded-xl font-bold text-sm transition-all ${selection.part === p ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
                                >
                                    {p}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* 2단계: 타입 */}
                    {step >= 2 && (
                        <div className="animate-fade-in">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 block">Step 2. 종류 선택</label>
                            <div className="flex gap-2">
                                {['프리웨이트', '머신', '케이블'].map(t => (
                                    <button 
                                        key={t}
                                        onClick={() => { setSelection({ ...selection, type: t }); setStep(3); }}
                                        className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all ${selection.type === t ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
                                    >
                                        {t}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* 3단계: 종목 */}
                    {step >= 3 && (
                        <div className="animate-fade-in">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 block">Step 3. 세부 종목</label>
                            <select 
                                onChange={(e) => { setSelection({ ...selection, exercise: e.target.value }); setStep(4); }}
                                className="w-full bg-slate-800 border border-slate-700 text-white p-4 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                            >
                                <option value="">종목을 선택하세요</option>
                                <option value="벤치프레스">벤치프레스</option>
                                <option value="데드리프트">데드리프트</option>
                                <option value="스쿼트">스쿼트</option>
                            </select>
                        </div>
                    )}

                    {/* 4단계: 입력 */}
                    {step >= 4 && (
                        <div className="animate-fade-in space-y-4 bg-slate-800/30 p-6 rounded-2xl border border-slate-700">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-bold text-slate-500 uppercase mb-2 block tracking-tighter">Weight (kg)</label>
                                    <input 
                                        type="number" 
                                        value={input.weight}
                                        onChange={(e) => setInput({...input, weight: e.target.value})}
                                        className="w-full bg-slate-900 border border-slate-700 p-3 rounded-xl text-white text-center font-bold" 
                                        placeholder="0"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-slate-500 uppercase mb-2 block tracking-tighter">Reps</label>
                                    <input 
                                        type="number" 
                                        value={input.reps}
                                        onChange={(e) => setInput({...input, reps: e.target.value})}
                                        className="w-full bg-slate-900 border border-slate-700 p-3 rounded-xl text-white text-center font-bold" 
                                        placeholder="0"
                                    />
                                </div>
                            </div>
                            <button 
                                onClick={handleAddSet}
                                className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-xl italic tracking-tighter transition-all"
                            >
                                ADD SET +
                            </button>
                        </div>
                    )}
                </div>

                {/* 리스트 섹션 */}
                <div className="bg-slate-900/50 rounded-3xl border border-slate-800 p-6">
                    <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                        <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
                        현재 구성된 운동 ({addedSets.length})
                    </h3>
                    <div className="space-y-3">
                        {addedSets.length === 0 ? (
                            <p className="text-slate-600 text-center py-12 italic text-sm">기록된 세트가 없습니다.</p>
                        ) : (
                            addedSets.map((s, idx) => (
                                <div key={s.id} className="flex justify-between items-center bg-slate-800 p-4 rounded-xl border border-slate-700">
                                    <div>
                                        <span className="text-[10px] font-bold text-blue-400 block uppercase">{s.part} / {s.type}</span>
                                        <span className="font-bold text-white">{s.exercise}</span>
                                    </div>
                                    <div className="text-right font-black italic text-slate-300">
                                        {s.weight}kg × {s.reps}회
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

/**
 * [신규 화면: AI 운동 추천 (AI Recommendation)]
 */
const AIRecommendationScreen = ({ onBack }) => {
    return (
        <div className="p-8 md:p-12 max-w-4xl mx-auto animate-fade-in">
            <BackButton onClick={onBack} />
            
            <div className="bg-gradient-to-br from-indigo-900/40 to-blue-900/40 border border-blue-500/30 rounded-[2rem] p-8 md:p-12 relative overflow-hidden shadow-2xl">
                <div className="absolute top-0 right-0 p-8 opacity-10">
                    <svg className="w-32 h-32 text-blue-400" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z" />
                    </svg>
                </div>

                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="px-3 py-1 bg-blue-500 text-[10px] font-black text-white rounded-md tracking-widest animate-pulse">AI ANALYZING...</div>
                    </div>
                    
                    <h2 className="text-4xl md:text-5xl font-black italic tracking-tighter text-white mb-8 leading-tight">
                        TODAY'S <br/>
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400 underline decoration-blue-500/50">SMART PICK</span>
                    </h2>

                    <div className="bg-slate-900/60 backdrop-blur-md border border-white/5 p-6 rounded-2xl mb-10">
                        <p className="text-slate-200 text-lg leading-relaxed font-medium">
                            "최근 <span className="text-blue-400 font-bold">등</span>과 <span className="text-blue-400 font-bold">가슴</span> 운동을 하셨고 크레아틴을 섭취 중이시니, 오늘은 폭발적인 에너지를 낼 수 있는 <span className="text-indigo-400 font-bold">하체 프리웨이트 훈련</span>을 추천합니다!"
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {[
                            { name: '백 스쿼트', desc: '강력한 하체 파워를 위한 필수 코스', diff: '상' },
                            { name: '루마니안 데드리프트', desc: '후면 사슬의 근신경계 자극 극대화', diff: '중' }
                        ].map((rec, i) => (
                            <div key={i} className="bg-white/5 border border-white/10 p-5 rounded-2xl flex justify-between items-center group hover:bg-white/10 transition-all cursor-pointer">
                                <div>
                                    <h4 className="text-xl font-bold text-white group-hover:text-blue-400 transition-colors">{rec.name}</h4>
                                    <p className="text-slate-400 text-xs mt-1">{rec.desc}</p>
                                </div>
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
const DashboardScreen = ({ onNavigate }) => {
    const recentDays = useMemo(() => {
        const days = ['일', '월', '화', '수', '목', '금', '토'];
        const result = [];
        const today = new Date();
        for (let i = 5; i >= 1; i--) {
            const d = new Date();
            d.setDate(today.getDate() - i);
            result.push({
                name: days[d.getDay()],
                part: ['가슴', '하체', '휴식', '어깨', '등'][Math.floor(Math.random() * 5)]
            });
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
        <div className="flex flex-col md:flex-row min-h-screen animate-fade-in">
            {/* 좌측 영역: 최근 운동 기록 */}
            <div className="flex-1 p-8 md:p-12 border-b md:border-b-0 md:border-r border-slate-800">
                <div className="mb-10">
                    <h2 className="text-2xl font-bold flex items-center gap-2 text-white">
                        <span className="w-1.5 h-6 bg-blue-500 rounded-full"></span>
                        최근 운동 기록
                    </h2>
                    <p className="text-slate-400 text-sm mt-1">지난 5일간의 트레이닝 결과입니다.</p>
                </div>

                <div className="grid grid-cols-5 gap-3">
                    {recentDays.map((day, idx) => (
                        <div key={idx} className="flex flex-col items-center gap-4 group">
                            <span className="text-slate-500 font-semibold text-sm">{day.name}</span>
                            <div 
                                onClick={() => onNavigate('workoutDetail', day)}
                                className={`w-full py-3 px-2 rounded-xl border text-center text-xs font-bold cursor-pointer transition-all active:scale-90 hover:scale-105 ${getBadgeColor(day.part)}`}
                            >
                                {day.part}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-12 p-6 bg-slate-800/50 rounded-2xl border border-slate-700/50">
                    <h3 className="text-lg font-bold text-slate-200">Weekly Summary</h3>
                    <div className="mt-4 flex items-end gap-2 h-24">
                        {[40, 70, 45, 90, 65].map((val, i) => (
                            <div key={i} className="flex-1 bg-blue-500/20 rounded-t-lg relative group">
                                <div className="absolute bottom-0 w-full bg-blue-600 rounded-t-lg" style={{ height: `${val}%` }}></div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* 우측 영역: 메뉴 버튼 */}
            <div className="flex-1 flex flex-col h-[60vh] md:h-screen">
                <button 
                    onClick={() => onNavigate('workoutSetup')}
                    className="flex-1 group relative overflow-hidden bg-slate-900 flex flex-col items-center justify-center transition-all hover:bg-slate-800"
                >
                    <div className="absolute inset-0 opacity-10 bg-[url('https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=800')] bg-cover bg-center group-hover:scale-110 transition-transform duration-700"></div>
                    <div className="relative z-10 flex flex-col items-center">
                        <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-blue-600/30 group-hover:rotate-12 transition-transform">
                            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                        </div>
                        <span className="text-2xl font-black italic text-white tracking-tighter">운동 구성</span>
                        <p className="text-slate-400 text-sm mt-1">WORKOUT SETUP</p>
                    </div>
                </button>

                <button 
                    onClick={() => onNavigate('aiRecommendation')}
                    className="flex-1 group relative overflow-hidden bg-blue-700 flex flex-col items-center justify-center transition-all hover:bg-blue-600"
                >
                    <div className="absolute inset-0 opacity-20 bg-[url('https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=800')] bg-cover bg-center group-hover:scale-110 transition-transform duration-700"></div>
                    <div className="relative z-10 flex flex-col items-center">
                        <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mb-4 border border-white/30 group-hover:-rotate-12 transition-transform">
                            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                        </div>
                        <span className="text-2xl font-black italic text-white tracking-tighter">운동 추천</span>
                        <p className="text-blue-100 text-sm mt-1">AI RECOMMENDATION</p>
                    </div>
                </button>
            </div>
        </div>
    );
};

const App = () => {
    const [currentScreen, setCurrentScreen] = useState('login'); 
    const [selectedData, setSelectedData] = useState(null);

    const navigate = (screen, data = null) => {
        setSelectedData(data);
        setCurrentScreen(screen);
        window.scrollTo(0, 0);
    };

    return (
        <div className="min-h-screen bg-slate-950 text-slate-50 selection:bg-blue-500/30 font-sans">
            {currentScreen === 'login' && <LoginScreen onLogin={() => navigate('dashboard')} />}
            {currentScreen === 'dashboard' && <DashboardScreen onNavigate={navigate} />}
            {currentScreen === 'workoutDetail' && <WorkoutDetailScreen data={selectedData} onBack={() => navigate('dashboard')} />}
            {currentScreen === 'workoutSetup' && <WorkoutSetupScreen onBack={() => navigate('dashboard')} />}
            {currentScreen === 'aiRecommendation' && <AIRecommendationScreen onBack={() => navigate('dashboard')} />}
        </div>
    );
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
