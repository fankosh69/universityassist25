-- Create TestSprite integration table
CREATE TABLE public.testsprite_tests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  testsprite_id TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  url TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  last_run TIMESTAMP WITH TIME ZONE,
  duration INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.testsprite_tests ENABLE ROW LEVEL SECURITY;

-- Admin can manage all tests
CREATE POLICY "Admin can manage TestSprite tests" 
ON public.testsprite_tests 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE profile_id = auth.uid() 
    AND role = 'admin'
  )
);

-- Create trigger for updated_at
CREATE TRIGGER update_testsprite_tests_updated_at
BEFORE UPDATE ON public.testsprite_tests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();