import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, Building2, Users, ArrowLeft } from "lucide-react";
import SEOHead from "@/components/SEOHead";
import { Skeleton } from "@/components/ui/skeleton";
import { RegionHero } from "@/components/regions/RegionHero";
import { RegionWelcomeSection } from "@/components/regions/RegionWelcomeSection";
import { RegionHighlightsCard } from "@/components/regions/RegionHighlightsCard";
import { RegionGallery } from "@/components/regions/RegionGallery";
import { RegionFactsSidebar } from "@/components/regions/RegionFactsSidebar";
import { PageHeader } from "@/components/PageHeader";
import { BackToTop } from "@/components/BackToTop";

export default function RegionDetail() {
  const { slug } = useParams<{ slug: string }>();

  const { data: region, isLoading: regionLoading } = useQuery({
    queryKey: ["region", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("regions")
        .select("*")
        .eq("slug", slug)
        .single();
      
      if (error) throw error;
      return {
        ...data,
        gallery_images: data.gallery_images as any,
        fun_facts: data.fun_facts as any,
      };
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
          universities:universities!city_id(count)
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
      
      <div className="min-h-screen bg-background">
        <Navigation />
        
        {!isLoading && region && (
          <RegionHero
            regionName={region.name}
            cityCount={cities?.length || 0}
            totalUniversities={region.total_universities}
            totalStudents={region.total_students}
            heroImageUrl={region.hero_image_url}
            hashtags={region.hashtags}
          />
        )}
        
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-7xl mx-auto">
            <PageHeader
              title={region?.name || 'Region'}
              breadcrumbs={[
                { label: 'Home', href: '/' },
                { label: 'Regions', href: '/regions' },
                { label: region?.name || 'Region' }
              ]}
              backButtonLabel="Back to Regions"
              backButtonTo="/regions"
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-8">
                {!isLoading && region && (
                  <>
                    <RegionWelcomeSection regionName={region.name} welcomeText={region.welcome_text} />
                    <RegionGallery galleryImages={region.gallery_images} />
                  </>
                )}
                
                <div>
                  <h2 className="text-3xl font-bold mb-6">CITIES IN {region?.name.toUpperCase()}</h2>

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
              </div>

              <div className="space-y-6">
                {!isLoading && region && (
                  <>
                    <RegionHighlightsCard highlights={region.highlights} />
                    <RegionFactsSidebar funFacts={region.fun_facts} />
                  </>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
      
      <BackToTop />
    </>
  );
}
