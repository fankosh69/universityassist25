
-- Add HubSpot company ID to universities
ALTER TABLE public.universities ADD COLUMN IF NOT EXISTS hubspot_company_id text;
CREATE INDEX IF NOT EXISTS idx_universities_hubspot_company_id ON public.universities (hubspot_company_id) WHERE hubspot_company_id IS NOT NULL;

-- Add HubSpot deal ID to user_applications
ALTER TABLE public.user_applications ADD COLUMN IF NOT EXISTS hubspot_deal_id text;
CREATE INDEX IF NOT EXISTS idx_user_applications_hubspot_deal_id ON public.user_applications (hubspot_deal_id) WHERE hubspot_deal_id IS NOT NULL;

-- Create webhook log table
CREATE TABLE public.hubspot_webhook_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL,
  object_type text,
  object_id text,
  properties jsonb,
  raw_payload jsonb,
  processed boolean DEFAULT false,
  processed_at timestamptz,
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.hubspot_webhook_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view webhook logs"
ON public.hubspot_webhook_log
FOR SELECT
TO authenticated
USING (public.has_role('admin'::app_role));

CREATE POLICY "Edge functions can insert webhook logs"
ON public.hubspot_webhook_log
FOR INSERT
TO authenticated, anon
WITH CHECK (true);
