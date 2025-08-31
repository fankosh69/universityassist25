-- Update cities with comprehensive population data from citypopulation.de
UPDATE cities SET 
  population_total = 74657,
  population_asof = '2024-12-31'
WHERE name = 'Bayreuth' AND population_total IS NULL;

UPDATE cities SET 
  population_total = 249406,
  population_asof = '2024-12-31'
WHERE name = 'Braunschweig' AND population_total IS NULL;

UPDATE cities SET 
  population_total = 243248,
  population_asof = '2024-12-31'
WHERE name = 'Chemnitz' AND population_total IS NULL;

UPDATE cities SET 
  population_total = 159631,
  population_asof = '2024-12-31'
WHERE name = 'Darmstadt' AND population_total IS NULL;

UPDATE cities SET 
  population_total = 113292,
  population_asof = '2024-12-31'
WHERE name = 'Erlangen' AND population_total IS NULL;

UPDATE cities SET 
  population_total = 235960,
  population_asof = '2024-12-31'
WHERE name = 'Freiburg' AND population_total IS NULL;

UPDATE cities SET 
  population_total = 118911,
  population_asof = '2024-12-31'
WHERE name = 'Göttingen' AND population_total IS NULL;

UPDATE cities SET 
  population_total = 240056,
  population_asof = '2024-12-31'
WHERE name = 'Halle' AND population_total IS NULL;

UPDATE cities SET 
  population_total = 162273,
  population_asof = '2024-12-31'
WHERE name = 'Heidelberg' AND population_total IS NULL;

UPDATE cities SET 
  population_total = 111343,
  population_asof = '2024-12-31'
WHERE name = 'Jena' AND population_total IS NULL;

UPDATE cities SET 
  population_total = 99684,
  population_asof = '2024-12-31'
WHERE name = 'Kaiserslautern' AND population_total IS NULL;

UPDATE cities SET 
  population_total = 201048,
  population_asof = '2024-12-31'
WHERE name = 'Kassel' AND population_total IS NULL;

UPDATE cities SET 
  population_total = 247717,
  population_asof = '2024-12-31'
WHERE name = 'Kiel' AND population_total IS NULL;

UPDATE cities SET 
  population_total = 85838,
  population_asof = '2024-12-31'
WHERE name = 'Konstanz' AND population_total IS NULL;

UPDATE cities SET 
  population_total = 217198,
  population_asof = '2024-12-31'
WHERE name = 'Lübeck' AND population_total IS NULL;

UPDATE cities SET 
  population_total = 237565,
  population_asof = '2024-12-31'
WHERE name = 'Magdeburg' AND population_total IS NULL;

UPDATE cities SET 
  population_total = 218578,
  population_asof = '2024-12-31'
WHERE name = 'Mainz' AND population_total IS NULL;

UPDATE cities SET 
  population_total = 76851,
  population_asof = '2024-12-31'
WHERE name = 'Marburg' AND population_total IS NULL;

UPDATE cities SET 
  population_total = 169605,
  population_asof = '2024-12-31'
WHERE name = 'Oldenburg' AND population_total IS NULL;

UPDATE cities SET 
  population_total = 165034,
  population_asof = '2024-12-31'
WHERE name = 'Osnabrück' AND population_total IS NULL;

UPDATE cities SET 
  population_total = 153231,
  population_asof = '2024-12-31'
WHERE name = 'Paderborn' AND population_total IS NULL;

UPDATE cities SET 
  population_total = 52748,
  population_asof = '2024-12-31'
WHERE name = 'Passau' AND population_total IS NULL;

UPDATE cities SET 
  population_total = 183154,
  population_asof = '2024-12-31'
WHERE name = 'Potsdam' AND population_total IS NULL;

UPDATE cities SET 
  population_total = 153094,
  population_asof = '2024-12-31'
WHERE name = 'Regensburg' AND population_total IS NULL;

UPDATE cities SET 
  population_total = 209920,
  population_asof = '2024-12-31'
WHERE name = 'Rostock' AND population_total IS NULL;

UPDATE cities SET 
  population_total = 180374,
  population_asof = '2024-12-31'
WHERE name = 'Saarbrücken' AND population_total IS NULL;

UPDATE cities SET 
  population_total = 111528,
  population_asof = '2024-12-31'
WHERE name = 'Trier' AND population_total IS NULL;

UPDATE cities SET 
  population_total = 91506,
  population_asof = '2024-12-31'
WHERE name = 'Tübingen' AND population_total IS NULL;

UPDATE cities SET 
  population_total = 127329,
  population_asof = '2024-12-31'
WHERE name = 'Ulm' AND population_total IS NULL;

UPDATE cities SET 
  population_total = 127934,
  population_asof = '2024-12-31'
WHERE name = 'Würzburg' AND population_total IS NULL;

-- Fix the security definer issue by recreating the function with proper search path
DROP FUNCTION IF EXISTS public.search_cities(text) CASCADE;

CREATE OR REPLACE FUNCTION public.search_cities(q text)
RETURNS TABLE(
  id uuid,
  name text,
  slug text,
  region text,
  country_code char,
  population_total bigint,
  population_asof date,
  uni_count bigint
) 
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
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
  WHERE c.fts @@ websearch_to_tsquery('simple', q)
     OR u.fts @@ websearch_to_tsquery('simple', q)
  GROUP BY c.id, c.name, c.slug, r.name, c.country_code, c.population_total, c.population_asof
  ORDER BY c.name;
$$;