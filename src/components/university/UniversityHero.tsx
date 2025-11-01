import { MapPin, Globe, Heart, Download, Video, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface UniversityHeroProps {
  name: string;
  city: string;
  region?: string;
  website?: string;
  logoUrl?: string;
  heroImageUrl?: string;
  quickFacts: {
    founded?: number;
    students?: number;
    internationalPercentage?: number;
    qsRank?: number;
    programsCount?: number;
    campusesCount?: number;
  };
  onSave?: () => void;
  isSaved?: boolean;
  virtualTourUrl?: string;
}

export function UniversityHero({
  name,
  city,
  region,
  website,
  logoUrl,
  heroImageUrl,
  quickFacts,
  onSave,
  isSaved,
  virtualTourUrl,
}: UniversityHeroProps) {
  return (
    <div className="relative w-full">
      {/* Hero Image */}
      <div 
        className="relative h-[400px] w-full bg-gradient-to-br from-primary/20 via-secondary/20 to-accent/20 overflow-hidden"
        style={heroImageUrl ? {
          backgroundImage: `linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.4)), url(${heroImageUrl})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        } : undefined}
      >
        {/* Overlay Content */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="container mx-auto px-4 md:px-6">
            <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
              {/* Logo */}
              {logoUrl && (
                <div className="w-24 h-24 md:w-32 md:h-32 bg-white rounded-2xl shadow-lg p-4 flex items-center justify-center flex-shrink-0">
                  <img src={logoUrl} alt={`${name} logo`} className="w-full h-full object-contain" />
                </div>
              )}

              {/* University Info */}
              <div className="flex-1 text-center md:text-left">
                <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-3">
                  {name}
                </h1>
                <div className="flex items-center justify-center md:justify-start gap-4 text-white/90 mb-6">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    <span className="text-lg">
                      {city}{region && `, ${region}`}
                    </span>
                  </div>
                  {website && (
                    <a 
                      href={website.startsWith('http') ? website : `https://${website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 hover:text-white transition-colors"
                    >
                      <Globe className="h-5 w-5" />
                      <span className="text-lg">{website.replace(/^https?:\/\/(www\.)?/, '')}</span>
                    </a>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                  <Button size="lg" className="bg-accent hover:bg-accent/90 text-white">
                    Apply Now
                  </Button>
                  <Button size="lg" variant="outline" className="bg-white/10 border-white/30 text-white hover:bg-white/20">
                    <Download className="h-4 w-4 mr-2" />
                    Download Brochure
                  </Button>
                  {virtualTourUrl && (
                    <Button 
                      size="lg" 
                      variant="outline" 
                      className="bg-white/10 border-white/30 text-white hover:bg-white/20"
                      asChild
                    >
                      <a href={virtualTourUrl} target="_blank" rel="noopener noreferrer">
                        <Video className="h-4 w-4 mr-2" />
                        Virtual Tour
                      </a>
                    </Button>
                  )}
                  <Button
                    size="lg"
                    variant="outline"
                    className="bg-white/10 border-white/30 text-white hover:bg-white/20"
                    onClick={onSave}
                  >
                    <Heart className={`h-4 w-4 ${isSaved ? 'fill-current' : ''}`} />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Facts Card */}
      <div className="container mx-auto px-4 md:px-6 -mt-16 relative z-10">
        <Card className="p-6 shadow-xl bg-card">
          <h3 className="text-sm font-semibold text-muted-foreground mb-4 uppercase tracking-wider">
            Quick Facts
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {quickFacts.founded && (
              <div>
                <div className="text-2xl font-bold text-primary">🎓</div>
                <div className="text-2xl font-bold text-foreground mt-1">{quickFacts.founded}</div>
                <div className="text-sm text-muted-foreground">Founded</div>
              </div>
            )}
            {quickFacts.students && (
              <div>
                <div className="text-2xl font-bold text-primary">👥</div>
                <div className="text-2xl font-bold text-foreground mt-1">
                  {quickFacts.students.toLocaleString()}
                </div>
                <div className="text-sm text-muted-foreground">Students</div>
              </div>
            )}
            {quickFacts.internationalPercentage && (
              <div>
                <div className="text-2xl font-bold text-secondary">🌍</div>
                <div className="text-2xl font-bold text-foreground mt-1">
                  {quickFacts.internationalPercentage}%
                </div>
                <div className="text-sm text-muted-foreground">International</div>
              </div>
            )}
            {quickFacts.qsRank && (
              <div>
                <div className="text-2xl font-bold text-accent">🏆</div>
                <div className="text-2xl font-bold text-foreground mt-1">#{quickFacts.qsRank}</div>
                <div className="text-sm text-muted-foreground">QS Rank</div>
              </div>
            )}
            {quickFacts.programsCount && (
              <div>
                <div className="text-2xl font-bold text-primary">📚</div>
                <div className="text-2xl font-bold text-foreground mt-1">
                  {quickFacts.programsCount}
                </div>
                <div className="text-sm text-muted-foreground">Programs</div>
              </div>
            )}
            {quickFacts.campusesCount && (
              <div>
                <div className="text-2xl font-bold text-secondary">🏘️</div>
                <div className="text-2xl font-bold text-foreground mt-1">
                  {quickFacts.campusesCount}
                </div>
                <div className="text-sm text-muted-foreground">Campuses</div>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
