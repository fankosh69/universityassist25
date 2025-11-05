-- ============================================================
-- PHASE 1: COMPLETE CAMPUS MODEL SCHEMA
-- Adding missing tables and constraints
-- ============================================================

-- Create migration audit table
CREATE TABLE IF NOT EXISTS migration_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  migration_phase TEXT NOT NULL,
  validation_type TEXT NOT NULL,
  expected_count INTEGER,
  actual_count INTEGER,
  status TEXT,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE migration_audit ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view migration audit"
ON migration_audit FOR SELECT
USING (has_role('admin'::app_role));

CREATE POLICY "System can insert migration audit"
ON migration_audit FOR INSERT
WITH CHECK (true);

-- Create program_campuses junction table
CREATE TABLE program_campuses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id UUID NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
  campus_id UUID NOT NULL REFERENCES university_campuses(id) ON DELETE CASCADE,
  auto_migrated BOOLEAN DEFAULT false,
  migration_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_program_campus UNIQUE(program_id, campus_id)
);

CREATE INDEX idx_program_campus_program ON program_campuses(program_id);
CREATE INDEX idx_program_campus_campus ON program_campuses(campus_id);

ALTER TABLE program_campuses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view program campuses"
ON program_campuses FOR SELECT
USING (true);

CREATE POLICY "Admins can manage program campuses"
ON program_campuses FOR ALL
USING (has_role('admin'::app_role))
WITH CHECK (has_role('admin'::app_role));

-- Create triggers
CREATE OR REPLACE FUNCTION update_campus_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER update_campus_timestamp
BEFORE UPDATE ON university_campuses
FOR EACH ROW
EXECUTE FUNCTION update_campus_updated_at();

CREATE OR REPLACE FUNCTION sync_university_city_from_main_campus()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_main_campus = true THEN
    UPDATE universities 
    SET city_id = NEW.city_id 
    WHERE id = NEW.university_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER sync_city_id_on_campus_change
AFTER INSERT OR UPDATE ON university_campuses
FOR EACH ROW
WHEN (NEW.is_main_campus = true)
EXECUTE FUNCTION sync_university_city_from_main_campus();

-- Log completion
INSERT INTO migration_audit (migration_phase, validation_type, status, details)
VALUES (
  'phase-1-schema-creation',
  'schema_completed',
  'pass',
  jsonb_build_object(
    'tables', ARRAY['university_campuses', 'program_campuses', 'migration_audit'],
    'timestamp', NOW()
  )
);