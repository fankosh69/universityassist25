-- Sample data for cities
INSERT INTO public.cities (id, name, slug, lat, lng, country_code, state, metadata) VALUES
  ('c1a1a1a1-b2b2-c3c3-d4d4-e5e5e5e5e5e5', 'Berlin', 'berlin', 52.5200, 13.4050, 'DE', 'Berlin', '{"population": 3700000, "description": "Capital city of Germany and major academic hub"}'),
  ('c2a2a2a2-b2b2-c3c3-d4d4-e5e5e5e5e5e5', 'Munich', 'munich', 48.1351, 11.5820, 'DE', 'Bavaria', '{"population": 1500000, "description": "Bavarian capital known for technology and research"}'),
  ('c3a3a3a3-b2b2-c3c3-d4d4-e5e5e5e5e5e5', 'Hamburg', 'hamburg', 53.5511, 9.9937, 'DE', 'Hamburg', '{"population": 1900000, "description": "Major port city and media center"}'),
  ('c4a4a4a4-b2b2-c3c3-d4d4-e5e5e5e5e5e5', 'Frankfurt', 'frankfurt', 50.1109, 8.6821, 'DE', 'Hesse', '{"population": 750000, "description": "Financial capital of Germany"}'),
  ('c5a5a5a5-b2b2-c3c3-d4d4-e5e5e5e5e5e5', 'Stuttgart', 'stuttgart', 48.7758, 9.1829, 'DE', 'Baden-Württemberg', '{"population": 630000, "description": "Automotive and engineering hub"}')
ON CONFLICT (id) DO NOTHING;

-- Sample data for universities
INSERT INTO public.universities (id, name, city, slug, lat, lng, website, type, city_id, logo_url, ranking) VALUES
  ('u1a1a1a1-b2b2-c3c3-d4d4-e5e5e5e5e5e5', 'Humboldt University of Berlin', 'Berlin', 'humboldt-university-berlin', 52.5186, 13.3936, 'https://www.hu-berlin.de', 'Public', 'c1a1a1a1-b2b2-c3c3-d4d4-e5e5e5e5e5e5', '/logos/humboldt.png', 1),
  ('u2a2a2a2-b2b2-c3c3-d4d4-e5e5e5e5e5e5', 'Technical University of Munich', 'Munich', 'technical-university-munich', 48.1497, 11.5677, 'https://www.tum.de', 'Public', 'c2a2a2a2-b2b2-c3c3-d4d4-e5e5e5e5e5e5', '/logos/tum.png', 2),
  ('u3a3a3a3-b2b2-c3c3-d4d4-e5e5e5e5e5e5', 'University of Hamburg', 'Hamburg', 'university-hamburg', 53.5631, 9.9878, 'https://www.uni-hamburg.de', 'Public', 'c3a3a3a3-b2b2-c3c3-d4d4-e5e5e5e5e5e5', '/logos/hamburg.png', 3),
  ('u4a4a4a4-b2b2-c3c3-d4d4-e5e5e5e5e5e5', 'Goethe University Frankfurt', 'Frankfurt', 'goethe-university-frankfurt', 50.1280, 8.6685, 'https://www.uni-frankfurt.de', 'Public', 'c4a4a4a4-b2b2-c3c3-d4d4-e5e5e5e5e5e5', '/logos/goethe.png', 4),
  ('u5a5a5a5-b2b2-c3c3-d4d4-e5e5e5e5e5e5', 'University of Stuttgart', 'Stuttgart', 'university-stuttgart', 48.7445, 9.0989, 'https://www.uni-stuttgart.de', 'Public', 'c5a5a5a5-b2b2-c3c3-d4d4-e5e5e5e5e5e5', '/logos/stuttgart.png', 5)
ON CONFLICT (id) DO NOTHING;

