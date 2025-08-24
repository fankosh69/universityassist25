-- Insert sample data for University Assist with correct PostgreSQL array syntax

-- Sample cities
INSERT INTO public.cities (id, name, country_code, state, slug, lat, lng, metadata, search_doc) VALUES 
('550e8400-e29b-41d4-a716-446655440001', 'Berlin', 'DE', 'Berlin', 'berlin', 52.5200, 13.4050, '{"population": 3669491, "description": "Capital and largest city of Germany"}', '{"keywords": ["capital", "technology", "startup hub", "universities"]}'),
('550e8400-e29b-41d4-a716-446655440002', 'Munich', 'DE', 'Bavaria', 'munich', 48.1351, 11.5820, '{"population": 1488202, "description": "Capital of Bavaria, major economic center"}', '{"keywords": ["bavaria", "oktoberfest", "technology", "automotive"]}'),
('550e8400-e29b-41d4-a716-446655440003', 'Hamburg', 'DE', 'Hamburg', 'hamburg', 53.5511, 9.9937, '{"population": 1899160, "description": "Major port city and media hub"}', '{"keywords": ["port", "media", "maritime", "logistics"]}')
ON CONFLICT (id) DO NOTHING;

-- Sample universities
INSERT INTO public.universities (id, name, city, city_id, country_code, slug, lat, lng, type, ranking, website, external_refs) VALUES 
('550e8400-e29b-41d4-a716-446655440011', 'Technical University of Berlin', 'Berlin', '550e8400-e29b-41d4-a716-446655440001', 'DE', 'tu-berlin', 52.5125, 13.3269, 'Public', 150, 'https://www.tu-berlin.de', '{"daad_id": "tu_berlin_001"}'),
('550e8400-e29b-41d4-a716-446655440012', 'Ludwig Maximilian University of Munich', 'Munich', '550e8400-e29b-41d4-a716-446655440002', 'DE', 'lmu-munich', 48.1500, 11.5800, 'Public', 60, 'https://www.lmu.de', '{"daad_id": "lmu_munich_001"}'),
('550e8400-e29b-41d4-a716-446655440013', 'University of Hamburg', 'Hamburg', '550e8400-e29b-41d4-a716-446655440003', 'DE', 'uni-hamburg', 53.5676, 9.9856, 'Public', 200, 'https://www.uni-hamburg.de', '{"daad_id": "uni_hamburg_001"}')
ON CONFLICT (id) DO NOTHING;

-- Sample programs (using PostgreSQL array syntax with curly braces)
INSERT INTO public.programs (id, university_id, name, field_of_study, degree_type, degree_level, duration_semesters, language_requirements, language_of_instruction, minimum_gpa, tuition_fees, ects_credits, uni_assist_required, delivery_mode, published, slug, country_code, description, prerequisites, metadata) VALUES 
('550e8400-e29b-41d4-a716-446655440021', '550e8400-e29b-41d4-a716-446655440011', 'Computer Science', 'Computer Science', 'Bachelor', 'bachelor', 6, '{"German B2", "English B2"}', '{"de", "en"}', 2.5, 0, 180, true, 'on_campus', true, 'computer-science-bachelor-tu-berlin', 'DE', 'Comprehensive computer science program covering algorithms, software engineering, and system design.', '{"Mathematics", "Physics"}', '{"popularity_rank": 1, "application_difficulty": "high"}'),
('550e8400-e29b-41d4-a716-446655440022', '550e8400-e29b-41d4-a716-446655440012', 'Business Administration', 'Business', 'Master', 'master', 4, '{"German C1", "English C1"}', '{"de", "en"}', 2.0, 0, 120, false, 'on_campus', true, 'business-administration-master-lmu-munich', 'DE', 'Advanced business program focusing on international management and strategy.', '{"Bachelor in Business or related field", "Work experience preferred"}', '{"popularity_rank": 2, "application_difficulty": "medium"}'),
('550e8400-e29b-41d4-a716-446655440023', '550e8400-e29b-41d4-a716-446655440011', 'Mechanical Engineering', 'Engineering', 'Bachelor', 'bachelor', 7, '{"German C1"}', '{"de"}', 2.8, 350, 210, true, 'on_campus', true, 'mechanical-engineering-bachelor-tu-berlin', 'DE', 'Traditional engineering program with focus on automotive and manufacturing.', '{"Mathematics", "Physics", "Chemistry"}', '{"popularity_rank": 3, "application_difficulty": "high"}'),
('550e8400-e29b-41d4-a716-446655440024', '550e8400-e29b-41d4-a716-446655440013', 'International Relations', 'Political Science', 'Master', 'master', 4, '{"German B2", "English C1"}', '{"de", "en"}', 2.3, 0, 120, false, 'on_campus', true, 'international-relations-master-uni-hamburg', 'DE', 'Interdisciplinary program combining politics, economics, and cultural studies.', '{"Bachelor in Social Sciences or related field"}', '{"popularity_rank": 4, "application_difficulty": "medium"}')
ON CONFLICT (id) DO NOTHING;

-- Sample program requirements
INSERT INTO public.program_requirements (id, program_id, requirement_type, details) VALUES 
('550e8400-e29b-41d4-a716-446655440031', '550e8400-e29b-41d4-a716-446655440021', 'gpa', '{"min_gpa_de": 2.5, "description": "Minimum German GPA of 2.5"}'),
('550e8400-e29b-41d4-a716-446655440032', '550e8400-e29b-41d4-a716-446655440021', 'language', '{"language": "german", "min_level": "B2", "accepted_tests": ["TestDaF", "DSH", "Goethe-Zertifikat"], "description": "German proficiency at B2 level"}'),
('550e8400-e29b-41d4-a716-446655440033', '550e8400-e29b-41d4-a716-446655440021', 'ects', '{"min_ects": 180, "description": "Minimum 180 ECTS from previous studies"}'),
('550e8400-e29b-41d4-a716-446655440034', '550e8400-e29b-41d4-a716-446655440022', 'gpa', '{"min_gpa_de": 2.0, "description": "Minimum German GPA of 2.0"}'),
('550e8400-e29b-41d4-a716-446655440035', '550e8400-e29b-41d4-a716-446655440022', 'language', '{"language": "german", "min_level": "C1", "accepted_tests": ["TestDaF", "DSH", "Goethe-Zertifikat"], "description": "German proficiency at C1 level"}')
ON CONFLICT (id) DO NOTHING;

-- Sample program deadlines  
INSERT INTO public.program_deadlines (id, program_id, intake, application_deadline, notes) VALUES 
('550e8400-e29b-41d4-a716-446655440041', '550e8400-e29b-41d4-a716-446655440021', 'winter', '2024-07-15', 'Early application recommended for international students'),
('550e8400-e29b-41d4-a716-446655440042', '550e8400-e29b-41d4-a716-446655440022', 'winter', '2024-06-30', 'Portfolio submission required'),
('550e8400-e29b-41d4-a716-446655440043', '550e8400-e29b-41d4-a716-446655440023', 'winter', '2024-07-31', 'Uni-assist application required'),
('550e8400-e29b-41d4-a716-446655440044', '550e8400-e29b-41d4-a716-446655440024', 'winter', '2024-08-15', 'Statement of purpose required'),
('550e8400-e29b-41d4-a716-446655440045', '550e8400-e29b-41d4-a716-446655440022', 'summer', '2024-01-15', 'Limited places available'),
('550e8400-e29b-41d4-a716-446655440046', '550e8400-e29b-41d4-a716-446655440024', 'summer', '2024-02-28', 'Rolling admissions')
ON CONFLICT (id) DO NOTHING;