-- Create admin role enum and user roles system
CREATE TYPE public.app_role AS ENUM ('student', 'parent', 'school_counselor', 'university_staff', 'company_sales', 'company_admissions', 'marketing', 'admin');

-- Create user_roles table
CREATE TABLE public.user_roles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    UNIQUE (profile_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_profile_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.user_roles
        WHERE profile_id = _profile_id AND role = _role
    )
$$;

-- Create helper function for current user role check
CREATE OR REPLACE FUNCTION public.has_role(_role app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.user_roles ur
        JOIN public.profiles p ON p.id = ur.profile_id
        WHERE p.id = auth.uid()
        AND ur.role = _role
    )
$$;

-- RLS policy for user_roles table
CREATE POLICY "Users can view own roles" ON public.user_roles
    FOR SELECT USING (auth.uid() = profile_id);

-- Update RLS policies for admin access
-- Programs - Allow admins to modify
CREATE POLICY "Admins can manage programs" ON public.programs
    FOR ALL USING (public.has_role('admin'));

-- Cities - Allow admins to modify  
CREATE POLICY "Admins can manage cities" ON public.cities
    FOR ALL USING (public.has_role('admin'));

-- Universities - Allow admins to modify
CREATE POLICY "Admins can manage universities" ON public.universities
    FOR ALL USING (public.has_role('admin'));

-- Program requirements - Allow admins to modify
CREATE POLICY "Admins can manage program requirements" ON public.program_requirements
    FOR ALL USING (public.has_role('admin'));

-- Program deadlines - Allow admins to modify
CREATE POLICY "Admins can manage program deadlines" ON public.program_deadlines
    FOR ALL USING (public.has_role('admin'));

-- Application periods - Allow admins to modify
CREATE POLICY "Admins can manage application periods" ON public.application_periods
    FOR ALL USING (public.has_role('admin'));

-- Service packages - Allow admins to modify
CREATE POLICY "Admins can manage service packages" ON public.service_packages
    FOR ALL USING (public.has_role('admin'));