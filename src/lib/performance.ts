/**
 * Performance utilities for optimization
 */

// Lazy loading with intersection observer
export const lazyLoad = (target: string, callback: () => void) => {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          callback();
          observer.unobserve(entry.target);
        }
      });
    },
    { rootMargin: '50px' }
  );

  const element = document.querySelector(target);
  if (element) {
    observer.observe(element);
  }
};

// Preload critical resources
export const preloadRoute = (route: string) => {
  const link = document.createElement('link');
  link.rel = 'prefetch';
  link.href = route;
  document.head.appendChild(link);
};

// Image optimization helper
export const getOptimizedImageProps = (
  src: string,
  alt: string,
  sizes: string = '100vw',
  priority: boolean = false
) => ({
  src,
  alt,
  sizes,
  loading: priority ? 'eager' : 'lazy' as const,
  decoding: 'async' as const,
  fetchPriority: priority ? 'high' : 'low' as const,
});

// Web Vitals tracking
export const trackWebVitals = (metric: any) => {
  // Only track in production
  if (import.meta.env.PROD) {
    console.log(metric);
    // You can send this to your analytics service
  }
};

// Service Worker registration
export const registerServiceWorker = async () => {
  if ('serviceWorker' in navigator && import.meta.env.PROD) {
    try {
      await navigator.serviceWorker.register('/sw.js');
      console.log('Service Worker registered successfully');
    } catch (error) {
      console.log('Service Worker registration failed:', error);
    }
  }
};

// Memory cleanup utilities
export const cleanupResources = () => {
  // Clean up any global event listeners, intervals, etc.
  if (typeof window !== 'undefined') {
    // Example: clean up any global listeners
    const events = ['resize', 'scroll', 'orientationchange'];
    events.forEach(event => {
      window.removeEventListener(event, () => {});
    });
  }
};

// Critical resource hints
export const addResourceHints = () => {
  if (typeof document !== 'undefined') {
    // Preconnect to external domains
    const preconnects = [
      'https://fonts.googleapis.com',
      'https://fonts.gstatic.com',
    ];
    
    preconnects.forEach(href => {
      const link = document.createElement('link');
      link.rel = 'preconnect';
      link.href = href;
      link.crossOrigin = 'anonymous';
      document.head.appendChild(link);
    });
  }
};