import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import LoadingSpinner from "@/components/LoadingSpinner";
import SEOHead from "@/components/SEOHead";
import JsonLd from "@/components/JsonLd";
import Navigation from "@/components/Navigation";
import { CitiesHeroSection } from "@/components/cities/CitiesHeroSection";
import { CityCard } from "@/components/cities/CityCard";
import { MapPin, Search } from "lucide-react";

interface CityCard {
  id: string;
  slug: string;
  name: string;
  region: string | null;
  uni_count: number;
  population_total: number | null;
  hero_image_url?: string;
  hashtags?: string[];
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
            hero_image_url,
            hashtags,
            universities!inner(count)
          `)
          .order("name");
        if (error) throw error;
        
        // Transform data to match CityCard interface
        const citiesWithCount = data?.map(city => ({
          ...city,
          uni_count: city.universities?.[0]?.count || 0
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
            hero_image_url,
            hashtags,
            universities!inner(count)
          `)
          .ilike('name', `%${query}%`)
          .order("name");
        if (error) throw error;
        
        // Transform data to match CityCard interface
        const citiesWithCount = data?.map(city => ({
          ...city,
          uni_count: city.universities?.[0]?.count || 0
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
    <div className="min-h-screen bg-background">
      <SEOHead 
        title="Cities in Germany - Study Destinations | University Assist"
        description="Explore German cities with universities. Find the perfect study destination in Germany with our comprehensive guide to university cities."
      />
      <JsonLd data={jsonLd} />
      <Navigation />
      
      {/* Hero Section */}
      <CitiesHeroSection />
      
      <div className="container mx-auto px-4 pb-16">
        {/* Search and Filter Section */}
        <div className="bg-card rounded-lg shadow-md p-6 -mt-8 relative z-10 mb-12">
          <div className="flex flex-col gap-4">
            {/* Search Bar */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                <Input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder="Search city... (e.g., Aachen, Munich)"
                  className="pl-10 h-11"
                />
              </div>
              <Button onClick={handleSearch} disabled={loading} size="lg">
                Search
              </Button>
              {searchActive && (
                <Button variant="outline" onClick={handleClearSearch} size="lg">
                  Clear
                </Button>
              )}
            </div>
            
            {/* Region Filter */}
            <div className="flex gap-2 items-center">
              <span className="text-sm text-muted-foreground whitespace-nowrap">Filter by:</span>
              <Select value={selectedRegion} onValueChange={setSelectedRegion}>
                <SelectTrigger className="w-64">
                  <SelectValue placeholder="All Regions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Regions</SelectItem>
                  {regions.map((region) => (
                    <SelectItem key={region} value={region}>{region}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedRegion !== "all" && (
                <Button variant="ghost" onClick={() => setSelectedRegion("all")} size="sm">
                  Clear
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-6 text-center">
          <p className="text-muted-foreground">
            Showing <span className="font-semibold text-foreground">{filteredCities.length}</span> of <span className="font-semibold text-foreground">{cities.length}</span> cities in Germany
          </p>
        </div>
        
        {/* Cities Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-12">
          {filteredCities.map((city) => (
            <CityCard key={city.id} city={city} />
          ))}
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