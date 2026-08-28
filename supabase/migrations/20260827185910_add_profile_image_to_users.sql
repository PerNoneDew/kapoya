/*
# Add profile image to users

1. Schema changes
   - Adds `profile_image` (text, nullable) column to the `users` table.
     Stores the public URL of the user's uploaded profile picture in
     Supabase Storage. When null, the app falls back to a first-letter
     initial avatar.

2. Storage
   - Creates a `profile_images` storage bucket (public read) so that
     uploaded profile pictures can be served back to the app.
   - Policies:
     - SELECT (read): public (anon, authenticated) — profile pictures
       are visible to all logged-in users of the app.
     - INSERT/UPDATE: anon, authenticated may upsert into the bucket.
       The app uses the anon key for all access, so anon must be allowed.
     - DELETE: anon, authenticated may remove objects (e.g. when
       replacing a profile picture).

3. Security
   - No RLS policy changes on the `users` table itself; the existing
     policies remain unchanged. The new column is readable/writable
     under the same anon-accessible policies already in place.
*/

ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_image text;

INSERT INTO storage.buckets (id, name, public)
VALUES ('profile_images', 'profile_images', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "profile_images_read" ON storage.objects;
CREATE POLICY "profile_images_read"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'profile_images');

DROP POLICY IF EXISTS "profile_images_upsert" ON storage.objects;
CREATE POLICY "profile_images_upsert"
ON storage.objects FOR INSERT
TO anon, authenticated
WITH CHECK (bucket_id = 'profile_images');

DROP POLICY IF EXISTS "profile_images_update" ON storage.objects;
CREATE POLICY "profile_images_update"
ON storage.objects FOR UPDATE
TO anon, authenticated
USING (bucket_id = 'profile_images')
WITH CHECK (bucket_id = 'profile_images');

DROP POLICY IF EXISTS "profile_images_delete" ON storage.objects;
CREATE POLICY "profile_images_delete"
ON storage.objects FOR DELETE
TO anon, authenticated
USING (bucket_id = 'profile_images');