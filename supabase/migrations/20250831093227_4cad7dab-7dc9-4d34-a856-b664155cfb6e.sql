-- Fix Security Definer View Issue
-- Replace the problematic view with a safer approach

-- Drop the problematic security definer view
DROP VIEW IF EXISTS public.profiles_safe_view;

-- Create a safer function instead of a view for getting masked profile data
CREATE OR REPLACE FUNCTION public.get_masked_profile_data(profile_uuid uuid DEFAULT NULL)
RETURNS TABLE(
    id uuid,
    display_name text,
    masked_email text,
    masked_phone text,
    education_level text,
    field_of_study text,
    nationality text,
    created_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    current_user_id uuid;
    target_profile_id uuid;
BEGIN
    current_user_id := auth.uid();
    target_profile_id := COALESCE(profile_uuid, current_user_id);
    
    -- Authentication required
    IF current_user_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required';
    END IF;
    
    -- Rate limiting check
    IF NOT check_profile_access_rate_limit() THEN
        RAISE EXCEPTION 'Rate limit exceeded';
    END IF;
    
    -- Return masked or full data based on access rights
    RETURN QUERY
    SELECT 
        p.id,
        CASE 
            WHEN p.id = current_user_id OR has_role('admin'::app_role) THEN p.full_name
            ELSE COALESCE(split_part(p.full_name, ' ', 1), 'Anonymous') || ' ' || 
                 COALESCE(left(split_part(p.full_name, ' ', 2), 1) || '.', '')
        END as display_name,
        CASE 
            WHEN p.id = current_user_id OR has_role('admin'::app_role) THEN p.email
            ELSE left(p.email, 2) || '***@' || split_part(p.email, '@', 2)
        END as masked_email,
        CASE 
            WHEN p.id = current_user_id OR has_role('admin'::app_role) THEN p.phone
            ELSE '***-***-' || right(COALESCE(p.phone, '0000'), 4)
        END as masked_phone,
        p.current_education_level,
        p.current_field_of_study,
        p.nationality,
        p.created_at
    FROM public.profiles p
    WHERE p.id = target_profile_id
    AND (p.id = current_user_id OR has_role('admin'::app_role) OR target_profile_id IS NOT NULL);
    
    -- Log the access
    INSERT INTO public.audit_logs (table_name, operation, user_id, new_data, created_at)
    VALUES ('profiles', 'MASKED_DATA_ACCESS', current_user_id, 
            jsonb_build_object('accessed_profile', target_profile_id), now());
END;
$$;