-- Fix Security Definer View Issue - Complete Cleanup
-- Drop and recreate city_stats view without any security definer properties

-- Drop the existing view completely
DROP VIEW IF EXISTS public.city_stats CASCADE;

-- Recreate the view as a standard view with explicit security invoker
CREATE VIEW public.city_stats 
WITH (security_invoker=on) AS
SELECT 
  c.id,
  c.name,
  c.slug,
  r.name as region,
  c.country_code,
  c.population_total,
  c.population_asof,
  c.city_type,
  COUNT(u.id) as uni_count
FROM cities c
LEFT JOIN regions r ON c.region_id = r.id  
LEFT JOIN universities u ON u.city_id = c.id
GROUP BY c.id, c.name, c.slug, r.name, c.country_code, c.population_total, c.population_asof, c.city_type
ORDER BY c.name;

-- Add RLS policy for the view if needed
ALTER VIEW public.city_stats SET (security_invoker = on);

-- Ensure proper permissions
GRANT SELECT ON public.city_stats TO authenticated;
GRANT SELECT ON public.city_stats TO anon;