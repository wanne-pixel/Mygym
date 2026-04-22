import { useState, useEffect } from 'react';
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

    console.log('[FRONTEND] Session found:', session ? 'YES' : 'NO')
    console.log('[FRONTEND] Session error:', sessionError)

    if (sessionError || !session) {
        console.error('[FRONTEND] Session validation failed:', sessionError);
        throw new Error('로그인 세션이 만료되었습니다. 다시 로그인해주세요.');
    }

    const token = session.access_token;
    console.log('[FRONTEND] Token extracted:', token ? 'YES' : 'NO')
    console.log('[FRONTEND] Token length:', token?.length)
    console.log('[FRONTEND] Token prefix:', token?.substring(0, 20))

    // 2. invoke 호출 시 headers에 토큰 명시적으로 포함
    console.log('[FRONTEND] Calling supabase.functions.invoke...')
    const { data, error } = await supabase.functions.invoke('ai-coach', {
        body: payload,
        headers: {
            Authorization: `Bearer ${token}`
        }
    });

    console.log('[FRONTEND] Invoke completed')
    console.log('[FRONTEND] Data:', data)
    console.log('[FRONTEND] Error:', error)

    if (error) {
        console.error('[FRONTEND] Edge Function Invoke Error:', error);
        throw error;
    }

    if (data?.error) {
        console.error('[FRONTEND] Edge Function Business Error:', data.error);
        throw new Error(data.error);
    }

    return data.content;
};

export const useAiCoach = () => {
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
        if (!profile) return "안녕하세요! 😊\n\nMyGym AI 코치입니다. 프로필을 설정하시면 더 개인화된 코칭을 받으실 수 있어요. 오늘은 어떤 운동을 하실까요?";
        const { experience_level, goal, weekly_frequency, limitations } = profile;
        const { totalWorkouts } = stats;
        let text = "안녕하세요! 😊\n\n";
        if (experience_level === 'beginner') text += "웨이트트레이닝이 처음이시군요! 걱정 마세요, 제가 차근차근 알려드릴게요. ";
        else if (experience_level === 'intermediate') text += "꾸준히 운동하고 계시는 걸 알고 있어요. 한 단계 더 성장할 준비가 되셨네요! ";
        else text += "탄탄한 운동 경력을 가지고 계시네요. 더 강해질 준비 되셨죠? ";
        const goalText = { strength: '강력한 근력', hypertrophy: '멋진 근육', weight_loss: '건강한 체중 감량', maintenance: '현재 컨디션 유지' };
        text += `${goalText[goal] || '목표 달성'}을 위해 주 ${weekly_frequency}회 함께해요!\n\n`;
        if (limitations?.length > 0) text += `${limitations.join(', ')} 부위를 고려해서 안전한 운동으로 구성할게요.\n\n`;
        if (totalWorkouts > 0) text += `이번 주 ${totalWorkouts}회 운동하셨네요! 오늘은 어떤 부위를 하실까요?`;
        else text += "오늘부터 시작해볼까요? 아래 버튼으로 루틴 추천을 받아보세요!";
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
            ? Object.entries(personalRecords).map(([name, r]) => `- ${name}: ${r.kg}kg × ${r.reps}회`).join('\n')
            : '없음 (초보자)';

        const goalLabels = { strength: '근력 증가', hypertrophy: '근육 성장', weight_loss: '체중 감량', maintenance: '현상 유지' };
        const goalsDisplay = Array.isArray(profile?.goals) && profile.goals.length > 0
            ? profile.goals.map(g => goalLabels[g] || g).join(', ')
            : goalLabels[profile?.goal] || profile?.goal || '없음';

        const systemMessage = `당신은 MyGym의 전문 퍼스널 트레이너 AI 코치입니다.

사용자 프로필:
- 목표: ${goalsDisplay}
- 경험: ${profile?.experience_level || '없음'}
- 주당 횟수: ${profile?.weekly_frequency || 0}회
- 1회 운동 가능 시간: ${profile?.available_time || '미설정'}
- 기구: ${profile?.equipment_access || '없음'}
- 제한사항: ${profile?.limitations?.join(', ') || '없음'}

최근 7일 운동 기록:
- 운동 횟수: ${recentStats?.totalWorkouts || 0}회
- 가장 많이 한 부위: ${recentStats?.mostFrequentPart || '없음'}

운동별 최고 기록:
${recordsText}

[응답 규칙 - 매우 중요]
1. 반드시 어떠한 인사말이나 마크다운 (\`\`\`json) 기호 없이, 순수한 JSON 객체 형식으로만 응답하십시오.
2. 사용자의 현재 상태를 분석한 짧은 코멘트(plain text)를 JSON 외부에 포함하지 말고, JSON 내부의 특정 필드에 넣거나 오직 JSON만 반환하십시오.
3. 운동 루틴은 반드시 'routine' 배열 필드에 담아야 합니다. 각 운동은 name, part, sets(kg, reps 포함), description 필드를 가져야 합니다.
4. 한국어로 응답하십시오.

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
            ? `🔥 하드모드 루틴 추천 (${hardModeLabel || hardModeType?.replace(/_/g, ' ')})`
            : '🎯 오늘의 루틴 추천';
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
        if (!confirm('채팅 기록을 모두 삭제하고 새로 시작할까요?')) return;
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
