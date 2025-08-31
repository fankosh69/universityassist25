import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import LoadingSpinner from "@/components/LoadingSpinner";
import SEOHead from "@/components/SEOHead";
import JsonLd from "@/components/JsonLd";
import Navigation from "@/components/Navigation";
import { MapPin, Building, Users } from "lucide-react";

interface City {
  id: string;
  name: string;
  state: string;
  slug: string;
  lat?: number;
  lng?: number;
  university_count?: number;
  region?: string;
  population_total?: number;
  population_asof?: string;
}

export default function Cities() {
  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'name' | 'population'>('name');

  useEffect(() => {
    const fetchCities = async () => {
      try {
        // Fetch cities with university counts and population data
        const { data: citiesData, error: citiesError } = await supabase
          .from('cities')
          .select(`
            id, 
            name, 
            state, 
            slug,
            lat,
            lng,
            region,
            population_total,
            population_asof
          `)
          .eq('country_code', 'DE')
          .order('name');

        if (citiesError) throw citiesError;

        // Count universities for each city
        const citiesWithCount = await Promise.all(
          citiesData.map(async (city) => {
            const { count } = await supabase
              .from('universities')
              .select('*', { count: 'exact', head: true })
              .eq('city_id', city.id);

            return {
              ...city,
              university_count: count || 0
            };
          })
        );

        // Sort cities based on user preference
        const sortedCities = citiesWithCount.sort((a, b) => {
          if (sortBy === 'population') {
            return (b.population_total || 0) - (a.population_total || 0);
          }
          return a.name.localeCompare(b.name);
        });

        setCities(sortedCities);
      } catch (error) {
        console.error('Error fetching cities:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCities();
  }, [sortBy]);

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

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": "German Cities with Universities",
    "description": "List of German cities with universities offering international programs",
    "numberOfItems": cities.length,
    "itemListElement": cities.map((city, index) => ({
      "@type": "Place",
      "position": index + 1,
      "name": city.name,
      "address": {
        "@type": "PostalAddress",
        "addressLocality": city.name,
        "addressRegion": city.state,
        "addressCountry": "DE"
      }
    }))
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5">
      <SEOHead 
        title="Cities in Germany - Study Destinations | University Assist"
        description="Explore German cities with universities. Find the perfect study destination in Germany with our comprehensive guide to university cities."
      />
      <JsonLd data={jsonLd} />
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <nav className="text-sm text-muted-foreground mb-4">
            <Link to="/" className="hover:text-primary">Home</Link>
            <span className="mx-2">/</span>
            <span>Cities</span>
          </nav>
          
          <div className="flex flex-col items-center justify-center text-center py-16">
            <h1 className="text-4xl font-bold mb-4">Study Cities in Germany</h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-6">
              Discover the vibrant German cities where you can pursue your higher education. 
              Each city offers unique opportunities, culture, and academic excellence.
            </p>
            
            {/* Sort Toggle */}
            <div className="flex items-center gap-4 mb-8">
              <span className="text-sm text-muted-foreground">Sort by:</span>
              <div className="flex rounded-lg border border-border overflow-hidden">
                <button
                  onClick={() => setSortBy('name')}
                  className={`px-4 py-2 text-sm font-medium transition-colors ${
                    sortBy === 'name' 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-background text-foreground hover:bg-muted'
                  }`}
                >
                  Name
                </button>
                <button
                  onClick={() => setSortBy('population')}
                  className={`px-4 py-2 text-sm font-medium transition-colors ${
                    sortBy === 'population' 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-background text-foreground hover:bg-muted'
                  }`}
                >
                  Population
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Cities Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {cities.map((city) => (
            <Card key={city.id} className="hover:shadow-lg transition-shadow group">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                     <CardTitle className="text-xl mb-2 group-hover:text-primary transition-colors">
                       {city.name}
                     </CardTitle>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        <span className="text-sm">{city.region || city.state}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Building className="h-4 w-4 text-primary" />
                        <span>
                          {city.university_count || 0} {(city.university_count || 0) === 1 ? 'University' : 'Universities'}
                        </span>
                      </div>
                      {city.population_total && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Users className="h-4 w-4" />
                          <span>
                            {city.population_total.toLocaleString()} residents
                            {city.population_asof && (
                              <span className="text-xs ml-1">(as of {new Date(city.population_asof).getFullYear()})</span>
                            )}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardHeader>
               <CardContent>
                <div className="space-y-3">
                  <div className="pt-3">
                    <Link to={`/cities/${city.slug}`}>
                      <Button className="w-full">
                        Explore {city.name}
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {cities.length === 0 && (
          <Card className="max-w-md mx-auto">
            <CardContent className="p-8 text-center">
              <MapPin className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No Cities Found</h3>
              <p className="text-muted-foreground">
                Cities data is being updated. Please check back later.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Call to Action */}
        <div className="mt-16 text-center">
          <Card className="max-w-2xl mx-auto">
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold mb-4">Ready to Find Your Program?</h2>
              <p className="text-muted-foreground mb-6">
                Browse through thousands of programs offered in these German cities 
                and find the perfect match for your academic goals.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/search">
                  <Button size="lg">Search Programs</Button>
                </Link>
                <Link to="/universities">
                  <Button variant="outline" size="lg">Browse Universities</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}