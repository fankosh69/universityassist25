-- Add support for external email recipients in program shortlists
ALTER TABLE program_shortlists
ADD COLUMN recipient_type TEXT DEFAULT 'internal' CHECK (recipient_type IN ('internal', 'external')),
ADD COLUMN recipient_email TEXT,
ADD COLUMN recipient_name TEXT,
ALTER COLUMN student_profile_id DROP NOT NULL;

-- Add constraint: if internal, must have student_profile_id; if external, must have recipient_email and recipient_name
ALTER TABLE program_shortlists
ADD CONSTRAINT check_recipient_data CHECK (
  (recipient_type = 'internal' AND student_profile_id IS NOT NULL) OR
  (recipient_type = 'external' AND recipient_email IS NOT NULL AND recipient_name IS NOT NULL)
);