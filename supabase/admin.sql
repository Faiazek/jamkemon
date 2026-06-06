-- JamKemon admin setup.
-- Run this AFTER schema.sql. Paste into the Supabase SQL Editor and click "Run".
-- Safe to run more than once.

-- 1) Table listing which users are admins ------------------------------------
create table if not exists public.admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  added_at timestamptz not null default now()
);

alter table public.admins enable row level security;

-- A signed-in user may check whether THEY are an admin (and nothing more).
drop policy if exists "user can read own admin row" on public.admins;
create policy "user can read own admin row"
  on public.admins for select
  to authenticated
  using (auth.uid() = user_id);

-- 2) Give admins full access to reports --------------------------------------
-- (These ADD to the existing public read policy; they don't replace it.)

drop policy if exists "admins read all reports" on public.reports;
create policy "admins read all reports"
  on public.reports for select
  to authenticated
  using (exists (select 1 from public.admins a where a.user_id = auth.uid()));

drop policy if exists "admins update reports" on public.reports;
create policy "admins update reports"
  on public.reports for update
  to authenticated
  using (exists (select 1 from public.admins a where a.user_id = auth.uid()))
  with check (exists (select 1 from public.admins a where a.user_id = auth.uid()));

drop policy if exists "admins delete reports" on public.reports;
create policy "admins delete reports"
  on public.reports for delete
  to authenticated
  using (exists (select 1 from public.admins a where a.user_id = auth.uid()));

-- 3) Make YOURSELF an admin --------------------------------------------------
-- First create your login user in: Authentication → Users → "Add user"
-- (tick "Auto Confirm User"). Then replace the email below with yours and run:
--
--   insert into public.admins (user_id)
--   select id from auth.users where email = 'you@example.com'
--   on conflict (user_id) do nothing;
