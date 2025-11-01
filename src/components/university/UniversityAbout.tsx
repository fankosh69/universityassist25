import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface UniversityAboutProps {
  description?: string;
  missionStatement?: string;
  researchAreas?: string[];
  accreditations?: string[];
  notableAlumni?: string[];
}

export function UniversityAbout({
  description,
  missionStatement,
  researchAreas,
  accreditations,
  notableAlumni,
}: UniversityAboutProps) {
  return (
    <div className="space-y-6">
      {/* Description */}
      {description && (
        <Card className="p-6">
          <h2 className="text-2xl font-bold text-foreground mb-4">
            About the University
          </h2>
          <div className="prose prose-sm max-w-none text-muted-foreground">
            {description.split('\n').map((paragraph, index) => (
              <p key={index} className="mb-4 last:mb-0">
                {paragraph}
              </p>
            ))}
          </div>
        </Card>
      )}

      {/* Mission Statement */}
      {missionStatement && (
        <Card className="p-6 bg-gradient-to-br from-primary/5 to-secondary/5 border-primary/20">
          <h3 className="text-xl font-semibold text-foreground mb-3">
            Mission Statement
          </h3>
          <p className="text-muted-foreground italic">
            "{missionStatement}"
          </p>
        </Card>
      )}

      {/* Research Areas */}
      {researchAreas && researchAreas.length > 0 && (
        <Card className="p-6">
          <h3 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
            🔬 Research Areas
          </h3>
          <div className="flex flex-wrap gap-2">
            {researchAreas.map((area, index) => (
              <Badge key={index} variant="secondary" className="text-sm py-1 px-3">
                {area}
              </Badge>
            ))}
          </div>
        </Card>
      )}

      {/* Accreditations */}
      {accreditations && accreditations.length > 0 && (
        <Card className="p-6">
          <h3 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
            🏆 Accreditations & Recognition
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {accreditations.map((accreditation, index) => (
              <div key={index} className="flex items-center gap-2 text-sm">
                <div className="w-2 h-2 rounded-full bg-accent flex-shrink-0" />
                <span className="text-muted-foreground">{accreditation}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Notable Alumni */}
      {notableAlumni && notableAlumni.length > 0 && (
        <Card className="p-6">
          <h3 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
            ⭐ Notable Alumni
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {notableAlumni.map((alumni, index) => (
              <div key={index} className="flex items-center gap-2 text-sm">
                <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
                <span className="text-muted-foreground">{alumni}</span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
