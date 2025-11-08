import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { Building2, MapPin, GraduationCap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { InstitutionTypeBadge } from "@/components/InstitutionTypeBadge";

interface UniversityCardProps {
  university: {
    id: string;
    name: string;
    slug: string;
    type?: string;
    control_type?: string;
    city?: string;
    hero_image_url?: string;
    logo_url?: string;
    campuses?: Array<{
      id: string;
      name: string | null;
      is_main_campus: boolean;
      address?: string | null;
    }>;
  };
}

export function UniversityCard({ university }: UniversityCardProps) {
  return (
    <Link to={`/universities/${university.slug}`} className="group block">
      <Card className="h-full hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-2 hover:border-primary/50 overflow-hidden">
        {/* Image Section */}
        {university.hero_image_url ? (
          <div className="relative h-48 overflow-hidden">
            <img
              src={university.hero_image_url}
              alt={university.name}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
            
            {/* Logo Overlay */}
            {university.logo_url && (
              <div className="absolute top-2 right-2 bg-white/95 backdrop-blur-sm p-2 rounded-lg shadow-lg">
                <img
                  src={university.logo_url}
                  alt={`${university.name} logo`}
                  className="h-12 w-12 object-contain"
                />
              </div>
            )}
            
            {/* Type Badge Overlay */}
            {university.type && (
              <div className="absolute bottom-2 left-2">
                <InstitutionTypeBadge type={university.type} />
              </div>
            )}
          </div>
        ) : (
          <div className="relative h-48 bg-gradient-to-br from-primary/20 via-secondary/20 to-accent/20 flex items-center justify-center">
            {university.logo_url ? (
              <img
                src={university.logo_url}
                alt={`${university.name} logo`}
                className="h-32 w-32 object-contain"
              />
            ) : (
              <Building2 className="h-16 w-16 text-primary/40" />
            )}
            
            {university.type && (
              <div className="absolute bottom-2 left-2">
                <InstitutionTypeBadge type={university.type} />
              </div>
            )}
          </div>
        )}

        <CardHeader>
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <CardTitle className="text-lg mb-2 group-hover:text-primary transition-colors line-clamp-2">
                {university.name}
              </CardTitle>
              {university.city && (
                <CardDescription className="flex items-center gap-2">
                  <MapPin className="h-3 w-3 flex-shrink-0" />
                  <span className="truncate">{university.city}</span>
                </CardDescription>
              )}
            </div>
            <div className="bg-primary/10 p-2 rounded-lg group-hover:bg-primary/20 transition-colors flex-shrink-0">
              <GraduationCap className="h-5 w-5 text-primary" />
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="space-y-2">
            <div className="text-sm text-muted-foreground">
              {university.control_type && (
                <span className="capitalize">{university.control_type} Institution</span>
              )}
            </div>
            
            {/* Campus Badges */}
            {university.campuses && university.campuses.length > 0 && (
              <div className="flex flex-wrap gap-1 pt-2">
                {university.campuses.length > 1 ? (
                  <Badge variant="secondary" className="text-xs">
                    {university.campuses.length} Campuses in City
                  </Badge>
                ) : university.campuses[0].name ? (
                  <Badge variant="outline" className="text-xs">
                    {university.campuses[0].name}
                  </Badge>
                ) : null}
                
                {university.campuses.some(c => c.is_main_campus) && (
                  <Badge variant="default" className="text-xs">
                    Main Campus Here
                  </Badge>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
