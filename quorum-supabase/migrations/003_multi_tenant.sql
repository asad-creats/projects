-- ═══════════════════════════════════════════════════════════════════════════
-- Quorum 003 — multi-tenant companies
--
-- Before: one Supabase project = one company. Every signed-in user could read
-- the whole roster, catalog, proposals and ledger, and only the very first
-- account could ever self-register.
--
-- After: every row belongs to a company. RLS scopes all reads and writes to the
-- caller's own company, and any new company can register (via the
-- create-employee Edge Function) to get its own first HR account.
--
-- Run AFTER 002_daily_reset_and_busy.sql. Idempotent: safe to re-run.
--
-- Client inserts don't need to send company_id: the column defaults to the
-- caller's company (current_company_id()). The Edge Function runs as
-- service_role, has no auth.uid(), and so must always pass company_id itself.
-- ═══════════════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────────────────
-- 1. Companies
-- ─────────────────────────────────────────────────────────────────────────
create table if not exists public.companies (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  created_at timestamptz not null default now()
);
alter table public.companies enable row level security;

-- Everything that existed before this migration belongs to one company.
-- Rename it from the dashboard (Table Editor → companies) if you like.
insert into public.companies (id, name)
select '00000000-0000-0000-0000-000000000001', 'My company'
where not exists (select 1 from public.companies);

-- ─────────────────────────────────────────────────────────────────────────
-- 2. company_id on every table, backfilled to the original company
-- ─────────────────────────────────────────────────────────────────────────
do $$
declare
  t text;
  legacy uuid := (select id from public.companies order by created_at limit 1);
begin
  foreach t in array array['employees','tasks','assignments','proposals','proposal_votes','ledger_blocks','busy_status']
  loop
    execute format('alter table public.%I add column if not exists company_id uuid references public.companies (id) on delete cascade', t);
    execute format('update public.%I set company_id = %L where company_id is null', t, legacy);
    execute format('alter table public.%I alter column company_id set not null', t);
    execute format('create index if not exists %I on public.%I (company_id)', t || '_company_idx', t);
  end loop;
end $$;

-- The caller's company. security definer so it can read the caller's row
-- regardless of RLS (and so policies that call it don't recurse).
create or replace function public.current_company_id()
returns uuid
language sql security definer stable set search_path = public as $$
  select company_id from public.employees where id = auth.uid();
$$;
grant execute on function public.current_company_id() to authenticated;

-- Default every client insert to the caller's company.
do $$
declare t text;
begin
  foreach t in array array['employees','tasks','assignments','proposals','proposal_votes','ledger_blocks','busy_status']
  loop
    execute format('alter table public.%I alter column company_id set default public.current_company_id()', t);
  end loop;
end $$;

-- Ledger block numbers restart at 0 per company, so idx alone can't be the key.
alter table public.ledger_blocks drop constraint if exists ledger_blocks_pkey;
alter table public.ledger_blocks add primary key (company_id, idx);

-- ─────────────────────────────────────────────────────────────────────────
-- 3. Row-Level Security, scoped per company
--
-- Subqueries inside a policy run under the caller's own RLS, so
-- `exists (select 1 from employees where id = x)` is true only when x is in the
-- caller's company. That's what stops a row being pointed at another
-- company's employee, task or proposal.
-- ─────────────────────────────────────────────────────────────────────────

-- companies: you can see only your own.
drop policy if exists companies_read on public.companies;
create policy companies_read on public.companies for select to authenticated
  using (id = public.current_company_id());
drop policy if exists companies_hr_update on public.companies;
create policy companies_hr_update on public.companies for update to authenticated
  using (id = public.current_company_id() and public.is_hr())
  with check (id = public.current_company_id());

-- employees: read your company's roster; HR manages it (but can't move anyone
-- to another company).
drop policy if exists employees_read on public.employees;
create policy employees_read on public.employees for select to authenticated
  using (company_id = public.current_company_id());
drop policy if exists employees_hr_write on public.employees;
create policy employees_hr_write on public.employees for all to authenticated
  using (company_id = public.current_company_id() and public.is_hr())
  with check (company_id = public.current_company_id() and public.is_hr());

