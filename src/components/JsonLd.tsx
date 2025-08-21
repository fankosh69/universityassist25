interface JsonLdProps {
  data: object;
}

const JsonLd = ({ data }: JsonLdProps) => {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
};

// Structured data schemas for better SEO
export const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "University Assist",
  "description": "Your way to Germany - Find your perfect German university program with intelligent matching",
  "url": "https://universityassist.com",
  "logo": "https://universityassist.com/logo.png",
  "sameAs": [
    "https://twitter.com/universityassist",
    "https://facebook.com/universityassist"
  ]
};

export const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "University Assist",
  "description": "Your way to Germany - German University Admissions Platform",
  "url": "https://universityassist.com",
  "potentialAction": {
    "@type": "SearchAction",
    "target": "https://universityassist.com/search?q={search_term_string}",
    "query-input": "required name=search_term_string"
  }
};

export const createEducationalOrganizationSchema = (university: any) => ({
  "@context": "https://schema.org",
  "@type": "EducationalOrganization",
  "name": university.name,
  "address": {
    "@type": "PostalAddress",
    "addressLocality": university.city,
    "addressCountry": "Germany"
  },
  "url": university.website
});

export default JsonLd;