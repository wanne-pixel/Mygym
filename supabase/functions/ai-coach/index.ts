import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// CORS 표준 헤더 정의
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ── 로컬 파인튜닝 코치 (서브PC Ollama, Cloudflare Tunnel 경유) ──────────────
// 운동기록 기반 코치 질문(chat)은 자체 학습 모델을 우선 사용하고,
// 서브PC가 꺼져 있거나 응답이 없으면 자동으로 Gemini로 폴백한다.
const LOCAL_COACH_URL = Deno.env.get("LOCAL_COACH_URL") || "https://ai.my-gyms.com";
const LOCAL_COACH_MODEL = Deno.env.get("LOCAL_COACH_MODEL") || "my-gym-coach";
const LOCAL_COACH_TIMEOUT_MS = 90_000; // CPU 추론이라 여유 있게

async function callLocalCoach(systemInfo: string, question: string): Promise<string | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), LOCAL_COACH_TIMEOUT_MS);
  try {
    const res = await fetch(`${LOCAL_COACH_URL}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: LOCAL_COACH_MODEL,
        stream: false,
        messages: [
          { role: "user", content: `[시스템 정보]\n${systemInfo}\n\n[질문]\n${question}` },
        ],
      }),
      signal: controller.signal,
    });
    if (!res.ok) return null;
    const data = await res.json();
    const text = data?.message?.content?.trim();
    return text && text.length > 0 ? text : null;
  } catch (_e) {
    return null; // 서브PC 미응답 → Gemini 폴백
  } finally {
    clearTimeout(timer);
  }
}

// ── 교육모델용 시스템 정보 생성 헬퍼 (학습 데이터 표준 형식 정합화) ──────────
// @AI_MODELS.md §3 "학습된 [시스템 정보] 표준 형식"과 100% 일치시켜야
// 교육모델의 답변 품질이 보장된다.

function buildProgressiveOverloadStatus(recentWorkouts: any[]): string {
  if (!recentWorkouts || recentWorkouts.length === 0) {
    return '기록 없음 (신규 사용자)';
  }

  // 가장 최근 운동 세션에서 대표 운동 추출
  const latest = recentWorkouts[0];
  const exerciseName = latest.exercise || '운동명 불명';
  const setsData = latest.sets_data;

  if (!Array.isArray(setsData) || setsData.length === 0) {
    return `${exerciseName} → 세트 데이터 없음`;
  }

  // 드롭세트 제외한 메인 세트만 필터링
  const mainSets = setsData.filter((s: any) => !s.isDropSet);
  const effectiveSets = mainSets.length > 0 ? mainSets : setsData;
  const setCount = effectiveSets.length;

  // 대표 중량 (메인 세트 중 최대값)
  const weights = effectiveSets.map((s: any) => Number(s.kg) || 0);
  const mainWeight = Math.max(...weights);

  // rep 범위
  const reps = effectiveSets.map((s: any) => Number(s.reps) || 0);
  const minRep = Math.min(...reps);
  const maxRep = Math.max(...reps);
  const repDisplay = minRep === maxRep ? `${maxRep}rep` : `${minRep}~${maxRep}rep`;

  // 성공 여부 판단 (최소 6rep 이상이면 전 세트 수행 완료로 간주)
  const allAboveMin = reps.every((r: number) => r >= 6);
  const status = allAboveMin
    ? `전 세트 ${repDisplay} 수행 완료`
    : `일부 세트 목표 미달 (최소 ${minRep}rep)`;

  return `${exerciseName} ${mainWeight}kg × ${setCount}세트 × ${repDisplay} → ${status}`;
}

function buildWeeklyVolumeBySets(recentWorkouts: any[]): string {
  const partOrder = ['가슴', '등', '하체', '어깨', '팔', '복근'];
  const partMap: Record<string, number> = {};
  partOrder.forEach(p => partMap[p] = 0);

  if (!recentWorkouts || recentWorkouts.length === 0) {
    return partOrder.map(p => `${p} 0세트`).join(' / ');
  }

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  for (const w of recentWorkouts) {
    const workoutDate = new Date(w.created_at);
    if (workoutDate < sevenDaysAgo) continue;

    let part = w.exercise_body_part || w.bodyPart || '';
    // DB의 '복부' → 학습 데이터의 '복근'으로 통일
    if (part === '복부') part = '복근';

    if (part in partMap) {
      const sets = Array.isArray(w.sets_data) ? w.sets_data.length : 0;
      partMap[part] += sets;
    }
  }

  return partOrder.map(p => `${p} ${partMap[p]}세트`).join(' / ');
}

function buildConditionText(condition: any): string {
  if (!condition) return '정보 없음 (기본 상태로 판단)';

  const sleep = condition.sleep ? `수면 ${condition.sleep}시간` : '수면 정보 없음';
  const fatigue = condition.fatigue || '보통';
  const note = condition.note || '특이사항 없음';

  return `${sleep}, 피로도 ${fatigue}, ${note}`;
}

/**
 * 규칙 기반 운동 추천 엔진 (Rule-based Recommendation Engine)
 */
const getRecommendationConfig = (userProfile: any, recentWorkouts: any[] = []) => {
  const {
    goal = 'hypertrophy',
    experienceLevel = 'beginner',
    weeklyFrequency = 3,
    availableTime = '30분~1시간'
  } = userProfile;

  const isColdStart = !recentWorkouts || recentWorkouts.length === 0;

  // 1. 볼륨 가이드라인 (목표 기반)
  const getVolumeGuideline = (g: string) => {
    const guidelines: Record<string, { sets: string, reps: string }> = {
      strength: { sets: '4-5', reps: '3-6' },
      hypertrophy: { sets: '3-4', reps: '8-12' },
      weight_loss: { sets: '3', reps: '15-20' },
      maintenance: { sets: '3', reps: '12-15' }
    };
    return guidelines[g] || guidelines.hypertrophy;
  };

  // 2. 종목 개수 산출 (시간 기반)
  const getExerciseCount = (time: string) => {
    if (time.includes('30분 이하')) return 3;
    if (time.includes('30분~1시간')) return 5;
    if (time.includes('1시간~1.5시간')) return 7;
    return 9;
  };

  // 3. 타겟 부위 결정 (피로도 기반)
  const determineTargetParts = () => {
    const allParts = ['가슴', '등', '어깨', '하체', '팔', '복부'];
    
    if (isColdStart) {
      if (experienceLevel === 'beginner' || weeklyFrequency <= 2) return ['전신'];
      if (weeklyFrequency <= 4) return ['가슴', '어깨', '팔'];
      return ['하체', '복부'];
    }

    const recentlyTrainedParts = new Set(
      recentWorkouts
        .filter(w => {
          const workoutDate = new Date(w.created_at);
          const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);
          return workoutDate > fortyEightHoursAgo;
        })
        .map(w => w.exercise_body_part || w.bodyPart) 
    );

    const availableParts = allParts.filter(part => !recentlyTrainedParts.has(part));
    return availableParts.length > 0 ? availableParts.slice(0, 2) : ['전신'];
  };

  return {
    isColdStart,
    targetBodyParts: determineTargetParts(),
    recommendedExercisesCount: getExerciseCount(availableTime),
    volumeGuideline: getVolumeGuideline(goal)
  };
};

serve(async (req) => {
  // 1. 브라우저의 OPTIONS(Preflight) 요청 즉시 처리
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization') || req.headers.get('authorization');
    if (!authHeader) throw new Error('No authorization header');

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const supabaseClient = createClient(supabaseUrl!, supabaseAnonKey!);
    
    const token = authHeader.replace("Bearer ", "").trim();
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { 
        status: 401, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      });
    }

    const geminiKey = Deno.env.get("GEMINI_API_KEY") || Deno.env.get("OPENAI_API_KEY");
    const body = await req.json();
    const {
      type, lang = 'ko', recentWorkouts = [], userProfile = {},
      exercises = [], userPrompt = '', selectedMode = 'today_routine',
      workoutFrequency = { totalDays: 30, workedOutDays: 0 },
      bodyPartVolume = {},
      neverDoneExercises = [],
      condition = null,
      currentTab = '운동',
    } = body;

    // 규칙 기반 엔진 실행
    const recommendation = getRecommendationConfig(userProfile, recentWorkouts);
    const targets = recommendation.targetBodyParts;

    // [Available DB 필터링]
    const availableExercises = exercises
      .filter((ex: any) => targets.includes(ex.bodyPart) || targets.includes(ex.body_part) || targets.includes('전신'))
      .map((ex: any) => `- ${ex.name} (부위: ${ex.body_part || ex.bodyPart})`)
      .join('\n');

    const isEn = lang === 'en';
    const langInstruction = isEn ? "Respond strictly in English." : "반드시 한국어로 작성하세요.";

    // ── muscle_analysis 타입 별도 처리 ──────────────────────────────────────
    if (type === 'muscle_analysis') {
      const { muscle_group, breakdown = [], total_exercises = 0 } = body;
      const musclePrompt = `You are a fitness coach. Analyze the ${muscle_group} training data and respond ONLY with valid JSON:
{
  "title": "3-4 word title about this muscle group training",
  "summary": "2-3 sentences analyzing the training pattern",
  "advice": "one specific actionable improvement tip"
}
${langInstruction}

${muscle_group} training breakdown (total ${total_exercises} sessions):
${(breakdown as any[]).map((b: any) => `- ${b.category}: ${b.volume}kg (${b.percentage}%, ${b.count} sessions)`).join('\n')}`;

      const mRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: musclePrompt }] }],
          generationConfig: {
            temperature: 0.3,
            responseMimeType: "application/json",
          },
        }),
      });
      const mData = await mRes.json();
      const mContent = mData.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
      return new Response(
        JSON.stringify({ content: mContent, reply: mContent }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── training_analysis 타입 별도 처리 ────────────────────────────────────
    if (type === 'training_analysis') {
      const { total_workouts, muscle_stats, day_stats, weekly_frequency, period_days } = body;
      const analysisPrompt = `You are a fitness coach. Analyze the training data and respond ONLY with valid JSON in this exact structure:
{
  "title": "3-4 word catchy title",
  "summary": "2-3 sentences summarizing the training pattern",
  "recommendations": ["actionable tip 1", "actionable tip 2", "actionable tip 3"]
}
${langInstruction}

Training data (last ${period_days} days):
- Total workouts: ${total_workouts}
- Weekly average: ${weekly_frequency}x/week
- Muscle volume stats: ${JSON.stringify(muscle_stats)}
- Workout days: ${JSON.stringify(day_stats)}`;

      const aiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: analysisPrompt }] }],
          generationConfig: {
            temperature: 0.3,
            responseMimeType: "application/json",
          },
        }),
      });
      const aiData = await aiRes.json();
      const content = aiData.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
      return new Response(
        JSON.stringify({ content, reply: content }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── routine_generator 타입 별도 처리 ────────────────────────────────────
    if (type === 'routine_generator') {
      const { determinedBodyPart, conditionDesc, exerciseCount, setCount, simplifiedExercises, condition } = body;
      const routinePrompt = `
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
${JSON.stringify(simplifiedExercises)}
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

      const aiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system_instruction: {
            parts: [{ text: 'You are a fitness routine generator that only outputs valid JSON.' }]
          },
          contents: [{ role: 'user', parts: [{ text: routinePrompt }] }],
          generationConfig: {
            responseMimeType: "application/json",
          },
        }),
      });
      const aiData = await aiRes.json();
      const content = aiData.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
      return new Response(
        content,
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── routine_modifier 타입 별도 처리 ────────────────────────────────────
    if (type === 'routine_modifier') {
      const { currentRoutine, userMessage, recentWorkoutSummary = '', simplifiedExercises = [], chatHistory = [] } = body;
      
      const historyText = chatHistory.length > 0
        ? chatHistory.map((m: any) => `${m.role === 'user' ? '사용자' : 'AI 코치'}: ${m.content}`).join('\n')
        : '(첫 번째 수정 요청)';

      const currentRoutineText = JSON.stringify(currentRoutine, null, 2);
      const availableExText = JSON.stringify(simplifiedExercises);

      const modifierPrompt = `당신은 10년 경력의 전문 퍼스널 트레이너입니다. 사용자의 현재 운동 루틴을 보고, 사용자의 요청에 따라 전문적으로 수정해 주세요.

[현재 루틴]
${currentRoutineText}

[사용자의 최근 운동 기록 요약]
${recentWorkoutSummary || '기록 없음'}

[이전 대화 내역]
${historyText}

[사용자의 새 요청]
${userMessage}

[사용 가능한 운동 목록 (반드시 이 목록에서만 선택)]
${availableExText}

[지침]
1. 사용자 요청을 반영하여 현재 루틴을 수정하세요.
2. 운동 개수와 세트 수는 기존과 동일하게 유지하세요 (사용자가 명시적으로 변경을 요청한 경우만 변경).
3. 반드시 AVAILABLE_EXERCISES 목록에 있는 운동의 id, name, name_en, equipment만 사용하세요. 임의로 운동을 지어내지 마세요.
4. reply 필드에는 트레이너답게 친근하고 전문적인 한국어로 수정 이유와 팁을 2-3문장으로 설명하세요.
5. 출력은 반드시 아래 JSON 포맷으로만 반환하세요. 마크다운 없이 순수 JSON만.

{
  "reply": "수정 이유와 트레이너 팁 (2-3문장)",
  "updatedRoutine": {
    "sessions": [
      {
        "dayId": "부위명",
        "target": "루틴 설명",
        "exercises": [
          {
            "id": "운동id",
            "name": "운동이름",
            "name_en": "Exercise Name",
            "body_part": "부위",
            "equipment": "장비",
            "targetSets": 4,
            "targetReps": 15
          }
        ]
      }
    ]
  }
}`;

      const aiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system_instruction: {
            parts: [{ text: 'You are a professional personal trainer. Output only valid JSON.' }]
          },
          contents: [{ role: 'user', parts: [{ text: modifierPrompt }] }],
          generationConfig: {
            responseMimeType: "application/json",
          },
        }),
      });
      const aiData = await aiRes.json();
      const content = aiData.candidates?.[0]?.content?.parts?.[0]?.text || '{"reply":"죄송합니다, 잠시 후 다시 시도해주세요.","updatedRoutine":null}';
      return new Response(
        content,
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 추천사유(서론) 생성을 위한 유저 컨텍스트 요약
    const profileLevel = userProfile.level || userProfile.experienceLevel || 'beginner';
    const profileGoal = Array.isArray(userProfile.goals) && userProfile.goals.length > 0
      ? userProfile.goals.join(', ')
      : (userProfile.goal || 'hypertrophy');
    const profileTime = userProfile.available_time || userProfile.availableTime || '30분~1시간';
    const profileSplit = userProfile.split_preference || userProfile.splitPreference || 'not set';
    const recentPartsList = [...new Set(
      recentWorkouts.slice(0, 10).map((w: any) => w.exercise_body_part || w.bodyPart).filter(Boolean)
    )] as string[];
    const recentPartsText = recentPartsList.length > 0
      ? recentPartsList.join(', ')
      : (isEn ? 'no recent workout history' : '최근 운동 기록 없음');

    // 신규 컨텍스트 데이터 문자열 변환
    const frequencyComment = (() => {
      const d = (workoutFrequency as any).workedOutDays ?? 0;
      if (isEn) {
        if (d <= 3) return `Only ${d} workout days in the last 30 days (low activity — let's get back on track)`;
        if (d >= 7) return `${d} workout days in the last 30 days (great consistency!)`;
        return `${d} workout days in the last 30 days`;
      } else {
        if (d <= 3) return `최근 30일 중 ${d}일 (최근 운동이 뜸했어요)`;
        if (d >= 7) return `최근 30일 중 ${d}일 (꾸준히 잘 하고 있어요)`;
        return `최근 30일 중 ${d}일`;
      }
    })();

    const volumeContext = Object.entries(bodyPartVolume as Record<string, number>)
      .sort(([, a], [, b]) => b - a)
      .map(([part, vol]) => `${part}: ${Math.round(vol)}kg·회`)
      .join(', ') || (isEn ? 'No volume data' : '볼륨 데이터 없음');

    const neverDoneContext = (neverDoneExercises as any[])
      .slice(0, 20)
      .map((ex: any) => `${ex.name}(${ex.body_part})`)
      .join(', ') || (isEn ? 'None' : '없음');

    const recentExerciseNames = [...new Set(
      (recentWorkouts as any[]).slice(0, 30).map((w: any) => w.exercise).filter(Boolean)
    )].join(', ') || (isEn ? 'No recent records' : '최근 운동 기록 없음');

    const exerciseVolumeContext = (() => {
      const volMap: Record<string, number> = {};
      (recentWorkouts as any[]).forEach(w => {
        if (!w.exercise) return;
        let totalKgReps = 0;
        if (Array.isArray(w.sets_data)) {
          w.sets_data.forEach((s: any) => {
            totalKgReps += (Number(s.kg) || 0) * (Number(s.reps) || 0);
          });
        }
        volMap[w.exercise] = (volMap[w.exercise] || 0) + totalKgReps;
      });
      return Object.entries(volMap)
        .filter(([, vol]) => vol > 0)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 20)
        .map(([ex, vol]) => `${ex}: ${Math.round(vol)}kg·회`)
        .join(', ');
    })();

    // 하드모드 selectedMode별 서론 톤 지시문
    const getModeReplyInstruction = (mode: string): string => {
      if (isEn) {
        const map: Record<string, string> = {
          hard_mode_low_weight:   "2-3 sentences. Light, rhythmic, pump-and-endurance feel — like a trainer saying 'let's get the blood flowing today!'",
          hard_mode_high_weight:  "2-3 sentences. Heavy, focused, max-strength challenge feel — like a trainer pushing you to hit a new PR.",
          hard_mode_progressive:  "2-3 sentences. Progressive-overload feel, building excitement from warmup to peak — 'the last set is the real one.'",
          hard_mode_drop_set:     "2-3 sentences. All-out intensity, total muscle exhaustion feel — 'prepare to squeeze every last rep out of it.'",
        };
        return map[mode] || "2-3 sentences. Friendly casual gym-buddy tone.";
      } else {
        const map: Record<string, string> = {
          hard_mode_low_weight:   "2~3문장 이내. 가볍고 리드미컬한 근지구력·펌핑 느낌. '오늘은 가볍게 많이 하는 날이에요~' 스타일의 친근한 구어체.",
          hard_mode_high_weight:  "2~3문장 이내. 묵직하고 도전적인 최대 근력 느낌. '오늘은 무겁게 밀어붙이는 날이에요.' 스타일의 진지하지만 편안한 구어체.",
          hard_mode_progressive:  "2~3문장 이내. 점진적 과부하·클라이맥스 느낌. '가볍게 시작해서 점점 올려가는 거예요. 마지막 세트가 진짜거든요!' 스타일의 기대감 있는 구어체.",
          hard_mode_drop_set:     "2~3문장 이내. 근육 완전 고갈·고강도 마무리 느낌. '오늘은 근육 끝까지 쥐어짜는 날이에요. 각오하고 시작해봐요!' 스타일의 강렬한 구어체.",
        };
        return map[mode] || "2~3문장 이내. 동네 헬스장 트레이너처럼 '~해봐요', '~거든요' 같은 편안한 구어체.";
      }
    };
    const modeReplyInstruction = getModeReplyInstruction(selectedMode);

    // [강력한 스키마 및 규칙 지시]
    const systemGuideline = `
    [STRICT RESPONSE SCHEMA]
    너는 반드시 아래 JSON 형식을 100% 똑같이 준수하여 응답해야 한다. 키(Key) 이름을 바꾸거나 구조를 변경하지 마라.
    JSON 외에 다른 인사말이나 부연 설명은 절대로 하지 마라.

    {
      "운동추천": {
        "추천사유": "[USER CONTEXT FOR REPLY]의 실제 데이터(최근 운동 부위·목표·숙련도·운동 빈도)를 언급하며 오늘 루틴 추천 이유를 다음 지시에 따라 작성 → ${modeReplyInstruction} 인사말·격려 표현 없이 데이터 기반으로만. 반드시 운동 빈도(${frequencyComment})를 자연스럽게 문장 안에 녹여 언급할 것.",
        "운동목록": [
          {
            "부위": "제공된 DB의 부위명과 일치",
            "운동명": "제공된 DB의 운동명과 일치",
            "세부타겟": "타겟 근육 (예: 대흉근)",
            "reason": "이 운동을 선택한 근거를 친근한 트레이너 구어체로 한 줄(15자 이내) 작성. 아래 우선순위로 판단: 1순위) neverDoneExercises에 포함된 운동이면 → '처음 해보는 운동으로 새로운 자극이에요' 2순위) bodyPartVolume에서 해당 부위 볼륨이 가장 낮으면 → '최근 [부위] 볼륨이 부족해요' 3순위) recentWorkouts 최근 10회에 없는 운동이면 → '이번 주 한 번도 안 했어요'",
            "세트정보": [
              {"set": 1, "reps": 12, "weight": 0},
              {"set": 2, "reps": 12, "weight": 0}
            ]
          }
        ]
      }
    }

    [USER CONTEXT FOR REPLY]
    - Level: ${profileLevel}
    - Goal: ${profileGoal}
    - Available Time: ${profileTime}
    - Split Preference: ${profileSplit}
    - Workout Frequency: ${frequencyComment}
    - Recently Trained Parts (last 10 logs): ${recentPartsText}
    - Recent Exercises (last 30 workouts): ${recentExerciseNames}
    - Body Part Volume (kg×reps, last 10 workouts): ${volumeContext}
    - Detailed Exercise Volume (last 30 days): ${exerciseVolumeContext || 'None'}
    - Never Done Exercises (sample): ${neverDoneContext}
    - Today's Target Parts: ${targets.join(', ')}

    [STRICT RULES: DO NOT HALLUCINATE]
    1. 반드시 아래 [AVAILABLE EXERCISE DATABASE]에 있는 운동만 선택해라.
    2. '부위'와 '운동명'은 제공된 DB와 글자 하나 틀리지 않고 100% 일치해야 한다.
    3. DB에 없는 운동을 지어내는 것은 엄격히 금지된다.
    4. reason 필드는 반드시 모든 운동목록 항목에 포함해야 한다.

    [AVAILABLE EXERCISE DATABASE]
    ${availableExercises || "해당 부위의 운동 데이터가 없습니다."}

    [DETERMINISTIC RECOMMENDATION RULES]
    - TARGET PARTS: ${targets.join(', ')}
    - EXERCISE COUNT: ${recommendation.recommendedExercisesCount}
    - VOLUME GUIDELINE: Sets ${recommendation.volumeGuideline.sets}, Reps ${recommendation.volumeGuideline.reps}
    ${selectedMode === 'hard_mode_drop_set' ? '- DROP SET RULE: 운동목록의 마지막 3개 운동은 반드시 equipment가 "덤벨"인 덤벨 운동으로 선택해라. 이 규칙은 절대적으로 지켜야 한다.' : ''}
    `;

    let isJsonOutput = true;
    let systemPrompt: string;

    if (type === "chat") {
      isJsonOutput = false;

      // ── 1차: 자체 학습 코치 모델 시도 (한국어 대화만, 분석 탭 제외, 실패 시 Gemini 폴백) ──
      if (!isEn && userPrompt && currentTab !== 'analysis') {
        const systemInfo = [
          `- 현재 탭: ${currentTab === 'analysis' ? '분석' : currentTab}`,
          `- 점진적 과부하 상태: ${buildProgressiveOverloadStatus(recentWorkouts)}`,
          `- 주간 볼륨: ${buildWeeklyVolumeBySets(recentWorkouts)}`,
          `- 컨디션: ${buildConditionText(condition)}`,
        ].join('\n');

        const localReply = await callLocalCoach(systemInfo, userPrompt);
        if (localReply) {
          return new Response(
            JSON.stringify({
              reply: localReply,
              content: localReply,
              parsedData: null,
              engineConfig: recommendation,
              source: "local-coach",
            }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        // localReply가 null이면 아래 기존 Gemini 경로로 계속 진행
      }

      const allExercisesDb = exercises
        .map((ex: any) => `- ${ex.name} (부위: ${ex.body_part || ex.bodyPart})`)
        .join('\n');

      systemPrompt = `You are a professional fitness coach. ${langInstruction}

[CORE INSTRUCTION - 최우선 규칙]
사용자의 메시지를 반드시 최우선으로 따른다.
특정 부위, 운동 종류, 개수가 언급되면 반드시 그것을 기준으로 응답한다.
userProfile과 recentWorkouts는 참고용이며, 사용자 요청을 절대 override하지 마라.

[RESPONSE FORMAT RULES]
- 운동 추천/루틴 구성 요청 (예: "하체운동 추천", "등 운동 5가지" 등): 반드시 아래 JSON 형식으로만 응답한다. JSON 외 텍스트는 금지.
- 단순 질문 (운동 방법, 영양, 자세 교정 등): 텍스트로만 응답한다. JSON 없이.

[JSON SCHEMA - 운동 추천 시 반드시 사용]
{
  "운동추천": {
    "추천사유": "운동 빈도(${frequencyComment})를 자연스럽게 언급하며 요청 기반으로 추천 이유를 1~2문장으로 작성. 친근한 트레이너 구어체.",
    "운동목록": [
      {
        "부위": "아래 DB의 부위명과 일치",
        "운동명": "아래 DB의 운동명과 일치",
        "세부타겟": "타겟 근육 (예: 대흉근)",
        "reason": "이 운동을 선택한 구체적 근거를 친근한 구어체로 두 줄 이내 작성. 아래 데이터를 분석해 근거로 활용할 것: 1) neverDoneExercises에 있으면 '한 번도 안 해본 운동이에요 → 새로운 자극' 2) bodyPartVolume에서 해당 부위 세부 근육 볼륨 불균형이 있으면 구체적으로 언급 (예: '대퇴사두근 볼륨이 햄스트링보다 많아요 → 균형 보완') 3) recentWorkouts 최근 10회에 없는 운동이면 '최근에 한 번도 안 한 운동이에요' 언급",
        "세트정보": [{"set": 1, "reps": 12, "weight": 0}, {"set": 2, "reps": 12, "weight": 0}]
      }
    ]
  }
}

[STRICT RULES]
1. 운동명은 반드시 아래 [AVAILABLE EXERCISE DATABASE]에서만 선택한다.
2. DB에 없는 운동을 만들어내는 것은 금지된다.
3. 부위와 운동명은 DB와 정확히 일치해야 한다.
4. reason 필드는 반드시 모든 운동목록 항목에 포함해야 한다.

[USER CONTEXT - 참고용]
- Level: ${profileLevel}
- Goal: ${profileGoal}
- Available Time: ${profileTime}
- Workout Frequency: ${frequencyComment}
- Recent Exercises (last 30 workouts): ${recentExerciseNames}
- Body Part Volume (kg×reps, last 10 workouts): ${volumeContext}
- Detailed Exercise Volume (last 30 days): ${exerciseVolumeContext || 'None'}
- Never Done Exercises (sample): ${neverDoneContext}

[AVAILABLE EXERCISE DATABASE]
${allExercisesDb || "운동 데이터가 없습니다."}
`;
    } else {
      systemPrompt = `You are a professional bodybuilding head coach. ${langInstruction}\n${systemGuideline}`;
    }

    const geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: systemPrompt }] },
        contents: [
          { role: 'user', parts: [{ text: userPrompt || '오늘 운동 추천해줘.' }] }
        ],
        generationConfig: {
          temperature: 0.1,
          responseMimeType: isJsonOutput ? "application/json" : "text/plain",
        },
      }),
    });

    const geminiData = await geminiRes.json();
    const content = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || "";

    return new Response(
      JSON.stringify({ 
        reply: content,
        content: content,
        parsedData: isJsonOutput ? JSON.parse(content) : null,
        engineConfig: recommendation 
      }), 
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error('[Edge Function Error]:', error);
    return new Response(JSON.stringify({ 
      error: true, 
      message: error.message || 'AI 추천 중 오류가 발생했습니다.', 
      fallback: {
        reply: "현재 AI 코치 시스템이 일시적으로 혼잡합니다. 잠시 후 다시 시도해주세요.",
        parsedData: { routines: [], recommendationReason: "에러 복구 모드" }
      }
    }), { 
      status: 200, 
      headers: { ...corsHeaders, "Content-Type": "application/json" } 
    });
  }
});
