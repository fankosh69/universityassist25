-- ============================================================
-- PHASE 2: DATA MIGRATION (FINAL ATTEMPT)
-- ============================================================

INSERT INTO migration_audit (migration_phase, validation_type, status, details)
SELECT 'phase-2-start', 'pre-check', 'pass',
  jsonb_build_object(
    'universities', (SELECT COUNT(*) FROM universities WHERE city_id IS NOT NULL),
    'programs', (SELECT COUNT(*) FROM programs),
    'existing_campuses', (SELECT COUNT(*) FROM university_campuses WHERE is_main_campus = true)
  );

-- Migrate universities to campuses
INSERT INTO university_campuses (
  university_id, city_id, name, campus_slug, is_main_campus, city,
  lat, lng, phone, email, website_url, facilities, student_count,
  migrated_from_university_id, migration_notes, created_at
)
SELECT 
  u.id, u.city_id, NULL, 
  u.slug || '-' || COALESCE(c.slug, 'main'),
  true, c.name,
  COALESCE(u.lat, c.lat), COALESCE(u.lng, c.lng),
  u.contact_phone, u.contact_email, u.website,
  u.facilities, u.student_count, u.id,
  'Phase 2: ' || NOW()::TEXT, u.created_at
FROM universities u
INNER JOIN cities c ON u.city_id = c.id
WHERE NOT EXISTS (
  SELECT 1 FROM university_campuses uc 
  WHERE uc.university_id = u.id AND uc.is_main_campus = true
);

-- Link programs
INSERT INTO program_campuses (program_id, campus_id, auto_migrated, migration_date)
SELECT p.id, uc.id, true, NOW()
FROM programs p
INNER JOIN university_campuses uc ON p.university_id = uc.university_id AND uc.is_main_campus = true
WHERE NOT EXISTS (SELECT 1 FROM program_campuses pc WHERE pc.program_id = p.id);

-- Final validation
INSERT INTO migration_audit (migration_phase, validation_type, expected_count, actual_count, status, details)
SELECT 
  'phase-2-complete', 'validation',
  (SELECT COUNT(*) FROM universities WHERE city_id IS NOT NULL),
  (SELECT COUNT(*) FROM university_campuses WHERE is_main_campus = true),
  CASE 
    WHEN (SELECT COUNT(*) FROM universities WHERE city_id IS NOT NULL) = 
         (SELECT COUNT(*) FROM university_campuses WHERE is_main_campus = true)
    AND (SELECT COUNT(*) FROM programs) = 
        (SELECT COUNT(DISTINCT program_id) FROM program_campuses)
    THEN 'pass' ELSE 'fail' 
  END,
  jsonb_build_object(
    'campuses', (SELECT COUNT(*) FROM university_campuses WHERE is_main_campus = true),
    'programs_linked', (SELECT COUNT(DISTINCT program_id) FROM program_campuses),
    'total_programs', (SELECT COUNT(*) FROM programs)
  );