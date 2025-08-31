-- Add fields to cities table for region and population data
alter table public.cities
  add column if not exists region text,
  add column if not exists region_code text,
  add column if not exists population_total bigint,
  add column if not exists population_asof date,
  add column if not exists wikidata_qid text;

-- Create indexes for better query performance
create index if not exists idx_cities_region on public.cities (region);
create index if not exists idx_cities_pop on public.cities (population_total);