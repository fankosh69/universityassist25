// JSON-LD Schema Generation for SEO

export interface City {
  id: string;
  name: string;
  state?: string;
  country_code: string;
  lat?: number;
  lng?: number;
}

export interface University {
  id: string;
  name: string;
  city: string;
  website?: string;
  lat?: number;
  lng?: number;
}

export interface Program {
  id: string;
  title: string;
  major: string;
  degree_level: string;
  university: University;
  tuition_eur?: number;
  duration_semesters?: number;
}

export interface Ambassador {
  id: string;
  full_name: string;
  slug: string;
  linkedin_url?: string;
  photo_url?: string;
  testimonial?: string;
  video_url?: string;
}

export function createCitySchema(city: City, universities: University[]) {
  return {
    "@context": "https://schema.org",
    "@type": "Place",
    "name": city.name,
    "address": {
      "@type": "PostalAddress",
      "addressLocality": city.name,
      "addressRegion": city.state,
      "addressCountry": city.country_code === 'DE' ? 'Germany' : city.country_code
    },
    ...(city.lat && city.lng && {
      "geo": {
        "@type": "GeoCoordinates",
        "latitude": city.lat,
        "longitude": city.lng
      }
    }),
    "containsPlace": universities.map(uni => ({
      "@type": "CollegeOrUniversity",
      "name": uni.name,
      "url": uni.website
    })),
    "hasOfferCatalog": {
      "@type": "ItemList",
      "name": `Universities in ${city.name}`,
      "numberOfItems": universities.length,
      "itemListElement": universities.map((uni, index) => ({
        "@type": "ListItem",
        "position": index + 1,
        "item": {
          "@type": "CollegeOrUniversity",
          "name": uni.name,
          "url": `/universities/${uni.id}`
        }
      }))
    }
  };
}

export function createUniversitySchema(university: University, programs: Program[]) {
  return {
    "@context": "https://schema.org",
    "@type": "CollegeOrUniversity",
    "name": university.name,
    "address": {
      "@type": "PostalAddress",
      "addressLocality": university.city,
      "addressCountry": "Germany"
    },
    ...(university.website && { "url": university.website }),
    ...(university.lat && university.lng && {
      "geo": {
        "@type": "GeoCoordinates",
        "latitude": university.lat,
        "longitude": university.lng
      }
    }),
    "hasOfferCatalog": {
      "@type": "OfferCatalog",
      "name": `Programs at ${university.name}`,
      "itemListElement": programs.map((program, index) => ({
        "@type": "ListItem",
        "position": index + 1,
        "item": {
          "@type": "Course",
          "name": program.title,
          "courseCode": program.major,
          "educationalLevel": program.degree_level,
          "provider": {
            "@type": "CollegeOrUniversity",
            "name": university.name
          }
        }
      }))
    }
  };
}

export function createProgramSchema(program: Program, breadcrumbs: Array<{name: string, url: string}>) {
  return {
    "@context": "https://schema.org",
    "@type": "Course",
    "name": program.title,
    "description": `${program.degree_level} in ${program.major}`,
    "courseCode": program.major,
    "educationalLevel": program.degree_level,
    "provider": {
      "@type": "CollegeOrUniversity",
      "name": program.university.name,
      "address": {
        "@type": "PostalAddress",
        "addressLocality": program.university.city,
        "addressCountry": "Germany"
      }
    },
    ...(program.tuition_eur && {
      "offers": {
        "@type": "Offer",
        "price": program.tuition_eur,
        "priceCurrency": "EUR"
      }
    }),
    "timeRequired": program.duration_semesters ? `P${program.duration_semesters * 6}M` : undefined,
    "inLanguage": "de"
  };
}

export function createBreadcrumbSchema(breadcrumbs: Array<{name: string, url: string}>) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": breadcrumbs.map((crumb, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": crumb.name,
      "item": crumb.url
    }))
  };
}

export function createAmbassadorSchema(ambassador: Ambassador) {
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    "name": ambassador.full_name,
    "description": "University Ambassador - Study in Germany",
    ...(ambassador.linkedin_url && { "sameAs": [ambassador.linkedin_url] }),
    ...(ambassador.photo_url && { "image": ambassador.photo_url }),
    ...(ambassador.video_url && {
      "video": {
        "@type": "VideoObject",
        "name": `${ambassador.full_name} - Student Testimonial`,
        "contentUrl": ambassador.video_url,
        "description": ambassador.testimonial
      }
    })
  };
}

export function createWebsiteSchema() {
  return {
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
}