import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, CheckCircle2, ChevronRight, Sparkles } from "lucide-react";
import Navigation from "@/components/Navigation";
import JsonLd from "@/components/JsonLd";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import type { LandingPage } from "@/content/landing-pages";

const SITE = "https://uniassist.net";

async function fetchLiveCount(counter: LandingPage["counter"]): Promise<number | null> {
  if (!counter) return null;
  try {
    if (counter.kind === "programs") {
      let q = supabase
        .from("programs")
        .select("id", { count: "exact", head: true })
        .eq("published", true);
      const f = counter.filter || {};
      if (f.level) q = q.eq("degree_level", String(f.level));
      if (f.language === "english") q = q.contains("language_of_instruction", ["en"]);
      if (f.language === "german") q = q.contains("language_of_instruction", ["de"]);
      const { count } = await q;
      return count ?? null;
    }
    if (counter.kind === "universities") {
      let q = supabase.from("universities").select("id", { count: "exact", head: true });
      const f = counter.filter || {};
      if (f.type) q = q.eq("control_type", String(f.type));
      const { count } = await q;
      return count ?? null;
    }
    if (counter.kind === "cities") {
      const { count } = await supabase.from("cities").select("id", { count: "exact", head: true });
      return count ?? null;
    }
  } catch {
    return null;
  }
  return null;
}

