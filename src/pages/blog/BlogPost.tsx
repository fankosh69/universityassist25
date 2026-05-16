import { useQuery } from "@tanstack/react-query";
import { Helmet } from "react-helmet-async";
import { Link, Navigate, useParams } from "react-router-dom";
import { ArrowRight, Clock } from "lucide-react";
import Navigation from "@/components/Navigation";
import JsonLd from "@/components/JsonLd";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import LoadingScreen from "@/components/LoadingScreen";

const SITE = "https://uniassist.net";

interface Section {
  heading: string;
  answer?: string;
  paragraphs: string[];
  bullets?: string[];
}
interface Faq {
  question: string;
  answer: string;
}
interface RelatedLink {
  label: string;
  href: string;
}
interface PrimaryCta {
  label: string;
  href: string;
}

export default function BlogPost() {
  const { slug } = useParams<{ slug: string }>();
  const { data, isLoading, error } = useQuery({
    queryKey: ["blog-post", slug],
    enabled: !!slug,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_posts")
        .select("*")
        .eq("slug", slug!)
        .eq("status", "published")
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  if (isLoading) return <LoadingScreen />;
  if (error || !data) return <Navigate to="/blog" replace />;

  const url = `${SITE}/blog/${data.slug}`;
  const sections = (data.sections as unknown as Section[]) ?? [];
  const faqs = (data.faqs as unknown as Faq[]) ?? [];
  const related = (data.related_links as unknown as RelatedLink[]) ?? [];
  const cta = data.primary_cta as unknown as PrimaryCta | null;

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: data.title,
    description: data.meta_description,
    datePublished: data.published_at,
    dateModified: data.updated_at,
    author: { "@type": "Organization", name: "University Assist" },
    publisher: {
      "@type": "Organization",
      name: "University Assist",
      url: SITE,
    },
    mainEntityOfPage: url,
  };

  const faqSchema = faqs.length
    ? {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: faqs.map((f) => ({
          "@type": "Question",
          name: f.question,
          acceptedAnswer: { "@type": "Answer", text: f.answer },
        })),
      }
    : null;

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE },
      { "@type": "ListItem", position: 2, name: "Blog", item: `${SITE}/blog` },
      { "@type": "ListItem", position: 3, name: data.title, item: url },
    ],
  };

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>{data.meta_title || data.title}</title>
        <meta name="description" content={data.meta_description ?? ""} />
        <link rel="canonical" href={url} />
        <meta property="og:type" content="article" />
        <meta property="og:title" content={data.meta_title || data.title} />
        <meta property="og:description" content={data.meta_description ?? ""} />
        <meta property="og:url" content={url} />
      </Helmet>
      <JsonLd data={articleSchema} />
      {faqSchema && <JsonLd data={faqSchema} />}
      <JsonLd data={breadcrumbSchema} />

      <Navigation />

      <article className="container mx-auto px-4 py-10 md:py-14 max-w-3xl">
        <nav className="text-sm text-muted-foreground mb-6">
          <Link to="/" className="hover:text-primary">Home</Link>
          <span className="mx-2">/</span>
          <Link to="/blog" className="hover:text-primary">Blog</Link>
        </nav>

        <div className="text-xs font-semibold uppercase tracking-wider text-primary mb-2">
          {data.category}
        </div>
        <h1 className="font-[var(--font-heading)] text-3xl md:text-5xl font-bold tracking-tight mb-4">
          {data.title}
        </h1>
        <div className="flex items-center gap-3 text-sm text-muted-foreground mb-8">
          <span className="inline-flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" />
            {data.reading_minutes} min read
          </span>
          {data.published_at && (
            <span>· Updated {new Date(data.updated_at).toLocaleDateString()}</span>
          )}
        </div>

        {data.tldr && (
          <Card className="p-5 mb-8 bg-accent/30 border-l-4 border-l-primary">
            <div className="text-xs font-semibold uppercase tracking-wider text-primary mb-2">
              TL;DR
            </div>
            <p className="text-base leading-relaxed">{data.tldr}</p>
          </Card>
        )}

        {data.intro && (
          <p className="text-lg leading-relaxed text-foreground/90 mb-10">
            {data.intro}
          </p>
        )}

        {sections.map((s, i) => (
          <section key={i} className="mb-10">
            <h2 className="font-[var(--font-heading)] text-2xl md:text-3xl font-bold mb-3">
              {s.heading}
            </h2>
            {s.answer && (
              <p className="text-base font-medium text-foreground bg-muted/40 px-4 py-3 rounded-md mb-4">
                {s.answer}
              </p>
            )}
            {s.paragraphs?.map((p, j) => (
              <p key={j} className="text-base leading-relaxed text-foreground/90 mb-4">
                {p}
              </p>
            ))}
            {s.bullets && s.bullets.length > 0 && (
              <ul className="list-disc list-outside ml-6 space-y-1.5 text-foreground/90 mb-4">
                {s.bullets.map((b, k) => (
                  <li key={k}>{b}</li>
                ))}
              </ul>
            )}
          </section>
        ))}

        {faqs.length > 0 && (
          <section className="mt-12 mb-10">
            <h2 className="font-[var(--font-heading)] text-2xl md:text-3xl font-bold mb-5">
              Frequently asked questions
            </h2>
            <div className="space-y-4">
              {faqs.map((f, i) => (
                <Card key={i} className="p-5">
                  <h3 className="font-semibold text-lg mb-2">{f.question}</h3>
                  <p className="text-foreground/85">{f.answer}</p>
                </Card>
              ))}
            </div>
          </section>
        )}

        {cta && (
          <Card className="p-6 my-10 bg-primary/5 border-primary/20 text-center">
            <Link to={cta.href}>
              <Button size="lg" variant="hero">
                {cta.label}
              </Button>
            </Link>
          </Card>
        )}

        {related.length > 0 && (
          <section className="mt-12 pt-8 border-t">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">
              Related
            </h2>
            <ul className="space-y-2">
              {related.map((r, i) => (
                <li key={i}>
                  <Link to={r.href} className="text-primary hover:underline inline-flex items-center gap-1">
                    {r.label} <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </article>
    </div>
  );
}