import { Badge } from "@/components/ui/badge";
import { CheckCircle2 } from "lucide-react";

interface AccreditationsBadgesProps {
  accreditations: string[];
  variant?: "default" | "detailed";
}

export function AccreditationsBadges({ 
  accreditations, 
  variant = "default" 
}: AccreditationsBadgesProps) {
  if (!accreditations || accreditations.length === 0) {
    return null;
  }

  if (variant === "detailed") {
    return (
      <div className="space-y-3">
        {accreditations.map((accreditation, index) => (
          <div 
            key={index} 
            className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
          >
            <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0">
              <CheckCircle2 className="h-5 w-5 text-accent" />
            </div>
            <span className="text-sm font-medium text-foreground">
              {accreditation}
            </span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {accreditations.map((accreditation, index) => (
        <Badge 
          key={index} 
          variant="secondary" 
          className="px-3 py-1.5 text-sm font-medium"
        >
          <CheckCircle2 className="h-3 w-3 mr-1.5 text-accent" />
          {accreditation}
        </Badge>
      ))}
    </div>
  );
}
