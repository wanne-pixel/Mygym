import { useState, useEffect } from 'react';
import OpenAI from 'openai';
import { supabase } from '../../api/supabase';
import { STORAGE_KEYS } from '../../constants/exerciseConstants';
import EXERCISE_DATASET from '../../data/exercises.json';

const openai = new OpenAI({
    apiKey: import.meta.env.VITE_OPENAI_API_KEY,
    dangerouslyAllowBrowser: true
});

export const useAiCoach = () => {
    const [profile, setProfile] = useState(null);
    const [recentStats, setRecentStats] = useState({ totalWorkouts: 0, mostFrequentPart: null });
    const [personalRecords, setPersonalRecords] = useState({});
    const [messages, setMessages] = useState(() => JSON.parse(localStorage.getItem(STORAGE_KEYS.CHAT_HISTORY) || '[]'));
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
            const lastResetTime = localStorage.getItem('aiCoachLastReset');
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
                    localStorage.setItem('aiCoachLastReset', now.toString());
                }
            } catch (e) { console.error('Error initializing AI Coach:', e); }
        };
        initializeChat();
    }, []);

    useEffect(() => { localStorage.setItem(STORAGE_KEYS.CHAT_HISTORY, JSON.stringify(messages)); }, [messages]);

    const callOpenAI = async (userPrompt, currentHistory) => {
        setIsTyping(true);
        const recordsText = Object.keys(personalRecords).length > 0
            ? Object.entries(personalRecords).map(([name, r]) => `- ${name}: ${r.kg}kg × ${r.reps}회`).join('\n')
            : '없음 (초보자)';

        const systemMessage = {
            role: 'system',
            content: `당신은 MyGym의 퍼스널 트레이너 AI입니다.

사용자 프로필:
- 목표: ${profile?.goal || '없음'}
- 경험: ${profile?.experience_level || '없음'}
- 주당 횟수: ${profile?.weekly_frequency || 0}회
- 기구: ${profile?.equipment_access || '없음'}
- 제한사항: ${profile?.limitations?.join(', ') || '없음'}

최근 7일 운동 기록:
- 운동 횟수: ${recentStats?.totalWorkouts || 0}회
- 가장 많이 한 부위: ${recentStats?.mostFrequentPart || '없음'}

운동별 최고 기록:
${recordsText}

응답 형식 (5단계 구조, 반드시 준수):
... (기존 main.jsx와 동일 생략) ...

중요: 반드시 어떠한 인사말이나 마크다운(\`\`\`) 기호 없이, 순수한 JSON 객체 형식으로만 대답해.`
        };

        try {
            const response = await openai.chat.completions.create({
                model: 'gpt-4o-mini',
                messages: [
                    { role: 'system', content: systemMessage.content },
                    ...currentHistory.slice(-6).map(m => ({ role: m.type === 'ai' ? 'assistant' : 'user', content: m.text })),
                    { role: 'user', content: userPrompt }
                ],
                temperature: 0.7
            });
            const aiText = response.choices[0].message.content;
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

    const handleManualReset = () => {
        if (!confirm('채팅 기록을 모두 삭제하고 새로 시작할까요?')) return;
        const greetingText = generateGreeting(profile, recentStats);
        const initialMessage = { id: Date.now(), type: 'ai', text: greetingText };
        setMessages([initialMessage]);
        localStorage.setItem('aiCoachLastReset', Date.now().toString());
    };

    const addExerciseToRoutine = (exercise, isHardMode = false) => {
        const today = new Date().toISOString().split('T')[0];
        const storageKey = `mygym_routine_${today}`;
        let fullExercise = EXERCISE_DATASET?.find(e => e.name === exercise.name);
        
        const cleanedSets = isHardMode 
            ? exercise.sets?.map(set => ({ kg: set.kg, reps: set.reps, isDropSet: set.isDropSet || false, dropKgs: set.dropKgs || ['', '', ''] }))
            : exercise.sets?.map(set => ({ kg: '', reps: '', isDropSet: set.isDropSet || false, dropKgs: ['', '', ''] })) || Array(3).fill({ kg: '', reps: '', isDropSet: false, dropKgs: ['', '', ''] });

        const exerciseToAdd = { ...exercise, sets: cleanedSets, id: fullExercise?.id || `temp_${Date.now()}`, image: fullExercise?.gif_url || '', completed: false };
        const existingRoutine = JSON.parse(localStorage.getItem(storageKey) || '[]');
        if (existingRoutine.find(e => e.name === exercise.name)) return;
        localStorage.setItem(storageKey, JSON.stringify([...existingRoutine, exerciseToAdd]));
    };

    return { profile, recentStats, messages, setMessages, isTyping, handleSendMessage, handleManualReset, addExerciseToRoutine, callOpenAI };
};
