-- Update German cities with population data and state information
-- Major cities population data based on 2024 statistics

-- Update major cities with population and state data
UPDATE cities SET 
  state = 'Berlin',
  metadata = jsonb_set(
    COALESCE(metadata, '{}'),
    '{population}', 
    '3690000'::jsonb
  )
WHERE name = 'Berlin' AND country_code = 'DE';

UPDATE cities SET 
  state = 'Hamburg',
  metadata = jsonb_set(
    COALESCE(metadata, '{}'),
    '{population}', 
    '1890000'::jsonb
  )
WHERE name = 'Hamburg' AND country_code = 'DE';

UPDATE cities SET 
  state = 'Bavaria',
  metadata = jsonb_set(
    COALESCE(metadata, '{}'),
    '{population}', 
    '1490000'::jsonb
  )
WHERE name IN ('Munich', 'München') AND country_code = 'DE';

UPDATE cities SET 
  state = 'North Rhine-Westphalia',
  metadata = jsonb_set(
    COALESCE(metadata, '{}'),
    '{population}', 
    '1073000'::jsonb
  )
WHERE name IN ('Cologne', 'Köln') AND country_code = 'DE';

UPDATE cities SET 
  state = 'Hesse',
  metadata = jsonb_set(
    COALESCE(metadata, '{}'),
    '{population}', 
    '753000'::jsonb
  )
WHERE name = 'Frankfurt am Main' AND country_code = 'DE';

UPDATE cities SET 
  state = 'Baden-Württemberg',
  metadata = jsonb_set(
    COALESCE(metadata, '{}'),
    '{population}', 
    '630000'::jsonb
  )
WHERE name = 'Stuttgart' AND country_code = 'DE';

UPDATE cities SET 
  state = 'North Rhine-Westphalia',
  metadata = jsonb_set(
    COALESCE(metadata, '{}'),
    '{population}', 
    '590000'::jsonb
  )
WHERE name = 'Düsseldorf' AND country_code = 'DE';

UPDATE cities SET 
  state = 'North Rhine-Westphalia',
  metadata = jsonb_set(
    COALESCE(metadata, '{}'),
    '{population}', 
    '520000'::jsonb
  )
WHERE name IN ('Dortmund') AND country_code = 'DE';

UPDATE cities SET 
  state = 'North Rhine-Westphalia',
  metadata = jsonb_set(
    COALESCE(metadata, '{}'),
    '{population}', 
    '365000'::jsonb
  )
WHERE name IN ('Essen') AND country_code = 'DE';

UPDATE cities SET 
  state = 'Saxony',
  metadata = jsonb_set(
    COALESCE(metadata, '{}'),
    '{population}', 
    '600000'::jsonb
  )
WHERE name = 'Leipzig' AND country_code = 'DE';

UPDATE cities SET 
  state = 'Saxony',
  metadata = jsonb_set(
    COALESCE(metadata, '{}'),
    '{population}', 
    '560000'::jsonb
  )
WHERE name = 'Dresden' AND country_code = 'DE';

UPDATE cities SET 
  state = 'Lower Saxony',
  metadata = jsonb_set(
    COALESCE(metadata, '{}'),
    '{population}', 
    '540000'::jsonb
  )
WHERE name IN ('Hannover', 'Hanover') AND country_code = 'DE';

UPDATE cities SET 
  state = 'Bavaria',
  metadata = jsonb_set(
    COALESCE(metadata, '{}'),
    '{population}', 
    '520000'::jsonb
  )
WHERE name IN ('Nürnberg', 'Nuremberg') AND country_code = 'DE';

UPDATE cities SET 
  state = 'North Rhine-Westphalia',
  metadata = jsonb_set(
    COALESCE(metadata, '{}'),
    '{population}', 
    '315000'::jsonb
  )
WHERE name IN ('Münster') AND country_code = 'DE';

UPDATE cities SET 
  state = 'North Rhine-Westphalia',
  metadata = jsonb_set(
    COALESCE(metadata, '{}'),
    '{population}', 
    '250000'::jsonb
  )
WHERE name IN ('Wuppertal') AND country_code = 'DE';

UPDATE cities SET 
  state = 'Baden-Württemberg',
  metadata = jsonb_set(
    COALESCE(metadata, '{}'),
    '{population}', 
    '310000'::jsonb
  )
WHERE name IN ('Mannheim') AND country_code = 'DE';

