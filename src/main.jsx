import React, { useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { Toaster } from 'sonner'; // sonner 추가
import './i18n/i18n';

// 컴포넌트 import
import Onboarding from './components/Onboarding';
import LoginScreen from './components/Auth/LoginScreen';
import DayDetailView from './components/Calendar/DayDetailView';
import ExerciseNameEditor from './components/Admin/ExerciseNameEditor';
import MainLayout from './components/Layout/MainLayout';

// 커스텀 훅 import
import { useAuth, isOnboardingComplete } from './hooks/useAuth';

const AppContent = () => {
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        if (typeof window.gtag !== 'function') return;
        window.gtag('event', 'page_view', {
            page_path: location.pathname + location.search,
            send_to: 'G-9WVC2JRCWT',
        });
    }, [location]);

    const {
        session,
        profile,
        setProfile,
        isChecking,
        isInitializing,
        handleStartApp,
        fetchProfileWithTimeout
    } = useAuth();

    return (
        <>
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
                            isOnboardingComplete(profile) ? <MainLayout /> : <Navigate to="/onboarding" replace />
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
            {/* 전역 토스트 알림 컴포넌트 추가 */}
            <Toaster richColors position="top-center" closeButton />
        </>
    );
};

const App = () => (<BrowserRouter><AppContent /></BrowserRouter>);
const root = createRoot(document.getElementById('root'));
root.render(<App />);
