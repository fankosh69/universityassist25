-- Update all existing programs to have proper slugs
UPDATE programs 
SET slug = LOWER(
  REGEXP_REPLACE(
    REGEXP_REPLACE(
      REGEXP_REPLACE(name, '[^a-zA-Z0-9\s\-]', '', 'g'), 
      '\s+', '-', 'g'
    ), 
    '-+', '-', 'g'
  )
)
WHERE slug IS NULL OR slug = '';

-- Ensure all programs have unique slugs by appending program id if needed
UPDATE programs p1
SET slug = p1.slug || '-' || SUBSTRING(p1.id::text, 1, 8)
WHERE EXISTS (
  SELECT 1 FROM programs p2 
  WHERE p2.slug = p1.slug 
  AND p2.id != p1.id
  AND p2.created_at < p1.created_at
);