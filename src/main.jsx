import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, useNavigate, Navigate, useSearchParams } from 'react-router-dom';
import { supabase } from './api/supabase';
import Onboarding from './components/Onboarding';
import BottomNav from './components/BottomNav';
import AIRecommendationScreen from './components/AiCoach/AiRecommendationScreen';
import WorkoutPlanScreen from './components/WorkoutPlan/WorkoutPlanScreen';
import CalendarScreen from './components/Calendar/CalendarScreen';
import LoginScreen from './components/Auth/LoginScreen';
import AnalysisScreen from './components/Common/AnalysisScreen';
import DayDetailView from './components/Calendar/DayDetailView';
import ExerciseNameEditor from './components/Admin/ExerciseNameEditor';
import SideNav from './components/SideNav';

const MainAppLayout = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const activeTab = searchParams.get('tab') || '달력';
    const handleTabChange = (tab) => setSearchParams({ tab });
    return (
        <div className="relative min-h-screen bg-slate-950">
            {/* PC: 좌측 사이드바 */}
            <div className="hidden lg:block">
                <SideNav activeTab={activeTab} onTabChange={handleTabChange} />
            </div>
            {/* PC: 우측 상단 고정 로그아웃 버튼 */}
            <div className="hidden lg:block fixed top-4 right-6 z-50">
                <button
                    onClick={async () => {
                        if (window.confirm('로그아웃 하시겠습니까?')) {
                            await supabase.auth.signOut();
                            localStorage.clear();
                        }
                    }}
                    className="flex items-center gap-2 px-3 py-2 bg-slate-900/90 backdrop-blur-sm border border-white/10 text-slate-400 hover:text-red-400 hover:border-red-500/30 hover:bg-red-900/10 rounded-xl text-xs font-bold transition-all"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                        <polyline points="16 17 21 12 16 7" />
                        <line x1="21" y1="12" x2="9" y2="12" />
                    </svg>
                    로그아웃
                </button>
            </div>
            {/* 메인 콘텐츠: PC에서 사이드바 너비만큼 밀어냄 */}
            <main className="lg:ml-56">
                {activeTab === '달력' && <CalendarScreen />}
                {activeTab === '루틴구성' && <WorkoutPlanScreen />}
                {activeTab === 'AI코치' && <AIRecommendationScreen />}
                {activeTab === 'analysis' && <AnalysisScreen />}
            </main>
            {/* 모바일: 하단 탭바 (lg 이상에서 숨김은 BottomNav 내부에서 처리) */}
            <BottomNav activeTab={activeTab} onTabChange={handleTabChange} />
        </div>
    );
};

// 온보딩 완료 여부: experience_level이 있고 goals가 비어있지 않아야 완료로 판단
const isOnboardingComplete = (p) =>
    !!(p?.experience_level && ((Array.isArray(p?.goals) && p.goals.length > 0) || !!p?.goal));

