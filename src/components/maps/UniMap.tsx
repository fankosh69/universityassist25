import { useEffect, useRef, useState } from 'react';
import UniversalMap from '@/components/UniversalMap';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { MapPin, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface MapMarker {
  id: string;
  name: string;
  coordinates: [number, number];
  type: 'university' | 'city';
  data?: any;
}

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
  const [error, setError] = useState<string | null>(null);

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

  if (markers.length === 0) {
    return (
      <div className={className} style={{ height }}>
        <div className="flex items-center justify-center border rounded-xl bg-muted h-full">
          <div className="text-center text-muted-foreground">
            <MapPin className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No locations to display</p>
          </div>
        </div>
      </div>
    );
  }

  // Use the first marker's coordinates as center if no center provided
  const mapCenter = center || (markers.length > 0 ? markers[0].coordinates : [10.4515, 51.1657]);
  const lat = mapCenter[1];
  const lng = mapCenter[0];

  return (
    <div className={className} style={{ height }}>
      <UniversalMap
        latitude={lat}
        longitude={lng}
        locationName={markers.length === 1 ? markers[0].name : 'Multiple Locations'}
        zoom={zoom}
        height={parseInt(height.replace('px', '')) || 400}
      />
    </div>
  );
}