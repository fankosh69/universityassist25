-- Fix 1: Remove overlapping permissive SELECT policy on programs table
-- The "Public can view published programs" policy (USING: published = true) already handles public access
-- The "Anyone can view programs" policy (USING: true) overrides it and exposes drafts
DROP POLICY IF EXISTS "Anyone can view programs" ON public.programs;

-- Fix 2: Set search_path on validate_academic_data function
ALTER FUNCTION public.validate_academic_data() SET search_path = public;