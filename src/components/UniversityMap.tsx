/**
 * Interactive University Map Component
 * Shows German cities and universities on a Mapbox map
 */

import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapPin, University, Users, Calendar } from 'lucide-react';

interface UniversityMapProps {
  focusCity?: string;
  height?: string;
  showControls?: boolean;
}

interface City {
  id: string;
  name: string;
  state: string;
  lat: number;
  lng: number;
  metadata: any;
  universityCount?: number;
}

interface University {
  id: string;
  name: string;
  city?: string;
  lat?: number;
  lng?: number;
  type?: string;
  ranking?: number;
  external_refs?: any;
  city_id?: string;
  control_type?: string;
  created_at?: string;
  logo_url?: string;
  region?: string;
  slug?: string;
  website?: string;
  keywords?: string[];
  search_doc?: any;
  fts?: unknown;
}

export function UniversityMap({ focusCity, height = 'h-96', showControls = true }: UniversityMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [mapboxToken, setMapboxToken] = useState<string>('');
  const [cities, setCities] = useState<City[]>([]);
  const [universities, setUniversities] = useState<University[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<City | University | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch Mapbox token
  useEffect(() => {
    const fetchMapboxToken = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('get-mapbox-token');
        if (error) throw error;
        setMapboxToken(data.token);
      } catch (error) {
        console.error('Error fetching Mapbox token:', error);
      }
    };
    fetchMapboxToken();
  }, []);

  // Fetch cities and universities data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch cities
        const { data: citiesData, error: citiesError } = await supabase
          .from('cities')
          .select('*')
          .eq('country_code', 'DE')
          .order('name');

        if (citiesError) throw citiesError;

        // Fetch universities
        const { data: universitiesData, error: universitiesError } = await supabase
          .from('universities')
          .select('*')
          .order('ranking', { nullsFirst: false });

        if (universitiesError) throw universitiesError;

        // Count universities per city
        const citiesWithCounts = citiesData?.map(city => {
          const universityCount = universitiesData?.filter(uni => uni.city_id === city.id).length || 0;
          return { ...city, universityCount };
        }) || [];

        setCities(citiesWithCounts);
        setUniversities(universitiesData || []);
      } catch (error) {
        console.error('Error fetching map data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || !mapboxToken || cities.length === 0) return;

    mapboxgl.accessToken = mapboxToken;

    // Initialize map
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/light-v11',
      center: [10.4515, 51.1657], // Center of Germany
      zoom: 6,
      pitch: 0,
    });

    // Add navigation controls
    if (showControls) {
      map.current.addControl(
        new mapboxgl.NavigationControl({
          visualizePitch: true,
        }),
        'top-right'
      );
    }

    map.current.on('load', () => {
      if (!map.current) return;

      // Add city markers
      cities.forEach(city => {
        if (!city.lat || !city.lng) return;

        const el = document.createElement('div');
        el.className = 'cursor-pointer';
        el.innerHTML = `
          <div class="relative">
            <div class="w-4 h-4 bg-primary rounded-full border-2 border-white shadow-lg"></div>
            <div class="absolute -top-1 -right-1 w-3 h-3 bg-accent text-xs rounded-full flex items-center justify-center text-white font-bold" style="font-size: 8px;">
              ${city.universityCount || 0}
            </div>
          </div>
        `;

        const marker = new mapboxgl.Marker(el)
          .setLngLat([city.lng, city.lat])
          .addTo(map.current!);

        el.addEventListener('click', () => {
          setSelectedLocation(city);
          map.current?.flyTo({
            center: [city.lng, city.lat],
            zoom: 10,
            duration: 1500
          });
        });

        // Add popup on hover
        const popup = new mapboxgl.Popup({
          closeButton: false,
          closeOnClick: false,
          offset: 25
        }).setHTML(`
          <div class="p-2">
            <h3 class="font-bold">${city.name}</h3>
            <p class="text-sm text-gray-600">${city.state}</p>
            <p class="text-sm text-primary">${city.universityCount} universities</p>
          </div>
        `);

        el.addEventListener('mouseenter', () => {
          popup.setLngLat([city.lng, city.lat]).addTo(map.current!);
        });

        el.addEventListener('mouseleave', () => {
          popup.remove();
        });
      });

      // Focus on specific city if provided
      if (focusCity) {
        const city = cities.find(c => c.id === focusCity || c.name.toLowerCase() === focusCity.toLowerCase());
        if (city) {
          map.current.flyTo({
            center: [city.lng, city.lat],
            zoom: 10,
            duration: 2000
          });
          setSelectedLocation(city);
        }
      }
    });

    // Cleanup
    return () => {
      map.current?.remove();
    };
  }, [mapboxToken, cities, focusCity, showControls]);

  const handleCityClick = (city: City) => {
    setSelectedLocation(city);
    if (map.current) {
      map.current.flyTo({
        center: [city.lng, city.lat],
        zoom: 10,
        duration: 1500
      });
    }
  };

  const resetView = () => {
    setSelectedLocation(null);
    if (map.current) {
      map.current.flyTo({
        center: [10.4515, 51.1657],
        zoom: 6,
        duration: 1500
      });
    }
  };

  if (loading) {
    return (
      <div className={`${height} w-full bg-muted rounded-lg flex items-center justify-center`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-sm text-muted-foreground">Loading map...</p>
        </div>
      </div>
    );
  }

  if (!mapboxToken) {
    return (
      <div className={`${height} w-full bg-muted rounded-lg flex items-center justify-center`}>
        <div className="text-center">
          <MapPin className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Map not available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className={`${height} w-full relative rounded-lg overflow-hidden border`}>
        <div ref={mapContainer} className="absolute inset-0" />
        
        {selectedLocation && (
          <Card className="absolute top-4 left-4 max-w-xs z-10 shadow-lg">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                {selectedLocation.name}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {'state' in selectedLocation ? (
                // City information
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">{selectedLocation.state}</p>
                  <div className="flex items-center gap-2 text-sm">
                    <University className="h-4 w-4 text-primary" />
                    <span>{selectedLocation.universityCount} universities</span>
                  </div>
                  {selectedLocation.metadata?.population && (
                    <div className="flex items-center gap-2 text-sm">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span>{selectedLocation.metadata.population.toLocaleString()} residents</span>
                    </div>
                  )}
                  <Button size="sm" onClick={resetView} variant="outline" className="w-full">
                    View All Cities
                  </Button>
                </div>
              ) : (
                // University information
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">{selectedLocation.type} University</p>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground">Ranking:</span>
                    <span className="font-medium">#{selectedLocation.ranking}</span>
                  </div>
                  {selectedLocation.external_refs?.founded && (
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>Founded {selectedLocation.external_refs.founded}</span>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Quick city selector */}
      {showControls && (
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={resetView}>
            All Cities
          </Button>
          {cities.slice(0, 8).map(city => (
            <Button
              key={city.id}
              size="sm"
              variant={selectedLocation?.id === city.id ? "default" : "outline"}
              onClick={() => handleCityClick(city)}
            >
              {city.name} ({city.universityCount})
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}