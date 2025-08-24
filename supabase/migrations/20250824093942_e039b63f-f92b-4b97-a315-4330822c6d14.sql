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