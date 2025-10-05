import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { MapPin, Building2, GraduationCap } from "lucide-react";
import { useTranslation } from "react-i18next";
import SEOHead from "@/components/SEOHead";
import { Skeleton } from "@/components/ui/skeleton";

interface Region {
  id: string;
  name: string;
  slug: string;
  country_code: string;
}

export default function Regions() {
  const { t } = useTranslation();

  const { data: regions, isLoading } = useQuery({
    queryKey: ["regions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("regions")
        .select("*")
        .eq("country_code", "DE")
        .order("name");
      
      if (error) throw error;
      return data as Region[];
    },
  });

  const { data: stats } = useQuery({
    queryKey: ["region-stats"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cities")
        .select("region_id, id")
        .not("region_id", "is", null);
      
      if (error) throw error;
      
      const regionCounts = data.reduce((acc, city) => {
        const regionId = city.region_id;
        acc[regionId] = (acc[regionId] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      return regionCounts;
    },
  });

  return (
    <>
      <SEOHead
        title="German Regions - Study in Germany | University Assist"
        description="Explore all German federal states (regions) and discover universities and cities across Germany. Find the perfect region for your studies."
        keywords="German regions, federal states, study in Germany, German universities by region"
      />
      
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
        <Navigation />
        
        <main className="container mx-auto px-4 py-8 mt-16">
          <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="text-center mb-12">
              <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Explore German Regions
              </h1>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Germany is divided into 16 federal states (Bundesländer). Each region offers unique educational opportunities, cultural experiences, and living environments.
              </p>
            </div>

            {/* Regions Grid */}
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <Card key={i} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <Skeleton className="h-6 w-3/4 mb-2" />
                      <Skeleton className="h-4 w-1/2" />
                    </CardHeader>
                    <CardContent>
                      <Skeleton className="h-4 w-full" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {regions?.map((region) => {
                  const cityCount = stats?.[region.id] || 0;
                  
                  return (
                    <Link 
                      key={region.id} 
                      to={`/regions/${region.slug}`}
                      className="group"
                    >
                      <Card className="h-full hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-2 hover:border-primary/50">
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <CardTitle className="text-xl mb-2 group-hover:text-primary transition-colors">
                                {region.name}
                              </CardTitle>
                              <CardDescription className="flex items-center gap-2">
                                <MapPin className="h-4 w-4" />
                                <span>{cityCount} {cityCount === 1 ? 'city' : 'cities'}</span>
                              </CardDescription>
                            </div>
                            <div className="bg-primary/10 p-3 rounded-lg group-hover:bg-primary/20 transition-colors">
                              <Building2 className="h-6 w-6 text-primary" />
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <GraduationCap className="h-4 w-4" />
                              <span>Universities & Programs</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  );
                })}
              </div>
            )}

            {/* Info Section */}
            <div className="mt-16 bg-muted/50 rounded-lg p-8">
              <h2 className="text-2xl font-bold mb-4">About German Federal States</h2>
              <p className="text-muted-foreground mb-4">
                Germany's federal structure means each state has its own education system and universities. 
                Each region offers different opportunities, from bustling metropolitan areas like Bavaria and 
                North Rhine-Westphalia to smaller, more intimate university towns.
              </p>
              <p className="text-muted-foreground">
                Explore regions to discover cities, universities, and programs that match your preferences 
                for location, culture, and academic focus.
              </p>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
