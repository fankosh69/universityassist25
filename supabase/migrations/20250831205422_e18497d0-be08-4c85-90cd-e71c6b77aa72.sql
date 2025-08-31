-- Enable unaccent extension for search functionality
create extension if not exists unaccent;

-- 1) View with per-city university count (using 'universities' table, not 'institutions')
create or replace view public.city_stats as
select
  c.id,
  c.slug,
  c.name,
  c.region,
  c.population_total,
  c.population_asof,
  c.country_code,
  coalesce(count(u.id),0)::bigint as uni_count
from public.cities c
left join public.universities u on u.city_id = c.id
group by c.id, c.slug, c.name, c.region, c.population_total, c.population_asof, c.country_code;

-- 2) RPC: search city by city name OR by university name (returns cities)
create or replace function public.search_cities(q text default null)
returns setof public.city_stats
language sql
stable
as $$
  select cs.*
  from public.city_stats cs
  where q is null
     or unaccent(cs.name) ilike '%'||unaccent(q)||'%'
     or exists (
          select 1 from public.universities u
          where u.city_id = cs.id
            and unaccent(u.name) ilike '%'||unaccent(q)||'%'
       )
  order by cs.name asc;
$$;

-- (Optional) fast ilike: enable pg_trgm & index names for better performance
create extension if not exists pg_trgm;
create index if not exists idx_cities_name_trgm on public.cities using gin (name gin_trgm_ops);
create index if not exists idx_universities_name_trgm on public.universities using gin (name gin_trgm_ops);