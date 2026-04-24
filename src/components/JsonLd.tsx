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

export const homepageFaqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "How does University Assist help me study in Germany?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "University Assist is a free platform that matches international students to bachelor's, master's and PhD programs at German universities. Build your academic profile, get an instant eligibility check using the Modified Bavarian GPA conversion, and discover programs that match your background, language level and study preferences.",
      },
    },
    {
      "@type": "Question",
      "name": "Is University Assist free to use?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Yes. Browsing universities, searching programs, checking eligibility and saving programs to your watchlist are all completely free. We are not affiliated with uni-assist e.V., DAAD or any German university.",
      },
    },
    {
      "@type": "Question",
      "name": "Which countries can I apply to?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "The platform currently focuses on Germany — it covers public and private universities, universities of applied sciences (Fachhochschulen), and German programs taught in English or German.",
      },
    },
    {
      "@type": "Question",
      "name": "What is uni-assist and do I need it?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "uni-assist e.V. is a service used by many German universities to evaluate international applications. Some programs require uni-assist (Direct or VPD), others accept direct applications. Each program page on University Assist clearly labels which application method is required.",
      },
    },
    {
      "@type": "Question",
      "name": "How is my German GPA calculated?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "We convert your home-country GPA to the German 1.0–4.0 scale using the Modified Bavarian Formula, which is the standard used by German university admissions offices. The conversion is shown transparently in your profile so you can see exactly how it was calculated.",
      },
    },
  ],
};

export default JsonLd;