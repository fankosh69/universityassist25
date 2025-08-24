-- Clear existing sample data to avoid conflicts
DELETE FROM public.program_deadlines;
DELETE FROM public.program_requirements;
DELETE FROM public.programs;
DELETE FROM public.universities;
DELETE FROM public.cities WHERE country_code = 'DE';

-- Comprehensive German Universities Data - Part 1: Cities
INSERT INTO public.cities (id, name, country_code, state, slug, lat, lng, metadata, search_doc) VALUES
  ('550e8400-e29b-41d4-a716-446655440001', 'Berlin', 'DE', 'Berlin', 'berlin', 52.5200, 13.4050, '{"population": 3669491, "description": "German city with universities"}', '{"keywords": ["german", "university", "education", "berlin"]}'),
  ('550e8400-e29b-41d4-a716-446655440002', 'Hamburg', 'DE', 'Hamburg', 'hamburg', 53.5511, 9.9937, '{"population": 1899160, "description": "German city with universities"}', '{"keywords": ["german", "university", "education", "hamburg"]}'),
  ('550e8400-e29b-41d4-a716-446655440003', 'Munich', 'DE', 'Bavaria', 'munich', 48.1351, 11.5820, '{"population": 1488202, "description": "German city with universities"}', '{"keywords": ["german", "university", "education", "bavaria"]}'),
  ('550e8400-e29b-41d4-a716-446655440004', 'Cologne', 'DE', 'North Rhine-Westphalia', 'cologne', 50.9375, 6.9603, '{"population": 1073096, "description": "German city with universities"}', '{"keywords": ["german", "university", "education", "north rhine-westphalia"]}'),
  ('550e8400-e29b-41d4-a716-446655440005', 'Frankfurt am Main', 'DE', 'Hesse', 'frankfurt', 50.1109, 8.6821, '{"population": 753056, "description": "German city with universities"}', '{"keywords": ["german", "university", "education", "hesse"]}'),
  ('550e8400-e29b-41d4-a716-446655440006', 'Stuttgart', 'DE', 'Baden-Württemberg', 'stuttgart', 48.7758, 9.1829, '{"population": 626275, "description": "German city with universities"}', '{"keywords": ["german", "university", "education", "baden-württemberg"]}'),
  ('550e8400-e29b-41d4-a716-446655440007', 'Düsseldorf', 'DE', 'North Rhine-Westphalia', 'dusseldorf', 51.2277, 6.7735, '{"population": 619294, "description": "German city with universities"}', '{"keywords": ["german", "university", "education", "north rhine-westphalia"]}'),
  ('550e8400-e29b-41d4-a716-446655440008', 'Leipzig', 'DE', 'Saxony', 'leipzig', 51.3397, 12.3731, '{"population": 597493, "description": "German city with universities"}', '{"keywords": ["german", "university", "education", "saxony"]}'),
  ('550e8400-e29b-41d4-a716-446655440009', 'Dortmund', 'DE', 'North Rhine-Westphalia', 'dortmund', 51.5136, 7.4653, '{"population": 588250, "description": "German city with universities"}', '{"keywords": ["german", "university", "education", "north rhine-westphalia"]}'),
  ('550e8400-e29b-41d4-a716-446655440010', 'Essen', 'DE', 'North Rhine-Westphalia', 'essen', 51.4556, 7.0116, '{"population": 579432, "description": "German city with universities"}', '{"keywords": ["german", "university", "education", "north rhine-westphalia"]}'),
  ('550e8400-e29b-41d4-a716-446655440011', 'Bremen', 'DE', 'Bremen', 'bremen', 53.0793, 8.8017, '{"population": 567559, "description": "German city with universities"}', '{"keywords": ["german", "university", "education", "bremen"]}'),
  ('550e8400-e29b-41d4-a716-446655440012', 'Dresden', 'DE', 'Saxony', 'dresden', 51.0504, 13.7373, '{"population": 556780, "description": "German city with universities"}', '{"keywords": ["german", "university", "education", "saxony"]}'),
  ('550e8400-e29b-41d4-a716-446655440013', 'Hanover', 'DE', 'Lower Saxony', 'hanover', 52.3759, 9.7320, '{"population": 538068, "description": "German city with universities"}', '{"keywords": ["german", "university", "education", "lower saxony"]}'),
  ('550e8400-e29b-41d4-a716-446655440014', 'Nuremberg', 'DE', 'Bavaria', 'nuremberg', 49.4521, 11.0767, '{"population": 518365, "description": "German city with universities"}', '{"keywords": ["german", "university", "education", "bavaria"]}'),
  ('550e8400-e29b-41d4-a716-446655440015', 'Duisburg', 'DE', 'North Rhine-Westphalia', 'duisburg', 51.4344, 6.7623, '{"population": 498590, "description": "German city with universities"}', '{"keywords": ["german", "university", "education", "north rhine-westphalia"]}'),
  ('550e8400-e29b-41d4-a716-446655440016', 'Bochum', 'DE', 'North Rhine-Westphalia', 'bochum', 51.4818, 7.2162, '{"population": 364454, "description": "German city with universities"}', '{"keywords": ["german", "university", "education", "north rhine-westphalia"]}'),
  ('550e8400-e29b-41d4-a716-446655440017', 'Wuppertal', 'DE', 'North Rhine-Westphalia', 'wuppertal', 51.2562, 7.1508, '{"population": 354382, "description": "German city with universities"}', '{"keywords": ["german", "university", "education", "north rhine-westphalia"]}'),
  ('550e8400-e29b-41d4-a716-446655440018', 'Bielefeld', 'DE', 'North Rhine-Westphalia', 'bielefeld', 52.0202, 8.5353, '{"population": 334002, "description": "German city with universities"}', '{"keywords": ["german", "university", "education", "north rhine-westphalia"]}'),
  ('550e8400-e29b-41d4-a716-446655440019', 'Bonn', 'DE', 'North Rhine-Westphalia', 'bonn', 50.7374, 7.0982, '{"population": 327258, "description": "German city with universities"}', '{"keywords": ["german", "university", "education", "north rhine-westphalia"]}'),
  ('550e8400-e29b-41d4-a716-446655440020', 'Münster', 'DE', 'North Rhine-Westphalia', 'munster', 51.9607, 7.6261, '{"population": 315293, "description": "German city with universities"}', '{"keywords": ["german", "university", "education", "north rhine-westphalia"]}'),
  ('550e8400-e29b-41d4-a716-446655440021', 'Karlsruhe', 'DE', 'Baden-Württemberg', 'karlsruhe', 49.0069, 8.4037, '{"population": 308436, "description": "German city with universities"}', '{"keywords": ["german", "university", "education", "baden-württemberg"]}'),
  ('550e8400-e29b-41d4-a716-446655440022', 'Mannheim', 'DE', 'Baden-Württemberg', 'mannheim', 49.4875, 8.4660, '{"population": 307960, "description": "German city with universities"}', '{"keywords": ["german", "university", "education", "baden-württemberg"]}'),
  ('550e8400-e29b-41d4-a716-446655440023', 'Augsburg', 'DE', 'Bavaria', 'augsburg', 48.3705, 10.8978, '{"population": 295135, "description": "German city with universities"}', '{"keywords": ["german", "university", "education", "bavaria"]}'),
  ('550e8400-e29b-41d4-a716-446655440024', 'Wiesbaden', 'DE', 'Hesse', 'wiesbaden', 50.0782, 8.2398, '{"population": 278342, "description": "German city with universities"}', '{"keywords": ["german", "university", "education", "hesse"]}'),
  ('550e8400-e29b-41d4-a716-446655440025', 'Heidelberg', 'DE', 'Baden-Württemberg', 'heidelberg', 49.3988, 8.6724, '{"population": 160355, "description": "German city with universities"}', '{"keywords": ["german", "university", "education", "baden-württemberg"]}'),
  ('550e8400-e29b-41d4-a716-446655440026', 'Darmstadt', 'DE', 'Hesse', 'darmstadt', 49.8728, 8.6512, '{"population": 159631, "description": "German city with universities"}', '{"keywords": ["german", "university", "education", "hesse"]}'),
  ('550e8400-e29b-41d4-a716-446655440027', 'Regensburg', 'DE', 'Bavaria', 'regensburg', 49.0134, 12.1016, '{"population": 152610, "description": "German city with universities"}', '{"keywords": ["german", "university", "education", "bavaria"]}'),
  ('550e8400-e29b-41d4-a716-446655440028', 'Tübingen', 'DE', 'Baden-Württemberg', 'tubingen', 48.5216, 9.0576, '{"population": 91506, "description": "German city with universities"}', '{"keywords": ["german", "university", "education", "baden-württemberg"]}'),
  ('550e8400-e29b-41d4-a716-446655440029', 'Freiburg im Breisgau', 'DE', 'Baden-Württemberg', 'freiburg', 47.9990, 7.8421, '{"population": 230241, "description": "German city with universities"}', '{"keywords": ["german", "university", "education", "baden-württemberg"]}'),
  ('550e8400-e29b-41d4-a716-446655440030', 'Göttingen', 'DE', 'Lower Saxony', 'gottingen', 51.5414, 9.9155, '{"population": 116845, "description": "German city with universities"}', '{"keywords": ["german", "university", "education", "lower saxony"]}'),
  ('550e8400-e29b-41d4-a716-446655440031', 'Marburg', 'DE', 'Hesse', 'marburg', 50.8021, 8.7667, '{"population": 76851, "description": "German city with universities"}', '{"keywords": ["german", "university", "education", "hesse"]}'),
  ('550e8400-e29b-41d4-a716-446655440032', 'Jena', 'DE', 'Thuringia', 'jena', 50.9278, 11.5899, '{"population": 111407, "description": "German city with universities"}', '{"keywords": ["german", "university", "education", "thuringia"]}'),
  ('550e8400-e29b-41d4-a716-446655440033', 'Aachen', 'DE', 'North Rhine-Westphalia', 'aachen', 50.7753, 6.0839, '{"population": 245885, "description": "German city with universities"}', '{"keywords": ["german", "university", "education", "north rhine-westphalia"]}'),
  ('550e8400-e29b-41d4-a716-446655440034', 'Kiel', 'DE', 'Schleswig-Holstein', 'kiel', 54.3233, 10.1228, '{"population": 246306, "description": "German city with universities"}', '{"keywords": ["german", "university", "education", "schleswig-holstein"]}'),
  ('550e8400-e29b-41d4-a716-446655440035', 'Lübeck', 'DE', 'Schleswig-Holstein', 'lubeck', 53.8655, 10.6866, '{"population": 216530, "description": "German city with universities"}', '{"keywords": ["german", "university", "education", "schleswig-holstein"]}')
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  lat = EXCLUDED.lat,
  lng = EXCLUDED.lng,
  metadata = EXCLUDED.metadata;