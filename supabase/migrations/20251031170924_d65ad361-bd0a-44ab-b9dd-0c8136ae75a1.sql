-- Create junction table for many-to-many relationship between programs and fields
CREATE TABLE program_fields_of_study (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id uuid NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
  field_of_study_id uuid NOT NULL REFERENCES fields_of_study(id) ON DELETE CASCADE,
  is_primary boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  UNIQUE(program_id, field_of_study_id)
);

-- Add indexes for performance
CREATE INDEX idx_program_fields_program_id ON program_fields_of_study(program_id);
CREATE INDEX idx_program_fields_field_id ON program_fields_of_study(field_of_study_id);

-- Enable RLS
ALTER TABLE program_fields_of_study ENABLE ROW LEVEL SECURITY;

-- Public can view
CREATE POLICY "Public can view program fields" 
  ON program_fields_of_study FOR SELECT 
  USING (true);

-- Admins can manage
CREATE POLICY "Admins can manage program fields" 
  ON program_fields_of_study FOR ALL 
  USING (has_role('admin'::app_role));

-- Migrate existing data from programs.field_of_study_id
INSERT INTO program_fields_of_study (program_id, field_of_study_id, is_primary)
SELECT id, field_of_study_id, true
FROM programs
WHERE field_of_study_id IS NOT NULL;