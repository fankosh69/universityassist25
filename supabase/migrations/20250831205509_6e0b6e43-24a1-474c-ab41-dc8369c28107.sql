-- Fix security issues with proper dependency management

-- 1) Drop function first (it depends on the view)
drop function if exists public.search_cities(text);

-- 2) Drop and recreate the view with security_invoker
drop view if exists public.city_stats;
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

-- 3) Recreate function with proper search_path and reference to extensions schema
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

-- 4) Fix indexes to reference proper extension functions
drop index if exists idx_cities_name_trgm;
drop index if exists idx_universities_name_trgm;
create index if not exists idx_cities_name_trgm on public.cities using gin (extensions.unaccent(name) extensions.gin_trgm_ops);
create index if not exists idx_universities_name_trgm on public.universities using gin (extensions.unaccent(name) extensions.gin_trgm_ops);