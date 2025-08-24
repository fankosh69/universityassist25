-- Critical Security Fixes for Profiles Table

-- 1. Drop existing potentially vulnerable policies
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Enhanced profile access control" ON public.profiles;

-- 2. Create rock-solid RLS policies with comprehensive protection
CREATE POLICY "Strict profile select access" ON public.profiles
FOR SELECT USING (
    -- Only allow users to view their own profile OR admins to view any profile
    id = auth.uid() OR has_role('admin'::app_role)
);

CREATE POLICY "Strict profile insert access" ON public.profiles
FOR INSERT WITH CHECK (
    -- Users can only insert their own profile
    id = auth.uid()
);

CREATE POLICY "Strict profile update access" ON public.profiles
FOR UPDATE USING (
    -- Users can only update their own profile OR admins can update any
    id = auth.uid() OR has_role('admin'::app_role)
) WITH CHECK (
    -- Ensure the ID cannot be changed and remains the user's ID
    id = auth.uid() OR has_role('admin'::app_role)
);

-- 3. Completely block DELETE operations for regular users (only admins via direct SQL)
CREATE POLICY "Block profile deletion" ON public.profiles
FOR DELETE USING (false);

-- 4. Create additional function to mask PII data automatically
CREATE OR REPLACE FUNCTION public.get_safe_profile_data(profile_uuid uuid)
RETURNS TABLE (
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
SET search_path = 'public'
AS $$
BEGIN
    -- Check access rights
    IF NOT can_access_profile(profile_uuid) THEN
        RAISE EXCEPTION 'Access denied to profile data';
    END IF;
    
    -- Return full data for own profile or admin, masked data otherwise
    IF profile_uuid = auth.uid() OR has_role('admin'::app_role) THEN
        RETURN QUERY
        SELECT 
            p.id, p.full_name, p.email, p.phone, p.date_of_birth,
            p.nationality, p.gender, p.current_institution, 
            p.current_field_of_study, p.current_education_level,
            p.created_at, p.updated_at
        FROM public.profiles p
        WHERE p.id = profile_uuid;
    ELSE
        -- This should never execute due to access check, but safety first
        RETURN QUERY
        SELECT 
            p.id, 
            CASE WHEN p.full_name IS NOT NULL 
                THEN SPLIT_PART(p.full_name, ' ', 1) || ' ***' 
                ELSE NULL END::text,
            '***@***'::text,
            '***'::text,
            NULL::date,
            '***'::text,
            p.gender,
            p.current_institution,
            p.current_field_of_study,
            p.current_education_level,
            p.created_at,
            p.updated_at
        FROM public.profiles p
        WHERE p.id = profile_uuid;
    END IF;
END;
$$;

-- 5. Create function to securely check if profile data can be accessed
CREATE OR REPLACE FUNCTION public.check_profile_access_rights(profile_uuid uuid)
RETURNS jsonb
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
    current_user_id uuid;
    is_admin boolean;
    access_level text;
BEGIN
    current_user_id := auth.uid();
    
    -- Check if user is authenticated
    IF current_user_id IS NULL THEN
        RETURN jsonb_build_object(
            'access_allowed', false,
            'access_level', 'none',
            'reason', 'Not authenticated'
        );
    END IF;
    
    -- Check admin status
    is_admin := has_role('admin'::app_role);
    
    -- Determine access level
    IF profile_uuid = current_user_id THEN
        access_level := 'owner';
    ELSIF is_admin THEN
        access_level := 'admin';
    ELSE
        access_level := 'none';
    END IF;
    
    RETURN jsonb_build_object(
        'access_allowed', (access_level != 'none'),
        'access_level', access_level,
        'is_owner', (profile_uuid = current_user_id),
        'is_admin', is_admin,
        'user_id', current_user_id
    );
END;
$$;

-- 6. Add additional constraints to prevent data exposure
ALTER TABLE public.profiles 
ADD CONSTRAINT prevent_empty_user_id CHECK (id IS NOT NULL);

-- 7. Create function for super secure profile updates with comprehensive validation
CREATE OR REPLACE FUNCTION public.ultra_secure_profile_update(
    target_profile_id uuid,
    update_data jsonb
) RETURNS jsonb 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
    access_check jsonb;
    allowed_fields text[] := ARRAY[
        'full_name', 'current_institution', 'current_field_of_study', 
        'current_education_level', 'nationality', 'career_goals',
        'preferred_fields', 'preferred_degree_type', 'preferred_cities',
        'language_certificates', 'current_gpa', 'credits_taken', 'thesis_topic'
    ];
    sensitive_fields text[] := ARRAY['email', 'phone', 'date_of_birth'];
    field_name text;
    update_count int := 0;
    changes_made jsonb := '[]'::jsonb;
BEGIN
    -- Comprehensive access check
    access_check := check_profile_access_rights(target_profile_id);
    
    IF NOT (access_check->>'access_allowed')::boolean THEN
        RAISE EXCEPTION 'Access denied: %', access_check->>'reason';
    END IF;
    
    -- Rate limiting: max 3 updates per minute per user
    IF EXISTS (
        SELECT 1 FROM public.audit_logs 
        WHERE user_id = auth.uid() 
        AND table_name = 'profiles' 
        AND operation = 'UPDATE'
        AND created_at > now() - interval '1 minute'
        GROUP BY user_id
        HAVING count(*) >= 3
    ) THEN
        RAISE EXCEPTION 'Rate limit exceeded: Too many profile updates. Please wait.';
    END IF;
    
    -- Validate field count (max 3 fields per update)
    IF jsonb_object_keys_count(update_data) > 3 THEN
        RAISE EXCEPTION 'Security limit: Maximum 3 fields can be updated at once';
    END IF;
    
    -- Validate only allowed fields are being updated
    FOR field_name IN SELECT jsonb_object_keys(update_data) LOOP
        IF field_name = ANY(sensitive_fields) THEN
            -- Sensitive fields require admin access or special verification
            IF NOT ((access_check->>'is_admin')::boolean OR (access_check->>'is_owner')::boolean) THEN
                RAISE EXCEPTION 'Insufficient privileges to update sensitive field: %', field_name;
            END IF;
        ELSIF field_name != ANY(allowed_fields) THEN
            RAISE EXCEPTION 'Field not allowed for update: %', field_name;
        END IF;
    END LOOP;
    
    -- Perform secure update with change tracking
    UPDATE public.profiles 
    SET 
        full_name = CASE WHEN update_data ? 'full_name' 
                    THEN TRIM(REGEXP_REPLACE(update_data->>'full_name', '[<>\"'']', '', 'g'))
                    ELSE full_name END,
        current_institution = CASE WHEN update_data ? 'current_institution' 
                             THEN TRIM(REGEXP_REPLACE(update_data->>'current_institution', '[<>\"'']', '', 'g'))
                             ELSE current_institution END,
        current_field_of_study = CASE WHEN update_data ? 'current_field_of_study' 
                                THEN TRIM(REGEXP_REPLACE(update_data->>'current_field_of_study', '[<>\"'']', '', 'g'))
                                ELSE current_field_of_study END,
        email = CASE WHEN update_data ? 'email' AND (access_check->>'is_owner')::boolean
                THEN update_data->>'email' 
                ELSE email END,
        phone = CASE WHEN update_data ? 'phone' AND (access_check->>'is_owner')::boolean
                THEN update_data->>'phone'
                ELSE phone END,
        updated_at = now()
    WHERE id = target_profile_id;
    
    GET DIAGNOSTICS update_count = ROW_COUNT;
    
    IF update_count = 0 THEN
        RAISE EXCEPTION 'Profile update failed - record not found or access denied';
    END IF;
    
    -- Return success with security context
    RETURN jsonb_build_object(
        'success', true,
        'message', 'Profile updated successfully',
        'fields_updated', jsonb_object_keys_count(update_data),
        'access_level', access_check->>'access_level',
        'timestamp', now()
    );
END;
$$;

-- 8. Revoke direct table access and force function usage for updates
REVOKE UPDATE ON public.profiles FROM public;
REVOKE INSERT ON public.profiles FROM public;

-- Grant minimal necessary permissions
GRANT SELECT ON public.profiles TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_safe_profile_data TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_profile_access_rights TO authenticated;
GRANT EXECUTE ON FUNCTION public.ultra_secure_profile_update TO authenticated;