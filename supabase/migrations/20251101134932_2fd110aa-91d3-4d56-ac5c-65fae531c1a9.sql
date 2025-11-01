-- Add missing enriched columns to universities table
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

-- Add helpful comments
COMMENT ON COLUMN public.universities.data_quality_score IS 'Completeness score 0-100 based on filled fields';
COMMENT ON COLUMN public.universities.rankings_data IS 'Structured rankings from QS, THE, ARWU, CHE';
COMMENT ON COLUMN public.universities.facilities IS 'Campus facilities count and availability';
COMMENT ON COLUMN public.universities.state IS 'German state/Bundesland (e.g., Bavaria, Nordrhein-Westfalen)';