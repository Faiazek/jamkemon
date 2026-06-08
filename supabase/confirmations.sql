-- JamKemon: community confirmations ("still happening" / "it's cleared").
-- Paste into the Supabase SQL Editor and Run. Safe to run more than once.
--
-- Anyone can vote that a report is still happening (which keeps it fresh on the
-- map) or that it's cleared (enough "cleared" votes take it off the map). This
-- is the positive "it's solved" signal that lets the map clean itself.

-- 1) Vote tally columns on reports ------------------------------------------
alter table public.reports add column if not exists still_count    int not null default 0;
alter table public.reports add column if not exists cleared_count  int not null default 0;

-- 2) One row per vote (one vote per device per report) -----------------------
create table if not exists public.report_feedback (
  id             uuid primary key default gen_random_uuid(),
  report_id      uuid not null references public.reports(id) on delete cascade,
  reporter_token text not null,
  vote           text not null check (vote in ('still','cleared')),
  created_at     timestamptz not null default now(),
  unique (report_id, reporter_token)
);

create index if not exists report_feedback_report_idx on public.report_feedback (report_id);

alter table public.report_feedback enable row level security;

-- Anyone may cast a vote. The unique constraint stops a device voting twice.
drop policy if exists "anon can vote" on public.report_feedback;
create policy "anon can vote"
  on public.report_feedback for insert
  to anon, authenticated
  with check (true);

-- 3) Keep the tallies in sync and act on them --------------------------------
create or replace function public.apply_feedback()
returns trigger
language plpgsql
security definer
as $$
declare
  v_still   int;
  v_cleared int;
begin
  select
    count(*) filter (where vote = 'still'),
    count(*) filter (where vote = 'cleared')
  into v_still, v_cleared
  from public.report_feedback
  where report_id = new.report_id;

  update public.reports
  set still_count   = v_still,
      cleared_count = v_cleared,
      expires_at = case
        -- Three "cleared" votes take it off the map immediately.
        when v_cleared >= 3 then least(expires_at, now())
        -- Otherwise a fresh "still happening" vote keeps an approved report alive ~45 min.
        when new.vote = 'still' and status = 'approved'
          then greatest(expires_at, now() + interval '45 minutes')
        else expires_at
      end
  where id = new.report_id;

  return new;
end;
$$;

drop trigger if exists trg_apply_feedback on public.report_feedback;
create trigger trg_apply_feedback
  after insert on public.report_feedback
  for each row execute function public.apply_feedback();
