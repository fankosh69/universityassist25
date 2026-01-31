-- Drop the old constraint
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS check_realistic_email;

-- Add a smarter constraint that allows legitimate email aliases
-- Only rejects emails where the entire local part (before @) is just test/fake/dummy
ALTER TABLE public.profiles ADD CONSTRAINT check_realistic_email 
CHECK (
  email IS NULL OR (
    -- Don't allow emails like test@domain.com, fake@domain.com, dummy@domain.com
    LOWER(split_part(email, '@', 1)) NOT IN ('test', 'fake', 'dummy', 'testuser', 'fakeuser', 'dummyuser')
    -- Don't allow emails with clearly fake domains
    AND email !~~* '%@test.%'
    AND email !~~* '%@fake.%'
    AND email !~~* '%@example.%'
    AND email !~~* '%@mailinator.%'
  )
);