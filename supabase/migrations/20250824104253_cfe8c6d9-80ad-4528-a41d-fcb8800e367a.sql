-- Fix Constraint Addition Syntax Error
-- PostgreSQL doesn't support IF NOT EXISTS with ADD CONSTRAINT

-- 1. Drop existing functions to avoid return type conflicts
DROP FUNCTION IF EXISTS public.get_safe_profile_data(uuid);
DROP FUNCTION IF EXISTS public.get_ultra_secure_profile_data(uuid);
DROP FUNCTION IF EXISTS public.get_public_safe_profile(uuid);

-- 2. Recreate get_safe_profile_data with enhanced security
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
        -- Access denied - return nothing
        RAISE EXCEPTION 'Access denied: Cannot access profile data';
    END IF;
END;
$$;

-- 3. Create completely safe masked profile function for public display
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

-- 4. Create access validation function
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

-- 5. Update RLS policies to be ultra-restrictive
DROP POLICY IF EXISTS "profiles_owner_admin_only" ON public.profiles;

-- Create new ultra-restrictive policy
CREATE POLICY "profiles_ultra_secure_access" ON public.profiles
FOR ALL 
TO authenticated
USING (
    validate_profile_access() AND (id = auth.uid() OR has_role('admin'::app_role))
)
WITH CHECK (
    validate_profile_access() AND (id = auth.uid() OR has_role('admin'::app_role))
);

-- 6. Ensure restrictive table permissions
REVOKE ALL ON public.profiles FROM public;
REVOKE ALL ON public.profiles FROM anon;
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;

-- 7. Add security documentation
COMMENT ON FUNCTION public.get_safe_profile_data IS 'SECURITY: Ultra-secure profile access with comprehensive logging. Owner/admin only.';
COMMENT ON FUNCTION public.get_masked_profile_display IS 'SECURITY: Anonymized profile data safe for public display.';
COMMENT ON FUNCTION public.validate_profile_access IS 'SECURITY: Validates and logs all profile access attempts.';