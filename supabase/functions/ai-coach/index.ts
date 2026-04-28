import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// CORS 표준 헤더 정의
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

    const openaiKey = Deno.env.get("OPENAI_API_KEY");
    const body = await req.json();
    const {
      type, lang = 'ko', recentWorkouts = [], userProfile = {},
      exercises = [], userPrompt = '', selectedMode = 'today_routine',
      workoutFrequency = { totalDays: 30, workedOutDays: 0 },
      bodyPartVolume = {},
      neverDoneExercises = [],
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

      const mRes = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: { "Authorization": `Bearer ${openaiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [{ role: 'user', content: musclePrompt }],
          temperature: 0.3,
          response_format: { type: "json_object" },
        }),
      });
      const mData = await mRes.json();
      const mContent = mData.choices?.[0]?.message?.content || "{}";
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

      const aiRes = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: { "Authorization": `Bearer ${openaiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [{ role: 'user', content: analysisPrompt }],
          temperature: 0.3,
          response_format: { type: "json_object" },
        }),
      });
      const aiData = await aiRes.json();
      const content = aiData.choices?.[0]?.message?.content || "{}";
      return new Response(
        JSON.stringify({ content, reply: content }),
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
      (recentWorkouts as any[]).slice(0, 10).map((w: any) => w.exercise).filter(Boolean)
    )].join(', ') || (isEn ? 'No recent records' : '최근 운동 기록 없음');

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
    - Recent Exercises (last 10 workouts): ${recentExerciseNames}
    - Body Part Volume (kg×reps, last 10 workouts): ${volumeContext}
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
- Recent Exercises (last 10 workouts): ${recentExerciseNames}
- Body Part Volume (kg×reps, last 10 workouts): ${volumeContext}
- Never Done Exercises (sample): ${neverDoneContext}

[AVAILABLE EXERCISE DATABASE]
${allExercisesDb || "운동 데이터가 없습니다."}
`;
    } else {
      systemPrompt = `You are a professional bodybuilding head coach. ${langInstruction}\n${systemGuideline}`;
    }

    const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Authorization": `Bearer ${openaiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: 'system', content: systemPrompt }, 
          { role: 'user', content: userPrompt || '오늘 운동 추천해줘.' }
        ],
        temperature: 0.1, // 창의성을 억제하고 규칙 준수율을 높임
        seed: 42,
        response_format: isJsonOutput ? { type: "json_object" } : undefined,
      }),
    });

    const openaiData = await openaiRes.json();
    const content = openaiData.choices?.[0]?.message?.content || "";

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
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500, 
      headers: { ...corsHeaders, "Content-Type": "application/json" } 
    });
  }
});
