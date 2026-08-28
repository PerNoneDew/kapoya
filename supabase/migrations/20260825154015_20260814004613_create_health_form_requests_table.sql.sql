CREATE TABLE IF NOT EXISTS health_form_requests (
  id text PRIMARY KEY,
  user_id text NOT NULL,
  user_name text NOT NULL,
  user_role text,
  department text,
  form_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'pending',
  submitted_at text NOT NULL,
  updated_at text NOT NULL,
  reviewed_by text,
  review_notes text
);

ALTER TABLE health_form_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_health_form_requests" ON health_form_requests;
CREATE POLICY "anon_select_health_form_requests" ON health_form_requests FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_health_form_requests" ON health_form_requests;
CREATE POLICY "anon_insert_health_form_requests" ON health_form_requests FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_health_form_requests" ON health_form_requests;
CREATE POLICY "anon_update_health_form_requests" ON health_form_requests FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_health_form_requests" ON health_form_requests;
CREATE POLICY "anon_delete_health_form_requests" ON health_form_requests FOR DELETE TO anon, authenticated USING (true);