import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { supabase } from '../../api/supabase';
import { fetchAllExercises } from '../../api/exerciseApi';
import { setGlobalExerciseCache } from '../../utils/exerciseUtils';

const MAX_CHAT_HISTORY = 10;
const SESSION_CHAT_KEY = 'mygym_session_chat';

const callAiCoachFunction = async (payload) => {
    console.log('[callAiCoachFunction] Payload:', payload);
    try {
        const { data, error } = await supabase.functions.invoke('ai-coach', {
            body: payload
        });
        
        if (error) {
            console.error('[AI Coach Function Error]:', error);
            throw error;
        }

        if (!data) {
            console.error('[AI Coach] No data in response');
            throw new Error('No response data received from AI Coach');
        }

        console.log('[callAiCoachFunction] Response:', data);
        return data;
    } catch (err) {
        console.error('[AI Coach Call Exception]:', err);
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
                
                // 엔진 호환성을 위해 snake_case를 camelCase로 변환한 객체 생성
                const mappedProfile = profileRes.data ? {
                    ...profileRes.data,
                    experienceLevel: profileRes.data.experience_level,
                    weeklyFrequency: profileRes.data.weekly_frequency,
                    availableTime: profileRes.data.available_time
                } : null;
                
                setProfile(mappedProfile);
                
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
            if (!session) throw new Error('No session');
            
            const recentLogs = await fetchRecentWorkouts(session.user.id);

            const response = await callAiCoachFunction({
                type: 'chat',
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

            if (response?.reply || response?.content) {
                setMessages(prev => [...prev, { 
                    id: Date.now() + Math.random(), 
                    type: 'ai', 
                    msgType: response.parsedData ? 'recommendation' : 'chat',
                    text: response.reply || response.content 
                }]);
            } else {
                throw new Error('Invalid AI response structure');
            }
        } catch (e) {
            console.error('[handleSendMessage Error]:', e);
            toast.error(t('aiCoach.fetchError'));
            setMessages(prev => [...prev, { id: Date.now() + Math.random(), type: 'ai', msgType: 'chat', text: t('aiCoach.fetchError') }]);
        } finally { 
            setIsTyping(false); 
        }
    };

    const callRecommendation = async (mode, selectedMode = 'today_routine') => {
        console.log(`[useAiCoach] 추천 요청 시작. 모드: ${mode}, 상세모드: ${selectedMode}`);
        setIsTyping(true);
        const isHard = mode === 'hard';
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                console.error('[useAiCoach] 세션이 없습니다.');
                throw new Error('Session not found');
            }
            
            console.log('[useAiCoach] 최근 운동 기록 조회 중...');
            const recentLogs = await fetchRecentWorkouts(session.user.id);
            console.log(`[useAiCoach] 조회된 로그 수: ${recentLogs.length}`);

            const response = await callAiCoachFunction({
                type: 'recommendation',
                lang: i18n.language,
                exercises: exerciseDataset,
                userProfile: profile,
                recentWorkouts: recentLogs,
                selectedMode: isHard ? selectedMode : 'today_routine',
            });

            const replyText = response?.reply || response?.content;
            if (replyText) {
                console.log('[useAiCoach] 추천 메시지 추가 중...');
                setMessages(prev => [...prev, {
                    id: Date.now() + Math.random(),
                    type: 'ai',
                    msgType: 'recommendation',
                    isHardMode: isHard,
                    text: replyText,
                    engineConfig: response.engineConfig
                }]);
            } else {
                console.error('[useAiCoach] 응답 텍스트가 없습니다:', response);
                throw new Error('Invalid AI recommendation response');
            }
        } catch (e) {
            console.error('[callRecommendation Error]:', e);
            toast.error(t('aiCoach.fetchError'));
            setMessages(prev => [...prev, { 
                id: Date.now() + Math.random(), 
                type: 'ai', 
                msgType: 'chat', 
                text: t('aiCoach.fetchError') 
            }]);
            // 에러를 상위로 다시 던지지 않고 내부에서 처리 (UI 무반응 방지)
            // 하지만 caller가 await로 기다리고 있으므로 여기서 끝남
        } finally { 
            setIsTyping(false); 
            console.log('[useAiCoach] 추천 요청 프로세스 종료 (finally)');
        }
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
