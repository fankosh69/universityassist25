import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { InstitutionTypeBadge } from "@/components/InstitutionTypeBadge";
import { ControlTypeBadge } from "@/components/ControlTypeBadge";
import { MapPin, GraduationCap, Users, Globe, Trophy, Heart } from "lucide-react";

interface UniversityCardProps {
  university: {
    id: string;
    name: string;
    city: string;
    slug: string;
    type?: string;
    control_type?: string;
    logo_url?: string;
    website?: string;
    program_count?: number;
    student_count?: number;
    international_student_percentage?: number;
    ranking?: number;
    founded_year?: number;
  };
  variant?: "grid" | "list";
}

export function UniversityCard({ university, variant = "grid" }: UniversityCardProps) {
  if (variant === "list") {
    return (
      <Card className="hover:shadow-lg transition-shadow group">
        <CardContent className="p-6">
          <div className="flex items-start gap-6">
            {university.logo_url && (
              <div className="flex-shrink-0">
                <img 
                  src={university.logo_url} 
                  alt={`${university.name} logo`}
                  className="w-20 h-20 object-contain rounded-lg bg-card p-2 border"
                  loading="lazy"
                />
              </div>
            )}
            
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex-1">
                  <h3 className="text-xl font-bold group-hover:text-primary transition-colors mb-2">
                    {university.name}
                  </h3>
                  <div className="flex items-center gap-2 text-muted-foreground mb-3">
                    <MapPin className="h-4 w-4 flex-shrink-0" />
                    <Link 
                      to={`/cities/${university.city.toLowerCase().replace(/\s+/g, '-')}`}
                      className="text-sm hover:text-primary transition-colors"
                    >
                      {university.city}
                    </Link>
                    {university.founded_year && (
                      <span className="text-sm">• Founded {university.founded_year}</span>
                    )}
                  </div>
                </div>
                
                <Button variant="ghost" size="icon">
                  <Heart className="h-5 w-5" />
                </Button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                {university.ranking && (
                  <div className="flex items-center gap-2">
                    <Trophy className="h-4 w-4 text-accent" />
                    <span className="text-sm font-semibold">QS #{university.ranking}</span>
                  </div>
                )}
                {university.student_count && (
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-secondary" />
                    <span className="text-sm">{university.student_count.toLocaleString()} students</span>
                  </div>
                )}
                {university.international_student_percentage && (
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-primary" />
                    <span className="text-sm">{university.international_student_percentage}% intl</span>
                  </div>
                )}
                {university.program_count && university.program_count > 0 && (
                  <div className="flex items-center gap-2">
                    <GraduationCap className="h-4 w-4 text-primary" />
                    <span className="text-sm">{university.program_count} programs</span>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap gap-2 mb-4">
                {university.type && <InstitutionTypeBadge type={university.type} useShort />}
                {university.control_type && <ControlTypeBadge type={university.control_type} useShort />}
              </div>

              <div className="flex gap-2">
                <Link to={`/universities/${university.slug}`} className="flex-1">
                  <Button className="w-full">View Details</Button>
                </Link>
                {university.website && (
                  <Button variant="outline" asChild>
                    <a href={university.website} target="_blank" rel="noopener noreferrer">
                      <Globe className="h-4 w-4 mr-2" />
                      Website
                    </a>
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Grid variant
  return (
    <Card className="hover:shadow-lg transition-shadow group h-full flex flex-col">
      <CardHeader className="flex-1">
        <div className="flex items-start justify-between gap-2 mb-3">
          {university.logo_url && (
            <div className="flex-shrink-0">
              <img 
                src={university.logo_url} 
                alt={`${university.name} logo`}
                className="w-16 h-16 object-contain rounded-lg bg-card p-2 border"
                loading="lazy"
              />
            </div>
          )}
          <Button variant="ghost" size="icon" className="flex-shrink-0">
            <Heart className="h-4 w-4" />
          </Button>
        </div>
        
        <h3 className="text-lg font-bold group-hover:text-primary transition-colors mb-2 line-clamp-2">
          {university.name}
        </h3>
        
        <div className="flex items-center gap-2 text-muted-foreground mb-3">
          <MapPin className="h-4 w-4 flex-shrink-0" />
          <Link 
            to={`/cities/${university.city.toLowerCase().replace(/\s+/g, '-')}`}
            className="text-sm hover:text-primary transition-colors"
          >
            {university.city}
          </Link>
        </div>

        <div className="space-y-2 mb-3">
          {university.ranking && (
            <div className="flex items-center gap-2 text-sm">
              <Trophy className="h-4 w-4 text-accent" />
              <span className="font-semibold">QS Rank #{university.ranking}</span>
            </div>
          )}
          {university.student_count && (
            <div className="flex items-center gap-2 text-sm">
              <Users className="h-4 w-4 text-secondary" />
              <span>{university.student_count.toLocaleString()} students</span>
            </div>
          )}
          {university.international_student_percentage && (
            <div className="flex items-center gap-2 text-sm">
              <Globe className="h-4 w-4 text-primary" />
              <span>{university.international_student_percentage}% international</span>
            </div>
          )}
          {university.program_count && university.program_count > 0 && (
            <div className="flex items-center gap-2 text-sm">
              <GraduationCap className="h-4 w-4 text-primary" />
              <span>{university.program_count} programs</span>
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          {university.type && <InstitutionTypeBadge type={university.type} useShort />}
          {university.control_type && <ControlTypeBadge type={university.control_type} useShort />}
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <Link to={`/universities/${university.slug}`}>
          <Button className="w-full">View Details</Button>
        </Link>
      </CardContent>
    </Card>
  );
}
