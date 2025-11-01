import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Home, Euro, Users } from "lucide-react";

interface AccommodationOption {
  type: string;
  priceRange: string;
  description: string;
}

interface StudentLifeSectionProps {
  accommodationOptions?: AccommodationOption[];
  studentOrganizations?: string[];
  clubs?: string[];
}

export function StudentLifeSection({
  accommodationOptions,
  studentOrganizations,
  clubs,
}: StudentLifeSectionProps) {
  return (
    <div className="space-y-6">
      {/* Accommodation */}
      {accommodationOptions && accommodationOptions.length > 0 && (
        <div>
          <h3 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-2">
            <Home className="h-6 w-6 text-primary" />
            Accommodation Options
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {accommodationOptions.map((option, index) => (
              <Card key={index} className="p-6 hover:shadow-lg transition-shadow">
                <div className="text-xl font-semibold text-foreground mb-2">
                  {option.type}
                </div>
                <div className="flex items-center gap-2 text-primary font-bold mb-3">
                  <Euro className="h-5 w-5" />
                  <span>{option.priceRange}</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {option.description}
                </p>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Student Organizations */}
      {studentOrganizations && studentOrganizations.length > 0 && (
        <Card className="p-6">
          <h3 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
            <Users className="h-5 w-5 text-secondary" />
            Student Organizations
          </h3>
          <div className="flex flex-wrap gap-2">
            {studentOrganizations.map((org, index) => (
              <Badge key={index} variant="secondary" className="text-sm py-1.5 px-3">
                {org}
              </Badge>
            ))}
          </div>
        </Card>
      )}

      {/* Clubs & Societies */}
      {clubs && clubs.length > 0 && (
        <Card className="p-6">
          <h3 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
            🎭 Clubs & Societies
          </h3>
          <div className="flex flex-wrap gap-2">
            {clubs.map((club, index) => (
              <Badge key={index} variant="outline" className="text-sm py-1.5 px-3">
                {club}
              </Badge>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
