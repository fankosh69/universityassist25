-- Address remaining security issues

-- Find and remove any remaining SECURITY DEFINER views
DO $$
DECLARE
    view_record RECORD;
BEGIN
    FOR view_record IN 
        SELECT schemaname, viewname 
        FROM pg_views 
        WHERE schemaname = 'public' 
        AND definition ILIKE '%SECURITY DEFINER%'
    LOOP
        EXECUTE 'DROP VIEW IF EXISTS ' || quote_ident(view_record.schemaname) || '.' || quote_ident(view_record.viewname) || ' CASCADE';
        RAISE NOTICE 'Dropped security definer view: %.%', view_record.schemaname, view_record.viewname;
    END LOOP;
END $$;

-- Ensure unaccent extension is in extensions schema
DROP EXTENSION IF EXISTS unaccent CASCADE;
CREATE EXTENSION IF NOT EXISTS unaccent SCHEMA extensions;

-- Add additional security to private profile data
-- Strengthen the emergency access policy with more restrictive time limits
DROP POLICY IF EXISTS "Emergency admin access to private data" ON public.private_profile_data;

CREATE POLICY "Restricted emergency admin access to private data" 
ON public.private_profile_data 
FOR SELECT 
USING (
    auth.uid() = id 
    OR (
        has_role('admin'::app_role) 
        AND EXISTS (
            SELECT 1 FROM audit_logs
            WHERE table_name = 'emergency_admin_access'
            AND user_id = auth.uid()
            AND created_at > (now() - interval '1 hour')  -- Reduced from 24 hours to 1 hour
            AND new_data->>'justification' IS NOT NULL
        )
    )
);

-- Create function to require justification for admin emergency access
CREATE OR REPLACE FUNCTION public.request_emergency_profile_access(target_profile_id uuid, justification text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
    -- Only admins can request emergency access
    IF NOT has_role('admin'::app_role) THEN
        RAISE EXCEPTION 'Only administrators can request emergency profile access';
    END IF;
    
    -- Justification is required
    IF justification IS NULL OR length(trim(justification)) < 10 THEN
        RAISE EXCEPTION 'Detailed justification (min 10 characters) is required for emergency access';
    END IF;
    
    -- Log the emergency access request with justification
    INSERT INTO public.audit_logs (table_name, operation, user_id, new_data, created_at)
    VALUES (
        'emergency_admin_access',
        'EMERGENCY_ACCESS_REQUESTED',
        auth.uid(),
        jsonb_build_object(
            'target_profile_id', target_profile_id,
            'justification', justification,
            'timestamp', now(),
            'expires_at', now() + interval '1 hour'
        ),
        now()
    );
    
    RETURN jsonb_build_object(
        'success', true,
        'message', 'Emergency access granted for 1 hour with justification logged',
        'expires_at', now() + interval '1 hour'
    );
END;
$$;