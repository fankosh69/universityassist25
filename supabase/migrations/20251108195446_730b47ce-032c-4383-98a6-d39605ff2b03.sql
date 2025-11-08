-- Add status field to universities table
ALTER TABLE universities 
ADD COLUMN IF NOT EXISTS status text DEFAULT 'published' CHECK (status IN ('draft', 'published'));

-- Add status field to programs table
ALTER TABLE programs 
ADD COLUMN IF NOT EXISTS status text DEFAULT 'published' CHECK (status IN ('draft', 'published'));

-- Create index for faster filtering
CREATE INDEX IF NOT EXISTS idx_universities_status ON universities(status);
CREATE INDEX IF NOT EXISTS idx_programs_status ON programs(status);

-- Update existing universities and programs to have published status
UPDATE universities SET status = 'published' WHERE status IS NULL;
UPDATE programs SET status = 'published' WHERE status IS NULL;