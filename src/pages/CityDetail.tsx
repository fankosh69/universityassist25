import { useParams, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import LoadingSpinner from "@/components/LoadingSpinner";
import SEOHead from "@/components/SEOHead";
import JsonLd from "@/components/JsonLd";
import Navigation from "@/components/Navigation";
import CityMap from "@/components/CityMap";
import { MapPin, Building, Users, Trophy, Globe, Map } from "lucide-react";

interface City {
  id: string;
  name: string;
  state: string;
  slug: string;
  lat: number;
  lng: number;
  metadata: any;
}

interface University {
  id: string;
  name: string;
  type: string;
  ranking: number;
  website: string;
  logo_url: string;
  slug: string;
  program_count?: number;
}

export default function CityDetail() {
  const { citySlug } = useParams();
  const [city, setCity] = useState<City | null>(null);
  const [universities, setUniversities] = useState<University[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCityData = async () => {
      try {
        // Fetch city data
        const { data: cityData, error: cityError } = await supabase
          .from('cities')
          .select('*')
          .eq('slug', citySlug)
          .single();

        if (cityError) throw cityError;
        setCity(cityData);

        // Fetch universities in this city with city name lookup
        const { data: universitiesData, error: universitiesError } = await supabase
          .from('universities')
          .select('*')
          .eq('city', cityData.name)  // Use city name instead of city_id
          .order('ranking', { ascending: true });

        if (universitiesError) throw universitiesError;

        // Count programs for each university
        const universitiesWithCount = await Promise.all(
          (universitiesData || []).map(async (university) => {
            const { count } = await supabase
              .from('programs')
              .select('*', { count: 'exact', head: true })
              .eq('university_id', university.id)
              .eq('published', true);

            return {
              ...university,
              program_count: count || 0
            };
          })
        );

        setUniversities(universitiesWithCount);
      } catch (error) {
        console.error('Error fetching city data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (citySlug) {
      fetchCityData();
    }
  }, [citySlug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  if (!city) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <Card>
            <CardContent className="p-8 text-center">
              <h2 className="text-2xl font-bold mb-4">City Not Found</h2>
              <p className="text-muted-foreground mb-6">
                The city you're looking for doesn't exist or has been removed.
              </p>
              <Link to="/cities">
                <Button>Browse Cities</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Place",
    "name": city.name,
    "address": {
      "@type": "PostalAddress",
      "addressLocality": city.name,
      "addressRegion": city.state,
      "addressCountry": "DE"
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": city.lat,
      "longitude": city.lng
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5">
      <SEOHead 
        title={`Study in ${city.name}, ${city.state} | University Assist`}
        description={`Discover universities and study programs in ${city.name}, ${city.state}. Find the perfect higher education opportunity in this vibrant German city.`}
      />
      <JsonLd data={jsonLd} />
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <nav className="text-sm text-muted-foreground mb-4">
            <Link to="/" className="hover:text-primary">Home</Link>
            <span className="mx-2">/</span>
            <Link to="/cities" className="hover:text-primary">Cities</Link>
            <span className="mx-2">/</span>
            <span>{city.name}</span>
          </nav>
          
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-4">Study in {city.name}</h1>
            <div className="flex flex-wrap items-center gap-4 text-muted-foreground mb-4">
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                <span>{city.state}, Germany</span>
              </div>
              {city.metadata?.population && (
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  <span>{city.metadata.population.toLocaleString()} residents</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                <span>{universities.length} universities</span>
              </div>
            </div>
            <p className="text-xl text-muted-foreground max-w-3xl">
              {city.metadata?.description || 
                `${city.name} is a vibrant German city offering excellent opportunities for international students. 
                Discover world-class universities, rich cultural heritage, and a welcoming international community.`
              }
            </p>
          </div>
        </div>

        {/* Interactive Map */}
        {city.lat && city.lng && (
          <div className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Explore {city.name}</h2>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Map className="h-5 w-5" />
                <span>Interactive Map</span>
              </div>
            </div>
            <CityMap
              cityId={city.id}
              cityName={city.name}
              cityLat={city.lat}
              cityLng={city.lng}
              className="w-full"
            />
          </div>
        )}

        {/* Universities Section */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Universities in {city.name}</h2>
          
          {universities.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {universities.map((university) => (
                <Card key={university.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start gap-4">
                      {university.logo_url && (
                        <div className="flex-shrink-0">
                          <img 
                            src={university.logo_url} 
                            alt={`${university.name} logo`}
                            className="w-12 h-12 object-contain rounded-lg bg-white p-1"
                          />
                        </div>
                      )}
                      <div className="flex-1">
                        <CardTitle className="text-lg mb-2">{university.name}</CardTitle>
                        <div className="flex flex-wrap gap-2 mb-3">
                          <Badge variant="secondary">{university.type}</Badge>
                          {university.ranking && (
                            <Badge variant="outline" className="flex items-center gap-1">
                              <Trophy className="h-3 w-3" />
                              #{university.ranking}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {university.program_count && university.program_count > 0 && (
                        <div className="flex items-center gap-2 text-sm">
                          <Building className="h-4 w-4 text-primary" />
                          <span>
                            {university.program_count} available {university.program_count === 1 ? 'program' : 'programs'}
                          </span>
                        </div>
                      )}
                      
                      {university.website && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Globe className="h-4 w-4" />
                          <a 
                            href={university.website} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="hover:text-primary truncate"
                          >
                            Official Website
                          </a>
                        </div>
                      )}
                      
                      <div className="pt-3">
                        <Link to={`/universities/${university.slug}`}>
                          <Button className="w-full">View University</Button>
                        </Link>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <Building className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">No Universities Listed</h3>
                <p className="text-muted-foreground">
                  Universities in {city.name} are being added to our database. Please check back later.
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Call to Action */}
        <div className="text-center">
          <Card className="max-w-2xl mx-auto">
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold mb-4">Ready to Start Your Journey?</h2>
              <p className="text-muted-foreground mb-6">
                Explore programs offered by universities in {city.name} and take the first step 
                towards your international education in Germany.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/search">
                  <Button size="lg">Search Programs</Button>
                </Link>
                <Link to="/universities">
                  <Button variant="outline" size="lg">All Universities</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}