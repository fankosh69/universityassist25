-- Fix security warnings for function search paths

-- Update has_role_by_profile function with secure search path
CREATE OR REPLACE FUNCTION public.has_role_by_profile(_profile_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.user_roles
        WHERE profile_id = _profile_id AND role = _role
    )
$$;

-- Update has_role function with secure search path
CREATE OR REPLACE FUNCTION public.has_role(_role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.user_roles ur
        JOIN public.profiles p ON p.id = ur.profile_id
        WHERE p.id = (SELECT id FROM public.profiles WHERE id = auth.uid())
        AND ur.role = _role
    )
$$;

-- Update existing functions with secure search path
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;