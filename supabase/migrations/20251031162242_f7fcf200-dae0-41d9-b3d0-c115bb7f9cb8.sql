-- Add CC recipients column to program_shortlists table
ALTER TABLE program_shortlists 
ADD COLUMN cc_recipients jsonb DEFAULT '[]'::jsonb;

COMMENT ON COLUMN program_shortlists.cc_recipients IS 'Array of CC recipients with name and email: [{name: string, email: string}]';