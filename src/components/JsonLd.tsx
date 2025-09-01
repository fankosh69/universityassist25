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
  "url": "https://universityassist25.lovable.app",
  "logo": "https://universityassist25.lovable.app/lovable-uploads/fda0393f-0b68-4ef6-bd9a-3d02ac39e07b.png",
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
  "url": "https://universityassist25.lovable.app",
  "potentialAction": {
    "@type": "SearchAction",
    "target": "https://universityassist25.lovable.app/search?q={search_term_string}",
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