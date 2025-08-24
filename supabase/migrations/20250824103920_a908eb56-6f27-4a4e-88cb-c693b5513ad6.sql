-- Enhanced Security: Field-Level Data Masking and Granular Access Control
-- This addresses the remaining security vulnerability by implementing data masking

-- 1. Create a secure view that automatically masks sensitive data for non-owners
CREATE OR REPLACE VIEW public.safe_profiles AS
SELECT 
    id,
    -- Always show these basic fields
    gender,
    current_education_level,
    nationality,
    created_at,
    updated_at,
    
    -- Conditionally show sensitive fields only to owner/admin
    CASE 
        WHEN id = auth.uid() OR has_role('admin'::app_role) THEN full_name
        WHEN full_name IS NOT NULL THEN SPLIT_PART(full_name, ' ', 1) || ' ***'
        ELSE NULL 
    END as full_name,
    
    CASE 
        WHEN id = auth.uid() OR has_role('admin'::app_role) THEN email
        ELSE '***@***'
    END as email,
    
    CASE 
        WHEN id = auth.uid() OR has_role('admin'::app_role) THEN phone
        ELSE '***'
    END as phone,
    
    CASE 
        WHEN id = auth.uid() OR has_role('admin'::app_role) THEN date_of_birth
        ELSE NULL
    END as date_of_birth,
    
    CASE 
        WHEN id = auth.uid() OR has_role('admin'::app_role) THEN country_code
        ELSE NULL
    END as country_code,
    
    -- Academic fields (less sensitive, can show more)
    current_institution,
    current_field_of_study,
    career_goals,
    preferred_cities,
    preferred_degree_type,
    preferred_fields,
    language_certificates,
    current_gpa,
    credits_taken,
    thesis_topic

FROM public.profiles;

-- 2. Grant access to the safe view
GRANT SELECT ON public.safe_profiles TO authenticated;

-- 3. Create an ultra-secure profile access function with rate limiting
CREATE OR REPLACE FUNCTION public.get_ultra_secure_profile_data(profile_uuid uuid)
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
    request_count int;
BEGIN
    current_user_id := auth.uid();
    
    -- Block unauthenticated access immediately
    IF current_user_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required for profile access';
    END IF;
    
    -- Rate limiting: Max 10 profile requests per minute per user
    SELECT COUNT(*) INTO request_count
    FROM public.audit_logs 
    WHERE user_id = current_user_id 
    AND table_name = 'profiles'
    AND operation = 'SELECT'
    AND created_at > now() - interval '1 minute';
    
    IF request_count >= 10 THEN
        RAISE EXCEPTION 'Rate limit exceeded: Too many profile requests';
    END IF;
    
    -- Check admin status
    is_admin := has_role('admin'::app_role);
    
    -- Log the access attempt
    INSERT INTO public.audit_logs (table_name, operation, user_id, new_data, created_at)
    VALUES ('profiles', 'SELECT', current_user_id, 
            jsonb_build_object('requested_profile', profile_uuid, 'access_type', 
                CASE WHEN profile_uuid = current_user_id THEN 'own' 
                     WHEN is_admin THEN 'admin' 
                     ELSE 'denied' END), 
            now());
    
    -- Only allow access to own profile or admin access
    IF profile_uuid != current_user_id AND NOT is_admin THEN
        RAISE EXCEPTION 'Access denied: Cannot access other users profile data';
    END IF;
    
    -- Return data based on access level
    IF profile_uuid = current_user_id OR is_admin THEN
        -- Full access for owner or admin
        RETURN QUERY
        SELECT 
            p.id, p.full_name, p.email, p.phone, p.date_of_birth,
            p.nationality, p.gender, p.current_institution, 
            p.current_field_of_study, p.current_education_level,
            p.created_at, p.updated_at
        FROM public.profiles p
        WHERE p.id = profile_uuid;
    END IF;
    
    -- If we get here, something went wrong
    RAISE EXCEPTION 'Profile access validation failed';
END;
$$;

-- 4. Create a public-safe profile function for displaying basic info (like ambassador profiles)
CREATE OR REPLACE FUNCTION public.get_public_safe_profile(profile_uuid uuid)
RETURNS TABLE(
    id uuid,
    display_name text,
    institution text,
    field_of_study text,
    education_level text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
    -- Only return very basic, non-sensitive information
    RETURN QUERY
    SELECT 
        p.id,
        CASE WHEN p.full_name IS NOT NULL 
             THEN SPLIT_PART(p.full_name, ' ', 1) || ' ' || LEFT(SPLIT_PART(p.full_name, ' ', 2), 1) || '.'
             ELSE 'Anonymous User' END as display_name,
        COALESCE(p.current_institution, 'Not specified') as institution,
        COALESCE(p.current_field_of_study, 'Not specified') as field_of_study,
        COALESCE(p.current_education_level, 'Not specified') as education_level
    FROM public.profiles p
    WHERE p.id = profile_uuid;
END;
$$;

-- 5. Add additional security constraints
ALTER TABLE public.profiles ADD CONSTRAINT check_email_format 
CHECK (email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' OR email IS NULL);

ALTER TABLE public.profiles ADD CONSTRAINT check_phone_length 
CHECK (LENGTH(phone) >= 8 OR phone IS NULL);

-- 6. Create audit trigger for profile access attempts
CREATE OR REPLACE FUNCTION public.log_profile_select_attempt()
RETURNS trigger 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
    -- Log every SELECT attempt on profiles for security monitoring
    INSERT INTO public.audit_logs (
        table_name,
        operation,
        user_id,
        new_data,
        created_at
    ) VALUES (
        'profiles',
        'SELECT_ATTEMPT',
        auth.uid(),
        jsonb_build_object(
            'accessed_profile_id', NEW.id,
            'accessor_is_owner', (NEW.id = auth.uid()),
            'accessor_is_admin', has_role('admin'::app_role)
        ),
        now()
    );
    
    RETURN NEW;
END;
$$;

-- Note: We cannot create a SELECT trigger directly on the table as it would cause infinite recursion
-- The logging is handled within the secure functions instead

-- 7. Add security documentation
COMMENT ON VIEW public.safe_profiles IS 'SECURITY: Automatically masks sensitive personal data. Only profile owners and admins see full data.';
COMMENT ON FUNCTION public.get_ultra_secure_profile_data IS 'SECURITY: Rate-limited, logged access to profile data with strict ownership validation.';
COMMENT ON FUNCTION public.get_public_safe_profile IS 'SECURITY: Returns only basic, non-sensitive profile information for public display.';