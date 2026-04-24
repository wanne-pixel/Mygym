import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../../api/supabase';
import { fetchAllExercises } from '../../api/exerciseApi';
import { setGlobalExerciseCache } from '../../utils/exerciseUtils';

const MAX_CHAT_HISTORY = 10;
const SESSION_CHAT_KEY = 'mygym_session_chat';

const callAiCoachFunction = async (payload) => {
    try {
        const { data, error } = await supabase.functions.invoke('ai-coach', {
            body: payload
        });
        if (error) throw error;
        return data;
    } catch (err) {
        console.error('[AI COACH CALL FAILED]', err);
        throw err;
    }
};

export const useAiCoach = () => {
    const { t, i18n } = useTranslation();
    const [profile, setProfile] = useState(null);
    const [exerciseDataset, setExerciseDataset] = useState([]);
    const [personalRecords, setPersonalRecords] = useState({});
    const [messages, setMessages] = useState(() => {
        try {
            return JSON.parse(sessionStorage.getItem(SESSION_CHAT_KEY) || '[]');
        } catch { return []; }
    });
    const [isTyping, setIsTyping] = useState(false);

    const fetchRecentWorkouts = async (userId) => {
        const fiveDaysAgo = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString();
        const { data: logs } = await supabase.from('workout_logs').select('*').eq('user_id', userId).gte('created_at', fiveDaysAgo).order('created_at', { ascending: false });
        return logs || [];
    };

    useEffect(() => {
        const initializeChat = async () => {
            try {
                const dataset = await fetchAllExercises();
                setExerciseDataset(dataset);
                setGlobalExerciseCache(dataset);

                const { data: { session } } = await supabase.auth.getSession();
                if (!session) return;
                const userId = session.user.id;
                const [profileRes, prs] = await Promise.all([
                    supabase.from('user_profiles').select('*').eq('user_id', userId).maybeSingle(),
                    supabase.from('workout_logs').select('exercise, sets_data').eq('user_id', userId)
                ]);
                setProfile(profileRes.data);
                
                // PR 매핑 로직
                const records = {};
                (prs.data || []).forEach(log => {
                    const exerciseName = log.exercise;
                    let sets = typeof log.sets_data === 'string' ? JSON.parse(log.sets_data) : log.sets_data;
                    if (!Array.isArray(sets)) return;
                    sets.forEach(set => {
                        const kg = parseFloat(set.kg) || 0;
                        const reps = parseInt(set.reps) || 0;
                        if (!records[exerciseName] || kg > records[exerciseName].kg) {
                            records[exerciseName] = { kg, reps };
                        }
                    });
                });
                setPersonalRecords(records);

                if (messages.length === 0) {
                    setMessages([{ id: Date.now(), type: 'ai', msgType: 'chat', text: t('aiCoach.greeting.welcome') }]);
                }
            } catch (e) { console.error('Error initializing AI Coach:', e); }
        };
        initializeChat();
    }, [t]);

    useEffect(() => {
        sessionStorage.setItem(SESSION_CHAT_KEY, JSON.stringify(messages.slice(-20)));
    }, [messages]);

    const handleSendMessage = async (displayText) => {
        if (!displayText.trim() || isTyping) return;
        setMessages(prev => [...prev, { id: Date.now(), type: 'user', text: displayText }]);
        setIsTyping(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const recentLogs = session ? await fetchRecentWorkouts(session.user.id) : [];

            const response = await callAiCoachFunction({
                type: 'chat', // 명시적 타입: 채팅
                lang: i18n.language,
                userProfile: profile,
                recentWorkouts: recentLogs,
                exercises: exerciseDataset,
                chatHistory: messages.slice(-MAX_CHAT_HISTORY).map(m => ({
                    role: m.type === 'ai' ? 'assistant' : 'user',
                    content: m.text,
                })),
                userPrompt: displayText,
            });

            setMessages(prev => [...prev, { 
                id: Date.now() + 1, 
                type: 'ai', 
                msgType: response.parsedData ? 'recommendation' : 'chat',
                text: response.reply 
            }]);
        } catch (e) {
            setMessages(prev => [...prev, { id: Date.now() + 1, type: 'ai', msgType: 'chat', text: t('aiCoach.fetchError') }]);
        } finally { setIsTyping(false); }
    };

    const callRecommendation = async (mode, selectedMode = 'today_routine') => {
        setIsTyping(true);
        const isHard = mode === 'hard';
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const recentLogs = session ? await fetchRecentWorkouts(session.user.id) : [];

            const response = await callAiCoachFunction({
                type: 'recommendation', // 명시적 타입: 추천 전용
                lang: i18n.language,
                exercises: exerciseDataset,
                userProfile: profile,
                recentWorkouts: recentLogs,
                selectedMode: isHard ? selectedMode : 'today_routine',
            });

            setMessages(prev => [...prev, {
                id: Date.now() + 1,
                type: 'ai',
                msgType: 'recommendation',
                isHardMode: isHard,
                text: response?.reply || response?.content
            }]);
        } catch (e) {
            setMessages(prev => [...prev, { id: Date.now() + 1, type: 'ai', msgType: 'chat', text: t('aiCoach.fetchError') }]);
        } finally { setIsTyping(false); }
    };

    const handleManualReset = () => {
        if (!confirm(t('aiCoach.resetConfirm'))) return;
        setMessages([{ id: Date.now(), type: 'ai', msgType: 'chat', text: t('aiCoach.greeting.welcome') }]);
    };

    return { 
        profile, exerciseDataset, personalRecords, messages, setMessages, 
        isTyping, handleSendMessage, handleManualReset, callRecommendation 
    };
};
