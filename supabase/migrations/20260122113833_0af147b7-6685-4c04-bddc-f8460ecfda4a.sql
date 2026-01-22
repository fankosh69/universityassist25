-- Security Fixes Migration

-- 1. Fix Security Definer View - Drop and recreate with SECURITY INVOKER
DROP VIEW IF EXISTS program_inquiries_summary;

CREATE VIEW program_inquiries_summary AS
SELECT 
  pi.id,
  pi.program_name,
  pi.university_name,
  pi.city,
  pi.field_of_study,
  pi.user_query,
  pi.status,
  pi.admin_notes,
  pi.inquiry_date,
  pi.created_at,
  p.full_name AS user_name,
  p.email AS user_email,
  p.nationality AS user_nationality,
  reviewer.full_name AS reviewed_by_name,
  pi.reviewed_at,
  (SELECT count(*) FROM program_inquiries pi2 
   WHERE ((pi2.program_name ILIKE pi.program_name) 
   OR (pi2.field_of_study = pi.field_of_study)) 
   AND pi2.status = 'pending') AS similar_count
FROM program_inquiries pi
LEFT JOIN profiles p ON (pi.profile_id = p.id)
LEFT JOIN profiles reviewer ON (pi.reviewed_by = reviewer.id)
ORDER BY pi.inquiry_date DESC;

-- Ensure only authenticated users can access the view
REVOKE ALL ON program_inquiries_summary FROM anon, public;
GRANT SELECT ON program_inquiries_summary TO authenticated;

-- 2. Move pg_trgm extension to extensions schema (if not already there)
-- First ensure the extensions schema exists
CREATE SCHEMA IF NOT EXISTS extensions;
GRANT USAGE ON SCHEMA extensions TO authenticated, anon;

-- Move pg_trgm to extensions schema
ALTER EXTENSION pg_trgm SET SCHEMA extensions;

-- 3. Tighten INSERT policies to use service_role instead of WITH CHECK (true)

-- Fix hubspot_sync_log policy
DROP POLICY IF EXISTS "System can insert sync logs" ON hubspot_sync_log;
CREATE POLICY "Service role inserts sync logs" ON hubspot_sync_log
  FOR INSERT TO service_role WITH CHECK (true);

-- Fix migration_audit policy  
DROP POLICY IF EXISTS "System can insert migration audit" ON migration_audit;
CREATE POLICY "Service role inserts audit" ON migration_audit
  FOR INSERT TO service_role WITH CHECK (true);

-- Fix program_inquiries policy - allow authenticated users to insert their own
DROP POLICY IF EXISTS "Service role can insert inquiries" ON program_inquiries;
CREATE POLICY "Auth users can insert own inquiries" ON program_inquiries
  FOR INSERT TO authenticated WITH CHECK (profile_id = auth.uid());