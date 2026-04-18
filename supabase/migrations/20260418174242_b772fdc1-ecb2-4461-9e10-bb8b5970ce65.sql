-- Restrict listing on public buckets while preserving public HTTP access via CDN.
-- Public buckets serve files at /storage/v1/object/public/<bucket>/<path> regardless of SELECT policies,
-- so removing the broad SELECT policy blocks listing/enumeration without breaking public file access.

DROP POLICY IF EXISTS "Public can view email assets" ON storage.objects;
DROP POLICY IF EXISTS "Public can view logos" ON storage.objects;

-- Allow admins to list/select these objects through the API (e.g. for admin dashboards)
CREATE POLICY "Admins can list email assets"
ON storage.objects
FOR SELECT
USING (bucket_id = 'email-assets' AND has_role('admin'::app_role));

CREATE POLICY "Admins can list logos"
ON storage.objects
FOR SELECT
USING (bucket_id = 'logos' AND has_role('admin'::app_role));