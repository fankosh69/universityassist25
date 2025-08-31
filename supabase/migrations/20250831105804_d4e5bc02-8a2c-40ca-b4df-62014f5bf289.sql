-- Step 1: Create missing cities based on unique university cities (avoiding duplicates)
INSERT INTO cities (id, name, slug, country_code, created_at)
SELECT 
    gen_random_uuid() as id,
    u.city as name,
    CASE 
        WHEN EXISTS (SELECT 1 FROM cities WHERE slug = slugify(u.city)) 
        THEN slugify(u.city) || '-' || EXTRACT(EPOCH FROM now())::text
        ELSE slugify(u.city)
    END as slug,
    'DE' as country_code,
    now() as created_at
FROM (
    SELECT DISTINCT city 
    FROM universities 
    WHERE city IS NOT NULL 
    AND city != ''
    AND city NOT IN (SELECT name FROM cities WHERE name IS NOT NULL)
) u;

-- Step 2: Update universities to link them with their cities by setting city_id  
UPDATE universities 
SET city_id = (
    SELECT c.id 
    FROM cities c 
    WHERE c.name = universities.city
    LIMIT 1
)
WHERE city IS NOT NULL 
AND city != ''
AND city_id IS NULL;

-- Step 3: Add coordinates to cities that don't have them (use average of universities' coordinates from that city)
UPDATE cities 
SET 
    lat = subq.avg_lat,
    lng = subq.avg_lng
FROM (
    SELECT 
        u.city,
        AVG(u.lat) as avg_lat,
        AVG(u.lng) as avg_lng
    FROM universities u
    WHERE u.lat IS NOT NULL 
    AND u.lng IS NOT NULL
    AND u.lat != 0 
    AND u.lng != 0
    GROUP BY u.city
) subq
WHERE cities.name = subq.city
AND (cities.lat IS NULL OR cities.lng IS NULL OR cities.lat = 0 OR cities.lng = 0);