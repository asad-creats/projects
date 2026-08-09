# Quorum backend — setup

Quorum runs on its **own dedicated Supabase project** (separate from the portfolio's
main/Tally project). Do these once.

## 1. Create the project
- supabase.com → New project. Note the **Project URL** and **anon key**
  (Settings → API) and the **service_role key** (keep this secret).

## 2. Create the schema
- SQL Editor → paste all of `migrations/001_quorum_schema.sql` → Run.
- This creates the tables, Row-Level Security, realtime, and the genesis ledger block.

## 3. Turn off email confirmation (required)
- Authentication → Sign In / Providers → **Email** → turn **OFF "Confirm email"**.
- Logins use synthetic `<username>@quorum.app` addresses that can't receive a
  confirmation link, so confirmation must be disabled.

## 4. Deploy the create-employee function
The only secure way to create a user *with a password* (service_role must stay server-side).

```bash
# from the repo root, with the Supabase CLI installed and logged in:
supabase link --project-ref <YOUR_QUORUM_PROJECT_REF>
supabase functions deploy create-employee --project-ref <YOUR_QUORUM_PROJECT_REF> --no-verify-jwt
```
`SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are injected automatically for
deployed functions — you don't set them manually.

> Prefer the dashboard? Edge Functions → Create a function named `create-employee`,
> paste `functions/create-employee/index.ts`, deploy.

## 5. Wire the frontend env vars
Local (`.env.local`) **and** Vercel (Project → Settings → Environment Variables):

```
REACT_APP_QUORUM_SUPABASE_URL=https://<ref>.supabase.co
REACT_APP_QUORUM_SUPABASE_ANON_KEY=<anon key>
```
Redeploy after setting them on Vercel.

## 6. Create your first HR account
- Open `/quorum` → on the login card click **"First run? Set up the first HR account"**.
- Because the employees table is empty, the function allows this one bootstrap call
  and forces it to HR. After that, only signed-in HR users can add people
  (People tab).

## Data model (quick reference)
- `employees` — profile per auth user (`is_hr` flag, capacity, colour).
- `tasks` — the consensus catalog (sealed, assignable tasks).
- `assignments` — a task on someone's plate. `origin`: `assigned` | `self` | `custom`.
- `proposals` + `proposal_votes` — the consensus queue (`new` | `retime`).
- `ledger_blocks` — append-only sealed chain.
- `busy_status` — self-reported busy flag + note.

RLS: employees see only their own assignments/busy; HR sees everything; the roster,
catalog, proposals and ledger are readable by all signed-in users.
