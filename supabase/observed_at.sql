-- JamKemon: after-the-fact / offline reporting.
-- Paste this whole file into the Supabase SQL Editor and click "Run".
-- Safe to run more than once.
--
-- Adds "observed_at": when the reporter actually SAW the situation, which can be
-- earlier than when they submitted it (e.g. they had no internet at the time and
-- reported once back home). A report's expiry is then measured from observed_at,
-- so a jam someone saw an hour ago fades on schedule instead of looking fresh.

-- 1) New column -------------------------------------------------------------
alter table public.reports
  add column if not exists observed_at timestamptz;

-- 2) Expire from the observed time, with tamper-proof clamping ---------------
create or replace function public.set_report_defaults()
returns trigger as $$
declare
  seen timestamptz;
begin
  new.status := 'pending';
  new.confirm_count := 0;

  -- Trust the client's observed_at only within a sane window: never in the
  -- future, and no more than 12 hours in the past. This stops a tampered
  -- client from back/forward-dating a report to never expire, and keeps very
  -- old sightings from cluttering the map.
  seen := coalesce(new.observed_at, new.created_at, now());
  if seen > now() then
    seen := now();
  elsif seen < now() - interval '12 hours' then
    seen := now() - interval '12 hours';
  end if;
  new.observed_at := seen;

  new.expires_at := seen + case new.category
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

-- The existing trigger already calls this function, so redefining it is enough.
-- (Re-created here for safety in case the schema was never applied.)
drop trigger if exists trg_set_report_defaults on public.reports;
create trigger trg_set_report_defaults
  before insert on public.reports
  for each row execute function public.set_report_defaults();

-- 3) Backfill old rows so they sort/expire sensibly -------------------------
update public.reports
  set observed_at = created_at
  where observed_at is null;
