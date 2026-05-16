-- Blog content management for automated SEO/AEO pipeline

CREATE TYPE public.blog_post_status AS ENUM ('draft', 'published', 'archived');
CREATE TYPE public.blog_candidate_status AS ENUM ('proposed', 'selected', 'rejected', 'drafted');
CREATE TYPE public.blog_candidate_source AS ENUM ('gsc', 'firecrawl_gap', 'manual', 'semrush');

CREATE TABLE public.blog_topic_candidates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  keyword text NOT NULL,
  est_volume integer,
  kdi numeric,
  current_position numeric,
  source public.blog_candidate_source NOT NULL DEFAULT 'manual',
  source_url text,
  notes text,
  status public.blog_candidate_status NOT NULL DEFAULT 'proposed',
  score numeric,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (keyword)
);

CREATE INDEX idx_blog_candidates_status ON public.blog_topic_candidates(status, score DESC);

CREATE TABLE public.blog_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  meta_title text,
  meta_description text,
  keyword text,
  category text,
  reading_minutes integer DEFAULT 6,
  tldr text,
  intro text,
  sections jsonb NOT NULL DEFAULT '[]'::jsonb,
  faqs jsonb NOT NULL DEFAULT '[]'::jsonb,
  related_links jsonb NOT NULL DEFAULT '[]'::jsonb,
  primary_cta jsonb,
  status public.blog_post_status NOT NULL DEFAULT 'draft',
  source_candidate_id uuid REFERENCES public.blog_topic_candidates(id) ON DELETE SET NULL,
  ai_model text,
  ai_prompt_version text,
  author_id uuid,
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_blog_posts_status_pub ON public.blog_posts(status, published_at DESC);
CREATE INDEX idx_blog_posts_slug ON public.blog_posts(slug);

-- updated_at triggers
CREATE TRIGGER trg_blog_candidates_updated
  BEFORE UPDATE ON public.blog_topic_candidates
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trg_blog_posts_updated
  BEFORE UPDATE ON public.blog_posts
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- RLS
ALTER TABLE public.blog_topic_candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;

-- Candidates: admin only
CREATE POLICY "Admins manage blog candidates"
  ON public.blog_topic_candidates
  FOR ALL
  USING (public.has_role('admin'::public.app_role))
  WITH CHECK (public.has_role('admin'::public.app_role));

-- Posts: public can read published; admins manage all
CREATE POLICY "Public reads published blog posts"
  ON public.blog_posts
  FOR SELECT
  USING (status = 'published' OR public.has_role('admin'::public.app_role));

CREATE POLICY "Admins manage blog posts"
  ON public.blog_posts
  FOR ALL
  USING (public.has_role('admin'::public.app_role))
  WITH CHECK (public.has_role('admin'::public.app_role));