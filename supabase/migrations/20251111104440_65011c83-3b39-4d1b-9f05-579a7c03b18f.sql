-- Assign 'student' role to all existing users without roles
INSERT INTO public.user_roles (profile_id, role)
SELECT p.id, 'student'::app_role
FROM public.profiles p
WHERE NOT EXISTS (
  SELECT 1 FROM public.user_roles ur WHERE ur.profile_id = p.id
)
ON CONFLICT (profile_id, role) DO NOTHING;

-- Create function to auto-assign student role on signup
CREATE OR REPLACE FUNCTION public.auto_assign_student_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert student role for new user
  INSERT INTO public.user_roles (profile_id, role)
  VALUES (NEW.id, 'student'::app_role)
  ON CONFLICT (profile_id, role) DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- Create trigger to auto-assign student role on new user signup
DROP TRIGGER IF EXISTS on_auth_user_created_assign_role ON auth.users;
CREATE TRIGGER on_auth_user_created_assign_role
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_assign_student_role();

-- Log the migration
INSERT INTO public.audit_logs (operation, table_name, new_data)
VALUES (
  'MIGRATION',
  'user_roles',
  jsonb_build_object(
    'action', 'auto_assign_student_roles',
    'description', 'Assigned student role to existing users and created auto-assign trigger'
  )
);