-- Create secure admin statistics function
CREATE OR REPLACE FUNCTION public.get_admin_dashboard_stats()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
    stats_result jsonb;
    cities_count int;
    universities_count int;
    programs_count int;
    users_count int;
    applications_count int;
    packages_count int;
BEGIN
    -- Only allow admin users to access this function
    IF NOT has_role('admin'::app_role) THEN
        RAISE EXCEPTION 'Access denied: Admin role required';
    END IF;
    
    -- Get counts safely without bypassing RLS
    SELECT COUNT(*) INTO cities_count FROM public.cities;
    SELECT COUNT(*) INTO universities_count FROM public.universities;
    SELECT COUNT(*) INTO programs_count FROM public.programs;
    SELECT COUNT(*) INTO applications_count FROM public.user_applications;
    SELECT COUNT(*) INTO packages_count FROM public.service_packages;
    
    -- Get user count using a secure approach
    SELECT COUNT(*) INTO users_count FROM (
        SELECT DISTINCT profile_id FROM public.user_roles
        UNION
        SELECT id FROM public.profiles WHERE id = auth.uid()
    ) as user_profiles;
    
    -- Build the result JSON
    stats_result := jsonb_build_object(
        'cities', cities_count,
        'universities', universities_count,
        'programs', programs_count,
        'users', users_count,
        'applications', applications_count,
        'packages', packages_count,
        'generated_at', now()
    );
    
    -- Log the access for audit trail
    INSERT INTO public.audit_logs (table_name, operation, user_id, new_data, created_at)
    VALUES ('admin_dashboard', 'STATS_ACCESS', auth.uid(), stats_result, now());
    
    RETURN stats_result;
END;
$$;