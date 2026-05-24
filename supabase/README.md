# Supabase setup for the AI Task Manager

One-time steps to enable auth, per-user tasks, the free AI tier, and quotas.

## 1. Create / open your Supabase project
Grab the **Project URL** and **anon key** from Settings → API.

Set them as frontend env vars (Vercel → Settings → Environment Variables, and
locally in `.env.local`):

```
REACT_APP_SUPABASE_URL=...
REACT_APP_SUPABASE_ANON_KEY=...
```

## 2. Enable auth providers
Authentication → Providers:
- **Email** — enable.
- **Google** — enable, then add a Google Cloud OAuth client ID + secret. Add
  Supabase's callback URL (shown on that screen) as an authorized redirect URI
  in Google Cloud, and add your site origin(s) to Authentication → URL config.

## 3. Run the SQL migrations
SQL editor → run, in order:
- `migrations/001_phase1_users_and_tasks.sql` (per-user tasks, RLS, 100-task limit)
- `migrations/002_phase2_ai_usage.sql` (daily usage table + increment RPC)

## 4. Deploy the free-tier AI proxy
Requires the [Supabase CLI](https://supabase.com/docs/guides/cli):

```
supabase login
supabase link --project-ref <your-project-ref>
supabase secrets set GEMINI_API_KEY=<your rotated Gemini key>
supabase functions deploy ai-chat
```

The shared Gemini key lives ONLY here as a secret — it is never shipped to the
browser. Users who bring their own key call their provider directly from their
browser (key stored in localStorage only).

## 5. Remove the old frontend key
Delete `REACT_APP_GEMINI_API_KEY` from Vercel — it's no longer used by the app.
