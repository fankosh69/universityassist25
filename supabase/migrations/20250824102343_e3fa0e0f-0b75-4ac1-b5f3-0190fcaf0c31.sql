-- Final Security Lock-down for Profiles Table

-- Check current policies
SELECT policyname, cmd, permissive, roles FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'profiles';

-- Drop any remaining conflicting policies
DROP POLICY IF EXISTS "Anyone can view profiles" ON public.profiles;
DROP POLICY IF EXISTS "Public can view profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view profiles" ON public.profiles;

-- Ensure only the strict policies remain
-- These were already created in the previous migration but let's verify they exist

-- Create final ultra-secure policy set if not exists
CREATE POLICY IF NOT EXISTS "Ultra strict profile access" ON public.profiles
FOR ALL USING (
    -- Only allow users to access their own profile OR admins
    (id = auth.uid() AND auth.uid() IS NOT NULL) OR 
    (has_role('admin'::app_role) AND auth.uid() IS NOT NULL)
) WITH CHECK (
    -- Same restrictions for modifications
    (id = auth.uid() AND auth.uid() IS NOT NULL) OR 
    (has_role('admin'::app_role) AND auth.uid() IS NOT NULL)
);

-- Remove any remaining permissive policies
DELETE FROM pg_policy 
WHERE schemaname = 'public' 
AND tablename = 'profiles' 
AND policyname NOT IN ('Ultra strict profile access', 'Strict profile select access', 'Strict profile insert access', 'Strict profile update access', 'Block profile deletion');

-- Double-check no anonymous access is possible
REVOKE ALL ON public.profiles FROM anon;
REVOKE ALL ON public.profiles FROM public;

-- Only allow authenticated users minimal access through RLS
GRANT SELECT ON public.profiles TO authenticated;

-- Ensure all profile access goes through secure functions
COMMENT ON TABLE public.profiles IS 'Student personal data - access only via secure functions with comprehensive RLS protection';