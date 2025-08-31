import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { supabase } from '@/integrations/supabase/client';

// Set the access token from environment variable
const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || 
                    (import.meta as any)?.env?.VITE_MAPBOX_TOKEN ||
                    (process as any)?.env?.NEXT_PUBLIC_MAPBOX_TOKEN ||
                    (process as any)?.env?.REACT_APP_MAPBOX_TOKEN;

if (MAPBOX_TOKEN) {
  mapboxgl.accessToken = MAPBOX_TOKEN;
}

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
    if (!ref.current || mapRef.current) return;

    if (!MAPBOX_TOKEN) {
      setMapError('Mapbox token not configured');
      return;
    }

    try {
      const hasCoords = typeof city.lat === 'number' && typeof city.lng === 'number';
      const center: [number, number] = hasCoords ? [city.lng!, city.lat!] : [10.4515, 51.1657];

      const map = new mapboxgl.Map({
        container: ref.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        center,
        zoom: hasCoords ? 11 : 5
      });

      mapRef.current = map;

      map.addControl(new mapboxgl.NavigationControl(), 'top-right');

      map.on('load', () => {
        // Add city marker if coordinates exist
        if (hasCoords) {
          const cityMarker = new mapboxgl.Marker({ color: '#2E57F6' })
            .setLngLat([city.lng!, city.lat!])
            .setPopup(
              new mapboxgl.Popup({ offset: 25 })
                .setHTML(`<h3>${city.name}</h3><p>City Center</p>`)
            )
            .addTo(map);
        }

        // Add university markers
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
  }, [city.lat, city.lng, universities]);

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