-- Create fields_of_study table for hierarchical taxonomy
CREATE TABLE IF NOT EXISTS public.fields_of_study (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  name_de TEXT,
  name_ar TEXT,
  slug TEXT NOT NULL UNIQUE,
  parent_id UUID REFERENCES public.fields_of_study(id) ON DELETE CASCADE,
  level INTEGER NOT NULL CHECK (level >= 1 AND level <= 3),
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_fields_parent ON public.fields_of_study(parent_id);
CREATE INDEX idx_fields_level ON public.fields_of_study(level);
CREATE INDEX idx_fields_slug ON public.fields_of_study(slug);
CREATE INDEX idx_fields_active ON public.fields_of_study(is_active) WHERE is_active = true;

-- Add field_of_study_id to programs table
ALTER TABLE public.programs 
ADD COLUMN IF NOT EXISTS field_of_study_id UUID REFERENCES public.fields_of_study(id);

CREATE INDEX IF NOT EXISTS idx_programs_field_of_study_id ON public.programs(field_of_study_id);

-- Function to get all descendant IDs of a field (recursive)
CREATE OR REPLACE FUNCTION public.get_field_descendants(field_id UUID)
RETURNS TABLE(descendant_id UUID) AS $$
  WITH RECURSIVE descendants AS (
    SELECT id FROM public.fields_of_study WHERE id = field_id
    UNION
    SELECT f.id FROM public.fields_of_study f
    INNER JOIN descendants d ON f.parent_id = d.id
  )
  SELECT id AS descendant_id FROM descendants WHERE id != field_id;
$$ LANGUAGE SQL STABLE;

-- Function to count programs by field (including descendants)
CREATE OR REPLACE FUNCTION public.count_programs_by_field(field_id UUID)
RETURNS INTEGER AS $$
  SELECT COUNT(*)::INTEGER
  FROM public.programs p
  WHERE p.field_of_study_id = field_id
     OR p.field_of_study_id IN (SELECT descendant_id FROM public.get_field_descendants(field_id))
$$ LANGUAGE SQL STABLE;

-- Trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION public.update_fields_of_study_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_fields_of_study_updated_at
BEFORE UPDATE ON public.fields_of_study
FOR EACH ROW
EXECUTE FUNCTION public.update_fields_of_study_updated_at();

-- Insert initial Level 1 fields (main categories)
INSERT INTO public.fields_of_study (name, name_de, slug, level, sort_order) VALUES
('Engineering Sciences', 'Ingenieurwissenschaften', 'engineering-sciences', 1, 1),
('Mathematics, Natural Sciences', 'Mathematik, Naturwissenschaften', 'mathematics-natural-sciences', 1, 2),
('Medicine, Health Sciences', 'Medizin, Gesundheitswissenschaften', 'medicine-health-sciences', 1, 3),
('Agricultural, Forestry and Nutritional Sciences', 'Agrar-, Forst- und Ernährungswissenschaften', 'agricultural-forestry-nutritional-sciences', 1, 4),
('Humanities and Social Sciences', 'Rechts-, Wirtschafts- und Sozialwissenschaften', 'humanities-social-sciences', 1, 5),
('Language and Cultural Studies', 'Sprach- und Kulturwissenschaften', 'language-cultural-studies', 1, 6),
('Art, Music, Design', 'Kunst, Musik, Design', 'art-music-design', 1, 7),
('Teaching Degrees', 'Lehramtsstudiengänge', 'teaching-degrees', 1, 8)
ON CONFLICT (slug) DO NOTHING;

-- Insert Level 2 fields for Engineering Sciences
WITH eng_parent AS (SELECT id FROM public.fields_of_study WHERE slug = 'engineering-sciences')
INSERT INTO public.fields_of_study (name, name_de, slug, parent_id, level, sort_order)
SELECT 'Mechanical Engineering', 'Maschinenbau', 'mechanical-engineering', eng_parent.id, 2, 1 FROM eng_parent
UNION ALL
SELECT 'Electrical Engineering', 'Elektrotechnik', 'electrical-engineering', eng_parent.id, 2, 2 FROM eng_parent
UNION ALL
SELECT 'Civil Engineering', 'Bauingenieurwesen', 'civil-engineering', eng_parent.id, 2, 3 FROM eng_parent
UNION ALL
SELECT 'Computer Science', 'Informatik', 'computer-science', eng_parent.id, 2, 4 FROM eng_parent
UNION ALL
SELECT 'Industrial Engineering', 'Wirtschaftsingenieurwesen', 'industrial-engineering', eng_parent.id, 2, 5 FROM eng_parent
UNION ALL
SELECT 'Chemical Engineering', 'Chemieingenieurwesen', 'chemical-engineering', eng_parent.id, 2, 6 FROM eng_parent
UNION ALL
SELECT 'Environmental Engineering', 'Umweltingenieurwesen', 'environmental-engineering', eng_parent.id, 2, 7 FROM eng_parent
ON CONFLICT (slug) DO NOTHING;

-- Insert Level 2 fields for Mathematics, Natural Sciences
WITH math_parent AS (SELECT id FROM public.fields_of_study WHERE slug = 'mathematics-natural-sciences')
INSERT INTO public.fields_of_study (name, name_de, slug, parent_id, level, sort_order)
SELECT 'Mathematics', 'Mathematik', 'mathematics', math_parent.id, 2, 1 FROM math_parent
UNION ALL
SELECT 'Physics', 'Physik', 'physics', math_parent.id, 2, 2 FROM math_parent
UNION ALL
SELECT 'Chemistry', 'Chemie', 'chemistry', math_parent.id, 2, 3 FROM math_parent
UNION ALL
SELECT 'Biology', 'Biologie', 'biology', math_parent.id, 2, 4 FROM math_parent
UNION ALL
SELECT 'Geography', 'Geographie', 'geography', math_parent.id, 2, 5 FROM math_parent
UNION ALL
SELECT 'Geosciences', 'Geowissenschaften', 'geosciences', math_parent.id, 2, 6 FROM math_parent
ON CONFLICT (slug) DO NOTHING;

-- Insert Level 2 fields for Medicine, Health Sciences
WITH med_parent AS (SELECT id FROM public.fields_of_study WHERE slug = 'medicine-health-sciences')
INSERT INTO public.fields_of_study (name, name_de, slug, parent_id, level, sort_order)
SELECT 'Medicine', 'Medizin', 'medicine', med_parent.id, 2, 1 FROM med_parent
UNION ALL
SELECT 'Dentistry', 'Zahnmedizin', 'dentistry', med_parent.id, 2, 2 FROM med_parent
UNION ALL
SELECT 'Pharmacy', 'Pharmazie', 'pharmacy', med_parent.id, 2, 3 FROM med_parent
UNION ALL
SELECT 'Public Health', 'Gesundheitswissenschaften', 'public-health', med_parent.id, 2, 4 FROM med_parent
UNION ALL
SELECT 'Nursing', 'Pflegewissenschaften', 'nursing', med_parent.id, 2, 5 FROM med_parent
ON CONFLICT (slug) DO NOTHING;

-- Insert Level 2 fields for Humanities and Social Sciences
WITH hum_parent AS (SELECT id FROM public.fields_of_study WHERE slug = 'humanities-social-sciences')
INSERT INTO public.fields_of_study (name, name_de, slug, parent_id, level, sort_order)
SELECT 'Business Administration', 'Betriebswirtschaftslehre', 'business-administration', hum_parent.id, 2, 1 FROM hum_parent
UNION ALL
SELECT 'Economics', 'Volkswirtschaftslehre', 'economics', hum_parent.id, 2, 2 FROM hum_parent
UNION ALL
SELECT 'Law', 'Rechtswissenschaften', 'law', hum_parent.id, 2, 3 FROM hum_parent
UNION ALL
SELECT 'Political Science', 'Politikwissenschaften', 'political-science', hum_parent.id, 2, 4 FROM hum_parent
UNION ALL
SELECT 'Sociology', 'Soziologie', 'sociology', hum_parent.id, 2, 5 FROM hum_parent
UNION ALL
SELECT 'Psychology', 'Psychologie', 'psychology', hum_parent.id, 2, 6 FROM hum_parent
UNION ALL
SELECT 'Social Work', 'Soziale Arbeit', 'social-work', hum_parent.id, 2, 7 FROM hum_parent
ON CONFLICT (slug) DO NOTHING;

-- Insert Level 2 fields for Language and Cultural Studies
WITH lang_parent AS (SELECT id FROM public.fields_of_study WHERE slug = 'language-cultural-studies')
INSERT INTO public.fields_of_study (name, name_de, slug, parent_id, level, sort_order)
SELECT 'German Studies', 'Germanistik', 'german-studies', lang_parent.id, 2, 1 FROM lang_parent
UNION ALL
SELECT 'English Studies', 'Anglistik', 'english-studies', lang_parent.id, 2, 2 FROM lang_parent
UNION ALL
SELECT 'History', 'Geschichte', 'history', lang_parent.id, 2, 3 FROM lang_parent
UNION ALL
SELECT 'Philosophy', 'Philosophie', 'philosophy', lang_parent.id, 2, 4 FROM lang_parent
UNION ALL
SELECT 'Linguistics', 'Sprachwissenschaften', 'linguistics', lang_parent.id, 2, 5 FROM lang_parent
ON CONFLICT (slug) DO NOTHING;

-- Insert Level 2 fields for Art, Music, Design
WITH art_parent AS (SELECT id FROM public.fields_of_study WHERE slug = 'art-music-design')
INSERT INTO public.fields_of_study (name, name_de, slug, parent_id, level, sort_order)
SELECT 'Fine Arts', 'Bildende Kunst', 'fine-arts', art_parent.id, 2, 1 FROM art_parent
UNION ALL
SELECT 'Music', 'Musik', 'music', art_parent.id, 2, 2 FROM art_parent
UNION ALL
SELECT 'Design', 'Design', 'design', art_parent.id, 2, 3 FROM art_parent
UNION ALL
SELECT 'Architecture', 'Architektur', 'architecture', art_parent.id, 2, 4 FROM art_parent
ON CONFLICT (slug) DO NOTHING;

-- Insert some Level 3 examples (Mechanical Engineering subfields)
WITH mech_parent AS (SELECT id FROM public.fields_of_study WHERE slug = 'mechanical-engineering')
INSERT INTO public.fields_of_study (name, name_de, slug, parent_id, level, sort_order)
SELECT 'Automotive Engineering', 'Fahrzeugtechnik', 'automotive-engineering', mech_parent.id, 3, 1 FROM mech_parent
UNION ALL
SELECT 'Production Engineering', 'Produktionstechnik', 'production-engineering', mech_parent.id, 3, 2 FROM mech_parent
UNION ALL
SELECT 'Mechatronics', 'Mechatronik', 'mechatronics', mech_parent.id, 3, 3 FROM mech_parent
ON CONFLICT (slug) DO NOTHING;

-- RLS Policies for fields_of_study
ALTER TABLE public.fields_of_study ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view active fields"
ON public.fields_of_study FOR SELECT
USING (is_active = true);

CREATE POLICY "Admins can manage fields"
ON public.fields_of_study FOR ALL
USING (has_role('admin'::app_role));