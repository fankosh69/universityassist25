ALTER TABLE public.blog_posts
  ADD COLUMN IF NOT EXISTS hero_image_url TEXT,
  ADD COLUMN IF NOT EXISTS hero_image_alt TEXT;

INSERT INTO storage.buckets (id, name, public)
VALUES ('blog-images', 'blog-images', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Blog images are publicly readable" ON storage.objects;
CREATE POLICY "Blog images are publicly readable"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'blog-images');

DROP POLICY IF EXISTS "Admins can upload blog images" ON storage.objects;
CREATE POLICY "Admins can upload blog images"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'blog-images' AND public.has_role('admin'::public.app_role));

DROP POLICY IF EXISTS "Admins can update blog images" ON storage.objects;
CREATE POLICY "Admins can update blog images"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'blog-images' AND public.has_role('admin'::public.app_role));

DROP POLICY IF EXISTS "Admins can delete blog images" ON storage.objects;
CREATE POLICY "Admins can delete blog images"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'blog-images' AND public.has_role('admin'::public.app_role));