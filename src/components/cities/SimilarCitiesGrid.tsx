import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface SimilarCity {
  id: string;
  name: string;
  slug: string;
  region: string;
  hero_image_url?: string;
  hashtags?: string[];
}

interface SimilarCitiesGridProps {
  cities: SimilarCity[];
  currentCityId: string;
}

export function SimilarCitiesGrid({ cities, currentCityId }: SimilarCitiesGridProps) {
  const filteredCities = cities.filter(city => city.id !== currentCityId).slice(0, 4);
  
  if (filteredCities.length === 0) return null;

  return (
    <div className="my-16">
      <h2 className="text-3xl font-bold mb-8">CITIES SIMILAR TO THIS ONE</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {filteredCities.map((city) => (
          <Link key={city.id} to={`/cities/${city.slug}`}>
            <Card className="group overflow-hidden hover:shadow-xl transition-all duration-300">
              {/* City Image */}
              <div className="relative h-48 overflow-hidden">
                <img
                  src={city.hero_image_url || `https://images.unsplash.com/photo-1467269204594-9661b134dd2b?auto=format&fit=crop&w=600&q=80`}
                  alt={city.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <p className="text-sm text-white/80 mb-1">{city.region}</p>
                  <h3 className="text-xl font-bold text-white">{city.name}</h3>
                </div>
              </div>
              
              {/* Hashtags */}
              {city.hashtags && city.hashtags.length > 0 && (
                <CardContent className="p-4">
                  <div className="flex flex-wrap gap-2">
                    {city.hashtags.slice(0, 3).map((tag, index) => (
                      <Badge 
                        key={index} 
                        variant="secondary" 
                        className="text-xs"
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              )}
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}