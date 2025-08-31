-- Step 2: Create security-enhanced table structure with secure functions
-- Now that counselor role exists, we can proceed with the security migration

-- Create validation triggers and helper functions
CREATE OR REPLACE FUNCTION public.validate_private_profile_data()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
    -- Validate email format
    IF NEW.email IS NOT NULL AND NEW.email !~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN
        RAISE EXCEPTION 'Invalid email format';
    END IF;
    
    -- Validate phone format
    IF NEW.phone IS NOT NULL AND LENGTH(NEW.phone) < 8 THEN
        RAISE EXCEPTION 'Phone number too short';
    END IF;
    
    -- Validate date of birth
    IF NEW.date_of_birth IS NOT NULL AND NEW.date_of_birth >= CURRENT_DATE THEN
        RAISE EXCEPTION 'Date of birth must be in the past';
    END IF;
    
    -- Sanitize text fields
    NEW.full_name := TRIM(REGEXP_REPLACE(COALESCE(NEW.full_name, ''), '[<>\"'']', '', 'g'));
    NEW.emergency_contact_name := TRIM(REGEXP_REPLACE(COALESCE(NEW.emergency_contact_name, ''), '[<>\"'']', '', 'g'));
    
    -- Update security audit timestamp
    NEW.last_security_audit := now();
    
    RETURN NEW;
END;
$function$;

-- Add triggers to the tables if they don't exist already
DO $$ 
BEGIN
    -- Add triggers for public_profiles
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_public_profiles_updated_at') THEN
        CREATE TRIGGER update_public_profiles_updated_at
          BEFORE UPDATE ON public.public_profiles
          FOR EACH ROW
          EXECUTE FUNCTION public.update_updated_at_column();
    END IF;

    -- Add triggers for private_profile_data
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_private_profile_data_updated_at') THEN
        CREATE TRIGGER update_private_profile_data_updated_at
          BEFORE UPDATE ON public.private_profile_data
          FOR EACH ROW
          EXECUTE FUNCTION public.update_updated_at_column();
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'validate_private_profile_data_trigger') THEN
        CREATE TRIGGER validate_private_profile_data_trigger
          BEFORE INSERT OR UPDATE ON public.private_profile_data
          FOR EACH ROW
          EXECUTE FUNCTION public.validate_private_profile_data();
    END IF;

    -- Add triggers for academic_preferences
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_academic_preferences_updated_at') THEN
        CREATE TRIGGER update_academic_preferences_updated_at
          BEFORE UPDATE ON public.academic_preferences
          FOR EACH ROW
          EXECUTE FUNCTION public.update_updated_at_column();
    END IF;
END $$;

