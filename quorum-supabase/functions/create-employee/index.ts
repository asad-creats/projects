// Quorum — create-employee Edge Function
//
// HR-only endpoint that provisions a login (username + password) and its
// employee profile. Creating a user WITH a password requires the service_role
// key, which must never be exposed to the browser — hence this server function.
//
// Auth rules:
//   • If there are zero employees yet, the FIRST call is allowed with no caller
//     auth and is forced to is_hr = true (bootstraps your first HR account).
//   • Otherwise the caller must be a signed-in HR user.
//
// Deploy:   supabase functions deploy create-employee --no-verify-jwt
// Secrets:  SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are injected automatically
//           by the platform for deployed functions.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const admin = createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { persistSession: false } });

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return json({ error: "Invalid JSON body" }, 400); }

  const username = String(body.username ?? "").trim().toLowerCase();
  const password = String(body.password ?? "");
  const name = String(body.name ?? "").trim();
  const role = String(body.role ?? "").trim();
  const capacity_h = Number(body.capacity_h ?? 8);
  const color = String(body.color ?? "#3B45D6");
  let is_hr = Boolean(body.is_hr ?? false);

  if (!username || !/^[a-z0-9_.-]{3,32}$/.test(username))
    return json({ error: "Username must be 3–32 chars: letters, numbers, . _ -" }, 400);
  if (password.length < 6) return json({ error: "Password must be at least 6 characters." }, 400);
  if (!name) return json({ error: "Name is required." }, 400);

  // Is this the bootstrap (no employees yet)?
  const { count, error: countErr } = await admin
    .from("employees").select("*", { count: "exact", head: true });
  if (countErr) return json({ error: countErr.message }, 500);
  const bootstrap = (count ?? 0) === 0;

  if (bootstrap) {
    is_hr = true; // first account is always HR
  } else {
    // Verify the caller is an HR user from their JWT.
    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.replace(/^Bearer\s+/i, "");
    if (!token) return json({ error: "Not authorized." }, 401);
    const { data: userData, error: userErr } = await admin.auth.getUser(token);
    if (userErr || !userData?.user) return json({ error: "Not authorized." }, 401);
    const { data: caller } = await admin
      .from("employees").select("is_hr").eq("id", userData.user.id).single();
    if (!caller?.is_hr) return json({ error: "Only HR can add employees." }, 403);
  }

  // Create the auth user with a synthetic email so no real email is needed.
  const email = `${username}@quorum.app`;
  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { username, name },
  });
  if (createErr || !created?.user) {
    const msg = createErr?.message ?? "Could not create user.";
    const dup = /already|exists|registered/i.test(msg);
    return json({ error: dup ? "That username is already taken." : msg }, dup ? 409 : 500);
  }

  // Insert the employee profile row (service role bypasses RLS).
  const { error: profErr } = await admin.from("employees").insert({
    id: created.user.id, username, name, role, capacity_h, color, is_hr,
  });
  if (profErr) {
    // roll back the auth user so a failed profile doesn't strand an account
    await admin.auth.admin.deleteUser(created.user.id);
    return json({ error: profErr.message }, 500);
  }

  return json({ ok: true, id: created.user.id, username, is_hr, bootstrap });
});
