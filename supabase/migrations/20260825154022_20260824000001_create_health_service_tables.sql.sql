CREATE TABLE IF NOT EXISTS patient_visits (
  id text PRIMARY KEY,
  patient_id text NOT NULL,
  patient_name text NOT NULL,
  patient_role text,
  department text,
  service_type text NOT NULL DEFAULT 'medical',
  visit_date text NOT NULL,
  chief_complaint text NOT NULL DEFAULT '',
  symptoms text NOT NULL DEFAULT '',
  temperature text,
  blood_pressure text,
  heart_rate text,
  respiratory_rate text,
  weight text,
  height text,
  oxygen_sat text,
  assessment text NOT NULL DEFAULT '',
  diagnosis text NOT NULL DEFAULT '',
  treatment_provided text NOT NULL DEFAULT '',
  first_aid_treatment text NOT NULL DEFAULT '',
  medicine_name text NOT NULL DEFAULT '',
  medicine_id text,
  dosage text NOT NULL DEFAULT '',
  quantity integer NOT NULL DEFAULT 0,
  unit text NOT NULL DEFAULT '',
  instructions text NOT NULL DEFAULT '',
  remarks text NOT NULL DEFAULT '',
  recorded_by text NOT NULL,
  status text NOT NULL DEFAULT 'completed',
  created_at text NOT NULL,
  updated_at text NOT NULL
);

ALTER TABLE patient_visits ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_patient_visits" ON patient_visits;
CREATE POLICY "anon_select_patient_visits" ON patient_visits FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_patient_visits" ON patient_visits;
CREATE POLICY "anon_insert_patient_visits" ON patient_visits FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_patient_visits" ON patient_visits;
CREATE POLICY "anon_update_patient_visits" ON patient_visits FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_patient_visits" ON patient_visits;
CREATE POLICY "anon_delete_patient_visits" ON patient_visits FOR DELETE TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS referrals (
  id text PRIMARY KEY,
  patient_id text NOT NULL,
  patient_name text NOT NULL,
  patient_role text,
  department text,
  referred_to text NOT NULL DEFAULT '',
  referral_reason text NOT NULL DEFAULT '',
  referral_date text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  result text NOT NULL DEFAULT '',
  result_date text,
  referred_by text NOT NULL,
  created_at text NOT NULL,
  updated_at text NOT NULL
);

ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_referrals" ON referrals;
CREATE POLICY "anon_select_referrals" ON referrals FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_referrals" ON referrals;
CREATE POLICY "anon_insert_referrals" ON referrals FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_referrals" ON referrals;
CREATE POLICY "anon_update_referrals" ON referrals FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_referrals" ON referrals;
CREATE POLICY "anon_delete_referrals" ON referrals FOR DELETE TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS follow_ups (
  id text PRIMARY KEY,
  patient_id text NOT NULL,
  patient_name text NOT NULL,
  patient_role text,
  department text,
  reason text NOT NULL DEFAULT '',
  scheduled_date text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  result text NOT NULL DEFAULT '',
  result_date text,
  created_by text NOT NULL,
  created_at text NOT NULL,
  updated_at text NOT NULL
);

ALTER TABLE follow_ups ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_follow_ups" ON follow_ups;
CREATE POLICY "anon_select_follow_ups" ON follow_ups FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_follow_ups" ON follow_ups;
CREATE POLICY "anon_insert_follow_ups" ON follow_ups FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_follow_ups" ON follow_ups;
CREATE POLICY "anon_update_follow_ups" ON follow_ups FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_follow_ups" ON follow_ups;
CREATE POLICY "anon_delete_follow_ups" ON follow_ups FOR DELETE TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS appointments (
  id text PRIMARY KEY,
  patient_id text NOT NULL,
  patient_name text NOT NULL,
  patient_role text,
  department text,
  service_type text NOT NULL DEFAULT 'medical',
  appointment_date text NOT NULL,
  appointment_time text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'scheduled',
  reason text NOT NULL DEFAULT '',
  notes text NOT NULL DEFAULT '',
  scheduled_by text NOT NULL,
  created_at text NOT NULL,
  updated_at text NOT NULL
);

ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_appointments" ON appointments;
CREATE POLICY "anon_select_appointments" ON appointments FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_appointments" ON appointments;
CREATE POLICY "anon_insert_appointments" ON appointments FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_appointments" ON appointments;
CREATE POLICY "anon_update_appointments" ON appointments FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_appointments" ON appointments;
CREATE POLICY "anon_delete_appointments" ON appointments FOR DELETE TO anon, authenticated USING (true);