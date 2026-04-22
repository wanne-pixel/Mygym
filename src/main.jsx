import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, useNavigate, Navigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import './i18n/i18n';
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

const LangSwitcher = () => {
    const { i18n } = useTranslation();
    const toggle = () => {
        const next = i18n.language === 'ko' ? 'en' : 'ko';
        i18n.changeLanguage(next);
        localStorage.setItem('mygym_lang', next);
    };
    return (
        <button
            onClick={toggle}
            className="flex items-center px-3 py-2 bg-slate-900/90 backdrop-blur-sm border border-white/10 text-slate-400 hover:text-white hover:border-white/20 rounded-xl text-xs font-bold transition-all"
        >
            {i18n.language === 'ko' ? 'EN' : '한'}
        </button>
    );
};

const MainAppLayout = () => {
    const { t } = useTranslation();
    const [searchParams, setSearchParams] = useSearchParams();
    const activeTab = searchParams.get('tab') || '달력';
    const handleTabChange = (tab) => setSearchParams({ tab });
    return (
        <div className="relative min-h-screen bg-slate-950">
            {/* PC: 좌측 사이드바 */}
            <div className="hidden lg:block">
                <SideNav activeTab={activeTab} onTabChange={handleTabChange} />
            </div>
            {/* PC: 우측 상단 고정 버튼 영역 */}
            <div className="hidden lg:flex fixed top-4 right-6 z-50 items-center gap-2">
                <LangSwitcher />
                <button
                    onClick={async () => {
                        if (window.confirm(t('nav.logoutConfirm'))) {
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
                    {t('nav.logout')}
                </button>
            </div>
            {/* 메인 콘텐츠: PC에서 사이드바 너비만큼 밀어냄 */}
            <main className="lg:ml-56">
                {activeTab === '달력' && <CalendarScreen />}
                {activeTab === '루틴구성' && <WorkoutPlanScreen />}
                {activeTab === 'AI코치' && <AIRecommendationScreen />}
                {activeTab === 'analysis' && <AnalysisScreen />}
            </main>
            {/* 모바일: 하단 탭바 */}
            <BottomNav activeTab={activeTab} onTabChange={handleTabChange} />
        </div>
    );
};

const isOnboardingComplete = (p) =>
    !!(p?.experience_level && ((Array.isArray(p?.goals) && p.goals.length > 0) || !!p?.goal));

const AppContent = () => {
    const navigate = useNavigate();
    const { t } = useTranslation();
    const [session, setSession] = useState(null);
    const [profile, setProfile] = useState(null);
    const [isChecking, setIsChecking] = useState(false);
    const [isInitializing, setIsInitializing] = useState(true);

    const fetchProfileWithTimeout = async (userId) => {
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
                console.error('--- [프로필 조회 실패] 에러 코드:', error.code, '| 메시지:', error.message);
                throw error;
            }

            console.log('--- [프로필 조회 성공]:', data ? '기존 회원' : '신규 가입자(프로필 없음)');
            return data;
        } catch (e) {
            console.error('--- [프로필 조회 예외]:', e.message);
            throw e;
        }
    };

    const handleStartApp = async (currentSession) => {
        if (!currentSession || isChecking) return;

        setIsChecking(true);
        console.log('--- [앱 진입 시도: 세션 확인됨] ---');

        try {
            const p = await fetchProfileWithTimeout(currentSession.user.id);
            setProfile(p);

            if (isOnboardingComplete(p)) {
                navigate('/app', { replace: true });
            } else {
                navigate('/onboarding', { replace: true });
            }
        } catch (err) {
            alert(t('common.serverDelay'));
        } finally {
            setIsChecking(false);
            setIsInitializing(false);
        }
    };

    useEffect(() => {
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
