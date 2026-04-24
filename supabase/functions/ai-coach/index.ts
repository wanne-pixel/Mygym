import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS_HEADERS });

  try {
    const authHeader = req.headers.get('Authorization') || req.headers.get('authorization');
    if (!authHeader) throw new Error('No authorization header');

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const supabaseClient = createClient(supabaseUrl!, supabaseAnonKey!);
    const token = authHeader.replace("Bearer ", "").trim();
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
    if (authError || !user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: CORS_HEADERS });

    const openaiKey = Deno.env.get("OPENAI_API_KEY");
    const body = await req.json();
    const { 
      type, lang = 'ko', recentWorkouts = [], userProfile = {}, 
      selectedMode = 'balanced', chatHistory = [], userPrompt = '',
      muscle_group = '', breakdown = [], total_workouts = 0,
      muscle_stats = {}, weekly_frequency = 0
    } = body;

    const isEn = lang === 'en';
    const langInstruction = isEn ? "Respond strictly in English." : "반드시 한국어로 작성하세요.";
    
    // [강력한 코칭 및 일관성 규칙]
    const strictCoachingRules = `
    [ABSOLUTE RULES]
    1. VOLUME: For recommendations, you MUST provide between 5 and 7 exercises. NEVER provide fewer than 5.
    2. LEVEL-BASED SPLIT: Advanced users MUST receive split routines. NEVER full-body.
    3. TIE-BREAKER PRIORITY: If multiple muscle groups have rested for the same duration, follow this order: [Back -> Chest -> Legs -> Shoulders -> Arms].
    4. VARIETY: Include a mix of compound movements and isolation exercises for the target group.
    `;

    let systemPrompt = "";
    let isJsonOutput = false;

    if (type === "muscle_analysis") {
      isJsonOutput = true;
      systemPrompt = `You are a fitness data analyst. ${langInstruction}\nAnalyze workout distribution for ${muscle_group}.\nRespond ONLY in JSON: { "analysis": { "title": "string", "summary": "string", "advice": "string" } }`;
    } 
    else if (type === "training_analysis") {
      isJsonOutput = true;
      systemPrompt = `You are a head coach. ${langInstruction}\nAnalyze 30-day performance.\nRespond ONLY in JSON: { "title": "string", "summary": "string", "intensity": "string", "balance": "string", "consistency": "string", "recommendations": ["string"] }`;
    } 
    else {
      isJsonOutput = type === "recommendation" || /추천|루틴|바꿔|늘려|추가|교체/.test(userPrompt);
      systemPrompt = `You are a professional bodybuilding head coach. ${langInstruction}
      ${strictCoachingRules}
      USER PROFILE: ${JSON.stringify(userProfile)}
      RECENT LOGS: ${JSON.stringify(recentWorkouts)}
      [JSON SCHEMA] { "recommendationReason": "string", "routines": [{ "part": "string", "exercise": "string", "sub_target_focus": "string", "sets_data": [{"kg": "number", "reps": "number"}] }] }`;
    }

    const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Authorization": `Bearer ${openaiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt || 'Recommend a routine.' }],
        temperature: 0,
        seed: 42, // 완전 결정론적 결과 유도
        response_format: isJsonOutput ? { type: "json_object" } : undefined,
      }),
    });

    const openaiData = await openaiRes.json();
    const content = openaiData.choices?.[0]?.message?.content || "";

    return new Response(
      JSON.stringify({ 
        reply: content,
        content: content,
        parsedData: isJsonOutput ? JSON.parse(content) : null 
      }), 
      { headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: CORS_HEADERS });
  }
});
