import { getExerciseUniqueKey } from '../utils/exerciseUtils';

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
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

    if (!apiKey) {
        throw new Error('Gemini API 키가 설정되지 않았습니다. .env 파일에 VITE_GEMINI_API_KEY를 추가해주세요.');
    }
    
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

    const prompt = `
당신은 최고 수준의 퍼스널 트레이너이자 피트니스 프로그램 설계 AI입니다.
사용자는 오늘 **[${determinedBodyPart}]** 부위의 운동을 집중적으로 수행하고자 합니다.
오늘 사용자가 수행할 운동 수는 정확히 **${exerciseCount}개**의 종목이어야 하며, 각 운동당 기본 **${setCount}세트**를 진행해야 합니다.

[오늘의 루틴 설계 지침]
1. 오늘 타깃 부위: ${determinedBodyPart}
2. 운동 개수: 정확히 ${exerciseCount}개
3. 각 운동당 세트 수: ${setCount}세트
4. 컨디션 반영 사항: ${conditionDesc}

[사용자의 대표 루틴 템플릿 참고]
- 가슴: 머신 펙덱플라이, 바벨 인클라인 프레스, 덤벨 플랫 프레스, 케이블 크로스오버 등
- 등: 랫풀다운, 바벨 벤트오버 로우, 시티드 로우, 케이블 풀오버 등
- 하체: 레그 익스텐션, 바벨 스쿼트, 파나타 스쿼트, 레그프레스, 레그 컬 등
- 어깨: 펙덱플라이(리어), 숄더 프레스, 사이드 레터럴 레이즈, 프론트 레이즈 등
- 팔: 바벨 컬, 덤벨 컬, 케이블 푸시다운, 오버헤드 익스텐션 등

[AI 추천 및 매칭 지침]
1. 세션 구성 및 작명 규칙:
   - 결과물에는 단 1개의 세션(오늘 수행할 루틴)만 포함되어야 합니다.
   - 세션의 \`dayId\`는 반드시 "${determinedBodyPart}"로 출력하십시오.
   - 세션의 \`target\`은 "${determinedBodyPart} 루틴 (${condition})"으로 기입하십시오.
2. 운동 개수 및 세트 규칙:
   - 운동(\`exercises\`) 목록은 **정확히 ${exerciseCount}개**로만 채워야 합니다.
   - 모든 추천 운동의 \`targetSets\`는 반드시 ${setCount}로 배정하십시오.
3. 운동 순서 및 배치 규칙:
   - 핵심적인 **메인 프리웨이트 운동**은 초반보다는 **2번째 또는 3번째**에 오도록 선피로 웜업을 앞단에 배치해 주십시오. (단, 컨디션이 '가볍게'인 경우는 머신 위주로 구성)
4. 운동 목록 매칭 규칙:
   - 아래 제공된 <AVAILABLE_EXERCISES> 목록 내에 존재하는 운동 중, 오늘의 타깃 부위 [${determinedBodyPart}]와 가장 잘 어울리는 실제 등록된 운동을 찾아 매핑하십시오.
   - 임의의 운동을 지어내면 절대 안 됩니다. 정확히 목록에 있는 id를 사용하십시오.
5. 출력은 반드시 JSON 객체 포맷이어야 합니다. 마크다운(\`\`\`json ...) 없이 순수 JSON 텍스트로만 반환하십시오.

<AVAILABLE_EXERCISES>
${JSON.stringify(simplifiedExercises.filter(ex => {
    if (determinedBodyPart === '전신') return true;
    if (determinedBodyPart === '팔') return ['팔', '이두', '삼두'].includes(ex.bodyPart);
    return ex.bodyPart === determinedBodyPart;
}))}
</AVAILABLE_EXERCISES>

{
  "sessions": [
    {
      "dayId": "${determinedBodyPart}",
      "target": "${determinedBodyPart} 루틴 (${condition})",
      "exercises": [
        {
          "id": "matching_exercise_id",
          "name": "운동이름",
          "name_en": "Exercise Name",
          "body_part": "${determinedBodyPart}",
          "equipment": "장비명",
          "targetSets": ${setCount},
          "targetReps": 15
        }
      ]
    }
  ]
}
`;

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                system_instruction: {
                    parts: [{ text: 'You are a fitness routine generator that only outputs valid JSON.' }]
                },
                contents: [
                    {
                        role: "user",
                        parts: [{ text: prompt }]
                    }
                ],
                generationConfig: {
                    responseMimeType: "application/json"
                }
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Gemini API 호출 실패: ${response.status} ${errorText}`);
        }

        const data = await response.json();
        const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text;
        
        if (!responseText) {
            console.error('[Gemini] Empty response:', JSON.stringify(data));
            throw new Error('AI가 응답을 생성하지 못했습니다. 잠시 후 다시 시도해주세요.');
        }
        
        let routineData;
        try {
            routineData = JSON.parse(responseText);
        } catch (parseErr) {
            console.error('[Gemini] JSON parse error. Raw response:', responseText);
            throw new Error('AI 응답을 파싱하는 데 실패했습니다. 다시 시도해주세요.');
        }
        
        if (!routineData.sessions || !Array.isArray(routineData.sessions)) {
            console.error('[Gemini] Unexpected structure:', routineData);
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
