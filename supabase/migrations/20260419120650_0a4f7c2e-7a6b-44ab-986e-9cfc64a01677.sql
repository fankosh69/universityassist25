
-- 1. PROFILES: Restrict policies to authenticated role only
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;

CREATE POLICY "Users can view own profile"
ON public.profiles FOR SELECT TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE TO authenticated
USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
ON public.profiles FOR INSERT TO authenticated
WITH CHECK (auth.uid() = id);

-- 2. USER_ROLES: Restrict policies to authenticated role only
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage user roles" ON public.user_roles;

CREATE POLICY "Users can view own roles"
ON public.user_roles FOR SELECT TO authenticated
USING (auth.uid() = profile_id);

CREATE POLICY "Admins can manage user roles"
ON public.user_roles FOR ALL TO authenticated
USING (has_role('admin'::app_role))
WITH CHECK (has_role('admin'::app_role));

-- 3. STUDENT_DOCUMENTS: Allow uploaders to manage their own documents
CREATE POLICY "Users can view own documents"
ON public.student_documents FOR SELECT TO authenticated
USING (auth.uid() = uploaded_by);

CREATE POLICY "Users can insert own documents"
ON public.student_documents FOR INSERT TO authenticated
WITH CHECK (auth.uid() = uploaded_by);

CREATE POLICY "Users can update own documents"
ON public.student_documents FOR UPDATE TO authenticated
USING (auth.uid() = uploaded_by) WITH CHECK (auth.uid() = uploaded_by);

CREATE POLICY "Users can delete own documents"
ON public.student_documents FOR DELETE TO authenticated
USING (auth.uid() = uploaded_by);
