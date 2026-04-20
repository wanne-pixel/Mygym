import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }

  try {
    // JWT 검증으로 인증된 사용자만 호출 가능
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }

    const openaiKey = Deno.env.get("OPENAI_API_KEY");
    if (!openaiKey) throw new Error("OpenAI API key not configured");

    const body = await req.json();
    const { type, systemMessage, chatHistory, userPrompt, prompt } = body;

    let messages: Array<{ role: string; content: string }> = [];

    if (type === "chat") {
      if (!systemMessage || !userPrompt) {
        return new Response(JSON.stringify({ error: "Missing required fields" }), {
          status: 400,
          headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
        });
      }
      messages = [
        { role: "system", content: systemMessage },
        ...(chatHistory || []),
        { role: "user", content: userPrompt },
      ];
    } else if (type === "onboarding") {
      if (!prompt) {
        return new Response(JSON.stringify({ error: "Missing prompt" }), {
          status: 400,
          headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
        });
      }
      messages = [
        { role: "system", content: "You are a professional fitness planner. Respond ONLY with a valid JSON object." },
        { role: "user", content: prompt },
      ];
    } else {
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

    return new Response(JSON.stringify({ content }), {
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }
});
