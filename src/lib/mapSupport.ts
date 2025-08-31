// Check for WebGL support
export function isWebGLSupported(): boolean {
  try {
    const canvas = document.createElement('canvas');
    return !!window.WebGLRenderingContext && 
      !!(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'));
  } catch (e) {
    return false;
  }
}

// Check if Leaflet is supported
export function isLeafletSupported(): boolean {
  return typeof window !== 'undefined' && typeof (window as any).L !== 'undefined';
}

// Generate static map image URL as fallback using OpenStreetMap
export function generateStaticMapUrl(lat: number, lng: number, zoom: number, width: number = 1200, height: number = 400): string {
  // Using a simple static image from OpenStreetMap-based service
  return `https://staticmap.openstreetmap.de/staticmap.php?center=${lat},${lng}&zoom=${zoom}&size=${width}x${height}&maptype=mapnik&markers=${lat},${lng}`;
}

// Get all map provider links for a location
export function getMapProviderLinks(lat: number, lng: number, locationName: string) {
  return {
    google: `https://www.google.com/maps/search/?api=1&query=${lat},${lng}&query_place_id=${encodeURIComponent(locationName)}`,
    openStreetMap: `https://www.openstreetmap.org/search?query=${encodeURIComponent(locationName)}#map=13/${lat}/${lng}`,
    bing: `https://www.bing.com/maps?q=${encodeURIComponent(locationName)}`
  };
}