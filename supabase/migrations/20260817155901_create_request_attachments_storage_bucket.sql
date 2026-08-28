/*
# Create request-attachments storage bucket

## Purpose
Stores PDF and image files that students, staff, faculty, and employees
attach to Patient Service requests. Files are stored in Supabase Storage
and referenced by URL in the `requests.attachments` text[] column.

## Changes
1. Creates a new storage bucket named `request-attachments`.
   - public: true  (so attachment URLs are openable by anyone with the link)
   - file size limit: 10 MB
   - allowed mime types: PDF and common image formats
2. Storage policies (4 CRUD policies) scoped to `anon, authenticated`
   since this app uses the anon key on the frontend (no Supabase Auth sign-in).
   Anyone using the app can upload, read, update, and delete attachment files.

## Security notes
- The bucket is public-read so that clicked attachment links open in the
  browser without requiring a signed URL. Uploads/deletes are still gated
  by the bucket policies below.
- The app has no Supabase Auth sign-in screen, so policies must include
  the `anon` role — otherwise the anon-key frontend cannot write files.
*/

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'request-attachments',
  'request-attachments',
  true,
  10485760,
  array['application/pdf', 'image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif']
)
on conflict (id) do update
set name = excluded.name,
    public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

-- Allow anyone (anon + authenticated) to upload files
drop policy if exists "anon_upload_request_attachments" on storage.objects;
create policy "anon_upload_request_attachments"
on storage.objects for insert
to anon, authenticated
with check (bucket_id = 'request-attachments');

-- Allow anyone to read (download/open) files
drop policy if exists "anon_select_request_attachments" on storage.objects;
create policy "anon_select_request_attachments"
on storage.objects for select
to anon, authenticated
using (bucket_id = 'request-attachments');

-- Allow anyone to update files
drop policy if exists "anon_update_request_attachments" on storage.objects;
create policy "anon_update_request_attachments"
on storage.objects for update
to anon, authenticated
using (bucket_id = 'request-attachments')
with check (bucket_id = 'request-attachments');

-- Allow anyone to delete files
drop policy if exists "anon_delete_request_attachments" on storage.objects;
create policy "anon_delete_request_attachments"
on storage.objects for delete
to anon, authenticated
using (bucket_id = 'request-attachments');