import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { InstitutionTypeBadge } from "@/components/InstitutionTypeBadge";
import { ControlTypeBadge } from "@/components/ControlTypeBadge";
import { MapPin, GraduationCap, Users, Globe, Trophy, Heart, Building2 } from "lucide-react";
import { useState } from "react";

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

/** Build a favicon fallback URL from the university's website. */
function getFaviconUrl(website?: string): string | null {
  if (!website) return null;
  try {
    const url = website.startsWith("http") ? website : `https://${website}`;
    const host = new URL(url).hostname;
    return `https://www.google.com/s2/favicons?sz=128&domain=${host}`;
  } catch {
    return null;
  }
}

/**
 * Logo with graceful fallback chain:
 *   logo_url -> website favicon -> initials placeholder
 */
function UniversityLogo({
  name,
  logoUrl,
  website,
  size = "lg",
}: {
  name: string;
  logoUrl?: string;
  website?: string;
  size?: "md" | "lg";
}) {
  const [stage, setStage] = useState<"primary" | "favicon" | "fallback">(
    logoUrl ? "primary" : website ? "favicon" : "fallback"
  );
  const dim = size === "lg" ? "w-20 h-20" : "w-16 h-16";
  const text = size === "lg" ? "text-2xl" : "text-xl";

  const initials = name
    .replace(/[–—-]/g, " ")
    .split(/\s+/)
    .filter((w) => /^[A-Za-zÄÖÜäöüß]/.test(w))
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("") || "U";

  if (stage === "fallback") {
    return (
      <div
        className={`${dim} flex-shrink-0 rounded-lg bg-gradient-to-br from-primary/10 to-secondary/10 border flex items-center justify-center`}
        aria-label={`${name} logo placeholder`}
      >
        <span className={`${text} font-bold text-primary`}>{initials}</span>
      </div>
    );
  }

  const src = stage === "primary" ? logoUrl! : getFaviconUrl(website) || "";
  if (!src) {
    return (
      <UniversityLogo name={name} size={size} />
    );
  }
  return (
    <img
      src={src}
      alt={`${name} logo`}
      className={`${dim} flex-shrink-0 object-contain rounded-lg bg-card p-2 border`}
      loading="lazy"
      onError={() =>
        setStage((prev) => (prev === "primary" && website ? "favicon" : "fallback"))
      }
    />
  );
}

export function UniversityCard({ university, variant = "grid" }: UniversityCardProps) {
  if (variant === "list") {
    return (
      <Card className="hover:shadow-lg transition-shadow group overflow-hidden">
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-6">
            <div className="flex w-full sm:w-auto items-start justify-between gap-3">
              <UniversityLogo
                name={university.name}
                logoUrl={university.logo_url}
                website={university.website}
                size="lg"
              />
              <Button variant="ghost" size="icon" className="sm:hidden" aria-label="Save">
                <Heart className="h-5 w-5" />
              </Button>
            </div>

            <div className="flex-1 min-w-0 w-full">
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg sm:text-xl font-bold group-hover:text-primary transition-colors mb-2 break-words">
                    {university.name}
                  </h3>
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-muted-foreground">
                    <div className="inline-flex items-center gap-1.5">
                      <MapPin className="h-4 w-4 flex-shrink-0" />
                      <Link
                        to={`/cities/${university.city.toLowerCase().replace(/\s+/g, "-")}`}
                        className="text-sm hover:text-primary transition-colors"
                      >
                        {university.city}
                      </Link>
                    </div>
                    {university.founded_year && (
                      <span className="text-sm">• Founded {university.founded_year}</span>
                    )}
                  </div>
                </div>

                <Button variant="ghost" size="icon" className="hidden sm:inline-flex" aria-label="Save">
                  <Heart className="h-5 w-5" />
                </Button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                {university.ranking && (
                  <div className="flex items-center gap-2 min-w-0">
                    <Trophy className="h-4 w-4 text-accent flex-shrink-0" />
                    <span className="text-sm font-semibold truncate">QS #{university.ranking}</span>
                  </div>
                )}
                {university.student_count && (
                  <div className="flex items-center gap-2 min-w-0">
                    <Users className="h-4 w-4 text-secondary flex-shrink-0" />
                    <span className="text-sm truncate">{university.student_count.toLocaleString()} students</span>
                  </div>
                )}
                {university.international_student_percentage && (
                  <div className="flex items-center gap-2 min-w-0">
                    <Globe className="h-4 w-4 text-primary flex-shrink-0" />
                    <span className="text-sm truncate">{university.international_student_percentage}% intl</span>
                  </div>
                )}
                {university.program_count && university.program_count > 0 && (
                  <div className="flex items-center gap-2 min-w-0">
                    <GraduationCap className="h-4 w-4 text-primary flex-shrink-0" />
                    <span className="text-sm truncate">{university.program_count} programs</span>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap gap-2 mb-4">
                {university.type && <InstitutionTypeBadge type={university.type} useShort />}
                {university.control_type && <ControlTypeBadge type={university.control_type} useShort />}
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <Link to={`/universities/${university.slug}`} className="flex-1 min-w-0">
                  <Button className="w-full">View Details</Button>
                </Link>
                {university.website && (
                  <Button variant="outline" asChild className="w-full sm:w-auto">
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
          <UniversityLogo
            name={university.name}
            logoUrl={university.logo_url}
            website={university.website}
            size="md"
          />
          <Button variant="ghost" size="icon" className="flex-shrink-0" aria-label="Save">
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
