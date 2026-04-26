import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { supabase } from '../api/supabase';
import { clearBetaModalFlag } from '../components/Common/BetaNoticeModal';

export const isOnboardingComplete = (p) =>
    !!(p?.experience_level && ((Array.isArray(p?.goals) && p.goals.length > 0) || !!p?.goal));

export const useAuth = () => {
    const navigate = useNavigate();
    const { t } = useTranslation();
    const [session, setSession] = useState(null);
    const [profile, setProfile] = useState(null);
    const [isChecking, setIsChecking] = useState(false);
    const [isInitializing, setIsInitializing] = useState(true);

    const fetchProfileWithTimeout = async (userId) => {
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
            if (error) throw error;
            return data;
        } catch (e) {
            console.error('--- [프로필 조회 예외]:', e.message);
            throw e;
        }
    };

    const handleStartApp = async (currentSession) => {
        if (!currentSession || isChecking) return;
        setIsChecking(true);
        try {
            const p = await fetchProfileWithTimeout(currentSession.user.id);
            setProfile(p);
            if (isOnboardingComplete(p)) {
                navigate('/app', { replace: true });
            } else {
                navigate('/onboarding', { replace: true });
            }
        } catch (err) {
            toast.error(t('common.serverDelay'));
        } finally {
            setIsChecking(false);
            setIsInitializing(false);
        }
    };

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session: s } }) => {
            setSession(s);
            if (s && window.location.pathname !== '/') {
                handleStartApp(s);
            } else {
                setIsInitializing(false);
            }
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
            setSession(s);
            if (!s) {
                setProfile(null);
                setIsInitializing(false);
                clearBetaModalFlag();
                navigate('/', { replace: true });
            }
        });
        return () => subscription.unsubscribe();
    }, [navigate]);

    return {
        session, profile, setProfile, isChecking, isInitializing,
        handleStartApp, fetchProfileWithTimeout
    };
};
