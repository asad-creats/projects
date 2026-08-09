-- Quorum — schema + Row-Level Security (run in the NEW dedicated Supabase
-- project's SQL editor, or via `supabase db push`).
--
-- Auth model (same trick Tally uses): HR creates accounts with a username +
-- password. Usernames map to a synthetic internal email <username>@quorum.app
-- so Supabase Auth (which is email-based) can store the credential. No real
-- emails are used.
--
-- IMPORTANT dashboard step: Authentication -> Sign In / Providers -> Email,
-- turn OFF "Confirm email". Synthetic addresses can't receive a confirmation
-- link, so confirmation must be disabled for these logins to work immediately.

-- ─────────────────────────────────────────────────────────────────────────
-- 1. Employees (profile row linked 1:1 to an auth user)
-- ─────────────────────────────────────────────────────────────────────────
create table if not exists public.employees (
  id          uuid primary key references auth.users (id) on delete cascade,
  username    text unique not null,
  name        text not null,
  role        text not null default '',
  capacity_h  numeric not null default 8,
  color       text not null default '#3B45D6',
  is_hr       boolean not null default false,
  created_at  timestamptz not null default now()
);

-- Is the current caller an HR user? (security definer so it can read the row
-- regardless of the caller's own RLS.)
create or replace function public.is_hr()
returns boolean
language sql security definer stable set search_path = public as $$
  select coalesce((select is_hr from public.employees where id = auth.uid()), false);
$$;
grant execute on function public.is_hr() to authenticated;

-- ─────────────────────────────────────────────────────────────────────────
-- 2. Tasks — the consensus catalog (sealed, assignable tasks)
-- ─────────────────────────────────────────────────────────────────────────
create table if not exists public.tasks (
  id         uuid primary key default gen_random_uuid(),
  title      text not null,
  hours      numeric not null,
  created_at timestamptz not null default now()
);

-- ─────────────────────────────────────────────────────────────────────────
-- 3. Assignments — a task on someone's plate today
--    origin: 'assigned' (sealed catalog task) | 'self' (employee-logged) | 'custom' (HR-pushed)
--    state:  'todo' | 'active' | 'paused' | 'done' | 'late'
-- ─────────────────────────────────────────────────────────────────────────
create table if not exists public.assignments (
  id          uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees (id) on delete cascade,
  task_id     uuid references public.tasks (id) on delete set null, -- null for self/custom
  origin      text not null default 'assigned',
  title       text,   -- used when origin != 'assigned'
  hours       numeric,-- used when origin != 'assigned'
  state       text not null default 'todo',
  started_at  timestamptz,
  elapsed_ms  bigint not null default 0,
  actual_h    numeric,
  reason      text not null default '',
  created_at  timestamptz not null default now()
);
create index if not exists assignments_employee_idx on public.assignments (employee_id);

-- ─────────────────────────────────────────────────────────────────────────
-- 4. Proposals + votes — the consensus queue
--    type: 'new' (HR proposes a task) | 'retime' (employee proposes a time change)
-- ─────────────────────────────────────────────────────────────────────────
create table if not exists public.proposals (
  id         uuid primary key default gen_random_uuid(),
  type       text not null,
  title      text not null,
  hours      numeric not null,
  old_hours  numeric,
  task_id    uuid references public.tasks (id) on delete cascade,
  proposer   text not null,
  created_at timestamptz not null default now()
);
create table if not exists public.proposal_votes (
  proposal_id uuid not null references public.proposals (id) on delete cascade,
  employee_id uuid not null references public.employees (id) on delete cascade,
  primary key (proposal_id, employee_id)
);

-- ─────────────────────────────────────────────────────────────────────────
-- 5. Ledger — append-only sealed blocks
-- ─────────────────────────────────────────────────────────────────────────
create table if not exists public.ledger_blocks (
  idx       integer primary key,
  kind      text,
  title     text not null,
  hours     numeric,
  note      text not null default '',
  voters    jsonb not null default '[]'::jsonb,
  prev_hash text,
  hash      text,
  sealed_at timestamptz not null default now()
);

-- ─────────────────────────────────────────────────────────────────────────
-- 6. Busy status — self-reported, one row per employee
-- ─────────────────────────────────────────────────────────────────────────
create table if not exists public.busy_status (
  employee_id uuid primary key references public.employees (id) on delete cascade,
  on_status   boolean not null default false,
  note        text not null default '',
  updated_at  timestamptz not null default now()
);

-- ═════════════════════════════════════════════════════════════════════════
-- Row-Level Security
-- ═════════════════════════════════════════════════════════════════════════
alter table public.employees      enable row level security;
alter table public.tasks          enable row level security;
alter table public.assignments    enable row level security;
alter table public.proposals      enable row level security;
alter table public.proposal_votes enable row level security;
alter table public.ledger_blocks  enable row level security;
alter table public.busy_status    enable row level security;

-- employees: everyone signed in can read the roster (names/colors for cards &
-- voter avatars). Only HR may change it. (Account creation happens in the
-- Edge Function with the service role, which bypasses RLS.)
drop policy if exists employees_read on public.employees;
create policy employees_read on public.employees for select to authenticated using (true);
drop policy if exists employees_hr_write on public.employees;
create policy employees_hr_write on public.employees for all to authenticated
  using (public.is_hr()) with check (public.is_hr());

-- tasks: everyone reads the catalog; sealing (insert) and retime (update) are
-- collaborative and governed by the app after consensus.
drop policy if exists tasks_read on public.tasks;
create policy tasks_read on public.tasks for select to authenticated using (true);
drop policy if exists tasks_write on public.tasks;
create policy tasks_write on public.tasks for all to authenticated using (true) with check (true);

-- assignments: an employee sees & edits only their own; HR sees & edits all.
drop policy if exists assignments_rw on public.assignments;
create policy assignments_rw on public.assignments for all to authenticated
  using (employee_id = auth.uid() or public.is_hr())
  with check (employee_id = auth.uid() or public.is_hr());

-- proposals: everyone reads; anyone signed in can open one (app enforces that
-- new tasks come from HR, retimes from employees); delete on seal.
drop policy if exists proposals_read on public.proposals;
create policy proposals_read on public.proposals for select to authenticated using (true);
drop policy if exists proposals_write on public.proposals;
create policy proposals_write on public.proposals for all to authenticated using (true) with check (true);

-- votes: everyone reads tallies; you may only cast/withdraw your own vote.
drop policy if exists votes_read on public.proposal_votes;
create policy votes_read on public.proposal_votes for select to authenticated using (true);
drop policy if exists votes_own on public.proposal_votes;
create policy votes_own on public.proposal_votes for all to authenticated
  using (employee_id = auth.uid()) with check (employee_id = auth.uid());

-- ledger: everyone reads; append allowed to any signed-in user (on seal).
drop policy if exists ledger_read on public.ledger_blocks;
create policy ledger_read on public.ledger_blocks for select to authenticated using (true);
drop policy if exists ledger_append on public.ledger_blocks;
create policy ledger_append on public.ledger_blocks for insert to authenticated with check (true);

-- busy: everyone reads (HR needs to see it); you set only your own.
drop policy if exists busy_read on public.busy_status;
create policy busy_read on public.busy_status for select to authenticated using (true);
drop policy if exists busy_own on public.busy_status;
create policy busy_own on public.busy_status for all to authenticated
  using (employee_id = auth.uid()) with check (employee_id = auth.uid());

-- ═════════════════════════════════════════════════════════════════════════
-- Realtime — let clients live-sync changes
-- ═════════════════════════════════════════════════════════════════════════
do $$
begin
  perform 1;
  alter publication supabase_realtime add table public.employees;
  alter publication supabase_realtime add table public.tasks;
  alter publication supabase_realtime add table public.assignments;
  alter publication supabase_realtime add table public.proposals;
  alter publication supabase_realtime add table public.proposal_votes;
  alter publication supabase_realtime add table public.ledger_blocks;
  alter publication supabase_realtime add table public.busy_status;
exception when others then
  -- tables may already be in the publication on re-run; ignore
  null;
end $$;

-- ═════════════════════════════════════════════════════════════════════════
-- Genesis ledger block (only if the ledger is empty)
-- ═════════════════════════════════════════════════════════════════════════
insert into public.ledger_blocks (idx, kind, title, hours, note, voters, prev_hash, hash)
select 0, 'genesis', 'Genesis — ledger opened', 0, '', '[]'::jsonb, '0000000000000000', 'genesis00000000'
where not exists (select 1 from public.ledger_blocks);
