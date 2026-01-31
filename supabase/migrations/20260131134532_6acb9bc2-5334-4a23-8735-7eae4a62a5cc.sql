-- =====================================================
-- ENHANCED PROFILE SECURITY - Complete Implementation
-- =====================================================

-- 1. Drop existing function that conflicts
DROP FUNCTION IF EXISTS public.get_secure_complete_profile(uuid) CASCADE;

-- 2. Create private_profile_data table for sensitive PII
CREATE TABLE IF NOT EXISTS public.private_profile_data (
    id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name text,
    email text,
    phone text,
    date_of_birth date,
    nationality text,
    gender text,
    country_code text DEFAULT '+49',
    emergency_contact_name text,
    emergency_contact_phone text,
    emergency_contact_relationship text,
    data_processing_consent boolean DEFAULT false,
    marketing_consent boolean DEFAULT false,
    last_security_audit timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- 3. Enable RLS on private_profile_data
ALTER TABLE public.private_profile_data ENABLE ROW LEVEL SECURITY;

-- 4. Drop any existing policies before creating new ones
DROP POLICY IF EXISTS "No direct access to private profile data" ON public.private_profile_data;
DROP POLICY IF EXISTS "Owners can update own private data via functions only" ON public.private_profile_data;
DROP POLICY IF EXISTS "Owners can insert own private data" ON public.private_profile_data;

-- 5. Create strict RLS policies - NO direct SELECT access
CREATE POLICY "No direct access to private profile data"
    ON public.private_profile_data FOR SELECT
    USING (false);

CREATE POLICY "Owners can update own private data via functions only"
    ON public.private_profile_data FOR UPDATE
    USING (false);

CREATE POLICY "Owners can insert own private data"
    ON public.private_profile_data FOR INSERT
    WITH CHECK (auth.uid() = id);

-- 6. Create secure getter function with audit logging
CREATE OR REPLACE FUNCTION public.get_private_profile_data(profile_uuid uuid)
RETURNS TABLE (
    id uuid,
    full_name text,
    email text,
    phone text,
    date_of_birth date,
    nationality text,
    gender text,
    country_code text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    requesting_user_id uuid;
    is_admin boolean;
BEGIN
    requesting_user_id := auth.uid();
    
    SELECT EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE profile_id = requesting_user_id AND role = 'admin'
    ) INTO is_admin;
    
    IF requesting_user_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required';
    END IF;
    
    IF requesting_user_id != profile_uuid AND NOT is_admin THEN
        RAISE EXCEPTION 'Access denied: You can only view your own private data';
    END IF;
    
    INSERT INTO public.audit_logs (table_name, operation, user_id, new_data, ip_address)
    VALUES ('private_profile_data', 'SELECT', requesting_user_id, 
            jsonb_build_object('accessed_profile', profile_uuid), inet_client_addr());
    
    RETURN QUERY
    SELECT ppd.id, ppd.full_name, ppd.email, ppd.phone, ppd.date_of_birth, 
           ppd.nationality, ppd.gender, ppd.country_code
    FROM public.private_profile_data ppd
    WHERE ppd.id = profile_uuid;
END;
$$;

-- 7. Create secure update function for private data
CREATE OR REPLACE FUNCTION public.update_private_profile_data(profile_uuid uuid, update_data jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    requesting_user_id uuid;
    old_data jsonb;
BEGIN
    requesting_user_id := auth.uid();
    
    IF requesting_user_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required';
    END IF;
    
    IF requesting_user_id != profile_uuid THEN
        RAISE EXCEPTION 'Access denied: You can only update your own private data';
    END IF;
    
    SELECT to_jsonb(ppd.*) INTO old_data FROM public.private_profile_data ppd WHERE ppd.id = profile_uuid;
    
    UPDATE public.private_profile_data
    SET
        full_name = COALESCE(update_data->>'full_name', full_name),
        email = COALESCE(update_data->>'email', email),
        phone = COALESCE(update_data->>'phone', phone),
        date_of_birth = CASE WHEN update_data->>'date_of_birth' IS NOT NULL 
                        THEN (update_data->>'date_of_birth')::date ELSE date_of_birth END,
        nationality = COALESCE(update_data->>'nationality', nationality),
        gender = COALESCE(update_data->>'gender', gender),
        country_code = COALESCE(update_data->>'country_code', country_code),
        updated_at = now()
    WHERE id = profile_uuid;
    
    INSERT INTO public.audit_logs (table_name, operation, user_id, old_data, new_data, ip_address)
    VALUES ('private_profile_data', 'UPDATE', requesting_user_id, old_data, update_data, inet_client_addr());
    
    RETURN jsonb_build_object('success', true, 'message', 'Private profile data updated securely', 'timestamp', now());
END;
$$;

-- 8. Create migration function
CREATE OR REPLACE FUNCTION public.migrate_profile_pii_to_private()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.private_profile_data (id, full_name, email, phone, date_of_birth, nationality, gender, country_code)
    SELECT id, full_name, email, phone, date_of_birth, nationality, gender, country_code
    FROM public.profiles
    WHERE id NOT IN (SELECT id FROM public.private_profile_data)
    ON CONFLICT (id) DO NOTHING;
END;
$$;

-- 9. Run the migration
SELECT public.migrate_profile_pii_to_private();

-- 10. Create combined secure profile view function
CREATE OR REPLACE FUNCTION public.get_secure_complete_profile(profile_uuid uuid)
RETURNS TABLE (
    id uuid,
    full_name text,
    email text,
    phone text,
    date_of_birth date,
    nationality text,
    gender text,
    country_code text,
    avatar_url text,
    role text,
    current_education_level text,
    current_field_of_study text,
    current_institution text,
    current_gpa numeric,
    credits_taken integer,
    thesis_topic text,
    language_certificates text[],
    preferred_fields text[],
    preferred_degree_type text,
    preferred_cities text[],
    career_goals text,
    xp_points integer,
    level integer,
    streak_days integer,
    created_at timestamp with time zone,
    updated_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    requesting_user_id uuid;
    is_admin boolean;
BEGIN
    requesting_user_id := auth.uid();
    
    SELECT EXISTS (
        SELECT 1 FROM public.user_roles WHERE profile_id = requesting_user_id AND role = 'admin'
    ) INTO is_admin;
    
    IF requesting_user_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required';
    END IF;
    
    IF requesting_user_id != profile_uuid AND NOT is_admin THEN
        RAISE EXCEPTION 'Access denied';
    END IF;
    
    INSERT INTO public.audit_logs (table_name, operation, user_id, new_data, ip_address)
    VALUES ('profiles_complete', 'SELECT', requesting_user_id, 
            jsonb_build_object('accessed_profile', profile_uuid), inet_client_addr());
    
    RETURN QUERY
    SELECT 
        p.id,
        COALESCE(ppd.full_name, p.full_name) as full_name,
        COALESCE(ppd.email, p.email) as email,
        COALESCE(ppd.phone, p.phone) as phone,
        COALESCE(ppd.date_of_birth, p.date_of_birth) as date_of_birth,
        COALESCE(ppd.nationality, p.nationality) as nationality,
        COALESCE(ppd.gender, p.gender) as gender,
        COALESCE(ppd.country_code, p.country_code) as country_code,
        p.avatar_url,
        p.role,
        p.current_education_level,
        p.current_field_of_study,
        p.current_institution,
        p.current_gpa,
        p.credits_taken,
        p.thesis_topic,
        p.language_certificates,
        p.preferred_fields,
        p.preferred_degree_type,
        p.preferred_cities,
        p.career_goals,
        p.xp_points,
        p.level,
        p.streak_days,
        p.created_at,
        p.updated_at
    FROM public.profiles p
    LEFT JOIN public.private_profile_data ppd ON p.id = ppd.id
    WHERE p.id = profile_uuid;
END;
$$;

-- 11. Grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_private_profile_data(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_private_profile_data(uuid, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_secure_complete_profile(uuid) TO authenticated;

-- 12. Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_private_profile_data_id ON public.private_profile_data(id);

-- 13. Add trigger for automatic private data sync on profile changes
CREATE OR REPLACE FUNCTION public.sync_profile_to_private()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.private_profile_data (id, full_name, email, phone, date_of_birth, nationality, gender, country_code)
    VALUES (NEW.id, NEW.full_name, NEW.email, NEW.phone, NEW.date_of_birth, NEW.nationality, NEW.gender, NEW.country_code)
    ON CONFLICT (id) DO UPDATE SET
        full_name = COALESCE(EXCLUDED.full_name, private_profile_data.full_name),
        email = COALESCE(EXCLUDED.email, private_profile_data.email),
        phone = COALESCE(EXCLUDED.phone, private_profile_data.phone),
        date_of_birth = COALESCE(EXCLUDED.date_of_birth, private_profile_data.date_of_birth),
        nationality = COALESCE(EXCLUDED.nationality, private_profile_data.nationality),
        gender = COALESCE(EXCLUDED.gender, private_profile_data.gender),
        country_code = COALESCE(EXCLUDED.country_code, private_profile_data.country_code),
        updated_at = now();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS sync_profile_private_data ON public.profiles;
CREATE TRIGGER sync_profile_private_data
    AFTER INSERT OR UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.sync_profile_to_private();

-- 14. Add validation trigger for private profile data
CREATE OR REPLACE FUNCTION public.validate_private_profile_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NEW.email IS NOT NULL AND NEW.email !~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN
        RAISE EXCEPTION 'Invalid email format';
    END IF;
    
    IF NEW.phone IS NOT NULL AND LENGTH(NEW.phone) < 8 THEN
        RAISE EXCEPTION 'Phone number too short';
    END IF;
    
    IF NEW.date_of_birth IS NOT NULL AND NEW.date_of_birth >= CURRENT_DATE THEN
        RAISE EXCEPTION 'Date of birth must be in the past';
    END IF;
    
    NEW.full_name := TRIM(REGEXP_REPLACE(COALESCE(NEW.full_name, ''), '[<>\"'']', '', 'g'));
    NEW.updated_at := now();
    NEW.last_security_audit := now();
    
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS validate_private_profile_before_change ON public.private_profile_data;
CREATE TRIGGER validate_private_profile_before_change
    BEFORE INSERT OR UPDATE ON public.private_profile_data
    FOR EACH ROW
    EXECUTE FUNCTION public.validate_private_profile_insert();