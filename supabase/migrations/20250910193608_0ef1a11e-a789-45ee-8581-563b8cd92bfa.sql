-- Update programs that have intakes but missing deadlines with reasonable defaults
UPDATE programs 
SET winter_deadline = '2025-07-15'
WHERE winter_intake = true AND winter_deadline IS NULL;

UPDATE programs 
SET summer_deadline = '2025-01-15' 
WHERE summer_intake = true AND summer_deadline IS NULL;

-- Create program_deadline records from existing program data for better structure
INSERT INTO program_deadlines (program_id, intake, application_deadline, notes)
SELECT 
  id as program_id,
  'winter' as intake,
  winter_deadline as application_deadline,
  'Winter semester application deadline' as notes
FROM programs 
WHERE winter_intake = true AND winter_deadline IS NOT NULL;

INSERT INTO program_deadlines (program_id, intake, application_deadline, notes)  
SELECT 
  id as program_id,
  'summer' as intake, 
  summer_deadline as application_deadline,
  'Summer semester application deadline' as notes
FROM programs 
WHERE summer_intake = true AND summer_deadline IS NOT NULL;