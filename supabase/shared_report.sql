-- JamKemon: public read for shareable report links (/r/<id>).
-- Paste into the Supabase SQL Editor and Run. Safe to run more than once.
--
-- Anonymous RLS only exposes approved + non-expired reports, but a link shared
-- an hour ago must still render a preview rather than 404. This SECURITY DEFINER
-- function returns a safe public subset for APPROVED reports regardless of
-- expiry, and nothing for pending/rejected (so the moderation queue never leaks).

create or replace function public.get_shared_report(report_id uuid)
returns table (
  id          uuid,
  created_at  timestamptz,
  observed_at timestamptz,
  expires_at  timestamptz,
  lat         double precision,
  lng         double precision,
  category    text,
  severity    text,
  description text,
  photo_url   text
)
language sql
security definer
set search_path = public
stable
as $$
  select r.id, r.created_at, r.observed_at, r.expires_at, r.lat, r.lng,
         r.category::text, r.severity::text, r.description, r.photo_url
  from public.reports r
  where r.id = report_id and r.status = 'approved'
$$;

grant execute on function public.get_shared_report(uuid) to anon, authenticated;
