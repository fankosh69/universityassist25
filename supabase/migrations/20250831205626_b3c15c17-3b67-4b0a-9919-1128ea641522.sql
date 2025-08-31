-- Create city stats view and search function without complex indexes

-- Drop function first (it depends on the view)
drop function if exists public.search_cities(text);

-- Drop and recreate the view with security_invoker
drop view if exists public.city_stats cascade;
create view public.city_stats 
with (security_invoker=on) as
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

-- Recreate function with proper search_path
create or replace function public.search_cities(q text default null)
returns setof public.city_stats
language sql
stable
security definer
set search_path = public, extensions
as $$
  select cs.*
  from public.city_stats cs
  where q is null
     or extensions.unaccent(cs.name) ilike '%'||extensions.unaccent(q)||'%'
     or exists (
          select 1 from public.universities u
          where u.city_id = cs.id
            and extensions.unaccent(u.name) ilike '%'||extensions.unaccent(q)||'%'
       )
  order by cs.name asc;
$$;

-- Create basic indexes for name columns
drop index if exists idx_cities_name_trgm;
drop index if exists idx_universities_name_trgm;
drop index if exists idx_cities_name_gin;
drop index if exists idx_universities_name_gin;
create index if not exists idx_cities_name_btree on public.cities (name);
create index if not exists idx_universities_name_btree on public.universities (name);