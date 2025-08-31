import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import UniversalMap from '@/components/UniversalMap';
import LoadingSpinner from '@/components/LoadingSpinner';

type City = { name: string; slug: string; lat?: number|null; lng?: number|null; id?: string };

interface University {
  id: string;
  name: string;
  lat: number;
  lng: number;
  slug: string;
  type?: string;
}

export default function CityMap({ city, className }: { city: City; className?: string }) {
  const [universities, setUniversities] = useState<University[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (city.id || city.slug) {
      fetchUniversities();
    }
  }, [city.id, city.slug]);

  const fetchUniversities = async () => {
    try {
      setLoading(true);
      console.log('CityMap: Fetching universities for city:', city);
      
      // Fetch universities in this city
      const { data, error: fetchError } = await supabase
        .from('universities')
        .select('id, name, lat, lng, slug, type')
        .or(`city_id.eq.${city.id || ''},city.eq.${city.name}`)
        .not('lat', 'is', null)
        .not('lng', 'is', null);

      console.log('CityMap: Universities query result:', { data, error: fetchError });

      if (fetchError) {
        console.error('Error fetching universities:', fetchError);
        setError('Failed to load universities');
        return;
      }

      console.log('CityMap: Found universities:', data?.length || 0);
      setUniversities(data || []);
    } catch (err) {
      console.error('Error in fetchUniversities:', err);
      setError('Failed to load university data');
    } finally {
      setLoading(false);
    }
  };

  const hasCoordinates = typeof city.lat === "number" && typeof city.lng === "number";

  if (loading) {
    return (
      <div className={`w-full ${className || ''}`}>
        <div className="flex items-center justify-center border rounded-xl bg-muted" style={{ height: 380 }}>
          <LoadingSpinner />
          <span className="ml-2 text-muted-foreground">Loading universities...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`w-full ${className || ''}`}>
        <div className="flex items-center justify-center border rounded-xl bg-destructive/10 p-4" style={{ height: 380 }}>
          <p className="text-destructive">{error}</p>
        </div>
      </div>
    );
  }

  if (!hasCoordinates && universities.length === 0) {
    return (
      <div className={`w-full ${className || ''}`}>
        <div className="flex flex-col items-center justify-center border rounded-xl bg-muted p-8" style={{ height: 380 }}>
          <h3 className="text-lg font-semibold text-foreground mb-2">Map Location Pending</h3>
          <p className="text-muted-foreground text-center">
            Map will appear once coordinates are confirmed for {city.name}.
          </p>
        </div>
      </div>
    );
  }

  // Create markers for universities
  const universityMarkers = universities.map(uni => ({
    id: uni.id,
    name: uni.name,
    lat: uni.lat,
    lng: uni.lng,
    description: uni.type
  }));

  return (
    <div className={`w-full ${className || ''}`}>
      <UniversalMap
        latitude={hasCoordinates ? city.lat! : undefined}
        longitude={hasCoordinates ? city.lng! : undefined}
        locationName={city.name}
        zoom={11}
        height={380}
        markers={universityMarkers}
      />
      {universityMarkers.length > 0 && (
        <div className="mt-2 text-sm text-muted-foreground">
          Showing {universityMarkers.length} university location{universityMarkers.length !== 1 ? 's' : ''} in {city.name}
        </div>
      )}
    </div>
  );
}
