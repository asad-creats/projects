# Quorum backend — setup

Quorum runs on its **own dedicated Supabase project** (separate from the portfolio's
main/Tally project). Do these once.

## 1. Create the project
- supabase.com → New project. Note the **Project URL** and **anon key**
  (Settings → API) and the **service_role key** (keep this secret).

## 2. Create the schema
- SQL Editor → run each migration **in order**, pasting the whole file each time:
  1. `migrations/001_quorum_schema.sql` — tables, RLS, realtime, genesis block.
  2. `migrations/002_daily_reset_and_busy.sql` — per-day boards + busy tracking.
  3. `migrations/003_multi_tenant.sql` — companies; every row and policy scoped
     per company. Existing data is moved into a company named "My company".
- All three are safe to re-run.

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

## 6. Register a company
- Open `/quorum` → on the login card click **"New company? Register it here"**.
- This creates the company, its genesis ledger block and its first account
  (always HR). Any number of companies can register; each sees only its own data.
- After that, that company's HR adds people from the **People** tab.
- Usernames are global across companies, so a taken username is rejected.

## Data model (quick reference)
- `companies` — one row per tenant. Every table below has a `company_id`.
- `employees` — profile per auth user (`is_hr` flag, capacity, colour).
- `tasks` — the consensus catalog (sealed, assignable tasks).
- `assignments` — a task on someone's plate. `origin`: `assigned` | `self` | `custom`.
- `proposals` + `proposal_votes` — the consensus queue (`new` | `retime`).
- `ledger_blocks` — append-only sealed chain.
- `busy_status` — self-reported busy flag + note.

RLS: everything is limited to the caller's company. Within it, employees see only
their own assignments; HR sees all of the company's; the roster, catalog,
proposals and ledger are readable by everyone in the company.
