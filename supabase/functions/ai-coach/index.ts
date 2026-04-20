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
    const { type } = body;

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
      console.log('[AUTH] User authenticated:', user.id)

      const { exercises, profile, mode, hardModeType } = body

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
      console.log('[DB] Best records loaded for', Object.keys(bestRecords).length, 'exercises')

      // 운동 목록 문자열 생성
      const exerciseList = (exercises as Array<{
        id: string; name: string; nameEn: string; bodyPart: string; equipment: string
      }>).map(ex => {
        const rec = bestRecords[ex.name]
        const recInfo = rec ? `최고기록: ${rec.kg}kg × ${rec.reps}회` : '기록없음'
        return `- ID: ${ex.id}, 이름: ${ex.name} (${ex.nameEn}), 부위: ${ex.bodyPart}, 장비: ${ex.equipment}, ${recInfo}`
      }).join('\n')

      const modeLabel = mode === 'hard'
        ? `하드모드(${(hardModeType as string)?.replace(/_/g, ' ')})`
        : '균형잡힌 루틴'

      const systemPrompt = `당신은 전문 퍼스널 트레이너입니다.

**중요: 모든 응답은 반드시 한글로 작성하세요.**

사용자 프로필:
- 목표: ${profile?.goal || '없음'}
- 경험: ${profile?.experience_level || '없음'}
- 주당 횟수: ${profile?.weekly_frequency || 0}회
- 장비: ${profile?.equipment_access || '없음'}
- 제한사항: ${(profile?.limitations as string[])?.join(', ') || '없음'}

운동 목록 (이 목록에서만 선택):
${exerciseList}

**응답 규칙:**
1. 위 운동 리스트에서만 선택하세요
2. 추천 이유는 한글로 작성하세요
3. 모든 운동 용어, 설명, 조언을 한글로 작성하세요
4. "Low Weight High Reps" 같은 영어 표현을 사용하지 마세요
   - 대신 "낮은 중량 높은 반복" 또는 "저중량 고반복" 사용
5. "Strength", "Hypertrophy" 같은 영어 단어 금지
   - 대신 "근력", "근비대" 사용

반드시 JSON 형식으로만 응답하세요:
{
  "recommendations": [
    {
      "exercise_id": "운동ID (문자열, 위 목록의 ID 그대로)",
      "name": "운동명 (위 목록의 이름 그대로)",
      "part": "부위",
      "best_record": "60kg × 10회" 또는 "기록없음",
      "advice": "이 운동을 추천하는 이유 (한글로만 작성)"
    }
  ]
}`

      messages = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `${modeLabel} 기준으로 오늘 운동 루틴 3-5개를 한국어로 추천해줘.` }
      ]

    // ── muscle_analysis: 부위별 세부 분석 ────────────────────────────
    } else if (type === "muscle_analysis") {
      const token = authHeader.replace("Bearer ", "").trim()

      // @ts-ignore
      const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!)
      const { data: { user }, error: authError } = await supabase.auth.getUser(token)
      if (authError || !user) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
        })
      }

      const { muscle_group, breakdown, total_exercises } = body as {
        muscle_group: string
        breakdown: Array<{ category: string; volume: number; count: number; percentage: number }>
        total_exercises: number
      }

      const muscleContext: Record<string, string> = {
        '가슴': '가슴은 상부(인클라인), 중부(플랫), 하부(딥스/디클라인)로 나뉩니다. 3D 가슴 발달을 위해 세 부위를 고르게 자극해야 합니다.',
        '등': '등은 넓이(수직 당기기 - 풀업/랫풀다운)와 두께(수평 당기기 - 로우)로 나뉩니다. V자 체형에는 넓이, 두꺼운 등에는 두께 운동이 핵심입니다.',
        '어깨': '어깨는 전면·측면·후면 삼각근으로 구성됩니다. 3D 어깨와 부상 예방을 위해 후면 삼각근 훈련이 특히 중요합니다.',
        '하체': '하체는 대퇴사두근, 햄스트링/둔근, 종아리로 나뉩니다. 스쿼트 중심이면 대퇴사두근 비중이 높아지므로 햄스트링/둔근 보완이 필요합니다.',
        '팔': '팔은 이두근과 삼두근으로 구성됩니다. 팔 둘레의 약 2/3를 삼두근이 차지하므로 큰 팔을 원한다면 삼두근 훈련에 더 집중하는 것이 효과적입니다.',
        '코어': '코어는 복직근(전면)과 복사근(측면/회전)으로 나뉩니다. 기능적 코어 강화와 허리 건강을 위해 복사근 훈련도 균형있게 포함해야 합니다.',
      }

      const breakdownText = breakdown
        .map(b => `- ${b.category}: ${b.percentage}% (볼륨 ${b.volume.toLocaleString()}kg, ${b.count}세션)`)
        .join('\n')

      const systemPrompt = `당신은 운동 생리학 전문가입니다.

**중요: 모든 응답은 반드시 한글로 작성하세요.**

[${muscle_group} 해부학 컨텍스트]
${muscleContext[muscle_group] || ''}

[사용자 훈련 데이터]
총 ${total_exercises}세션의 ${muscle_group} 운동 분석:
${breakdownText}

**응답 규칙:**
1. 모든 분석 내용을 한글로 작성하세요
2. 영어 운동 용어 금지 (예: "volume", "intensity" → "볼륨", "강도")
3. 전문 용어는 쉬운 한글로 풀어 쓰세요

반드시 아래 JSON 형식으로만 응답하세요. 다른 텍스트는 포함하지 마세요:
{
  "analysis": {
    "title": "핵심 인사이트 한 줄 (예: '넓이 중심 훈련', '균형잡힌 훈련')",
    "summary": "2-3문장으로 현재 훈련 패턴 요약 (한글로만)",
    "advice": "구체적인 개선 조언 (한글로만, 부족한 부위가 있다면 추천 운동 포함)"
  }
}`

      messages = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: '위 훈련 데이터를 분석하고 맞춤 피드백을 제공해주세요.' },
      ]

    // ── training_analysis: 30일 종합 훈련 분석 ───────────────────────
    } else if (type === "training_analysis") {
      const { total_workouts, muscle_stats, day_stats, weekly_frequency, period_days } = body as {
        total_workouts: number
        muscle_stats: Record<string, { count: number; volume: number }>
        day_stats: Record<string, number>
        weekly_frequency: number
        period_days: number
      }

      const muscleLines = Object.entries(muscle_stats)
        .map(([muscle, stats]) => `  - ${muscle}: ${stats.count}회, ${Math.round(stats.volume / 1000)}톤`)
        .join('\n')

      const dayLines = Object.entries(day_stats)
        .map(([day, count]) => `  - ${day}요일: ${count}회`)
        .join('\n')

      const systemPrompt = `당신은 운동 데이터 분석 전문가입니다.

**중요: 모든 응답은 반드시 한글로 작성하세요.**

사용자의 최근 ${period_days}일 운동 데이터:
- 총 운동 횟수: ${total_workouts}회
- 주당 평균: ${weekly_frequency}회
- 부위별 운동:
${muscleLines}
- 요일별 운동:
${dayLines}

**응답 규칙:**
1. 모든 내용을 한글로 작성하세요
2. 영어 용어 금지 (volume → 볼륨, intensity → 강도)

다음 형식으로 JSON만 반환하세요:
{
  "title": "전체 평가 한 줄 (예: '균형잡힌 고강도 훈련', '일관성 있는 중급 루틴')",
  "summary": "2-3문장으로 전반적인 평가 (한글)",
  "intensity": "훈련 강도 평가 (예: '높음', '적정', '보통')",
  "balance": "부위 균형 평가 (예: '균형잡힘', '하체 부족', '상체 집중')",
  "consistency": "일관성 평가 (예: '매우 규칙적', '주 3-4회 안정적', '불규칙')",
  "recommendations": [
    "구체적인 개선 제안 1 (한글)",
    "구체적인 개선 제안 2 (한글)",
    "구체적인 개선 제안 3 (한글)"
  ]
}`

      messages = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: '위 데이터를 종합 분석해주세요.' },
      ]

    // ── chat: 기존 일반 채팅 ───────────────────────────────────────────
    } else if (type === "chat") {
      const { chatHistory, userPrompt } = body
      if (!userPrompt) {
        console.error('[ERROR] Missing required fields for chat type')
        return new Response(JSON.stringify({ error: "Missing required fields" }), {
          status: 400,
          headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
        });
      }
      const chatSystemPrompt = `당신은 친절한 헬스 트레이너입니다.

**중요: 모든 응답은 반드시 한글로 작성하세요.**

사용자의 질문에 운동, 영양, 회복에 대해 조언해주세요.

**응답 규칙:**
1. 친근하고 격려하는 톤 사용
2. 모든 운동 용어를 한글로 표현
   - Bench Press → 벤치 프레스
   - Squat → 스쿼트
   - Deadlift → 데드리프트
   - Sets/Reps → 세트/반복
   - Rest → 휴식
   - Warm-up → 준비운동
   - Cool-down → 마무리 운동
3. 전문 용어는 쉽게 풀어서 설명
4. 영어 약어 금지 (ROM, CNS 등)

응답 형식 (JSON만 반환):
{
  "content": "한글로 작성된 조언"
}`
      messages = [
        { role: "system", content: chatSystemPrompt },
        ...(chatHistory || []),
        { role: "user", content: userPrompt },
      ];

    // ── onboarding ────────────────────────────────────────────────────
    } else if (type === "onboarding") {
      const { prompt } = body
      if (!prompt) {
        console.error('[ERROR] Missing prompt for onboarding type')
        return new Response(JSON.stringify({ error: "Missing prompt" }), {
          status: 400,
          headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
        });
      }
      messages = [
        { role: "system", content: "당신은 전문 피트니스 플래너입니다. 반드시 유효한 JSON 객체만 응답하세요. 모든 텍스트는 한글로 작성하세요." },
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
