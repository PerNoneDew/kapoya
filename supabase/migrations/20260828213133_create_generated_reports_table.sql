/*
# Create generated_reports table

1. New Tables
- `generated_reports`
  - `id` (text, primary key) — client-generated unique id
  - `title` (text, not null) — report title
  - `type` (text, not null) — one of: medical, dental, physical, inventory, administrative
  - `period` (text) — optional date range label e.g. "2026-08-01 to 2026-08-28"
  - `summary` (text) — short human-readable summary of the report contents
  - `details` (jsonb) — structured payload with the report's metrics/rows
  - `generated_by` (text, not null) — name of the staff member who created it
  - `generated_at` (text, not null) — ISO timestamp
2. Security
- Enable RLS on `generated_reports`.
- Allow anon + authenticated CRUD because the app uses a custom auth model (no Supabase auth sessions); the anon-key client needs full access.
*/

CREATE TABLE IF NOT EXISTS generated_reports (
  id text PRIMARY KEY,
  title text NOT NULL,
  type text NOT NULL,
  period text,
  summary text,
  details jsonb,
  generated_by text NOT NULL,
  generated_at text NOT NULL
);

ALTER TABLE generated_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_generated_reports" ON generated_reports;
CREATE POLICY "anon_select_generated_reports" ON generated_reports
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_generated_reports" ON generated_reports;
CREATE POLICY "anon_insert_generated_reports" ON generated_reports
  FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_generated_reports" ON generated_reports;
CREATE POLICY "anon_update_generated_reports" ON generated_reports
  FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_generated_reports" ON generated_reports;
CREATE POLICY "anon_delete_generated_reports" ON generated_reports
  FOR DELETE TO anon, authenticated USING (true);
