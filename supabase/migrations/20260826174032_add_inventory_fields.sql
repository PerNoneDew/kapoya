/*
# Add missing fields to inventory tables

1. Changes
- `medicines`: add generic_name, brand_name, dosage_form, batch_lot_number, storage_location (all nullable text)
- `medical_supplies`: add storage_location (nullable text)
- `suppliers`: add products_supplied (nullable text)
2. Security
- No RLS policy changes — existing policies already allow full CRUD for anon + authenticated.
3. Notes
- All new columns are nullable so existing rows are unaffected.
- Uses DO $$ blocks to be idempotent (safe to re-run).
*/

DO $$ BEGIN
  ALTER TABLE medicines ADD COLUMN IF NOT EXISTS generic_name text;
  ALTER TABLE medicines ADD COLUMN IF NOT EXISTS brand_name text;
  ALTER TABLE medicines ADD COLUMN IF NOT EXISTS dosage_form text;
  ALTER TABLE medicines ADD COLUMN IF NOT EXISTS batch_lot_number text;
  ALTER TABLE medicines ADD COLUMN IF NOT EXISTS storage_location text;
END $$;

DO $$ BEGIN
  ALTER TABLE medical_supplies ADD COLUMN IF NOT EXISTS storage_location text;
END $$;

DO $$ BEGIN
  ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS products_supplied text;
END $$;