-- Create secure functions for the new separated structure
-- This replaces the old get_safe_profile_data function
CREATE OR REPLACE FUNCTION public.get_secure_complete_profile(profile_uuid uuid)
RETURNS TABLE(
  -- Public data
  id uuid, display_name text, education_level text, field_of_study text, 
  institution_name text, bio text, is_profile_complete boolean,
  -- Private data (only for owner/admin)
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
BEGIN
    current_user_id := auth.uid();
    
    IF current_user_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required';
    END IF;
    
    is_owner := (profile_uuid = current_user_id);
    is_admin := has_role('admin'::app_role);
    
    -- Log access attempt
    INSERT INTO public.audit_logs (table_name, operation, user_id, new_data, created_at)
    VALUES ('secure_profile_access', 'COMPLETE_PROFILE_ACCESS', current_user_id, 
            jsonb_build_object('requested_profile', profile_uuid, 'is_owner', is_owner, 'is_admin', is_admin), 
            now());
    
    -- Return data based on access level
    RETURN QUERY
    SELECT 
        pp.id, pp.display_name, pp.education_level, pp.field_of_study,
        pp.institution_name, pp.bio, pp.is_profile_complete,
        -- Private data only for owner/admin
        CASE WHEN is_owner OR is_admin THEN ppd.full_name ELSE NULL END,
        CASE WHEN is_owner OR is_admin THEN ppd.email ELSE NULL END,
        CASE WHEN is_owner OR is_admin THEN ppd.phone ELSE NULL END,
        CASE WHEN is_owner OR is_admin THEN ppd.date_of_birth ELSE NULL END,
        CASE WHEN is_owner OR is_admin THEN ppd.nationality ELSE NULL END,
        CASE WHEN is_owner OR is_admin THEN ppd.gender ELSE NULL END,
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

-- Create secure update function for the new structure
CREATE OR REPLACE FUNCTION public.secure_update_separated_profile(
  profile_uuid uuid,
  public_data jsonb DEFAULT NULL,
  private_data jsonb DEFAULT NULL,
  academic_data jsonb DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    current_user_id uuid;
    is_owner boolean;
    update_count int := 0;
    result jsonb;
BEGIN
    current_user_id := auth.uid();
    
    IF current_user_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required';
    END IF;
    
    is_owner := (profile_uuid = current_user_id);
    IF NOT is_owner AND NOT has_role('admin'::app_role) THEN
        RAISE EXCEPTION 'Access denied: Can only update own profile';
    END IF;
    
    -- Rate limiting
    IF EXISTS (
        SELECT 1 FROM public.audit_logs 
        WHERE user_id = current_user_id 
        AND table_name = 'secure_profile_update'
        AND created_at > now() - interval '1 minute'
        GROUP BY user_id
        HAVING count(*) >= 3
    ) THEN
        RAISE EXCEPTION 'Rate limit exceeded: Too many profile updates';
    END IF;
    
    -- Update public profile data
    IF public_data IS NOT NULL THEN
        UPDATE public.public_profiles 
        SET 
            display_name = COALESCE(public_data->>'display_name', display_name),
            education_level = COALESCE(public_data->>'education_level', education_level),
            field_of_study = COALESCE(public_data->>'field_of_study', field_of_study),
            institution_name = COALESCE(public_data->>'institution_name', institution_name),
            bio = COALESCE(public_data->>'bio', bio),
            updated_at = now()
        WHERE id = profile_uuid;
        
        GET DIAGNOSTICS update_count = ROW_COUNT;
    END IF;
    
    -- Update private data (owner only for most fields)
    IF private_data IS NOT NULL AND is_owner THEN
        UPDATE public.private_profile_data 
        SET 
            full_name = COALESCE(TRIM(REGEXP_REPLACE(private_data->>'full_name', '[<>\"'']', '', 'g')), full_name),
            email = COALESCE(private_data->>'email', email),
            phone = COALESCE(private_data->>'phone', phone),
            nationality = COALESCE(private_data->>'nationality', nationality),
            gender = COALESCE(private_data->>'gender', gender),
            updated_at = now()
        WHERE id = profile_uuid;
    END IF;
    
    -- Update academic preferences
    IF academic_data IS NOT NULL THEN
        UPDATE public.academic_preferences 
        SET 
            preferred_fields = COALESCE((academic_data->'preferred_fields')::text[], preferred_fields),
            preferred_degree_type = COALESCE(academic_data->>'preferred_degree_type', preferred_degree_type),
            preferred_cities = COALESCE((academic_data->'preferred_cities')::text[], preferred_cities),
            career_goals = COALESCE(academic_data->>'career_goals', career_goals),
            updated_at = now()
        WHERE id = profile_uuid;
    END IF;
    
    -- Update profile completion status
    UPDATE public.public_profiles 
    SET is_profile_complete = (
        SELECT display_name IS NOT NULL 
        AND education_level IS NOT NULL 
        AND field_of_study IS NOT NULL
        FROM public.public_profiles 
        WHERE id = profile_uuid
    )
    WHERE id = profile_uuid;
    
    -- Log the update
    INSERT INTO public.audit_logs (table_name, operation, user_id, new_data, created_at)
    VALUES ('secure_profile_update', 'SEPARATED_PROFILE_UPDATE', current_user_id, 
            jsonb_build_object(
                'profile_id', profile_uuid,
                'public_updated', (public_data IS NOT NULL),
                'private_updated', (private_data IS NOT NULL AND is_owner),
                'academic_updated', (academic_data IS NOT NULL)
            ), 
            now());
    
    RETURN jsonb_build_object(
        'success', true,
        'message', 'Profile updated successfully with enhanced security',
        'timestamp', now()
    );
END;
$function$;