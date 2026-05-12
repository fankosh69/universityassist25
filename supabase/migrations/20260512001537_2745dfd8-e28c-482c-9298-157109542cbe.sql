
-- 1) Sync PII from profiles into private_profile_data
INSERT INTO public.private_profile_data (id, full_name, email, phone, date_of_birth, nationality, gender, country_code)
SELECT id, full_name, email, phone, date_of_birth, nationality, gender, country_code
FROM public.profiles
ON CONFLICT (id) DO UPDATE SET
  email = COALESCE(public.private_profile_data.email, EXCLUDED.email),
  phone = COALESCE(public.private_profile_data.phone, EXCLUDED.phone),
  full_name = COALESCE(public.private_profile_data.full_name, EXCLUDED.full_name),
  date_of_birth = COALESCE(public.private_profile_data.date_of_birth, EXCLUDED.date_of_birth),
  nationality = COALESCE(public.private_profile_data.nationality, EXCLUDED.nationality),
  gender = COALESCE(public.private_profile_data.gender, EXCLUDED.gender),
  country_code = COALESCE(public.private_profile_data.country_code, EXCLUDED.country_code),
  updated_at = now();

-- 2) Update handle_new_user to also populate private_profile_data
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (
    id, full_name, gender, date_of_birth, country_code, created_at, updated_at
  )
  VALUES (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'gender',
    (new.raw_user_meta_data->>'date_of_birth')::date,
    new.raw_user_meta_data->>'country_code',
    now(), now()
  );

  INSERT INTO public.private_profile_data (
    id, full_name, email, phone, date_of_birth, nationality, gender, country_code, created_at, updated_at
  )
  VALUES (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.email,
    new.raw_user_meta_data->>'phone',
    (new.raw_user_meta_data->>'date_of_birth')::date,
    new.raw_user_meta_data->>'nationality',
    new.raw_user_meta_data->>'gender',
    new.raw_user_meta_data->>'country_code',
    now(), now()
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN new;
END;
$function$;

-- 3) Trigger: prevent non-admins from changing profiles.role
CREATE OR REPLACE FUNCTION public.prevent_profile_role_update()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
BEGIN
    IF NEW.role IS DISTINCT FROM OLD.role AND NOT public.has_role('admin'::public.app_role) THEN
        RAISE EXCEPTION 'Only administrators can change a user role';
    END IF;
    RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS prevent_profile_role_update ON public.profiles;
CREATE TRIGGER prevent_profile_role_update
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.prevent_profile_role_update();

-- 4) Drop sensitive columns from message_outbox (table currently empty)
ALTER TABLE public.message_outbox DROP COLUMN IF EXISTS recipient_email;
ALTER TABLE public.message_outbox DROP COLUMN IF EXISTS recipient_phone;

-- 5) Tighten message_outbox policies to authenticated only
DROP POLICY IF EXISTS "Users can view their own messages" ON public.message_outbox;
DROP POLICY IF EXISTS "Admins can manage messages" ON public.message_outbox;

CREATE POLICY "Users can view their own messages"
    ON public.message_outbox FOR SELECT TO authenticated
    USING (auth.uid() = recipient_id);

CREATE POLICY "Admins can manage messages"
    ON public.message_outbox FOR ALL TO authenticated
    USING (public.has_role('admin'::public.app_role))
    WITH CHECK (public.has_role('admin'::public.app_role));

