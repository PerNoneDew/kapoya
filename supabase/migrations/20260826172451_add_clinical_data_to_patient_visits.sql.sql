-- Add clinical_data JSONB column to patient_visits for service-specific clinical fields
-- (dental tooth chart, physical exam system assessment, medicine issuance frequency/duration, first aid incident details)
ALTER TABLE patient_visits
  ADD COLUMN IF NOT EXISTS clinical_data jsonb DEFAULT '{}'::jsonb;
