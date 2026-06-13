-- JamKemon: QA security hardening (2026-06-13).
-- Paste into the Supabase SQL Editor and Run. Safe to run more than once.
--
-- IMPORTANT: step 1 switches the public (anon) role from table-level SELECT to
-- column-level SELECT on `reports`. The app's public read MUST name columns
-- explicitly (see PUBLIC_REPORT_COLUMNS in lib/reports.ts) — an anon `select("*")`
-- will be denied. Deploy that client change before/with running this.

-- 1) Hide reporter_token + admin_notes from the public ------------------------
--    reporter_token is a stable per-device identifier; admin_notes is internal.
--    Neither should ever reach the browser. anon gets column-level SELECT on the
--    safe columns only. (authenticated/admins keep full access; RLS gates rows.)
revoke select on public.reports from anon;
grant select (
  id, created_at, expires_at, observed_at, lat, lng, category, severity,
  description, photo_url, area, status, confirm_count, still_count, cleared_count
) on public.reports to anon;

-- 2) Stop anon from listing every file in the photo bucket --------------------
--    The bucket is public, so object URLs still resolve via the CDN without this
--    SELECT policy; dropping it only removes the ability to enumerate files.
drop policy if exists "public read report photos" on storage.objects;

-- 3) Constrain the photo bucket (no arbitrary-file hosting) -------------------
update storage.buckets
set file_size_limit = 5242880,  -- 5 MB
    allowed_mime_types = array['image/jpeg','image/png','image/webp']
where id = 'report-photos';

-- 4) Pin search_path on our functions (Supabase linter WARN) ------------------
--    All internal references in these functions are already schema-qualified.
alter function public.set_report_defaults() set search_path = '';
alter function public.apply_feedback()      set search_path = '';
alter function public.notify_new_report()   set search_path = '';

-- 5) Trigger functions are not meant to be called as RPCs ---------------------
--    They still fire as triggers after EXECUTE is revoked.
revoke execute on function public.set_report_defaults() from anon, authenticated;
revoke execute on function public.apply_feedback()      from anon, authenticated;
revoke execute on function public.notify_new_report()   from anon, authenticated;
