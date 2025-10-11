-- Part 1: Database Schema Extensions for Phase 1

-- 1.1 Sales Pipeline & Lead Management

-- Add customizable sales pipeline stages
CREATE TABLE IF NOT EXISTS public.sales_pipeline_stages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  stage_order INTEGER NOT NULL,
  is_active BOOLEAN DEFAULT true,
  color_hex TEXT DEFAULT '#6366f1',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Insert default stages
INSERT INTO public.sales_pipeline_stages (name, stage_order, color_hex) VALUES
  ('New Lead', 1, '#6366f1'),
  ('Contacted (Phone Call)', 2, '#8b5cf6'),
  ('Contacted (WhatsApp)', 3, '#a855f7'),
  ('Qualified', 4, '#10b981'),
  ('Proposal Sent', 5, '#f59e0b'),
  ('Negotiation', 6, '#f97316'),
  ('Won (Applicant)', 7, '#22c55e'),
  ('Lost (Not Interested)', 8, '#ef4444'),
  ('Lost (Interested in a different field or country)', 9, '#f87171')
ON CONFLICT (name) DO NOTHING;

-- Sales leads table (links profiles to sales team members)
CREATE TABLE IF NOT EXISTS public.sales_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  assigned_to UUID REFERENCES public.profiles(id), -- Sales team member
  current_stage_id UUID REFERENCES public.sales_pipeline_stages(id),
  lead_source TEXT,
  notes JSONB DEFAULT '[]'::jsonb,
  last_contact_date TIMESTAMP WITH TIME ZONE,
  next_follow_up TIMESTAMP WITH TIME ZONE,
  evaluation_required BOOLEAN DEFAULT false, -- Sales marks this
  evaluation_status TEXT CHECK (evaluation_status IN ('pending', 'qualified_public', 'qualified_private', 'rejected')),
  evaluated_by UUID REFERENCES public.profiles(id), -- Admissions team member
  evaluated_at TIMESTAMP WITH TIME ZONE,
  payment_enabled BOOLEAN DEFAULT false, -- Controlled by admissions qualification
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(profile_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_sales_leads_assigned_to ON public.sales_leads(assigned_to);
CREATE INDEX IF NOT EXISTS idx_sales_leads_stage ON public.sales_leads(current_stage_id);
CREATE INDEX IF NOT EXISTS idx_sales_leads_evaluation ON public.sales_leads(evaluation_required, evaluation_status);

-- 1.2 Enhanced Application Tracking

-- Extend user_applications table with admissions tracking
ALTER TABLE public.user_applications 
  ADD COLUMN IF NOT EXISTS assigned_admissions_officer UUID REFERENCES public.profiles(id),
  ADD COLUMN IF NOT EXISTS application_notes JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS last_reminder_sent TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS reminders_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS documents_verified BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS admissions_decision TEXT CHECK (admissions_decision IN ('pending', 'approved', 'rejected', 'waitlisted')),
  ADD COLUMN IF NOT EXISTS admissions_decision_date TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS admissions_decision_notes TEXT;

CREATE INDEX IF NOT EXISTS idx_applications_admissions_officer ON public.user_applications(assigned_admissions_officer);

-- 1.3 Invoices & Contracts

-- Invoices table
CREATE TABLE IF NOT EXISTS public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number TEXT NOT NULL UNIQUE,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  sales_lead_id UUID REFERENCES public.sales_leads(id),
  service_package_id UUID REFERENCES public.service_packages(id),
  amount_egp DECIMAL(10,2) NOT NULL,
  amount_eur DECIMAL(10,2),
  currency TEXT DEFAULT 'EGP',
  status TEXT CHECK (status IN ('draft', 'sent', 'paid', 'overdue', 'cancelled')) DEFAULT 'draft',
  issued_by UUID REFERENCES public.profiles(id), -- Sales team member
  issued_at TIMESTAMP WITH TIME ZONE,
  due_date DATE,
  paid_at TIMESTAMP WITH TIME ZONE,
  payment_method TEXT, -- card, bank_transfer, instapay
  paymob_transaction_id TEXT,
  invoice_data JSONB DEFAULT '{}'::jsonb, -- Line items, terms, etc.
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_invoices_profile ON public.invoices(profile_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON public.invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_sales_lead ON public.invoices(sales_lead_id);

-- Contracts table (links to existing contract templates)
CREATE TABLE IF NOT EXISTS public.contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_number TEXT NOT NULL UNIQUE,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  sales_lead_id UUID REFERENCES public.sales_leads(id),
  service_package_id UUID REFERENCES public.service_packages(id),
  contract_template_url TEXT, -- Link to contract template in storage
  signed_contract_url TEXT, -- Link to signed contract in storage
  status TEXT CHECK (status IN ('draft', 'sent', 'signed', 'cancelled')) DEFAULT 'draft',
  sent_by UUID REFERENCES public.profiles(id), -- Sales team member
  sent_at TIMESTAMP WITH TIME ZONE,
  signed_at TIMESTAMP WITH TIME ZONE,
  signature_ip TEXT,
  contract_data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_contracts_profile ON public.contracts(profile_id);
CREATE INDEX IF NOT EXISTS idx_contracts_status ON public.contracts(status);
CREATE INDEX IF NOT EXISTS idx_contracts_sales_lead ON public.contracts(sales_lead_id);

-- 1.4 HubSpot Sync Logging

-- HubSpot sync log table
CREATE TABLE IF NOT EXISTS public.hubspot_sync_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  hubspot_contact_id TEXT,
  sync_type TEXT CHECK (sync_type IN ('signup', 'profile_update', 'application_submission', 'manual')),
  sync_status TEXT CHECK (sync_status IN ('pending', 'success', 'failed')) DEFAULT 'pending',
  request_data JSONB,
  response_data JSONB,
  error_message TEXT,
  synced_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_hubspot_sync_profile ON public.hubspot_sync_log(profile_id);
CREATE INDEX IF NOT EXISTS idx_hubspot_sync_status ON public.hubspot_sync_log(sync_status);
CREATE INDEX IF NOT EXISTS idx_hubspot_sync_type ON public.hubspot_sync_log(sync_type);

-- 1.5 Triggers for updated_at columns

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Apply triggers to new tables
DROP TRIGGER IF EXISTS trigger_sales_pipeline_stages_updated_at ON public.sales_pipeline_stages;
CREATE TRIGGER trigger_sales_pipeline_stages_updated_at
  BEFORE UPDATE ON public.sales_pipeline_stages
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trigger_sales_leads_updated_at ON public.sales_leads;
CREATE TRIGGER trigger_sales_leads_updated_at
  BEFORE UPDATE ON public.sales_leads
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trigger_invoices_updated_at ON public.invoices;
CREATE TRIGGER trigger_invoices_updated_at
  BEFORE UPDATE ON public.invoices
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trigger_contracts_updated_at ON public.contracts;
CREATE TRIGGER trigger_contracts_updated_at
  BEFORE UPDATE ON public.contracts
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 1.6 RLS Policies

-- Sales Pipeline Stages (Admin only manages stages)
ALTER TABLE public.sales_pipeline_stages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage pipeline stages" ON public.sales_pipeline_stages;
CREATE POLICY "Admins can manage pipeline stages"
ON public.sales_pipeline_stages FOR ALL
USING (has_role('admin'::app_role));

DROP POLICY IF EXISTS "Sales and admins can view stages" ON public.sales_pipeline_stages;
CREATE POLICY "Sales and admins can view stages"
ON public.sales_pipeline_stages FOR SELECT
USING (
  has_role('admin'::app_role) OR 
  has_role('company_sales'::app_role)
);

-- Sales Leads
ALTER TABLE public.sales_leads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Sales team can manage assigned leads" ON public.sales_leads;
CREATE POLICY "Sales team can manage assigned leads"
ON public.sales_leads FOR ALL
USING (
  auth.uid() = assigned_to OR 
  has_role('admin'::app_role)
);

DROP POLICY IF EXISTS "Admissions can view leads marked for evaluation" ON public.sales_leads;
CREATE POLICY "Admissions can view leads marked for evaluation"
ON public.sales_leads FOR SELECT
USING (
  has_role('company_admissions'::app_role) OR 
  has_role('admin'::app_role)
);

DROP POLICY IF EXISTS "Admissions can update evaluation status" ON public.sales_leads;
CREATE POLICY "Admissions can update evaluation status"
ON public.sales_leads FOR UPDATE
USING (
  has_role('company_admissions'::app_role) OR 
  has_role('admin'::app_role)
);

DROP POLICY IF EXISTS "Students can view own lead status" ON public.sales_leads;
CREATE POLICY "Students can view own lead status"
ON public.sales_leads FOR SELECT
USING (auth.uid() = profile_id);

-- Invoices
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Sales and admins can manage invoices" ON public.invoices;
CREATE POLICY "Sales and admins can manage invoices"
ON public.invoices FOR ALL
USING (
  has_role('company_sales'::app_role) OR 
  has_role('admin'::app_role)
);

DROP POLICY IF EXISTS "Students can view own invoices" ON public.invoices;
CREATE POLICY "Students can view own invoices"
ON public.invoices FOR SELECT
USING (auth.uid() = profile_id);

-- Contracts
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Sales and admins can manage contracts" ON public.contracts;
CREATE POLICY "Sales and admins can manage contracts"
ON public.contracts FOR ALL
USING (
  has_role('company_sales'::app_role) OR 
  has_role('admin'::app_role)
);

DROP POLICY IF EXISTS "Students can view own contracts" ON public.contracts;
CREATE POLICY "Students can view own contracts"
ON public.contracts FOR SELECT
USING (auth.uid() = profile_id);

DROP POLICY IF EXISTS "Students can update signed contracts" ON public.contracts;
CREATE POLICY "Students can update signed contracts"
ON public.contracts FOR UPDATE
USING (auth.uid() = profile_id AND status = 'sent')
WITH CHECK (status = 'signed' AND signed_at IS NOT NULL);

-- HubSpot Sync Log (Admin and system only)
ALTER TABLE public.hubspot_sync_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view hubspot sync log" ON public.hubspot_sync_log;
CREATE POLICY "Admins can view hubspot sync log"
ON public.hubspot_sync_log FOR SELECT
USING (has_role('admin'::app_role));

DROP POLICY IF EXISTS "System can insert sync logs" ON public.hubspot_sync_log;
CREATE POLICY "System can insert sync logs"
ON public.hubspot_sync_log FOR INSERT
WITH CHECK (true); -- Allow edge functions to insert

-- Comment on tables for documentation
COMMENT ON TABLE public.sales_pipeline_stages IS 'Customizable sales pipeline stages for lead management';
COMMENT ON TABLE public.sales_leads IS 'Sales leads with pipeline tracking and evaluation workflow';
COMMENT ON TABLE public.invoices IS 'Invoice management for service packages with Paymob integration';
COMMENT ON TABLE public.contracts IS 'Contract management with digital signing workflow';
COMMENT ON TABLE public.hubspot_sync_log IS 'Audit log for HubSpot contact synchronization';