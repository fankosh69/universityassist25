-- Add missing columns to universities table to match TypeScript interface
ALTER TABLE public.universities
  ADD COLUMN IF NOT EXISTS ranking integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS external_refs jsonb DEFAULT '{}'::jsonb;