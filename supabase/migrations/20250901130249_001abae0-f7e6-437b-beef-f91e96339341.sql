-- CRITICAL SECURITY FIX: Enable RLS on backup_private_profile_data table
-- This table currently exposes all personal data without any restrictions

ALTER TABLE public.backup_private_profile_data ENABLE ROW LEVEL SECURITY;

-- Add admin-only access policy for the backup table
CREATE POLICY "Only admins can access backup profile data"
ON public.backup_private_profile_data
FOR ALL
USING (has_role('admin'::app_role))
WITH CHECK (has_role('admin'::app_role));

-- Add audit logging trigger for backup table access
CREATE OR REPLACE FUNCTION public.audit_backup_data_access()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.audit_logs (
        table_name,
        operation,
        user_id,
        old_data,
        new_data,
        created_at
    ) VALUES (
        'backup_private_profile_data',
        TG_OP,
        auth.uid(),
        CASE WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD) ELSE NULL END,
        CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_jsonb(NEW) ELSE NULL END,
        now()
    );
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Add trigger to audit all access to backup data
CREATE TRIGGER backup_data_audit_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.backup_private_profile_data
    FOR EACH ROW EXECUTE FUNCTION public.audit_backup_data_access();

-- MEDIUM PRIORITY: Improve user_roles security
-- Add policy to allow admins to manage user roles
CREATE POLICY "Admins can manage user roles"
ON public.user_roles
FOR ALL
USING (has_role('admin'::app_role))
WITH CHECK (has_role('admin'::app_role));

-- Add audit logging for role changes
CREATE OR REPLACE FUNCTION public.audit_role_changes()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.audit_logs (
        table_name,
        operation,
        user_id,
        old_data,
        new_data,
        created_at
    ) VALUES (
        'user_roles',
        TG_OP || '_ROLE_CHANGE',
        auth.uid(),
        CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN 
            jsonb_build_object(
                'profile_id', OLD.profile_id,
                'role', OLD.role,
                'changed_by', auth.uid()
            )
        ELSE NULL END,
        CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN 
            jsonb_build_object(
                'profile_id', NEW.profile_id,
                'role', NEW.role,
                'changed_by', auth.uid()
            )
        ELSE NULL END,
        now()
    );
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Add trigger for role change auditing
CREATE TRIGGER role_change_audit_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.user_roles
    FOR EACH ROW EXECUTE FUNCTION public.audit_role_changes();

-- Add security function to prevent users from elevating their own roles
CREATE OR REPLACE FUNCTION public.prevent_self_role_elevation()
RETURNS TRIGGER AS $$
BEGIN
    -- Prevent users from modifying their own roles (except admins)
    IF NEW.profile_id = auth.uid() AND NOT has_role('admin'::app_role) THEN
        RAISE EXCEPTION 'Users cannot modify their own roles';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Add trigger to prevent self-role elevation
CREATE TRIGGER prevent_self_elevation_trigger
    BEFORE INSERT OR UPDATE ON public.user_roles
    FOR EACH ROW EXECUTE FUNCTION public.prevent_self_role_elevation();