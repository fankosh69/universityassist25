INSERT INTO public.university_scrape_profiles (
  university_id, base_urls, program_url_patterns, exclude_patterns, pdf_link_patterns,
  language_mode, discovery_method, cadence, max_depth, max_pages, wait_for_ms, enabled, notes
) VALUES (
  '9e094bbf-43ff-4b04-93e7-9a7bea5d675e',
  ARRAY['https://www.hhu.de/en/studies/before-you-start-studying/degree-programmes-from-a-to-z'],
  ARRAY['/en/studies/.+(bachelor|master|degree-programme|studienangebot)'],
  ARRAY['/en/news', '/en/events', '/de/aktuelles', '\\.(jpg|png|gif|css|js)(\\?|$)'],
  ARRAY['admission', 'module', 'handbook', 'regulation', 'ordnung'],
  'hybrid', 'map', 'monthly', 2, 15, 0, true,
  'Pilot scrape profile for HHU Düsseldorf'
) ON CONFLICT (university_id) DO UPDATE SET
  base_urls = EXCLUDED.base_urls,
  program_url_patterns = EXCLUDED.program_url_patterns,
  exclude_patterns = EXCLUDED.exclude_patterns,
  max_pages = EXCLUDED.max_pages,
  language_mode = EXCLUDED.language_mode,
  notes = EXCLUDED.notes,
  enabled = true;