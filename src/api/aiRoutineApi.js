import { getExerciseUniqueKey } from '../utils/exerciseUtils';
import { supabase } from './supabase';

/**
 * Gemini API를 사용한 루틴 생성 함수
 */
export const generateAiRoutine = async ({ 
    availableExercises = [], 
    personalRecords = {}, 
    targetBodyPart = 'AI추천', 
    condition = '보통', 
    exerciseCount = 5, 
    setCount = 4,
    lastBodyParts = [] 
}) => {
    if (!availableExercises || availableExercises.length === 0) {
        throw new Error('사용 가능한 운동 데이터가 없습니다.');
    }

    // 운동 목록을 간략하게 줄여서 AI 토큰 낭비를 막음 (id, name, name_en, bodyPart, equipment)
    const simplifiedExercises = availableExercises.map(ex => ({
        id: ex.id,
        name: ex.name,
        name_en: ex.name_en,
        bodyPart: ex.bodyPart || ex.body_part,
        equipment: ex.equipment
    }));

    // AI추천 로직: 최근 수행했던 운동 부위를 제외한 추천 순위 결정
    let determinedBodyPart = targetBodyPart;
    if (targetBodyPart === 'AI추천') {
        const order = ['가슴', '등', '하체', '어깨', '팔'];
        const unused = order.filter(part => !lastBodyParts.includes(part));
        if (unused.length > 0) {
            determinedBodyPart = unused[0];
        } else {
            const validTrainedParts = lastBodyParts.filter(part => order.includes(part));
            determinedBodyPart = validTrainedParts.length > 0 ? validTrainedParts[validTrainedParts.length - 1] : order[0];
        }
    }

    // 컨디션 설명
    const conditionDesc = condition === '가볍게' 
        ? '사용자의 오늘 컨디션이 저하되었으므로 가벼운 강도로 루틴을 추천해주시고, 운동 난이도가 높지 않은 머신 운동 위주로 배치해주세요.'
        : condition === '최상(고강도)'
        ? '사용자의 컨디션이 최상이므로 고중량 프리웨이트나 코어 협응력을 많이 필요로 하는 메인 운동을 적극적으로 배치해주세요.'
        : '사용자의 컨디션은 보통입니다. 균형 잡힌 안정적인 루틴을 배치해주세요.';

    const filteredExercises = simplifiedExercises.filter(ex => {
        if (determinedBodyPart === '전신') return true;
        if (determinedBodyPart === '팔') return ['팔', '이두', '삼두'].includes(ex.bodyPart);
        return ex.bodyPart === determinedBodyPart;
    });

    try {
        const { data, error } = await supabase.functions.invoke('ai-coach', {
            body: {
                type: 'routine_generator',
                determinedBodyPart,
                conditionDesc,
                exerciseCount,
                setCount,
                condition,
                simplifiedExercises: filteredExercises
            }
        });

        if (error) {
            console.error('[Edge Function] Error:', error);
            throw new Error(`AI 서버 호출 실패: ${error.message}`);
        }

        let routineData;
        if (typeof data === 'string') {
            try {
                routineData = JSON.parse(data);
            } catch (e) {
                console.error('[Edge Function] JSON parse error. Raw:', data);
                throw new Error('AI 응답을 파싱하는 데 실패했습니다. 다시 시도해주세요.');
            }
        } else {
            routineData = data;
        }

        if (!routineData || !routineData.sessions || !Array.isArray(routineData.sessions)) {
            console.error('[Edge Function] Unexpected structure:', routineData);
            throw new Error('AI 응답 포맷이 올바르지 않습니다.');
        }

        const formattedSessions = routineData.sessions.slice(0, 1).map((session) => ({
            dayId: session.dayId || determinedBodyPart,
            target: session.target || `${determinedBodyPart} 루틴`,
            exercises: (session.exercises || []).map(ex => {
                const match = availableExercises.find(e => e.id === ex.id) || {};
                const targetSets = setCount;
                const baseRepScheme = [15, 15, 13, 13, 10, 10, 8];
                const repScheme = Array.from({ length: targetSets }, (_, i) => baseRepScheme[i] || 10);
                
                const exerciseName = match.name || ex.name;
                const equipment = match.equipment || ex.equipment || '';
                const uniqueKey = getExerciseUniqueKey({ name: exerciseName, equipment });
                const prRecord = personalRecords[uniqueKey];

                const sets = Array.from({ length: targetSets }, (_, i) => ({ kg: '', reps: repScheme[i] || 10, completed: false }));

                if (prRecord && prRecord.kg > 0 && targetSets >= 2) {
                    let prKg = prRecord.kg;
                    const maxCount = prRecord.maxKgCount || 1;
                    const step = prRecord.predictedStep || 5;

                    // 컨디션에 따른 무게 조정
                    if (condition === '가볍게') {
                        // 가볍게: 15% 감량
                        prKg = Math.max(1, Math.round((prKg * 0.85) / 2.5) * 2.5);
                    } else if (condition === '최상(고강도)') {
                        // 최상(고강도): 무게 1단계(step) 증량
                        prKg = prKg + step;
                    }

                    if (maxCount === 1 || targetSets < 3) {
                        sets[targetSets - 1].kg = prKg;
                        for (let i = targetSets - 2; i >= 0; i--) {
                            let rec = sets[i + 1].kg - step;
                            sets[i].kg = rec > 0 ? rec : '';
                        }
                    } else {
                        sets[targetSets - 2].kg = prKg;
                        sets[targetSets - 1].kg = prKg + step;
                        for (let i = targetSets - 3; i >= 0; i--) {
                            let rec = sets[i + 1].kg - step;
                            sets[i].kg = rec > 0 ? rec : '';
                        }
                    }
                }

                return {
                    id: ex.id,
                    name: exerciseName,
                    name_en: match.name_en || ex.name_en,
                    body_part: match.body_part || match.bodyPart || ex.body_part || ex.bodyPart || '',
                    equipment: equipment,
                    targetSets: targetSets,
                    targetReps: 15,
                    sets: sets
                };
            })
        }));

        return {
            type: 'weekly_ai',
            start_date: new Date().toISOString(),
            current_session_index: 0,
            sessions: formattedSessions
        };

    } catch (error) {
        console.error('AI Routine Generation Error:', error);
        throw new Error('루틴을 생성하는 도중 오류가 발생했습니다. 다시 시도해주세요.');
    }
};
