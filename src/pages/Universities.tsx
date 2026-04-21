import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { slugify } from "@/lib/slug";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SearchableSelect } from "@/components/ui/searchable-select";
import LoadingSpinner from "@/components/LoadingSpinner";
import SEOHead from "@/components/SEOHead";
import JsonLd from "@/components/JsonLd";
import Navigation from "@/components/Navigation";
import { InstitutionTypeBadge } from '@/components/InstitutionTypeBadge';
import { ControlTypeBadge } from '@/components/ControlTypeBadge';
import { INSTITUTION_TYPES, CONTROL_TYPES, normalizeInstitutionType, normalizeControlType, getInstitutionTypeLabel, getControlTypeLabel } from '@/lib/institution-types';
import { MapPin, Building, Trophy, Globe, Search, GraduationCap, Grid3x3, List, Map as MapIcon, SlidersHorizontal } from "lucide-react";
import { UniversityCard } from "@/components/university/UniversityCard";

interface University {
  id: string;
  name: string;
  city: string;
  type?: string;
  control_type?: string;
  ranking?: number;
  website?: string;
  logo_url?: string;
  slug: string;
  program_count?: number;
  city_id?: string;
  created_at?: string;
  lat?: number;
  lng?: number;
  region?: string;
  keywords?: string[];
  search_doc?: any;
  fts?: unknown;
  external_refs?: any;
  student_count?: number;
  international_student_percentage?: number;
  founded_year?: number;
}

