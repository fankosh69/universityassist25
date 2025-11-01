-- Fix the secure_update_academic_data function to use correct enum type
-- Replace education_level with degree_level

CREATE OR REPLACE FUNCTION public.secure_update_academic_data(target_profile_id uuid, update_data jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  result_data jsonb;
BEGIN
  -- Validate that user can only update their own data
  IF auth.uid() != target_profile_id THEN
    RAISE EXCEPTION 'Unauthorized: Cannot update other users academic data';
  END IF;

  -- Upsert academic data (insert or update)
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
    (update_data->>'gpa_raw')::numeric,
    (update_data->>'gpa_scale_max')::numeric,
    (update_data->>'gpa_min_pass')::numeric,
    update_data->>'curriculum',
    update_data->>'prev_major',
    (update_data->>'target_level')::degree_level,
    update_data->>'target_intake',
    update_data->'language_certificates',
    (update_data->>'ects_total')::numeric,
    now()
  )
  ON CONFLICT (profile_id) 
  DO UPDATE SET
    gpa_raw = COALESCE((update_data->>'gpa_raw')::numeric, student_academics.gpa_raw),
    gpa_scale_max = COALESCE((update_data->>'gpa_scale_max')::numeric, student_academics.gpa_scale_max),
    gpa_min_pass = COALESCE((update_data->>'gpa_min_pass')::numeric, student_academics.gpa_min_pass),
    curriculum = COALESCE(update_data->>'curriculum', student_academics.curriculum),
    prev_major = COALESCE(update_data->>'prev_major', student_academics.prev_major),
    target_level = COALESCE((update_data->>'target_level')::degree_level, student_academics.target_level),
    target_intake = COALESCE(update_data->>'target_intake', student_academics.target_intake),
    language_certificates = COALESCE(update_data->'language_certificates', student_academics.language_certificates),
    ects_total = COALESCE((update_data->>'ects_total')::numeric, student_academics.ects_total),
    updated_at = now()
  RETURNING to_jsonb(student_academics.*) INTO result_data;

  RETURN result_data;
END;
$function$;