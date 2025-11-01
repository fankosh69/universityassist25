-- ============================================
-- PHASE 2: University Data Enrichment Schema
-- ============================================

-- Add enriched columns to universities table
ALTER TABLE public.universities
ADD COLUMN IF NOT EXISTS founded_year INTEGER,
ADD COLUMN IF NOT EXISTS student_count INTEGER,
ADD COLUMN IF NOT EXISTS international_student_percentage NUMERIC(5,2),
ADD COLUMN IF NOT EXISTS academic_staff_count INTEGER,
ADD COLUMN IF NOT EXISTS student_staff_ratio NUMERIC(5,2),
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS mission_statement TEXT,
ADD COLUMN IF NOT EXISTS hero_image_url TEXT,
ADD COLUMN IF NOT EXISTS photos JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS virtual_tour_url TEXT,
ADD COLUMN IF NOT EXISTS video_url TEXT,
ADD COLUMN IF NOT EXISTS rankings_data JSONB DEFAULT '{"qs": {"rank": null, "year": null, "score": null}, "the": {"rank": null, "year": null, "score": null}, "arwu": {"rank": null, "year": null, "score": null}, "che": {"rank": null, "year": null, "subjects": []}}'::jsonb,
ADD COLUMN IF NOT EXISTS accreditations TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS awards_recognition JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS notable_alumni TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS research_areas TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS research_output JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS partnerships TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS facilities JSONB DEFAULT '{"libraries": 0, "labs": 0, "sports_centers": 0, "student_union": true, "career_center": true, "international_office": true, "cafeterias": 0}'::jsonb,
ADD COLUMN IF NOT EXISTS accommodation_info JSONB DEFAULT '{"dorms": {"available": false, "price_range": null}, "assistance": false}'::jsonb,
ADD COLUMN IF NOT EXISTS student_organizations_count INTEGER,
ADD COLUMN IF NOT EXISTS clubs_and_societies TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS application_fee_eur NUMERIC(10,2),
ADD COLUMN IF NOT EXISTS semester_dates JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS contact_email TEXT,
ADD COLUMN IF NOT EXISTS contact_phone TEXT,
ADD COLUMN IF NOT EXISTS social_media JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS language_support TEXT[] DEFAULT '{"German", "English"}',
ADD COLUMN IF NOT EXISTS data_quality_score INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_enriched_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS enrichment_source TEXT,
ADD COLUMN IF NOT EXISTS state TEXT;

-- Create university_campuses table
CREATE TABLE IF NOT EXISTS public.university_campuses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  university_id UUID NOT NULL REFERENCES public.universities(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  address TEXT,
  city TEXT NOT NULL,
  postal_code TEXT,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  is_main_campus BOOLEAN DEFAULT false,
  description TEXT,
  student_count INTEGER,
  building_count INTEGER,
  faculties TEXT[] DEFAULT '{}',
  facilities JSONB DEFAULT '{}'::jsonb,
  public_transport JSONB DEFAULT '[]'::jsonb,
  photo_urls JSONB DEFAULT '[]'::jsonb,
  map_embed_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create university_faculties table
CREATE TABLE IF NOT EXISTS public.university_faculties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  university_id UUID NOT NULL REFERENCES public.universities(id) ON DELETE CASCADE,
  campus_id UUID REFERENCES public.university_campuses(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  name_de TEXT,
  name_ar TEXT,
  description TEXT,
  dean_name TEXT,
  contact_email TEXT,
  website_url TEXT,
  programs_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create university_testimonials table
CREATE TABLE IF NOT EXISTS public.university_testimonials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  university_id UUID NOT NULL REFERENCES public.universities(id) ON DELETE CASCADE,
  student_name TEXT NOT NULL,
  student_photo_url TEXT,
  nationality TEXT,
  program_name TEXT,
  testimonial TEXT NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  is_approved BOOLEAN DEFAULT false,
  approved_by UUID REFERENCES public.profiles(id),
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on new tables
ALTER TABLE public.university_campuses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.university_faculties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.university_testimonials ENABLE ROW LEVEL SECURITY;

-- RLS Policies for university_campuses
CREATE POLICY "Public can view campuses"
ON public.university_campuses FOR SELECT
TO public
USING (true);

CREATE POLICY "Admins can manage campuses"
ON public.university_campuses FOR ALL
TO authenticated
USING (has_role('admin'::app_role))
WITH CHECK (has_role('admin'::app_role));

-- RLS Policies for university_faculties
CREATE POLICY "Public can view faculties"
ON public.university_faculties FOR SELECT
TO public
USING (true);

CREATE POLICY "Admins can manage faculties"
ON public.university_faculties FOR ALL
TO authenticated
USING (has_role('admin'::app_role))
WITH CHECK (has_role('admin'::app_role));

-- RLS Policies for university_testimonials
CREATE POLICY "Public can view approved testimonials"
ON public.university_testimonials FOR SELECT
TO public
USING (is_approved = true);

CREATE POLICY "Admins can manage testimonials"
ON public.university_testimonials FOR ALL
TO authenticated
USING (has_role('admin'::app_role))
WITH CHECK (has_role('admin'::app_role));

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_university_campuses_university_id ON public.university_campuses(university_id);
CREATE INDEX IF NOT EXISTS idx_university_faculties_university_id ON public.university_faculties(university_id);
CREATE INDEX IF NOT EXISTS idx_university_testimonials_university_id ON public.university_testimonials(university_id);
CREATE INDEX IF NOT EXISTS idx_university_testimonials_approved ON public.university_testimonials(is_approved) WHERE is_approved = true;

-- Add updated_at triggers
CREATE TRIGGER update_university_campuses_updated_at
  BEFORE UPDATE ON public.university_campuses
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_university_faculties_updated_at
  BEFORE UPDATE ON public.university_faculties
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Comments for documentation
COMMENT ON TABLE public.university_campuses IS 'Physical campus locations for universities';
COMMENT ON TABLE public.university_faculties IS 'Academic faculties/schools within universities';
COMMENT ON TABLE public.university_testimonials IS 'Student testimonials and reviews for universities';
COMMENT ON COLUMN public.universities.data_quality_score IS 'Completeness score 0-100 based on filled fields';
COMMENT ON COLUMN public.universities.rankings_data IS 'Structured rankings from QS, THE, ARWU, CHE';