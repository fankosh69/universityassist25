-- Fix security definer views by removing them and implementing proper RLS
-- Move extensions out of public schema

-- Drop security definer views if they exist
DROP VIEW IF EXISTS public.secure_profiles_view;
DROP VIEW IF EXISTS public.admin_user_view;

-- Move unaccent extension to extensions schema if it exists in public
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'unaccent' AND extnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')) THEN
        DROP EXTENSION IF EXISTS unaccent;
        CREATE EXTENSION IF NOT EXISTS unaccent SCHEMA extensions;
    END IF;
END $$;

-- Ensure profiles table has the most restrictive RLS policies
-- Block ALL direct access to profiles table - force use of secure functions only
DROP POLICY IF EXISTS "profiles_function_only_access" ON public.profiles;
DROP POLICY IF EXISTS "profiles_block_delete" ON public.profiles;

-- Create ultra-restrictive policies that block all direct access
CREATE POLICY "profiles_no_direct_access_select" ON public.profiles
FOR SELECT USING (false);

CREATE POLICY "profiles_no_direct_access_insert" ON public.profiles
FOR INSERT WITH CHECK (false);

CREATE POLICY "profiles_no_direct_access_update" ON public.profiles
FOR UPDATE USING (false);

CREATE POLICY "profiles_no_direct_access_delete" ON public.profiles
FOR DELETE USING (false);

-- Add audit trigger for any attempts to access profiles directly
CREATE OR REPLACE FUNCTION public.audit_blocked_profile_access()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
    -- Log any attempt to access profiles directly
    INSERT INTO public.audit_logs (
        table_name,
        operation,
        user_id,
        new_data,
        created_at
    ) VALUES (
        'profiles',
        'BLOCKED_DIRECT_ACCESS_ATTEMPT',
        auth.uid(),
        jsonb_build_object(
            'warning', 'Direct access to profiles table blocked by security policy',
            'attempted_operation', TG_OP,
            'recommendation', 'Use secure profile access functions instead'
        ),
        now()
    );
    
    -- Always reject the operation
    RAISE EXCEPTION 'Direct access to profiles table is not allowed. Use secure profile functions instead.';
END;
$$;

-- Create triggers to block and log any direct access attempts
DROP TRIGGER IF EXISTS block_profile_access_select ON public.profiles;
DROP TRIGGER IF EXISTS block_profile_access_insert ON public.profiles;
DROP TRIGGER IF EXISTS block_profile_access_update ON public.profiles;
DROP TRIGGER IF EXISTS block_profile_access_delete ON public.profiles;

-- Note: We can't create SELECT triggers, but the RLS policies handle that
CREATE TRIGGER block_profile_access_insert
    BEFORE INSERT ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.audit_blocked_profile_access();

CREATE TRIGGER block_profile_access_update
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.audit_blocked_profile_access();

CREATE TRIGGER block_profile_access_delete
    BEFORE DELETE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.audit_blocked_profile_access();