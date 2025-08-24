-- Fix Security Linter Issues

-- 1. Fix security definer view by dropping it and using RLS instead
DROP VIEW IF EXISTS public.safe_profiles;

-- 2. Fix function search paths
CREATE OR REPLACE FUNCTION public.log_profile_access()
RETURNS trigger 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
    INSERT INTO public.audit_logs (
        table_name, 
        operation, 
        user_id, 
        old_data, 
        new_data,
        created_at
    ) VALUES (
        TG_TABLE_NAME,
        TG_OP,
        auth.uid(),
        CASE WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD) ELSE NULL END,
        CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_jsonb(NEW) ELSE NULL END,
        now()
    );
    
    RETURN COALESCE(NEW, OLD);
END;
$$;

-- 3. Fix validate_profile_data function
CREATE OR REPLACE FUNCTION public.validate_profile_data()
RETURNS trigger 
LANGUAGE plpgsql
SET search_path = 'public'
AS $$
BEGIN
    -- Validate email format
    IF NEW.email IS NOT NULL AND NEW.email !~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN
        RAISE EXCEPTION 'Invalid email format';
    END IF;
    
    -- Validate phone format (basic validation)
    IF NEW.phone IS NOT NULL AND LENGTH(NEW.phone) < 8 THEN
        RAISE EXCEPTION 'Phone number too short';
    END IF;
    
    -- Sanitize text fields to prevent XSS
    NEW.full_name := TRIM(REGEXP_REPLACE(COALESCE(NEW.full_name, ''), '[<>]', '', 'g'));
    NEW.current_institution := TRIM(REGEXP_REPLACE(COALESCE(NEW.current_institution, ''), '[<>]', '', 'g'));
    NEW.current_field_of_study := TRIM(REGEXP_REPLACE(COALESCE(NEW.current_field_of_study, ''), '[<>]', '', 'g'));
    
    RETURN NEW;
END;
$$;

-- 4. Fix can_access_profile function
CREATE OR REPLACE FUNCTION public.can_access_profile(profile_id uuid)
RETURNS boolean 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
    -- Users can only access their own profile unless they're admin
    RETURN profile_id = auth.uid() OR has_role('admin'::app_role);
END;
$$;

-- 5. Fix secure_update_profile function
CREATE OR REPLACE FUNCTION public.secure_update_profile(
    profile_id uuid,
    new_data jsonb
) RETURNS jsonb 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
    result jsonb;
    allowed_fields text[] := ARRAY['full_name', 'current_institution', 'current_field_of_study', 
                                  'current_education_level', 'nationality', 'career_goals', 
                                  'preferred_fields', 'preferred_degree_type', 'preferred_cities',
                                  'language_certificates', 'current_gpa', 'credits_taken', 'thesis_topic'];
    field_name text;
    update_count int := 0;
BEGIN
    -- Check if user can update this profile
    IF NOT can_access_profile(profile_id) THEN
        RAISE EXCEPTION 'Access denied: Cannot update this profile';
    END IF;
    
    -- Limit the number of fields that can be updated at once
    IF jsonb_object_keys_count(new_data) > 5 THEN
        RAISE EXCEPTION 'Too many fields updated at once. Maximum 5 fields per update.';
    END IF;
    
    -- Validate that only allowed fields are being updated
    FOR field_name IN SELECT jsonb_object_keys(new_data) LOOP
        IF field_name != ANY(allowed_fields) THEN
            RAISE EXCEPTION 'Field % is not allowed to be updated via this function', field_name;
        END IF;
    END LOOP;
    
    -- Perform the update (this will trigger our validation triggers)
    UPDATE public.profiles 
    SET 
        full_name = COALESCE((new_data->>'full_name'), full_name),
        current_institution = COALESCE((new_data->>'current_institution'), current_institution),
        current_field_of_study = COALESCE((new_data->>'current_field_of_study'), current_field_of_study),
        current_education_level = COALESCE((new_data->>'current_education_level'), current_education_level),
        nationality = COALESCE((new_data->>'nationality'), nationality),
        career_goals = COALESCE((new_data->>'career_goals'), career_goals),
        updated_at = now()
    WHERE id = profile_id AND can_access_profile(id);
    
    GET DIAGNOSTICS update_count = ROW_COUNT;
    
    IF update_count = 0 THEN
        RAISE EXCEPTION 'Profile update failed or access denied';
    END IF;
    
    -- Return success message
    RETURN jsonb_build_object('success', true, 'message', 'Profile updated successfully');
END;
$$;