-- Drop existing function completely to ensure clean slate
DROP FUNCTION IF EXISTS public.secure_update_academic_data(uuid, jsonb);

-- Recreate with explicit NULLIF and debug logging
CREATE OR REPLACE FUNCTION public.secure_update_academic_data(target_profile_id uuid, update_data jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  result_data jsonb;
  debug_curriculum text;
  debug_prev_major text;
  debug_target_intake text;
  debug_target_level text;
BEGIN
  -- Validate that user can only update their own data
  IF auth.uid() != target_profile_id THEN
    RAISE EXCEPTION 'Unauthorized: Cannot update other users academic data';
  END IF;

  -- Debug: Extract and log values after NULLIF
  debug_curriculum := NULLIF(update_data->>'curriculum', '');
  debug_prev_major := NULLIF(update_data->>'prev_major', '');
  debug_target_intake := NULLIF(update_data->>'target_intake', '');
  debug_target_level := NULLIF(update_data->>'target_level', '');
  
  RAISE LOG 'secure_update_academic_data: profile_id=%, curriculum=%, prev_major=%, target_intake=%, target_level=%', 
    target_profile_id, 
    COALESCE(debug_curriculum, 'NULL'),
    COALESCE(debug_prev_major, 'NULL'),
    COALESCE(debug_target_intake, 'NULL'),
    COALESCE(debug_target_level, 'NULL');

  -- Upsert academic data with explicit NULLIF on all text fields
  INSERT INTO public.student_academics (
    profile_id,
    gpa_raw,
    gpa_scale_max,
    gpa_min_pass,
    curriculum,
    prev_major,
    target_level,
    target_intake,
    language_certificates,
    ects_total,
    updated_at
  )
  VALUES (
    target_profile_id,
    CASE WHEN update_data ? 'gpa_raw' THEN NULLIF(update_data->>'gpa_raw', '')::numeric ELSE NULL END,
    CASE WHEN update_data ? 'gpa_scale_max' THEN NULLIF(update_data->>'gpa_scale_max', '')::numeric ELSE NULL END,
    CASE WHEN update_data ? 'gpa_min_pass' THEN NULLIF(update_data->>'gpa_min_pass', '')::numeric ELSE NULL END,
    NULLIF(update_data->>'curriculum', ''),
    NULLIF(update_data->>'prev_major', ''),
    CASE WHEN update_data ? 'target_level' THEN NULLIF(update_data->>'target_level', '')::degree_level ELSE NULL END,
    NULLIF(update_data->>'target_intake', ''),
    CASE WHEN update_data ? 'language_certificates' THEN update_data->'language_certificates' ELSE NULL END,
    CASE WHEN update_data ? 'ects_total' THEN NULLIF(update_data->>'ects_total', '')::numeric ELSE NULL END,
    now()
  )
  ON CONFLICT (profile_id) 
  DO UPDATE SET
    gpa_raw = CASE WHEN update_data ? 'gpa_raw' 
              THEN COALESCE(NULLIF(update_data->>'gpa_raw', '')::numeric, student_academics.gpa_raw)
              ELSE student_academics.gpa_raw END,
    gpa_scale_max = CASE WHEN update_data ? 'gpa_scale_max'
                    THEN COALESCE(NULLIF(update_data->>'gpa_scale_max', '')::numeric, student_academics.gpa_scale_max)
                    ELSE student_academics.gpa_scale_max END,
    gpa_min_pass = CASE WHEN update_data ? 'gpa_min_pass'
                   THEN COALESCE(NULLIF(update_data->>'gpa_min_pass', '')::numeric, student_academics.gpa_min_pass)
                   ELSE student_academics.gpa_min_pass END,
    curriculum = CASE WHEN update_data ? 'curriculum'
                 THEN COALESCE(NULLIF(update_data->>'curriculum', ''), student_academics.curriculum)
                 ELSE student_academics.curriculum END,
    prev_major = CASE WHEN update_data ? 'prev_major'
                 THEN COALESCE(NULLIF(update_data->>'prev_major', ''), student_academics.prev_major)
                 ELSE student_academics.prev_major END,
    target_level = CASE WHEN update_data ? 'target_level'
                   THEN COALESCE(NULLIF(update_data->>'target_level', '')::degree_level, student_academics.target_level)
                   ELSE student_academics.target_level END,
    target_intake = CASE WHEN update_data ? 'target_intake'
                    THEN COALESCE(NULLIF(update_data->>'target_intake', ''), student_academics.target_intake)
                    ELSE student_academics.target_intake END,
    language_certificates = CASE WHEN update_data ? 'language_certificates'
                           THEN COALESCE(update_data->'language_certificates', student_academics.language_certificates)
                           ELSE student_academics.language_certificates END,
    ects_total = CASE WHEN update_data ? 'ects_total'
                 THEN COALESCE(NULLIF(update_data->>'ects_total', '')::numeric, student_academics.ects_total)
                 ELSE student_academics.ects_total END,
    updated_at = now()
  RETURNING to_jsonb(student_academics.*) INTO result_data;

  RAISE LOG 'secure_update_academic_data: Insert/Update successful for profile_id=%', target_profile_id;

  RETURN result_data;
END;
$function$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.secure_update_academic_data(uuid, jsonb) TO authenticated;