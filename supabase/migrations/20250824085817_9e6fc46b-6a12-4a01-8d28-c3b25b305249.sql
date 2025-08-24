-- Insert universities 
INSERT INTO public.universities (name, city, slug, lat, lng, website, type, ranking) VALUES
  ('Humboldt University of Berlin', 'Berlin', 'humboldt-university-berlin', 52.5186, 13.3936, 'https://www.hu-berlin.de', 'Public', 1),
  ('Technical University of Munich', 'Munich', 'technical-university-munich', 48.1497, 11.5677, 'https://www.tum.de', 'Public', 2),
  ('University of Hamburg', 'Hamburg', 'university-hamburg', 53.5631, 9.9878, 'https://www.uni-hamburg.de', 'Public', 3),
  ('Goethe University Frankfurt', 'Frankfurt', 'goethe-university-frankfurt', 50.1280, 8.6685, 'https://www.uni-frankfurt.de', 'Public', 4),
  ('University of Stuttgart', 'Stuttgart', 'university-stuttgart', 48.7445, 9.0989, 'https://www.uni-stuttgart.de', 'Public', 5);

-- Insert programs with proper enum casting
INSERT INTO public.programs (name, university_id, degree_type, degree_level, field_of_study, duration_semesters, language_of_instruction, tuition_fees, ects_credits, uni_assist_required, slug, minimum_gpa, description, published)
SELECT 
  program_data.name,
  u.id,
  program_data.degree_type,
  program_data.degree_level::degree_level,
  program_data.field_of_study,
  program_data.duration_semesters,
  program_data.language_of_instruction,
  program_data.tuition_fees,
  program_data.ects_credits,
  program_data.uni_assist_required,
  program_data.slug,
  program_data.minimum_gpa,
  program_data.description,
  true
FROM (VALUES
  ('Computer Science', 'Bachelor of Science', 'bachelor', 'Computer Science', 6, ARRAY['en'], 0, 180, true, 'computer-science-berlin', 2.5, 'Comprehensive computer science program covering algorithms, software engineering, and AI', 'humboldt-university-berlin'),
  ('Mechanical Engineering', 'Master of Science', 'master', 'Engineering', 4, ARRAY['en', 'de'], 0, 120, true, 'mechanical-engineering-munich', 2.0, 'Advanced mechanical engineering with focus on automotive and aerospace', 'technical-university-munich'),
  ('International Business', 'Master of Business Administration', 'master', 'Business', 4, ARRAY['en'], 15000, 120, false, 'international-business-hamburg', 2.3, 'MBA program with focus on international markets and trade', 'university-hamburg'),
  ('Economics', 'Bachelor of Arts', 'bachelor', 'Economics', 6, ARRAY['de'], 0, 180, true, 'economics-frankfurt', 2.7, 'Economics program with emphasis on financial markets', 'goethe-university-frankfurt'),
  ('Automotive Engineering', 'Master of Engineering', 'master', 'Engineering', 4, ARRAY['en', 'de'], 1500, 120, true, 'automotive-engineering-stuttgart', 2.1, 'Specialized automotive engineering program with industry partnerships', 'university-stuttgart'),
  ('Data Science', 'Master of Science', 'master', 'Computer Science', 4, ARRAY['en'], 0, 120, true, 'data-science-berlin', 2.4, 'Advanced data science program with machine learning and analytics focus', 'humboldt-university-berlin')
) AS program_data(name, degree_type, degree_level, field_of_study, duration_semesters, language_of_instruction, tuition_fees, ects_credits, uni_assist_required, slug, minimum_gpa, description, university_slug)
JOIN universities u ON u.slug = program_data.university_slug;