import { Helmet } from "react-helmet-async";
import JsonLd from "@/components/JsonLd";
import { getHrefLangTags, getUniversityBreadcrumbs, createBreadcrumbSchema } from "@/lib/seo-helpers";

interface University {
  id: string;
  name: string;
  city?: string;
  slug: string;
  website?: string;
  keywords?: string[];
  lat?: number;
  lng?: number;
  founded_year?: number;
  student_count?: number;
  international_student_percentage?: number;
  description?: string;
  logo_url?: string;
  rankings_data?: {
    qs?: { rank?: number; year?: number; score?: number };
    the?: { rank?: number; year?: number; score?: number };
  };
  accreditations?: string[];
  program_count?: number;
  city_slug?: string;
}

interface SEOUniversityPageProps {
  university: University;
  language?: 'en' | 'ar' | 'de';
}

export default function SEOUniversityPage({ university, language = 'en' }: SEOUniversityPageProps) {
  const cityName = university.city || "Germany";
  const title = `${university.name} – ${cityName} | Study in Germany`;
  const description = `Learn about ${university.name} in ${cityName}: academic programs, admission requirements, language requirements, and application deadlines for international students.`;
  const keywords = university.keywords?.join(', ') || `${university.name}, ${cityName}, Germany, university, study abroad, programs`;
  
  // Generate hreflang tags for i18n
  const hrefLangTags = getHrefLangTags(`/universities/${university.slug}`, language);
  
  // Generate breadcrumbs with city context
  const breadcrumbs = getUniversityBreadcrumbs(
    university.name,
    university.slug,
    university.city,
    university.city_slug
  );
  const breadcrumbSchema = createBreadcrumbSchema(breadcrumbs);
  
  // JSON-LD structured data for University
  const universitySchema = {
    "@context": "https://schema.org",
    "@type": "CollegeOrUniversity",
    "name": university.name,
    "description": university.description || `${university.name} is a higher education institution located in ${cityName}, Germany.`,
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
    "sameAs": `https://universityassist.net/universities/${university.slug}`,
    "foundingDate": university.founded_year ? `${university.founded_year}` : undefined,
    "numberOfStudents": university.student_count ? {
      "@type": "QuantitativeValue",
      "value": university.student_count
    } : undefined,
    "logo": university.logo_url,
    "aggregateRating": university.rankings_data?.qs?.score ? {
      "@type": "AggregateRating",
      "ratingValue": university.rankings_data.qs.score,
      "bestRating": 100,
      "ratingCount": 1
    } : undefined,
    "accreditationStatus": university.accreditations?.length ? university.accreditations.join(", ") : undefined
  };

  // ItemList schema for programs (if available)
  const programsSchema = university.program_count ? {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": `Academic Programs at ${university.name}`,
    "description": `Explore ${university.program_count} programs offered at ${university.name}`,
    "numberOfItems": university.program_count
  } : null;

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
        <meta property="og:url" content={`https://universityassist.net/universities/${university.slug}`} />
        
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={description} />
        
        {/* Canonical & hreflang for i18n */}
        <link rel="canonical" href={`https://universityassist.net/universities/${university.slug}`} />
        {hrefLangTags.map(tag => (
          <link key={tag.hreflang} rel="alternate" hrefLang={tag.hreflang} href={tag.href} />
        ))}
      </Helmet>
      
      <JsonLd data={universitySchema} />
      <JsonLd data={breadcrumbSchema} />
      {programsSchema && <JsonLd data={programsSchema} />}
    </>
  );
}