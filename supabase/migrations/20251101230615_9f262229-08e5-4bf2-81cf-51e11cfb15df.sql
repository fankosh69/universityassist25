-- Fix validate_academic_data() to preserve NULL values
CREATE OR REPLACE FUNCTION public.validate_academic_data()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
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
    
    -- Sanitize text fields (preserve NULL, convert empty strings to NULL)
    NEW.curriculum := CASE 
        WHEN NEW.curriculum IS NOT NULL 
        THEN NULLIF(TRIM(REGEXP_REPLACE(NEW.curriculum, '[<>]', '', 'g')), '')
        ELSE NULL 
    END;
    
    NEW.prev_major := CASE 
        WHEN NEW.prev_major IS NOT NULL 
        THEN NULLIF(TRIM(REGEXP_REPLACE(NEW.prev_major, '[<>]', '', 'g')), '')
        ELSE NULL 
    END;
    
    NEW.target_intake := CASE 
        WHEN NEW.target_intake IS NOT NULL 
        THEN NULLIF(TRIM(REGEXP_REPLACE(NEW.target_intake, '[<>]', '', 'g')), '')
        ELSE NULL 
    END;
    
    RETURN NEW;
END;
$function$;