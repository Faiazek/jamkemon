-- JamKemon database setup.
-- Paste this whole file into the Supabase SQL Editor and click "Run".
-- Safe to run more than once.

-- 1) The reports table -------------------------------------------------------
create table if not exists public.reports (
  id            uuid primary key default gen_random_uuid(),
  created_at    timestamptz not null default now(),
  expires_at    timestamptz not null,
  lat           double precision not null,
  lng           double precision not null,
  category      text not null check (category in
                  ('jam','accident','waterlogging','roadblock','protest','construction','other')),
  severity      text not null default 'medium' check (severity in ('low','medium','high')),
  description   text check (char_length(description) <= 280),
  photo_url     text,
  area          text,
  status        text not null default 'pending' check (status in ('pending','approved','rejected')),
  reporter_token text,
  confirm_count int not null default 0,
  admin_notes   text
);

create index if not exists reports_status_expiry_idx
  on public.reports (status, expires_at);

-- 2) Force every new report to be "pending" and set its expiry by category ---
--    (so a tampered client can never push a pre-approved or never-expiring row)
create or replace function public.set_report_defaults()
returns trigger as $$
begin
  new.status := 'pending';
  new.confirm_count := 0;
  new.expires_at := coalesce(new.created_at, now()) + case new.category
    when 'jam'          then interval '90 minutes'
    when 'accident'     then interval '2 hours'
    when 'waterlogging' then interval '4 hours'
    when 'roadblock'    then interval '3 hours'
    when 'protest'      then interval '3 hours'
    when 'construction' then interval '24 hours'
    else interval '2 hours'
  end;
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_set_report_defaults on public.reports;
create trigger trg_set_report_defaults
  before insert on public.reports
  for each row execute function public.set_report_defaults();

-- 3) Row Level Security ------------------------------------------------------
alter table public.reports enable row level security;

-- Anyone may submit a report (it becomes "pending" via the trigger above).
drop policy if exists "anon can submit reports" on public.reports;
create policy "anon can submit reports"
  on public.reports for insert
  to anon, authenticated
  with check (true);

-- The public may only READ approved reports that haven't expired.
drop policy if exists "public reads live approved reports" on public.reports;
create policy "public reads live approved reports"
  on public.reports for select
  to anon, authenticated
  using (status = 'approved' and expires_at > now());
