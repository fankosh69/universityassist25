import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { ArrowRight, Clock } from "lucide-react";
import Navigation from "@/components/Navigation";
import JsonLd from "@/components/JsonLd";
import { Card } from "@/components/ui/card";
import { LEGACY_BLOG_POSTS } from "@/content/legacy-blog-posts";
import { LANDING_PAGES } from "@/content/landing-pages";

const SITE = "https://uniassist.net";

export default function BlogIndex() {
  const url = `${SITE}/blog`;
  const posts = [...LEGACY_BLOG_POSTS].sort(
    (a, b) => +new Date(b.updatedDate) - +new Date(a.updatedDate)
  );

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

      <div className="container mx-auto px-4 py-10 md:py-14 max-w-5xl">
        <header className="mb-10">
          <h1 className="font-[var(--font-heading)] text-4xl md:text-5xl font-bold tracking-tight">
            Study in Germany — Guides & Insights
          </h1>
          <p className="mt-3 text-lg text-muted-foreground max-w-2xl">
            Independent, up-to-date guides for international students applying to German Bachelor's and Master's programs.
          </p>
        </header>

        {/* Quick-access landing pages */}
        <section className="mb-10">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">
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

        <div className="grid gap-5 md:grid-cols-2">
          {posts.map((p) => (
            <Link key={p.slug} to={`/${p.slug}`} className="group">
              <Card className="h-full p-6 transition-all hover:shadow-md hover:border-primary/40">
                <div className="text-xs font-semibold uppercase tracking-wider text-primary mb-2">
                  {p.category}
                </div>
                <h2 className="font-[var(--font-heading)] text-xl md:text-2xl font-bold mb-2 group-hover:text-primary transition-colors">
                  {p.title}
                </h2>
                <p className="text-muted-foreground line-clamp-3 mb-4">{p.excerpt}</p>
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span className="inline-flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5" />
                    {p.readingMinutes} min read
                  </span>
                  <span className="inline-flex items-center gap-1 text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                    Read <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}