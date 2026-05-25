// Supabase Edge Function: reset-password
// Verifies a user's security-question answer and resets their password.
// Runs with the SERVICE ROLE (auto-injected) so it can update any user's
// password — but it only ever does so after the answer hash matches.
//
// Deploy:
//   supabase functions deploy reset-password
// (No manual secret needed: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are
//  injected automatically at runtime.)

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

// SHA-256 hex of the normalized answer. MUST match the frontend hashing
// (trim + lowercase) so signup and reset produce the same digest.
async function hashAnswer(answer: string): Promise<string> {
  const normalized = answer.trim().toLowerCase();
  const buf = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(normalized),
  );
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { username, answer, newPassword } = await req.json();

    if (!username || !answer || !newPassword) {
      return json({ error: "username, answer and newPassword are required" }, 400);
    }
    if (String(newPassword).length < 6) {
      return json({ error: "Password must be at least 6 characters" }, 400);
    }

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Look up the profile by username.
    const { data: profile, error: pErr } = await admin
      .from("profiles")
      .select("id, security_answer_hash")
      .eq("username", String(username).trim().toLowerCase())
      .maybeSingle();

    // Generic message either way — don't reveal whether a username exists.
    if (pErr || !profile || !profile.security_answer_hash) {
      return json({ error: "Could not verify your answer. Please try again." }, 400);
    }

    const provided = await hashAnswer(String(answer));
    if (provided !== profile.security_answer_hash) {
      return json({ error: "Could not verify your answer. Please try again." }, 400);
    }

    // Answer matches — set the new password via the admin API.
    const { error: uErr } = await admin.auth.admin.updateUserById(profile.id, {
      password: String(newPassword),
    });
    if (uErr) throw uErr;

    return json({ ok: true });
  } catch (e) {
    return json({ error: (e as Error).message || "internal error" }, 500);
  }
});
