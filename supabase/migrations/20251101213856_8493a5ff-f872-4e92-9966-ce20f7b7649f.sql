-- Drop the overly restrictive triggers that block ALL updates
DROP TRIGGER IF EXISTS block_profile_access_update ON public.profiles;
DROP TRIGGER IF EXISTS block_profile_access_insert ON public.profiles;
DROP TRIGGER IF EXISTS block_profile_access_delete ON public.profiles;

-- Drop the blocking function
DROP FUNCTION IF EXISTS public.block_profile_access() CASCADE;

-- Drop the ultra-restrictive RLS policies if they exist
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "profiles_no_direct_access_select" ON public.profiles;
    DROP POLICY IF EXISTS "profiles_no_direct_access_insert" ON public.profiles;
    DROP POLICY IF EXISTS "profiles_no_direct_access_update" ON public.profiles;
    DROP POLICY IF EXISTS "profiles_no_direct_access_delete" ON public.profiles;
EXCEPTION WHEN OTHERS THEN
    NULL; -- Ignore if policies don't exist
END $$;

-- Keep audit logging but make it non-blocking (AFTER trigger)
CREATE OR REPLACE FUNCTION public.log_profile_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
    -- Log the update for audit purposes only - don't block
    BEGIN
        INSERT INTO public.audit_logs (
            table_name,
            operation,
            user_id,
            old_data,
            new_data,
            created_at
        ) VALUES (
            'profiles',
            TG_OP,
            auth.uid(),
            to_jsonb(OLD),
            to_jsonb(NEW),
            now()
        );
    EXCEPTION WHEN OTHERS THEN
        -- Don't fail the update if audit logging fails
        NULL;
    END;
    
    RETURN NEW; -- ALLOW the operation to proceed
END;
$$;

-- Replace blocking trigger with non-blocking audit trigger (AFTER UPDATE)
DROP TRIGGER IF EXISTS audit_profile_changes ON public.profiles;
CREATE TRIGGER audit_profile_changes
    AFTER UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.log_profile_update();