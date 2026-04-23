import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../../api/supabase';
import { STORAGE_KEYS } from '../../constants/exerciseConstants';
import EXERCISE_DATASET from '../../data/exercises.json';

const MAX_CHAT_HISTORY = 100;
const SESSION_CHAT_KEY = 'mygym_session_chat';

const callAiCoachFunction = async (payload) => {
    console.log('[AI COACH REQUEST]', payload);

    try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError || !session) {
            throw new Error('로그인 세션이 만료되었습니다.');
        }

        const token = session.access_token;
        const { data, error } = await supabase.functions.invoke('ai-coach', {
            body: payload,
            headers: { Authorization: `Bearer ${token}` }
        });

        if (error) {
            console.error('[AI COACH API ERROR]', error);
            throw error;
        }

        console.log('[AI COACH RESPONSE]', data);
        return data; // { reply, msgType } 반환
    } catch (err) {
        console.error('[AI COACH CALL FAILED]', err);
        throw err;
    }
};

export const useAiCoach = () => {
    const { t, i18n } = useTranslation();
    const [profile, setProfile] = useState(null);
    const [recentStats, setRecentStats] = useState({ totalWorkouts: 0, mostFrequentPart: null });
    const [personalRecords, setPersonalRecords] = useState({});
    const [messages, setMessages] = useState(() => {
        try {
            return JSON.parse(sessionStorage.getItem(SESSION_CHAT_KEY) || '[]');
        } catch {
            return [];
        }
    });
    const [isTyping, setIsTyping] = useState(false);

    const getMostFrequent = (arr) => {
        if (!arr || arr.length === 0) return null;
        const counts = {};
        arr.forEach(item => { if (item) counts[item] = (counts[item] || 0) + 1; });
        const keys = Object.keys(counts);
        return keys.length === 0 ? null : keys.reduce((a, b) => counts[a] > counts[b] ? a : b);
    };

    const fetchExercisePersonalRecords = async (userId) => {
        try {
            const { data: logs } = await supabase
                .from('workout_logs')
                .select('exercise, sets_data')
                .eq('user_id', userId);

            if (!logs || logs.length === 0) return {};

            const records = {};
            logs.forEach(log => {
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
            return records;
        } catch (error) {
            console.error('[PR] 최고 기록 조회 실패:', error);
            return {};
        }
    };

    const generateGreeting = (profile, stats) => {
        if (!profile) return t('aiCoach.greeting.noProfile');
        const { experience_level, goals, weekly_frequency, limitations } = profile;
        const { totalWorkouts } = stats;
        let text = t('aiCoach.greeting.welcome');

        if (experience_level === 'beginner') text += t('aiCoach.greeting.beginner');
        else if (experience_level === 'intermediate') text += t('aiCoach.greeting.intermediate');
        else if (experience_level === 'advanced') text += t('aiCoach.greeting.advanced');

        const goalLabels = { 
            strength: t('onboarding.goal.strength'), 
            hypertrophy: t('onboarding.goal.hypertrophy'), 
            weight_loss: t('onboarding.goal.weightLoss'), 
            maintenance: t('onboarding.goal.maintenance') 
        };

        const mainGoal = Array.isArray(goals) && goals.length > 0 ? goals[0] : (profile.goal || 'maintenance');
        text += (goalLabels[mainGoal] || goalLabels.maintenance) + t('aiCoach.greeting.weeklyFrequency', { count: weekly_frequency });

        if (limitations?.length > 0) {
            const parts = limitations.map(l => t(`onboarding.limitations.${l}`, { defaultValue: l })).join(', ');
            text += t('aiCoach.greeting.limitations', { parts });
        }

        if (totalWorkouts > 0) {
            text += t('aiCoach.greeting.stats', { count: totalWorkouts });
        } else {
            text += t('aiCoach.greeting.start');
        }
        return text;
    };

    useEffect(() => {
        const initializeChat = async () => {
            const lastResetTime = sessionStorage.getItem('aiCoachLastReset');
            const now = Date.now();
            const twelveHours = 12 * 60 * 60 * 1000;
            let shouldReset = !lastResetTime || (now - parseInt(lastResetTime) >= twelveHours);

            try {
                const { data: { session } } = await supabase.auth.getSession();
                if (!session) return;
                const userId = session.user.id;
                const { data: profileData } = await supabase.from('user_profiles').select('*').eq('user_id', userId).maybeSingle();
                setProfile(profileData);
                const sevenDaysAgo = new Date();
                sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
                const { data: logs } = await supabase.from('workout_logs').select('*').eq('user_id', userId).gte('created_at', sevenDaysAgo.toISOString());
                const stats = { totalWorkouts: new Set(logs?.map(l => l.created_at.split('T')[0])).size || 0, mostFrequentPart: getMostFrequent(logs?.map(l => l.part)) };
                setRecentStats(stats);

                const records = await fetchExercisePersonalRecords(userId);
                setPersonalRecords(records);

                if (shouldReset || messages.length === 0) {
                    const greetingText = generateGreeting(profileData, stats);
                    const initialMessage = { id: Date.now(), type: 'ai', msgType: 'chat', text: greetingText };
                    setMessages([initialMessage]);
                    sessionStorage.setItem('aiCoachLastReset', now.toString());
                }
            } catch (e) { console.error('Error initializing AI Coach:', e); }
        };
        initializeChat();
    }, []);

    useEffect(() => {
        const trimmed = messages.slice(-MAX_CHAT_HISTORY);
        sessionStorage.setItem(SESSION_CHAT_KEY, JSON.stringify(trimmed));
    }, [messages]);

    const fetchRecentWorkouts = async (userId) => {
        const fiveDaysAgo = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString();
        try {
            const { data: logs } = await supabase
                .from('workout_logs')
                .select('part, exercise, sets_data, created_at')
                .eq('user_id', userId)
                .gte('created_at', fiveDaysAgo)
                .order('created_at', { ascending: false });

            if (!logs || logs.length === 0) return [];

            const grouped = {};
            logs.forEach(log => {
                const date = log.created_at.split('T')[0];
                if (!grouped[date]) grouped[date] = { date, parts: [], exercises: [] };

                if (log.part && !grouped[date].parts.includes(log.part)) {
                    grouped[date].parts.push(log.part);
                }

                let sets = [];
                try {
                    sets = typeof log.sets_data === 'string'
                        ? JSON.parse(log.sets_data)
                        : (Array.isArray(log.sets_data) ? log.sets_data : []);
                } catch {}

                const bestSet = sets.reduce((best, s) => {
                    const kg = parseFloat(s?.kg) || 0;
                    return kg > (parseFloat(best?.kg) || 0) ? s : best;
                }, sets[0] || null);

                if (log.exercise) {
                    grouped[date].exercises.push({
                        part: log.part,
                        exercise: log.exercise,
                        bestKg: bestSet ? parseFloat(bestSet.kg) || 0 : 0,
                        bestReps: bestSet ? parseInt(bestSet.reps) || 0 : 0,
                        totalSets: sets.length,
                    });
                }
            });
            return Object.values(grouped);
        } catch (error) {
            console.error('[RECENT] 최근 운동 기록 조회 실패:', error);
            return [];
        }
    };

    const callOpenAI = async (userPrompt, currentHistory) => {
        setIsTyping(true);

        try {
            const { data: { session } } = await supabase.auth.getSession();
            let recentWorkouts = [];
            if (session) {
                recentWorkouts = await fetchRecentWorkouts(session.user.id);
            }

            const goalLabels = { 
                strength: t('onboarding.goal.strength'), 
                hypertrophy: t('onboarding.goal.hypertrophy'), 
                weight_loss: t('onboarding.goal.weightLoss'), 
                maintenance: t('onboarding.goal.maintenance') 
            };
            const goalsDisplay = Array.isArray(profile?.goals) && profile.goals.length > 0
                ? profile.goals.map(g => goalLabels[g] || g).join(', ')
                : goalLabels[profile?.goal] || profile?.goal || t('aiCoach.prompt.none');

            const systemMessage = `${t('aiCoach.prompt.systemRole')}

${t('aiCoach.prompt.userProfile')}
- ${t('aiCoach.prompt.goal')}: ${goalsDisplay}
- ${t('aiCoach.prompt.experience')}: ${profile?.experience_level || t('aiCoach.prompt.none')}
- ${t('aiCoach.prompt.frequency')}: ${profile?.weekly_frequency || 0}${t('onboarding.frequency.unit')}
- ${t('aiCoach.prompt.time')}: ${profile?.available_time || t('aiCoach.prompt.none')}
- ${t('aiCoach.prompt.limitations')}: ${profile?.limitations?.map(l => t(`onboarding.limitations.${l}`, { defaultValue: l })).join(', ') || t('aiCoach.prompt.none')}

${t('aiCoach.prompt.rules')}
`;

            const response = await callAiCoachFunction({
                type: 'chat',
                systemMessage,
                lang: i18n.language,
                chatHistory: currentHistory.slice(-6).map(m => ({
                    role: m.type === 'ai' ? 'assistant' : 'user',
                    content: m.text,
                })),
                userPrompt,
                recentWorkouts,
            });

            setMessages(prev => [...prev, { 
                id: Date.now() + 1, 
                type: 'ai', 
                msgType: response.msgType || 'chat',
                text: response.reply 
            }]);
        } catch (e) {
            console.error(e);
            setMessages(prev => [...prev, { id: Date.now() + 1, type: 'ai', msgType: 'chat', text: t('aiCoach.fetchError') }]);
        } finally {
            setIsTyping(false);
        }
    };

    const handleSendMessage = async (displayText, aiPrompt = displayText) => {
        if (!displayText.trim() || isTyping) return;
        const userMsg = { id: Date.now(), type: 'user', text: displayText };
        const updatedHistory = [...messages, userMsg];
        setMessages(updatedHistory);
        await callOpenAI(aiPrompt, updatedHistory);
    };

    const callRecommendation = async (mode, selectedMode = 'today_routine') => {
        setIsTyping(true);

        let displayModeName = selectedMode;
        if (mode === 'hard') {
            const hardModeKeys = {
                'hard_mode_low_weight': 'aiCoach.hardModes.lowWeightHighRep',
                'hard_mode_high_weight': 'aiCoach.hardModes.highWeightLowRep',
                'hard_mode_progressive': 'aiCoach.hardModes.progressiveOverload',
                'hard_mode_drop_set': 'aiCoach.hardModes.dropSet'
            };
            displayModeName = t(hardModeKeys[selectedMode] || selectedMode);
        }

        const displayText = mode === 'hard'
            ? `🔥 ${t('aiCoach.hardMode')} (${displayModeName})`
            : t('aiCoach.promptRecommend');

        const userMsg = { id: Date.now(), type: 'user', text: displayText };
        setMessages(prev => [...prev, userMsg]);

        try {
            const { data: { session } } = await supabase.auth.getSession();
            let recentWorkouts = [];
            if (session) {
                recentWorkouts = await fetchRecentWorkouts(session.user.id);
            }

            const response = await callAiCoachFunction({
                type: 'recommendation',
                lang: i18n.language,
                exercises: EXERCISE_DATASET,
                userProfile: {
                    level: profile?.experience_level || 'beginner',
                    frequency: profile?.weekly_frequency || 3,
                    availableTime: profile?.available_time || '30분~1시간',
                    goals: Array.isArray(profile?.goals) && profile.goals.length > 0
                        ? profile.goals
                        : (profile?.goal ? [profile.goal] : ['maintenance']),
                    limitations: profile?.limitations || [],
                },
                recentWorkouts,
                selectedMode: mode === 'hard' ? selectedMode : 'today_routine',
            });

            // callAiCoachFunction은 supabase.functions.invoke의 data만 반환하므로
            // response = { reply, content, parsedData } 구조
            console.log("=== RECOMMENDATION RESPONSE ===");
            console.log("Full response:", response);
            console.log("response.reply:", response?.reply);
            console.log("response.content:", response?.content);
            console.log("response.parsedData:", response?.parsedData);

            const reply = response?.reply ?? response?.content ?? null;
            console.log("Extracted reply:", reply);

            if (!reply) {
                console.error("No reply extracted from response");
                throw new Error("AI 응답에서 텍스트를 추출할 수 없습니다.");
            }

            setMessages(prev => [...prev, {
                id: Date.now() + 1,
                type: 'ai',
                msgType: response?.msgType || 'recommendation',
                text: reply
            }]);
        } catch (e) {
            console.error('[callRecommendation ERROR]', e);
            setMessages(prev => [...prev, { id: Date.now() + 1, type: 'ai', msgType: 'chat', text: t('aiCoach.fetchError') }]);
        } finally {
            setIsTyping(false);
        }
    };

    const insertRoutineToDb = async (routine) => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) throw new Error(t('common.loginRequired'));

            const { error } = await supabase
                .from('workout_logs')
                .insert({
                    user_id: session.user.id,
                    part: routine.part,
                    exercise: routine.exercise,
                    type: routine.type || 'strength',
                    sets_count: routine.sets_count,
                    sets_data: routine.sets_data,
                    is_completed: false
                });

            if (error) throw error;
            return true;
        } catch (error) {
            console.error('[DB Insert Error]', error);
            throw error;
        }
    };

    const handleManualReset = () => {
        if (!confirm(t('aiCoach.resetConfirm'))) return;
        const greetingText = generateGreeting(profile, recentStats);
        const initialMessage = { id: Date.now(), type: 'ai', msgType: 'chat', text: greetingText };
        setMessages([initialMessage]);
        sessionStorage.setItem('aiCoachLastReset', Date.now().toString());
    };

    return { 
        profile, 
        recentStats, 
        messages, 
        setMessages, 
        isTyping, 
        handleSendMessage, 
        handleManualReset, 
        insertRoutineToDb, 
        callOpenAI, 
        callRecommendation 
    };
};

