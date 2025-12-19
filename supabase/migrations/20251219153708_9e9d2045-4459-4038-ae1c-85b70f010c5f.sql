-- Add instruction language mode enum
CREATE TYPE instruction_language_mode AS ENUM (
  'fully_english',
  'fully_german', 
  'mostly_english',
  'hybrid',
  'either_or'
);

-- Add new columns to programs table
ALTER TABLE programs 
ADD COLUMN IF NOT EXISTS instruction_mode instruction_language_mode DEFAULT 'fully_german',
ADD COLUMN IF NOT EXISTS german_language_requirements JSONB DEFAULT NULL,
ADD COLUMN IF NOT EXISTS winter_deadline_month INTEGER CHECK (winter_deadline_month BETWEEN 1 AND 12),
ADD COLUMN IF NOT EXISTS winter_deadline_day INTEGER CHECK (winter_deadline_day BETWEEN 1 AND 31),
ADD COLUMN IF NOT EXISTS summer_deadline_month INTEGER CHECK (summer_deadline_month BETWEEN 1 AND 12),
ADD COLUMN IF NOT EXISTS summer_deadline_day INTEGER CHECK (summer_deadline_day BETWEEN 1 AND 31),
ADD COLUMN IF NOT EXISTS winter_open_month INTEGER CHECK (winter_open_month BETWEEN 1 AND 12),
ADD COLUMN IF NOT EXISTS winter_open_day INTEGER CHECK (winter_open_day BETWEEN 1 AND 31),
ADD COLUMN IF NOT EXISTS summer_open_month INTEGER CHECK (summer_open_month BETWEEN 1 AND 12),
ADD COLUMN IF NOT EXISTS summer_open_day INTEGER CHECK (summer_open_day BETWEEN 1 AND 31);

-- Migrate existing date data to month/day columns
UPDATE programs 
SET 
  winter_deadline_month = EXTRACT(MONTH FROM winter_deadline::date),
  winter_deadline_day = EXTRACT(DAY FROM winter_deadline::date)
WHERE winter_deadline IS NOT NULL;

UPDATE programs 
SET 
  summer_deadline_month = EXTRACT(MONTH FROM summer_deadline::date),
  summer_deadline_day = EXTRACT(DAY FROM summer_deadline::date)
WHERE summer_deadline IS NOT NULL;

UPDATE programs 
SET 
  winter_open_month = EXTRACT(MONTH FROM winter_application_open_date::date),
  winter_open_day = EXTRACT(DAY FROM winter_application_open_date::date)
WHERE winter_application_open_date IS NOT NULL;

UPDATE programs 
SET 
  summer_open_month = EXTRACT(MONTH FROM summer_application_open_date::date),
  summer_open_day = EXTRACT(DAY FROM summer_application_open_date::date)
WHERE summer_application_open_date IS NOT NULL;

-- Migrate existing language_of_instruction to instruction_mode
UPDATE programs 
SET instruction_mode = 'fully_english'
WHERE language_of_instruction = ARRAY['en'];

UPDATE programs 
SET instruction_mode = 'fully_german'
WHERE language_of_instruction = ARRAY['de'];

UPDATE programs 
SET instruction_mode = 'hybrid'
WHERE language_of_instruction @> ARRAY['en', 'de'];