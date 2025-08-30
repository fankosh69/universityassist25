-- Create storage bucket for CSV ingestion
INSERT INTO storage.buckets (id, name, public)
VALUES ('ingest', 'ingest', false);

-- Create RLS policies for the ingest bucket
CREATE POLICY "Admin can upload to ingest bucket"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'ingest' AND 
  has_role('admin'::app_role)
);

CREATE POLICY "Admin can view ingest bucket files"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'ingest' AND 
  has_role('admin'::app_role)
);

CREATE POLICY "Admin can delete ingest bucket files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'ingest' AND 
  has_role('admin'::app_role)
);