export default function LandingPageView({ page }: { page: LandingPage }) {
  const url = `${SITE}/${page.slug}`;
  const Icon = page.icon;

  const { data: liveCount } = useQuery({
    queryKey: ["landing-count", page.slug],
    queryFn: () => fetchLiveCount(page.counter),
    enabled: !!page.counter,
    staleTime: 5 * 60_000,
  });

  const faqSchema = page.faqs.length
    ? {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: page.faqs.map((f) => ({
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
      { "@type": "ListItem", position: 2, name: page.title, item: url },
    ],
  };

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>{page.metaTitle}</title>
        <meta name="description" content={page.metaDescription} />
        <meta name="keywords" content={page.keyword} />
        <link rel="canonical" href={url} />
        <meta property="og:type" content="website" />
        <meta property="og:title" content={page.metaTitle} />
        <meta property="og:description" content={page.metaDescription} />
        <meta property="og:url" content={url} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={page.metaTitle} />
        <meta name="twitter:description" content={page.metaDescription} />
      </Helmet>
      <JsonLd data={breadcrumbSchema} />
      {faqSchema && <JsonLd data={faqSchema} />}

      <Navigation />

      {/* Hero */}
      <section className="relative overflow-hidden bg-[image:var(--gradient-hero)] text-primary-foreground">
        <div className="pointer-events-none absolute -top-24 -right-20 h-72 w-72 rounded-full bg-accent/30 blur-3xl" aria-hidden="true" />
        <div className="pointer-events-none absolute -bottom-32 -left-16 h-80 w-80 rounded-full bg-secondary-glow/30 blur-3xl" aria-hidden="true" />
        <div className="container relative mx-auto px-4 py-12 md:py-20 max-w-5xl">
          <nav className="flex items-center gap-2 text-sm text-primary-foreground/80 mb-6" aria-label="Breadcrumb">
            <Link to="/" className="hover:text-primary-foreground transition-colors">Home</Link>
            <ChevronRight className="h-4 w-4" />
            <span className="text-primary-foreground">{page.title}</span>
          </nav>

          <div className="inline-flex items-center gap-2 rounded-full bg-primary-foreground/10 backdrop-blur px-3 py-1 text-xs font-medium ring-1 ring-primary-foreground/20 mb-4">
            <Sparkles className="h-3.5 w-3.5" />
            {page.heroEyebrow}
          </div>

          <h1 className="font-[var(--font-heading)] text-3xl md:text-5xl font-bold tracking-tight leading-tight max-w-3xl">
            {page.heroTitle}
          </h1>
          <p className="mt-4 text-base md:text-lg text-primary-foreground/85 max-w-2xl">
            {page.heroSubtitle}
          </p>

          {typeof liveCount === "number" && liveCount > 0 && (
            <div className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary-foreground/10 backdrop-blur ring-1 ring-primary-foreground/20 px-4 py-2">
              <Icon className="h-4 w-4" />
              <span className="font-semibold">
                {liveCount.toLocaleString()}{" "}
              </span>
              <span className="text-primary-foreground/85 text-sm">live results in our catalog</span>
            </div>
          )}

          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg" variant="secondary">
              <Link to={page.primaryCta.href}>
                {page.primaryCta.label} <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            {page.secondaryCta && (
              <Button asChild size="lg" variant="outline" className="bg-primary-foreground/10 border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/20 hover:text-primary-foreground">
                <Link to={page.secondaryCta.href}>{page.secondaryCta.label}</Link>
              </Button>
            )}
          </div>
        </div>
        <svg className="block w-full h-8 md:h-12 text-background" viewBox="0 0 1440 80" preserveAspectRatio="none" aria-hidden="true">
          <path fill="currentColor" d="M0,32 C240,80 480,80 720,48 C960,16 1200,16 1440,40 L1440,80 L0,80 Z" />
        </svg>
      </section>

      <div className="container mx-auto px-4 py-12 md:py-16 max-w-5xl space-y-16">
        {/* Benefits */}
        <section>
          <h2 className="font-[var(--font-heading)] text-2xl md:text-3xl font-bold tracking-tight mb-6">
            Why students choose this route
          </h2>
          <div className="grid gap-4 md:grid-cols-3">
            {page.benefits.map((b) => (
              <Card key={b.title} className="p-6">
                <CheckCircle2 className="h-5 w-5 text-primary mb-3" />
                <h3 className="font-semibold text-lg mb-2">{b.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{b.description}</p>
              </Card>
            ))}
          </div>
        </section>

        {/* Conversion CTA */}
        <section>
          <Card className="p-6 md:p-10 bg-[image:var(--gradient-hero)] text-primary-foreground border-0 shadow-lg text-center">
            <h2 className="font-[var(--font-heading)] text-2xl md:text-3xl font-bold tracking-tight">
              Search the live catalog
            </h2>
            <p className="mt-3 text-primary-foreground/85 max-w-xl mx-auto">
              Filter {typeof liveCount === "number" ? `${liveCount.toLocaleString()}+ ` : ""}options by field, language, deadline and budget — and save the ones you like.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Button asChild size="lg" variant="secondary">
                <Link to={page.primaryCta.href}>
                  {page.primaryCta.label} <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              {page.secondaryCta && (
                <Button asChild size="lg" variant="outline" className="bg-primary-foreground/10 border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/20 hover:text-primary-foreground">
                  <Link to={page.secondaryCta.href}>{page.secondaryCta.label}</Link>
                </Button>
              )}
            </div>
          </Card>
        </section>

        {/* FAQs */}
        {page.faqs.length > 0 && (
          <section>
            <h2 className="font-[var(--font-heading)] text-2xl md:text-3xl font-bold tracking-tight mb-6">
              Frequently asked questions
            </h2>
            <div className="space-y-3">
              {page.faqs.map((faq) => (
                <details key={faq.question} className="group rounded-xl border border-border bg-card p-5 open:shadow-sm">
                  <summary className="cursor-pointer font-semibold text-foreground list-none flex items-center justify-between gap-4">
                    <span>{faq.question}</span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-open:rotate-90" />
                  </summary>
                  <p className="mt-3 text-muted-foreground leading-relaxed">{faq.answer}</p>
                </details>
              ))}
            </div>
          </section>
        )}

        {/* Related */}
        {page.related.length > 0 && (
          <section>
            <h2 className="font-[var(--font-heading)] text-2xl md:text-3xl font-bold tracking-tight mb-6">
              Related guides
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {page.related.map((r) => (
                <Link
                  key={r.href}
                  to={r.href}
                  className="group rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/40 hover:bg-accent/40 flex items-center justify-between gap-3"
                >
                  <span className="font-medium text-foreground group-hover:text-primary transition-colors">
                    {r.label}
                  </span>
                  <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}