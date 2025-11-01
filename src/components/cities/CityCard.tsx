import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Building2, Users } from "lucide-react";

interface CityCardProps {
  city: {
    id: string;
    slug: string;
    name: string;
    region: string | null;
    hero_image_url?: string;
    hashtags?: string[];
    uni_count: number;
    population_total: number | null;
  };
}

export function CityCard({ city }: CityCardProps) {
  const defaultImage = `https://images.unsplash.com/photo-1467269204594-9661b134dd2b?auto=format&fit=crop&w=800&q=80`;
  
  return (
    <Link to={`/cities/${city.slug}`}>
      <Card className="group overflow-hidden hover:shadow-2xl transition-all duration-300 h-full">
        {/* Hero Image */}
        <div className="relative h-64 overflow-hidden">
          <img
            src={city.hero_image_url || defaultImage}
            alt={city.name}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          />
          
          {/* Dark Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/30 to-black/70" />
          
          {/* City Name Overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-6">
            <div className="flex items-center gap-2 text-white/90 text-sm mb-2">
              <MapPin className="h-4 w-4" />
              <span>{city.region || 'Germany'}</span>
            </div>
            <h3 className="text-2xl font-bold text-white mb-3 group-hover:text-primary-foreground transition-colors">
              {city.name}
            </h3>
            
            {/* Hashtags */}
            {city.hashtags && city.hashtags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {city.hashtags.slice(0, 3).map((tag, index) => (
                  <Badge 
                    key={index} 
                    variant="secondary" 
                    className="text-xs bg-white/20 text-white border-white/30 hover:bg-white/30"
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>
        
        {/* Info Footer */}
        <div className="p-4 bg-muted/30">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Building2 className="h-4 w-4" />
              <span>{city.uni_count} {city.uni_count === 1 ? 'University' : 'Universities'}</span>
            </div>
            {city.population_total && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Users className="h-4 w-4" />
                <span>{(city.population_total / 1000).toFixed(0)}K</span>
              </div>
            )}
          </div>
        </div>
      </Card>
    </Link>
  );
}