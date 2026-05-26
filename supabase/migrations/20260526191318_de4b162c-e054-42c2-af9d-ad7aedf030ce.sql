
CREATE OR REPLACE FUNCTION public.ensure_program_slug()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  base text;
  candidate text;
  n int := 0;
BEGIN
  IF NEW.slug IS NOT NULL AND length(trim(NEW.slug)) > 0 THEN
    RETURN NEW;
  END IF;
  base := lower(regexp_replace(coalesce(NEW.name, 'program'), '[^a-zA-Z0-9]+', '-', 'g'));
  base := regexp_replace(base, '(^-|-$)', '', 'g');
  IF base = '' THEN base := 'program'; END IF;
  candidate := base;
  WHILE EXISTS (
    SELECT 1 FROM public.programs
    WHERE slug = candidate
      AND university_id = NEW.university_id
      AND id <> COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
  ) LOOP
    n := n + 1;
    candidate := base || '-' || n;
  END LOOP;
  NEW.slug := candidate;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_ensure_program_slug ON public.programs;
CREATE TRIGGER trg_ensure_program_slug
BEFORE INSERT OR UPDATE ON public.programs
FOR EACH ROW EXECUTE FUNCTION public.ensure_program_slug();

UPDATE public.programs SET name = name WHERE slug IS NULL;
