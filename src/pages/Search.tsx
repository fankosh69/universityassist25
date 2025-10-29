import { EnhancedSearchContainer } from "@/components/search/EnhancedSearchContainer";
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
    <div className="min-h-screen">
      <SEOHead 
        title="Search University Programs in Germany | University Assist"
        description="Find and compare university programs across Germany. Advanced search and filtering for Bachelor's and Master's degrees in all fields of study."
      />
      <JsonLd data={jsonLd} />
      <Navigation />
      
      <EnhancedSearchContainer />
    </div>
  );
}