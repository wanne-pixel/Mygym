import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../../api/supabase';
import { STORAGE_KEYS } from '../../constants/exerciseConstants';
import EXERCISE_DATASET from '../../data/exercises.json';

const MAX_CHAT_HISTORY = 100;
const SESSION_CHAT_KEY = 'mygym_session_chat';

const callAiCoachFunction = async (payload) => {
    console.log('[FRONTEND] Starting AI Coach request')
    console.log('[FRONTEND] Payload type:', payload?.type)

    // 1. 현재 세션 강제 확인
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session) {
        throw new Error('로그인 세션이 만료되었습니다. 다시 로그인해주세요.');
    }

    const token = session.access_token;

    // 2. invoke 호출 시 headers에 토큰 명시적으로 포함
    const { data, error } = await supabase.functions.invoke('ai-coach', {
        body: payload,
        headers: {
            Authorization: `Bearer ${token}`
        }
    });

    if (error) throw error;
    if (data?.error) throw new Error(data.error);

    return data.content;
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
        const { experience_level, goal, weekly_frequency, limitations } = profile;
        const { totalWorkouts } = stats;
        let text = t('aiCoach.greeting.welcome');
        
        if (experience_level === 'beginner') text += t('aiCoach.greeting.beginner');
        else if (experience_level === 'intermediate') text += t('aiCoach.greeting.intermediate');
        else if (experience_level === 'advanced') text += t('aiCoach.greeting.advanced');
        
        const goalText = { 
            strength: t('onboarding.goal.strength'), 
            hypertrophy: t('onboarding.goal.hypertrophy'), 
            weight_loss: t('onboarding.goal.weightLoss'), 
            maintenance: t('onboarding.goal.maintenance') 
        };
        
        text += (goalText[goal] || t('onboarding.goal.maintenance')) + t('aiCoach.greeting.weeklyFrequency', { count: weekly_frequency });
        
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
                    const initialMessage = { id: Date.now(), type: 'ai', text: greetingText };
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

    const callOpenAI = async (userPrompt, currentHistory) => {
        setIsTyping(true);
        const recordsText = Object.keys(personalRecords).length > 0
            ? Object.entries(personalRecords).map(([name, r]) => `- ${name}: ${r.kg}kg × ${r.reps}${t('dayDetail.repsUnit')}`).join('\n')
            : t('aiCoach.prompt.none') + ` (${t('aiCoach.prompt.beginnerLevel')})`;

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
- ${t('aiCoach.prompt.equipment')}: ${profile?.equipment_access || t('aiCoach.prompt.none')}
- ${t('aiCoach.prompt.limitations')}: ${profile?.limitations?.map(l => t(`onboarding.limitations.${l}`, { defaultValue: l })).join(', ') || t('aiCoach.prompt.none')}

${t('aiCoach.prompt.recentStats')}
- ${t('aiCoach.prompt.workoutCount')}: ${recentStats?.totalWorkouts || 0}${t('onboarding.frequency.unit')}
- ${t('aiCoach.prompt.frequentPart')}: ${recentStats?.mostFrequentPart || t('aiCoach.prompt.none')}

${t('aiCoach.prompt.personalRecords')}
${recordsText}

${t('aiCoach.prompt.rules')}

응답 JSON 구조 예시:
{
  "analysis": "사용자의 현재 상태 분석 및 오늘 운동의 방향성",
  "routine": [
    {
      "name": "벤치프레스",
      "part": "가슴",
      "sets": [{ "kg": 40, "reps": 10 }, { "kg": 40, "reps": 10 }],
      "description": "가슴 중앙부를 타겟팅하며 바를 천천히 내리세요."
    }
  ]
}`;

        try {
            const aiText = await callAiCoachFunction({
                type: 'chat',
                systemMessage,
                lang: i18n.language,
                chatHistory: currentHistory.slice(-6).map(m => ({
                    role: m.type === 'ai' ? 'assistant' : 'user',
                    content: m.text,
                })),
                userPrompt,
            });
            setMessages(prev => [...prev, { id: Date.now() + 1, type: 'ai', text: aiText }]);
        } catch (e) {
            console.error(e);
            alert('AI 코치와 연결이 원활하지 않습니다.');
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

    const callRecommendation = async (mode, hardModeType = null, hardModeLabel = null) => {
        setIsTyping(true);
        const displayText = mode === 'hard'
            ? `${t('aiCoach.promptHardMode')} (${hardModeLabel || hardModeType?.replace(/_/g, ' ')})`
            : t('aiCoach.promptRecommend');
        const userMsg = { id: Date.now(), type: 'user', text: displayText };
        setMessages(prev => [...prev, userMsg]);
        try {
            // 최근 7일 운동 기록 조회 (날짜별 부위 + 운동명)
            let recentWorkouts = [];
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
                const { data: logs } = await supabase
                    .from('workout_logs')
                    .select('exercise, part, created_at')
                    .eq('user_id', session.user.id)
                    .gte('created_at', sevenDaysAgo)
                    .order('created_at', { ascending: false });

                if (logs?.length) {
                    // 날짜별로 그룹화
                    const byDate = {};
                    logs.forEach(log => {
                        const date = log.created_at.split('T')[0];
                        if (!byDate[date]) byDate[date] = { parts: new Set(), exercises: [] };
                        if (log.part) byDate[date].parts.add(log.part);
                        if (log.exercise) byDate[date].exercises.push(log.exercise);
                    });
                    recentWorkouts = Object.entries(byDate)
                        .sort(([a], [b]) => b.localeCompare(a))
                        .map(([date, { parts, exercises }]) => ({
                            date,
                            parts: [...parts],
                            exercises: [...new Set(exercises)],
                        }));
                }
            }

            const aiText = await callAiCoachFunction({
                type: 'recommendation',
                lang: i18n.language,
                exercises: EXERCISE_DATASET,
                profile,
                mode,
                hardModeType,
                recentWorkouts,
            });
            setMessages(prev => [...prev, { id: Date.now() + 1, type: 'ai', text: aiText }]);
        } catch (e) {
            console.error('[callRecommendation]', e);
            alert('AI 코치와 연결이 원활하지 않습니다.');
        } finally {
            setIsTyping(false);
        }
    };

    const handleManualReset = () => {
        if (!confirm(t('aiCoach.resetConfirm'))) return;
        const greetingText = generateGreeting(profile, recentStats);
        const initialMessage = { id: Date.now(), type: 'ai', text: greetingText };
        setMessages([initialMessage]);
        sessionStorage.setItem('aiCoachLastReset', Date.now().toString());
    };

    const addExerciseToRoutine = (exercise, isHardMode = false) => {
        const today = new Date().toISOString().split('T')[0];
        const storageKey = `mygym_routine_${today}`;
        let fullExercise = exercise.exercise_id
            ? EXERCISE_DATASET?.find(e => e.id === exercise.exercise_id)
            : EXERCISE_DATASET?.find(e => e.name === exercise.name);
        
        const cleanedSets = isHardMode 
            ? exercise.sets?.map(set => ({ kg: set.kg, reps: set.reps, isDropSet: set.isDropSet || false, dropKgs: set.dropKgs || ['', '', ''] }))
            : exercise.sets?.map(set => ({ kg: '', reps: '', isDropSet: set.isDropSet || false, dropKgs: ['', '', ''] })) || Array(3).fill({ kg: '', reps: '', isDropSet: false, dropKgs: ['', '', ''] });

        const exerciseToAdd = { ...exercise, sets: cleanedSets, id: fullExercise?.id || `temp_${Date.now()}`, image: fullExercise?.gif_url || '', completed: false };
        const existingRoutine = JSON.parse(localStorage.getItem(storageKey) || '[]');
        if (existingRoutine.find(e => e.name === exercise.name)) return;
        localStorage.setItem(storageKey, JSON.stringify([...existingRoutine, exerciseToAdd]));
    };

    return { profile, recentStats, messages, setMessages, isTyping, handleSendMessage, handleManualReset, addExerciseToRoutine, callOpenAI, callRecommendation };
};
