// Quorum — create-employee Edge Function
//
// Everything that needs the service_role key (which must never be exposed to
// the browser): creating logins with a password, and resetting passwords.
// The request body's `action` picks what to do:
//
//   • (none) Register a company — body has `company_name`. No caller auth.
//     Creates the company, its first account (always HR), the company's genesis
//     ledger block, and that HR's recovery code (returned once, as
//     `recovery_code`). Anyone can do this; each company is isolated by RLS.
//   • (none) Add a person — no `company_name`. The caller must be a signed-in HR
//     user, and the new person joins the caller's company.
//   • "reset_password" — HR sets a new password for someone in their company.
//   • "recover" — an HR admin who forgot their password proves it's them with
//     username + recovery code, and sets a new password. The code is used up and
//     a fresh one is returned.
//   • "new_recovery_code" — a signed-in HR user replaces their recovery code.
//
// Usernames are global (they map to <username>@quorum.app), so two companies
// can't both have "admin". Recovery codes are stored only as SHA-256 hashes
// (table recovery_codes, migration 004).
//
// Deploy:   supabase functions deploy create-employee --no-verify-jwt
// Secrets:  SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are injected automatically
//           by the platform for deployed functions.

import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

// Recovery codes: 20 Crockford base32 characters (100 random bits), shown as
// XXXX-XXXX-XXXX-XXXX-XXXX. Normalising maps look-alikes (O→0, I/L→1) and drops
// dashes and spaces, so a code typed back by hand still matches.
const CODE_ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
const newRecoveryCode = () => {
  const bytes = crypto.getRandomValues(new Uint8Array(20));
  const chars = Array.from(bytes, (b) => CODE_ALPHABET[b & 31]).join("");
  return chars.match(/.{4}/g)!.join("-");
};
const normaliseCode = (code: string) =>
  code.toUpperCase().replace(/O/g, "0").replace(/[IL]/g, "1").replace(/[^0-9A-Z]/g, "");
const sha256 = async (s: string) => {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, "0")).join("");
};
// Stores a fresh code for this employee (replacing any old one) and returns it.
const issueRecoveryCode = async (admin: SupabaseClient, employee_id: string) => {
  const code = newRecoveryCode();
  const { error } = await admin.from("recovery_codes")
    .upsert({ employee_id, code_hash: await sha256(normaliseCode(code)), created_at: new Date().toISOString() });
  if (error) throw new Error(error.message);
  return code;
};

