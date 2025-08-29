import { Helmet } from "react-helmet-async";
import JsonLd from "@/components/JsonLd";

interface University {
  id: string;
  name: string;
  city?: string;
  slug: string;
  website?: string;
  keywords?: string[];
  lat?: number;
  lng?: number;
}

interface SEOUniversityPageProps {
  university: University;
}

export default function SEOUniversityPage({ university }: SEOUniversityPageProps) {
  const cityName = university.city || "Germany";
  const title = `${university.name} – ${cityName} | Study in Germany`;
  const description = `Learn about ${university.name} in ${cityName}: academic programs, admission requirements, language requirements, and application deadlines for international students.`;
  const keywords = university.keywords?.join(', ') || `${university.name}, ${cityName}, Germany, university, study abroad, programs`;
  
  // JSON-LD structured data for University
  const universitySchema = {
    "@context": "https://schema.org",
    "@type": "CollegeOrUniversity",
    "name": university.name,
    "address": {
      "@type": "PostalAddress",
      "addressLocality": university.city,
      "addressCountry": "Germany"
    },
    "geo": university.lat && university.lng ? {
      "@type": "GeoCoordinates",
      "latitude": university.lat,
      "longitude": university.lng
    } : undefined,
    "url": university.website,
    "sameAs": `https://universityassist.com/universities/${university.slug}`,
    "description": `${university.name} is a higher education institution located in ${cityName}, Germany.`
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
        <meta property="og:url" content={`https://universityassist.com/universities/${university.slug}`} />
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={description} />
        <link rel="canonical" href={`https://universityassist.com/universities/${university.slug}`} />
      </Helmet>
      
      <JsonLd data={universitySchema} />
    </>
  );
}