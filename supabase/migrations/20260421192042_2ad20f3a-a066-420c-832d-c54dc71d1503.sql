
-- ============================================================
-- 1) Repair mojibake / garbled German characters in names + cities
-- ============================================================
-- The replacement character � (U+FFFD) appears where ä/ö/ü/ß/–
-- were lost. We apply best-effort word-level replacements.

-- Common full-word replacements (apply to universities.name and universities.city)
WITH replacements(pattern, replacement) AS (
  VALUES
    -- City / common stems
    ('Universit�t', 'Universität'),
    ('Universit�ten', 'Universitäten'),
    ('M�nchen', 'München'),
    ('K�ln', 'Köln'),
    ('N�rnberg', 'Nürnberg'),
    ('M�nster', 'Münster'),
    ('Saarbr�cken', 'Saarbrücken'),
    ('T�bingen', 'Tübingen'),
    ('L�neburg', 'Lüneburg'),
    ('D�sseldorf', 'Düsseldorf'),
    ('Osnabr�ck', 'Osnabrück'),
    ('W�rzburg', 'Würzburg'),
    ('G�rlitz', 'Görlitz'),
    ('M�lheim', 'Mülheim'),
    ('B�chner', 'Büchner'),
    ('Schw�bisch Gm�nd', 'Schwäbisch Gmünd'),
    ('S�dwestfalen', 'Südwestfalen'),
    ('Westk�ste', 'Westküste'),
    ('Wests�chsische', 'Westsächsische'),
    ('Westf�lische', 'Westfälische'),
    ('N�rtingen', 'Nürtingen'),
    ('Gie�en', 'Gießen'),
    ('zu K�ln', 'zu Köln'),
    ('K�nig', 'König'),
    -- Word fragments inside names
    ('f�r', 'für'),
    ('J�dische', 'Jüdische'),
    ('P�dagogik', 'Pädagogik'),
    ('Universit�t', 'Universität')
)
UPDATE public.universities u
SET name = sub.fixed_name,
    city = sub.fixed_city
FROM (
  SELECT
    id,
    -- Apply each replacement sequentially via a CTE-derived expression
    -- Using nested REPLACE for performance and clarity:
    REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(
      name,
      'Universit�t', 'Universität'),
      'M�nchen', 'München'),
      'K�ln', 'Köln'),
      'N�rnberg', 'Nürnberg'),
      'M�nster', 'Münster'),
      'Saarbr�cken', 'Saarbrücken'),
      'T�bingen', 'Tübingen'),
      'L�neburg', 'Lüneburg'),
      'D�sseldorf', 'Düsseldorf'),
      'Osnabr�ck', 'Osnabrück'),
      'W�rzburg', 'Würzburg'),
      'G�rlitz', 'Görlitz'),
      'M�lheim', 'Mülheim'),
      'B�chner', 'Büchner'),
      'Schw�bisch', 'Schwäbisch'),
      'Gm�nd', 'Gmünd'),
      'S�dwestfalen', 'Südwestfalen'),
      'Westk�ste', 'Westküste'),
      'Wests�chsische', 'Westsächsische'),
      'Westf�lische', 'Westfälische'),
      'N�rtingen', 'Nürtingen'),
      'Gie�en', 'Gießen'),
      'J�dische', 'Jüdische'),
      'P�dagogik', 'Pädagogik'),
      'f�r', 'für'),
      ' � ', ' – '),  -- standalone replacement = em/en dash
      '�t', 'ät'),    -- catch any remaining "...�t" -> "...ät"
      'Bels�nde', 'Belsünde')                    AS fixed_name,
    REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(
      city,
      'M�nchen', 'München'),
      'K�ln', 'Köln'),
      'N�rnberg', 'Nürnberg'),
      'M�nster', 'Münster'),
      'Saarbr�cken', 'Saarbrücken'),
      'T�bingen', 'Tübingen'),
      'L�neburg', 'Lüneburg'),
      'D�sseldorf', 'Düsseldorf'),
      'Osnabr�ck', 'Osnabrück'),
      'W�rzburg', 'Würzburg'),
      'G�rlitz', 'Görlitz'),
      'M�lheim', 'Mülheim'),
      'Schw�bisch', 'Schwäbisch'),
      'Gm�nd', 'Gmünd'),
      'Gie�en', 'Gießen'),
      'N�rtingen', 'Nürtingen'),
      ' � ', ' – '),
      '�', 'ü')                                  AS fixed_city
  FROM public.universities
  WHERE name LIKE '%�%' OR city LIKE '%�%'
) AS sub
WHERE u.id = sub.id;

-- ============================================================
-- 2) Normalize duplicated type / control_type values (case + format)
-- ============================================================
-- Map varying values to canonical lowercase keys used by INSTITUTION_TYPES / CONTROL_TYPES
UPDATE public.universities
SET type = CASE
  WHEN LOWER(TRIM(type)) IN ('university', 'uni', 'universität') THEN 'university'
  WHEN LOWER(TRIM(type)) IN (
    'university of applied sciences',
    'university_of_applied_sciences',
    'university_applied_sciences',
    'fachhochschule', 'fh', 'uas', 'applied sciences'
  ) THEN 'university_applied_sciences'
  WHEN LOWER(TRIM(type)) IN ('technical university', 'technical_university', 'technische universität', 'tu') THEN 'technical_university'
  WHEN LOWER(TRIM(type)) IN (
    'art/music university', 'art_music_university', 'kunsthochschule', 'musikhochschule'
  ) THEN 'art_music_university'
  ELSE LOWER(TRIM(type))
END
WHERE type IS NOT NULL;

UPDATE public.universities
SET control_type = CASE
  WHEN LOWER(TRIM(control_type)) IN ('public', 'state', 'staatlich') THEN 'public'
  WHEN LOWER(TRIM(control_type)) IN ('private', 'privat', 'private, state-approved') THEN 'private'
  WHEN LOWER(TRIM(control_type)) IN ('church', 'kirchlich', 'church, state-approved') THEN 'church'
  ELSE LOWER(TRIM(control_type))
END
WHERE control_type IS NOT NULL;
