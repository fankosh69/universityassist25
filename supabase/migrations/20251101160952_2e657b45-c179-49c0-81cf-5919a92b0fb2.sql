-- Add new fields to cities table for enhanced city pages
ALTER TABLE public.cities
ADD COLUMN IF NOT EXISTS hero_image_url text,
ADD COLUMN IF NOT EXISTS hashtags text[],
ADD COLUMN IF NOT EXISTS welcome_text text,
ADD COLUMN IF NOT EXISTS living_text text,
ADD COLUMN IF NOT EXISTS student_count integer,
ADD COLUMN IF NOT EXISTS tips text,
ADD COLUMN IF NOT EXISTS gallery_images jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS fun_facts jsonb DEFAULT '[]'::jsonb;

-- Add comments for documentation
COMMENT ON COLUMN public.cities.hero_image_url IS 'Main hero image URL for city page (1920x800px recommended)';
COMMENT ON COLUMN public.cities.hashtags IS 'Array of hashtags for the city (e.g., #RomanCity, #Carnival)';
COMMENT ON COLUMN public.cities.welcome_text IS 'Rich welcome text introducing the city (2-3 paragraphs)';
COMMENT ON COLUMN public.cities.living_text IS 'Description of living in the city for students';
COMMENT ON COLUMN public.cities.student_count IS 'Total number of students in the city';
COMMENT ON COLUMN public.cities.tips IS 'Student tips and insider recommendations';
COMMENT ON COLUMN public.cities.gallery_images IS 'Array of gallery images with structure: [{"url": "...", "caption": "...", "credit": "..."}]';
COMMENT ON COLUMN public.cities.fun_facts IS 'Array of fun facts about the city with structure: [{"title": "...", "description": "..."}]';