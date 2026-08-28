/*
# Create Inventory & Purchases Module Tables

1. New Tables
- `medical_supplies` — Non-medicine clinic consumables (bandages, gloves, antiseptics, etc.)
  - id (text, PK), name, category, quantity, unit, min_stock, expiry_date, supplier, last_updated, primary_key_date
- `stock_transactions` — Audit trail of all stock movements (in, out, adjustments, returns, damage, expiry, disposal, issuance)
  - id (text, PK), item_id, item_name, item_type, transaction_type, quantity, unit, reason, recorded_by, recorded_at, notes
- `suppliers` — Vendor directory for procurement
  - id (text, PK), name, contact_person, email, phone, address, category, status, created_at
- `purchases` — Purchase order records linked to suppliers
  - id (text, PK), supplier_id, supplier_name, item_description, quantity, unit, unit_cost, total_cost, purchase_date, recorded_by, status, receipt_url, notes, created_at

2. Security
- Enable RLS on all four tables.
- Policies: anon + authenticated full CRUD (single-tenant app with custom auth in the users table; the anon-key client manages all data).

3. Notes
- All tables use text PKs (matching the existing medicines/expenses pattern).
- stock_transactions.item_type is 'medicine' | 'supply'.
- purchases.status is 'pending' | 'received' | 'cancelled'.
- suppliers.status is 'active' | 'inactive'.
*/

-- Medical Supplies
CREATE TABLE IF NOT EXISTS medical_supplies (
  id text PRIMARY KEY,
  name text NOT NULL,
  category text NOT NULL DEFAULT 'General',
  quantity integer NOT NULL DEFAULT 0,
  unit text NOT NULL DEFAULT 'pieces',
  min_stock integer NOT NULL DEFAULT 0,
  expiry_date text,
  supplier text,
  last_updated text NOT NULL,
  primary_key_date text
);

ALTER TABLE medical_supplies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_medical_supplies" ON medical_supplies;
CREATE POLICY "anon_select_medical_supplies" ON medical_supplies FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_medical_supplies" ON medical_supplies;
CREATE POLICY "anon_insert_medical_supplies" ON medical_supplies FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_medical_supplies" ON medical_supplies;
CREATE POLICY "anon_update_medical_supplies" ON medical_supplies FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_medical_supplies" ON medical_supplies;
CREATE POLICY "anon_delete_medical_supplies" ON medical_supplies FOR DELETE
  TO anon, authenticated USING (true);

-- Stock Transactions
CREATE TABLE IF NOT EXISTS stock_transactions (
  id text PRIMARY KEY,
  item_id text NOT NULL,
  item_name text NOT NULL,
  item_type text NOT NULL DEFAULT 'medicine',
  transaction_type text NOT NULL,
  quantity integer NOT NULL DEFAULT 0,
  unit text NOT NULL DEFAULT '',
  reason text NOT NULL DEFAULT '',
  recorded_by text NOT NULL DEFAULT '',
  recorded_at text NOT NULL,
  notes text
);

ALTER TABLE stock_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_stock_transactions" ON stock_transactions;
CREATE POLICY "anon_select_stock_transactions" ON stock_transactions FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_stock_transactions" ON stock_transactions;
CREATE POLICY "anon_insert_stock_transactions" ON stock_transactions FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_stock_transactions" ON stock_transactions;
CREATE POLICY "anon_update_stock_transactions" ON stock_transactions FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_stock_transactions" ON stock_transactions;
CREATE POLICY "anon_delete_stock_transactions" ON stock_transactions FOR DELETE
  TO anon, authenticated USING (true);

-- Suppliers
CREATE TABLE IF NOT EXISTS suppliers (
  id text PRIMARY KEY,
  name text NOT NULL,
  contact_person text,
  email text,
  phone text,
  address text,
  category text NOT NULL DEFAULT 'General',
  status text NOT NULL DEFAULT 'active',
  created_at text NOT NULL
);

ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_suppliers" ON suppliers;
CREATE POLICY "anon_select_suppliers" ON suppliers FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_suppliers" ON suppliers;
CREATE POLICY "anon_insert_suppliers" ON suppliers FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_suppliers" ON suppliers;
CREATE POLICY "anon_update_suppliers" ON suppliers FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_suppliers" ON suppliers;
CREATE POLICY "anon_delete_suppliers" ON suppliers FOR DELETE
  TO anon, authenticated USING (true);

-- Purchases
CREATE TABLE IF NOT EXISTS purchases (
  id text PRIMARY KEY,
  supplier_id text,
  supplier_name text NOT NULL DEFAULT '',
  item_description text NOT NULL,
  quantity integer NOT NULL DEFAULT 0,
  unit text NOT NULL DEFAULT '',
  unit_cost numeric NOT NULL DEFAULT 0,
  total_cost numeric NOT NULL DEFAULT 0,
  purchase_date text NOT NULL,
  recorded_by text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'pending',
  receipt_url text,
  notes text,
  created_at text NOT NULL
);

ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_purchases" ON purchases;
CREATE POLICY "anon_select_purchases" ON purchases FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_purchases" ON purchases;
CREATE POLICY "anon_insert_purchases" ON purchases FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_purchases" ON purchases;
CREATE POLICY "anon_update_purchases" ON purchases FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_purchases" ON purchases;
CREATE POLICY "anon_delete_purchases" ON purchases FOR DELETE
  TO anon, authenticated USING (true);
