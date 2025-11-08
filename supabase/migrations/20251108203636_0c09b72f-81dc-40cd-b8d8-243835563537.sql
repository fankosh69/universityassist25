-- Fix storage policies to use proper has_role function
DROP POLICY IF EXISTS "Admins can upload logos" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update logos" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete logos" ON storage.objects;

-- Allow admins to upload logos (using has_role function)
CREATE POLICY "Admins can upload logos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'logos' 
  AND has_role('admin'::app_role)
);

-- Allow admins to update logos
CREATE POLICY "Admins can update logos"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'logos' 
  AND has_role('admin'::app_role)
);

-- Allow admins to delete logos
CREATE POLICY "Admins can delete logos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'logos' 
  AND has_role('admin'::app_role)
);