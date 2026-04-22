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

serve(async (req) => {
  try {
    console.log('[AUTH] Function started - request received')
    console.log('[DEBUG] Request method:', req.method)

    if (req.method === 'OPTIONS') {
      console.log('[AUTH] Handling OPTIONS request')
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        }
      })
    }

    console.log('[AUTH] Passed OPTIONS check, processing POST')

    const authHeader = req.headers.get('authorization') || req.headers.get('Authorization')
    console.log('[AUTH] Authorization header received:', authHeader ? 'YES' : 'NO')

    if (!authHeader) {
      console.error('[ERROR] No authorization header found')
      return new Response(JSON.stringify({
        error: 'Unauthorized',
        reason: 'No authorization header'
      }), {
        status: 401,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
      })
    }

    // @ts-ignore: Deno is available at runtime
    const openaiKey = Deno.env.get("OPENAI_API_KEY");
    if (!openaiKey) throw new Error("OpenAI API key not configured");

    const body = await req.json();
    const { type, lang } = body;
    const isEn = lang === 'en';
    const langInstruction = isEn 
      ? "IMPORTANT: You MUST respond strictly in English. All analysis, names, and advice must be in English."
      : "중요: 모든 응답은 반드시 한국어로 작성하세요. 모든 분석, 운동 명칭, 조언은 한글이어야 합니다.";

    let messages: Array<{ role: string; content: string }> = [];

    // ── recommendation: 서버에서 시스템 프롬프트 빌드 ──────────────────
    if (type === "recommendation") {
      const token = authHeader.replace("Bearer ", "").trim()

      // @ts-ignore
      const supabase = createClient(
        // @ts-ignore
        Deno.env.get("SUPABASE_URL")!,
        // @ts-ignore
        Deno.env.get("SUPABASE_ANON_KEY")!
      )

      const { data: { user }, error: authError } = await supabase.auth.getUser(token)
      if (authError || !user) {
        console.error('[ERROR] Auth failed for recommendation:', authError?.message)
        return new Response(JSON.stringify({ error: 'Unauthorized', reason: authError?.message }), {
          status: 401,
          headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
        })
      }

      const { exercises, profile, mode, hardModeType, recentWorkouts } = body

      // workout_logs에서 사용자 최고 기록 추출 (운동명 기준)
      const { data: logs } = await supabase
        .from('workout_logs')
        .select('exercise, sets_data')
        .eq('user_id', user.id)

      const bestRecords: Record<string, { kg: number; reps: number }> = {}
      logs?.forEach((log: { exercise: string; sets_data: unknown }) => {
        const sets: Array<{ kg: string | number; reps: string | number }> =
          typeof log.sets_data === 'string' ? JSON.parse(log.sets_data) : log.sets_data
        if (!Array.isArray(sets)) return
        sets.forEach(set => {
          const kg = parseFloat(String(set.kg)) || 0
          const reps = parseInt(String(set.reps)) || 0
          if (!bestRecords[log.exercise] || kg > bestRecords[log.exercise].kg) {
            bestRecords[log.exercise] = { kg, reps }
          }
        })
      })

      // 최근 운동 이력 텍스트 생성
      type WorkoutDay = { date: string; parts: string[]; exercises: string[] }
      const workoutDays = (recentWorkouts as WorkoutDay[] | undefined) || []
      const today = new Date().toISOString().split('T')[0]
      const todayEntry = workoutDays.find(w => w.date === today)
      const todayParts = todayEntry?.parts ?? []

      const recentPartLines = workoutDays.length > 0
        ? workoutDays.map(w => {
            const d = new Date(w.date)
            const label = isEn ? w.date : `${d.getMonth() + 1}월 ${d.getDate()}일`
            return `- ${label}: ${w.parts.join(', ')}`
          }).join('\n')
        : (isEn ? 'No recent workouts' : '최근 운동 기록 없음')

      // 운동 목록 생성
      const exerciseList = (exercises as Array<{
        id: string; name: string; name_en: string; bodyPart: string; equipment: string
      }>).map(ex => {
        const rec = bestRecords[ex.name]
        const recInfo = rec ? (isEn ? `Best: ${rec.kg}kg x ${rec.reps}` : `최고기록: ${rec.kg}kg x ${rec.reps}회`) : (isEn ? 'No record' : '기록없음')
        return `- ID: ${ex.id}, Name: ${isEn ? ex.name_en : ex.name}, Part: ${ex.bodyPart}, Equipment: ${ex.equipment}, ${recInfo}`
      }).join('\n')

      const modeLabel = mode === 'hard'
        ? (isEn ? `Hard Mode (${(hardModeType as string)})` : `하드모드(${(hardModeType as string)})`)
        : (isEn ? 'Balanced Routine' : '균형잡힌 루틴')

      const systemPrompt = `You are a professional Personal Trainer AI Coach.
${langInstruction}

User Profile:
- Goal: ${profile?.goal || 'None'}
- Experience: ${profile?.experience_level || 'None'}
- Frequency: ${profile?.weekly_frequency || 0} times/week
- Limitations: ${(profile?.limitations as string[])?.join(', ') || 'None'}

Workout History:
${recentPartLines}
${todayParts.length > 0 ? `Today already worked on: ${todayParts.join(', ')}. Do NOT recommend these parts again today.` : ''}

Exercise Pool (Select only from this list):
${exerciseList}

Response Rules:
1. Recommend 3-5 exercises from the provided pool.
2. Provide short analysis and a motivational tip.
3. Respond ONLY in a valid JSON format.

JSON Structure:
{
  "intro": "Summary of analysis and today's workout direction",
  "recommendations": [
    {
      "exercise_id": "Original ID from list",
      "name": "Exercise name from list",
      "part": "Body part",
      "best_record": "60kg x 10",
      "advice": "Reason for recommendation"
    }
  ],
  "tip": "Safety tip and finish with 'Go for it!' (or '오늘도 화이팅!')"
}`

      messages = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Recommend today's ${modeLabel} routine based on the data.` }
      ]

    // ── muscle_analysis: 부위별 세부 분석 ────────────────────────────
    } else if (type === "muscle_analysis") {
      const { muscle_group, breakdown, total_exercises } = body as any
      const breakdownText = breakdown
        .map((b: any) => `- ${b.category}: ${b.percentage}% (Volume ${b.volume.toLocaleString()}kg, ${b.count} sessions)`)
        .join('\n')

      const systemPrompt = `You are an Exercise Physiology Expert.
${langInstruction}

Analysis of ${muscle_group} for ${total_exercises} sessions:
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
}`

      messages = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: 'Analyze this training data.' },
      ]

    // ── training_analysis: 종합 분석 ───────────────────────
    } else if (type === "training_analysis") {
      const { total_workouts, muscle_stats, day_stats } = body as any
      const systemPrompt = `You are a Sports Data Analyst.
${langInstruction}

Workouts: ${total_workouts}
Summary: ${JSON.stringify(muscle_stats)}

Respond ONLY in JSON.
{
  "title": "Overall evaluation title",
  "summary": "Full summary",
  "intensity": "Intensity rating",
  "balance": "Muscle balance rating",
  "consistency": "Consistency rating",
  "recommendations": ["Tip 1", "Tip 2", "Tip 3"]
}`
      messages = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: 'Analyze my 30-day performance.' },
      ]

    // ── chat: 일반 채팅 ───────────────────────────────────────────
    } else if (type === "chat") {
      const { chatHistory, userPrompt, systemMessage } = body
      const dynamicSystemPrompt = `${systemMessage}\n\n${langInstruction}\nAlways respond in ${isEn ? 'English' : 'Korean'}.`;
      
      messages = [
        { role: "system", content: dynamicSystemPrompt },
        ...(chatHistory || []),
        { role: "user", content: userPrompt },
      ];

    } else if (type === "onboarding") {
      const { prompt } = body
      messages = [
        { role: "system", content: `You are a fitness planner. ${langInstruction} Respond ONLY in JSON.` },
        { role: "user", content: prompt },
      ];
    } else {
      console.error('[ERROR] Invalid type:', type)
      return new Response(JSON.stringify({ error: "Invalid type" }), {
        status: 400,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }

    const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openaiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages,
        response_format: { type: "json_object" },
        temperature: 0.7,
      }),
    });

    if (!openaiRes.ok) {
      const errData = await openaiRes.json();
      throw new Error(errData.error?.message || "OpenAI API error");
    }

    const data = await openaiRes.json();
    const content = data.choices[0].message.content;
    console.log("[OPENAI] 응답 수신 완료");

    return new Response(JSON.stringify({ content }), {
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error('[ERROR] Unhandled exception:', error)
    // @ts-ignore
    console.error('[ERROR] Stack trace:', error?.stack)
    return new Response(JSON.stringify({
      error: 'Internal server error',
      // @ts-ignore
      details: error?.message,
      // @ts-ignore
      stack: error?.stack
    }), {
      status: 500,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    })
  }
});
