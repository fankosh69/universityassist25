-- Database schema for German University Admissions MVP

-- Enable RLS
alter table auth.users enable row level security;

-- Create profiles table
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  full_name text,
  email text,
  phone text,
  nationality text,
  current_education_level text,
  current_institution text,
  current_gpa decimal,
  current_field_of_study text,
  credits_taken integer,
  thesis_topic text,
  language_certificates text[] default '{}',
  preferred_fields text[] default '{}',
  preferred_degree_type text,
  preferred_cities text[] default '{}',
  career_goals text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create universities table
create table if not exists public.universities (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  city text not null,
  website text,
  logo_url text,
  ranking integer,
  type text, -- public, private, applied_sciences
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create programs table
create table if not exists public.programs (
  id uuid default gen_random_uuid() primary key,
  university_id uuid references public.universities(id) not null,
  name text not null,
  field_of_study text not null,
  degree_type text not null, -- bachelor, master, phd
  duration_semesters integer not null,
  language_requirements text[] default '{}',
  minimum_gpa decimal,
  application_deadline date,
  semester_start text,
  tuition_fees integer default 0,
  prerequisites text[] default '{}',
  description text,
  ects_credits integer,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create matches table
create table if not exists public.matches (
  id uuid default gen_random_uuid() primary key,
  profile_id uuid references public.profiles(id) on delete cascade not null,
  program_id uuid references public.programs(id) on delete cascade not null,
  compatibility_score integer not null check (compatibility_score >= 0 and compatibility_score <= 100),
  match_reasons text[] default '{}',
  created_at timestamp with time zone default timezone('utc'::text, now') not null,
  unique(profile_id, program_id)
);

-- Create saved_programs table for user bookmarks
create table if not exists public.saved_programs (
  id uuid default gen_random_uuid() primary key,
  profile_id uuid references public.profiles(id) on delete cascade not null,
  program_id uuid references public.programs(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(profile_id, program_id)
);

-- RLS Policies
alter table public.profiles enable row level security;
alter table public.universities enable row level security;
alter table public.programs enable row level security;
alter table public.matches enable row level security;
alter table public.saved_programs enable row level security;

-- Profiles policies
create policy "Users can view own profile" on public.profiles
  for select using (auth.uid() = id);

create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id);

create policy "Users can insert own profile" on public.profiles
  for insert with check (auth.uid() = id);

-- Universities policies (public read)
create policy "Anyone can view universities" on public.universities
  for select using (true);

-- Programs policies (public read)
create policy "Anyone can view programs" on public.programs
  for select using (true);

-- Matches policies
create policy "Users can view own matches" on public.matches
  for select using (auth.uid() = profile_id);

create policy "Users can insert own matches" on public.matches
  for insert with check (auth.uid() = profile_id);

create policy "Users can update own matches" on public.matches
  for update using (auth.uid() = profile_id);

-- Saved programs policies
create policy "Users can view own saved programs" on public.saved_programs
  for select using (auth.uid() = profile_id);

create policy "Users can insert own saved programs" on public.saved_programs
  for insert with check (auth.uid() = profile_id);

create policy "Users can delete own saved programs" on public.saved_programs
  for delete using (auth.uid() = profile_id);

-- Insert sample universities
insert into public.universities (name, city, website, ranking, type) values
  ('Technical University of Munich', 'Munich', 'https://www.tum.de', 1, 'public'),
  ('RWTH Aachen University', 'Aachen', 'https://www.rwth-aachen.de', 2, 'public'),
  ('University of Heidelberg', 'Heidelberg', 'https://www.uni-heidelberg.de', 3, 'public'),
  ('Humboldt University of Berlin', 'Berlin', 'https://www.hu-berlin.de', 4, 'public'),
  ('Frankfurt School of Finance', 'Frankfurt', 'https://www.frankfurt-school.de', 10, 'private'),
  ('University of Stuttgart', 'Stuttgart', 'https://www.uni-stuttgart.de', 5, 'public'),
  ('University of Cologne', 'Cologne', 'https://www.uni-koeln.de', 6, 'public'),
  ('Dresden University of Technology', 'Dresden', 'https://tu-dresden.de', 7, 'public'),
  ('University of Leipzig', 'Leipzig', 'https://www.uni-leipzig.de', 8, 'public'),
  ('Hamburg University of Technology', 'Hamburg', 'https://www.tuhh.de', 9, 'public')
on conflict do nothing;

-- Insert sample programs
insert into public.programs (university_id, name, field_of_study, degree_type, duration_semesters, language_requirements, minimum_gpa, application_deadline, semester_start, tuition_fees, prerequisites, description, ects_credits)
select 
  u.id,
  'Computer Science',
  'Computer Science',
  'Master''s',
  4,
  array['English B2', 'German C1'],
  2.5,
  '2024-07-15'::date,
  'October 2024',
  0,
  array['Bachelor in Computer Science or related field'],
  'Advanced computer science program with focus on AI and software engineering',
  120
from public.universities u where u.name = 'Technical University of Munich'

union all

select 
  u.id,
  'Mechanical Engineering',
  'Engineering',
  'Master''s',
  4,
  array['English B2'],
  2.3,
  '2024-07-31'::date,
  'October 2024',
  0,
  array['Bachelor in Mechanical Engineering'],
  'Comprehensive mechanical engineering program with industry partnerships',
  120
from public.universities u where u.name = 'RWTH Aachen University'

union all

select 
  u.id,
  'International Business Management',
  'Business',
  'Master''s',
  4,
  array['English C1'],
  2.0,
  '2024-06-30'::date,
  'September 2024',
  20000,
  array['Bachelor in Business or Economics'],
  'International business program with global perspective',
  120
from public.universities u where u.name = 'Frankfurt School of Finance'

union all

select 
  u.id,
  'Medicine',
  'Medicine',
  'Bachelor''s',
  12,
  array['German C2'],
  1.2,
  '2024-05-31'::date,
  'October 2024',
  0,
  array['Abitur or equivalent', 'Medical aptitude test'],
  'Comprehensive medical education program',
  360
from public.universities u where u.name = 'University of Heidelberg'

union all

select 
  u.id,
  'Data Science',
  'Computer Science',
  'Master''s',
  4,
  array['English B2'],
  2.5,
  '2024-08-15'::date,
  'October 2024',
  0,
  array['Bachelor in Computer Science, Mathematics, or Statistics'],
  'Cutting-edge data science program with machine learning focus',
  120
from public.universities u where u.name = 'Humboldt University of Berlin'

union all

select 
  u.id,
  'Electrical Engineering',
  'Engineering',
  'Bachelor''s',
  6,
  array['German B2'],
  2.5,
  '2024-07-15'::date,
  'October 2024',
  0,
  array['Abitur with strong math and physics'],
  'Foundation program in electrical engineering',
  180
from public.universities u where u.name = 'University of Stuttgart'

union all

select 
  u.id,
  'Psychology',
  'Psychology',
  'Bachelor''s',
  6,
  array['German C1'],
  1.8,
  '2024-07-15'::date,
  'October 2024',
  0,
  array['Abitur with good grades'],
  'Comprehensive psychology program with research opportunities',
  180
from public.universities u where u.name = 'University of Cologne'

union all

select 
  u.id,
  'Architecture',
  'Architecture',
  'Master''s',
  4,
  array['German B2', 'English B2'],
  2.3,
  '2024-03-15'::date,
  'October 2024',
  0,
  array['Bachelor in Architecture or related field', 'Portfolio submission'],
  'Creative architecture program with sustainable design focus',
  120
from public.universities u where u.name = 'Dresden University of Technology'

union all

select 
  u.id,
  'Economics',
  'Economics',
  'Master''s',
  4,
  array['English B2', 'German B2'],
  2.2,
  '2024-07-01'::date,
  'October 2024',
  0,
  array['Bachelor in Economics, Business, or Mathematics'],
  'Advanced economics program with quantitative methods',
  120
from public.universities u where u.name = 'University of Leipzig'

union all

select 
  u.id,
  'Maritime Engineering',
  'Engineering',
  'Master''s',
  4,
  array['English B2'],
  2.4,
  '2024-07-31'::date,
  'October 2024',
  0,
  array['Bachelor in Engineering or related field'],
  'Specialized maritime engineering with ship design focus',
  120
from public.universities u where u.name = 'Hamburg University of Technology'

on conflict do nothing;