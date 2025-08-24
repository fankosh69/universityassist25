import EnhancedSearch from "@/components/EnhancedSearch";
import Navigation from "@/components/Navigation";
import SEOHead from "@/components/SEOHead";
import JsonLd from "@/components/JsonLd";

export default function Search() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": "Search German University Programs",
    "description": "Search and filter university programs in Germany. Find Bachelor's and Master's degrees across all fields of study.",
    "url": "https://university-assist.com/search"
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5">
      <SEOHead 
        title="Search University Programs in Germany | University Assist"
        description="Find and compare university programs across Germany. Advanced search and filtering for Bachelor's and Master's degrees in all fields of study."
      />
      <JsonLd data={jsonLd} />
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold mb-4">Find Your Perfect Program</h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Search through thousands of university programs in Germany. 
            Use our advanced filters to find the perfect match for your academic goals.
          </p>
        </div>

        <EnhancedSearch />
      </div>
    </div>
  );
}