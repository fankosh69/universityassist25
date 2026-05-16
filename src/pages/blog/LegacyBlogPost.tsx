import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { ChevronRight, ArrowRight, Calendar, Clock } from "lucide-react";
import Navigation from "@/components/Navigation";
import JsonLd from "@/components/JsonLd";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { LegacyBlogPost } from "@/content/legacy-blog-posts";

const SITE = "https://uniassist.net";

export default function LegacyBlogPostPage({ post }: { post: LegacyBlogPost }) {
  const url = `${SITE}/${post.slug}`;

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.metaDescription,
    datePublished: post.publishedDate,
    dateModified: post.updatedDate,
    inLanguage: "en",
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    author: { "@type": "Organization", name: "University Assist", url: SITE },
    publisher: {
      "@type": "Organization",
      name: "University Assist",
      url: SITE,
      logo: {
        "@type": "ImageObject",
        url: "https://storage.googleapis.com/gpt-engineer-file-uploads/4GgXN75HAhbPf265S4zAhw1Qsbd2/uploads/1757493681468-University Assist-33.png",
      },
    },
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE },
      { "@type": "ListItem", position: 2, name: "Blog", item: `${SITE}/blog` },
      { "@type": "ListItem", position: 3, name: post.title, item: url },
    ],
  };

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>{post.metaTitle}</title>
        <meta name="description" content={post.metaDescription} />
        <meta name="keywords" content={post.keyword} />
        <link rel="canonical" href={url} />
        <meta property="og:type" content="article" />
        <meta property="og:title" content={post.metaTitle} />
        <meta property="og:description" content={post.metaDescription} />
        <meta property="og:url" content={url} />
        <meta property="article:published_time" content={post.publishedDate} />
        <meta property="article:modified_time" content={post.updatedDate} />
        <meta property="article:section" content={post.category} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={post.metaTitle} />
        <meta name="twitter:description" content={post.metaDescription} />
      </Helmet>

      <JsonLd data={articleSchema} />
      <JsonLd data={breadcrumbSchema} />

      <Navigation />

      <article className="container mx-auto px-4 py-8 md:py-12 max-w-4xl">
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6" aria-label="Breadcrumb">
          <Link to="/" className="hover:text-foreground transition-colors">Home</Link>
          <ChevronRight className="h-4 w-4" />
          <Link to="/blog" className="hover:text-foreground transition-colors">Blog</Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-foreground line-clamp-1">{post.title}</span>
        </nav>

        {/* Header */}
        <header className="mb-8 md:mb-10">
          <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary mb-3">
            {post.category}
          </div>
          <h1 className="font-[var(--font-heading)] text-3xl md:text-5xl font-bold tracking-tight leading-tight mb-4">
            {post.title}
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground leading-relaxed">
            {post.excerpt}
          </p>
          <div className="flex flex-wrap items-center gap-4 mt-6 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <Calendar className="h-4 w-4" />
              Updated {new Date(post.updatedDate).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Clock className="h-4 w-4" />
              {post.readingMinutes} min read
            </span>
          </div>
        </header>

        {/* Body */}
        <div className="prose prose-lg dark:prose-invert max-w-none">
          <p className="lead text-foreground/90 text-lg leading-relaxed">{post.intro}</p>

          {post.sections.map((section, idx) => (
            <section key={idx} className="mt-8">
              <h2 className="font-[var(--font-heading)] text-2xl md:text-3xl font-bold tracking-tight mt-10 mb-4">
                {section.heading}
              </h2>
              {section.paragraphs.map((p, pi) => (
                <p key={pi} className="text-foreground/90 leading-relaxed mb-4">{p}</p>
              ))}
              {section.bullets && (
                <ul className="list-disc pl-6 space-y-2 text-foreground/90">
                  {section.bullets.map((b, bi) => <li key={bi}>{b}</li>)}
                </ul>
              )}
            </section>
          ))}
        </div>

        {/* Primary CTA */}
        <Card className="mt-10 p-6 md:p-8 bg-[image:var(--gradient-hero)] text-primary-foreground border-0 shadow-lg">
          <h3 className="font-[var(--font-heading)] text-xl md:text-2xl font-bold mb-2">
            Ready to take the next step?
          </h3>
          <p className="text-primary-foreground/85 mb-4">
            University Assist gives you live program data, automatic eligibility checks and deadline tracking — free for students.
          </p>
          <Button asChild size="lg" variant="secondary">
            <Link to={post.primaryCta.href}>
              {post.primaryCta.label} <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </Card>

        {/* Related */}
        {post.related.length > 0 && (
          <section className="mt-12">
            <h2 className="font-[var(--font-heading)] text-2xl font-bold tracking-tight mb-4">
              Related on University Assist
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {post.related.map((r) => (
                <Link
                  key={r.href}
                  to={r.href}
                  className="group rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/40 hover:bg-accent/40"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-semibold text-foreground group-hover:text-primary transition-colors">
                        {r.label}
                      </div>
                      {r.description && (
                        <div className="text-sm text-muted-foreground mt-1">{r.description}</div>
                      )}
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors mt-1" />
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </article>
    </div>
  );
}