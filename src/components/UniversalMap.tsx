import React, { useEffect, useRef, useState } from 'react';
import { isLeafletSupported, generateStaticMapUrl, getMapProviderLinks } from '@/lib/mapSupport';

interface UniversalMapProps {
  latitude: number;
  longitude: number;
  zoom?: number;
  locationName: string;
  height?: number;
  width?: number;
  className?: string;
}

const UniversalMap: React.FC<UniversalMapProps> = ({
  latitude,
  longitude,
  zoom = 13,
  locationName,
  height = 400,
  width = 1200,
  className = ""
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [mapError, setMapError] = useState<string | null>(null);
  const [mapType, setMapType] = useState<'interactive' | 'static' | 'fallback'>('interactive');
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    initializeMap();
  }, [latitude, longitude]);

  const initializeMap = async () => {
    if (typeof window === 'undefined' || !mapRef.current) return;

    // Load Leaflet dynamically
    try {
      // Load Leaflet CSS and JS
      if (!document.querySelector('link[href*="leaflet"]')) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(link);
      }

      const L = await import('leaflet');
      const leaflet = L.default;

      // Fix default markers
      delete (leaflet.Icon.Default.prototype as any)._getIconUrl;
      leaflet.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
      });

      // Initialize Leaflet map
      const map = leaflet.map(mapRef.current).setView([latitude, longitude], zoom);
      
      leaflet.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(map);
      
      leaflet.marker([latitude, longitude])
        .addTo(map)
        .bindPopup(locationName)
        .openPopup();
      
      setMapType('interactive');
      setIsLoaded(true);
    } catch (error) {
      console.error('Leaflet map failed:', error);
      setMapType('static');
      setMapError('Interactive map not available');
    }
  };

  const mapLinks = getMapProviderLinks(latitude, longitude, locationName);

  if (mapType === 'static') {
    return (
      <div className={`w-full ${className}`} style={{ height: `${height}px` }}>
        <img 
          src={generateStaticMapUrl(latitude, longitude, zoom, width, height)} 
          alt={`Map of ${locationName}`}
          className="w-full h-full object-cover rounded-xl border"
          onError={() => setMapType('fallback')}
        />
        <div className="mt-2 text-xs text-muted-foreground">
          Static map view. <a href={mapLinks.google} target="_blank" rel="noopener noreferrer" className="underline">Open in Google Maps</a>
        </div>
      </div>
    );
  }

  if (mapType === 'fallback') {
    return (
      <div className={`w-full ${className} flex flex-col items-center justify-center border rounded-xl bg-muted`} style={{ height: `${height}px` }}>
        <div className="text-center p-6">
          <h3 className="text-lg font-semibold text-foreground mb-2">Interactive Map Currently Unavailable</h3>
          <p className="text-muted-foreground mb-4">View {locationName} on external map services:</p>
          <div className="flex flex-wrap gap-2 justify-center">
            <a 
              href={mapLinks.google} 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center px-3 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              Google Maps
            </a>
            <a 
              href={mapLinks.openStreetMap} 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center px-3 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/90 transition-colors"
            >
              OpenStreetMap
            </a>
            <a 
              href={mapLinks.bing} 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center px-3 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/90 transition-colors"
            >
              Bing Maps
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`w-full ${className}`} style={{ height: `${height}px` }}>
      <div ref={mapRef} className="w-full h-full rounded-xl border" />
      {mapError && (
        <div className="mt-2 text-xs text-muted-foreground">
          {mapError}
        </div>
      )}
    </div>
  );
};

export default UniversalMap;