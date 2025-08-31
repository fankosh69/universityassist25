-- Fix the security definer view issue by recreating the view without SECURITY DEFINER
DROP VIEW IF EXISTS public.city_stats CASCADE;

-- Recreate the view as a standard view (not SECURITY DEFINER)
CREATE VIEW public.city_stats AS
SELECT 
  c.id,
  c.name,
  c.slug,
  r.name as region,
  c.country_code,
  c.population_total,
  c.population_asof,
  COUNT(u.id) as uni_count
FROM public.cities c
LEFT JOIN public.regions r ON c.region_id = r.id
LEFT JOIN public.universities u ON u.city_id = c.id
GROUP BY c.id, c.name, c.slug, r.name, c.country_code, c.population_total, c.population_asof
ORDER BY c.name;