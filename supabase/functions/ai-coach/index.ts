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
      console.log('[DB] Best records loaded for', Object.keys(bestRecords).length, 'exercises')

      // 프론트에서 전달된 최근 7일 운동 기록으로 이력 텍스트 생성
      type WorkoutDay = { date: string; parts: string[]; exercises: string[] }
      const workoutDays = (recentWorkouts as WorkoutDay[] | undefined) || []
      const today = new Date().toISOString().split('T')[0]
      const todayEntry = workoutDays.find(w => w.date === today)
      const todayParts = todayEntry?.parts ?? []

      const recentPartLines = workoutDays.length > 0
        ? workoutDays.map(w => {
            const d = new Date(w.date)
            const label = `${d.getMonth() + 1}월 ${d.getDate()}일(${['일','월','화','수','목','금','토'][d.getDay()]})`
            const exStr = w.exercises.slice(0, 4).join(', ') + (w.exercises.length > 4 ? ' 외' : '')
            return `- ${label}: ${w.parts.join(', ')} (${exStr})`
          }).join('\n')
        : '최근 운동 기록 없음'

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

      // ── 프로필 필드 조건부 정리 ──────────────────────────────────────
      const p = profile as Record<string, unknown> | null
      const age = p?.age ? `${p.age}세` : null
      const gender = p?.gender === 'male' ? '남성' : p?.gender === 'female' ? '여성' : null
      const physique = (p?.height || p?.weight)
        ? `키 ${p?.height ?? '?'}cm, 몸무게 ${p?.weight ?? '?'}kg`
        : null
      const inbody = [
        p?.skeletal_muscle_mass != null ? `골격근량 ${p.skeletal_muscle_mass}kg` : null,
        p?.body_fat_mass != null        ? `체지방량 ${p.body_fat_mass}kg`        : null,
        p?.body_fat_percentage != null  ? `체지방률 ${p.body_fat_percentage}%`   : null,
        p?.bmr != null                  ? `기초대사량 ${p.bmr}kcal`              : null,
        p?.visceral_fat_level != null   ? `내장지방 ${p.visceral_fat_level}단계` : null,
      ].filter(Boolean).join(', ')

      const ageNum = p?.age ? Number(p.age) : null
      const ageNote = ageNum
        ? ageNum >= 50 ? '50대 이상: 관절 보호 최우선, 중량보다 자세와 범위 강조'
        : ageNum >= 40 ? '40대: 관절 부하 최소화, 회복 중시'
        : ageNum >= 20 ? '20~30대: 고강도 훈련 가능'
        : null
        : null

      const fatPct = p?.body_fat_percentage != null ? Number(p.body_fat_percentage) : null
      const muscleKg = p?.skeletal_muscle_mass != null ? Number(p.skeletal_muscle_mass) : null
      const inbodyNote = [
        fatPct != null && fatPct >= 25 ? '체지방률이 높음 → 유산소 또는 복합 운동 비중 증가' : null,
        muscleKg != null && muscleKg < 30 ? '골격근량이 낮음 → 근력 운동 위주로 구성' : null,
      ].filter(Boolean).join(', ')

      const level = String(p?.experience_level || '')
      const freq = Number(p?.weekly_frequency || 0)
      const isAdvanced = level === 'intermediate' || level === 'advanced'
      const splitStrategy = level === 'beginner'
        ? '2분할 (상체 / 하체) — 전신을 고르게 자극하는 기초 루틴'
        : isAdvanced && freq >= 4
        ? '3~4분할 추천 — 예: 가슴+삼두 / 등+이두 / 어깨 / 하체'
        : isAdvanced
        ? '2~3분할 추천 — 예: 상체(가슴·어깨·팔) / 하체 / 등·코어'
        : '2분할 (상체 / 하체)'

      const systemPrompt = `당신은 전문 퍼스널 트레이너입니다.

**중요: 모든 응답은 반드시 한글로 작성하세요.**

사용자 정보:
- 목표: ${p?.goal || '없음'}
- 경험: ${p?.experience_level || '없음'}
- 주당 횟수: ${freq}회${age ? `\n- 나이: ${age}${ageNote ? ` (${ageNote})` : ''}` : ''}${gender ? `\n- 성별: ${gender}` : ''}${physique ? `\n- 신체: ${physique}` : ''}${inbody ? `\n- 인바디: ${inbody}${inbodyNote ? ` → ${inbodyNote}` : ''}` : ''}
- 운동 환경: ${p?.equipment_access || '없음'}
- 제한사항: ${(p?.limitations as string[])?.join(', ') || '없음'}

분할 전략 (반드시 적용):
${splitStrategy}${todayParts.length > 0 ? `\n\n⚠️ 오늘 이미 운동한 부위: ${todayParts.join(', ')}\n→ 위 부위는 오늘 추천에서 반드시 제외하세요. 쉬고 있는 부위 위주로 선택하세요.` : ''}

최근 7일 운동 이력 (날짜: 부위 / 운동명):
${recentPartLines}

운동 목록 (이 목록에서만 선택):
${exerciseList}

**응답 규칙:**
1. 위 운동 리스트에서만 선택하세요
2. 분할 전략을 반드시 적용하세요. 경험·빈도에 맞는 분할 수를 지켜주세요
3. 오늘 이미 운동한 부위가 있으면 절대 포함하지 마세요
4. 최근 자주 한 부위는 피하고, 오랫동안 안 한 부위를 우선 추천하세요
5. 나이·인바디 정보가 있으면 강도와 중량 제안에 반영하세요
6. 영어 표현 금지: "Low Weight High Reps" → "저중량 고반복", "Strength" → "근력", "Hypertrophy" → "근비대"

**intro 작성 규칙:**
- 최근 운동 이력을 분석해서 오늘 어떤 부위 차례인지 설명하세요
- 오늘 이미 운동한 부위가 있으면 그것을 제외했다고 자연스럽게 언급하세요
- 분할 전략과 인바디 등 개인 정보를 반영한 구성 방향을 자연스럽게 언급하세요
- 예시: "오늘 이미 가슴과 팔을 하셨네요! 분할 전략에 따라 오늘 남은 등+어깨 위주로 구성해봤어요."
- 운동 기록이 없으면: "아직 운동 기록이 없네요! 기초부터 차근차근 시작해봐요."

**tip 작성 규칙:**
- 이번에 추천한 주요 부위에 맞는 부상 예방 팁 1문장
- 반드시 "오늘도 화이팅!" 으로 마무리
- 부위별 예시:
  - 가슴: "운동 중 어깨가 말리지 않도록 주의하세요. 오늘도 화이팅!"
  - 등: "견갑골을 충분히 수축하며 천천히 동작하세요. 오늘도 화이팅!"
  - 하체: "무릎이 발끝을 넘지 않도록 주의하세요. 오늘도 화이팅!"
  - 어깨: "가벼운 무게로 정확한 자세를 유지하세요. 오늘도 화이팅!"
  - 팔: "손목이 꺾이지 않도록 그립을 단단히 유지하세요. 오늘도 화이팅!"
  - 코어: "허리가 아치형으로 꺾이지 않도록 복압을 유지하세요. 오늘도 화이팅!"

반드시 JSON 형식으로만 응답하세요:
{
  "intro": "최근 데이터 분석 결과와 이번 루틴 방향 설명 (한글, 1-2문장)",
  "recommendations": [
    {
      "exercise_id": "운동ID (문자열, 위 목록의 ID 그대로)",
      "name": "운동명 (위 목록의 이름 그대로)",
      "part": "부위",
      "best_record": "60kg × 10회" 또는 "기록없음",
      "advice": "이 운동을 추천하는 이유 (한글로만 작성)"
    }
  ],
  "tip": "부위별 부상 예방 팁 + 오늘도 화이팅! (한글, 1문장)"
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
