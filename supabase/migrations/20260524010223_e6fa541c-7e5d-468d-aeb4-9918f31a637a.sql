
-- Tables
CREATE TABLE IF NOT EXISTS public.university_scrape_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  university_id uuid NOT NULL REFERENCES public.universities(id) ON DELETE CASCADE,
  base_urls text[] NOT NULL DEFAULT '{}',
  program_url_patterns text[] NOT NULL DEFAULT '{}',
  exclude_patterns text[] NOT NULL DEFAULT '{}',
  language_mode text NOT NULL DEFAULT 'auto',
  discovery_method text NOT NULL DEFAULT 'map',
  max_depth int NOT NULL DEFAULT 3,
  max_pages int NOT NULL DEFAULT 200,
  wait_for_ms int NOT NULL DEFAULT 0,
  selectors_hint jsonb NOT NULL DEFAULT '{}'::jsonb,
  pdf_link_patterns text[] NOT NULL DEFAULT ARRAY['admission','module','handbook','regulation','studienordnung','pruefungsordnung'],
  extraction_prompt_overrides text,
  cadence text NOT NULL DEFAULT 'monthly',
  enabled boolean NOT NULL DEFAULT true,
  last_run_at timestamptz,
  last_success_at timestamptz,
  next_run_at timestamptz DEFAULT now(),
  health_score numeric(3,2) DEFAULT 1.0,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (university_id)
);
CREATE INDEX IF NOT EXISTS idx_usp_next_run ON public.university_scrape_profiles(next_run_at) WHERE enabled = true;

CREATE TABLE IF NOT EXISTS public.scrape_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid REFERENCES public.university_scrape_profiles(id) ON DELETE CASCADE,
  university_id uuid REFERENCES public.universities(id) ON DELETE CASCADE,
  program_id uuid REFERENCES public.programs(id) ON DELETE CASCADE,
  job_type text NOT NULL DEFAULT 'university_refresh',
  priority int NOT NULL DEFAULT 5,
  status text NOT NULL DEFAULT 'pending',
  scheduled_at timestamptz NOT NULL DEFAULT now(),
  started_at timestamptz,
  finished_at timestamptz,
  attempt_count int NOT NULL DEFAULT 0,
  last_error text,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_scrape_jobs_status ON public.scrape_jobs(status, scheduled_at);
CREATE INDEX IF NOT EXISTS idx_scrape_jobs_uni ON public.scrape_jobs(university_id);

CREATE TABLE IF NOT EXISTS public.scrape_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid REFERENCES public.scrape_jobs(id) ON DELETE SET NULL,
  university_id uuid REFERENCES public.universities(id) ON DELETE CASCADE,
  program_id uuid REFERENCES public.programs(id) ON DELETE CASCADE,
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz,
  status text NOT NULL DEFAULT 'running',
  pages_crawled int NOT NULL DEFAULT 0,
  pdfs_ingested int NOT NULL DEFAULT 0,
  credits_used int NOT NULL DEFAULT 0,
  diffs_created int NOT NULL DEFAULT 0,
  errors jsonb NOT NULL DEFAULT '[]'::jsonb,
  summary jsonb NOT NULL DEFAULT '{}'::jsonb
);
CREATE INDEX IF NOT EXISTS idx_scrape_runs_uni_time ON public.scrape_runs(university_id, started_at DESC);

CREATE TABLE IF NOT EXISTS public.scrape_diffs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id uuid REFERENCES public.scrape_runs(id) ON DELETE CASCADE,
  program_id uuid REFERENCES public.programs(id) ON DELETE CASCADE,
  university_id uuid REFERENCES public.universities(id) ON DELETE CASCADE,
  field_path text NOT NULL,
  old_value jsonb,
  new_value jsonb,
  confidence numeric(3,2) NOT NULL DEFAULT 0.5,
  source_url text,
  source_kind text NOT NULL DEFAULT 'page',
  status text NOT NULL DEFAULT 'pending',
  reviewed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  review_notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_scrape_diffs_status ON public.scrape_diffs(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_scrape_diffs_program ON public.scrape_diffs(program_id);

CREATE TABLE IF NOT EXISTS public.program_field_sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id uuid NOT NULL REFERENCES public.programs(id) ON DELETE CASCADE,
  field_path text NOT NULL,
  source_url text NOT NULL,
  source_kind text NOT NULL DEFAULT 'page',
  confidence numeric(3,2) NOT NULL DEFAULT 0.5,
  last_verified_at timestamptz NOT NULL DEFAULT now(),
  content_hash text,
  UNIQUE (program_id, field_path)
);
CREATE INDEX IF NOT EXISTS idx_pfs_program ON public.program_field_sources(program_id);

CREATE TABLE IF NOT EXISTS public.scrape_budget (
  id boolean PRIMARY KEY DEFAULT true CHECK (id = true),
  monthly_credit_ceiling int NOT NULL DEFAULT 25000,
  current_month_used int NOT NULL DEFAULT 0,
  current_month_start date NOT NULL DEFAULT date_trunc('month', now())::date,
  paused boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now()
);
INSERT INTO public.scrape_budget (id) VALUES (true) ON CONFLICT DO NOTHING;

ALTER TABLE public.programs ADD COLUMN IF NOT EXISTS last_verified_at timestamptz;

DROP TRIGGER IF EXISTS trg_usp_updated ON public.university_scrape_profiles;
CREATE TRIGGER trg_usp_updated BEFORE UPDATE ON public.university_scrape_profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- RLS
ALTER TABLE public.university_scrape_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scrape_jobs                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scrape_runs                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scrape_diffs               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.program_field_sources      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scrape_budget              ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'university_scrape_profiles','scrape_jobs','scrape_runs',
    'scrape_diffs','program_field_sources','scrape_budget'
  ] LOOP
    EXECUTE format('DROP POLICY IF EXISTS "admin_all_%1$s" ON public.%1$I', t);
    EXECUTE format(
      'CREATE POLICY "admin_all_%1$s" ON public.%1$I FOR ALL TO authenticated USING (public.has_role(''admin''::public.app_role)) WITH CHECK (public.has_role(''admin''::public.app_role))', t);
  END LOOP;

  FOREACH t IN ARRAY ARRAY[
    'university_scrape_profiles','scrape_runs','scrape_diffs','program_field_sources'
  ] LOOP
    EXECUTE format('DROP POLICY IF EXISTS "staff_read_%1$s" ON public.%1$I', t);
    EXECUTE format(
      'CREATE POLICY "staff_read_%1$s" ON public.%1$I FOR SELECT TO authenticated USING (public.has_role(''company_sales''::public.app_role) OR public.has_role(''company_admissions''::public.app_role) OR public.has_role(''marketing''::public.app_role))', t);
  END LOOP;
END $$;

-- Storage bucket
INSERT INTO storage.buckets (id, name, public)
  VALUES ('program-documents', 'program-documents', false)
  ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "program_docs_admin_select" ON storage.objects;
CREATE POLICY "program_docs_admin_select" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'program-documents' AND public.has_role('admin'::public.app_role));
DROP POLICY IF EXISTS "program_docs_admin_insert" ON storage.objects;
CREATE POLICY "program_docs_admin_insert" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'program-documents' AND public.has_role('admin'::public.app_role));
DROP POLICY IF EXISTS "program_docs_admin_update" ON storage.objects;
CREATE POLICY "program_docs_admin_update" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'program-documents' AND public.has_role('admin'::public.app_role));
DROP POLICY IF EXISTS "program_docs_admin_delete" ON storage.objects;
CREATE POLICY "program_docs_admin_delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'program-documents' AND public.has_role('admin'::public.app_role));
