-- QA Test Users Setup Migration
-- This migration sets up test user roles for TestSprite QA environment
-- Run after creating the test users in Supabase Auth dashboard

-- Note: This migration is idempotent and safe to run multiple times

-- Insert QA user roles (using DO block to handle potential duplicates)
DO $$ 
DECLARE
    student_user_id uuid;
    counselor_user_id uuid;
    admin_user_id uuid;
BEGIN
    -- Get user IDs from auth.users table (requires the users to be created first in Supabase Auth)
    -- These should match the email addresses in the secrets:
    -- - student+qa@universityassist.net
    -- - counselor+qa@universityassist.net  
    -- - admin+qa@universityassist.net

    -- Find student user
    SELECT id INTO student_user_id 
    FROM auth.users 
    WHERE email = 'student+qa@universityassist.net'
    LIMIT 1;
    
    -- Find counselor user
    SELECT id INTO counselor_user_id 
    FROM auth.users 
    WHERE email = 'counselor+qa@universityassist.net'
    LIMIT 1;
    
    -- Find admin user
    SELECT id INTO admin_user_id 
    FROM auth.users 
    WHERE email = 'admin+qa@universityassist.net'
    LIMIT 1;

    -- Insert student role (if user exists and role doesn't already exist)
    IF student_user_id IS NOT NULL THEN
        INSERT INTO public.user_roles (profile_id, role)
        VALUES (student_user_id, 'student'::app_role)
        ON CONFLICT (profile_id, role) DO NOTHING;
        
        RAISE NOTICE 'Student QA user role configured for user ID: %', student_user_id;
    ELSE
        RAISE NOTICE 'Student QA user not found - create user with email student+qa@universityassist.net in Supabase Auth first';
    END IF;

    -- Insert counselor role (if user exists and role doesn't already exist)
    IF counselor_user_id IS NOT NULL THEN
        INSERT INTO public.user_roles (profile_id, role)
        VALUES (counselor_user_id, 'school_counselor'::app_role)
        ON CONFLICT (profile_id, role) DO NOTHING;
        
        RAISE NOTICE 'Counselor QA user role configured for user ID: %', counselor_user_id;
    ELSE
        RAISE NOTICE 'Counselor QA user not found - create user with email counselor+qa@universityassist.net in Supabase Auth first';
    END IF;

    -- Insert admin role (if user exists and role doesn't already exist)
    IF admin_user_id IS NOT NULL THEN
        INSERT INTO public.user_roles (profile_id, role)
        VALUES (admin_user_id, 'admin'::app_role)
        ON CONFLICT (profile_id, role) DO NOTHING;
        
        RAISE NOTICE 'Admin QA user role configured for user ID: %', admin_user_id;
    ELSE
        RAISE NOTICE 'Admin QA user not found - create user with email admin+qa@universityassist.net in Supabase Auth first';
    END IF;

END $$;

-- Create a function to easily check QA user setup status
CREATE OR REPLACE FUNCTION public.check_qa_users_setup()
RETURNS TABLE (
    email text,
    user_exists boolean,
    profile_exists boolean,
    roles text[]
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
    RETURN QUERY
    WITH qa_emails AS (
        SELECT unnest(ARRAY[
            'student+qa@universityassist.net',
            'counselor+qa@universityassist.net', 
            'admin+qa@universityassist.net'
        ]) AS email_addr
    ),
    user_info AS (
        SELECT 
            qa.email_addr,
            au.id IS NOT NULL as user_exists,
            p.id IS NOT NULL as profile_exists,
            au.id as user_id
        FROM qa_emails qa
        LEFT JOIN auth.users au ON au.email = qa.email_addr
        LEFT JOIN public.profiles p ON p.id = au.id
    )
    SELECT 
        ui.email_addr::text,
        ui.user_exists,
        ui.profile_exists,
        COALESCE(
            array_agg(ur.role::text) FILTER (WHERE ur.role IS NOT NULL),
            ARRAY[]::text[]
        ) as roles
    FROM user_info ui
    LEFT JOIN public.user_roles ur ON ur.profile_id = ui.user_id
    GROUP BY ui.email_addr, ui.user_exists, ui.profile_exists
    ORDER BY ui.email_addr;
END $$;

-- Add helpful comments for the QA setup
COMMENT ON FUNCTION public.check_qa_users_setup() IS 'Helper function to verify QA test users are properly configured with roles';

-- Insert test data verification query (for admins to run manually)
-- SELECT * FROM public.check_qa_users_setup();