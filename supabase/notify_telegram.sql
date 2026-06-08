-- JamKemon: send a Telegram alert whenever a new report is submitted.
-- Paste into the Supabase SQL Editor and Run.
--
-- IMPORTANT: replace REPLACE_WITH_SECRET below with the value of the
-- NOTIFY_WEBHOOK_SECRET you set in Vercel (the two must match exactly), then run.
-- The secret is deliberately NOT committed to the repo.

-- pg_net lets the database make an outbound HTTP call (asynchronously, so it
-- never slows down or blocks a report submission).
create extension if not exists pg_net;

create or replace function public.notify_new_report()
returns trigger
language plpgsql
security definer
as $$
begin
  if new.status = 'pending' then
    perform net.http_post(
      url := 'https://jamkemon.com/api/report-created',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'x-notify-secret', 'REPLACE_WITH_SECRET'
      ),
      body := jsonb_build_object('type', 'INSERT', 'record', to_jsonb(new)),
      timeout_milliseconds := 5000
    );
  end if;
  return new;
end;
$$;

drop trigger if exists trg_notify_new_report on public.reports;
create trigger trg_notify_new_report
  after insert on public.reports
  for each row execute function public.notify_new_report();