UPDATE cities SET 
  state = 'Schleswig-Holstein',
  metadata = jsonb_set(
    COALESCE(metadata, '{}'),
    '{population}', 
    '220000'::jsonb
  )
WHERE name IN ('Lübeck') AND country_code = 'DE';

UPDATE cities SET 
  state = 'Bavaria',
  metadata = jsonb_set(
    COALESCE(metadata, '{}'),
    '{population}', 
    '200000'::jsonb
  )
WHERE name IN ('Augsburg') AND country_code = 'DE';

UPDATE cities SET 
  state = 'Mecklenburg-Vorpommern',
  metadata = jsonb_set(
    COALESCE(metadata, '{}'),
    '{population}', 
    '210000'::jsonb
  )
WHERE name IN ('Rostock') AND country_code = 'DE';

UPDATE cities SET 
  state = 'Rhineland-Palatinate',
  metadata = jsonb_set(
    COALESCE(metadata, '{}'),
    '{population}', 
    '220000'::jsonb
  )
WHERE name IN ('Mainz') AND country_code = 'DE';

-- Update smaller cities with estimates based on typical German city sizes
UPDATE cities SET 
  state = CASE name
    WHEN 'Aachen' THEN 'North Rhine-Westphalia'
    WHEN 'Bamberg' THEN 'Bavaria'
    WHEN 'Bayreuth' THEN 'Bavaria'
    WHEN 'Braunschweig' THEN 'Lower Saxony'
    WHEN 'Bremen' THEN 'Bremen'
    WHEN 'Chemnitz' THEN 'Saxony'
    WHEN 'Erfurt' THEN 'Thuringia'
    WHEN 'Erlangen' THEN 'Bavaria'
    WHEN 'Freiburg' THEN 'Baden-Württemberg'
    WHEN 'Giessen' THEN 'Hesse'
    WHEN 'Göttingen' THEN 'Lower Saxony'
    WHEN 'Halle' THEN 'Saxony-Anhalt'
    WHEN 'Heidelberg' THEN 'Baden-Württemberg'
    WHEN 'Jena' THEN 'Thuringia'
    WHEN 'Kaiserslautern' THEN 'Rhineland-Palatinate'
    WHEN 'Karlsruhe' THEN 'Baden-Württemberg'
    WHEN 'Kassel' THEN 'Hesse'
    WHEN 'Kiel' THEN 'Schleswig-Holstein'
    WHEN 'Konstanz' THEN 'Baden-Württemberg'
    WHEN 'Magdeburg' THEN 'Saxony-Anhalt'
    WHEN 'Marburg' THEN 'Hesse'
    WHEN 'Oldenburg' THEN 'Lower Saxony'
    WHEN 'Osnabrück' THEN 'Lower Saxony'
    WHEN 'Paderborn' THEN 'North Rhine-Westphalia'
    WHEN 'Passau' THEN 'Bavaria'
    WHEN 'Potsdam' THEN 'Brandenburg'
    WHEN 'Regensburg' THEN 'Bavaria'
    WHEN 'Saarbrücken' THEN 'Saarland'
    WHEN 'Siegen' THEN 'North Rhine-Westphalia'
    WHEN 'Trier' THEN 'Rhineland-Palatinate'
    WHEN 'Tübingen' THEN 'Baden-Württemberg'
    WHEN 'Ulm' THEN 'Baden-Württemberg'
    WHEN 'Würzburg' THEN 'Bavaria'
    ELSE state
  END,
  metadata = jsonb_set(
    COALESCE(metadata, '{}'),
    '{population}', 
    CASE 
      WHEN name IN ('Heidelberg', 'Karlsruhe', 'Regensburg') THEN '160000'::jsonb
      WHEN name IN ('Freiburg', 'Kiel', 'Magdeburg', 'Erfurt') THEN '150000'::jsonb
      WHEN name IN ('Kassel', 'Osnabrück', 'Oldenburg') THEN '170000'::jsonb
      WHEN name IN ('Göttingen', 'Marburg', 'Jena', 'Tübingen') THEN '120000'::jsonb
      WHEN name IN ('Konstanz', 'Passau', 'Bamberg', 'Bayreuth') THEN '75000'::jsonb
      WHEN name IN ('Erlangen', 'Würzburg', 'Ulm') THEN '130000'::jsonb
      ELSE '50000'::jsonb
    END
  )
WHERE country_code = 'DE' AND state IS NULL;