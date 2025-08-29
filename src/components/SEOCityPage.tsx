import { Helmet } from "react-helmet-async";
import JsonLd from "@/components/JsonLd";

interface City {
  id: string;
  name: string;
  state?: string;
  slug: string;
  lat?: number;
  lng?: number;
  keywords?: string[];
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
  const title = `${city.name} Universities in Germany | University Assist`;
  const description = `Discover all universities in ${city.name}, Germany. Browse ${universities.length} institutions, programs, student ambassadors, and application deadlines.`;
  const keywords = city.keywords?.join(', ') || `${city.name}, Germany, universities, study abroad, German universities`;
  
  // JSON-LD structured data for City + ItemList
  const citySchema = {
    "@context": "https://schema.org",
    "@type": ["Place", "City"],
    "name": city.name,
    "address": {
      "@type": "PostalAddress",
      "addressLocality": city.name,
      "addressRegion": city.state,
      "addressCountry": "Germany"
    },
    "geo": city.lat && city.lng ? {
      "@type": "GeoCoordinates",
      "latitude": city.lat,
      "longitude": city.lng
    } : undefined,
    "url": `https://universityassist.com/cities/${city.slug}`
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