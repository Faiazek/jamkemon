-- JamKemon: in-app feedback / bug reports.
-- Paste into the Supabase SQL Editor and Run. Safe to run more than once.
-- View submissions in Table Editor → feedback (newest first).

create table if not exists public.feedback (
  id             uuid primary key default gen_random_uuid(),
  created_at     timestamptz not null default now(),
  message        text not null check (char_length(message) between 1 and 2000),
  contact        text check (char_length(contact) <= 200),
  reporter_token text,
  user_agent     text
);

alter table public.feedback enable row level security;

-- Anyone may send feedback.
drop policy if exists "anon can send feedback" on public.feedback;
create policy "anon can send feedback"
  on public.feedback for insert
  to anon, authenticated
  with check (true);

-- Only admins may read it.
drop policy if exists "admins read feedback" on public.feedback;
create policy "admins read feedback"
  on public.feedback for select
  to authenticated
  using (exists (select 1 from public.admins a where a.user_id = auth.uid()));
