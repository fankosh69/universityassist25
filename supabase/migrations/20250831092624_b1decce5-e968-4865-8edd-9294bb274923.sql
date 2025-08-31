-- Enhanced Security for Profiles Table
-- This migration adds additional security layers to protect sensitive personal data

-- 1. Create a secure view that never exposes sensitive data directly
CREATE OR REPLACE VIEW public.profiles_safe_view AS
SELECT 
    id,
    -- Mask sensitive data by default
    CASE 
        WHEN id = auth.uid() OR has_role('admin'::app_role) THEN full_name
        ELSE COALESCE(split_part(full_name, ' ', 1), 'Anonymous') || ' ' || 
             COALESCE(left(split_part(full_name, ' ', 2), 1) || '.', '')
    END as display_name,
    CASE 
        WHEN id = auth.uid() OR has_role('admin'::app_role) THEN email
        ELSE left(email, 2) || '***@' || split_part(email, '@', 2)
    END as masked_email,
    CASE 
        WHEN id = auth.uid() OR has_role('admin'::app_role) THEN phone
        ELSE '***-***-' || right(phone, 4)
    END as masked_phone,
    current_education_level,
    current_field_of_study,
    nationality,
    created_at
FROM public.profiles
WHERE validate_profile_access();

-- 2. Create additional security functions with enhanced protection
CREATE OR REPLACE FUNCTION public.get_profile_summary(profile_uuid uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    current_user_id uuid;
    is_owner boolean;
    is_admin boolean;
    profile_data jsonb;
BEGIN
    current_user_id := auth.uid();
    
    -- Strict authentication check
    IF current_user_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required for profile access';
    END IF;
    
    is_owner := (profile_uuid = current_user_id);
    is_admin := has_role('admin'::app_role);
    
    -- Enhanced audit logging with more details
    INSERT INTO public.audit_logs (table_name, operation, user_id, new_data, created_at)
    VALUES ('profiles', 'SECURE_SUMMARY_ACCESS', current_user_id, 
            jsonb_build_object(
                'requested_profile', profile_uuid,
                'is_owner', is_owner,
                'is_admin', is_admin,
                'access_level', CASE WHEN is_owner THEN 'full' WHEN is_admin THEN 'admin' ELSE 'denied' END,
                'user_agent', current_setting('request.headers', true)::jsonb->>'user-agent',
                'ip_address', current_setting('request.headers', true)::jsonb->>'x-forwarded-for'
            ), 
            now());
    
    -- Return appropriate data based on access level
    IF is_owner THEN
        -- Owner gets full access (but still structured safely)
        SELECT jsonb_build_object(
            'id', p.id,
            'full_name', p.full_name,
            'email', p.email,
            'phone', p.phone,
            'education_level', p.current_education_level,
            'field_of_study', p.current_field_of_study,
            'nationality', p.nationality,
            'access_level', 'owner'
        ) INTO profile_data
        FROM public.profiles p
        WHERE p.id = profile_uuid;
        
    ELSIF is_admin THEN
        -- Admin gets controlled access with some masking
        SELECT jsonb_build_object(
            'id', p.id,
            'full_name', p.full_name,
            'email', left(p.email, 3) || '***@' || split_part(p.email, '@', 2),
            'education_level', p.current_education_level,
            'field_of_study', p.current_field_of_study,
            'nationality', p.nationality,
            'access_level', 'admin'
        ) INTO profile_data
        FROM public.profiles p
        WHERE p.id = profile_uuid;
        
    ELSE
        -- Public access gets minimal, anonymized data only
        SELECT jsonb_build_object(
            'id', p.id,
            'display_name', COALESCE(split_part(p.full_name, ' ', 1), 'Student') || ' ' || 
                          COALESCE(left(split_part(p.full_name, ' ', 2), 1) || '.', ''),
            'education_level', COALESCE(p.current_education_level, 'Student'),
            'field_of_study', COALESCE(p.current_field_of_study, 'Various'),
            'access_level', 'public'
        ) INTO profile_data
        FROM public.profiles p
        WHERE p.id = profile_uuid;
    END IF;
    
    RETURN COALESCE(profile_data, '{}'::jsonb);
END;
$$;

-- 3. Create rate limiting function to prevent abuse
CREATE OR REPLACE FUNCTION public.check_profile_access_rate_limit()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    access_count int;
BEGIN
    -- Check if user has exceeded rate limit (max 10 profile access attempts per minute)
    SELECT COUNT(*) INTO access_count
    FROM public.audit_logs
    WHERE user_id = auth.uid()
    AND table_name = 'profiles'
    AND operation IN ('SECURE_SELECT', 'SECURE_SUMMARY_ACCESS', 'SECURE_UPDATE')
    AND created_at > now() - interval '1 minute';
    
    IF access_count >= 10 THEN
        -- Log the rate limit violation
        INSERT INTO public.audit_logs (table_name, operation, user_id, new_data, created_at)
        VALUES ('profiles', 'RATE_LIMIT_EXCEEDED', auth.uid(), 
                jsonb_build_object('violation_count', access_count, 'limit', 10), 
                now());
        
        RETURN false;
    END IF;
    
    RETURN true;
END;
$$;

-- 4. Enhanced validation function with additional security checks
CREATE OR REPLACE FUNCTION public.enhanced_validate_profile_access()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    user_id uuid;
    rate_limit_ok boolean;
BEGIN
    user_id := auth.uid();
    
    -- Check authentication
    IF user_id IS NULL THEN
        INSERT INTO public.audit_logs (table_name, operation, user_id, new_data, created_at)
        VALUES ('profiles', 'ACCESS_DENIED_UNAUTH', NULL, 
                jsonb_build_object('reason', 'Not authenticated'), now());
        RETURN false;
    END IF;
    
    -- Check rate limiting
    rate_limit_ok := check_profile_access_rate_limit();
    IF NOT rate_limit_ok THEN
        RAISE EXCEPTION 'Rate limit exceeded. Please wait before accessing profile data again.';
    END IF;
    
    -- Log successful validation
    INSERT INTO public.audit_logs (table_name, operation, user_id, created_at)
    VALUES ('profiles', 'ACCESS_VALIDATION_SUCCESS', user_id, now());
    
    RETURN true;
END;
$$;

-- 5. Create a secure data export function for users (GDPR compliance)
CREATE OR REPLACE FUNCTION public.export_my_profile_data()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    user_data jsonb;
    current_user_id uuid;
BEGIN
    current_user_id := auth.uid();
    
    IF current_user_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required for data export';
    END IF;
    
    -- Enhanced rate limiting for exports (max 1 per hour)
    IF EXISTS (
        SELECT 1 FROM public.audit_logs
        WHERE user_id = current_user_id
        AND operation = 'DATA_EXPORT'
        AND created_at > now() - interval '1 hour'
    ) THEN
        RAISE EXCEPTION 'Data export rate limit: One export per hour allowed';
    END IF;
    
    -- Get user's own data only
    SELECT jsonb_build_object(
        'profile', row_to_json(p.*),
        'export_timestamp', now(),
        'export_reason', 'User requested data export'
    ) INTO user_data
    FROM public.profiles p
    WHERE p.id = current_user_id;
    
    -- Log the export
    INSERT INTO public.audit_logs (table_name, operation, user_id, new_data, created_at)
    VALUES ('profiles', 'DATA_EXPORT', current_user_id, 
            jsonb_build_object('exported_at', now()), now());
    
    RETURN user_data;
END;
$$;