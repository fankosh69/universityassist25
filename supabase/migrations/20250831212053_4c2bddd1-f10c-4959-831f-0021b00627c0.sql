-- First drop the function that depends on the view
DROP FUNCTION IF EXISTS public.search_cities(text);

-- Create regions table
CREATE TABLE IF NOT EXISTS public.regions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  country_code char(2) NOT NULL DEFAULT 'DE',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.regions ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Public can view regions" ON public.regions FOR SELECT USING (true);
CREATE POLICY "Admins can manage regions" ON public.regions FOR ALL USING (has_role('admin'::app_role));

-- Add region_id column to cities table
ALTER TABLE public.cities ADD COLUMN IF NOT EXISTS region_id uuid REFERENCES public.regions(id);

-- Add region_id column to universities table  
ALTER TABLE public.universities ADD COLUMN IF NOT EXISTS region_id uuid REFERENCES public.regions(id);

-- Insert German regions (states) - only if they don't exist
INSERT INTO public.regions (name, slug, country_code) 
SELECT name, slug, country_code FROM (VALUES
  ('Baden-Württemberg', 'baden-wuerttemberg', 'DE'),
  ('Bayern', 'bayern', 'DE'),
  ('Berlin', 'berlin', 'DE'),
  ('Brandenburg', 'brandenburg', 'DE'),
  ('Bremen', 'bremen', 'DE'),
  ('Hamburg', 'hamburg', 'DE'),
  ('Hessen', 'hessen', 'DE'),
  ('Mecklenburg-Vorpommern', 'mecklenburg-vorpommern', 'DE'),
  ('Niedersachsen', 'niedersachsen', 'DE'),
  ('Nordrhein-Westfalen', 'nordrhein-westfalen', 'DE'),
  ('Rheinland-Pfalz', 'rheinland-pfalz', 'DE'),
  ('Saarland', 'saarland', 'DE'),
  ('Sachsen', 'sachsen', 'DE'),
  ('Sachsen-Anhalt', 'sachsen-anhalt', 'DE'),
  ('Schleswig-Holstein', 'schleswig-holstein', 'DE'),
  ('Thüringen', 'thueringen', 'DE')
) AS v(name, slug, country_code)
WHERE NOT EXISTS (SELECT 1 FROM public.regions WHERE regions.slug = v.slug);

-- Update cities with their correct regions
UPDATE public.cities SET region_id = (SELECT id FROM public.regions WHERE name = 'Nordrhein-Westfalen') WHERE name IN ('Aachen', 'Dortmund', 'Cologne', 'Köln', 'Düsseldorf', 'Essen', 'Duisburg', 'Bochum', 'Bonn', 'Bielefeld', 'Münster', 'Gelsenkirchen') AND region_id IS NULL;
UPDATE public.cities SET region_id = (SELECT id FROM public.regions WHERE name = 'Bayern') WHERE name IN ('Munich', 'München', 'Nuremberg', 'Nürnberg', 'Augsburg') AND region_id IS NULL;
UPDATE public.cities SET region_id = (SELECT id FROM public.regions WHERE name = 'Berlin') WHERE name = 'Berlin' AND region_id IS NULL;
UPDATE public.cities SET region_id = (SELECT id FROM public.regions WHERE name = 'Hamburg') WHERE name = 'Hamburg' AND region_id IS NULL;
UPDATE public.cities SET region_id = (SELECT id FROM public.regions WHERE name = 'Hessen') WHERE name IN ('Frankfurt am Main', 'Frankfurt', 'Wiesbaden') AND region_id IS NULL;
UPDATE public.cities SET region_id = (SELECT id FROM public.regions WHERE name = 'Baden-Württemberg') WHERE name IN ('Stuttgart', 'Mannheim', 'Karlsruhe') AND region_id IS NULL;
UPDATE public.cities SET region_id = (SELECT id FROM public.regions WHERE name = 'Sachsen') WHERE name IN ('Leipzig', 'Dresden') AND region_id IS NULL;
UPDATE public.cities SET region_id = (SELECT id FROM public.regions WHERE name = 'Bremen') WHERE name = 'Bremen' AND region_id IS NULL;
UPDATE public.cities SET region_id = (SELECT id FROM public.regions WHERE name = 'Niedersachsen') WHERE name = 'Hannover' AND region_id IS NULL;

-- Recreate city_stats view to include region names
DROP VIEW IF EXISTS public.city_stats CASCADE;
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

-- Recreate search function
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