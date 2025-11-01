import { Helmet } from "react-helmet-async";
import JsonLd from "@/components/JsonLd";
import { getHrefLangTags, getCityBreadcrumbs, createBreadcrumbSchema } from "@/lib/seo-helpers";

interface City {
  name: string;
  slug: string;
  lat?: number;
  lng?: number;
  keywords?: string[];
  region?: string;
  population_total?: number;
  population_asof?: string;
}

interface University {
  id: string;
  name: string;
  slug: string;
}

interface SEOCityPageProps {
  city: City;
  universities: University[];
  language?: 'en' | 'ar' | 'de';
}

export default function SEOCityPage({ city, universities, language = 'en' }: SEOCityPageProps) {
  const populationText = city.population_total ? ` with ${city.population_total.toLocaleString()} residents` : '';
  const regionText = city.region ? ` in ${city.region}` : '';
  
  const title = `Study in ${city.name}${regionText} | University Assist`;
  const description = `Discover ${universities.length} universities in ${city.name}${regionText}, Germany${populationText}. Find your perfect study destination with detailed program information.`;
  const keywords = city.keywords ? city.keywords.join(', ') : `${city.name}, Germany, universities, study abroad${city.region ? `, ${city.region}` : ''}`;
  
  // Generate hreflang tags for i18n
  const hrefLangTags = getHrefLangTags(`/cities/${city.slug}`, language);
  
  // Generate breadcrumbs
  const breadcrumbs = getCityBreadcrumbs(city.name, city.slug);
  const breadcrumbSchema = createBreadcrumbSchema(breadcrumbs);
  
  // JSON-LD structured data for City + ItemList
  const citySchema = {
    "@context": "https://schema.org",
    "@type": "Place",
    "name": city.name,
    "url": `https://universityassist.net/cities/${city.slug}`,
    "address": city.region ? {
      "@type": "PostalAddress",
      "addressRegion": city.region,
      "addressCountry": "Germany"
    } : undefined,
    "population": city.population_total || undefined,
    "geo": city.lat && city.lng ? {
      "@type": "GeoCoordinates",
      "latitude": city.lat,
      "longitude": city.lng
    } : undefined,
    "containsPlace": universities.map(uni => ({
      "@type": "CollegeOrUniversity",
      "name": uni.name,
      "url": `https://universityassist.net/universities/${uni.slug}`
    }))
  };

  const universitiesListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": `Universities in ${city.name}`,
    "description": `List of universities located in ${city.name}, Germany`,
    "numberOfItems": universities.length,
    "itemListElement": universities.map((university, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "item": {
        "@type": "CollegeOrUniversity",
        "name": university.name,
        "url": `https://universityassist.com/universities/${university.slug}`,
        "address": {
          "@type": "PostalAddress",
          "addressLocality": city.name,
          "addressCountry": "Germany"
        }
      }
    }))
  };

  return (
    <>
      <Helmet>
        <title>{title}</title>
        <meta name="description" content={description} />
        <meta name="keywords" content={keywords} />
        
        {/* Open Graph */}
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={`https://universityassist.net/cities/${city.slug}`} />
        
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={description} />
        
        {/* Canonical & hreflang for i18n */}
        <link rel="canonical" href={`https://universityassist.net/cities/${city.slug}`} />
        {hrefLangTags.map(tag => (
          <link key={tag.hreflang} rel="alternate" hrefLang={tag.hreflang} href={tag.href} />
        ))}
      </Helmet>
      
      <JsonLd data={citySchema} />
      <JsonLd data={universitiesListSchema} />
      <JsonLd data={breadcrumbSchema} />
    </>
  );
}