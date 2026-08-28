/*
# Create school_settings table

1. New Tables
- `school_settings` — single-row configuration table for institution branding
  - `id` (text, primary key, always 'singleton')
  - `school_name` (text, default 'HEALTH SYS SFCG')
  - `school_logo_path` (text, nullable — public/ path to logo image)
  - `school_address` (text, nullable)
  - `contact_email` (text, nullable)
  - `contact_phone` (text, nullable)
  - `updated_at` (text)
  - `updated_by` (text, nullable)
2. Security
- Enable RLS on `school_settings`.
- TO anon, authenticated CRUD (single-tenant shared config; the app uses the anon key).
3. Notes
- The app reads/writes via the anon key, so policies must include the `anon` role.
- Only one row ever exists (id = 'singleton'); upsert keeps it idempotent.
*/

CREATE TABLE IF NOT EXISTS school_settings (
  id text PRIMARY KEY DEFAULT 'singleton',
  school_name text NOT NULL DEFAULT 'HEALTH SYS SFCG',
  school_logo_path text,
  school_address text,
  contact_email text,
  contact_phone text,
  updated_at text NOT NULL DEFAULT '',
  updated_by text
);

ALTER TABLE school_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_school_settings" ON school_settings;
CREATE POLICY "anon_select_school_settings"
  ON school_settings FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_school_settings" ON school_settings;
CREATE POLICY "anon_insert_school_settings"
  ON school_settings FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_school_settings" ON school_settings;
CREATE POLICY "anon_update_school_settings"
  ON school_settings FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_school_settings" ON school_settings;
CREATE POLICY "anon_delete_school_settings"
  ON school_settings FOR DELETE
  TO anon, authenticated USING (true);

-- Seed default row so reads always return data
INSERT INTO school_settings (id, school_name, updated_at)
VALUES ('singleton', 'HEALTH SYS SFCG', '')
ON CONFLICT (id) DO NOTHING;