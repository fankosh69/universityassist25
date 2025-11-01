import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Building2, Users, Bus } from "lucide-react";

interface CampusCardProps {
  name: string;
  address?: string;
  city: string;
  isMainCampus?: boolean;
  description?: string;
  studentCount?: number;
  buildingCount?: number;
  faculties?: string[];
  photoUrl?: string;
  transport?: {
    type: string;
    line: string;
    stop: string;
  }[];
  onViewPhotos?: () => void;
}

export function CampusCard({
  name,
  address,
  city,
  isMainCampus,
  description,
  studentCount,
  buildingCount,
  faculties,
  photoUrl,
  transport,
  onViewPhotos,
}: CampusCardProps) {
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      {/* Campus Photo */}
      {photoUrl && (
        <div className="relative h-48 w-full overflow-hidden">
          <img 
            src={photoUrl} 
            alt={name} 
            className="w-full h-full object-cover"
          />
          {isMainCampus && (
            <Badge className="absolute top-3 right-3 bg-primary">
              Main Campus
            </Badge>
          )}
        </div>
      )}

      <div className="p-6">
        {/* Campus Name */}
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="text-xl font-bold text-foreground mb-1">
              🏛️ {name}
            </h3>
            {address && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span>{address}, {city}</span>
              </div>
            )}
          </div>
          {onViewPhotos && (
            <Button size="sm" variant="outline" onClick={onViewPhotos}>
              📸 Photos
            </Button>
          )}
        </div>

        {/* Description */}
        {description && (
          <p className="text-sm text-muted-foreground mb-4">
            {description}
          </p>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-4 mb-4 pb-4 border-b">
          {studentCount && (
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              <div>
                <div className="text-sm font-semibold text-foreground">
                  {studentCount.toLocaleString()}
                </div>
                <div className="text-xs text-muted-foreground">Students</div>
              </div>
            </div>
          )}
          {buildingCount && (
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-secondary" />
              <div>
                <div className="text-sm font-semibold text-foreground">
                  {buildingCount}
                </div>
                <div className="text-xs text-muted-foreground">Buildings</div>
              </div>
            </div>
          )}
        </div>

        {/* Faculties */}
        {faculties && faculties.length > 0 && (
          <div className="mb-4">
            <h4 className="text-sm font-semibold text-foreground mb-2">
              🎓 Faculties:
            </h4>
            <div className="flex flex-wrap gap-1">
              {faculties.map((faculty, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {faculty}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Transport */}
        {transport && transport.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
              <Bus className="h-4 w-4" />
              Public Transport:
            </h4>
            <div className="space-y-1">
              {transport.map((t, index) => (
                <div key={index} className="text-xs text-muted-foreground">
                  {t.type} {t.line} - {t.stop}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
