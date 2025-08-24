-- Insert major German universities data
INSERT INTO public.universities (id, name, city, city_id, country_code, slug, lat, lng, type, ranking, website, external_refs) VALUES
-- Berlin Universities
('650e8400-e29b-41d4-a716-446655440001', 'Humboldt University of Berlin', 'Berlin', '550e8400-e29b-41d4-a716-446655440001', 'DE', 'humboldt-university-berlin', 52.5200, 13.4050, 'Public', 120, 'https://www.hu-berlin.de', '{"founded": 1810, "students": 33000}'),
('650e8400-e29b-41d4-a716-446655440002', 'Free University of Berlin', 'Berlin', '550e8400-e29b-41d4-a716-446655440001', 'DE', 'free-university-berlin', 52.4537, 13.2890, 'Public', 130, 'https://www.fu-berlin.de', '{"founded": 1948, "students": 37000}'),
('650e8400-e29b-41d4-a716-446655440003', 'Technical University of Berlin', 'Berlin', '550e8400-e29b-41d4-a716-446655440001', 'DE', 'technical-university-berlin', 52.5125, 13.3269, 'Public', 150, 'https://www.tu-berlin.de', '{"founded": 1946, "students": 35000}'),
('650e8400-e29b-41d4-a716-446655440004', 'Charité - Universitätsmedizin Berlin', 'Berlin', '550e8400-e29b-41d4-a716-446655440001', 'DE', 'charite-berlin', 52.5259, 13.3777, 'Public', 100, 'https://www.charite.de', '{"founded": 1710, "students": 8000}'),

-- Munich Universities
('650e8400-e29b-41d4-a716-446655440005', 'Ludwig Maximilian University of Munich', 'Munich', '550e8400-e29b-41d4-a716-446655440003', 'DE', 'lmu-munich', 48.1500, 11.5800, 'Public', 60, 'https://www.lmu.de', '{"founded": 1472, "students": 52000}'),
('650e8400-e29b-41d4-a716-446655440006', 'Technical University of Munich', 'Munich', '550e8400-e29b-41d4-a716-446655440003', 'DE', 'tum-munich', 48.1497, 11.5685, 'Public', 50, 'https://www.tum.de', '{"founded": 1868, "students": 45000}'),
('650e8400-e29b-41d4-a716-446655440007', 'Munich University of Applied Sciences', 'Munich', '550e8400-e29b-41d4-a716-446655440003', 'DE', 'hm-munich', 48.1542, 11.5681, 'Public', 250, 'https://www.hm.edu', '{"founded": 1971, "students": 18000}'),

-- Hamburg Universities
('650e8400-e29b-41d4-a716-446655440008', 'University of Hamburg', 'Hamburg', '550e8400-e29b-41d4-a716-446655440002', 'DE', 'uni-hamburg', 53.5676, 9.9856, 'Public', 200, 'https://www.uni-hamburg.de', '{"founded": 1919, "students": 43000}'),
('650e8400-e29b-41d4-a716-446655440009', 'Hamburg University of Technology', 'Hamburg', '550e8400-e29b-41d4-a716-446655440002', 'DE', 'tuhh-hamburg', 53.4606, 9.9695, 'Public', 300, 'https://www.tuhh.de', '{"founded": 1978, "students": 7500}'),

-- Cologne Universities  
('650e8400-e29b-41d4-a716-446655440010', 'University of Cologne', 'Cologne', '550e8400-e29b-41d4-a716-446655440004', 'DE', 'uni-koeln', 50.9280, 6.9280, 'Public', 145, 'https://www.uni-koeln.de', '{"founded": 1388, "students": 48000}'),
('650e8400-e29b-41d4-a716-446655440011', 'Cologne University of Applied Sciences', 'Cologne', '550e8400-e29b-41d4-a716-446655440004', 'DE', 'th-koeln', 50.9406, 6.9599, 'Public', 320, 'https://www.th-koeln.de', '{"founded": 1971, "students": 25000}'),

