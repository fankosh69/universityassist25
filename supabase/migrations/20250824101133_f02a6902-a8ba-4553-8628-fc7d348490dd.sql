-- Enhanced Security Measures for Student Data Protection (Fixed)

-- 1. Create audit log table for tracking access to sensitive data
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    table_name text NOT NULL,
    operation text NOT NULL,
    user_id uuid REFERENCES auth.users(id),
    old_data jsonb,
    new_data jsonb,
    ip_address inet,
    user_agent text,
    created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on audit logs
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Admins can view audit logs" ON public.audit_logs
FOR SELECT USING (has_role('admin'::app_role));

-- 2. Create function to log profile access
CREATE OR REPLACE FUNCTION public.log_profile_access()
RETURNS trigger AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Create triggers for auditing profile access
CREATE TRIGGER audit_profiles_access
    AFTER INSERT OR UPDATE OR DELETE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.log_profile_access();

-- 4. Add validation function for profile data
CREATE OR REPLACE FUNCTION public.validate_profile_data()
RETURNS trigger AS $$
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
$$ LANGUAGE plpgsql;

-- 5. Add validation trigger
CREATE TRIGGER validate_profile_data_trigger
    BEFORE INSERT OR UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.validate_profile_data();

-- 6. Create function to check if user can access profile (additional layer)
CREATE OR REPLACE FUNCTION public.can_access_profile(profile_id uuid)
RETURNS boolean AS $$
BEGIN
    -- Users can only access their own profile unless they're admin
    RETURN profile_id = auth.uid() OR has_role('admin'::app_role);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Create view for safe profile access with data masking
CREATE OR REPLACE VIEW public.safe_profiles AS
SELECT 
    p.id,
    p.created_at,
    p.updated_at,
    p.current_institution,
    p.current_field_of_study,
    p.current_education_level,
    p.nationality,
    p.gender,
    p.country_code,
    p.language_certificates,
    p.preferred_fields,
    p.preferred_degree_type,
    p.preferred_cities,
    p.career_goals,
    p.current_gpa,
    p.credits_taken,
    p.thesis_topic,
    -- Conditional fields based on access rights
    CASE 
        WHEN p.id = auth.uid() OR has_role('admin'::app_role) THEN p.full_name
        ELSE CASE 
            WHEN p.full_name IS NOT NULL 
            THEN SPLIT_PART(p.full_name, ' ', 1) || ' ' || LEFT(COALESCE(SPLIT_PART(p.full_name, ' ', 2), ''), 1) || '.'
            ELSE NULL 
        END
    END as full_name,
    CASE 
        WHEN p.id = auth.uid() OR has_role('admin'::app_role) THEN p.email
        ELSE CASE 
            WHEN p.email IS NOT NULL 
            THEN LEFT(p.email, 2) || '***@' || SPLIT_PART(p.email, '@', 2)
            ELSE NULL 
        END
    END as email,
    CASE 
        WHEN p.id = auth.uid() OR has_role('admin'::app_role) THEN p.phone
        ELSE CASE 
            WHEN p.phone IS NOT NULL 
            THEN LEFT(p.phone, 3) || '****' || RIGHT(p.phone, 2)
            ELSE NULL 
        END
    END as phone,
    CASE 
        WHEN p.id = auth.uid() OR has_role('admin'::app_role) THEN p.date_of_birth
        ELSE NULL
    END as date_of_birth
FROM public.profiles p
WHERE can_access_profile(p.id);

-- Grant appropriate permissions
GRANT SELECT ON public.safe_profiles TO authenticated;

-- 8. Add constraint to prevent storing obviously fake or test data
ALTER TABLE public.profiles 
ADD CONSTRAINT check_realistic_email 
CHECK (email IS NULL OR (email NOT ILIKE '%test%' AND email NOT ILIKE '%fake%' AND email NOT ILIKE '%dummy%'));

-- 9. Add performance index for profiles
CREATE INDEX IF NOT EXISTS idx_profiles_id ON public.profiles(id);

-- 10. Create function for secure profile updates
CREATE OR REPLACE FUNCTION public.secure_update_profile(
    profile_id uuid,
    new_data jsonb
) RETURNS jsonb AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;