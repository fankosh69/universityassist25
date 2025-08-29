-- Fix security warnings by adding search_path to functions

-- Fix slugify function
CREATE OR REPLACE FUNCTION public.slugify(txt text)
RETURNS text 
LANGUAGE sql 
IMMUTABLE 
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT lower(regexp_replace(unaccent(coalesce(txt,'')), '[^a-zA-Z0-9]+', '-', 'g'))
$$;

-- Fix ensure_city_slug function
CREATE OR REPLACE FUNCTION public.ensure_city_slug() 
RETURNS trigger
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF new.slug IS NULL OR new.slug = '' THEN
    new.slug := slugify(new.name);
  END IF;
  RETURN new;
END $$;

-- Fix ensure_uni_slug function
CREATE OR REPLACE FUNCTION public.ensure_uni_slug() 
RETURNS trigger
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF new.slug IS NULL OR new.slug = '' THEN
    new.slug := slugify(new.name);
  END IF;
  RETURN new;
END $$;

-- Fix update_city_search function
CREATE OR REPLACE FUNCTION public.update_city_search() 
RETURNS trigger
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
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

-- Fix update_uni_search function
CREATE OR REPLACE FUNCTION public.update_uni_search() 
RETURNS trigger
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
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