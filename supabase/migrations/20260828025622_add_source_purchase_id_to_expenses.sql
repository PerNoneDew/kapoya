/*
# Add source_purchase_id to expenses table

1. Changes
- Adds `source_purchase_id` column to `expenses` table.
- This column links an expense record to the purchase that automatically created it.
- Nullable: manually-created expenses will not have a source purchase.
2. Notes
- No security changes needed; the column is just a text reference, no FK constraint.
- Existing expense rows will have NULL for this column, which is correct.
*/

ALTER TABLE expenses ADD COLUMN IF NOT EXISTS source_purchase_id text;