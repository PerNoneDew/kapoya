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