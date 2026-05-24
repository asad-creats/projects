-- Phase 2: per-user daily AI usage tracking for the free tier
-- Run in the Supabase dashboard SQL editor (or `supabase db push`).

create table if not exists public.ai_usage (
  user_id       uuid not null references auth.users (id) on delete cascade,
  usage_date    date not null default current_date,
  message_count int  not null default 0,
  primary key (user_id, usage_date)
);

alter table public.ai_usage enable row level security;

drop policy if exists "ai_usage_select_own" on public.ai_usage;
create policy "ai_usage_select_own" on public.ai_usage
  for select using (auth.uid() = user_id);

-- Atomic upsert+increment for the current user/day. SECURITY DEFINER so it can
-- write the row, but it only ever touches auth.uid()'s own row.
create or replace function public.increment_ai_usage()
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  new_count int;
begin
  if uid is null then
    raise exception 'NOT_AUTHENTICATED';
  end if;

  insert into public.ai_usage (user_id, usage_date, message_count)
    values (uid, current_date, 1)
  on conflict (user_id, usage_date)
    do update set message_count = public.ai_usage.message_count + 1
  returning message_count into new_count;

  return new_count;
end;
$$;

grant execute on function public.increment_ai_usage() to authenticated;