const PASSWORD_MIN = 6;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const admin = createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { persistSession: false } });

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return json({ error: "Invalid JSON body" }, 400); }

  // The signed-in caller's employee row, from their JWT; null if not signed in.
  const callerOf = async () => {
    const token = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
    if (!token) return null;
    const { data: userData, error: userErr } = await admin.auth.getUser(token);
    if (userErr || !userData?.user) return null;
    const { data: caller } = await admin
      .from("employees").select("id, is_hr, company_id").eq("id", userData.user.id).single();
    return caller ?? null;
  };

  const action = String(body.action ?? "");
  const password = String(body.password ?? "");

  // ── HR resets someone's password ───────────────────────────────────────
  if (action === "reset_password") {
    const caller = await callerOf();
    if (!caller) return json({ error: "Your session has expired. Sign in again." }, 401);
    if (!caller.is_hr) return json({ error: "Only HR can reset passwords." }, 403);
    if (password.length < PASSWORD_MIN) return json({ error: `Password must be at least ${PASSWORD_MIN} characters.` }, 400);
    const { data: target } = await admin
      .from("employees").select("id, company_id").eq("id", String(body.employee_id ?? "")).single();
    if (!target || target.company_id !== caller.company_id) return json({ error: "That person isn't in your company." }, 404);
    const { error } = await admin.auth.admin.updateUserById(target.id, { password });
    if (error) return json({ error: error.message }, 500);
    return json({ ok: true });
  }

  // ── HR forgot their own password: username + recovery code ─────────────
  if (action === "recover") {
    const username = String(body.username ?? "").trim().toLowerCase();
    const code = normaliseCode(String(body.recovery_code ?? ""));
    if (password.length < PASSWORD_MIN) return json({ error: `Password must be at least ${PASSWORD_MIN} characters.` }, 400);
    // One message for every mismatch, so this can't be used to probe usernames.
    const mismatch = json({ error: "That username and recovery code don't match." }, 400);
    if (!username || code.length !== 20) return mismatch;
    const { data: emp } = await admin.from("employees").select("id, is_hr").eq("username", username).maybeSingle();
    if (!emp?.is_hr) return mismatch;
    const { data: saved } = await admin.from("recovery_codes").select("code_hash").eq("employee_id", emp.id).maybeSingle();
    if (!saved || saved.code_hash !== await sha256(code)) return mismatch;
    const { error } = await admin.auth.admin.updateUserById(emp.id, { password });
    if (error) return json({ error: error.message }, 500);
    try {
      return json({ ok: true, recovery_code: await issueRecoveryCode(admin, emp.id) });
    } catch (e) {
      return json({ error: (e as Error).message }, 500);
    }
  }

  // ── HR replaces their recovery code ────────────────────────────────────
  if (action === "new_recovery_code") {
    const caller = await callerOf();
    if (!caller) return json({ error: "Your session has expired. Sign in again." }, 401);
    if (!caller.is_hr) return json({ error: "Only HR accounts have recovery codes." }, 403);
    try {
      return json({ ok: true, recovery_code: await issueRecoveryCode(admin, caller.id) });
    } catch (e) {
      return json({ error: (e as Error).message }, 500);
    }
  }

  if (action) return json({ error: `Unknown action "${action}".` }, 400);

  // ── Create a login: register a company, or HR adds a person ────────────
  const username = String(body.username ?? "").trim().toLowerCase();
  const name = String(body.name ?? "").trim();
  const role = String(body.role ?? "").trim();
  const capacity_h = Number(body.capacity_h ?? 8);
  const color = String(body.color ?? "#3B45D6");
  const companyName = String(body.company_name ?? "").trim();
  const registering = companyName.length > 0;
  let is_hr = Boolean(body.is_hr ?? false);

  if (!username || !/^[a-z0-9_.-]{3,32}$/.test(username))
    return json({ error: "Username must be 3–32 chars: letters, numbers, . _ -" }, 400);
  if (password.length < PASSWORD_MIN) return json({ error: `Password must be at least ${PASSWORD_MIN} characters.` }, 400);
  if (!name) return json({ error: "Name is required." }, 400);
  if (registering && companyName.length > 80) return json({ error: "Company name is too long." }, 400);

  let company_id: string;
  if (registering) {
    is_hr = true; // a company's first account is always HR
    const { data: co, error: coErr } = await admin
      .from("companies").insert({ name: companyName }).select("id").single();
    if (coErr || !co) return json({ error: coErr?.message ?? "Could not create company." }, 500);
    company_id = co.id;
  } else {
    // HR only; they can only add to their own company.
    const caller = await callerOf();
    if (!caller) return json({ error: "Sign in as HR to add people, or register a new company." }, 401);
    if (!caller.is_hr) return json({ error: "Only HR can add employees." }, 403);
    company_id = caller.company_id;
  }

  // Undo a half-finished registration so a failure doesn't strand an empty
  // company. Deleting the company cascades to its employee row and ledger.
  const abandon = async () => {
    if (registering) await admin.from("companies").delete().eq("id", company_id);
  };

  // Create the auth user with a synthetic email so no real email is needed.
  const email = `${username}@quorum.app`;
  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { username, name },
  });
  if (createErr || !created?.user) {
    await abandon();
    const msg = createErr?.message ?? "Could not create user.";
    const dup = /already|exists|registered/i.test(msg);
    return json({ error: dup ? "That username is already taken." : msg }, dup ? 409 : 500);
  }

  // Insert the employee profile row (service role bypasses RLS, and has no
  // auth.uid(), so company_id must be passed explicitly).
  const { error: profErr } = await admin.from("employees").insert({
    id: created.user.id, company_id, username, name, role, capacity_h, color, is_hr,
  });
  if (profErr) {
    // roll back the auth user so a failed profile doesn't strand an account
    await admin.auth.admin.deleteUser(created.user.id);
    await abandon();
    return json({ error: profErr.message }, 500);
  }

  let recovery_code: string | undefined;
  if (registering) {
    const { error: genErr } = await admin.from("ledger_blocks").insert({
      company_id, idx: 0, kind: "genesis", title: "Genesis — ledger opened", hours: 0,
      note: "", voters: [], prev_hash: "0000000000000000", hash: "genesis00000000",
    });
    if (genErr) {
      await admin.auth.admin.deleteUser(created.user.id);
      await abandon();
      return json({ error: genErr.message }, 500);
    }
    // Non-fatal: the company works without a code, and HR can make one later
    // from the account menu.
    recovery_code = await issueRecoveryCode(admin, created.user.id).catch(() => undefined);
  }

  return json({ ok: true, id: created.user.id, username, is_hr, company_id, registered: registering, recovery_code });
});
