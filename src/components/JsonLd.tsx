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
  "name": "UniMatch Germany",
  "description": "Find your perfect German university program with intelligent matching",
  "url": "https://unimatch-germany.com",
  "logo": "https://unimatch-germany.com/logo.png",
  "sameAs": [
    "https://twitter.com/unimatchgermany",
    "https://facebook.com/unimatchgermany"
  ]
};

export const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "UniMatch Germany",
  "description": "German University Admissions Platform",
  "url": "https://unimatch-germany.com",
  "potentialAction": {
    "@type": "SearchAction",
    "target": "https://unimatch-germany.com/search?q={search_term_string}",
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