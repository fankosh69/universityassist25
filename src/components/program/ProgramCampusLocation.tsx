import { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Building2, Users, Navigation as NavigationIcon } from 'lucide-react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { supabase } from '@/integrations/supabase/client';

interface Campus {
  id: string;
  name: string | null;
  city: string | null;
  lat: number | null;
  lng: number | null;
  is_main_campus: boolean;
  facilities: string[] | null;
  student_count: number | null;
}

interface ProgramCampusLocationProps {
  campuses: Campus[];
}

export function ProgramCampusLocation({ campuses }: ProgramCampusLocationProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [mapboxToken, setMapboxToken] = useState<string | null>(null);
  const [isLoadingToken, setIsLoadingToken] = useState(true);

  // Get primary campus (main campus or first one)
  const primaryCampus = campuses.find(c => c.is_main_campus) || campuses[0];

  useEffect(() => {
    async function fetchMapboxToken() {
      try {
        const { data, error } = await supabase.functions.invoke('get-mapbox-token');
        if (error) throw error;
        if (data?.token) {
          setMapboxToken(data.token);
        }
      } catch (error) {
        console.error('Error fetching Mapbox token:', error);
      } finally {
        setIsLoadingToken(false);
      }
    }
    fetchMapboxToken();
  }, []);

  useEffect(() => {
    if (!mapContainer.current || !mapboxToken || !primaryCampus?.lat || !primaryCampus?.lng) return;
    if (map.current) return; // Initialize map only once

    mapboxgl.accessToken = mapboxToken;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/light-v11',
      center: [primaryCampus.lng, primaryCampus.lat],
      zoom: 13,
      interactive: false,
      attributionControl: false,
    });

    // Add marker
    new mapboxgl.Marker({ color: '#2E57F6' })
      .setLngLat([primaryCampus.lng, primaryCampus.lat])
      .addTo(map.current);

    return () => {
      map.current?.remove();
    };
  }, [mapboxToken, primaryCampus]);

  if (!campuses || campuses.length === 0) {
    return null;
  }

  const facilityIcons = {
    'Library': '📚',
    'Sports': '⚽',
    'Lab': '🔬',
    'Cafeteria': '🍽️',
    'Dormitory': '🏢',
    'default': '🏛️'
  };

  const getFacilityIcon = (facility: string) => {
    const key = Object.keys(facilityIcons).find(k => 
      facility.toLowerCase().includes(k.toLowerCase())
    );
    return key ? facilityIcons[key as keyof typeof facilityIcons] : facilityIcons.default;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <MapPin className="h-4 w-4" />
          Campus Location
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Campus Name */}
        {primaryCampus.name && (
          <div>
            <p className="text-sm font-semibold">{primaryCampus.name}</p>
            {primaryCampus.is_main_campus && (
              <Badge variant="secondary" className="mt-1 text-xs">Main Campus</Badge>
            )}
          </div>
        )}

        {/* City */}
        {primaryCampus.city && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4" />
            <span>{primaryCampus.city}, Germany</span>
          </div>
        )}

        {/* Mini Map */}
        {primaryCampus.lat && primaryCampus.lng && (
          <div className="relative">
            {isLoadingToken && (
              <div className="h-32 rounded-md bg-muted animate-pulse flex items-center justify-center">
                <p className="text-xs text-muted-foreground">Loading map...</p>
              </div>
            )}
            {!isLoadingToken && mapboxToken && (
              <div 
                ref={mapContainer} 
                className="h-32 rounded-md border border-border overflow-hidden"
              />
            )}
            {!isLoadingToken && !mapboxToken && (
              <div className="h-32 rounded-md bg-muted flex items-center justify-center">
                <p className="text-xs text-muted-foreground">Map unavailable</p>
              </div>
            )}
            
            {/* View on Google Maps link */}
            {primaryCampus.lat && primaryCampus.lng && (
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${primaryCampus.lat},${primaryCampus.lng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="absolute bottom-2 right-2 bg-background/90 backdrop-blur-sm px-2 py-1 rounded-md text-xs hover:bg-background transition-colors flex items-center gap-1 shadow-sm"
              >
                <NavigationIcon className="h-3 w-3" />
                View on Map
              </a>
            )}
          </div>
        )}

        {/* Student Count */}
        {primaryCampus.student_count && (
          <div className="flex items-center gap-2 text-sm">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">
              {primaryCampus.student_count.toLocaleString()} students
            </span>
          </div>
        )}

        {/* Facilities */}
        {primaryCampus.facilities && primaryCampus.facilities.length > 0 && (
          <div>
            <div className="flex items-center gap-2 text-sm font-semibold mb-2">
              <Building2 className="h-4 w-4" />
              <span>Campus Facilities</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {primaryCampus.facilities.slice(0, 4).map((facility, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  <span className="mr-1">{getFacilityIcon(facility)}</span>
                  {facility}
                </Badge>
              ))}
              {primaryCampus.facilities.length > 4 && (
                <Badge variant="outline" className="text-xs">
                  +{primaryCampus.facilities.length - 4} more
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Multiple Campuses Indicator */}
        {campuses.length > 1 && (
          <div className="pt-2 border-t">
            <p className="text-xs text-muted-foreground">
              Program offered at {campuses.length} campus locations
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
