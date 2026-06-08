-- JamKemon: photo storage for reports.
-- Paste into the Supabase SQL Editor and Run. Safe to run more than once.
--
-- Creates a public "report-photos" bucket that anyone can upload a photo to and
-- anyone can view (so photos show on the map). Photos are downscaled in the
-- browser before upload to keep them small.

-- 1) The bucket (public read) ------------------------------------------------
insert into storage.buckets (id, name, public)
values ('report-photos', 'report-photos', true)
on conflict (id) do update set public = true;

-- 2) Anyone may upload into this bucket --------------------------------------
drop policy if exists "anon upload report photos" on storage.objects;
create policy "anon upload report photos"
  on storage.objects for insert
  to anon, authenticated
  with check (bucket_id = 'report-photos');

-- 3) Anyone may view photos in this bucket -----------------------------------
drop policy if exists "public read report photos" on storage.objects;
create policy "public read report photos"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'report-photos');
