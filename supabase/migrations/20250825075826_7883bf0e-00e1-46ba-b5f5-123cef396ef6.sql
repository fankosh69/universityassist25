-- Add control_type column to universities table
ALTER TABLE universities ADD COLUMN IF NOT EXISTS control_type text DEFAULT 'public';

-- Add comment to explain the column
COMMENT ON COLUMN universities.control_type IS 'Type of control: public, private, church';

-- Update existing data based on type field where possible
UPDATE universities 
SET control_type = CASE 
  WHEN type ILIKE '%private%' THEN 'private'
  WHEN type ILIKE '%church%' THEN 'church'
  ELSE 'public'
END;