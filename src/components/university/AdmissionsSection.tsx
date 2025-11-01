import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, FileText, Calendar, Euro, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AdmissionsSectionProps {
  generalRequirements?: string[];
  applicationProcess?: string[];
  requiredDocuments?: string[];
  applicationFee?: number;
  contactEmail?: string;
  upcomingDeadlines?: {
    intake: string;
    deadline: string;
  }[];
}

export function AdmissionsSection({
  generalRequirements,
  applicationProcess,
  requiredDocuments,
  applicationFee,
  contactEmail,
  upcomingDeadlines,
}: AdmissionsSectionProps) {
  return (
    <div className="space-y-6">
      {/* General Requirements */}
      {generalRequirements && generalRequirements.length > 0 && (
        <Card className="p-6">
          <h3 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-accent" />
            General Admission Requirements
          </h3>
          <div className="space-y-2">
            {generalRequirements.map((requirement, index) => (
              <div key={index} className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                <span className="text-sm text-muted-foreground">{requirement}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Application Process */}
      {applicationProcess && applicationProcess.length > 0 && (
        <Card className="p-6">
          <h3 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
            📋 Application Process
          </h3>
          <div className="space-y-4">
            {applicationProcess.map((step, index) => (
              <div key={index} className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
                  {index + 1}
                </div>
                <div className="flex-1 pt-1">
                  <p className="text-sm text-muted-foreground">{step}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Required Documents */}
        {requiredDocuments && requiredDocuments.length > 0 && (
          <Card className="p-6">
            <h3 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
              <FileText className="h-5 w-5 text-secondary" />
              Required Documents
            </h3>
            <div className="space-y-2">
              {requiredDocuments.map((doc, index) => (
                <div key={index} className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-accent flex-shrink-0" />
                  <span className="text-muted-foreground">{doc}</span>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Important Deadlines */}
        {upcomingDeadlines && upcomingDeadlines.length > 0 && (
          <Card className="p-6">
            <h3 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Upcoming Deadlines
            </h3>
            <div className="space-y-3">
              {upcomingDeadlines.map((deadline, index) => (
                <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <span className="text-sm font-medium text-foreground">
                    {deadline.intake}
                  </span>
                  <Badge variant="outline">
                    {deadline.deadline}
                  </Badge>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>

      {/* Application Fee & Contact */}
      <Card className="p-6 bg-gradient-to-br from-primary/5 to-secondary/5">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex-1">
            {applicationFee !== undefined && (
              <div className="mb-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                  <Euro className="h-4 w-4" />
                  <span>Application Fee</span>
                </div>
                <div className="text-2xl font-bold text-foreground">
                  {applicationFee === 0 ? "Free" : `€${applicationFee}`}
                </div>
              </div>
            )}
            {contactEmail && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="h-4 w-4" />
                <a href={`mailto:${contactEmail}`} className="hover:text-primary transition-colors">
                  {contactEmail}
                </a>
              </div>
            )}
          </div>
          <Button size="lg" className="bg-accent hover:bg-accent/90">
            Start Application
          </Button>
        </div>
      </Card>
    </div>
  );
}
