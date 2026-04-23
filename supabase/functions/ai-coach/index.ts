/**
 * 운동 용어 한글화 가이드
 *
 * 강도/방식:
 * - Low Weight High Reps → 저중량 고반복
 * - High Weight Low Reps → 고중량 저반복
 * - Drop Set → 드롭 세트
 * - Superset → 슈퍼 세트
 * - Giant Set → 자이언트 세트
 * - Pyramid Training → 피라미드 훈련
 *
 * 목표:
 * - Strength → 근력
 * - Hypertrophy → 근비대
 * - Endurance → 지구력
 * - Power → 파워/순발력
 *
 * 동작:
 * - Concentric → 수축 동작
 * - Eccentric → 이완 동작
 * - Isometric → 등척성 수축
 * - Full Range of Motion (ROM) → 전체 가동 범위
 *
 * 기타:
 * - Progressive Overload → 점진적 과부하
 * - Time Under Tension (TUT) → 긴장 지속 시간
 * - Mind-Muscle Connection → 마인드-머슬 커넥션 (또는 근육 인지)
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface UserProfileInput {
  level?: string;
  frequency?: number | string;
  availableTime?: string;
  goals?: string[];
  limitations?: string[];
}

function buildUserContext(profile: UserProfileInput, isEn: boolean): string {
  const { 
    level = 'beginner', 
    frequency = 3, 
    availableTime = '30분~1시간', 
    goals = [], 
    limitations = [] 
  } = profile || {};
  
  const lines: string[] = [];

  // 1. 운동경험 & 운동횟수 → 분할 및 난이도 결정
  const isAdvanced = level === 'advanced';
  const isBeginner = level === 'beginner';
  const freqNum = Number(frequency) || 0;

  if (isBeginner || freqNum <= 3) {
    lines.push(isEn
      ? "SPLIT: Full-body (no-split) routine. Prioritize machine-based exercises for safety and proper form."
      : "분할: 전신(무분할) 루틴으로 구성. 안전한 자세 습득을 위해 머신 위주로 배치."
    );
  } else if (freqNum === 4) {
    lines.push(isEn
      ? "SPLIT: Upper/Lower 2-day split. Increase proportion of free weight (barbell/dumbbell) exercises."
      : "분할: 상체/하체 2분할 루틴으로 구성. 프리웨이트(바벨/덤벨) 비중을 높여 구성."
    );
  } else if (freqNum >= 5 || isAdvanced) {
    lines.push(isEn
      ? "SPLIT: 3+ day body-part isolation split. Include advanced compound multi-joint movements (e.g. deadlift, squat variants)."
      : "분할: 3분할 이상의 부위별 고립 루틴. 고난이도 복합 다관절 운동(데드리프트, 스쿼트 변형 등) 포함."
    );
  }

  // 2. 운동시간 → 볼륨 통제
  const isShortSession = availableTime === '30분 이하' || availableTime === '30분~1시간';
  if (isShortSession) {
    lines.push(isEn
      ? "VOLUME: Limit to 3-4 core exercises, no more than 10-12 total sets."
      : "볼륨: 핵심 종목 3~4개, 총 10~12세트 이하로 제한."
    );
  } else {
    lines.push(isEn
      ? "VOLUME: Include 4-6 exercises, target 15-20 total sets."
      : "볼륨: 종목 4~6개, 총 15~20세트 내외로 구성."
    );
  }

  // 3. 운동목표 → 강도 및 휴식시간
  const primaryGoal = Array.isArray(goals) && goals.length > 0 ? goals[0] : 'maintenance';
  if (primaryGoal === 'strength') {
    lines.push(isEn
      ? "INTENSITY: Strength goal — high weight, low reps (3-6 reps/set). 2-3 min rest between sets."
      : "강도: 근력 증가 목표 — 고중량 저반복(세트당 3~6회). 세트 간 휴식 2~3분."
    );
  } else if (primaryGoal === 'weight_loss') {
    lines.push(isEn
      ? "INTENSITY: Fat loss goal — short rest (~1 min), prioritize full-body compound movements to maximize calorie burn."
      : "강도: 체중 감량 목표 — 짧은 휴식(1분 내외), 칼로리 소모 극대화를 위한 전신 다관절 운동 위주."
    );
  } else {
    lines.push(isEn
      ? "INTENSITY: Hypertrophy/maintenance — moderate weight, moderate reps (8-12 reps/set). 1-1.5 min rest."
      : "강도: 근육 성장/현상 유지 목표 — 중중량 중반복(세트당 8~12회). 휴식 1~1.5분."
    );
  }

  // 4. 부상사항 → 절대 제약 (값이 있을 때만)
  if (Array.isArray(limitations) && limitations.length > 0) {
    const injuryList = limitations.join(', ');
    lines.push(isEn
      ? `INJURY CONSTRAINT (ABSOLUTE — DO NOT IGNORE): Completely exclude any exercises or postures that place stress on: ${injuryList}. Always suggest safe alternative movements instead.`
      : `부상 제약 (절대 준수 — 예외 없음): 다음 부위(${injuryList})에 무리가 가는 자세나 종목은 절대 배제하고 반드시 안전한 대체 운동을 제안.`
    );
  }

  const header = isEn ? "[PERSONALIZED USER CONSTRAINTS]" : "[개인화 제약조건]";
  return `${header}\n${lines.map((l, i) => `${i + 1}. ${l}`).join('\n')}`;
}

serve(async (req) => {
  // CORS 프리플라이트 요청 처리
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: CORS_HEADERS
    });
  }

  try {
    const authHeader = req.headers.get('authorization') || req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const token = authHeader.replace("Bearer ", "").trim();

    // @ts-ignore
    const supabase = createClient(
      // @ts-ignore
      Deno.env.get("SUPABASE_URL")!,
      // @ts-ignore
      Deno.env.get("SUPABASE_ANON_KEY")!
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      throw new Error(authError?.message || 'Invalid token');
    }

    // @ts-ignore: Deno is available at runtime
    const openaiKey = Deno.env.get("OPENAI_API_KEY");
    if (!openaiKey) throw new Error("OpenAI API key not configured");

    // Body 파싱 및 Null 방어
    const body = await req.json().catch(() => ({}));
    const { 
      type, 
      lang = 'ko', 
      recentWorkouts = [], 
      userProfile = {}, 
      exercises = [], 
      selectedMode = 'balanced', 
      chatHistory = [], 
      userPrompt = '', 
      systemMessage = '' 
    } = body;

    const isEn = lang === 'en';
    const langInstruction = isEn 
      ? "IMPORTANT: You MUST respond strictly in English. All analysis, names, and advice must be in English."
      : "중요: 모든 응답은 반드시 한국어로 작성하세요. 모든 분석, 운동 명칭, 조언은 한글이어야 합니다.";

    // 최근 운동 기록 → 프롬프트용 텍스트 생성 (방어적 로직 적용)
    const recentLogsText = (Array.isArray(recentWorkouts) && recentWorkouts.length > 0)
      ? recentWorkouts.map((session: any) => {
          const sessionExercises = (Array.isArray(session.exercises) ? session.exercises : [])
            .map((e: any) =>
              `    - ${e.exercise || 'Unknown'}(${e.part || 'Unknown'}): ${isEn ? 'best' : '최고'} ${e.bestKg || 0}kg × ${e.bestReps || 0}${isEn ? 'reps' : '회'}, ${e.totalSets || 0}${isEn ? 'sets' : '세트'}`
            )
            .join('\n');
          return `  [${session.date || 'Unknown Date'}]\n${sessionExercises || (isEn ? '    (no details)' : '    (상세 없음)')}`;
        }).join('\n')
      : (isEn ? 'No recent workout records.' : '최근 운동 기록 없음.');

    const recentLogsSection = isEn
      ? `[RECENT WORKOUT HISTORY — USE FOR CONTEXTUAL ADVICE & PROGRESSIVE OVERLOAD]
Based on the records below, provide feedback or plan future sessions:
1. Muscle groups trained recently are available for recovery assessment.
2. Use recorded weights to suggest appropriate intensity (progressive overload).
3. Ensure variety by referencing what was already done.

${recentLogsText}`
      : `[최근 운동 기록 — 맥락 파악 및 점진적 과부하 가이드]
아래 기록을 토대로 유저에게 조언하거나 계획을 세우세요:
1. 최근 훈련한 부위를 통해 회복 상태를 가늠하세요.
2. 기록된 무게를 바탕으로 적절한 강도 설정(점진적 과부하)을 조언하세요.
3. 이미 수행한 종목을 참고하여 루틴의 다양성을 확보하세요.

${recentLogsText}`;

    let messages: Array<{ role: string; content: string }> = [];
    let useJsonMode = false;

    // ── recommendation: 루틴 추천 로직 ──────────────────
    if (type === "recommendation") {
      console.log("=== RECOMMENDATION DEBUG ===");
      console.log("exercises count:", Array.isArray(exercises) ? exercises.length : exercises);
      console.log("recentWorkouts:", JSON.stringify(recentWorkouts));
      console.log("selectedMode:", selectedMode);
      console.log("userProfile:", JSON.stringify(userProfile));
      console.log("lang:", lang);

      useJsonMode = true;

      const baseInstruction = isEn 
        ? "You are the world's best AI Fitness Personal Trainer. You must provide a hyper-personalized workout routine based on the user's profile and history. Respond ONLY with a valid JSON object. No conversational text."
        : "너는 세계 최고의 헬스 트레이너 AI야. 유저의 프로필과 히스토리를 바탕으로 초개인화된 운동 루틴을 제공해야 해. 절대 줄글을 쓰지 말고 지정된 JSON 형식으로만 응답해.";

      let modeInstruction = "";
      if (isEn) {
        switch (selectedMode) {
          case "hard_mode_high_weight":
            modeInstruction = "STRENGTH FOCUS: Use high weights (80-90% 1RM). 3-5 reps per set, 4-5 sets. NEVER use dropKgs or isDropSet (keep false).";
            break;
          case "hard_mode_low_weight":
            modeInstruction = "ENDURANCE FOCUS: Use light weights. 15-25 reps per set, 4-5 sets. NEVER use dropKgs or isDropSet.";
            break;
          case "hard_mode_progressive":
            modeInstruction = "Pyramid Set: This is an authentic bodybuilding Pyramid Set training. For each exercise, configure 4-5 sets where the weight increases by 5-10kg each set, and the repetitions (reps) decrease accordingly (e.g., Set 1: 60kg 12 reps -> Set 2: 70kg 10 reps -> Set 3: 80kg 8 reps). NEVER use dropKgs or isDropSet fields (keep them false or empty).";
            break;
          case "hard_mode_drop_set":
            modeInstruction = "DROP SET: Break limits. Standard 8-12 reps for first 3 sets. Final set MUST have isDropSet: true. Fill dropKgs with 3 decreasing weights (10-20% drops).";
            break;
          default:
            modeInstruction = "STANDARD HYPERTROPHY: 8-12 reps per set, 3-4 sets. Standard balanced routine.";
        }
      } else {
        switch (selectedMode) {
          case "hard_mode_high_weight":
            modeInstruction = "스트렝스 훈련이다. 1RM의 80~90% 수준의 고중량으로 세트당 3~5회(reps)만 반복하도록 4~5세트를 구성해. 절대 dropKgs나 isDropSet 필드를 사용하지 마 (false 유지).";
            break;
          case "hard_mode_low_weight":
            modeInstruction = "근지구력 훈련이다. 가벼운 무게로 세트당 15~25회(reps) 반복하도록 4~5세트를 구성해. 절대 dropKgs나 isDropSet 필드를 사용하지 마.";
            break;
          case "hard_mode_progressive":
            modeInstruction = "이것은 보디빌딩의 정통 '피라미드 세트(Pyramid Set)' 훈련이다. 세트가 진행될수록 무게(kg)는 5~10kg씩 점진적으로 올리고, 그에 맞춰 반복수(reps)는 점진적으로 낮추도록 4~5세트를 구성해. (예: 1세트 60kg 12회 -> 2세트 70kg 10회 -> 3세트 80kg 8회). 절대 dropKgs나 isDropSet 필드를 사용하지 말고 항상 false 또는 빈 값을 유지해.";
            break;
          case "hard_mode_drop_set":
            modeInstruction = "드롭세트: 근비대 한계 돌파 훈련이다. 첫 3~4세트는 일반적인 8~12회 반복으로 구성하고, 반드시 **마지막 세트**에만 isDropSet: true를 적용해. 마지막 세트의 dropKgs 배열에는 본 세트 무게에서 10~20%씩 3단계로 낮춘 무게 3개를 정확히 채워 넣어.";
            break;
          default:
            modeInstruction = "일반 근비대 루틴: 8~12회 반복, 3~4세트의 가장 스탠다드한 루틴을 구성해.";
        }
      }

      const recentlyTrainedParts: string[] = Array.isArray(recentWorkouts)
        ? [...new Set(recentWorkouts.flatMap((w: any) => w?.parts || []))]
        : [];

      const exercisePool = (Array.isArray(exercises) && exercises.length > 0)
        ? exercises.map(ex =>
            `- ID: ${ex.id}, Name: ${isEn ? ex.name_en : ex.name}, Part: ${ex.bodyPart}, Equipment: ${ex.equipment}`
          ).join('\n')
        : (isEn ? 'No exercises available. Use general common exercises.' : '운동 종목 데이터 없음. 일반적인 운동 종목으로 구성할 것.');

      const userContext = buildUserContext(userProfile, isEn);

      const systemPrompt = `${baseInstruction}

[STRICT MODE INSTRUCTION - DO NOT DEVIATE]
${modeInstruction}

${userContext}

${recentLogsSection}

[CONSTRAINTS]
1. EXCLUDE all muscle groups listed in "Recently Trained Parts" from today's routine.
2. Ensure all exercises are selected ONLY from the provided [EXERCISE POOL].

[USER DATA]
- Level: ${userProfile?.level || 'beginner'}
- Goals: ${(Array.isArray(userProfile?.goals) ? userProfile.goals : ['maintenance']).join(', ')}
- Weekly Frequency: ${Number(userProfile?.frequency) || 3} days
- Available Time: ${userProfile?.availableTime || '30분~1시간'}
- Limitations: ${(Array.isArray(userProfile?.limitations) ? userProfile.limitations : []).join(', ') || 'None'}
- Recently Trained Parts (EXCLUDE THESE): ${(recentlyTrainedParts || []).join(', ') || 'None'}
- Selected Mode: ${selectedMode || 'balanced'}

[EXERCISE POOL]
${exercisePool}

[OUTPUT JSON SCHEMA]
{
  "recommendationReason": "1-sentence summary of why this routine is recommended",
  "routines": [
    {
      "part": "Muscle Group",
      "exercise": "Exercise Name from Pool",
      "type": "strength | hypertrophy | endurance",
      "sets_count": number,
      "sets_data": [
        { "kg": "string", "reps": "string", "dropKgs": ["", "", ""], "isDropSet": false }
      ]
    }
  ]
}`;

      if (!systemPrompt || systemPrompt.trim() === '') {
        throw new Error('System prompt generation failed');
      }

      const excludeText = recentlyTrainedParts.length > 0
        ? recentlyTrainedParts.join(', ')
        : 'none';

      messages = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Recommend a ${selectedMode || 'balanced'} routine. Remember to exclude ${excludeText}.` }
      ];

      console.log("systemPrompt length:", systemPrompt?.length);
      console.log("user message:", messages[1]?.content);
      console.log("=== DEBUG END ===");

    // ── muscle_analysis: 부위별 세부 분석 ────────────────────────────
    } else if (type === "muscle_analysis") {
      useJsonMode = true;
      const { muscle_group, breakdown, total_exercises } = body as any;
      const breakdownText = Array.isArray(breakdown)
        ? breakdown.map((b: any) => `- ${b.category}: ${b.percentage}% (Volume ${b.volume || 0}kg, ${b.count || 0} sessions)`).join('\n')
        : '';

      const systemPrompt = `You are an Exercise Physiology Expert.
${langInstruction}

Analysis of ${muscle_group || 'muscle'} for ${total_exercises || 0} sessions:
${breakdownText}

Rules:
1. Analyze the training balance.
2. Suggest improvements.
3. Respond ONLY in JSON.

{
  "analysis": {
    "title": "Short catchy title",
    "summary": "2-3 sentences of evaluation",
    "advice": "Actionable advice"
  }
}`;

      messages = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: 'Analyze this training data.' },
      ];

    // ── training_analysis: 종합 분석 ───────────────────────
    } else if (type === "training_analysis") {
      useJsonMode = true;
      const { total_workouts, muscle_stats } = body as any;
      const systemPrompt = `You are a Sports Data Analyst.
${langInstruction}

Workouts: ${total_workouts || 0}
Summary: ${JSON.stringify(muscle_stats || {})}

Respond ONLY in JSON.
{
  "title": "Overall evaluation title",
  "summary": "Full summary",
  "intensity": "Intensity rating",
  "balance": "Muscle balance rating",
  "consistency": "Consistency rating",
  "recommendations": ["Tip 1", "Tip 2", "Tip 3"]
}`;
      messages = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: 'Analyze my 30-day performance.' },
      ];

    // ── chat: 일반 채팅 (요구사항 반영: { reply: text } 구조) ─────────────────
    } else if (type === "chat") {
      useJsonMode = false;
      const dynamicSystemPrompt = `${systemMessage || 'You are a helpful fitness coach.'}\n\n${recentLogsSection}\n\n${langInstruction}\nAlways respond in ${isEn ? 'English' : 'Korean'}.`;
      
      messages = [
        { role: "system", content: dynamicSystemPrompt },
        ...(Array.isArray(chatHistory) ? chatHistory : []),
        { role: "user", content: userPrompt || 'Hello' },
      ];

    } else if (type === "onboarding") {
      useJsonMode = true;
      const { prompt } = body;
      messages = [
        { role: "system", content: `You are a fitness planner. ${langInstruction} Respond ONLY in JSON.` },
        { role: "user", content: prompt || 'Plan my routine' },
      ];
    } else {
      throw new Error("Invalid type");
    }

    const openaiPayload: any = {
      model: "gpt-4o-mini",
      messages,
      temperature: 0.7,
    };

    if (useJsonMode) {
      openaiPayload.response_format = { type: "json_object" };
    }

    const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openaiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(openaiPayload),
    });

    const openaiData = await openaiRes.json();
    if (!openaiRes.ok) {
      throw new Error(openaiData.error?.message || "OpenAI API error");
    }

    const choices = openaiData.choices;
    if (!Array.isArray(choices) || choices.length === 0) {
      throw new Error("OpenAI returned no choices");
    }
    const content: string | null = choices[0]?.message?.content ?? null;
    if (content === null) {
      const finishReason = choices[0]?.finish_reason ?? 'unknown';
      throw new Error(`OpenAI returned null content (finish_reason: ${finishReason})`);
    }

    console.log("Raw AI response:", content);

    // 응답 구조 분리 로직
    if (type === "chat") {
      console.log("Chat response (raw):", content);
      return new Response(JSON.stringify({ reply: content, content: content }), {
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    } else {
      // JSON 정리: 마크다운 코드블록 제거
      const cleanedContent = content
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();

      console.log("Cleaned content:", cleanedContent);

      let parsedRoutine: any;
      try {
        parsedRoutine = JSON.parse(cleanedContent);
        console.log("Parsed routine:", parsedRoutine);
      } catch (parseError) {
        console.error("JSON parse failed:", parseError);
        console.error("Failed content:", cleanedContent);
        throw new Error("AI response is not valid JSON");
      }

      // recommendation 타입일 때만 routines 배열 검증
      if (type === "recommendation") {
        if (!parsedRoutine.routines || !Array.isArray(parsedRoutine.routines)) {
          throw new Error("AI response missing routines array");
        }
        console.log("Routines count:", parsedRoutine.routines.length);
      }

      console.log("=== DEBUG END ===");

      // reply: 프론트 useAiCoach.callRecommendation의 response.reply 참조 유지
      // content: AnalysisScreen의 JSON.parse(data.content) 참조 유지
      // parsedData: 이미 파싱된 객체를 직접 사용 가능
      return new Response(
        JSON.stringify({ reply: cleanedContent, content: cleanedContent, parsedData: parsedRoutine }),
        { headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
      );
    }

  } catch (error: any) {
    console.error('[CRITICAL ERROR]', error.message);
    // 에러 발생 시에도 반드시 CORS 헤더와 함께 JSON 에러 메시지 반환
    return new Response(JSON.stringify({ 
      error: error.message 
    }), {
      status: 500,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }
});
