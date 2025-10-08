-- Phase 1A: Create Historical Applications System Tables

-- Table 1: Historical Applications (Core historical data)
CREATE TABLE public.historical_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Student Information (anonymized for privacy)
  student_identifier TEXT,
  nationality TEXT NOT NULL,
  country_of_origin TEXT NOT NULL,
  
  -- Academic Background
  curriculum TEXT,
  education_level TEXT NOT NULL,
  previous_degree_field TEXT,
  gpa_raw NUMERIC(5,2),
  gpa_scale_max NUMERIC(5,2),
  gpa_min_pass NUMERIC(5,2),
  gpa_converted_german NUMERIC(3,2),
  
  -- Language Proficiency
  language_certificates JSONB DEFAULT '[]'::jsonb,
  
  -- Test Scores
  additional_test_scores JSONB DEFAULT '{}'::jsonb,
  
  -- Application Details
  program_id UUID REFERENCES public.programs(id) ON DELETE SET NULL,
  program_name TEXT NOT NULL,
  university_name TEXT NOT NULL,
  application_semester TEXT,
  application_date DATE,
  
  -- Outcome
  outcome TEXT CHECK (outcome IN ('accepted', 'rejected', 'waitlisted', 'withdrawn')) NOT NULL,
  rejection_reason TEXT,
  acceptance_conditions TEXT,
  
  -- Additional Context
  had_aps_certificate BOOLEAN DEFAULT false,
  passed_studienkolleg BOOLEAN DEFAULT false,
  work_experience_years INTEGER DEFAULT 0,
  extra_qualifications JSONB DEFAULT '[]'::jsonb,
  
  -- Data Quality
  data_completeness_score INTEGER CHECK (data_completeness_score >= 0 AND data_completeness_score <= 100),
  verified_by_admin BOOLEAN DEFAULT false,
  notes TEXT,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL
);

CREATE INDEX idx_historical_app_program ON public.historical_applications(program_id);
CREATE INDEX idx_historical_app_outcome ON public.historical_applications(outcome);
CREATE INDEX idx_historical_app_nationality ON public.historical_applications(nationality);

-- Table 2: Student Documents (File metadata)
CREATE TABLE public.student_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  historical_application_id UUID REFERENCES public.historical_applications(id) ON DELETE CASCADE,
  
  -- File Information
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size_kb INTEGER,
  mime_type TEXT,
  
  -- OCR Status
  ocr_status TEXT DEFAULT 'pending' CHECK (ocr_status IN ('pending', 'processing', 'completed', 'failed')),
  ocr_completed_at TIMESTAMPTZ,
  
  -- Metadata
  uploaded_at TIMESTAMPTZ DEFAULT now(),
  uploaded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL
);

CREATE INDEX idx_student_docs_application ON public.student_documents(historical_application_id);
CREATE INDEX idx_student_docs_status ON public.student_documents(ocr_status);

-- Table 3: Document Extractions (OCR results)
CREATE TABLE public.document_extractions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  document_id UUID REFERENCES public.student_documents(id) ON DELETE CASCADE NOT NULL,
  
  -- Raw OCR Output
  raw_text TEXT,
  structured_data JSONB DEFAULT '{}'::jsonb,
  
  -- Confidence & Quality
  ocr_confidence_score NUMERIC(3,2),
  extraction_method TEXT,
  
  -- Extracted Fields (for quick access)
  extracted_gpa NUMERIC(5,2),
  extracted_dates JSONB DEFAULT '[]'::jsonb,
  extracted_courses JSONB DEFAULT '[]'::jsonb,
  extracted_language_scores JSONB DEFAULT '[]'::jsonb,
  
  -- Review Status
  reviewed_by_admin BOOLEAN DEFAULT false,
  admin_corrections JSONB DEFAULT '{}'::jsonb,
  
  -- Metadata
  extracted_at TIMESTAMPTZ DEFAULT now(),
  reviewed_at TIMESTAMPTZ
);

CREATE INDEX idx_doc_extractions_document ON public.document_extractions(document_id);

-- Table 4: Admission Patterns (AI-generated insights)
CREATE TABLE public.admission_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Pattern Scope
  program_id UUID REFERENCES public.programs(id) ON DELETE CASCADE,
  university_id UUID REFERENCES public.universities(id) ON DELETE SET NULL,
  country_filter TEXT,
  
  -- Pattern Analysis
  pattern_type TEXT NOT NULL,
  
  -- Insights (AI-generated)
  insights JSONB NOT NULL,
  
  -- Statistics
  sample_size INTEGER,
  confidence_level TEXT CHECK (confidence_level IN ('low', 'medium', 'high')),
  
  -- Metadata
  generated_at TIMESTAMPTZ DEFAULT now(),
  last_updated TIMESTAMPTZ DEFAULT now(),
  generated_by_ai_model TEXT DEFAULT 'gemini-2.5-flash'
);

CREATE INDEX idx_admission_patterns_program ON public.admission_patterns(program_id);
CREATE INDEX idx_admission_patterns_type ON public.admission_patterns(pattern_type);

-- Phase 1B: Create Storage Bucket and Policies

-- Create bucket for historical documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('historical-documents', 'historical-documents', false);

-- RLS Policies for Tables

-- Historical Applications: Admins only
ALTER TABLE public.historical_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage historical applications"
ON public.historical_applications
FOR ALL
TO authenticated
USING (has_role('admin'::app_role))
WITH CHECK (has_role('admin'::app_role));

-- Student Documents: Admins only
ALTER TABLE public.student_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage student documents"
ON public.student_documents
FOR ALL
TO authenticated
USING (has_role('admin'::app_role))
WITH CHECK (has_role('admin'::app_role));

-- Document Extractions: Admins only
ALTER TABLE public.document_extractions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage document extractions"
ON public.document_extractions
FOR ALL
TO authenticated
USING (has_role('admin'::app_role))
WITH CHECK (has_role('admin'::app_role));

-- Admission Patterns: Admins can manage, authenticated users can read
ALTER TABLE public.admission_patterns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage admission patterns"
ON public.admission_patterns
FOR ALL
TO authenticated
USING (has_role('admin'::app_role))
WITH CHECK (has_role('admin'::app_role));

CREATE POLICY "Authenticated users can view admission patterns"
ON public.admission_patterns
FOR SELECT
TO authenticated
USING (true);

-- RLS Policies for Storage

CREATE POLICY "Admins can upload historical documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'historical-documents' AND
  has_role('admin'::app_role)
);

CREATE POLICY "Admins can view historical documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'historical-documents' AND
  has_role('admin'::app_role)
);

CREATE POLICY "Admins can delete historical documents"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'historical-documents' AND
  has_role('admin'::app_role)
);

CREATE POLICY "Admins can update historical documents"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'historical-documents' AND
  has_role('admin'::app_role)
);

-- Trigger for updated_at
CREATE TRIGGER update_historical_applications_updated_at
BEFORE UPDATE ON public.historical_applications
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();