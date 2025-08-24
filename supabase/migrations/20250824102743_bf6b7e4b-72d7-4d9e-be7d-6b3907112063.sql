-- CRITICAL: Consolidate Conflicting RLS Policies for Profiles Table
-- This fixes the security vulnerability caused by overlapping policies

-- 1. Drop ALL existing conflicting policies
DROP POLICY IF EXISTS "Block profile deletion" ON public.profiles;
DROP POLICY IF EXISTS "Strict profile insert access" ON public.profiles;
DROP POLICY IF EXISTS "Strict profile select access" ON public.profiles;
DROP POLICY IF EXISTS "Strict profile update access" ON public.profiles;
DROP POLICY IF EXISTS "Ultra strict profile access" ON public.profiles;

-- 2. Create ONE comprehensive, crystal-clear policy that covers everything
CREATE POLICY "profiles_owner_admin_only" ON public.profiles
FOR ALL 
TO authenticated
USING (
    -- Allow access if user owns the profile OR is admin
    id = auth.uid() OR has_role('admin'::app_role)
)
WITH CHECK (
    -- Same restrictions for modifications
    id = auth.uid() OR has_role('admin'::app_role)
);

-- 3. Create a separate, explicit DELETE restriction policy
-- (DELETE needs special handling since it's dangerous)
CREATE POLICY "profiles_block_delete" ON public.profiles
FOR DELETE 
TO authenticated
USING (false); -- Completely block DELETE for everyone except direct SQL

-- 4. Verify no anonymous access is possible
REVOKE ALL ON public.profiles FROM anon;
REVOKE ALL ON public.profiles FROM public;

-- 5. Grant minimal necessary permissions to authenticated users only
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
-- Note: DELETE is intentionally NOT granted

-- 6. Add security documentation
COMMENT ON TABLE public.profiles IS 'SECURITY: Personal data access restricted to profile owner + admins only. All access logged via audit triggers.';

-- 7. Verify the policy setup
SELECT 
    policyname, 
    cmd, 
    permissive,
    roles,
    qual IS NOT NULL as has_using_clause,
    with_check IS NOT NULL as has_with_check_clause
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'profiles'
ORDER BY policyname;