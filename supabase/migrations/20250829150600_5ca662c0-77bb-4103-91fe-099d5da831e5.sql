-- Extensions & helpers
CREATE EXTENSION IF NOT EXISTS unaccent;

CREATE OR REPLACE FUNCTION public.slugify(txt text)
RETURNS text LANGUAGE sql IMMUTABLE AS $$
  SELECT lower(regexp_replace(unaccent(coalesce(txt,'')), '[^a-zA-Z0-9]+', '-', 'g'))
$$;

-- Ensure required columns exist for cities
ALTER TABLE public.cities
  ADD COLUMN IF NOT EXISTS slug text UNIQUE,
  ADD COLUMN IF NOT EXISTS keywords text[],
  ADD COLUMN IF NOT EXISTS search_doc jsonb,
  ADD COLUMN IF NOT EXISTS fts tsvector;

-- Ensure required columns exist for universities (using existing universities table)
ALTER TABLE public.universities
  ADD COLUMN IF NOT EXISTS slug text UNIQUE,
  ADD COLUMN IF NOT EXISTS keywords text[],
  ADD COLUMN IF NOT EXISTS search_doc jsonb,
  ADD COLUMN IF NOT EXISTS fts tsvector;

-- Auto-slug on insert/update when slug is null for cities
CREATE OR REPLACE FUNCTION public.ensure_city_slug() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  IF new.slug IS NULL OR new.slug = '' THEN
    new.slug := slugify(new.name);
  END IF;
  RETURN new;
END $$;

DROP TRIGGER IF EXISTS trg_city_slug ON public.cities;
CREATE TRIGGER trg_city_slug BEFORE INSERT OR UPDATE ON public.cities
FOR EACH ROW EXECUTE FUNCTION public.ensure_city_slug();

-- Auto-slug on insert/update when slug is null for universities
CREATE OR REPLACE FUNCTION public.ensure_uni_slug() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  IF new.slug IS NULL OR new.slug = '' THEN
    new.slug := slugify(new.name);
  END IF;
  RETURN new;
END $$;

DROP TRIGGER IF EXISTS trg_uni_slug ON public.universities;
CREATE TRIGGER trg_uni_slug BEFORE INSERT OR UPDATE ON public.universities
FOR EACH ROW EXECUTE FUNCTION public.ensure_uni_slug();

-- SEO & FTS builders for cities
CREATE OR REPLACE FUNCTION public.update_city_search() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  new.keywords := array_remove(ARRAY[
    new.name, slugify(new.name), 'Germany','Deutschland','DE'
  ], null);
  new.search_doc := jsonb_build_object(
    'name', new.name,
    'slug', new.slug,
    'country', new.country_code,
    'synonyms', new.keywords
  );
  new.fts := to_tsvector('simple',
    unaccent(coalesce(new.name,'')||' '||coalesce(array_to_string(new.keywords,' '),''))
  );
  RETURN new;
END $$;

DROP TRIGGER IF EXISTS trg_city_search ON public.cities;
CREATE TRIGGER trg_city_search BEFORE INSERT OR UPDATE ON public.cities
FOR EACH ROW EXECUTE FUNCTION public.update_city_search();

-- SEO & FTS builders for universities
CREATE OR REPLACE FUNCTION public.update_uni_search() RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE v_city text;
BEGIN
  SELECT name INTO v_city FROM public.cities WHERE id = new.city_id;
  new.keywords := (
    SELECT array_agg(distinct x) FROM (
      VALUES
        (new.name),
        (replace(new.name,'Technische Universität','TU')),
        (replace(new.name,'Universität','University')),
        (replace(new.name,'Hochschule','University of Applied Sciences')),
        (replace(new.name,'Fachhochschule','University of Applied Sciences')),
        (slugify(new.name)),
        (v_city),
        ('Germany'),('Deutschland'),('DE')
    ) AS t(x) WHERE x IS NOT NULL AND x <> ''
  );
  new.search_doc := jsonb_build_object(
    'name', new.name,
    'slug', new.slug,
    'city', v_city,
    'synonyms', new.keywords,
    'website', new.website
  );
  new.fts := to_tsvector('simple',
    unaccent(
      coalesce(new.name,'')||' '||
      coalesce(v_city,'')||' '||
      coalesce(array_to_string(new.keywords,' '),'')
    )
  );
  RETURN new;
END $$;

DROP TRIGGER IF EXISTS trg_uni_search ON public.universities;
CREATE TRIGGER trg_uni_search BEFORE INSERT OR UPDATE ON public.universities
FOR EACH ROW EXECUTE FUNCTION public.update_uni_search();

-- FTS indexes
CREATE INDEX IF NOT EXISTS idx_cities_fts ON public.cities USING gin(fts);
CREATE INDEX IF NOT EXISTS idx_universities_fts ON public.universities USING gin(fts);