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
        const { data: logs } = await supabase
            .from('workout_logs')
            .select('id, user_id, exercise, sets_data, created_at')
            .eq('user_id', userId)
            .gte('created_at', fiveDaysAgo)
            .order('created_at', { ascending: false });

        if (!logs || logs.length === 0) return [];

        // workout_logs에는 body_part가 없으므로 exercises 테이블에서 조회해 보강
        const uniqueNames = [...new Set(logs.map(l => l.exercise))];
        const { data: exerciseInfo } = await supabase
            .from('exercises')
            .select('name, body_part')
            .in('name', uniqueNames);

        const bodyPartMap = Object.fromEntries((exerciseInfo || []).map(ex => [ex.name, ex.body_part]));
        return logs.map(log => ({ ...log, exercise_body_part: bodyPartMap[log.exercise] || null }));
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
                
                const mappedProfile = profileRes.data ? {
                    ...profileRes.data,
                    experienceLevel: profileRes.data.experience_level,
                    weeklyFrequency: profileRes.data.weekly_frequency,
                    availableTime: profileRes.data.available_time
                } : null;
                
                setProfile(mappedProfile);
                
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

    const processAiResponse = (response, isHard = false, selectedMode = 'today_routine') => {
        const rawText = response?.reply || response?.content || "";
        let parsedData = null;
        let displayType = 'chat';

        try {
            const jsonMatch = rawText.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const tempObj = JSON.parse(jsonMatch[0]);
                
                const targetData = tempObj['운동추천'] || tempObj['recommendation'] || tempObj['routines'] || tempObj;

                if (targetData) {
                    parsedData = {
                        reason: targetData['추천사유'] || targetData['recommendationReason'] || targetData['reason'] || targetData['설명'] || "",
                        routines: (targetData['운동종목'] || targetData['운동목록'] || targetData['routines'] || targetData['items'] || targetData['exercises'] || []).map(item => ({
                            part: item['부위'] || item['part'] || (Array.isArray(targetData['부위']) ? targetData['부위'][0] : targetData['부위']) || "",
                            exercise: item['운동명'] || item['종목명'] || item['이름'] || item['exercise'] || "",
                            sub_target_focus: item['세부타겟'] || item['세부부위'] || item['sub_target_focus'] || "",
                            sets_data: item['세트정보'] || item['세트'] || item['sets_data'] || []
                        }))
                    };
                    
                    if (parsedData.routines.length > 0 && parsedData.routines[0].exercise !== "") {
                        displayType = 'recommendation';
                    }
                }
            }
        } catch (e) {
            console.warn('[useAiCoach] JSON 파싱 및 매핑 실패:', e);
        }

        setMessages(prev => [...prev, {
            id: Date.now() + Math.random(),
            type: 'ai',
            msgType: displayType,
            isHardMode: isHard,
            selectedMode: selectedMode,
            text: rawText,
            parsedData: parsedData,
            engineConfig: response.engineConfig
        }]);
    };

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

            processAiResponse(response);
        } catch (e) {
            console.error('[handleSendMessage Error]:', e);
            toast.error(t('aiCoach.fetchError'));
            setMessages(prev => [...prev, { id: Date.now() + Math.random(), type: 'ai', msgType: 'chat', text: t('aiCoach.fetchError') }]);
        } finally { 
            setIsTyping(false); 
        }
    };

    const callRecommendation = async (mode, selectedMode = 'today_routine') => {
        setIsTyping(true);
        const isHard = mode === 'hard';
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) throw new Error('Session not found');
            const recentLogs = await fetchRecentWorkouts(session.user.id);

            const response = await callAiCoachFunction({
                type: 'recommendation',
                lang: i18n.language,
                exercises: exerciseDataset,
                userProfile: profile,
                recentWorkouts: recentLogs,
                selectedMode: isHard ? selectedMode : 'today_routine',
            });

            processAiResponse(response, isHard, isHard ? selectedMode : 'today_routine');
        } catch (e) {
            console.error('[callRecommendation Error]:', e);
            toast.error(t('aiCoach.fetchError'));
            setMessages(prev => [...prev, { id: Date.now() + Math.random(), type: 'ai', msgType: 'chat', text: t('aiCoach.fetchError') }]);
        } finally { 
            setIsTyping(false); 
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
