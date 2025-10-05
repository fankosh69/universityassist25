import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, Building2, Users, ArrowLeft } from "lucide-react";
import { useTranslation } from "react-i18next";
import SEOHead from "@/components/SEOHead";
import { Skeleton } from "@/components/ui/skeleton";

export default function RegionDetail() {
  const { slug } = useParams<{ slug: string }>();
  const { t } = useTranslation();

  const { data: region, isLoading: regionLoading } = useQuery({
    queryKey: ["region", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("regions")
        .select("*")
        .eq("slug", slug)
        .single();
      
      if (error) throw error;
      return data;
    },
  });

  const { data: cities, isLoading: citiesLoading } = useQuery({
    queryKey: ["region-cities", region?.id],
    queryFn: async () => {
      if (!region?.id) return [];
      
      const { data, error } = await supabase
        .from("cities")
        .select(`
          *,
          universities:universities(count)
        `)
        .eq("region_id", region.id)
        .order("population_total", { ascending: false, nullsFirst: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!region?.id,
  });

  const isLoading = regionLoading || citiesLoading;

  return (
    <>
      <SEOHead
        title={`${region?.name || 'Region'} - Cities & Universities | University Assist`}
        description={`Explore cities and universities in ${region?.name || 'this region'}. Find the perfect city for your studies in Germany.`}
        keywords={`${region?.name}, German cities, universities in ${region?.name}, study in Germany`}
      />
      
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
        <Navigation />
        
        <main className="container mx-auto px-4 py-8 mt-16">
          <div className="max-w-6xl mx-auto">
            {/* Back Button */}
            <Link to="/regions">
              <Button variant="ghost" className="mb-6">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Regions
              </Button>
            </Link>

            {/* Header */}
            {isLoading ? (
              <div className="mb-12">
                <Skeleton className="h-12 w-64 mb-4" />
                <Skeleton className="h-6 w-96" />
              </div>
            ) : (
              <div className="text-center mb-12">
                <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  {region?.name}
                </h1>
                <p className="text-lg text-muted-foreground">
                  Explore {cities?.length || 0} cities with universities in this region
                </p>
              </div>
            )}

            {/* Cities Grid */}
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <Card key={i}>
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
            ) : cities && cities.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {cities.map((city) => {
                  const uniCount = city.universities?.[0]?.count || 0;
                  
                  return (
                    <Link 
                      key={city.id} 
                      to={`/cities/${city.slug}`}
                      className="group"
                    >
                      <Card className="h-full hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-2 hover:border-primary/50">
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <CardTitle className="text-xl mb-2 group-hover:text-primary transition-colors">
                                {city.name}
                              </CardTitle>
                              <CardDescription className="flex items-center gap-2">
                                <MapPin className="h-4 w-4" />
                                <span>{city.city_type || 'City'}</span>
                              </CardDescription>
                            </div>
                            <div className="bg-primary/10 p-3 rounded-lg group-hover:bg-primary/20 transition-colors">
                              <Building2 className="h-6 w-6 text-primary" />
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Building2 className="h-4 w-4" />
                              <span>{uniCount} {uniCount === 1 ? 'University' : 'Universities'}</span>
                            </div>
                            {city.population_total && (
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Users className="h-4 w-4" />
                                <span>{city.population_total.toLocaleString()} residents</span>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No cities found in this region.</p>
              </div>
            )}
          </div>
        </main>
      </div>
    </>
  );
}
