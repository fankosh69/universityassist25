
CREATE TABLE public.legacy_blog_hero_images (
  slug TEXT PRIMARY KEY,
  hero_image_url TEXT NOT NULL,
  hero_image_alt TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.legacy_blog_hero_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "legacy_blog_hero_images_public_read"
  ON public.legacy_blog_hero_images FOR SELECT
  USING (true);

CREATE POLICY "legacy_blog_hero_images_admin_all"
  ON public.legacy_blog_hero_images FOR ALL
  TO authenticated
  USING (public.has_role('admin'::public.app_role))
  WITH CHECK (public.has_role('admin'::public.app_role));
