-- Create a dedicated schema for extensions
CREATE SCHEMA IF NOT EXISTS extensions;

-- Move the unaccent extension from public to extensions schema
ALTER EXTENSION unaccent SET SCHEMA extensions;