-- 6) Update secure_update_profile to reject email/phone updates
CREATE OR REPLACE FUNCTION public.secure_update_profile(profile_id uuid, new_data jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
DECLARE
    allowed_fields text[] := ARRAY['full_name', 'current_institution', 'current_field_of_study',
                                  'current_education_level', 'nationality', 'career_goals',
                                  'preferred_fields', 'preferred_degree_type', 'preferred_cities',
                                  'language_certificates', 'current_gpa', 'credits_taken', 'thesis_topic'];
    field_name text;
    update_count int := 0;
BEGIN
    IF NOT public.can_access_profile(profile_id) THEN
        RAISE EXCEPTION 'Access denied: Cannot update this profile';
    END IF;

    IF new_data ? 'email' OR new_data ? 'phone' OR new_data ? 'role' THEN
        RAISE EXCEPTION 'email/phone/role are not updatable via this function';
    END IF;

    IF jsonb_object_keys_count(new_data) > 5 THEN
        RAISE EXCEPTION 'Too many fields updated at once. Maximum 5 fields per update.';
    END IF;

    FOR field_name IN SELECT jsonb_object_keys(new_data) LOOP
        IF field_name != ANY(allowed_fields) THEN
            RAISE EXCEPTION 'Field % is not allowed to be updated via this function', field_name;
        END IF;
    END LOOP;

    UPDATE public.profiles
    SET
        full_name = COALESCE((new_data->>'full_name'), full_name),
        current_institution = COALESCE((new_data->>'current_institution'), current_institution),
        current_field_of_study = COALESCE((new_data->>'current_field_of_study'), current_field_of_study),
        current_education_level = COALESCE((new_data->>'current_education_level'), current_education_level),
        nationality = COALESCE((new_data->>'nationality'), nationality),
        career_goals = COALESCE((new_data->>'career_goals'), career_goals),
        updated_at = now()
    WHERE id = profile_id AND public.can_access_profile(id);

    GET DIAGNOSTICS update_count = ROW_COUNT;
    IF update_count = 0 THEN
        RAISE EXCEPTION 'Profile update failed or access denied';
    END IF;

    RETURN jsonb_build_object('success', true, 'message', 'Profile updated successfully');
END;
$function$;

-- 7) Update secure_update_separated_profile to route email/phone to private_profile_data correctly
CREATE OR REPLACE FUNCTION public.secure_update_separated_profile(profile_uuid uuid, public_data jsonb DEFAULT NULL::jsonb, private_data jsonb DEFAULT NULL::jsonb, academic_data jsonb DEFAULT NULL::jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
DECLARE
    current_user_id uuid;
    is_owner boolean;
    update_count int := 0;
    last_count int := 0;
BEGIN
    current_user_id := auth.uid();

    IF current_user_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required for profile updates';
    END IF;

    is_owner := (profile_uuid = current_user_id);
    IF NOT is_owner AND NOT public.has_role('admin'::public.app_role) THEN
        RAISE EXCEPTION 'Access denied: Can only update own profile';
    END IF;

    IF EXISTS (
        SELECT 1 FROM public.audit_logs
        WHERE user_id = current_user_id
          AND table_name = 'secure_profile_update'
          AND created_at > now() - interval '1 minute'
        GROUP BY user_id
        HAVING count(*) >= 3
    ) THEN
        RAISE EXCEPTION 'Rate limit exceeded: Too many profile updates. Please wait.';
    END IF;

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
        GET DIAGNOSTICS last_count = ROW_COUNT;
        update_count := update_count + last_count;
    END IF;

    IF private_data IS NOT NULL AND is_owner THEN
        UPDATE public.private_profile_data
        SET
            full_name = COALESCE(NULLIF(TRIM(REGEXP_REPLACE(COALESCE(private_data->>'full_name',''), '[<>"'']', '', 'g')), ''), full_name),
            email = COALESCE(NULLIF(private_data->>'email',''), email),
            phone = COALESCE(NULLIF(private_data->>'phone',''), phone),
            date_of_birth = COALESCE(NULLIF(private_data->>'date_of_birth','')::date, date_of_birth),
            nationality = COALESCE(NULLIF(private_data->>'nationality',''), nationality),
            gender = COALESCE(NULLIF(private_data->>'gender',''), gender),
            country_code = COALESCE(NULLIF(private_data->>'country_code',''), country_code),
            updated_at = now()
        WHERE id = profile_uuid;
        GET DIAGNOSTICS last_count = ROW_COUNT;
        update_count := update_count + last_count;
    END IF;

    IF academic_data IS NOT NULL THEN
        PERFORM public.secure_update_academic_data(profile_uuid, academic_data);
    END IF;

    INSERT INTO public.audit_logs (table_name, operation, user_id, new_data, created_at)
    VALUES ('secure_profile_update', 'UPDATE', current_user_id,
            jsonb_build_object('profile_id', profile_uuid, 'fields_updated', update_count),
            now());

    RETURN jsonb_build_object('success', true, 'message', 'Profile updated successfully', 'fields_updated', update_count);
END;
$function$;

-- 8) Update get_secure_complete_profile to prefer private_profile_data
CREATE OR REPLACE FUNCTION public.get_secure_complete_profile(profile_uuid uuid)
 RETURNS TABLE(id uuid, full_name text, email text, phone text, date_of_birth date, nationality text, gender text, country_code text, avatar_url text, role text, current_education_level text, current_field_of_study text, current_institution text, current_gpa numeric, credits_taken integer, thesis_topic text, language_certificates text[], preferred_fields text[], preferred_degree_type text, preferred_cities text[], career_goals text, xp_points integer, level integer, streak_days integer, created_at timestamp with time zone, updated_at timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
DECLARE
    requesting_user_id uuid;
    is_admin boolean;
BEGIN
    requesting_user_id := auth.uid();
    is_admin := public.has_role('admin'::public.app_role);

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
        COALESCE(ppd.full_name, p.full_name),
        COALESCE(ppd.email, p.email),
        COALESCE(ppd.phone, p.phone),
        COALESCE(ppd.date_of_birth, p.date_of_birth),
        COALESCE(ppd.nationality, p.nationality),
        COALESCE(ppd.gender, p.gender),
        COALESCE(ppd.country_code, p.country_code),
        p.avatar_url, p.role,
        p.current_education_level, p.current_field_of_study, p.current_institution,
        p.current_gpa, p.credits_taken, p.thesis_topic,
        p.language_certificates, p.preferred_fields, p.preferred_degree_type, p.preferred_cities,
        p.career_goals, p.xp_points, p.level, p.streak_days, p.created_at, p.updated_at
    FROM public.profiles p
    LEFT JOIN public.private_profile_data ppd ON p.id = ppd.id
    WHERE p.id = profile_uuid;
END;
$function$;

-- 9) Helper for edge functions to get email by profile id
CREATE OR REPLACE FUNCTION public.get_email_for_profile(_profile_id uuid)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
DECLARE
    result_email text;
BEGIN
    SELECT COALESCE(ppd.email, p.email) INTO result_email
    FROM public.profiles p
    LEFT JOIN public.private_profile_data ppd ON p.id = ppd.id
    WHERE p.id = _profile_id;
    RETURN result_email;
END;
$function$;

-- 10) Once PII is mirrored to private_profile_data, NULL it in profiles to remove duplicate exposure
UPDATE public.profiles SET email = NULL, phone = NULL
WHERE id IN (SELECT id FROM public.private_profile_data WHERE email IS NOT NULL OR phone IS NOT NULL);

COMMENT ON COLUMN public.profiles.email IS 'DEPRECATED: PII moved to private_profile_data. Always read via get_secure_complete_profile() or get_private_profile_data().';
COMMENT ON COLUMN public.profiles.phone IS 'DEPRECATED: PII moved to private_profile_data. Always read via get_secure_complete_profile() or get_private_profile_data().';
