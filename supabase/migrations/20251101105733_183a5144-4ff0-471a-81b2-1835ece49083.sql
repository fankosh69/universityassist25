-- Add tuition fee structure columns to programs table
ALTER TABLE programs 
ADD COLUMN IF NOT EXISTS tuition_fee_structure TEXT DEFAULT 'semester' CHECK (tuition_fee_structure IN ('monthly', 'semester', 'yearly')),
ADD COLUMN IF NOT EXISTS tuition_amount NUMERIC DEFAULT 0;

-- Migrate existing semester_fees data to new structure
UPDATE programs 
SET tuition_amount = semester_fees,
    tuition_fee_structure = 'semester'
WHERE tuition_amount = 0 OR tuition_amount IS NULL;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_programs_tuition_structure ON programs(tuition_fee_structure);

-- Add comment for documentation
COMMENT ON COLUMN programs.tuition_fee_structure IS 'Fee structure: monthly, semester, or yearly';
COMMENT ON COLUMN programs.tuition_amount IS 'Tuition amount in EUR based on the fee structure';