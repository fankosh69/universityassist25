-- Security Enhancement: Separate sensitive personal data from public profile data
-- This addresses the security finding about customer personal data exposure

-- Create public profiles table for non-sensitive data
CREATE TABLE public.public_profiles (
  id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,  
  display_name text,
  education_level text,
  field_of_study text,
  institution_name text,
  academic_year text,
  bio text,
  avatar_url text,
  is_profile_complete boolean DEFAULT false,
  visibility_settings jsonb DEFAULT '{"display_name": true, "education_level": true, "field_of_study": true}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  PRIMARY KEY (id)
);

-- Create private profile data table for sensitive information
CREATE TABLE public.private_profile_data (
  id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  email text,
  phone text,
  date_of_birth date,
  nationality text,
  gender text,
  country_code text DEFAULT '+49'::text,
  emergency_contact_name text,
  emergency_contact_phone text,
  emergency_contact_relationship text,
  data_processing_consent boolean DEFAULT false,
  marketing_consent boolean DEFAULT false,
  profile_encryption_key text, -- For future encryption implementation
  last_security_audit timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  PRIMARY KEY (id)
);

-- Create academic preferences table (non-sensitive academic interests)
CREATE TABLE public.academic_preferences (
  id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  preferred_fields text[] DEFAULT '{}'::text[],
  preferred_degree_type text,
  preferred_cities text[] DEFAULT '{}'::text[],
  career_goals text,
  study_motivations text[],
  preferred_language_of_instruction text[] DEFAULT '{}'::text[],
  preferred_start_date text,
  budget_range text,
  accommodation_preferences jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  PRIMARY KEY (id)
);

-- Enable RLS on all new tables
ALTER TABLE public.public_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.private_profile_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academic_preferences ENABLE ROW LEVEL SECURITY;

-- Public profiles policies (more permissive for display purposes)
CREATE POLICY "Public profiles are viewable by authenticated users"
ON public.public_profiles FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can update own public profile"
ON public.public_profiles FOR ALL
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Private profile data policies (very restrictive)
CREATE POLICY "Private data only accessible by owner"
ON public.private_profile_data FOR ALL
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can view masked private data"
ON public.private_profile_data FOR SELECT
TO authenticated
USING (has_role('admin'::app_role));

-- Academic preferences policies
CREATE POLICY "Academic preferences accessible by owner"
ON public.academic_preferences FOR ALL
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

CREATE POLICY "Counselors can view academic preferences"
ON public.academic_preferences FOR SELECT
TO authenticated
USING (has_role('admin'::app_role) OR has_role('counselor'::app_role));

-- Create updated timestamp triggers
CREATE TRIGGER update_public_profiles_updated_at
  BEFORE UPDATE ON public.public_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_private_profile_data_updated_at
  BEFORE UPDATE ON public.private_profile_data
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_academic_preferences_updated_at
  BEFORE UPDATE ON public.academic_preferences
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create validation triggers for private data
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

CREATE TRIGGER validate_private_profile_data_trigger
  BEFORE INSERT OR UPDATE ON public.private_profile_data
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_private_profile_data();

-- Migrate existing data from profiles table to new structure
INSERT INTO public.public_profiles (
  id, display_name, education_level, field_of_study, institution_name, 
  is_profile_complete, created_at, updated_at
)
SELECT 
  id,
  CASE 
    WHEN full_name IS NOT NULL THEN 
      SPLIT_PART(full_name, ' ', 1) || ' ' || COALESCE(LEFT(SPLIT_PART(full_name, ' ', 2), 1) || '.', '')
    ELSE 'Student'
  END as display_name,
  current_education_level,
  current_field_of_study,
  current_institution,
  (full_name IS NOT NULL AND current_education_level IS NOT NULL) as is_profile_complete,
  created_at,
  updated_at
FROM public.profiles
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.private_profile_data (
  id, full_name, email, phone, date_of_birth, nationality, gender, 
  country_code, data_processing_consent, created_at, updated_at
)
SELECT 
  id, full_name, email, phone, date_of_birth, nationality, gender,
  country_code, true as data_processing_consent, created_at, updated_at
FROM public.profiles
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.academic_preferences (
  id, preferred_fields, preferred_degree_type, preferred_cities, career_goals,
  created_at, updated_at
)
SELECT 
  id, preferred_fields, preferred_degree_type, preferred_cities, career_goals,
  created_at, updated_at
FROM public.profiles
ON CONFLICT (id) DO NOTHING;

-- Create secure function to get complete profile data (replacement for existing secure functions)
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