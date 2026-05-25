// Supabase Edge Function: ai-chat
// Free-tier AI proxy. Authenticates the user, enforces a daily message cap,
// and calls Gemini with a SERVER-held key (never shipped to the browser).
//
// Deploy:
//   supabase secrets set GEMINI_API_KEY=<your rotated key>
//   supabase functions deploy ai-chat
//
// SUPABASE_URL / SUPABASE_ANON_KEY are injected automatically at runtime.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const DAILY_LIMIT = 4;
const GEMINI_MODEL_DEFAULT = "gemini-2.5-flash";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function callGemini(messages: any[], model: string): Promise<string> {
  const apiKey = Deno.env.get("GEMINI_API_KEY");
  if (!apiKey) throw new Error("GEMINI_API_KEY not configured on the server");

  const contents = messages
    .filter((m) => m.role !== "system")
    .map((m) => ({
      role: m.role === "user" ? "user" : "model",
      parts: [{ text: m.content }],
    }));
  const systemPrompt = messages.find((m) => m.role === "system")?.content || "";

  const url =
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      system_instruction: systemPrompt
        ? { parts: [{ text: systemPrompt }] }
        : undefined,
      contents,
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 2048,
      },
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`Gemini API error: ${err?.error?.message || res.statusText}`);
  }

  const data = await res.json();
  return data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return json({ error: "unauthorized" }, 401);

    const { messages, model } = await req.json();
    if (!Array.isArray(messages)) {
      return json({ error: "messages array required" }, 400);
    }

    // Peek today's usage (RLS scopes this to the caller).
    const today = new Date().toISOString().slice(0, 10);
    const { data: usageRow } = await supabase
      .from("ai_usage")
      .select("message_count")
      .eq("usage_date", today)
      .maybeSingle();
    const used = usageRow?.message_count ?? 0;

    if (used >= DAILY_LIMIT) {
      return json({ error: "daily_limit_reached", used, limit: DAILY_LIMIT }, 429);
    }

    const content = await callGemini(messages, model || GEMINI_MODEL_DEFAULT);

    // Count only successful calls.
    const { data: newCount } = await supabase.rpc("increment_ai_usage");

    return json({
      content,
      usage: { used: newCount ?? used + 1, limit: DAILY_LIMIT },
    });
  } catch (e) {
    return json({ error: (e as Error).message || "internal error" }, 500);
  }
});
