// Quorum — create-employee Edge Function
//
// Provisions a login (username + password) and its employee profile. Creating a
// user WITH a password requires the service_role key, which must never be
// exposed to the browser — hence this server function.
//
// Two modes:
//   • Register a company — body has `company_name`. No caller auth. Creates the
//     company, its first account (always HR) and the company's genesis ledger
//     block. Anyone can do this; each company is isolated by RLS (migration 003).
//   • Add a person — no `company_name`. The caller must be a signed-in HR user,
//     and the new person joins the caller's company.
//
// Usernames are global (they map to <username>@quorum.app), so two companies
// can't both have "admin".
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
  const companyName = String(body.company_name ?? "").trim();
  const registering = companyName.length > 0;
  let is_hr = Boolean(body.is_hr ?? false);

  if (!username || !/^[a-z0-9_.-]{3,32}$/.test(username))
    return json({ error: "Username must be 3–32 chars: letters, numbers, . _ -" }, 400);
  if (password.length < 6) return json({ error: "Password must be at least 6 characters." }, 400);
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
    // Verify the caller is an HR user from their JWT; they can only add to their own company.
    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.replace(/^Bearer\s+/i, "");
    if (!token) return json({ error: "Sign in as HR to add people, or register a new company." }, 401);
    const { data: userData, error: userErr } = await admin.auth.getUser(token);
    if (userErr || !userData?.user) return json({ error: "Your session has expired. Sign in again." }, 401);
    const { data: caller } = await admin
      .from("employees").select("is_hr, company_id").eq("id", userData.user.id).single();
    if (!caller?.is_hr) return json({ error: "Only HR can add employees." }, 403);
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
  }

  return json({ ok: true, id: created.user.id, username, is_hr, company_id, registered: registering });
});
