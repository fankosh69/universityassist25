-- Fix city_stats view - recreate with explicit SECURITY INVOKER

DROP VIEW IF EXISTS city_stats;

CREATE VIEW city_stats 
WITH (security_invoker = true)
AS
SELECT 
    c.id,
    c.name,
    c.slug,
    r.name AS region,
    c.country_code,
    c.population_total,
    c.population_asof,
    c.city_type,
    count(u.id) AS uni_count
FROM cities c
LEFT JOIN regions r ON c.region_id = r.id
LEFT JOIN universities u ON u.city_id = c.id
GROUP BY c.id, c.name, c.slug, r.name, c.country_code, c.population_total, c.population_asof, c.city_type
ORDER BY c.name;

-- Grant appropriate access
REVOKE ALL ON city_stats FROM anon, public;
GRANT SELECT ON city_stats TO authenticated, anon;

-- Also explicitly set security_invoker on program_inquiries_summary
DROP VIEW IF EXISTS program_inquiries_summary;

CREATE VIEW program_inquiries_summary 
WITH (security_invoker = true)
AS
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

REVOKE ALL ON program_inquiries_summary FROM anon, public;
GRANT SELECT ON program_inquiries_summary TO authenticated;