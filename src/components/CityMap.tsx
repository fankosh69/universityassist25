import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { supabase } from '@/integrations/supabase/client';

interface University {
  id: string;
  name: string;
  lat?: number;
  lng?: number;
  slug: string;
}

interface CityMapProps {
  city: { 
    name: string; 
    slug: string; 
    lat?: number | null; 
    lng?: number | null;
  };
  className?: string;
}

export default function CityMap({ city, className = '' }: CityMapProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const [mapError, setMapError] = useState<string | null>(null);
  const [universities, setUniversities] = useState<University[]>([]);
  const [mapboxToken, setMapboxToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch Mapbox token
  useEffect(() => {
    async function fetchMapboxToken() {
      try {
        console.log('Fetching Mapbox token...');
        const { data, error } = await supabase.functions.invoke('get-mapbox-token');
        
        if (error) {
          console.error('Error fetching Mapbox token:', error);
          setMapError('Failed to load map token');
          setLoading(false);
          return;
        }
        
        if (data?.token) {
          console.log('Mapbox token received successfully');
          setMapboxToken(data.token);
          mapboxgl.accessToken = data.token;
        } else {
          console.error('No token in response:', data);
          setMapError('Mapbox token not available');
        }
      } catch (error) {
        console.error('Error calling get-mapbox-token function:', error);
        setMapError('Failed to configure map');
      } finally {
        setLoading(false);
      }
    }

    fetchMapboxToken();
  }, []);

  // Fetch universities for this city
  useEffect(() => {
    async function fetchUniversities() {
      try {
        const { data: cityInfo } = await supabase
          .from('cities')
          .select('id')
          .eq('slug', city.slug)
          .maybeSingle();

        if (cityInfo) {
          const { data: unis } = await supabase
            .from('universities')
            .select('id, name, lat, lng, slug')
            .eq('city_id', cityInfo.id);

          setUniversities(unis || []);
        }
      } catch (error) {
        console.error('Error fetching universities:', error);
      }
    }

    fetchUniversities();
  }, [city.slug]);

  useEffect(() => {
    if (!ref.current || mapRef.current || !mapboxToken) return;

    console.log('Initializing map with token:', mapboxToken ? 'token available' : 'no token');

    try {
      const hasCoords = typeof city.lat === 'number' && typeof city.lng === 'number';
      const center: [number, number] = hasCoords ? [city.lng!, city.lat!] : [10.4515, 51.1657];

      console.log('Creating map with center:', center, 'hasCoords:', hasCoords);

      const map = new mapboxgl.Map({
        container: ref.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        center,
        zoom: hasCoords ? 11 : 5
      });

      mapRef.current = map;

      map.addControl(new mapboxgl.NavigationControl(), 'top-right');

      map.on('load', () => {
        console.log('Map loaded successfully');
        
        // Add city marker if coordinates exist
        if (hasCoords) {
          console.log('Adding city marker at:', [city.lng!, city.lat!]);
          const cityMarker = new mapboxgl.Marker({ color: '#2E57F6' })
            .setLngLat([city.lng!, city.lat!])
            .setPopup(
              new mapboxgl.Popup({ offset: 25 })
                .setHTML(`<h3>${city.name}</h3><p>City Center</p>`)
            )
            .addTo(map);
        }

        // Add university markers
        console.log('Adding university markers:', universities.length);
        universities.forEach(uni => {
          if (uni.lat && uni.lng) {
            new mapboxgl.Marker({ color: '#5DC6C5' })
              .setLngLat([uni.lng, uni.lat])
              .setPopup(
                new mapboxgl.Popup({ offset: 25 })
                  .setHTML(`
                    <h3>${uni.name}</h3>
                    <p><a href="/universities/${uni.slug}" target="_blank" rel="noopener noreferrer">View Details</a></p>
                  `)
              )
              .addTo(map);
          }
        });

        // Fit map to markers if we have coordinates
        if (hasCoords || universities.some(u => u.lat && u.lng)) {
          const bounds = new mapboxgl.LngLatBounds();
          
          if (hasCoords) {
            bounds.extend([city.lng!, city.lat!]);
          }
          
          universities.forEach(uni => {
            if (uni.lat && uni.lng) {
              bounds.extend([uni.lng, uni.lat]);
            }
          });

          if (!bounds.isEmpty()) {
            map.fitBounds(bounds, { padding: 50, maxZoom: 14 });
          }
        }
      });

      map.on('error', (e) => {
        console.error('Map error:', e);
        setMapError('Failed to load map');
      });

    } catch (error) {
      console.error('Error initializing map:', error);
      setMapError('Failed to initialize map');
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [city.lat, city.lng, universities, mapboxToken]);

  if (loading) {
    return (
      <div className={`w-full rounded-xl border border-border bg-muted/50 flex items-center justify-center ${className}`} style={{ height: 380 }}>
        <div className="text-center p-6">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-muted-foreground">Loading map...</p>
        </div>
      </div>
    );
  }

  if (mapError) {
    return (
      <div className={`w-full rounded-xl border border-border bg-muted/50 flex items-center justify-center ${className}`} style={{ height: 380 }}>
        <div className="text-center p-6">
          <p className="text-muted-foreground mb-2">Map unavailable</p>
          <p className="text-sm text-muted-foreground">{mapError}</p>
          {universities.length > 0 && (
            <div className="mt-4">
              <h4 className="font-semibold mb-2">Universities in {city.name}:</h4>
              <ul className="text-sm space-y-1">
                {universities.map(uni => (
                  <li key={uni.id}>
                    <a href={`/universities/${uni.slug}`} className="text-primary hover:underline">
                      {uni.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`w-full ${className}`} style={{ height: 380 }}>
      <div ref={ref} className="w-full h-full rounded-xl overflow-hidden shadow border border-border" />
      {(!city.lat || !city.lng) && (
        <p className="text-sm text-muted-foreground mt-2">
          Map will appear once coordinates are confirmed for {city.name}.
        </p>
      )}
    </div>
  );
}