import { useEffect } from "react";

interface SEOHeadProps {
  title: string;
  description: string;
  keywords?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
}

const SEOHead = ({ 
  title, 
  description, 
  keywords,
  ogTitle,
  ogDescription,
  ogImage 
}: SEOHeadProps) => {
  useEffect(() => {
    // Set page title
    document.title = title;

    // Set meta description
    const setMeta = (name: string, content: string) => {
      let meta = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement;
      if (!meta) {
        meta = document.createElement('meta');
        meta.name = name;
        document.head.appendChild(meta);
      }
      meta.content = content;
    };

    const setProperty = (property: string, content: string) => {
      let meta = document.querySelector(`meta[property="${property}"]`) as HTMLMetaElement;
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute('property', property);
        document.head.appendChild(meta);
      }
      meta.content = content;
    };

    // Set basic meta tags
    setMeta("description", description);
    if (keywords) setMeta("keywords", keywords);
    setMeta("robots", "index, follow");
    setMeta("viewport", "width=device-width, initial-scale=1.0");

    // Set Open Graph tags
    setProperty("og:title", ogTitle || title);
    setProperty("og:description", ogDescription || description);
    setProperty("og:type", "website");
    setProperty("og:url", window.location.href);
    if (ogImage) setProperty("og:image", ogImage);

    // Set Twitter Card tags
    setMeta("twitter:card", "summary_large_image");
    setMeta("twitter:title", ogTitle || title);
    setMeta("twitter:description", ogDescription || description);
    if (ogImage) setMeta("twitter:image", ogImage);

    // Set canonical URL
    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }
    canonical.href = window.location.href;
  }, [title, description, keywords, ogTitle, ogDescription, ogImage]);

  return null;
};

export default SEOHead;