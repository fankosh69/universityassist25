-- Fix security issues from previous migration

-- 1) Recreate the view without SECURITY DEFINER (use SECURITY INVOKER)
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

-- 2) Recreate the function with proper search_path setting
create or replace function public.search_cities(q text default null)
returns setof public.city_stats
language sql
stable
security definer
set search_path = public
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

-- 3) Move extensions to extensions schema (create if doesn't exist)
create schema if not exists extensions;
drop extension if exists unaccent;
drop extension if exists pg_trgm;
create extension if not exists unaccent with schema extensions;
create extension if not exists pg_trgm with schema extensions;

-- Recreate indexes with proper extension schema reference
drop index if exists idx_cities_name_trgm;
drop index if exists idx_universities_name_trgm;
create index if not exists idx_cities_name_trgm on public.cities using gin (extensions.unaccent(name) extensions.gin_trgm_ops);
create index if not exists idx_universities_name_trgm on public.universities using gin (extensions.unaccent(name) extensions.gin_trgm_ops);