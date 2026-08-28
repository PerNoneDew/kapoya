/*
# Add detailed profile fields to users table

1. Modified Tables
- `users` — adds personal, academic, employment, contact, and emergency fields
  to support richer student and employee profiles.

2. New Columns (all nullable, additive — no data loss)
- last_name, first_name, middle_name, suffix — name components
- sex, date_of_birth — personal demographics
- grade_year_level, section, program_course, school_year — student academic info
- contact_number, address — contact info
- parent_guardian, parent_guardian_contact — student emergency contacts
- position, employment_type, emergency_contact, date_hired — employee work info

3. Security
- No policy changes. Existing anon/authenticated CRUD policies on `users` remain in effect.

4. Notes
- All new columns are nullable text so existing rows are unaffected.
- Idempotent: uses DO $$ ... IF NOT EXISTS ... END $$ for each column.
*/

DO $$ BEGIN
  ALTER TABLE users ADD COLUMN last_name text; EXCEPTION WHEN duplicate_column THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE users ADD COLUMN first_name text; EXCEPTION WHEN duplicate_column THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE users ADD COLUMN middle_name text; EXCEPTION WHEN duplicate_column THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE users ADD COLUMN suffix text; EXCEPTION WHEN duplicate_column THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE users ADD COLUMN sex text; EXCEPTION WHEN duplicate_column THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE users ADD COLUMN date_of_birth text; EXCEPTION WHEN duplicate_column THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE users ADD COLUMN grade_year_level text; EXCEPTION WHEN duplicate_column THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE users ADD COLUMN section text; EXCEPTION WHEN duplicate_column THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE users ADD COLUMN program_course text; EXCEPTION WHEN duplicate_column THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE users ADD COLUMN school_year text; EXCEPTION WHEN duplicate_column THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE users ADD COLUMN contact_number text; EXCEPTION WHEN duplicate_column THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE users ADD COLUMN address text; EXCEPTION WHEN duplicate_column THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE users ADD COLUMN parent_guardian text; EXCEPTION WHEN duplicate_column THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE users ADD COLUMN parent_guardian_contact text; EXCEPTION WHEN duplicate_column THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE users ADD COLUMN position text; EXCEPTION WHEN duplicate_column THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE users ADD COLUMN employment_type text; EXCEPTION WHEN duplicate_column THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE users ADD COLUMN emergency_contact text; EXCEPTION WHEN duplicate_column THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE users ADD COLUMN date_hired text; EXCEPTION WHEN duplicate_column THEN NULL;
END $$;
