/**
 * Gemini API를 사용한 루틴 생성 함수
 */
export const generateAiRoutine = async ({ daysCount = 5, availableExercises = [] }) => {
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

    const prompt = `
당신은 최고 수준의 퍼스널 트레이너이자 피트니스 프로그램 설계 AI입니다.
사용자는 일주일에 총 4일(세션) 동안 운동을 수행하며, 하루에 정확히 6개의 종목을 소화해야 합니다.
당신은 아래의 [제공된 루틴 A, B, C 템플릿]을 기준으로 4개 세션의 루틴을 설계해야 합니다.

[사용자의 3가지 대표 루틴 템플릿]
사용자가 직접 설계한 세 가지 루틴 정보입니다. 각 루틴은 4개의 세션(가슴+삼두, 등+이두, 하체, 어깨)으로 구성되어 있습니다.

[루틴 A: 윗가슴 / 등 넓이 / 하체 전면 / 어깨 볼륨]
- 가슴 (윗가슴 타깃) + 팔 (삼두):
  1. 머신 펙덱플라이 (웜업 3세트)
  2. 바벨 인클라인 프레스
  3. 덤벨 인클라인 프레스
  4. 케이블 로우 플라이
  5. 바벨 오버헤드 익스텐션
  6. 케이블 푸시다운
- 등 (넓이 타깃) + 팔 (이두):
  1. 케이블 암 풀 다운 (웜업 3세트)
  2. 머신 와이드 랫풀다운
  3. 머신 와이드 롱풀
  4. 머신 어시스트 풀업
  5. 덤벨 컬
  6. 케이블 컬
- 하체 (전면/프레스 타깃):
  1. 머신 레그 익스텐션 (웜업 3세트)
  2. 바벨 스쿼트 (만약 바벨 스쿼트가 목록에 없으면, 스미스 스쿼트나 파나타 스쿼트, 레그 프레스로 매칭)
  3. 솔레드머신 파나타 스쿼트
  4. 머신 레그프레스
  5. 스미스머신 런지
- 어깨 (전체 프레스/볼륨 타깃):
  1. 머신 스탠딩 레터럴 레이즈 (웜업 3세트)
  2. 스미스머신 숄더 프레스
  3. 바벨 프론트 레이즈
  4. 스미스머신 업라이트 로우
  5. 머신 리어 펙덱플라이

[루틴 B: 중앙·아랫가슴 / 등 두께 / 하체 후면·둔근 / 어깨 고립]
- 가슴 (전체/아랫가슴 타깃) + 팔 (삼두):
  1. 머신 체스트 프레스머신 (웜업 3세트)
  2. 스미스머신 플랫 프레스
  3. 스미스머신 디클라인 프레스
  4. 머신 M디클라인 프레스
  5. 덤벨 오버헤드 익스텐션
  6. 케이블 푸시다운
- 등 (두께 타깃) + 팔 (이두):
  1. 머신 시티드 로우 (웜업 3세트)
  2. 바벨 벤트오버 로우
  3. 머신 프론트 로우
  4. 덤벨 원암 로우
  5. 바벨 컬
  6. 덤벨 컬
- 하체 (후면/둔근 타깃):
  1. 머신 레그 컬 (웜업 3세트)
  2. 바벨 루마니안 데드리프트
  3. 솔레드머신 원 레그 컬
  4. 솔레드머신 힙 쓰러스트
  5. 머신 힙 어브덕션
  6. 솔레드머신 힙 킥 익스텐션
- 어깨 (측/후면 고립 타깃):
  1. 케이블 페이스풀 (웜업 3세트)
  2. 덤벨 숄더 프레스
  3. 덤벨 사이드 레터럴 레이즈
  4. 머신 시티드 레터럴 레이즈
  5. 덤벨 벤트오버

[루틴 C: 머신·케이블 고립 / 안쪽 가슴 / 하체 밸런스(머신) / 어깨 머신 타깃]
- 가슴 (머신·안쪽 고립 타깃) + 팔 (삼두):
  1. 케이블 미들 플라이 (웜업 3세트)
  2. 머신 노틸러스프레스
  3. 머신 M인클라인 프레스
  4. 머신 M펙덱플라이
  5. 덤벨 오버헤드 익스텐션
  6. 케이블 푸시다운
- 등 (머신 로우·중하부 타깃) + 팔 (이두):
  1. 머신 클로즈 랫풀다운 (웜업 3세트)
  2. 머신 M시티드 로우
  3. 머신 로우 로우
  4. 머신 클로즈 롱풀
  5. 덤벨 컬
  6. 케이블 컬
- 하체 (머신 전·후면 밸런스 타깃):
  1. 머신 힙 어덕션 (웜업 3세트)
  2. 솔레드머신 핵스커트
  3. 솔레드머신 레그프레스
  4. 솔레드머신 원 레그 컬
  5. 솔레드머신 힙 어브덕션
- 어깨 (머신 안정성 고립 타깃):
  1. 머신 리어 펙덱플라이 (웜업 3세트)
  2. 머신 M숄더 프레스
  3. 머신 스탠딩 레터럴 레이즈
  4. 바벨 프론트 레이즈
  5. 머신 벤트오버

[AI 추천 및 매칭 지침]
1. 세션 구성 및 작명 규칙:
   - AI가 위의 루틴 A, B, C 중 한 가지 테마를 분석하여 그 루틴의 4개 세션을 추출하십시오.
   - 각 세션의 \`dayId\`는 "Day 1, 2, 3, 4" 대신 반드시 **"가슴", "등", "하체", "어깨"** 중 하나로 출력하십시오.
2. 운동 개수 및 세트 규칙:
   - 각 세션의 운동(\`exercises\`) 목록은 **반드시 6개**로 꽉 채워야 합니다.
   - 모든 운동은 본세트로 5세트(targetSets: 5)를 배정하십시오.
3. 운동 목록 매칭 규칙:
   - 아래 제공된 <AVAILABLE_EXERCISES> 목록 내에 존재하는 운동 중, 위의 루틴 목록의 운동 명칭 및 장비와 가장 잘 어울리는 실제 등록된 운동(이름과 장비)을 찾아 매핑하십시오.
   - 임의의 운동을 새로 만들거나 없는 아이디를 지어내면 절대 안 됩니다. 정확히 목록에 있는 id를 사용하십시오.
   - 루틴의 '바벨 스쿼트'가 목록에 없을 시, 목록에 존재하는 '스쿼트' (바벨 장비) 혹은 '스미스 머신 스쿼트' 등으로 가장 가깝게 대응하십시오.
4. 출력은 반드시 JSON 객체 포맷이어야 합니다. 마크다운(\`\`\`json ...) 없이 순수 JSON 텍스트로만 반환하십시오.

<AVAILABLE_EXERCISES>
${JSON.stringify(simplifiedExercises)}
</AVAILABLE_EXERCISES>

{
  "sessions": [
    {
      "dayId": "가슴",
      "target": "루틴 A: 가슴/삼두 (윗가슴 타깃)",
      "exercises": [
        {
          "id": "matching_exercise_id",
          "name": "플랫 프레스",
          "name_en": "Flat Press",
          "body_part": "가슴",
          "equipment": "머신",
          "targetSets": 5,
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
        const routineData = JSON.parse(responseText || "{}");
        
        if (!routineData.sessions || !Array.isArray(routineData.sessions)) {
            throw new Error('AI 응답 포맷이 올바르지 않습니다.');
        }

        // 각 세션이 올바르게 지정된 일수만큼 나왔는지 확인하고 가공 (ID 부여 및 안전한 복사 등)
        const formattedSessions = routineData.sessions.slice(0, daysCount).map((session, sIdx) => ({
            dayId: session.dayId || `day${sIdx + 1}`,
            target: session.target || '부위 없음',
            exercises: (session.exercises || []).map(ex => {
                const match = availableExercises.find(e => e.id === ex.id) || {};
                const targetSets = 5;
                const repScheme = [15, 15, 13, 13, 10];
                
                return {
                    id: ex.id,
                    name: match.name || ex.name,
                    name_en: match.name_en || ex.name_en,
                    body_part: match.body_part || match.bodyPart || ex.body_part || ex.bodyPart || '',
                    equipment: match.equipment || ex.equipment || '',
                    targetSets: targetSets,
                    targetReps: 15,
                    sets: Array.from({ length: targetSets }, (_, i) => ({ kg: '', reps: repScheme[i] || 10, completed: false }))
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
