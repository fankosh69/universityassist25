import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import UniMap, { type MapFeature } from '@/components/maps/UniMap';
import Navigation from '@/components/Navigation';
import SEOHead from '@/components/SEOHead';

export default function CityPage() {
  const { city } = useParams();
  const [cityData, setCityData] = useState<any>(null);
  const [universities, setUniversities] = useState<any[]>([]);
  const [mapFeatures, setMapFeatures] = useState<MapFeature[]>([]);

  useEffect(() => {
    async function fetchData() {
      if (!city) return;
      
      // Fetch city data
      const { data: cityInfo } = await supabase
        .from('cities')
        .select('*')
        .eq('slug', city)
        .single();
      
      setCityData(cityInfo);

      // Fetch ALL universities in this city
      const { data: allUnis } = await supabase
        .from('universities')
        .select('*')
        .eq('city_id', cityInfo?.id || '');
      
      setUniversities(allUnis || []);

      // Create map features for Google Maps - only include universities with valid coordinates
      const validUnis = (allUnis || []).filter(uni => 
        uni.lat && uni.lng && uni.lat !== 0 && uni.lng !== 0
      );

      const features: MapFeature[] = validUnis.map((uni, index) => {
        // Add small offset to avoid overlapping markers (0.001 degrees ≈ 100m)
        const latOffset = (index % 3 - 1) * 0.001;
        const lngOffset = (Math.floor(index / 3) % 3 - 1) * 0.001;
        
        return {
          id: uni.id,
          name: uni.name,
          slug: uni.slug || uni.id,
          lat: uni.lat + latOffset,
          lng: uni.lng + lngOffset,
          kind: 'university' as const,
          data: { ...uni, city: cityInfo?.name, program_count: 0 }
        };
      });
      
      setMapFeatures(features);
    }

    fetchData();
  }, [city]);

  if (!cityData) return <div>Loading...</div>;

  return (
    <div className="min-h-screen bg-background">
      <SEOHead 
        title={`Study in ${cityData.name} | University Assist`}
        description={`Discover universities and programs in ${cityData.name}, Germany. Find your perfect study destination.`}
      />
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4">Study in {cityData.name}</h1>
          <p className="text-xl text-muted-foreground">
            Explore {universities.length} universities and their programs
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <UniMap 
              features={mapFeatures}
              center={cityData?.lat && cityData?.lng ? { lat: cityData.lat, lng: cityData.lng } : undefined}
              zoom={11}
              height="400px"
              className="mb-8"
            />
          </div>
          
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Universities ({universities.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {universities.map(uni => (
                  <div className="border-b pb-4 last:border-b-0">
                    <Link 
                      to={`/universities/${uni.slug || uni.id}`}
                      className="block hover:bg-muted/50 rounded p-2 transition-colors"
                    >
                      <h3 className="font-semibold hover:text-primary transition-colors">{uni.name}</h3>
                      <p className="text-sm text-muted-foreground">{uni.type}</p>
                    </Link>
                  </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}