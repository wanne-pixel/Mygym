import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, useNavigate, Navigate, useSearchParams } from 'react-router-dom';
import { supabase } from './src/api/supabase';
import Onboarding from './src/components/Onboarding';
import BottomNav from './src/components/BottomNav';
import AIRecommendationScreen from './src/components/AiCoach/AiRecommendationScreen';
import WorkoutPlanScreen from './src/components/WorkoutPlan/WorkoutPlanScreen';
import CalendarScreen from './src/components/Calendar/CalendarScreen';
import LoginScreen from './src/components/Auth/LoginScreen';
import AnalysisScreen from './src/components/Common/AnalysisScreen';
import DayDetailView from './src/components/Calendar/DayDetailView';

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
    const [isLoading, setIsLoading] = useState(true);

    const fetchProfile = async (userId) => {
        try {
            const { data, error } = await supabase
                .from('user_profiles')
                .select('*')
                .eq('user_id', userId)
                .maybeSingle();
            
            if (error) throw error;
            setProfile(data);
        } catch (e) {
            console.error('Error fetching profile:', e);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            if (session) fetchProfile(session.user.id);
            else setIsLoading(false);
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            setSession(session);
            if (session) fetchProfile(session.user.id);
            else {
                setProfile(null);
                setIsLoading(false);
            }
            
            if (event === 'SIGNED_IN') navigate('/app', { replace: true });
            else if (event === 'SIGNED_OUT') navigate('/', { replace: true });
        });

        return () => subscription.unsubscribe();
    }, [navigate]);

    if (isLoading) return <div className="flex items-center justify-center min-h-screen text-white font-black italic animate-pulse">MYGYM LOADING...</div>;
    if (!session) return <LoginScreen />;
    
    // 프로필이 없으면 온보딩 표시
    if (!profile) {
        return <Onboarding onComplete={() => fetchProfile(session.user.id)} />;
    }

    return (
        <Routes>
            <Route path="/" element={<MainAppLayout />} />
            <Route path="/app" element={<MainAppLayout />} />
            <Route path="/routine-detail" element={<DayDetailView date={new URLSearchParams(window.location.search).get('date')} onBack={() => window.history.back()} />} />
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
};

const App = () => (<BrowserRouter><AppContent /></BrowserRouter>);
const root = createRoot(document.getElementById('root'));
root.render(<App />);
