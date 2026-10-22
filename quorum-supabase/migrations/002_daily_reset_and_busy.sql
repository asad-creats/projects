-- ═══════════════════════════════════════════════════════════════════════════
-- Quorum 002 — daily reset + busy time tracking
--
-- Problem this fixes: assignments had no notion of a day. scheduledLoad() summed
-- every assignment ever created, so the 8h daily capacity never reset and every
-- employee drifted permanently into "Overloaded".
--
-- Model:
--   • work_date  — the local calendar day an assignment belongs to. Supplied by
--     the client (local midnight is the boundary), NOT derived server-side, so a
--     11pm task lands on the day the person actually experienced.
--   • state 'incomplete' — what unfinished work becomes at rollover. The board
--     starts clean each day and HR keeps a record of what didn't get done.
--   • is_busy — a self-logged busy period. It is an ordinary self-origin
--     assignment so its hours land in the same ledger as real work.
--
-- Idempotent: safe to re-run.
-- ═══════════════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────────────────
-- 1. Day + busy columns
-- ─────────────────────────────────────────────────────────────────────────
alter table public.assignments
  add column if not exists work_date date not null default current_date,
  add column if not exists is_busy   boolean not null default false;

-- Existing rows predate work_date and all defaulted to today; place them on the
-- day they were created so history isn't silently collapsed onto the deploy date.
update public.assignments
   set work_date = (created_at at time zone 'utc')::date
 where created_at is not null
   and work_date = current_date
   and (created_at at time zone 'utc')::date <> current_date;

-- The board always queries one employee's single day.
create index if not exists assignments_emp_day_idx
  on public.assignments (employee_id, work_date);

-- Busy history lookups for HR span a date range across everyone.
create index if not exists assignments_busy_day_idx
  on public.assignments (work_date) where is_busy;

-- ─────────────────────────────────────────────────────────────────────────
-- 2. Roll the day over
--
-- Stamps anything still open from a previous day as 'incomplete', banking the
-- time actually spent (including a still-running segment) into actual_h.
--
-- security definer: whoever opens the app first rolls over the whole team's
-- stale rows, not just their own — otherwise an employee who doesn't log in for
-- a week would keep skewing HR's numbers. Callers cannot pass a date that
-- affects anything but strictly-past rows.
-- ─────────────────────────────────────────────────────────────────────────
create or replace function public.close_stale_assignments(p_today date)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_closed integer;
begin
  with rolled as (
    update public.assignments a
       set state      = 'incomplete',
           elapsed_ms = a.elapsed_ms + case
                          when a.state = 'active' and a.started_at is not null
                          then greatest(0, (extract(epoch from (now() - a.started_at)) * 1000)::bigint)
                          else 0
                        end,
           started_at = null,
           actual_h   = coalesce(
                          a.actual_h,
                          round((a.elapsed_ms + case
                            when a.state = 'active' and a.started_at is not null
                            then greatest(0, (extract(epoch from (now() - a.started_at)) * 1000)::bigint)
                            else 0
                          end) / 3600000.0, 2)
                        )
     where a.work_date < p_today
       and a.state in ('todo', 'active', 'paused')
    returning a.employee_id, a.is_busy
  )
  select count(*) into v_closed from rolled;

  -- A busy flag left on overnight is stale once its assignment is closed.
  update public.busy_status b
     set on_status = false, note = '', updated_at = now()
   where b.on_status
     and not exists (
       select 1 from public.assignments a
        where a.employee_id = b.employee_id
          and a.is_busy
          and a.state in ('active', 'paused')
     );

  return v_closed;
end;
$$;

revoke all on function public.close_stale_assignments(date) from public;
grant execute on function public.close_stale_assignments(date) to authenticated;

-- ─────────────────────────────────────────────────────────────────────────
-- 3. Busy time per employee per day — HR's read of the busy log
-- ─────────────────────────────────────────────────────────────────────────
-- security_invoker: without it the view would run as its owner and bypass RLS on
-- assignments, exposing everyone's busy log to every signed-in user. With it,
-- the existing assignments policy still applies — HR sees all, employees see
-- only their own.
create or replace view public.busy_daily
  with (security_invoker = on) as
  select employee_id,
         work_date,
         count(*)                                  as sessions,
         round(sum(coalesce(actual_h, 0))::numeric, 2) as hours
    from public.assignments
   where is_busy
     and state in ('done', 'late', 'incomplete')
   group by employee_id, work_date;

grant select on public.busy_daily to authenticated;
