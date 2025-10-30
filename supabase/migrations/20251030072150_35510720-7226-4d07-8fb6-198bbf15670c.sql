-- Fix security warnings by setting search_path for functions

-- Update get_field_descendants function with search_path
CREATE OR REPLACE FUNCTION public.get_field_descendants(field_id UUID)
RETURNS TABLE(descendant_id UUID)
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH RECURSIVE descendants AS (
    SELECT id FROM public.fields_of_study WHERE id = field_id
    UNION
    SELECT f.id FROM public.fields_of_study f
    INNER JOIN descendants d ON f.parent_id = d.id
  )
  SELECT id AS descendant_id FROM descendants WHERE id != field_id;
$$;

-- Update count_programs_by_field function with search_path
CREATE OR REPLACE FUNCTION public.count_programs_by_field(field_id UUID)
RETURNS INTEGER
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::INTEGER
  FROM public.programs p
  WHERE p.field_of_study_id = field_id
     OR p.field_of_study_id IN (SELECT descendant_id FROM public.get_field_descendants(field_id));
$$;

-- Update update_fields_of_study_updated_at function with search_path
CREATE OR REPLACE FUNCTION public.update_fields_of_study_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;