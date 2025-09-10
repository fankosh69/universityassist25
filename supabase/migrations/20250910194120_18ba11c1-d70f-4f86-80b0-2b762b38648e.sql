-- Add application open date fields to programs table
ALTER TABLE programs 
ADD COLUMN winter_application_open_date date,
ADD COLUMN summer_application_open_date date;

-- Set default open dates for existing programs with deadlines
UPDATE programs 
SET winter_application_open_date = '2024-10-01'
WHERE winter_intake = true AND winter_deadline IS NOT NULL;

UPDATE programs 
SET summer_application_open_date = '2024-10-01'  
WHERE summer_intake = true AND summer_deadline IS NOT NULL;