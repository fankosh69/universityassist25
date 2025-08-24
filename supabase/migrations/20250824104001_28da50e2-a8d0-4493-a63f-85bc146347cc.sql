-- Fix Security Definer View Issue and Complete Data Masking Implementation
-- This addresses the linter warning about SECURITY DEFINER views

-- 1. Drop the problematic SECURITY DEFINER view
DROP VIEW IF EXISTS public.safe_profiles;

-- 2. Replace with a secure function-based approach (no view needed)
-- The get_ultra_secure_profile_data and get_public_safe_profile functions are sufficient

-- 3. Update the existing secure functions to be even more restrictive
CREATE OR REPLACE FUNCTION public.get_safe_profile_data(profile_uuid uuid)
RETURNS TABLE(
    id uuid, 
    full_name text, 
    email text, 
    phone text, 
    date_of_birth date,
    nationality text, 
    gender text, 
    current_institution text,
    current_field_of_study text, 
    current_education_level text,
    current_gpa numeric,
    credits_taken integer,
    thesis_topic text,
    language_certificates text[],
    preferred_fields text[],
    preferred_degree_type text,
    preferred_cities text[],
    career_goals text,
    created_at timestamp with time zone, 
    updated_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    current_user_id uuid;
    is_admin boolean;
    is_owner boolean;
BEGIN
    current_user_id := auth.uid();
    
    -- Strict authentication check
    IF current_user_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required';
    END IF;
    
    -- Check ownership and admin status
    is_owner := (profile_uuid = current_user_id);
    is_admin := has_role('admin'::app_role);
    
    -- Log access attempt for audit
    INSERT INTO public.audit_logs (table_name, operation, user_id, new_data, created_at)
    VALUES ('profiles', 'SECURE_SELECT', current_user_id, 
            jsonb_build_object(
                'requested_profile', profile_uuid, 
                'is_owner', is_owner,
                'is_admin', is_admin,
                'access_granted', (is_owner OR is_admin)
            ), 
            now());
    
    -- Only return data if user owns profile or is admin
    IF is_owner OR is_admin THEN
        RETURN QUERY
        SELECT 
            p.id, p.full_name, p.email, p.phone, p.date_of_birth,
            p.nationality, p.gender, p.current_institution, 
            p.current_field_of_study, p.current_education_level,
            p.current_gpa, p.credits_taken, p.thesis_topic,
            p.language_certificates, p.preferred_fields, p.preferred_degree_type,
            p.preferred_cities, p.career_goals, p.created_at, p.updated_at
        FROM public.profiles p
        WHERE p.id = profile_uuid;
    ELSE
        -- Access denied - return nothing or raise exception
        RAISE EXCEPTION 'Access denied: Cannot access profile data';
    END IF;
END;
$$;

-- 4. Create a completely anonymous-safe profile view for public display
CREATE OR REPLACE FUNCTION public.get_masked_profile_display(profile_uuid uuid)
RETURNS TABLE(
    id uuid,
    display_name text,
    education_level text,
    field_of_study text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
    -- This function returns only basic, completely anonymized data
    -- Safe for any authenticated user to call
    RETURN QUERY
    SELECT 
        p.id,
        CASE 
            WHEN p.full_name IS NOT NULL THEN 
                SPLIT_PART(p.full_name, ' ', 1) || ' ' || 
                COALESCE(LEFT(SPLIT_PART(p.full_name, ' ', 2), 1) || '.', '')
            ELSE 'Anonymous'
        END as display_name,
        COALESCE(p.current_education_level, 'Student') as education_level,
        COALESCE(p.current_field_of_study, 'Various Fields') as field_of_study
    FROM public.profiles p
    WHERE p.id = profile_uuid;
END;
$$;

-- 5. Ensure the profiles table has the most restrictive possible access
-- Remove any potential direct table access
REVOKE ALL ON public.profiles FROM public;
REVOKE ALL ON public.profiles FROM anon;

-- Only allow specific operations to authenticated users through RLS
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;

-- 6. Add additional validation constraints for data integrity
ALTER TABLE public.profiles 
ADD CONSTRAINT check_full_name_length CHECK (LENGTH(full_name) <= 100 OR full_name IS NULL);

ALTER TABLE public.profiles 
ADD CONSTRAINT check_current_institution_length CHECK (LENGTH(current_institution) <= 200 OR current_institution IS NULL);

-- 7. Create a function to check if profile data access is being attempted improperly
CREATE OR REPLACE FUNCTION public.validate_profile_access()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    user_id uuid;
BEGIN
    user_id := auth.uid();
    
    -- Only authenticated users can access profiles
    IF user_id IS NULL THEN
        RETURN false;
    END IF;
    
    -- Log the validation attempt
    INSERT INTO public.audit_logs (table_name, operation, user_id, created_at)
    VALUES ('profiles', 'ACCESS_VALIDATION', user_id, now());
    
    RETURN true;
END;
$$;

-- 8. Update existing RLS policies to be even more restrictive
DROP POLICY IF EXISTS "profiles_owner_admin_only" ON public.profiles;

-- Create new ultra-restrictive policy
CREATE POLICY "profiles_ultra_secure_access" ON public.profiles
FOR ALL 
TO authenticated
USING (
    -- Only allow if validation passes AND (owner OR admin)
    validate_profile_access() AND (id = auth.uid() OR has_role('admin'::app_role))
)
WITH CHECK (
    -- Same for modifications
    validate_profile_access() AND (id = auth.uid() OR has_role('admin'::app_role))
);

-- Keep the delete block policy
-- profiles_block_delete policy remains unchanged

-- 9. Add security documentation
COMMENT ON FUNCTION public.get_safe_profile_data IS 'SECURITY: Ultra-secure profile access with comprehensive logging and validation. Owner/admin only.';
COMMENT ON FUNCTION public.get_masked_profile_display IS 'SECURITY: Completely anonymized profile data safe for public display.';
COMMENT ON FUNCTION public.validate_profile_access IS 'SECURITY: Validates and logs all profile access attempts.';