export default function Universities() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [universities, setUniversities] = useState<University[]>([]);
  const [filteredUniversities, setFilteredUniversities] = useState<University[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [selectedControlType, setSelectedControlType] = useState<string>("all");
  const [selectedCity, setSelectedCity] = useState<string>("all");
  const [selectedRegion, setSelectedRegion] = useState<string>("all");
  const [cities, setCities] = useState<string[]>([]);
  const [regions, setRegions] = useState<string[]>([]);
  const [types, setTypes] = useState<string[]>([]);
  const [controlTypes, setControlTypes] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sortBy, setSortBy] = useState<string>("name");

  useEffect(() => {
    const fetchUniversities = async () => {
      try {
        const { data: universitiesData, error: universitiesError } = await supabase
          .from('universities')
          .select('*')
          .order('name', { ascending: true });

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

        // Extract unique cities, regions, types, and control types for filters
        const uniqueCities = [...new Set(universitiesWithCount.map(u => u.city))].filter(Boolean).sort();
        const uniqueRegions = [...new Set(universitiesWithCount.map(u => u.region))].filter(Boolean).sort();
        const uniqueTypes = [...new Set(universitiesWithCount.map(u => u.type))].filter(Boolean).sort();
        const uniqueControlTypes = [...new Set(universitiesWithCount.map(u => u.control_type))].filter(Boolean).sort();
        
        setCities(uniqueCities);
        setRegions(uniqueRegions);
        setTypes(uniqueTypes);
        setControlTypes(uniqueControlTypes);
        
        // Handle URL parameters for initial filtering
        const cityParam = searchParams.get('city');
        const regionParam = searchParams.get('region');
        
        if (cityParam && uniqueCities.includes(cityParam)) {
          setSelectedCity(cityParam);
        }
        
        if (regionParam && uniqueRegions.includes(regionParam)) {
          setSelectedRegion(regionParam);
        }
      } catch (error) {
        console.error('Error fetching universities:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUniversities();
  }, []);

  useEffect(() => {
    // Filter universities based on search term, type, control type, city, and region
    let filtered = universities;

    if (searchTerm) {
      filtered = filtered.filter(university => {
        const nameClean = university.name?.replace(/[^\x00-\x7F]/g, "").toLowerCase() || university.name?.toLowerCase() || '';
        const cityClean = university.city?.replace(/[^\x00-\x7F]/g, "").toLowerCase() || university.city?.toLowerCase() || '';
        const searchClean = searchTerm.toLowerCase();
        
        return nameClean.includes(searchClean) || cityClean.includes(searchClean);
      });
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

    if (selectedRegion && selectedRegion !== 'all') {
      filtered = filtered.filter(university => university.region === selectedRegion);
    }

    // Sort universities
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.name.localeCompare(b.name);
        case "name-desc":
          return b.name.localeCompare(a.name);
        case "ranking":
          return (a.ranking || 9999) - (b.ranking || 9999);
        case "programs":
          return (b.program_count || 0) - (a.program_count || 0);
        case "students":
          return (b.student_count || 0) - (a.student_count || 0);
        case "founded":
          return (a.founded_year || 9999) - (b.founded_year || 9999);
        default:
          return 0;
      }
    });

    setFilteredUniversities(sorted);
  }, [searchTerm, selectedType, selectedControlType, selectedCity, selectedRegion, universities, sortBy]);

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

  // Dedupe + normalize filter values for display
  const normalizedTypes = Array.from(
    new Set(types.map((t) => normalizeInstitutionType(t)))
  );
  const normalizedControlTypes = Array.from(
    new Set(controlTypes.map((t) => normalizeControlType(t)))
  );

  const totalPrograms = universities.reduce(
    (sum, u) => sum + (u.program_count || 0),
    0
  );
  const totalCities = new Set(universities.map((u) => u.city).filter(Boolean)).size;

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
      
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-hero text-primary-foreground">
        <div className="absolute inset-0 opacity-20" aria-hidden="true">
          <div className="absolute -top-20 -left-20 h-72 w-72 rounded-full bg-secondary blur-3xl" />
          <div className="absolute -bottom-24 -right-10 h-80 w-80 rounded-full bg-accent blur-3xl" />
        </div>
        <div className="container relative mx-auto px-4 py-10 sm:py-14">
          <nav className="text-sm text-primary-foreground/80 mb-4">
            <Link to="/" className="hover:text-primary-foreground transition-colors">Home</Link>
            <span className="mx-2">/</span>
            <span className="text-primary-foreground">Universities</span>
          </nav>

          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary-foreground/10 px-3 py-1 text-xs font-medium backdrop-blur-sm mb-4 border border-primary-foreground/20">
              <Building className="h-3.5 w-3.5" />
              Germany · {universities.length} institutions
            </div>
            <h1 className="text-3xl sm:text-5xl font-bold mb-3 leading-tight">
              Universities in Germany
            </h1>
            <p className="text-base sm:text-lg text-primary-foreground/90 max-w-2xl">
              Discover world-class German universities offering international programs.
              Find the perfect institution for your academic journey.
            </p>
          </div>

          <div className="mt-6 grid grid-cols-3 gap-3 max-w-xl">
            {[
              { label: "Universities", value: universities.length, icon: Building },
              { label: "Programs", value: totalPrograms.toLocaleString(), icon: GraduationCap },
              { label: "Cities", value: totalCities, icon: MapPin },
            ].map((s) => (
              <div
                key={s.label}
                className="rounded-xl bg-primary-foreground/10 backdrop-blur-sm border border-primary-foreground/20 px-3 py-3 sm:px-4 sm:py-4"
              >
                <div className="flex items-center gap-2 text-primary-foreground/80 text-xs mb-1">
                  <s.icon className="h-3.5 w-3.5" />
                  <span className="truncate">{s.label}</span>
                </div>
                <div className="text-xl sm:text-2xl font-bold">{s.value}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-8">

        {/* Search and Filters */}
        <Card className="mb-6 -mt-12 sm:-mt-16 relative shadow-elegant">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-4 text-sm font-semibold text-muted-foreground">
              <SlidersHorizontal className="h-4 w-4" />
              Filter universities
            </div>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
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
                  {normalizedTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {getInstitutionTypeLabel(type, "en", false, false)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedControlType} onValueChange={setSelectedControlType}>
                <SelectTrigger>
                  <SelectValue placeholder="Control Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Control Types</SelectItem>
                  {normalizedControlTypes.map((controlType) => (
                    <SelectItem key={controlType} value={controlType}>
                      {getControlTypeLabel(controlType, "en")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <SearchableSelect 
                value={selectedCity}
                onValueChange={setSelectedCity}
                options={[
                  { value: "all", label: "All Cities" },
                  ...cities.map(city => ({ value: city, label: city }))
                ]}
                placeholder="Select City"
                emptyText="No city found."
                maxDisplayOptions={6}
              />

              <SearchableSelect 
                value={selectedRegion}
                onValueChange={setSelectedRegion}
                options={[
                  { value: "all", label: "All Regions" },
                  ...regions.map(region => ({ value: region, label: region }))
                ]}
                placeholder="Select Region"
                emptyText="No region found."
                maxDisplayOptions={6}
              />
              
              <Button 
                variant="outline" 
                onClick={() => {
                  setSearchTerm("");
                  setSelectedType("all");
                  setSelectedControlType("all");
                  setSelectedCity("all");
                  setSelectedRegion("all");
                  setSearchParams({});
                }}
              >
                Clear Filters
              </Button>
            </div>
            
            {/* Sort and View Options */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-4 border-t">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Sort by:</span>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="name">Name (A-Z)</SelectItem>
                    <SelectItem value="name-desc">Name (Z-A)</SelectItem>
                    <SelectItem value="ranking">Best Ranked</SelectItem>
                    <SelectItem value="programs">Most Programs</SelectItem>
                    <SelectItem value="students">Most Students</SelectItem>
                    <SelectItem value="founded">Oldest First</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">View:</span>
                <div className="flex gap-1">
                  <Button
                    variant={viewMode === "grid" ? "default" : "outline"}
                    size="icon"
                    onClick={() => setViewMode("grid")}
                  >
                    <Grid3x3 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === "list" ? "default" : "outline"}
                    size="icon"
                    onClick={() => setViewMode("list")}
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results Counter */}
        <div className="mb-6 flex flex-wrap items-baseline gap-2">
          <span className="text-2xl font-bold text-foreground">
            {filteredUniversities.length}
          </span>
          <span className="text-muted-foreground">
            of {universities.length} universities
            {(searchTerm ||
              selectedType !== "all" ||
              selectedControlType !== "all" ||
              selectedCity !== "all" ||
              selectedRegion !== "all") && " match your filters"}
          </span>
        </div>

        {/* Universities Grid/List */}
        <div className={viewMode === "grid" 
          ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12" 
          : "space-y-4 mb-12"
        }>
          {filteredUniversities.map((university) => (
            <UniversityCard 
              key={university.id} 
              university={university} 
              variant={viewMode}
            />
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
                  setSelectedRegion("all");
                  setSearchParams({});
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