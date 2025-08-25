-- Fix university-city relationships and add coordinates
-- Update city_id for universities based on city name matching
UPDATE universities 
SET city_id = cities.id 
FROM cities 
WHERE universities.city = cities.name 
AND universities.city_id IS NULL;

-- Add missing slugs for universities (slug is needed for routing)
UPDATE universities 
SET slug = LOWER(REGEXP_REPLACE(REGEXP_REPLACE(name, '[^a-zA-Z0-9\s-]', '', 'g'), '\s+', '-', 'g'))
WHERE slug IS NULL OR slug = '';

-- Update institution types to use new normalized values
UPDATE universities SET type = 'university_applied_sciences' WHERE type = 'university_of_applied_sciences';

-- Add coordinates for major German universities (rough estimates for major cities)
UPDATE universities SET 
  lat = 50.7374, lng = 7.0982 
WHERE city = 'Bonn' AND (lat IS NULL OR lat = 0);

UPDATE universities SET 
  lat = 52.5164, lng = 13.3777 
WHERE city = 'Berlin' AND (lat IS NULL OR lat = 0);

UPDATE universities SET 
  lat = 48.1351, lng = 11.5820 
WHERE city = 'Munich' AND (lat IS NULL OR lat = 0);

UPDATE universities SET 
  lat = 53.5511, lng = 9.9937 
WHERE city = 'Hamburg' AND (lat IS NULL OR lat = 0);

UPDATE universities SET 
  lat = 50.9375, lng = 6.9603 
WHERE city = 'Cologne' AND (lat IS NULL OR lat = 0);

UPDATE universities SET 
  lat = 48.7758, lng = 9.1829 
WHERE city = 'Stuttgart' AND (lat IS NULL OR lat = 0);

UPDATE universities SET 
  lat = 50.1109, lng = 8.6821 
WHERE city = 'Frankfurt am Main' AND (lat IS NULL OR lat = 0);

UPDATE universities SET 
  lat = 51.4819, lng = 7.2162 
WHERE city = 'Dortmund' AND (lat IS NULL OR lat = 0);

UPDATE universities SET 
  lat = 51.4556, lng = 7.0116 
WHERE city = 'Essen' AND (lat IS NULL OR lat = 0);

UPDATE universities SET 
  lat = 51.0504, lng = 13.7373 
WHERE city = 'Dresden' AND (lat IS NULL OR lat = 0);

UPDATE universities SET 
  lat = 52.2699, lng = 10.5267 
WHERE city = 'Braunschweig' AND (lat IS NULL OR lat = 0);

UPDATE universities SET 
  lat = 49.8728, lng = 8.6512 
WHERE city = 'Darmstadt' AND (lat IS NULL OR lat = 0);

UPDATE universities SET 
  lat = 50.7806, lng = 6.0669 
WHERE city = 'Aachen' AND (lat IS NULL OR lat = 0);

UPDATE universities SET 
  lat = 49.4875, lng = 8.4660 
WHERE city = 'Mannheim' AND (lat IS NULL OR lat = 0);

UPDATE universities SET 
  lat = 49.6116, lng = 6.1319 
WHERE city = 'Saarbrücken' AND (lat IS NULL OR lat = 0);

UPDATE universities SET 
  lat = 49.4401, lng = 11.0675 
WHERE city = 'Erlangen' AND (lat IS NULL OR lat = 0);

UPDATE universities SET 
  lat = 48.3668, lng = 10.8986 
WHERE city = 'Augsburg' AND (lat IS NULL OR lat = 0);

UPDATE universities SET 
  lat = 49.8988, lng = 10.9027 
WHERE city = 'Bamberg' AND (lat IS NULL OR lat = 0);

UPDATE universities SET 
  lat = 49.9450, lng = 11.5752 
WHERE city = 'Bayreuth' AND (lat IS NULL OR lat = 0);

UPDATE universities SET 
  lat = 52.0302, lng = 8.5325 
WHERE city = 'Bielefeld' AND (lat IS NULL OR lat = 0);

UPDATE universities SET 
  lat = 51.4818, lng = 7.2196 
WHERE city = 'Bochum' AND (lat IS NULL OR lat = 0);

UPDATE universities SET 
  lat = 53.0793, lng = 8.8017 
WHERE city = 'Bremen' AND (lat IS NULL OR lat = 0);

UPDATE universities SET 
  lat = 48.0196, lng = 7.8344 
WHERE city = 'Freiburg' AND (lat IS NULL OR lat = 0);

UPDATE universities SET 
  lat = 50.5558, lng = 8.6888 
WHERE city = 'Giessen' AND (lat IS NULL OR lat = 0);

UPDATE universities SET 
  lat = 51.5415, lng = 9.9159 
WHERE city = 'Göttingen' AND (lat IS NULL OR lat = 0);

UPDATE universities SET 
  lat = 51.4969, lng = 11.9695 
WHERE city = 'Halle' AND (lat IS NULL OR lat = 0);

UPDATE universities SET 
  lat = 49.3988, lng = 8.6724 
WHERE city = 'Heidelberg' AND (lat IS NULL OR lat = 0);

UPDATE universities SET 
  lat = 48.5216, lng = 9.0576 
WHERE city = 'Tübingen' AND (lat IS NULL OR lat = 0);

UPDATE universities SET 
  lat = 49.0069, lng = 12.1016 
WHERE city = 'Regensburg' AND (lat IS NULL OR lat = 0);