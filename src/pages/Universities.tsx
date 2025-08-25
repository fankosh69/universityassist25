import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import LoadingSpinner from "@/components/LoadingSpinner";
import SEOHead from "@/components/SEOHead";
import JsonLd from "@/components/JsonLd";
import Navigation from "@/components/Navigation";
import { InstitutionTypeBadge } from '@/components/InstitutionTypeBadge';
import { ControlTypeBadge } from '@/components/ControlTypeBadge';
import { MapPin, Building, Trophy, Globe, Search, GraduationCap } from "lucide-react";

interface University {
  id: string;
  name: string;
  city: string;
  type: string;
  control_type?: string;
  ranking: number;
  website: string;
  logo_url: string;
  slug: string;
  program_count?: number;
}

export default function Universities() {
  const [universities, setUniversities] = useState<University[]>([]);
  const [filteredUniversities, setFilteredUniversities] = useState<University[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [selectedControlType, setSelectedControlType] = useState<string>("all");
  const [selectedCity, setSelectedCity] = useState<string>("all");
  const [cities, setCities] = useState<string[]>([]);
  const [types, setTypes] = useState<string[]>([]);
  const [controlTypes, setControlTypes] = useState<string[]>([]);

  useEffect(() => {
    const fetchUniversities = async () => {
      try {
        const { data: universitiesData, error: universitiesError } = await supabase
          .from('universities')
          .select('*')
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
        setFilteredUniversities(universitiesWithCount);

        // Extract unique cities, types, and control types for filters
        const uniqueCities = [...new Set(universitiesWithCount.map(u => u.city))].sort();
        const uniqueTypes = [...new Set(universitiesWithCount.map(u => u.type))].filter(Boolean).sort();
        const uniqueControlTypes = [...new Set(universitiesWithCount.map(u => u.control_type))].filter(Boolean).sort();
        
        setCities(uniqueCities);
        setTypes(uniqueTypes);
        setControlTypes(uniqueControlTypes);
      } catch (error) {
        console.error('Error fetching universities:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUniversities();
  }, []);

  useEffect(() => {
    // Filter universities based on search term, type, control type, and city
    let filtered = universities;

    if (searchTerm) {
      filtered = filtered.filter(university =>
        university.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        university.city.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedType && selectedType !== 'all') {
      filtered = filtered.filter(university => university.type === selectedType);
    }

    if (selectedControlType && selectedControlType !== 'all') {
      filtered = filtered.filter(university => university.control_type === selectedControlType);
    }

    if (selectedCity && selectedCity !== 'all') {
      filtered = filtered.filter(university => university.city === selectedCity);
    }

    setFilteredUniversities(filtered);
  }, [searchTerm, selectedType, selectedControlType, selectedCity, universities]);

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
    "name": "German Universities",
    "description": "List of universities in Germany offering international programs",
    "numberOfItems": filteredUniversities.length,
    "itemListElement": filteredUniversities.map((university, index) => ({
      "@type": "CollegeOrUniversity",
      "position": index + 1,
      "name": university.name,
      "url": university.website,
      "address": {
        "@type": "PostalAddress",
        "addressLocality": university.city,
        "addressCountry": "DE"
      }
    }))
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5">
      <SEOHead 
        title="Universities in Germany - Find Your Perfect Match | University Assist"
        description="Explore universities in Germany. Find detailed information about German higher education institutions, their programs, and admission requirements."
      />
      <JsonLd data={jsonLd} />
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <nav className="text-sm text-muted-foreground mb-4">
            <Link to="/" className="hover:text-primary">Home</Link>
            <span className="mx-2">/</span>
            <span>Universities</span>
          </nav>
          
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-4">Universities in Germany</h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Discover world-class German universities offering international programs. 
              Find the perfect institution for your academic journey.
            </p>
          </div>
        </div>

        {/* Search and Filters */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search universities or cities..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger>
                  <SelectValue placeholder="Institution Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Institution Types</SelectItem>
                  {types.map((type) => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedControlType} onValueChange={setSelectedControlType}>
                <SelectTrigger>
                  <SelectValue placeholder="Control Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Control Types</SelectItem>
                  {controlTypes.map((controlType) => (
                    <SelectItem key={controlType} value={controlType}>
                      {controlType.charAt(0).toUpperCase() + controlType.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={selectedCity} onValueChange={setSelectedCity}>
                <SelectTrigger>
                  <SelectValue placeholder="City" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Cities</SelectItem>
                  {cities.map((city) => (
                    <SelectItem key={city} value={city}>{city}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Button 
                variant="outline" 
                onClick={() => {
                  setSearchTerm("");
                  setSelectedType("all");
                  setSelectedControlType("all");
                  setSelectedCity("all");
                }}
              >
                Clear Filters
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Results Counter */}
        <div className="mb-6">
          <p className="text-muted-foreground">
            Showing {filteredUniversities.length} of {universities.length} universities
          </p>
        </div>

        {/* Universities Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {filteredUniversities.map((university) => (
            <Card key={university.id} className="hover:shadow-lg transition-shadow group">
              <CardHeader>
                <div className="flex items-start gap-4">
                  {university.logo_url && (
                    <div className="flex-shrink-0">
                       <img 
                         src={university.logo_url} 
                         alt={`${university.name} logo`}
                         className="w-16 h-16 object-contain rounded-lg bg-white p-2"
                         width="64"
                         height="64"
                         loading="lazy"
                         decoding="async"
                       />
                    </div>
                  )}
                  <div className="flex-1">
                    <CardTitle className="text-lg mb-2 group-hover:text-primary transition-colors">
                      {university.name}
                    </CardTitle>
                    <div className="flex items-center gap-2 text-muted-foreground mb-3">
                      <MapPin className="h-4 w-4" />
                      <span className="text-sm">{university.city}</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {university.type && (
                        <InstitutionTypeBadge type={university.type} useShort />
                      )}
                      {university.control_type && (
                        <ControlTypeBadge type={university.control_type} useShort />
                      )}
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
                      <GraduationCap className="h-4 w-4 text-primary" />
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
                  
                  <div className="pt-3 flex gap-2">
                    <Link to={`/universities/${university.slug}`} className="flex-1">
                      <Button className="w-full">View Details</Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredUniversities.length === 0 && (
          <Card className="max-w-md mx-auto">
            <CardContent className="p-8 text-center">
              <Building className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No Universities Found</h3>
              <p className="text-muted-foreground mb-4">
                Try adjusting your search criteria or clearing the filters.
              </p>
              <Button 
                variant="outline"
                onClick={() => {
                  setSearchTerm("");
                  setSelectedType("all");
                  setSelectedControlType("all");
                  setSelectedCity("all");
                }}
              >
                Clear All Filters
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Call to Action */}
        <div className="text-center">
          <Card className="max-w-2xl mx-auto">
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold mb-4">Ready to Apply?</h2>
              <p className="text-muted-foreground mb-6">
                Found the perfect university? Start exploring their programs and begin 
                your application process to study in Germany.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/search">
                  <Button size="lg">Search Programs</Button>
                </Link>
                <Link to="/cities">
                  <Button variant="outline" size="lg">Explore Cities</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}