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

const MainAppLayout = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const activeTab = searchParams.get('tab') || '달력';
    return (
        <div className="relative min-h-screen bg-slate-950">
            <main>
                {activeTab === '달력' && <CalendarScreen />}
                {activeTab === '루틴구성' && <WorkoutPlanScreen />}
                {activeTab === 'AI코치' && <AIRecommendationScreen />}
                {activeTab === 'analysis' && <AnalysisScreen />}
            </main>
            <BottomNav activeTab={activeTab} onTabChange={(tab) => setSearchParams({ tab })} />
        </div>
    );
};

const AppContent = () => {
    const navigate = useNavigate();
    const [session, setSession] = useState(null);
    const [profile, setProfile] = useState(null);
    const [isChecking, setIsChecking] = useState(false);

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

    // 사용자가 로그인 화면에서 '시작하기' 또는 로그인을 완료했을 때 호출할 함수
    const handleStartApp = async (currentSession) => {
        if (!currentSession) return;
        
        setIsChecking(true);
        console.log('--- [앱 진입 시도: 세션 확인됨] ---');
        
        try {
            const p = await fetchProfileWithTimeout(currentSession.user.id);
            setProfile(p);
            
            if (p) {
                console.log('--- [기존 유저]: 메인 화면으로 이동 ---');
                navigate('/app', { replace: true });
            } else {
                console.log('--- [신규 유저]: 온보딩 화면으로 이동 ---');
                navigate('/onboarding', { replace: true });
            }
        } catch (err) {
            alert('서버 응답이 지연되고 있습니다. 잠시 후 다시 시도해주세요.');
        } finally {
            setIsChecking(false);
        }
    };

    useEffect(() => {
        // 앱 구동 시 세션 유무만 확인 (자동 리다이렉트 제거)
        supabase.auth.getSession().then(({ data: { session: s } }) => {
            console.log('--- [초기 세션 체크]:', s ? '세션 존재' : '세션 없음');
            setSession(s);
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
            console.log('--- [인증 상태 변경]:', _event);
            setSession(s);
            if (!s) {
                setProfile(null);
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
                        onStart={() => handleStartApp(session)} 
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
                    session ? (
                        profile ? <MainAppLayout /> : <Navigate to="/onboarding" replace />
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
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
};

const App = () => (<BrowserRouter><AppContent /></BrowserRouter>);
const root = createRoot(document.getElementById('root'));
root.render(<App />);
