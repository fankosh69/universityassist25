import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapPin, Navigation } from 'lucide-react';

interface University {
  id: string;
  name: string;
  lat: number;
  lng: number;
  slug: string;
}

interface CityMapProps {
  cityId: string;
  cityName: string;
  cityLat: number;
  cityLng: number;
  className?: string;
}

const CityMap: React.FC<CityMapProps> = ({ 
  cityId, 
  cityName, 
  cityLat, 
  cityLng, 
  className = "" 
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [universities, setUniversities] = useState<University[]>([]);
  const [mapboxToken, setMapboxToken] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const fetchMapboxToken = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('get-mapbox-token');
        if (error) throw error;
        setMapboxToken(data.token);
      } catch (error) {
        console.error('Error fetching Mapbox token:', error);
        setError('Failed to load map configuration');
      }
    };

    fetchMapboxToken();
  }, []);

  useEffect(() => {
    const fetchUniversities = async () => {
      try {
        const { data, error } = await supabase
          .from('universities')
          .select('id, name, lat, lng, slug')
          .eq('city_id', cityId)
          .not('lat', 'is', null)
          .not('lng', 'is', null);

        if (error) throw error;
        setUniversities(data || []);
      } catch (error) {
        console.error('Error fetching universities:', error);
      } finally {
        setLoading(false);
      }
    };

    if (cityId) {
      fetchUniversities();
    }
  }, [cityId]);

  useEffect(() => {
    if (!mapContainer.current || !mapboxToken) return;

    mapboxgl.accessToken = mapboxToken;
    
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/light-v11',
      center: [cityLng, cityLat],
      zoom: 11,
      pitch: 45,
    });

    // Add navigation controls
    map.current.addControl(
      new mapboxgl.NavigationControl({
        visualizePitch: true,
      }),
      'top-right'
    );

    // Add city marker
    new mapboxgl.Marker({
      color: '#2E57F6',
      scale: 1.2
    })
      .setLngLat([cityLng, cityLat])
      .setPopup(
        new mapboxgl.Popup().setHTML(`
          <div class="p-2">
            <h3 class="font-semibold text-primary">${cityName}</h3>
            <p class="text-sm text-muted-foreground">City Center</p>
          </div>
        `)
      )
      .addTo(map.current);

    // Add university markers
    universities.forEach((university) => {
      if (university.lat && university.lng) {
        new mapboxgl.Marker({
          color: '#5DC6C5',
          scale: 0.8
        })
          .setLngLat([university.lng, university.lat])
          .setPopup(
            new mapboxgl.Popup().setHTML(`
              <div class="p-3 max-w-xs">
                <h4 class="font-semibold text-secondary mb-2">${university.name}</h4>
                <a href="/universities/${university.slug}" 
                   class="inline-flex items-center text-sm text-primary hover:underline">
                  View University
                  <svg class="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              </div>
            `)
          )
          .addTo(map.current!);
      }
    });

    // Fit map to show all markers
    if (universities.length > 0) {
      const bounds = new mapboxgl.LngLatBounds();
      bounds.extend([cityLng, cityLat]);
      universities.forEach(uni => {
        if (uni.lat && uni.lng) {
          bounds.extend([uni.lng, uni.lat]);
        }
      });
      map.current.fitBounds(bounds, { padding: 50 });
    }

    return () => {
      map.current?.remove();
    };
  }, [mapboxToken, universities, cityLat, cityLng, cityName]);

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="p-6 text-center">
          <MapPin className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">Map Unavailable</h3>
          <p className="text-muted-foreground mb-4">{error}</p>
          <div className="space-y-2">
            <p className="text-sm font-medium">Universities in {cityName}:</p>
            <div className="space-y-1">
              {universities.map((uni) => (
                <Button
                  key={uni.id}
                  variant="outline"
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => window.open(`/universities/${uni.slug}`, '_blank')}
                >
                  <Navigation className="h-4 w-4 mr-2" />
                  {uni.name}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="p-6 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading map...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardContent className="p-0">
        <div className="relative">
          <div 
            ref={mapContainer} 
            className="w-full h-96 rounded-lg"
            style={{ minHeight: '400px' }}
          />
          <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-soft">
            <div className="flex items-center gap-2 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-primary rounded-full"></div>
                <span>City Center</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-secondary rounded-full"></div>
                <span>Universities</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CityMap;