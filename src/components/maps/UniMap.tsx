import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { getMapboxToken, getDefaultMapConfig, createMarkerPopupHTML, type MapMarker } from '@/lib/mapbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { MapPin, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface UniMapProps {
  markers: MapMarker[];
  center?: [number, number];
  zoom?: number;
  height?: string;
  className?: string;
  onMarkerClick?: (marker: MapMarker) => void;
}

export default function UniMap({ 
  markers, 
  center, 
  zoom = 6,
  height = '400px',
  className = '',
  onMarkerClick 
}: UniMapProps) {
  const { t } = useTranslation();
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);

  useEffect(() => {
    async function initializeMap() {
      const token = await getMapboxToken();
      
      if (!token) {
        setError(t('map.token_missing'));
        return;
      }

      if (!mapContainer.current || map.current) return;

      try {
        mapboxgl.accessToken = token;
        const config = await getDefaultMapConfig();
      
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: config.style,
        center: center || config.center,
        zoom: zoom,
        attributionControl: false
      });

      map.current.addControl(
        new mapboxgl.NavigationControl({
          visualizePitch: true
        }),
        'top-right'
      );

      map.current.on('load', () => {
        setIsLoaded(true);
      });

      map.current.on('error', (e) => {
        console.error('Mapbox error:', e);
        setError(t('map.load_error'));
      });

      } catch (err) {
        console.error('Map initialization error:', err);
        setError(t('map.init_error'));
      }
    }

    initializeMap();

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [center, zoom, t]);

  useEffect(() => {
    if (!map.current || !isLoaded || !markers.length) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    // Add new markers
    markers.forEach(markerData => {
      const el = document.createElement('div');
      el.className = 'map-marker';
      el.innerHTML = `
        <div class="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center shadow-lg border-2 border-white cursor-pointer transition-transform hover:scale-110">
          <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd" />
          </svg>
        </div>
      `;

      const marker = new mapboxgl.Marker(el)
        .setLngLat(markerData.coordinates)
        .addTo(map.current!);

      // Add popup
      const popup = new mapboxgl.Popup({
        offset: 25,
        className: 'map-popup'
      }).setHTML(createMarkerPopupHTML(markerData));

      marker.setPopup(popup);

      // Add click handler
      el.addEventListener('click', () => {
        onMarkerClick?.(markerData);
      });

      markersRef.current.push(marker);
    });

    // Fit map to markers if multiple markers
    if (markers.length > 1) {
      const bounds = new mapboxgl.LngLatBounds();
      markers.forEach(marker => bounds.extend(marker.coordinates));
      map.current.fitBounds(bounds, { padding: 50 });
    }
  }, [markers, isLoaded, onMarkerClick]);

  if (error) {
    return (
      <Alert className={className}>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          {error}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className={className}>
      <div 
        ref={mapContainer} 
        className="w-full rounded-lg shadow-md"
        style={{ height }}
      />
      
      {!isLoaded && (
        <div className="absolute inset-0 bg-muted rounded-lg flex items-center justify-center">
          <div className="flex items-center gap-2 text-muted-foreground">
            <MapPin className="h-5 w-5 animate-pulse" />
            <span>{t('map.loading')}</span>
          </div>
        </div>
      )}

      {markers.length === 0 && isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-muted-foreground">
            <MapPin className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>{t('map.no_locations')}</p>
          </div>
        </div>
      )}
    </div>
  );
}