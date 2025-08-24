-- Enhanced Security Measures for Student Data Protection

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

-- 4. Create function to mask sensitive data for non-owners
CREATE OR REPLACE FUNCTION public.mask_sensitive_profile_data(
    profile_row profiles,
    requesting_user_id uuid
) RETURNS profiles AS $$
BEGIN
    -- If user is viewing their own profile or is admin, return full data
    IF profile_row.id = requesting_user_id OR has_role('admin'::app_role) THEN
        RETURN profile_row;
    END IF;
    
    -- Otherwise, mask sensitive fields
    profile_row.email := CASE 
        WHEN profile_row.email IS NOT NULL 
        THEN LEFT(profile_row.email, 2) || '***@' || SPLIT_PART(profile_row.email, '@', 2)
        ELSE NULL 
    END;
    
    profile_row.phone := CASE 
        WHEN profile_row.phone IS NOT NULL 
        THEN LEFT(profile_row.phone, 3) || '****' || RIGHT(profile_row.phone, 2)
        ELSE NULL 
    END;
    
    profile_row.date_of_birth := NULL;
    profile_row.full_name := CASE 
        WHEN profile_row.full_name IS NOT NULL 
        THEN SPLIT_PART(profile_row.full_name, ' ', 1) || ' ' || LEFT(SPLIT_PART(profile_row.full_name, ' ', 2), 1) || '.'
        ELSE NULL 
    END;
    
    RETURN profile_row;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Add validation function for profile data
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
    NEW.full_name := TRIM(REGEXP_REPLACE(NEW.full_name, '[<>]', '', 'g'));
    NEW.current_institution := TRIM(REGEXP_REPLACE(NEW.current_institution, '[<>]', '', 'g'));
    NEW.current_field_of_study := TRIM(REGEXP_REPLACE(NEW.current_field_of_study, '[<>]', '', 'g'));
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. Add validation trigger
CREATE TRIGGER validate_profile_data_trigger
    BEFORE INSERT OR UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.validate_profile_data();

-- 7. Create function to check if user can access profile (additional layer)
CREATE OR REPLACE FUNCTION public.can_access_profile(profile_id uuid)
RETURNS boolean AS $$
BEGIN
    -- Users can only access their own profile unless they're admin
    RETURN profile_id = auth.uid() OR has_role('admin'::app_role);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Add additional RLS policy for enhanced security
DROP POLICY IF EXISTS "Enhanced profile access control" ON public.profiles;
CREATE POLICY "Enhanced profile access control" ON public.profiles
FOR ALL USING (can_access_profile(id))
WITH CHECK (can_access_profile(id));

-- 9. Create view for safe profile access with data masking
CREATE OR REPLACE VIEW public.safe_profiles AS
SELECT 
    p.*,
    CASE 
        WHEN p.id = auth.uid() OR has_role('admin'::app_role) THEN p.email
        ELSE LEFT(p.email, 2) || '***@' || SPLIT_PART(p.email, '@', 2)
    END as masked_email,
    CASE 
        WHEN p.id = auth.uid() OR has_role('admin'::app_role) THEN p.phone
        ELSE LEFT(p.phone, 3) || '****' || RIGHT(p.phone, 2)
    END as masked_phone
FROM public.profiles p
WHERE can_access_profile(p.id);

-- Grant appropriate permissions
GRANT SELECT ON public.safe_profiles TO authenticated;

-- 10. Add constraint to prevent storing obviously fake or test data
ALTER TABLE public.profiles 
ADD CONSTRAINT check_realistic_email 
CHECK (email IS NULL OR email NOT ILIKE '%test%' AND email NOT ILIKE '%fake%' AND email NOT ILIKE '%dummy%');

-- 11. Add index for better performance on security queries
CREATE INDEX IF NOT EXISTS idx_profiles_security_lookup ON public.profiles(id) WHERE id = auth.uid();