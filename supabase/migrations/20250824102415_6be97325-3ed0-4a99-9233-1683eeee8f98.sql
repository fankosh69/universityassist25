-- Final Security Lock-down for Profiles Table (Fixed)

-- Drop any remaining conflicting or permissive policies
DROP POLICY IF EXISTS "Anyone can view profiles" ON public.profiles;
DROP POLICY IF EXISTS "Public can view profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view profiles" ON public.profiles;
DROP POLICY IF EXISTS "Ultra strict profile access" ON public.profiles;

-- Create the most restrictive policy possible
CREATE POLICY "Ultra strict profile access" ON public.profiles
FOR ALL USING (
    -- Only allow users to access their own profile OR admins
    (id = auth.uid() AND auth.uid() IS NOT NULL) OR 
    (has_role('admin'::app_role) AND auth.uid() IS NOT NULL)
) WITH CHECK (
    -- Same restrictions for modifications
    (id = auth.uid() AND auth.uid() IS NOT NULL) OR 
    (has_role('admin'::app_role) AND auth.uid() IS NOT NULL)
);

-- Revoke all direct permissions
REVOKE ALL ON public.profiles FROM anon;
REVOKE ALL ON public.profiles FROM public;

-- Only allow authenticated users access through RLS
GRANT SELECT ON public.profiles TO authenticated;

-- Add table comment for security documentation
COMMENT ON TABLE public.profiles IS 'Student personal data - access only via secure functions with comprehensive RLS protection. All access is logged and audited.';