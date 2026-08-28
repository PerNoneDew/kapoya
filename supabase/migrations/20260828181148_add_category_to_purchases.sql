/*
# Add category column to purchases table

1. Modified Tables
- `purchases`
  - Added `category` column (text, NOT NULL, default 'medicines') to track the expense category of each purchase.
  - This allows purchase records to automatically create expense entries in the liquidation system with the correct category (medicines, equipment, supplies, services, or other).

2. Security
- No RLS policy changes. Existing policies remain in effect.

3. Important Notes
- The default value 'medicines' ensures backward compatibility with existing purchase rows.
- The category value is used when auto-creating an expense record in the expenses table when a purchase is marked as 'received'.
*/

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'purchases' AND column_name = 'category'
  ) THEN
    ALTER TABLE purchases ADD COLUMN category text NOT NULL DEFAULT 'medicines';
  END IF;
END $$;
