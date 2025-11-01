import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FlaskConical, Users, BookOpen, Award } from "lucide-react";

interface ResearchSectionProps {
  researchAreas?: string[];
  partnerships?: string[];
  researchOutput?: {
    publications?: number;
    patents?: number;
    grants?: number;
  };
  notableProjects?: string[];
}

export function ResearchSection({
  researchAreas,
  partnerships,
  researchOutput,
  notableProjects,
}: ResearchSectionProps) {
  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-foreground flex items-center gap-2">
        <FlaskConical className="h-8 w-8 text-primary" />
        Research & Innovation
      </h2>

      {/* Research Output Stats */}
      {researchOutput && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {researchOutput.publications && (
            <Card className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-primary/10">
                  <BookOpen className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-foreground">
                    {researchOutput.publications.toLocaleString()}
                  </div>
                  <div className="text-sm text-muted-foreground">Publications</div>
                </div>
              </div>
            </Card>
          )}
          {researchOutput.patents && (
            <Card className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-secondary/10">
                  <Award className="h-6 w-6 text-secondary" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-foreground">
                    {researchOutput.patents.toLocaleString()}
                  </div>
                  <div className="text-sm text-muted-foreground">Patents</div>
                </div>
              </div>
            </Card>
          )}
          {researchOutput.grants && (
            <Card className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-accent/10">
                  <FlaskConical className="h-6 w-6 text-accent" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-foreground">
                    {researchOutput.grants.toLocaleString()}
                  </div>
                  <div className="text-sm text-muted-foreground">Active Grants</div>
                </div>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Research Areas */}
      {researchAreas && researchAreas.length > 0 && (
        <Card className="p-6">
          <h3 className="text-xl font-semibold text-foreground mb-4">
            🔬 Key Research Areas
          </h3>
          <div className="flex flex-wrap gap-2">
            {researchAreas.map((area, index) => (
              <Badge key={index} variant="secondary" className="text-sm py-2 px-4">
                {area}
              </Badge>
            ))}
          </div>
        </Card>
      )}

      {/* Partnerships */}
      {partnerships && partnerships.length > 0 && (
        <Card className="p-6">
          <h3 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Research Partnerships
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {partnerships.map((partner, index) => (
              <div key={index} className="flex items-center gap-2 text-sm">
                <div className="w-2 h-2 rounded-full bg-secondary flex-shrink-0" />
                <span className="text-muted-foreground">{partner}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Notable Projects */}
      {notableProjects && notableProjects.length > 0 && (
        <Card className="p-6">
          <h3 className="text-xl font-semibold text-foreground mb-4">
            🌟 Notable Research Projects
          </h3>
          <div className="space-y-3">
            {notableProjects.map((project, index) => (
              <div key={index} className="p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
                <p className="text-sm text-muted-foreground">{project}</p>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
