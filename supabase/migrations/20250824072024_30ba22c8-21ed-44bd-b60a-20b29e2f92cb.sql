-- Insert sample data for University Assist (Free Plan)

-- Sample cities
INSERT INTO public.cities (id, name, country_code, state, slug, lat, lng, metadata, search_doc) VALUES 
('1', 'Berlin', 'DE', 'Berlin', 'berlin', 52.5200, 13.4050, '{"population": 3669491, "description": "Capital and largest city of Germany"}', '{"keywords": ["capital", "technology", "startup hub", "universities"]}'),
('2', 'Munich', 'DE', 'Bavaria', 'munich', 48.1351, 11.5820, '{"population": 1488202, "description": "Capital of Bavaria, major economic center"}', '{"keywords": ["bavaria", "oktoberfest", "technology", "automotive"]}'),
('3', 'Hamburg', 'DE', 'Hamburg', 'hamburg', 53.5511, 9.9937, '{"population": 1899160, "description": "Major port city and media hub"}', '{"keywords": ["port", "media", "maritime", "logistics"]}')
ON CONFLICT (id) DO NOTHING;

-- Sample universities
INSERT INTO public.universities (id, name, city, city_id, country_code, slug, lat, lng, type, ranking, website, external_refs) VALUES 
('1', 'Technical University of Berlin', 'Berlin', '1', 'DE', 'tu-berlin', 52.5125, 13.3269, 'Public', 150, 'https://www.tu-berlin.de', '{"daad_id": "tu_berlin_001"}'),
('2', 'Ludwig Maximilian University of Munich', 'Munich', '2', 'DE', 'lmu-munich', 48.1500, 11.5800, 'Public', 60, 'https://www.lmu.de', '{"daad_id": "lmu_munich_001"}'),
('3', 'University of Hamburg', 'Hamburg', '3', 'DE', 'uni-hamburg', 53.5676, 9.9856, 'Public', 200, 'https://www.uni-hamburg.de', '{"daad_id": "uni_hamburg_001"}')
ON CONFLICT (id) DO NOTHING;

-- Sample programs
INSERT INTO public.programs (id, university_id, name, field_of_study, degree_type, degree_level, duration_semesters, language_requirements, language_of_instruction, minimum_gpa, tuition_fees, ects_credits, uni_assist_required, delivery_mode, published, slug, country_code, description, prerequisites, metadata) VALUES 
('1', '1', 'Computer Science', 'Computer Science', 'Bachelor', 'bachelor', 6, '["German B2", "English B2"]', '["de", "en"]', 2.5, 0, 180, true, 'on_campus', true, 'computer-science-bachelor-tu-berlin', 'DE', 'Comprehensive computer science program covering algorithms, software engineering, and system design.', '["Mathematics", "Physics"]', '{"popularity_rank": 1, "application_difficulty": "high"}'),
('2', '2', 'Business Administration', 'Business', 'Master', 'master', 4, '["German C1", "English C1"]', '["de", "en"]', 2.0, 0, 120, false, 'on_campus', true, 'business-administration-master-lmu-munich', 'DE', 'Advanced business program focusing on international management and strategy.', '["Bachelor in Business or related field", "Work experience preferred"]', '{"popularity_rank": 2, "application_difficulty": "medium"}'),
('3', '1', 'Mechanical Engineering', 'Engineering', 'Bachelor', 'bachelor', 7, '["German C1"]', '["de"]', 2.8, 350, 210, true, 'on_campus', true, 'mechanical-engineering-bachelor-tu-berlin', 'DE', 'Traditional engineering program with focus on automotive and manufacturing.', '["Mathematics", "Physics", "Chemistry"]', '{"popularity_rank": 3, "application_difficulty": "high"}'),
('4', '3', 'International Relations', 'Political Science', 'Master', 'master', 4, '["German B2", "English C1"]', '["de", "en"]', 2.3, 0, 120, false, 'on_campus', true, 'international-relations-master-uni-hamburg', 'DE', 'Interdisciplinary program combining politics, economics, and cultural studies.', '["Bachelor in Social Sciences or related field"]', '{"popularity_rank": 4, "application_difficulty": "medium"}')
ON CONFLICT (id) DO NOTHING;

-- Sample program requirements
INSERT INTO public.program_requirements (id, program_id, requirement_type, details) VALUES 
('1', '1', 'gpa', '{"min_gpa_de": 2.5, "description": "Minimum German GPA of 2.5"}'),
('2', '1', 'language', '{"language": "german", "min_level": "B2", "accepted_tests": ["TestDaF", "DSH", "Goethe-Zertifikat"], "description": "German proficiency at B2 level"}'),
('3', '1', 'ects', '{"min_ects": 180, "description": "Minimum 180 ECTS from previous studies"}'),
('4', '2', 'gpa', '{"min_gpa_de": 2.0, "description": "Minimum German GPA of 2.0"}'),
('5', '2', 'language', '{"language": "german", "min_level": "C1", "accepted_tests": ["TestDaF", "DSH", "Goethe-Zertifikat"], "description": "German proficiency at C1 level"}')
ON CONFLICT (id) DO NOTHING;

-- Sample program deadlines  
INSERT INTO public.program_deadlines (id, program_id, intake, application_deadline, notes) VALUES 
('1', '1', 'winter', '2024-07-15', 'Early application recommended for international students'),
('2', '2', 'winter', '2024-06-30', 'Portfolio submission required'),
('3', '3', 'winter', '2024-07-31', 'Uni-assist application required'),
('4', '4', 'winter', '2024-08-15', 'Statement of purpose required'),
('5', '2', 'summer', '2024-01-15', 'Limited places available'),
('6', '4', 'summer', '2024-02-28', 'Rolling admissions')
ON CONFLICT (id) DO NOTHING;