import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { MapPin, Building2, GraduationCap } from "lucide-react";

interface RegionCardProps {
  region: {
    id: string;
    name: string;
    slug: string;
    cityCount: number;
    totalUniversities?: number;
    heroImageUrl?: string;
    hashtags?: string[];
  };
}

export function RegionCard({ region }: RegionCardProps) {
  return (
    <Link to={`/regions/${region.slug}`} className="group block">
      <Card className="h-full hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-2 hover:border-primary/50 overflow-hidden">
        {/* Image Section */}
        {region.heroImageUrl && (
          <div className="relative h-48 overflow-hidden">
            <img
              src={region.heroImageUrl}
              alt={region.name}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
            
            {/* Hashtags Overlay */}
            {region.hashtags && region.hashtags.length > 0 && (
              <div className="absolute bottom-2 left-2 right-2 flex flex-wrap gap-1">
                {region.hashtags.slice(0, 3).map((tag, index) => (
                  <span
                    key={index}
                    className="text-xs bg-primary/90 text-primary-foreground px-2 py-1 rounded-full"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-xl mb-2 group-hover:text-primary transition-colors">
                {region.name}
              </CardTitle>
              <CardDescription className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                <span>{region.cityCount} {region.cityCount === 1 ? 'city' : 'cities'}</span>
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
              <span>
                {region.totalUniversities 
                  ? `${region.totalUniversities} universities` 
                  : 'Universities & Programs'}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
