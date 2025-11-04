-- Add english_language_requirements column to programs table
ALTER TABLE programs 
ADD COLUMN IF NOT EXISTS english_language_requirements JSONB DEFAULT NULL;

-- Create GIN index for performance on JSONB queries
CREATE INDEX IF NOT EXISTS idx_programs_english_lang_reqs 
ON programs USING GIN (english_language_requirements);

-- Pre-populate existing English-taught programs with default requirements
-- This sets sensible defaults that admins can customize later
UPDATE programs
SET english_language_requirements = jsonb_build_object(
  'accepts_moi', true,
  'ielts_academic', jsonb_build_object(
    'required', true,
    'overall_min', 6.5
  ),
  'toefl_ibt', jsonb_build_object(
    'required', true,
    'overall_min', 80
  ),
  'pte_academic', jsonb_build_object(
    'required', true,
    'overall_min', 58
  )
)
WHERE 'en' = ANY(language_of_instruction)
  AND english_language_requirements IS NULL;

COMMENT ON COLUMN programs.english_language_requirements IS 'English language proof requirements: MOI, IELTS Academic (with optional band scores), TOEFL iBT, PTE Academic';