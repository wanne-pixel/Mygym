const { useState, useMemo } = React;

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
 * [화면 2: 메인 대시보드 화면]
 */
const DashboardScreen = () => {
    // 최근 5일간의 요일 계산 (오늘 제외 이전 5일)
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
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                        <span className="w-1.5 h-6 bg-blue-500 rounded-full"></span>
                        최근 운동 기록
                    </h2>
                    <p className="text-slate-400 text-sm mt-1">지난 5일간의 트레이닝 결과입니다.</p>
                </div>

                <div className="grid grid-cols-5 gap-3">
                    {recentDays.map((day, idx) => (
                        <div key={idx} className="flex flex-col items-center gap-4">
                            <span className="text-slate-500 font-semibold text-sm">{day.name}</span>
                            <div className={`w-full py-3 px-2 rounded-xl border text-center text-xs font-bold ${getBadgeColor(day.part)}`}>
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
                                <div 
                                    className="absolute bottom-0 w-full bg-blue-600 rounded-t-lg transition-all duration-1000" 
                                    style={{ height: `${val}%` }}
                                ></div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* 우측 영역: 메뉴 버튼 */}
            <div className="flex-1 flex flex-col h-[50vh] md:h-screen">
                {/* 상단 절반: 운동 구성 */}
                <button className="flex-1 group relative overflow-hidden bg-slate-900 flex flex-col items-center justify-center transition-all hover:bg-slate-800">
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

                {/* 하단 절반: 운동 추천 */}
                <button className="flex-1 group relative overflow-hidden bg-blue-700 flex flex-col items-center justify-center transition-all hover:bg-blue-600">
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
    const [screen, setScreen] = useState('login'); // 'login' | 'dashboard'

    return (
        <div className="min-h-screen bg-slate-950 text-slate-50 selection:bg-blue-500/30">
            {screen === 'login' ? (
                <LoginScreen onLogin={() => setScreen('dashboard')} />
            ) : (
                <DashboardScreen />
            )}
        </div>
    );
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
