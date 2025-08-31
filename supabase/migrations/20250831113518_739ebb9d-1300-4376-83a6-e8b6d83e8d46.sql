-- Final security step: Restrict access to the legacy profiles table
-- Now that we have the secure separated structure, restrict the old table

-- Remove the permissive policy on the profiles table and replace with restrictive ones
DROP POLICY IF EXISTS "profiles_ultra_secure_access" ON public.profiles;

-- Create new highly restrictive policies for the legacy profiles table
-- This table should now only be accessible through our secure functions
CREATE POLICY "profiles_admin_only_access"
ON public.profiles FOR ALL
TO authenticated
USING (has_role('admin'::app_role) AND validate_profile_access())
WITH CHECK (has_role('admin'::app_role) AND validate_profile_access());

-- Block all direct public access to profiles table
CREATE POLICY "profiles_block_public_access"
ON public.profiles FOR SELECT
TO authenticated
USING (false);

-- Update the existing ultra secure functions to maintain compatibility
-- but now they will primarily use the separated structure

-- Create a compatibility layer that still works with existing code
-- but uses the new secure separated structure underneath
CREATE OR REPLACE FUNCTION public.get_safe_profile_data(profile_uuid uuid)
RETURNS TABLE(
  id uuid, full_name text, email text, phone text, date_of_birth date, 
  nationality text, gender text, current_institution text, 
  current_field_of_study text, current_education_level text, 
  current_gpa numeric, credits_taken integer, thesis_topic text,
  language_certificates text[], preferred_fields text[], 
  preferred_degree_type text, preferred_cities text[], career_goals text,
  created_at timestamp with time zone, updated_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    profile_data record;
BEGIN
    -- Use the new secure function and map it to the old format
    SELECT * INTO profile_data FROM public.get_secure_complete_profile(profile_uuid) LIMIT 1;
    
    IF profile_data IS NULL THEN
        RETURN;
    END IF;
    
    RETURN QUERY
    SELECT 
        profile_data.id,
        profile_data.full_name,
        profile_data.email,
        profile_data.phone,
        profile_data.date_of_birth,
        profile_data.nationality,
        profile_data.gender,
        profile_data.institution_name, -- mapped from new structure
        profile_data.field_of_study,   -- mapped from new structure
        profile_data.education_level,  -- mapped from new structure
        NULL::numeric as current_gpa,  -- academic data is in student_academics table
        NULL::integer as credits_taken,
        NULL::text as thesis_topic,
        ARRAY[]::text[] as language_certificates,
        profile_data.preferred_fields,
        profile_data.preferred_degree_type,
        profile_data.preferred_cities,
        profile_data.career_goals,
        profile_data.created_at,
        profile_data.updated_at;
END;
$function$;

-- Add audit logging to track any remaining direct access attempts to profiles table
CREATE OR REPLACE FUNCTION public.log_legacy_profile_access()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
    -- Log any direct access to the legacy profiles table for monitoring
    INSERT INTO public.audit_logs (
        table_name, 
        operation, 
        user_id, 
        new_data,
        created_at
    ) VALUES (
        'profiles_legacy_access',
        TG_OP,
        auth.uid(),
        jsonb_build_object(
            'accessed_profile_id', COALESCE(NEW.id, OLD.id),
            'warning', 'Direct access to legacy profiles table detected',
            'recommendation', 'Use get_secure_complete_profile function instead'
        ),
        now()
    );
    
    RETURN COALESCE(NEW, OLD);
END;
$function$;

-- Add the audit trigger to the profiles table
DROP TRIGGER IF EXISTS log_legacy_profile_access_trigger ON public.profiles;
CREATE TRIGGER log_legacy_profile_access_trigger
    AFTER SELECT OR INSERT OR UPDATE OR DELETE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.log_legacy_profile_access();