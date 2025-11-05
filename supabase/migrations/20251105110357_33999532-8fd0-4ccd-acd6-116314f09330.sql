-- ============================================================
-- FIX: Make campus name nullable for single-campus universities
-- ============================================================

-- Allow NULL campus names (for single-campus universities)
ALTER TABLE university_campuses 
ALTER COLUMN name DROP NOT NULL;

-- Log the fix
INSERT INTO migration_audit (migration_phase, validation_type, status, details)
VALUES (
  'phase-2-schema-fix',
  'name_column_nullable',
  'pass',
  jsonb_build_object(
    'change', 'Made university_campuses.name nullable for single-campus support',
    'timestamp', NOW()
  )
);