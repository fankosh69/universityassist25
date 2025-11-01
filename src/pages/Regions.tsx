import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";
import SEOHead from "@/components/SEOHead";
import { Skeleton } from "@/components/ui/skeleton";
import { RegionsHeroSection } from "@/components/regions/RegionsHeroSection";
import { RegionCard } from "@/components/regions/RegionCard";

interface Region {
  id: string;
  name: string;
  slug: string;
  country_code: string;
}

export default function Regions() {

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
      
      <div className="min-h-screen bg-background">
        <Navigation />
        <RegionsHeroSection />
        
        <main className="container mx-auto px-4 py-12">
          <div className="max-w-7xl mx-auto">

            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-64" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {regions?.map((region) => (
                  <RegionCard
                    key={region.id}
                    region={{
                      ...region,
                      cityCount: stats?.[region.id] || 0,
                    }}
                  />
                ))}
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
