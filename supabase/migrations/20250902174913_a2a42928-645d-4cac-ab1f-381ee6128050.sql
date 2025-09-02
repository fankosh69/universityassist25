-- Add description field to cities table
ALTER TABLE public.cities 
ADD COLUMN description text;

-- Add comment for documentation
COMMENT ON COLUMN public.cities.description IS 'Brief description of the city for display on the public cities page';