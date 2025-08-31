import React, { useEffect, useRef, useState } from 'react';
import { isLeafletSupported, generateStaticMapUrl, getMapProviderLinks } from '@/lib/mapSupport';

interface MapMarker {
  id: string;
  name: string;
  lat: number;
  lng: number;
  description?: string;
}

interface UniversalMapProps {
  latitude?: number;
  longitude?: number;
  zoom?: number;
  locationName: string;
  height?: number;
  width?: number;
  className?: string;
  markers?: MapMarker[];
}

const UniversalMap: React.FC<UniversalMapProps> = ({
  latitude,
  longitude,
  zoom = 13,
  locationName,
  height = 400,
  width = 1200,
  className = "",
  markers = []
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [mapError, setMapError] = useState<string | null>(null);
  const [mapType, setMapType] = useState<'interactive' | 'static' | 'fallback'>('interactive');
  const [isLoaded, setIsLoaded] = useState(false);

  // Determine center coordinates
  const centerLat = latitude || (markers.length > 0 ? markers[0].lat : 51.1657);
  const centerLng = longitude || (markers.length > 0 ? markers[0].lng : 10.4515);

  useEffect(() => {
    initializeMap();
  }, [centerLat, centerLng, markers]);

  const initializeMap = async () => {
    if (typeof window === 'undefined' || !mapRef.current) {
      console.log('UniversalMap: Skipping map init - window or mapRef not available');
      return;
    }

    console.log('UniversalMap: Starting map initialization', {
      centerLat,
      centerLng,
      markers: markers.length,
      locationName
    });

    try {
      // Ensure Leaflet CSS is loaded first and wait for it
      await new Promise((resolve) => {
        if (document.querySelector('link[href*="leaflet"]')) {
          resolve(true);
          return;
        }
        
        console.log('UniversalMap: Loading Leaflet CSS');
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        link.onload = () => {
          console.log('UniversalMap: Leaflet CSS loaded');
          resolve(true);
        };
        link.onerror = () => {
          console.error('UniversalMap: Failed to load Leaflet CSS');
          resolve(false);
        };
        document.head.appendChild(link);
      });

      console.log('UniversalMap: Importing Leaflet module');
      
      // Try to import Leaflet with better error handling
      const leafletModule = await import('leaflet');
      console.log('UniversalMap: Leaflet module imported:', !!leafletModule);
      
      const leaflet = leafletModule.default || leafletModule;
      
      if (!leaflet || typeof leaflet.map !== 'function') {
        throw new Error('Leaflet library not properly loaded - map function not available');
      }

      console.log('UniversalMap: Leaflet loaded successfully, version:', leaflet.version || 'unknown');

      // Configure default markers
      if (leaflet.Icon && leaflet.Icon.Default) {
        try {
          delete (leaflet.Icon.Default.prototype as any)._getIconUrl;
          leaflet.Icon.Default.mergeOptions({
            iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
            iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
            shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
          });
          console.log('UniversalMap: Marker icons configured');
        } catch (iconError) {
          console.warn('UniversalMap: Failed to configure marker icons:', iconError);
        }
      }

      console.log('UniversalMap: Creating map instance on container:', mapRef.current);
      
      // Validate coordinates
      if (!Number.isFinite(centerLat) || !Number.isFinite(centerLng)) {
        throw new Error(`Invalid coordinates: lat=${centerLat}, lng=${centerLng}`);
      }
      
      // Initialize Leaflet map
      const map = leaflet.map(mapRef.current, {
        center: [centerLat, centerLng],
        zoom: zoom,
        zoomControl: true
      });
      
      console.log('UniversalMap: Map instance created, adding tile layer');
      
      // Add tile layer with error handling
      const tileLayer = leaflet.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19
      });
      
      tileLayer.on('tileerror', (e: any) => {
        console.warn('UniversalMap: Tile loading error:', e);
      });
      
      tileLayer.addTo(map);
      
      console.log('UniversalMap: Adding markers', { markerCount: markers.length });
      
      // Add markers for universities or single location
      if (markers.length > 0) {
        const addedMarkers: any[] = [];
        
        markers.forEach((marker, index) => {
          try {
            if (!Number.isFinite(marker.lat) || !Number.isFinite(marker.lng)) {
              console.warn(`UniversalMap: Invalid marker coordinates for ${marker.name}:`, marker.lat, marker.lng);
              return;
            }
            
            console.log(`UniversalMap: Adding marker ${index + 1}:`, marker.name, marker.lat, marker.lng);
            
            const universitySlug = marker.id.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
            
            const leafletMarker = leaflet.marker([marker.lat, marker.lng])
              .addTo(map);
            
            // Create hover popup with clickable link
            const popupContent = `<a href="/universities/${universitySlug}" class="underline hover:text-primary">${marker.name}</a>`;
            const popup = leaflet.popup({ 
              closeButton: false, 
              closeOnClick: false, 
              offset: [0, -8] 
            }).setContent(popupContent);
            
            // Add hover events
            leafletMarker.on('mouseover', function(e) {
              popup.setLatLng(e.latlng).openOn(map);
            });
            
            leafletMarker.on('mouseout', function() {
              map.closePopup(popup);
            });
            
            // Also keep click popup for mobile
            leafletMarker.bindPopup(`<b>${marker.name}</b>${marker.description ? `<br/>${marker.description}` : ''}`);
            
            addedMarkers.push(leafletMarker);
          } catch (markerError) {
            console.error(`UniversalMap: Failed to add marker ${marker.name}:`, markerError);
          }
        });

        // Fit map to show all markers if multiple
        if (addedMarkers.length > 1) {
          try {
            console.log('UniversalMap: Fitting bounds for multiple markers');
            const group = new leaflet.FeatureGroup(addedMarkers);
            map.fitBounds(group.getBounds().pad(0.1));
          } catch (boundsError) {
            console.error('UniversalMap: Failed to fit bounds:', boundsError);
          }
        }
      } else if (latitude && longitude) {
        try {
          console.log('UniversalMap: Adding single location marker');
          leaflet.marker([centerLat, centerLng])
            .addTo(map)
            .bindPopup(locationName)
            .openPopup();
        } catch (singleMarkerError) {
          console.error('UniversalMap: Failed to add single marker:', singleMarkerError);
        }
      }
      
      console.log('UniversalMap: Map initialization completed successfully');
      setMapType('interactive');
      setIsLoaded(true);
      
    } catch (error) {
      console.error('UniversalMap: Map initialization failed:', error);
      setMapType('fallback');
      setMapError(`Map initialization failed: ${(error as Error).message}`);
    }
  };

  const mapLinks = getMapProviderLinks(centerLat, centerLng, locationName);

  if (mapType === 'static') {
    return (
      <div className={`w-full ${className}`} style={{ height: `${height}px` }}>
        <img 
          src={generateStaticMapUrl(centerLat, centerLng, zoom, width, height)} 
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