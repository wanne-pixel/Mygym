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

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY")!;

    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
    const token = authHeader.replace("Bearer ", "").trim();
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: CORS_HEADERS });
    }

    const { type, title, content } = await req.json();
    if (!type || !title || !content) throw new Error('Missing required fields');

    // 1. feedback 테이블에 저장
    const { error: dbError } = await supabaseClient
      .from('feedback')
      .insert({ user_id: user.id, type, title, content });
    if (dbError) throw new Error(`DB insert failed: ${dbError.message}`);

    // 2. Resend로 이메일 전송
    const submittedAt = new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' });
    const emailRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'onboarding@resend.dev',
        to: 'wanne.info@gmail.com',
        subject: `[MyGym 피드백] ${type} - ${title}`,
        html: `
          <h2 style="color:#1e293b;">[MyGym 피드백]</h2>
          <p><strong>유형:</strong> ${type}</p>
          <p><strong>제목:</strong> ${title}</p>
          <p><strong>내용:</strong></p>
          <p style="white-space:pre-wrap;background:#f8fafc;padding:12px;border-radius:8px;">${content}</p>
          <hr style="border:none;border-top:1px solid #e2e8f0;margin:16px 0;"/>
          <p style="color:#94a3b8;font-size:13px;"><strong>유저 ID:</strong> ${user.id}</p>
          <p style="color:#94a3b8;font-size:13px;"><strong>제출 시각:</strong> ${submittedAt}</p>
        `,
      }),
    });

    if (!emailRes.ok) {
      const emailErr = await emailRes.text();
      throw new Error(`Email send failed: ${emailErr}`);
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: CORS_HEADERS,
    });
  }
});
