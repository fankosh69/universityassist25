import { EnhancedSearchContainer } from "@/components/search/EnhancedSearchContainer";
import Navigation from "@/components/Navigation";
import SEOHead from "@/components/SEOHead";
import JsonLd from "@/components/JsonLd";
import { BackToTop } from "@/components/BackToTop";
import { GraduationCap, Sparkles, Globe2, Search as SearchIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";

export default function Search() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": "Search German University Programs",
    "description": "Search and filter university programs in Germany. Find Bachelor's and Master's degrees across all fields of study.",
    "url": "https://university-assist.com/search"
  };

  return (
    <div className="min-h-screen">
      <SEOHead 
        title="Search University Programs in Germany | University Assist"
        description="Find and compare university programs across Germany. Advanced search and filtering for Bachelor's and Master's degrees in all fields of study."
      />
      <JsonLd data={jsonLd} />
      <Navigation />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-[image:var(--gradient-hero)] text-primary-foreground">
        {/* Decorative blobs */}
        <div className="pointer-events-none absolute -top-24 -right-20 h-72 w-72 rounded-full bg-accent/30 blur-3xl" aria-hidden="true" />
        <div className="pointer-events-none absolute -bottom-32 -left-16 h-80 w-80 rounded-full bg-secondary-glow/30 blur-3xl" aria-hidden="true" />
        <div className="pointer-events-none absolute inset-0 opacity-[0.07] bg-[radial-gradient(circle_at_1px_1px,white_1px,transparent_0)] [background-size:24px_24px]" aria-hidden="true" />

        <div className="container relative mx-auto px-4 pt-6 pb-10 md:pt-10 md:pb-14">
          {/* Breadcrumbs */}
          <nav className="flex items-center gap-2 text-sm text-primary-foreground/80 mb-6">
            <Link to="/" className="hover:text-primary-foreground transition-colors">Home</Link>
            <ChevronRight className="h-4 w-4" />
            <span className="text-primary-foreground">Search</span>
          </nav>

          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full bg-primary-foreground/10 backdrop-blur px-3 py-1 text-xs font-medium ring-1 ring-primary-foreground/20 mb-4">
                <Sparkles className="h-3.5 w-3.5" />
                Discover your future in Germany
              </div>
              <h1 className="font-[var(--font-heading)] text-3xl md:text-5xl font-bold tracking-tight leading-tight">
                Find the right <span className="text-accent-glow">German university program</span> for you
              </h1>
              <p className="mt-3 md:mt-4 text-base md:text-lg text-primary-foreground/85 max-w-xl">
                Search, filter and compare Bachelor's and Master's degrees across Germany — eligibility, deadlines, and tuition all in one place.
              </p>
            </div>

            {/* Stat highlights */}
            <div className="grid grid-cols-3 gap-3 md:gap-4 lg:min-w-[420px]">
              <HeroStat icon={<GraduationCap className="h-4 w-4" />} label="Programs" value="500+" />
              <HeroStat icon={<Globe2 className="h-4 w-4" />} label="Universities" value="200+" />
              <HeroStat icon={<SearchIcon className="h-4 w-4" />} label="Cities" value="80+" />
            </div>
          </div>
        </div>

        {/* Wave divider */}
        <svg
          className="block w-full h-8 md:h-12 text-background"
          viewBox="0 0 1440 80"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path
            fill="currentColor"
            d="M0,32 C240,80 480,80 720,48 C960,16 1200,16 1440,40 L1440,80 L0,80 Z"
          />
        </svg>
      </section>

      <EnhancedSearchContainer />

      <BackToTop />
    </div>
  );
}

function HeroStat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-xl bg-primary-foreground/10 backdrop-blur ring-1 ring-primary-foreground/20 px-3 py-3 md:px-4 md:py-4 text-center transition-transform hover:scale-[1.03]">
      <div className="flex items-center justify-center gap-1.5 text-primary-foreground/80 text-[11px] md:text-xs font-medium">
        {icon}
        <span>{label}</span>
      </div>
      <div className="mt-1 text-xl md:text-2xl font-bold tracking-tight">{value}</div>
    </div>
  );
}