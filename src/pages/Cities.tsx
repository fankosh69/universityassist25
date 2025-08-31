import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import LoadingSpinner from "@/components/LoadingSpinner";
import SEOHead from "@/components/SEOHead";
import JsonLd from "@/components/JsonLd";
import Navigation from "@/components/Navigation";
import { MapPin, Building, Users, Search } from "lucide-react";

interface CityCard {
  id: string;
  slug: string;
  name: string;
  region: string | null;
  uni_count: number;
  population_total: number | null;
  population_asof: string | null;
}

export default function Cities() {
  const [q, setQ] = useState("");
  const [cities, setCities] = useState<CityCard[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    const fetchCities = async () => {
      setLoading(true);
      try {
        if (!q.trim()) {
          // Empty query → fetch city_stats
          const { data, error } = await supabase
            .from("city_stats")
            .select("*")
            .order("name");
          if (error) throw error;
          setCities(data || []);
        } else {
          // Nonempty query → call search_cities RPC
          const { data, error } = await supabase
            .rpc("search_cities", { q });
          if (error) throw error;
          setCities(data || []);
        }
      } catch (error) {
        console.error('Error fetching cities:', error);
        setCities([]);
      } finally {
        setLoading(false);
      }
    };

    // Debounce search queries, but fetch immediately for empty search
    if (!q.trim()) {
      fetchCities();
    } else {
      timeoutId = setTimeout(fetchCities, 300);
    }

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [q]);

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
        "addressRegion": city.region,
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
          
          <div className="flex flex-col items-center justify-center text-center py-12">
            <h1 className="text-4xl font-bold mb-4">Cities in Germany</h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
              Discover German cities with universities. Search by city name or university name to find your perfect study destination.
            </p>
            
            {/* Search Input */}
            <div className="relative w-full max-w-md">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search city or university… (e.g., Dortmund or TU Dortmund)"
                className="pl-10"
              />
            </div>
          </div>
        </div>

        {/* Cities Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cities.map((city) => {
            const populationText = typeof city.population_total === "number" 
              ? city.population_total.toLocaleString() 
              : "Loading...";
            const yearText = city.population_asof 
              ? ` (${new Date(city.population_asof).getFullYear()})`
              : "";

            return (
              <Link key={city.id} to={`/cities/${city.slug}`} className="block">
                <Card className="hover:shadow-lg transition-shadow group h-full">
                  <CardHeader>
                    <div className="flex items-start gap-4">
                      <div className="flex-1">
                        <CardTitle className="text-lg mb-2 group-hover:text-primary transition-colors">
                          {city.name}
                        </CardTitle>
                        <div className="flex items-center gap-2 text-muted-foreground mb-3">
                          <MapPin className="h-4 w-4" />
                          <span className="text-sm">{city.region || "Germany"}</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Badge variant="secondary" className="flex items-center gap-1">
                            <Building className="h-3 w-3" />
                            {city.uni_count} {city.uni_count === 1 ? 'University' : 'Universities'}
                          </Badge>
                          {city.population_total && (
                            <Badge variant="outline" className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              {populationText}{yearText}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-sm">
                        <Building className="h-4 w-4 text-primary" />
                        <span>
                          {city.uni_count} available {city.uni_count === 1 ? 'university' : 'universities'}
                        </span>
                      </div>
                      
                      {city.population_total && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Users className="h-4 w-4" />
                          <span>Population: {populationText}{yearText}</span>
                        </div>
                      )}
                      
                      <div className="pt-3">
                        <Button className="w-full" size="sm">Explore City</Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
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