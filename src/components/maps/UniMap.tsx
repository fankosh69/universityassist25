import { GoogleMap, Marker, MarkerClusterer } from '@react-google-maps/api';
import { useGoogleMaps } from '../../lib/googleMaps';
import { useNavigate } from 'react-router-dom';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { MapPin, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const containerStyle = { width: '100%', height: '420px' };
const centerDE = { lat: 51.1657, lng: 10.4515 }; // Germany center

export type MapFeature = {
  id: string;
  name: string;
  slug: string;
  lat: number;
  lng: number;
  kind: 'city' | 'university';
  data?: any;
};

interface UniMapProps {
  features: MapFeature[];
  center?: { lat: number; lng: number };
  zoom?: number;
  height?: string;
  className?: string;
  onMarkerClick?: (feature: MapFeature) => void;
}

export default function UniMap({ 
  features, 
  center = centerDE, 
  zoom = 6,
  height = '400px',
  className = '',
  onMarkerClick 
}: UniMapProps) {
  const { t } = useTranslation();
  const { isLoaded, loadError } = useGoogleMaps();
  const navigate = useNavigate();

  const handleMarkerClick = (feature: MapFeature) => {
    onMarkerClick?.(feature);
    navigate(feature.kind === 'city' ? `/cities/${feature.slug}` : `/universities/${feature.slug}`);
  };

  if (loadError) {
    return (
      <Alert className={className}>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          {t('map.load_error')}
        </AlertDescription>
      </Alert>
    );
  }

  if (!isLoaded) {
    return (
      <div className={`${className} bg-muted rounded-lg flex items-center justify-center`} style={{ height }}>
        <div className="flex items-center gap-2 text-muted-foreground">
          <MapPin className="h-5 w-5 animate-pulse" />
          <span>{t('map.loading')}</span>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="w-full rounded-lg shadow-md overflow-hidden" style={{ height }}>
        <GoogleMap
          mapContainerStyle={{ width: '100%', height: '100%' }}
          center={center}
          zoom={zoom}
          options={{ 
            gestureHandling: 'greedy',
            disableDefaultUI: false,
            zoomControl: true,
            streetViewControl: false,
            mapTypeControl: false,
            fullscreenControl: false
          }}
        >
          <MarkerClusterer>
            {(clusterer) => (
              <>
                {features.map((feature) => (
                  <Marker
                    key={feature.id}
                    position={{ lat: feature.lat, lng: feature.lng }}
                    title={feature.name}
                    clusterer={clusterer}
                    onClick={() => handleMarkerClick(feature)}
                  />
                ))}
              </>
            )}
          </MarkerClusterer>
        </GoogleMap>
      </div>
      
      {features.length === 0 && (
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