-- Frankfurt Universities
('650e8400-e29b-41d4-a716-446655440012', 'Goethe University Frankfurt', 'Frankfurt am Main', '550e8400-e29b-41d4-a716-446655440005', 'DE', 'goethe-university-frankfurt', 50.1277, 8.6610, 'Public', 140, 'https://www.uni-frankfurt.de', '{"founded": 1914, "students": 48000}'),
('650e8400-e29b-41d4-a716-446655440013', 'Frankfurt University of Applied Sciences', 'Frankfurt am Main', '550e8400-e29b-41d4-a716-446655440005', 'DE', 'frankfurt-uas', 50.1015, 8.6968, 'Public', 300, 'https://www.frankfurt-university.de', '{"founded": 1971, "students": 15000}'),

-- Stuttgart Universities
('650e8400-e29b-41d4-a716-446655440014', 'University of Stuttgart', 'Stuttgart', '550e8400-e29b-41d4-a716-446655440006', 'DE', 'uni-stuttgart', 48.7447, 9.1102, 'Public', 180, 'https://www.uni-stuttgart.de', '{"founded": 1829, "students": 27000}'),
('650e8400-e29b-41d4-a716-446655440015', 'Stuttgart University of Applied Sciences', 'Stuttgart', '550e8400-e29b-41d4-a716-446655440006', 'DE', 'hft-stuttgart', 48.7733, 9.1770, 'Public', 280, 'https://www.hft-stuttgart.de', '{"founded": 1832, "students": 9000}'),

-- Heidelberg Universities
('650e8400-e29b-41d4-a716-446655440016', 'Heidelberg University', 'Heidelberg', '550e8400-e29b-41d4-a716-446655440025', 'DE', 'uni-heidelberg', 49.4104, 8.7058, 'Public', 65, 'https://www.uni-heidelberg.de', '{"founded": 1386, "students": 30000}'),

-- Karlsruhe Universities
('650e8400-e29b-41d4-a716-446655440017', 'Karlsruhe Institute of Technology', 'Karlsruhe', '550e8400-e29b-41d4-a716-446655440021', 'DE', 'kit-karlsruhe', 49.0094, 8.4044, 'Public', 90, 'https://www.kit.edu', '{"founded": 1825, "students": 25000}'),

-- Tübingen Universities
('650e8400-e29b-41d4-a716-446655440018', 'University of Tübingen', 'Tübingen', '550e8400-e29b-41d4-a716-446655440028', 'DE', 'uni-tuebingen', 48.5379, 9.0587, 'Public', 110, 'https://www.uni-tuebingen.de', '{"founded": 1477, "students": 28000}'),

-- Freiburg Universities
('650e8400-e29b-41d4-a716-446655440019', 'University of Freiburg', 'Freiburg im Breisgau', '550e8400-e29b-41d4-a716-446655440029', 'DE', 'uni-freiburg', 47.9941, 7.8509, 'Public', 120, 'https://www.uni-freiburg.de', '{"founded": 1457, "students": 25000}'),

-- RWTH Aachen
('650e8400-e29b-41d4-a716-446655440020', 'RWTH Aachen University', 'Aachen', '550e8400-e29b-41d4-a716-446655440033', 'DE', 'rwth-aachen', 50.7802, 6.0678, 'Public', 100, 'https://www.rwth-aachen.de', '{"founded": 1870, "students": 47000}'),

-- TU Darmstadt
('650e8400-e29b-41d4-a716-446655440021', 'Technical University of Darmstadt', 'Darmstadt', '550e8400-e29b-41d4-a716-446655440026', 'DE', 'tu-darmstadt', 49.8748, 8.6594, 'Public', 120, 'https://www.tu-darmstadt.de', '{"founded": 1877, "students": 25000}'),

-- University of Göttingen
('650e8400-e29b-41d4-a716-446655440022', 'University of Göttingen', 'Göttingen', '550e8400-e29b-41d4-a716-446655440030', 'DE', 'uni-goettingen', 51.5587, 9.9350, 'Public', 130, 'https://www.uni-goettingen.de', '{"founded": 1737, "students": 31000}'),

-- University of Bonn
('650e8400-e29b-41d4-a716-446655440023', 'University of Bonn', 'Bonn', '550e8400-e29b-41d4-a716-446655440019', 'DE', 'uni-bonn', 50.7278, 7.0820, 'Public', 130, 'https://www.uni-bonn.de', '{"founded": 1818, "students": 38000}')

ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  ranking = EXCLUDED.ranking,
  external_refs = EXCLUDED.external_refs;