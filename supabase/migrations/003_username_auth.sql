-- Phase 4: username-based auth (no email) + security-question recovery
-- Run in the Supabase dashboard SQL editor.
--
-- How it works: usernames are mapped to a synthetic internal email
-- (<username>@taskuser.app) so Supabase Auth (which is email-based) can store
-- the credential. The real username + a hashed security answer live here in
-- `profiles`. Password recovery is handled by the `reset-password` Edge
-- Function, which verifies the answer and resets the password with the
-- service role.
--
-- IMPORTANT: In Authentication -> Sign In / Providers -> Email, turn OFF
-- "Confirm email". Synthetic addresses can't receive a confirmation link, so
-- confirmation must be disabled for username signups to log in immediately.

create table if not exists public.profiles (
  id                    uuid primary key references auth.users (id) on delete cascade,
  username              text unique not null,
  security_question     text,
  security_answer_hash  text,
  created_at            timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles
  for insert with check (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- Public lookup: returns ONLY the security question for a username (never the
-- answer hash), so the logged-out "forgot password" screen can show it.
create or replace function public.get_security_question(p_username text)
returns text
language sql
security definer
set search_path = public
as $$
  select security_question
    from public.profiles
   where username = lower(trim(p_username));
$$;

grant execute on function public.get_security_question(text) to anon, authenticated;
