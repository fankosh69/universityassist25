/**
 * SEO Helper Functions for i18n and Structured Data
 * Based on University Assist PRD requirements
 */

const BASE_URL = 'https://universityassist.net';
const SUPPORTED_LANGUAGES = ['en', 'ar', 'de'];

interface HrefLangTag {
  hreflang: string;
  href: string;
}

interface BreadcrumbItem {
  name: string;
  url: string;
}

/**
 * Generate hreflang alternate tags for a given path
 * @param path - The current path (e.g., '/cities/berlin')
 * @param currentLang - Current language code
 * @returns Array of hreflang tag objects
 */
export function getHrefLangTags(path: string, currentLang: string = 'en'): HrefLangTag[] {
  const tags: HrefLangTag[] = [];
  
  // Add tags for each supported language
  SUPPORTED_LANGUAGES.forEach(lang => {
    tags.push({
      hreflang: lang,
      href: `${BASE_URL}/${lang}${path}`
    });
  });
  
  // Add x-default for default language (English)
  tags.push({
    hreflang: 'x-default',
    href: `${BASE_URL}${path}`
  });
  
  return tags;
}

/**
 * Generate language alternate URLs
 * @param path - The current path
 * @returns Object with language codes as keys and URLs as values
 */
export function getLanguageAlternateUrls(path: string): Record<string, string> {
  const urls: Record<string, string> = {};
  
  SUPPORTED_LANGUAGES.forEach(lang => {
    urls[lang] = `${BASE_URL}/${lang}${path}`;
  });
  
  return urls;
}

/**
 * Generate BreadcrumbList JSON-LD schema
 * @param breadcrumbs - Array of breadcrumb items
 * @returns JSON-LD BreadcrumbList schema
 */
export function createBreadcrumbSchema(breadcrumbs: BreadcrumbItem[]) {
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

/**
 * Generate breadcrumbs for city pages
 * @param cityName - Name of the city
 * @param citySlug - URL slug of the city
 * @returns Breadcrumb items array
 */
export function getCityBreadcrumbs(cityName: string, citySlug: string): BreadcrumbItem[] {
  return [
    { name: 'Home', url: BASE_URL },
    { name: 'Cities', url: `${BASE_URL}/cities` },
    { name: cityName, url: `${BASE_URL}/cities/${citySlug}` }
  ];
}

/**
 * Generate breadcrumbs for university pages
 * @param universityName - Name of the university
 * @param universitySlug - URL slug of the university
 * @param cityName - Name of the city (optional)
 * @param citySlug - URL slug of the city (optional)
 * @returns Breadcrumb items array
 */
export function getUniversityBreadcrumbs(
  universityName: string,
  universitySlug: string,
  cityName?: string,
  citySlug?: string
): BreadcrumbItem[] {
  const breadcrumbs: BreadcrumbItem[] = [
    { name: 'Home', url: BASE_URL },
  ];
  
  if (cityName && citySlug) {
    breadcrumbs.push(
      { name: 'Cities', url: `${BASE_URL}/cities` },
      { name: cityName, url: `${BASE_URL}/cities/${citySlug}` }
    );
  }
  
  breadcrumbs.push(
    { name: 'Universities', url: `${BASE_URL}/universities` },
    { name: universityName, url: `${BASE_URL}/universities/${universitySlug}` }
  );
  
  return breadcrumbs;
}

/**
 * Generate breadcrumbs for program pages
 * @param programName - Name of the program
 * @param programSlug - URL slug of the program
 * @param universityName - Name of the university
 * @param universitySlug - URL slug of the university
 * @param cityName - Name of the city (optional)
 * @param citySlug - URL slug of the city (optional)
 * @returns Breadcrumb items array
 */
export function getProgramBreadcrumbs(
  programName: string,
  programSlug: string,
  universityName: string,
  universitySlug: string,
  cityName?: string,
  citySlug?: string
): BreadcrumbItem[] {
  const breadcrumbs: BreadcrumbItem[] = [
    { name: 'Home', url: BASE_URL },
  ];
  
  if (cityName && citySlug) {
    breadcrumbs.push(
      { name: 'Cities', url: `${BASE_URL}/cities` },
      { name: cityName, url: `${BASE_URL}/cities/${citySlug}` }
    );
  }
  
  breadcrumbs.push(
    { name: 'Universities', url: `${BASE_URL}/universities` },
    { name: universityName, url: `${BASE_URL}/universities/${universitySlug}` },
    { name: 'Programs', url: `${BASE_URL}/universities/${universitySlug}/programs` },
    { name: programName, url: `${BASE_URL}/universities/${universitySlug}/programs/${programSlug}` }
  );
  
  return breadcrumbs;
}

/**
 * Generate breadcrumbs for ambassador pages
 * @param ambassadorName - Name of the ambassador
 * @param ambassadorSlug - URL slug of the ambassador
 * @returns Breadcrumb items array
 */
export function getAmbassadorBreadcrumbs(ambassadorName: string, ambassadorSlug: string): BreadcrumbItem[] {
  return [
    { name: 'Home', url: BASE_URL },
    { name: 'Student Ambassadors', url: `${BASE_URL}/ambassadors` },
    { name: ambassadorName, url: `${BASE_URL}/ambassadors/${ambassadorSlug}` }
  ];
}
