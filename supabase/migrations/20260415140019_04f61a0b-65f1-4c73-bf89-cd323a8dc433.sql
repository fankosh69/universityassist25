
-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Edge functions can insert webhook logs" ON public.hubspot_webhook_log;

-- Edge functions use service_role key which bypasses RLS, so no INSERT policy needed for them.
-- Add admin insert policy for manual entries if needed
CREATE POLICY "Admins can insert webhook logs"
ON public.hubspot_webhook_log
FOR INSERT
TO authenticated
WITH CHECK (public.has_role('admin'::app_role));
