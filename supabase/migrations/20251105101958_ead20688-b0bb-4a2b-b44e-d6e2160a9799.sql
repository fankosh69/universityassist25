-- ============================================================
-- FIX UNIVERSITY_CAMPUSES SCHEMA
-- Add missing columns to align with Phase 2 requirements
-- ============================================================

-- Add city_id column (foreign key to cities table)
ALTER TABLE university_campuses 
ADD COLUMN IF NOT EXISTS city_id UUID REFERENCES cities(id) ON DELETE RESTRICT;

-- Add campus_slug column
ALTER TABLE university_campuses 
ADD COLUMN IF NOT EXISTS campus_slug TEXT;

-- Add contact columns
ALTER TABLE university_campuses 
ADD COLUMN IF NOT EXISTS phone TEXT;

ALTER TABLE university_campuses 
ADD COLUMN IF NOT EXISTS email TEXT;

ALTER TABLE university_campuses 
ADD COLUMN IF NOT EXISTS website_url TEXT;

-- Add migration tracking columns
ALTER TABLE university_campuses 
ADD COLUMN IF NOT EXISTS migrated_from_university_id UUID;

ALTER TABLE university_campuses 
ADD COLUMN IF NOT EXISTS migration_notes TEXT;

-- Populate city_id from existing city text field where possible
UPDATE university_campuses uc
SET city_id = c.id
FROM cities c
WHERE LOWER(TRIM(uc.city)) = LOWER(TRIM(c.name))
AND uc.city_id IS NULL;

-- Create index on city_id
CREATE INDEX IF NOT EXISTS idx_campus_city ON university_campuses(city_id);

-- Create index on campus_slug
CREATE INDEX IF NOT EXISTS idx_campus_slug ON university_campuses(campus_slug);

-- Create unique index for campus identification
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_campus_per_university_city 
ON university_campuses(university_id, city_id, COALESCE(name, ''))
WHERE city_id IS NOT NULL;

-- Log schema update
INSERT INTO migration_audit (migration_phase, validation_type, status, details)
VALUES (
  'phase-2-schema-fix',
  'columns_added',
  'pass',
  jsonb_build_object(
    'columns_added', ARRAY['city_id', 'campus_slug', 'phone', 'email', 'website_url', 'migrated_from_university_id', 'migration_notes'],
    'city_id_populated', (SELECT COUNT(*) FROM university_campuses WHERE city_id IS NOT NULL),
    'total_campuses', (SELECT COUNT(*) FROM university_campuses),
    'timestamp', NOW()
  )
);