const AppContent = () => {
    const navigate = useNavigate();
    const [session, setSession] = useState(null);
    const [profile, setProfile] = useState(null);
    const [isChecking, setIsChecking] = useState(false);
    const [isInitializing, setIsInitializing] = useState(true);

    // 타임아웃이 포함된 프로필 조회 함수
    const fetchProfileWithTimeout = async (userId) => {
        // [DEBUG] 프로덕션 배포 전 아래 console 라인들 제거 가능
        console.log('--- [프로필 조회 시작] userId:', userId);

        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Supabase Profile Fetch Timeout (10s)')), 10000)
        );

        try {
            const fetchPromise = supabase
                .from('user_profiles')
                .select('*')
                .eq('user_id', userId)
                .maybeSingle();

            const { data, error } = await Promise.race([fetchPromise, timeoutPromise]);

            if (error) {
                // [DEBUG] 에러 코드로 원인 구분
                // PGRST116 = 결과 없음(RLS 정책에 의해 행이 차단된 경우도 포함)
                // 42501     = RLS 권한 거부 (정책 자체가 없을 때)
                // NetworkError = 네트워크/CORS 문제
                console.error('--- [프로필 조회 실패] 에러 코드:', error.code, '| 메시지:', error.message, '| 힌트:', error.hint);
                if (error.code === '42501') {
                    console.error('--- [RLS 진단] RLS 정책이 누락되어 접근이 거부되었습니다. Supabase 대시보드에서 user_profiles 테이블의 SELECT 정책을 확인하세요.');
                } else if (error.message?.includes('NetworkError') || error.message?.includes('Failed to fetch')) {
                    console.error('--- [네트워크 진단] 네트워크 오류입니다. CORS 설정 또는 Supabase URL/Key를 확인하세요.');
                }
                throw error;
            }

            // [DEBUG] 조회 성공 시 반환 데이터 구조 확인
            console.log('--- [프로필 조회 성공]:', data ? '기존 회원' : '신규 가입자(프로필 없음)');
            if (data) {
                console.log('--- [프로필 데이터 구조]:', JSON.stringify(data, null, 2));
            }
            return data;
        } catch (e) {
            console.error('--- [프로필 조회 예외]:', e.message);
            throw e;
        }
    };

    // 세션이 확인된 후 프로필을 조회하고 온보딩 완료 여부에 따라 라우팅
    const handleStartApp = async (currentSession) => {
        if (!currentSession || isChecking) return;

        setIsChecking(true);
        console.log('--- [앱 진입 시도: 세션 확인됨] ---');

        try {
            const p = await fetchProfileWithTimeout(currentSession.user.id);
            setProfile(p);

            if (isOnboardingComplete(p)) {
                console.log('--- [온보딩 완료 유저]: 메인 화면으로 이동 ---');
                navigate('/app', { replace: true });
            } else {
                console.log('--- [온보딩 미완료 유저]: 온보딩 화면으로 이동 ---');
                navigate('/onboarding', { replace: true });
            }
        } catch (err) {
            alert('서버 응답이 지연되고 있습니다. 잠시 후 다시 시도해주세요.');
        } finally {
            setIsChecking(false);
            setIsInitializing(false);
        }
    };

    useEffect(() => {
        // 초기 세션 확인: 세션이 있고 로그인 페이지가 아니면 자동으로 프로필 조회 및 라우팅
        // (Google OAuth 리다이렉트, 페이지 새로고침 케이스 처리)
        supabase.auth.getSession().then(({ data: { session: s } }) => {
            console.log('--- [초기 세션 체크]:', s ? '세션 존재' : '세션 없음');
            setSession(s);
            if (s && window.location.pathname !== '/') {
                handleStartApp(s);
            } else {
                setIsInitializing(false);
            }
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
            console.log('--- [인증 상태 변경]:', _event);
            setSession(s);
            if (!s) {
                setProfile(null);
                setIsInitializing(false);
                navigate('/', { replace: true });
            }
        });

        return () => subscription.unsubscribe();
    }, [navigate]);

    return (
        <Routes>
            <Route
                path="/"
                element={
                    <LoginScreen
                        session={session}
                        isChecking={isChecking}
                        onStart={(s) => handleStartApp(s || session)}
                    />
                }
            />
            <Route 
                path="/onboarding" 
                element={
                    session ? (
                        <Onboarding onComplete={async () => {
                            const p = await fetchProfileWithTimeout(session.user.id);
                            setProfile(p);
                            navigate('/app', { replace: true });
                        }} />
                    ) : <Navigate to="/" replace />
                } 
            />
            <Route
                path="/app"
                element={
                    isInitializing ? (
                        <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                            <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : session ? (
                        isOnboardingComplete(profile) ? <MainAppLayout /> : <Navigate to="/onboarding" replace />
                    ) : <Navigate to="/" replace />
                }
            />
            <Route 
                path="/routine-detail" 
                element={
                    session ? (
                        <DayDetailView 
                            date={new URLSearchParams(window.location.search).get('date')} 
                            onBack={() => navigate(-1)} 
                            onGoToRoutine={() => navigate('/app?tab=루틴구성')}
                        />
                    ) : <Navigate to="/" replace />
                } 
            />
            <Route path="/admin/exercise-editor" element={<ExerciseNameEditor />} />
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
};

const App = () => (<BrowserRouter><AppContent /></BrowserRouter>);
const root = createRoot(document.getElementById('root'));
root.render(<App />);
