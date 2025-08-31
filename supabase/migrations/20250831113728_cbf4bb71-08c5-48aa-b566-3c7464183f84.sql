-- Ultra-restrictive security enhancement: Further tighten access controls
-- This addresses the remaining security scanner concerns about admin access

-- Update profiles table policies to be even more restrictive
DROP POLICY IF EXISTS "profiles_admin_only_access" ON public.profiles;
DROP POLICY IF EXISTS "profiles_block_public_access" ON public.profiles;

-- Create an extremely restrictive policy that only allows function-based access
CREATE POLICY "profiles_function_only_access"
ON public.profiles FOR ALL
TO authenticated
USING (false)  -- Block all direct access
WITH CHECK (false);  -- Block all direct modifications

-- Update private_profile_data policies to be more restrictive about admin access
DROP POLICY IF EXISTS "Admins can view masked private data" ON public.private_profile_data;

-- Create a new policy that limits admin access to only emergency situations
CREATE POLICY "Emergency admin access to private data"
ON public.private_profile_data FOR SELECT
TO authenticated
USING (
  auth.uid() = id OR  -- Owner always has access
  (has_role('admin'::app_role) AND 
   EXISTS (
     SELECT 1 FROM public.audit_logs 
     WHERE table_name = 'emergency_admin_access' 
     AND user_id = auth.uid() 
     AND created_at > now() - interval '24 hours'
   ))  -- Admin only with recent emergency authorization
);

-- Create emergency access logging function
CREATE OR REPLACE FUNCTION public.request_emergency_admin_access(
  reason text,
  target_profile_id uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    current_user_id uuid;
BEGIN
    current_user_id := auth.uid();
    
    -- Only admins can request emergency access
    IF NOT has_role('admin'::app_role) THEN
        RAISE EXCEPTION 'Only administrators can request emergency access';
    END IF;
    
    -- Log the emergency access request
    INSERT INTO public.audit_logs (table_name, operation, user_id, new_data, created_at)
    VALUES (
        'emergency_admin_access',
        'EMERGENCY_ACCESS_REQUESTED',
        current_user_id,
        jsonb_build_object(
            'reason', reason,
            'target_profile_id', target_profile_id,
            'timestamp', now(),
            'requires_justification', true
        ),
        now()
    );
    
    RETURN jsonb_build_object(
        'success', true,
        'message', 'Emergency admin access logged and granted for 24 hours',
        'expires_at', now() + interval '24 hours'
    );
END;
$function$;

-- Create a secure function to get public profile data only (no sensitive information)
CREATE OR REPLACE FUNCTION public.get_public_profile_display(profile_uuid uuid)
RETURNS TABLE(
  id uuid, display_name text, education_level text, field_of_study text, 
  institution_name text, is_profile_complete boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
    -- This function returns only public, non-sensitive data for display purposes
    RETURN QUERY
    SELECT 
        pp.id, pp.display_name, pp.education_level, pp.field_of_study,
        pp.institution_name, pp.is_profile_complete
    FROM public.public_profiles pp
    WHERE pp.id = profile_uuid;
    
    -- Log the access for monitoring
    INSERT INTO public.audit_logs (table_name, operation, user_id, new_data, created_at)
    VALUES ('public_profile_display', 'PUBLIC_DATA_ACCESS', auth.uid(), 
            jsonb_build_object('accessed_profile', profile_uuid), now());
END;
$function$;

-- Update the get_secure_complete_profile function to have even stricter logging
CREATE OR REPLACE FUNCTION public.get_secure_complete_profile(profile_uuid uuid)
RETURNS TABLE(
  -- Public data
  id uuid, display_name text, education_level text, field_of_study text, 
  institution_name text, bio text, is_profile_complete boolean,
  -- Private data (only for owner/emergency admin)
  full_name text, email text, phone text, date_of_birth date, nationality text, gender text,
  -- Academic preferences
  preferred_fields text[], preferred_degree_type text, preferred_cities text[], career_goals text,
  -- Metadata
  created_at timestamp with time zone, updated_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    current_user_id uuid;
    is_admin boolean;
    is_owner boolean;
    has_emergency_access boolean := false;
BEGIN
    current_user_id := auth.uid();
    
    IF current_user_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required';
    END IF;
    
    is_owner := (profile_uuid = current_user_id);
    is_admin := has_role('admin'::app_role);
    
    -- Check for emergency admin access
    IF is_admin AND NOT is_owner THEN
        SELECT EXISTS (
            SELECT 1 FROM public.audit_logs 
            WHERE table_name = 'emergency_admin_access' 
            AND user_id = current_user_id 
            AND created_at > now() - interval '24 hours'
        ) INTO has_emergency_access;
    END IF;
    
    -- Enhanced security logging with access justification
    INSERT INTO public.audit_logs (table_name, operation, user_id, new_data, created_at)
    VALUES ('secure_profile_access', 'COMPLETE_PROFILE_ACCESS', current_user_id, 
            jsonb_build_object(
                'requested_profile', profile_uuid, 
                'is_owner', is_owner,
                'is_admin', is_admin,
                'has_emergency_access', has_emergency_access,
                'access_granted', (is_owner OR has_emergency_access),
                'security_level', 'ULTRA_SECURE'
            ), 
            now());
    
    -- Return data based on ultra-strict access level
    RETURN QUERY
    SELECT 
        pp.id, pp.display_name, pp.education_level, pp.field_of_study,
        pp.institution_name, pp.bio, pp.is_profile_complete,
        -- Private data only for owner or admin with emergency access
        CASE WHEN is_owner OR has_emergency_access THEN ppd.full_name ELSE NULL END,
        CASE WHEN is_owner OR has_emergency_access THEN ppd.email ELSE NULL END,
        CASE WHEN is_owner OR has_emergency_access THEN ppd.phone ELSE NULL END,
        CASE WHEN is_owner OR has_emergency_access THEN ppd.date_of_birth ELSE NULL END,
        CASE WHEN is_owner OR has_emergency_access THEN ppd.nationality ELSE NULL END,
        CASE WHEN is_owner OR has_emergency_access THEN ppd.gender ELSE NULL END,
        -- Academic preferences for owner/admin/counselor
        CASE WHEN is_owner OR is_admin OR has_role('counselor'::app_role) THEN ap.preferred_fields ELSE NULL END,
        CASE WHEN is_owner OR is_admin OR has_role('counselor'::app_role) THEN ap.preferred_degree_type ELSE NULL END,
        CASE WHEN is_owner OR is_admin OR has_role('counselor'::app_role) THEN ap.preferred_cities ELSE NULL END,
        CASE WHEN is_owner OR is_admin OR has_role('counselor'::app_role) THEN ap.career_goals ELSE NULL END,
        pp.created_at, pp.updated_at
    FROM public.public_profiles pp
    LEFT JOIN public.private_profile_data ppd ON pp.id = ppd.id
    LEFT JOIN public.academic_preferences ap ON pp.id = ap.id
    WHERE pp.id = profile_uuid;
END;
$function$;