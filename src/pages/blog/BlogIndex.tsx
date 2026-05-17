import { useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { ArrowRight, Search } from "lucide-react";
import Navigation from "@/components/Navigation";
import JsonLd from "@/components/JsonLd";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { LEGACY_BLOG_POSTS } from "@/content/legacy-blog-posts";
import { LANDING_PAGES } from "@/content/landing-pages";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import BlogCard, { type BlogCardItem } from "@/components/blog/BlogCard";
import BlogFeaturedCard from "@/components/blog/BlogFeaturedCard";
import BlogCategoryFilter from "@/components/blog/BlogCategoryFilter";

const SITE = "https://uniassist.net";
const ALL = "All";

export default function BlogIndex() {
  const url = `${SITE}/blog`;
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>(ALL);

  const { data: dbPosts, isLoading } = useQuery({
    queryKey: ["blog-posts-public"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_posts")
        .select("slug, title, meta_description, category, reading_minutes, published_at, updated_at, hero_image_url")
        .eq("status", "published")
        .order("published_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: legacyImages } = useQuery({
    queryKey: ["legacy-blog-hero-images-public"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("legacy_blog_hero_images")
        .select("slug, hero_image_url");
      if (error) throw error;
      const map = new Map<string, string>();
      (data ?? []).forEach((r) => map.set(r.slug, r.hero_image_url));
      return map;
    },
  });

  const posts = useMemo<(BlogCardItem & { updatedDate: string })[]>(() => {
    const fromDb = (dbPosts ?? []).map((p) => ({
      slug: `blog/${p.slug}`,
      title: p.title,
      excerpt: p.meta_description ?? "",
      category: (p.category ?? "Study tips") as string,
      readingMinutes: p.reading_minutes ?? 7,
      updatedDate: p.updated_at,
      heroImageUrl: p.hero_image_url ?? null,
    }));
    const fromLegacy = LEGACY_BLOG_POSTS.map((p) => ({
      slug: p.slug,
      title: p.title,
      excerpt: p.excerpt,
      category: p.category as string,
      readingMinutes: p.readingMinutes,
      updatedDate: p.updatedDate,
      heroImageUrl: legacyImages?.get(p.slug) ?? null,
    }));
    return [...fromDb, ...fromLegacy].sort(
      (a, b) => +new Date(b.updatedDate) - +new Date(a.updatedDate),
    );
  }, [dbPosts, legacyImages]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    posts.forEach((p) => set.add(p.category));
    return [ALL, ...Array.from(set).sort()];
  }, [posts]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return posts.filter((p) => {
      if (activeCategory !== ALL && p.category !== activeCategory) return false;
      if (!q) return true;
      return (
        p.title.toLowerCase().includes(q) ||
        p.excerpt.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
      );
    });
  }, [posts, query, activeCategory]);

  const featured = filtered[0];
  const rest = filtered.slice(1);

  const itemListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "University Assist Blog",
    itemListElement: posts.map((p, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: `${SITE}/${p.slug}`,
      name: p.title,
    })),
  };

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Blog — Study in Germany Guides | University Assist</title>
        <meta
          name="description"
          content="Practical guides for international students applying to German universities: cost of living, top programs, ECTS, eligibility and city guides."
        />
        <link rel="canonical" href={url} />
        <meta property="og:type" content="website" />
        <meta property="og:title" content="University Assist Blog — Study in Germany Guides" />
        <meta property="og:url" content={url} />
      </Helmet>
      <JsonLd data={itemListSchema} />

      <Navigation />

      {/* Hero band */}
      <section className="relative overflow-hidden border-b border-border">
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/85 to-secondary" />
        <div className="absolute inset-0 opacity-30 [background-image:radial-gradient(circle_at_20%_20%,white_0%,transparent_45%),radial-gradient(circle_at_80%_60%,white_0%,transparent_40%)]" />
        <div className="relative container mx-auto px-4 py-16 md:py-24 max-w-6xl text-primary-foreground">
          <p className="text-xs md:text-sm font-semibold uppercase tracking-[0.2em] opacity-90 mb-3">
            University Assist · Insights
          </p>
          <h1 className="font-[var(--font-heading)] text-4xl md:text-6xl font-bold tracking-tight max-w-3xl">
            Your guide to studying in Germany
          </h1>
          <p className="mt-4 text-lg md:text-xl opacity-95 max-w-2xl">
            Independent, practical articles for international students — from city guides
            and program shortlists to visas, costs and language exams.
          </p>
          <div className="mt-7 max-w-xl relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search articles, cities, universities…"
              className="pl-9 h-12 bg-background text-foreground rounded-full shadow-lg border-transparent focus-visible:ring-2 focus-visible:ring-accent"
            />
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-10 md:py-14 max-w-6xl">
        {/* Category filter */}
        <div className="mb-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <BlogCategoryFilter
            categories={categories}
            active={activeCategory}
            onChange={setActiveCategory}
          />
          <p className="text-sm text-muted-foreground">
            {filtered.length} article{filtered.length === 1 ? "" : "s"}
          </p>
        </div>

        {/* Loading skeletons */}
        {isLoading ? (
          <div className="space-y-8">
            <Skeleton className="h-80 w-full rounded-xl" />
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-72 w-full rounded-xl" />
              ))}
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center">
            <p className="text-muted-foreground">
              No articles match your search yet. Try a different keyword or category.
            </p>
          </div>
        ) : (
          <>
            {/* Featured */}
            {featured && (
              <section className="mb-12">
                <BlogFeaturedCard post={featured} />
              </section>
            )}

            {/* Grid */}
            {rest.length > 0 && (
              <section>
                <h2 className="font-[var(--font-heading)] text-2xl font-bold mb-6">
                  Latest articles
                </h2>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {rest.map((p) => (
                    <BlogCard key={p.slug} post={p} />
                  ))}
                </div>
              </section>
            )}
          </>
        )}

        {/* Quick-access landing pages */}
        <section className="mt-16 pt-10 border-t border-border">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">
            Start your search
          </h2>
          <div className="flex flex-wrap gap-2">
            {LANDING_PAGES.map((lp) => (
              <Link
                key={lp.slug}
                to={`/${lp.slug}`}
                className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition-colors hover:border-primary/40 hover:text-primary hover:bg-accent/40"
              >
                {lp.title}
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