-- tasks: the catalog is collaborative within a company.
drop policy if exists tasks_read on public.tasks;
create policy tasks_read on public.tasks for select to authenticated
  using (company_id = public.current_company_id());
drop policy if exists tasks_write on public.tasks;
create policy tasks_write on public.tasks for all to authenticated
  using (company_id = public.current_company_id())
  with check (company_id = public.current_company_id());

-- assignments: your own, or everyone's in your company if you're HR.
drop policy if exists assignments_rw on public.assignments;
create policy assignments_rw on public.assignments for all to authenticated
  using (company_id = public.current_company_id()
         and (employee_id = auth.uid() or public.is_hr()))
  with check (company_id = public.current_company_id()
              and (employee_id = auth.uid() or public.is_hr())
              and exists (select 1 from public.employees e where e.id = employee_id)
              and (task_id is null or exists (select 1 from public.tasks t where t.id = task_id)));

-- proposals: open within the company.
drop policy if exists proposals_read on public.proposals;
create policy proposals_read on public.proposals for select to authenticated
  using (company_id = public.current_company_id());
drop policy if exists proposals_write on public.proposals;
create policy proposals_write on public.proposals for all to authenticated
  using (company_id = public.current_company_id())
  with check (company_id = public.current_company_id()
              and (task_id is null or exists (select 1 from public.tasks t where t.id = task_id)));

-- votes: read your company's tallies; cast/withdraw only your own.
drop policy if exists votes_read on public.proposal_votes;
create policy votes_read on public.proposal_votes for select to authenticated
  using (company_id = public.current_company_id());
drop policy if exists votes_own on public.proposal_votes;
create policy votes_own on public.proposal_votes for all to authenticated
  using (employee_id = auth.uid() and company_id = public.current_company_id())
  with check (employee_id = auth.uid() and company_id = public.current_company_id()
              and exists (select 1 from public.proposals p where p.id = proposal_id));

-- ledger: read and append within your company.
drop policy if exists ledger_read on public.ledger_blocks;
create policy ledger_read on public.ledger_blocks for select to authenticated
  using (company_id = public.current_company_id());
drop policy if exists ledger_append on public.ledger_blocks;
create policy ledger_append on public.ledger_blocks for insert to authenticated
  with check (company_id = public.current_company_id());

-- busy: read your company's; set only your own.
drop policy if exists busy_read on public.busy_status;
create policy busy_read on public.busy_status for select to authenticated
  using (company_id = public.current_company_id());
drop policy if exists busy_own on public.busy_status;
create policy busy_own on public.busy_status for all to authenticated
  using (employee_id = auth.uid() and company_id = public.current_company_id())
  with check (employee_id = auth.uid() and company_id = public.current_company_id());

-- ─────────────────────────────────────────────────────────────────────────
-- 4. Day rollover — now only touches the caller's company
--
-- Same body as 002, plus the company filter: a security definer function must
-- not let one tenant rewrite another tenant's rows.
-- ─────────────────────────────────────────────────────────────────────────
create or replace function public.close_stale_assignments(p_today date)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_company uuid := public.current_company_id();
  v_closed  integer;
begin
  if v_company is null then
    return 0;
  end if;

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
     where a.company_id = v_company
       and a.work_date < p_today
       and a.state in ('todo', 'active', 'paused')
    returning a.employee_id
  )
  select count(*) into v_closed from rolled;

  update public.busy_status b
     set on_status = false, note = '', updated_at = now()
   where b.company_id = v_company
     and b.on_status
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

-- busy_daily (from 002) is security_invoker, so it already inherits the
-- company-scoped assignments policy above. Re-create it to expose company_id
-- (dropped first: create-or-replace can't insert a column ahead of existing ones).
drop view if exists public.busy_daily;
create view public.busy_daily
  with (security_invoker = on) as
  select company_id,
         employee_id,
         work_date,
         count(*)                                      as sessions,
         round(sum(coalesce(actual_h, 0))::numeric, 2) as hours
    from public.assignments
   where is_busy
     and state in ('done', 'late', 'incomplete')
   group by company_id, employee_id, work_date;

grant select on public.busy_daily to authenticated;

do $$
begin
  alter publication supabase_realtime add table public.companies;
exception when others then
  null;
end $$;
