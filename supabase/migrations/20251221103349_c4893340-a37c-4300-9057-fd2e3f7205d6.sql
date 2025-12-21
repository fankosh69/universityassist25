-- Update historical-documents bucket to 20MB limit
UPDATE storage.buckets 
SET file_size_limit = 20971520  -- 20MB in bytes
WHERE id = 'historical-documents';

-- Update program-documents bucket to 20MB limit
UPDATE storage.buckets 
SET file_size_limit = 20971520  -- 20MB in bytes
WHERE id = 'program-documents';