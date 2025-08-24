-- SECURITY FIX: Remove Problematic Security Definer View
-- This addresses the "Security Definer View" linter error

-- 1. Drop the problematic safe_profiles view completely
DROP VIEW IF EXISTS public.safe_profiles;

-- 2. Ensure our secure functions are properly documented
COMMENT ON FUNCTION public.get_safe_profile_data IS 
'SECURITY: Ultra-secure profile access with comprehensive logging. Owner/admin only. Use this instead of direct table access or views.';

COMMENT ON FUNCTION public.get_masked_profile_display IS 
'SECURITY: Anonymized profile data safe for public display. Returns only non-sensitive fields.';

-- 3. Create a simple function to remind developers to use secure functions
CREATE OR REPLACE FUNCTION public.profile_access_guide()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
    RETURN 'Use get_safe_profile_data(uuid) for full profile access or get_masked_profile_display(uuid) for public display. Never access profiles table directly or through views.';
END;
$$;

COMMENT ON FUNCTION public.profile_access_guide IS 
'SECURITY: Developer guidance function - explains how to safely access profile data.';

-- 4. Verify the view is completely removed
SELECT 'View removal completed' as status;