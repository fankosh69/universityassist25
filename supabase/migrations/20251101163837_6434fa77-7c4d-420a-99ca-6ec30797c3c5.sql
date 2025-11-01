-- Add rich content fields to regions table
ALTER TABLE public.regions
ADD COLUMN IF NOT EXISTS hero_image_url TEXT,
ADD COLUMN IF NOT EXISTS hashtags TEXT[],
ADD COLUMN IF NOT EXISTS welcome_text TEXT,
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS highlights TEXT,
ADD COLUMN IF NOT EXISTS gallery_images JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS fun_facts JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS total_universities INTEGER,
ADD COLUMN IF NOT EXISTS total_students INTEGER,
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Add comment
COMMENT ON TABLE public.regions IS 'German federal states (Bundesländer) with rich content for region pages';