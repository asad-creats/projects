-- ═══════════════════════════════════════════════════════════════════════════
-- Quorum 004 — HR recovery codes
--
-- Logins use synthetic <username>@quorum.app addresses, so a normal "email me a
-- reset link" can't work. Employees who forget their password ask HR, who resets
-- it from the People tab. An HR admin who forgets their own uses a one-time
-- recovery code, shown once when the company registers (or generated later from
-- the account menu).
--
-- Only a SHA-256 hash of each code is stored. RLS is on with NO policies, so the
-- browser can never read this table; only the create-employee Edge Function
-- (service_role) touches it.
--
-- Run AFTER 003_multi_tenant.sql. Idempotent: safe to re-run.
-- ═══════════════════════════════════════════════════════════════════════════

create table if not exists public.recovery_codes (
  employee_id uuid primary key references public.employees(id) on delete cascade,
  code_hash   text not null,
  created_at  timestamptz not null default now()
);
alter table public.recovery_codes enable row level security;
-- Deliberately no policies: anon and authenticated roles get no access at all.
