-- Update cities with sample data where they don't exist
UPDATE public.cities SET 
  lat = 52.5200, 
  lng = 13.4050, 
  metadata = '{"population": 3700000, "description": "Capital city of Germany and major academic hub"}'::jsonb 
WHERE slug = 'berlin' AND lat IS NULL;

UPDATE public.cities SET 
  lat = 48.1351, 
  lng = 11.5820, 
  metadata = '{"population": 1500000, "description": "Bavarian capital known for technology and research"}'::jsonb 
WHERE slug = 'munich' AND lat IS NULL;

-- Insert additional cities if they don't exist
INSERT INTO public.cities (name, slug, lat, lng, country_code, state, metadata) VALUES
  ('Hamburg', 'hamburg', 53.5511, 9.9937, 'DE', 'Hamburg', '{"population": 1900000, "description": "Major port city and media center"}'),
  ('Frankfurt', 'frankfurt', 50.1109, 8.6821, 'DE', 'Hesse', '{"population": 750000, "description": "Financial capital of Germany"}'),
  ('Stuttgart', 'stuttgart', 48.7758, 9.1829, 'DE', 'Baden-Württemberg', '{"population": 630000, "description": "Automotive and engineering hub"}')
ON CONFLICT (slug) DO NOTHING;

-- Get city IDs for reference
WITH city_refs AS (
  SELECT id, slug FROM cities WHERE slug IN ('berlin', 'munich', 'hamburg', 'frankfurt', 'stuttgart')
)
-- Sample data for universities using actual city IDs
INSERT INTO public.universities (name, city, slug, lat, lng, website, type, city_id, ranking) 
SELECT 
  university_data.name,
  university_data.city,
  university_data.slug,
  university_data.lat,
  university_data.lng,
  university_data.website,
  university_data.type,
  city_refs.id,
  university_data.ranking
FROM (VALUES
  ('Humboldt University of Berlin', 'Berlin', 'humboldt-university-berlin', 52.5186, 13.3936, 'https://www.hu-berlin.de', 'Public', 'berlin', 1),
  ('Technical University of Munich', 'Munich', 'technical-university-munich', 48.1497, 11.5677, 'https://www.tum.de', 'Public', 'munich', 2),
  ('University of Hamburg', 'Hamburg', 'university-hamburg', 53.5631, 9.9878, 'https://www.uni-hamburg.de', 'Public', 'hamburg', 3),
  ('Goethe University Frankfurt', 'Frankfurt', 'goethe-university-frankfurt', 50.1280, 8.6685, 'https://www.uni-frankfurt.de', 'Public', 'frankfurt', 4),
  ('University of Stuttgart', 'Stuttgart', 'university-stuttgart', 48.7445, 9.0989, 'https://www.uni-stuttgart.de', 'Public', 'stuttgart', 5)
) AS university_data(name, city, slug, lat, lng, website, type, city_slug, ranking)
JOIN city_refs ON city_refs.slug = university_data.city_slug
ON CONFLICT (slug) DO NOTHING;