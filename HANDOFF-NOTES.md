# Project Handoff — Notes

_Hand-maintained narrative. Claude updates this at the end of a session; the live git state is appended below it automatically in `HANDOFF.md`._

## What this project is
`projects-platform` — a Create React App portfolio site deployed on Vercel
(`projects-zeta-pied.vercel.app`, repo `github.com/asad-creats/projects`, branch `master`).
The main active feature is the **AI Task Manager** (`src/todo-app-refactored/`):
a multi-user todo app with AI chat, being turned into a real product (auth, quotas,
bring-your-own-model).

## Where things stand

### Done in code (committed locally)
- Phases 1–3: Supabase auth + per-user tasks (RLS), secure free AI proxy with a
  4/day cap (Edge Function), and bring-your-own-key with model selection.
- OpenRouter provider + per-provider model dropdowns; friendlier Gemini errors.
- Guardrail so raw tool-call JSON is never dumped into chat.
- First-visit onboarding tour (`components/OnboardingTour.jsx`).
- Username/password auth with **no email** + security-question recovery
  (`003_username_auth.sql`, `functions/reset-password`, reworked `Login.jsx`).
- Session-handoff hook (this file + `.claude/update-handoff.sh`).

### ⚠️ Pending — needs the user (can't be done from code)
1. **Push to master is blocked** by auto-mode (direct-to-default-branch). Local
   commits ahead of origin need `git push origin master` by the user.
2. **Supabase setup** on project `zytyqhgwylnqlgwwdxan`:
   - Run migrations `001`, `002`, `003` in the SQL editor.
   - Auth → Sign In/Providers → **turn OFF "Confirm email"** (required for
     username login; also fixes the `otp_expired` error).
   - Auth → URL Configuration → Site URL = `https://projects-zeta-pied.vercel.app`,
     add redirect `https://projects-zeta-pied.vercel.app/**`.
   - Deploy Edge Functions `ai-chat` and `reset-password`; set secret
     `GEMINI_API_KEY` (from aistudio.google.com/apikey).
   - Vercel env: set `REACT_APP_SUPABASE_URL` + `REACT_APP_SUPABASE_ANON_KEY`;
     remove any old `REACT_APP_GEMINI_API_KEY`.
   - Rotate the previously-leaked Gemini key.
3. **Activate the handoff hook:** create `.claude/settings.local.json` with the
   SessionEnd hook, then open `/hooks` once (or restart) to load it.

### Open / not yet done
- **Design polish of the todo page** — the user finds it "too odd" but a rendered
  screenshot is still needed (preview is sandboxed to localhost and the auth gate
  blocks the task page locally). Next step: get a screenshot, then fix layout
  (panel height-matching, header buttons, spacing, responsive breakpoints).

## Next steps (suggested order)
1. User pushes the local commits and runs the Supabase setup so the live app works.
2. Get a screenshot of the "odd" page and do the design pass.
