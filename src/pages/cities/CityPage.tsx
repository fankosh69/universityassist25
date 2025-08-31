import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import CityMap from '@/components/CityMap';
import Navigation from '@/components/Navigation';
import SEOHead from '@/components/SEOHead';

interface MapMarker {
  id: string;
  name: string;
  coordinates: [number, number];
  type: 'university' | 'city';
  data?: any;
}

export default function CityPage() {
  const { city } = useParams();
  const [cityData, setCityData] = useState<any>(null);
  const [universities, setUniversities] = useState<any[]>([]);
  const [mapMarkers, setMapMarkers] = useState<MapMarker[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        if (!city) return;
        
        // Fetch city data with population and region info
        const { data: cityInfo, error: cityError } = await supabase
          .from('cities')
          .select('id, name, slug, lat, lng, region, population_total, population_asof')
          .eq('slug', city)
          .maybeSingle();
        
        if (cityError) {
          console.error('Error fetching city:', cityError);
          return;
        }

        setCityData(cityInfo);

        if (!cityInfo) return;

        // Fetch ALL universities in this city using the proper city_id relationship
        const { data: allUnis, error: unisError } = await supabase
          .from('universities')
          .select('*')
          .eq('city_id', cityInfo.id);
        
        if (unisError) {
          console.error('Error fetching universities:', unisError);
          return;
        }

        setUniversities(allUnis || []);

        // Create map markers - only include universities with valid coordinates
        const validUnis = (allUnis || []).filter(uni => 
          uni.lat && uni.lng && uni.lat !== 0 && uni.lng !== 0
        );

        const markers: MapMarker[] = validUnis.map((uni, index) => {
          // Add small offset to avoid overlapping markers (0.001 degrees ≈ 100m)
          const latOffset = (index % 3 - 1) * 0.001;
          const lngOffset = (Math.floor(index / 3) % 3 - 1) * 0.001;
          
          return {
            id: uni.id,
            name: uni.name,
            coordinates: [uni.lng + lngOffset, uni.lat + latOffset],
            type: 'university' as const,
            data: { ...uni, slug: uni.slug, city: cityInfo.name, program_count: 0 }
          };
        });
        
        setMapMarkers(markers);
        
        // If city coordinates are missing, try to geocode them
        if (cityInfo && (!cityInfo.lat || !cityInfo.lng)) {
          try {
            const response = await supabase.functions.invoke('geocode-city', {
              body: { slug: city }
            });
            
            if (response.data && response.data.updated > 0) {
              // Refetch city data after geocoding
              const { data: updatedCityInfo } = await supabase
                .from('cities')
                .select('id, name, slug, lat, lng, region, population_total, population_asof')
                .eq('slug', city)
                .maybeSingle();
              
              if (updatedCityInfo) {
                setCityData(updatedCityInfo);
              }
            }
          } catch (geocodeError) {
            console.error('Geocoding failed:', geocodeError);
          }
        }
      } catch (error) {
        console.error('Error in fetchData:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [city]);

  if (loading) return <div className="flex items-center justify-center min-h-screen"><div className="text-lg">Loading...</div></div>;
  if (!cityData) return <div className="flex items-center justify-center min-h-screen"><div className="text-lg">City not found</div></div>;

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
          <div className="flex flex-wrap items-center gap-2 text-lg text-muted-foreground mb-2">
            {cityData.region && <span>{cityData.region}</span>}
            {cityData.population_total && (
              <>
                <span>•</span>
                <span>{cityData.population_total.toLocaleString()} residents</span>
                {cityData.population_asof && (
                  <span className="text-base">(as of {new Date(cityData.population_asof).getFullYear()})</span>
                )}
              </>
            )}
          </div>
          <p className="text-xl text-muted-foreground">
            Explore {universities.length} universities and their programs
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <CityMap 
              city={cityData}
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