-- Sample data for programs
INSERT INTO public.programs (id, name, university_id, degree_type, degree_level, field_of_study, duration_semesters, language_of_instruction, tuition_fees, ects_credits, uni_assist_required, slug, minimum_gpa, description) VALUES
  ('p1a1a1a1-b2b2-c3c3-d4d4-e5e5e5e5e5e5', 'Computer Science', 'u1a1a1a1-b2b2-c3c3-d4d4-e5e5e5e5e5e5', 'Bachelor of Science', 'bachelor', 'Computer Science', 6, ARRAY['en'], 0, 180, true, 'computer-science-berlin', 2.5, 'Comprehensive computer science program covering algorithms, software engineering, and AI'),
  ('p2a2a2a2-b2b2-c3c3-d4d4-e5e5e5e5e5e5', 'Mechanical Engineering', 'u2a2a2a2-b2b2-c3c3-d4d4-e5e5e5e5e5e5', 'Master of Science', 'master', 'Engineering', 4, ARRAY['en', 'de'], 0, 120, true, 'mechanical-engineering-munich', 2.0, 'Advanced mechanical engineering with focus on automotive and aerospace'),
  ('p3a3a3a3-b2b2-c3c3-d4d4-e5e5e5e5e5e5', 'International Business', 'u3a3a3a3-b2b2-c3c3-d4d4-e5e5e5e5e5e5', 'Master of Business Administration', 'master', 'Business', 4, ARRAY['en'], 15000, 120, false, 'international-business-hamburg', 2.3, 'MBA program with focus on international markets and trade'),
  ('p4a4a4a4-b2b2-c3c3-d4d4-e5e5e5e5e5e5', 'Economics', 'u4a4a4a4-b2b2-c3c3-d4d4-e5e5e5e5e5e5', 'Bachelor of Arts', 'bachelor', 'Economics', 6, ARRAY['de'], 0, 180, true, 'economics-frankfurt', 2.7, 'Economics program with emphasis on financial markets'),
  ('p5a5a5a5-b2b2-c3c3-d4d4-e5e5e5e5e5e5', 'Automotive Engineering', 'u5a5a5a5-b2b2-c3c3-d4d4-e5e5e5e5e5e5', 'Master of Engineering', 'master', 'Engineering', 4, ARRAY['en', 'de'], 1500, 120, true, 'automotive-engineering-stuttgart', 2.1, 'Specialized automotive engineering program with industry partnerships')
ON CONFLICT (id) DO NOTHING;

-- Sample application periods
INSERT INTO public.application_periods (id, program_id, intake_season, intake_year, application_start_date, application_end_date, semester_start_date) VALUES
  ('ap1a1a1a-b2b2-c3c3-d4d4-e5e5e5e5e5e5', 'p1a1a1a1-b2b2-c3c3-d4d4-e5e5e5e5e5e5', 'winter', 2025, '2024-12-01', '2025-03-15', '2025-10-01'),
  ('ap2a2a2a-b2b2-c3c3-d4d4-e5e5e5e5e5e5', 'p2a2a2a2-b2b2-c3c3-d4d4-e5e5e5e5e5e5', 'summer', 2025, '2024-12-01', '2025-01-31', '2025-04-01'),
  ('ap3a3a3a-b2b2-c3c3-d4d4-e5e5e5e5e5e5', 'p3a3a3a3-b2b2-c3c3-d4d4-e5e5e5e5e5e5', 'winter', 2025, '2025-01-01', '2025-06-30', '2025-10-01'),
  ('ap4a4a4a-b2b2-c3c3-d4d4-e5e5e5e5e5e5', 'p4a4a4a4-b2b2-c3c3-d4d4-e5e5e5e5e5e5', 'winter', 2025, '2024-11-01', '2025-02-28', '2025-10-01'),
  ('ap5a5a5a-b2b2-c3c3-d4d4-e5e5e5e5e5e5', 'p5a5a5a5-b2b2-c3c3-d4d4-e5e5e5e5e5e5', 'summer', 2025, '2024-12-15', '2025-02-15', '2025-04-01')
ON CONFLICT (id) DO NOTHING;

-- Sample program requirements
INSERT INTO public.program_requirements (id, program_id, requirement_type, details) VALUES
  ('pr1a1a1a-b2b2-c3c3-d4d4-e5e5e5e5e5e5', 'p1a1a1a1-b2b2-c3c3-d4d4-e5e5e5e5e5e5', 'language', '{"level": "B2", "test_types": ["IELTS", "TOEFL"], "min_scores": {"ielts": 6.5, "toefl": 90}}'),
  ('pr2a2a2a-b2b2-c3c3-d4d4-e5e5e5e5e5e5', 'p1a1a1a1-b2b2-c3c3-d4d4-e5e5e5e5e5e5', 'academic', '{"min_gpa": 2.5, "required_subjects": ["Mathematics", "Physics"], "bachelor_degree": true}'),
  ('pr3a3a3a-b2b2-c3c3-d4d4-e5e5e5e5e5e5', 'p2a2a2a2-b2b2-c3c3-d4d4-e5e5e5e5e5e5', 'language', '{"level": "C1", "test_types": ["IELTS", "TOEFL", "TestDaF"], "min_scores": {"ielts": 7.0, "toefl": 100, "testdaf": 4}}'),
  ('pr4a4a4a-b2b2-c3c3-d4d4-e5e5e5e5e5e5', 'p2a2a2a2-b2b2-c3c3-d4d4-e5e5e5e5e5e5', 'academic', '{"min_gpa": 2.0, "required_degree": "Bachelor in Engineering", "work_experience": "2 years preferred"}')
ON CONFLICT (id) DO NOTHING;