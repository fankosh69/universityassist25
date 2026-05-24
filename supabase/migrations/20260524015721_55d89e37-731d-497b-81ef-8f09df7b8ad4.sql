UPDATE public.university_scrape_profiles
SET base_urls = ARRAY['https://www.hhu.de'],
    program_url_patterns = ARRAY['/course-information/.+(bachelor|master)'],
    selectors_hint = '{"discovery_search":"degree programme bachelor master course information"}'::jsonb
WHERE university_id = '9e094bbf-43ff-4b04-93e7-9a7bea5d675e';