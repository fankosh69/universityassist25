-- Enhanced Security for Student Academic Records
-- This migration adds secure access functions, audit logging, and rate limiting

-- Create secure function to access student academic data
CREATE OR REPLACE FUNCTION public.get_secure_academic_data(target_profile_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    current_user_id uuid;
    is_admin boolean;
    is_owner boolean;
    academic_data jsonb;
BEGIN
    current_user_id := auth.uid();
    
    -- Strict authentication check
    IF current_user_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required for academic data access';
    END IF;
    
    -- Check ownership and admin status
    is_owner := (target_profile_id = current_user_id);
    is_admin := has_role('admin'::app_role);
    
    -- Rate limiting check
    IF NOT check_profile_access_rate_limit() THEN
        RAISE EXCEPTION 'Rate limit exceeded for academic data access';
    END IF;
    
    -- Log access attempt for audit
    INSERT INTO public.audit_logs (table_name, operation, user_id, new_data, created_at)
    VALUES ('student_academics', 'SECURE_SELECT', current_user_id, 
            jsonb_build_object(
                'requested_profile', target_profile_id, 
                'is_owner', is_owner,
                'is_admin', is_admin,
                'access_granted', (is_owner OR is_admin)
            ), 
            now());
    
    -- Only return data if user owns the academic record or is admin
    IF is_owner OR is_admin THEN
        SELECT jsonb_build_object(
            'profile_id', sa.profile_id,
            'curriculum', sa.curriculum,
            'prev_major', sa.prev_major,
            'gpa_raw', sa.gpa_raw,
            'gpa_scale_max', sa.gpa_scale_max,
            'gpa_min_pass', sa.gpa_min_pass,
            'gpa_de', sa.gpa_de,
            'ects_total', sa.ects_total,
            'target_level', sa.target_level,
            'target_intake', sa.target_intake,
            'language_certificates', sa.language_certificates,
            'extras', sa.extras,
            'created_at', sa.created_at,
            'updated_at', sa.updated_at
        ) INTO academic_data
        FROM public.student_academics sa
        WHERE sa.profile_id = target_profile_id;
    ELSE
        -- Access denied - return nothing
        RAISE EXCEPTION 'Access denied: Cannot access academic data';
    END IF;
    
    RETURN COALESCE(academic_data, '{}'::jsonb);
END;
$$;

-- Create secure function to update student academic data
CREATE OR REPLACE FUNCTION public.secure_update_academic_data(
    target_profile_id uuid,
    update_data jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    current_user_id uuid;
    is_owner boolean;
    update_count int := 0;
    allowed_fields text[] := ARRAY[
        'curriculum', 'prev_major', 'gpa_raw', 'gpa_scale_max', 'gpa_min_pass',
        'ects_total', 'target_level', 'target_intake', 'language_certificates', 'extras'
    ];
    field_name text;
BEGIN
    current_user_id := auth.uid();
    
    -- Check authentication
    IF current_user_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required for academic data update';
    END IF;
    
    -- Check ownership (only owner can update their academic data)
    is_owner := (target_profile_id = current_user_id);
    IF NOT is_owner THEN
        RAISE EXCEPTION 'Access denied: Can only update own academic records';
    END IF;
    
    -- Rate limiting: max 5 updates per minute per user
    IF EXISTS (
        SELECT 1 FROM public.audit_logs 
        WHERE user_id = current_user_id 
        AND table_name = 'student_academics' 
        AND operation = 'UPDATE'
        AND created_at > now() - interval '1 minute'
        GROUP BY user_id
        HAVING count(*) >= 5
    ) THEN
        RAISE EXCEPTION 'Rate limit exceeded: Too many academic updates. Please wait.';
    END IF;
    
    -- Validate field count (max 5 fields per update)
    IF jsonb_object_keys_count(update_data) > 5 THEN
        RAISE EXCEPTION 'Security limit: Maximum 5 fields can be updated at once';
    END IF;
    
    -- Validate only allowed fields are being updated
    FOR field_name IN SELECT jsonb_object_keys(update_data) LOOP
        IF field_name != ANY(allowed_fields) THEN
            RAISE EXCEPTION 'Field not allowed for update: %', field_name;
        END IF;
    END LOOP;
    
    -- Validate numeric fields
    IF update_data ? 'gpa_raw' AND (update_data->>'gpa_raw')::numeric < 0 THEN
        RAISE EXCEPTION 'GPA raw score cannot be negative';
    END IF;
    
    IF update_data ? 'gpa_scale_max' AND (update_data->>'gpa_scale_max')::numeric <= 0 THEN
        RAISE EXCEPTION 'GPA scale maximum must be positive';
    END IF;
    
    IF update_data ? 'ects_total' AND (update_data->>'ects_total')::numeric < 0 THEN
        RAISE EXCEPTION 'ECTS total cannot be negative';
    END IF;
    
    -- Perform secure update with sanitization
    UPDATE public.student_academics 
    SET 
        curriculum = CASE WHEN update_data ? 'curriculum' 
                     THEN TRIM(REGEXP_REPLACE(update_data->>'curriculum', '[<>\"'']', '', 'g'))
                     ELSE curriculum END,
        prev_major = CASE WHEN update_data ? 'prev_major' 
                     THEN TRIM(REGEXP_REPLACE(update_data->>'prev_major', '[<>\"'']', '', 'g'))
                     ELSE prev_major END,
        gpa_raw = CASE WHEN update_data ? 'gpa_raw' 
                  THEN (update_data->>'gpa_raw')::numeric 
                  ELSE gpa_raw END,
        gpa_scale_max = CASE WHEN update_data ? 'gpa_scale_max' 
                        THEN (update_data->>'gpa_scale_max')::numeric 
                        ELSE gpa_scale_max END,
        gpa_min_pass = CASE WHEN update_data ? 'gpa_min_pass' 
                       THEN (update_data->>'gpa_min_pass')::numeric 
                       ELSE gpa_min_pass END,
        ects_total = CASE WHEN update_data ? 'ects_total' 
                     THEN (update_data->>'ects_total')::numeric 
                     ELSE ects_total END,
        target_level = CASE WHEN update_data ? 'target_level' 
                       THEN (update_data->>'target_level')::degree_level 
                       ELSE target_level END,
        target_intake = CASE WHEN update_data ? 'target_intake' 
                        THEN update_data->>'target_intake' 
                        ELSE target_intake END,
        language_certificates = CASE WHEN update_data ? 'language_certificates' 
                                THEN update_data->'language_certificates' 
                                ELSE language_certificates END,
        extras = CASE WHEN update_data ? 'extras' 
                 THEN update_data->'extras' 
                 ELSE extras END,
        updated_at = now()
    WHERE profile_id = target_profile_id;
    
    GET DIAGNOSTICS update_count = ROW_COUNT;
    
    -- If no rows were updated, try to insert a new record
    IF update_count = 0 THEN
        INSERT INTO public.student_academics (
            profile_id, curriculum, prev_major, gpa_raw, gpa_scale_max, 
            gpa_min_pass, ects_total, target_level, target_intake, 
            language_certificates, extras, created_at, updated_at
        ) VALUES (
            target_profile_id,
            CASE WHEN update_data ? 'curriculum' THEN TRIM(REGEXP_REPLACE(update_data->>'curriculum', '[<>\"'']', '', 'g')) ELSE NULL END,
            CASE WHEN update_data ? 'prev_major' THEN TRIM(REGEXP_REPLACE(update_data->>'prev_major', '[<>\"'']', '', 'g')) ELSE NULL END,
            CASE WHEN update_data ? 'gpa_raw' THEN (update_data->>'gpa_raw')::numeric ELSE NULL END,
            CASE WHEN update_data ? 'gpa_scale_max' THEN (update_data->>'gpa_scale_max')::numeric ELSE NULL END,
            CASE WHEN update_data ? 'gpa_min_pass' THEN (update_data->>'gpa_min_pass')::numeric ELSE NULL END,
            CASE WHEN update_data ? 'ects_total' THEN (update_data->>'ects_total')::numeric ELSE NULL END,
            CASE WHEN update_data ? 'target_level' THEN (update_data->>'target_level')::degree_level ELSE NULL END,
            CASE WHEN update_data ? 'target_intake' THEN update_data->>'target_intake' ELSE NULL END,
            CASE WHEN update_data ? 'language_certificates' THEN update_data->'language_certificates' ELSE '[]'::jsonb END,
            CASE WHEN update_data ? 'extras' THEN update_data->'extras' ELSE '{}'::jsonb END,
            now(),
            now()
        );
        
        GET DIAGNOSTICS update_count = ROW_COUNT;
    END IF;
    
    -- Log the update
    INSERT INTO public.audit_logs (table_name, operation, user_id, new_data, created_at)
    VALUES ('student_academics', 'UPDATE', current_user_id, 
            jsonb_build_object('updated_fields', jsonb_object_keys_count(update_data)), now());
    
    RETURN jsonb_build_object(
        'success', true,
        'message', 'Academic data updated successfully',
        'fields_updated', jsonb_object_keys_count(update_data),
        'timestamp', now()
    );
END;
$$;

-- Create function for masked academic data (for admin views)
CREATE OR REPLACE FUNCTION public.get_masked_academic_summary(target_profile_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    current_user_id uuid;
    is_admin boolean;
    academic_summary jsonb;
BEGIN
    current_user_id := auth.uid();
    
    IF current_user_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required';
    END IF;
    
    is_admin := has_role('admin'::app_role);
    
    IF NOT is_admin THEN
        RAISE EXCEPTION 'Admin access required';
    END IF;
    
    -- Return only non-sensitive summary data for admin views
    SELECT jsonb_build_object(
        'profile_id', sa.profile_id,
        'education_level', sa.target_level,
        'has_gpa_data', (sa.gpa_raw IS NOT NULL),
        'has_language_certs', (jsonb_array_length(sa.language_certificates) > 0),
        'ects_range', 
            CASE 
                WHEN sa.ects_total IS NULL THEN 'Unknown'
                WHEN sa.ects_total < 60 THEN 'Under 60'
                WHEN sa.ects_total < 120 THEN '60-120'
                WHEN sa.ects_total < 180 THEN '120-180'
                ELSE 'Above 180'
            END,
        'last_updated', sa.updated_at
    ) INTO academic_summary
    FROM public.student_academics sa
    WHERE sa.profile_id = target_profile_id;
    
    -- Log admin access
    INSERT INTO public.audit_logs (table_name, operation, user_id, new_data, created_at)
    VALUES ('student_academics', 'ADMIN_SUMMARY_ACCESS', current_user_id, 
            jsonb_build_object('accessed_profile', target_profile_id), now());
    
    RETURN COALESCE(academic_summary, '{}'::jsonb);
END;
$$;

-- Add validation trigger for student_academics
CREATE OR REPLACE FUNCTION public.validate_academic_data()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
    -- Validate GPA values
    IF NEW.gpa_raw IS NOT NULL AND (NEW.gpa_raw < 0 OR NEW.gpa_raw > COALESCE(NEW.gpa_scale_max, 4.0)) THEN
        RAISE EXCEPTION 'GPA raw score must be between 0 and scale maximum';
    END IF;
    
    IF NEW.gpa_scale_max IS NOT NULL AND NEW.gpa_scale_max <= 0 THEN
        RAISE EXCEPTION 'GPA scale maximum must be positive';
    END IF;
    
    IF NEW.gpa_min_pass IS NOT NULL AND NEW.gpa_min_pass < 0 THEN
        RAISE EXCEPTION 'GPA minimum passing score cannot be negative';
    END IF;
    
    -- Validate ECTS
    IF NEW.ects_total IS NOT NULL AND NEW.ects_total < 0 THEN
        RAISE EXCEPTION 'ECTS total cannot be negative';
    END IF;
    
    -- Sanitize text fields
    NEW.curriculum := TRIM(REGEXP_REPLACE(COALESCE(NEW.curriculum, ''), '[<>]', '', 'g'));
    NEW.prev_major := TRIM(REGEXP_REPLACE(COALESCE(NEW.prev_major, ''), '[<>]', '', 'g'));
    NEW.target_intake := TRIM(REGEXP_REPLACE(COALESCE(NEW.target_intake, ''), '[<>]', '', 'g'));
    
    RETURN NEW;
END;
$$;

-- Create trigger for validation
DROP TRIGGER IF EXISTS validate_academic_data_trigger ON public.student_academics;
CREATE TRIGGER validate_academic_data_trigger
    BEFORE INSERT OR UPDATE ON public.student_academics
    FOR EACH ROW
    EXECUTE FUNCTION public.validate_academic_data();

-- Create audit trigger for student_academics
DROP TRIGGER IF EXISTS audit_student_academics_changes ON public.student_academics;
CREATE TRIGGER audit_student_academics_changes
    AFTER INSERT OR UPDATE OR DELETE ON public.student_academics
    FOR EACH ROW
    EXECUTE FUNCTION public.log_profile_access();

-- Grant execute permissions on the new functions
GRANT EXECUTE ON FUNCTION public.get_secure_academic_data(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.secure_update_academic_data(uuid, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_masked_academic_summary(uuid) TO authenticated;