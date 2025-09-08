import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import LoadingSpinner from "@/components/LoadingSpinner";
import SEOHead from "@/components/SEOHead";
import JsonLd from "@/components/JsonLd";
import Navigation from "@/components/Navigation";
import { CityTypeBadge } from "@/components/CityTypeBadge";
import { MapPin, Building, Users, Search, ExternalLink } from "lucide-react";

interface CityCard {
  id: string;
  slug: string;
  name: string;
  region: string | null;
  uni_count: number;
  population_total: number | null;
  population_asof: string | null;
  city_type: string | null;
  description: string | null;
  website: string | null;
}

export default function Cities() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [q, setQ] = useState("");
  const [cities, setCities] = useState<CityCard[]>([]);
  const [filteredCities, setFilteredCities] = useState<CityCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchActive, setSearchActive] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState<string>("all");
  const [regions, setRegions] = useState<string[]>([]);

  const fetchCities = async (query: string = "") => {
    setLoading(true);
    try {
      if (!query.trim()) {
        // Empty query → fetch from cities table with proper region data
        const { data, error } = await supabase
          .from("cities")
          .select(`
            id,
            slug,
            name,
            region,
            population_total,
            population_asof,
            city_type,
            description,
            metadata,
            universities!inner(count)
          `)
          .order("name");
        if (error) throw error;
        
        // Transform data to match CityCard interface
        const citiesWithCount = data?.map(city => ({
          ...city,
          uni_count: city.universities?.[0]?.count || 0,
          website: (city.metadata as any)?.website || null
        })) || [];
        setCities(citiesWithCount);
        
        // Extract unique regions for filter
        const uniqueRegions = [...new Set(citiesWithCount.map(c => c.region))].filter(Boolean).sort();
        setRegions(uniqueRegions);
      } else {
        // Search using cities table with text search
        const { data, error } = await supabase
          .from("cities")
          .select(`
            id,
            slug,
            name,
            region,
            population_total,
            population_asof,
            city_type,
            description,
            metadata,
            universities!inner(count)
          `)
          .ilike('name', `%${query}%`)
          .order("name");
        if (error) throw error;
        
        // Transform data to match CityCard interface
        const citiesWithCount = data?.map(city => ({
          ...city,
          uni_count: city.universities?.[0]?.count || 0,
          website: (city.metadata as any)?.website || null
        })) || [];
        setCities(citiesWithCount);
        
        // Extract unique regions for filter
        const uniqueRegions = [...new Set(citiesWithCount.map(c => c.region))].filter(Boolean).sort();
        setRegions(uniqueRegions);
      }
    } catch (error) {
      console.error('Error fetching cities:', error);
      setCities([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setSearchActive(true);
    fetchCities(q);
  };

  const handleClearSearch = () => {
    setQ("");
    setSearchActive(false);
    fetchCities("");
  };

  useEffect(() => {
    // Load initial cities on component mount
    fetchCities("");
  }, []);

  useEffect(() => {
    // Filter cities based on region selection
    let filtered = cities;

    if (selectedRegion && selectedRegion !== 'all') {
      filtered = filtered.filter(city => city.region === selectedRegion);
    }

    setFilteredCities(filtered);
  }, [selectedRegion, cities]);

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
    "numberOfItems": filteredCities.length,
    "itemListElement": filteredCities.map((city, index) => ({
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
            
            {/* Search and Filter Controls */}
            <div className="flex flex-col gap-4 w-full max-w-2xl">
              <div className="flex gap-2 w-full">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    placeholder="Search city or university… (e.g., Dortmund or TU Dortmund)"
                    className="pl-10"
                  />
                </div>
                <Button onClick={handleSearch} disabled={loading}>
                  Search
                </Button>
                {searchActive && (
                  <Button variant="outline" onClick={handleClearSearch}>
                    Clear
                  </Button>
                )}
              </div>
              
              {/* Region Filter */}
              <div className="flex gap-2 justify-center">
                <Select value={selectedRegion} onValueChange={setSelectedRegion}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filter by Region" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Regions</SelectItem>
                    {regions.map((region) => (
                      <SelectItem key={region} value={region}>{region}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedRegion !== "all" && (
                  <Button variant="outline" onClick={() => setSelectedRegion("all")}>
                    Clear Filter
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Cities Grid */}
        <div className="mb-6">
          <p className="text-muted-foreground text-center">
            Showing {filteredCities.length} of {cities.length} cities in Germany
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCities.map((city) => {
          const populationText = typeof city.population_total === "number" 
            ? city.population_total.toLocaleString() 
            : "Loading...";

          return (
            <Link key={city.id} to={`/cities/${city.slug}`} className="block">
              <Card className="hover:shadow-lg transition-shadow group h-full">
                <CardHeader>
                  <div className="flex items-start gap-4">
                    <div className="flex-1">
                      <CardTitle className="text-lg mb-2 group-hover:text-primary transition-colors">
                        {city.name}
                      </CardTitle>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        <Link 
                          to={`/universities?region=${encodeURIComponent(city.region || "")}`}
                          className="text-sm hover:text-primary transition-colors cursor-pointer underline-offset-2 hover:underline"
                        >
                          {city.region || "Region not specified"}
                        </Link>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 mb-3">
                      <CityTypeBadge type={city.city_type || 'City'} />
                    </div>
                    
                    <Link 
                      to={`/universities?city=${encodeURIComponent(city.name)}`}
                      className="flex items-center gap-2 text-sm hover:text-primary transition-colors cursor-pointer"
                    >
                      <Building className="h-4 w-4 text-primary" />
                      <span>
                        {city.uni_count} available {city.uni_count === 1 ? 'university' : 'universities'}
                      </span>
                    </Link>
                    
                    {city.population_total && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Users className="h-4 w-4" />
                        <span>Population: {populationText}</span>
                      </div>
                    )}

                    <div className="flex items-center gap-2 text-sm">
                      {city.website ? (
                        <a 
                          href={city.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:text-primary/80 transition-colors"
                        >
                          <ExternalLink className="h-4 w-4 inline mr-1" />
                          City Website
                        </a>
                      ) : (
                        <span className="text-muted-foreground">
                          <ExternalLink className="h-4 w-4 inline mr-1" />
                          City Website (Coming Soon)
                        </span>
                      )}
                    </div>

                    {city.description && (
                      <div className="text-sm text-muted-foreground mt-3 leading-relaxed">
                        {city.description}
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

        {filteredCities.length === 0 && (
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