import { Helmet } from "react-helmet-async";
import JsonLd from "@/components/JsonLd";

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
}

export default function SEOCityPage({ city, universities }: SEOCityPageProps) {
  const populationText = city.population_total ? ` with ${city.population_total.toLocaleString()} residents` : '';
  const regionText = city.region ? ` in ${city.region}` : '';
  
  const title = `Study in ${city.name}${regionText} | University Assist`;
  const description = `Discover ${universities.length} universities in ${city.name}${regionText}, Germany${populationText}. Find your perfect study destination with detailed program information.`;
  const keywords = city.keywords ? city.keywords.join(', ') : `${city.name}, Germany, universities, study abroad${city.region ? `, ${city.region}` : ''}`;
  
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
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={`https://universityassist.com/cities/${city.slug}`} />
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={description} />
        <link rel="canonical" href={`https://universityassist.com/cities/${city.slug}`} />
      </Helmet>
      
      <JsonLd data={citySchema} />
      <JsonLd data={universitiesListSchema} />
    </>
  );
}