-- Add application fee columns to programs table
ALTER TABLE programs 
  ADD COLUMN IF NOT EXISTS has_application_fee BOOLEAN DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS application_fee_amount NUMERIC(10,2) DEFAULT NULL;

-- Add comment for clarity
COMMENT ON COLUMN programs.has_application_fee IS 'For direct applications: NULL=not specified, true=has fee, false=no fee. For uni-assist, this is ignored as standard fees apply.';
COMMENT ON COLUMN programs.application_fee_amount IS 'Custom application fee amount in EUR for direct applications. NULL for uni-assist programs.';