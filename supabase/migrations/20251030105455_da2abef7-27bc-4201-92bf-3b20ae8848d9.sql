-- Create storage bucket for email assets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'email-assets',
  'email-assets', 
  true,
  5242880, -- 5MB limit
  ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml']
)
ON CONFLICT (id) DO NOTHING;

-- Allow public access to read email assets
CREATE POLICY "Public can view email assets"
ON storage.objects FOR SELECT
USING (bucket_id = 'email-assets');

-- Allow authenticated admins to upload email assets
CREATE POLICY "Admins can upload email assets"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'email-assets' 
  AND (SELECT has_role('admin'::app_role))
);

-- Allow admins to update email assets
CREATE POLICY "Admins can update email assets"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'email-assets' 
  AND (SELECT has_role('admin'::app_role))
);

-- Allow admins to delete email assets  
CREATE POLICY "Admins can delete email assets"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'email-assets' 
  AND (SELECT has_role('admin'::app_role))
);