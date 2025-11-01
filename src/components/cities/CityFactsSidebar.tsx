import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, GraduationCap, Building2, MapPin } from "lucide-react";

interface CityFactsSidebarProps {
  population?: number;
  populationYear?: string;
  studentCount?: number;
  universityCount: number;
  region?: string;
}

export function CityFactsSidebar({ 
  population, 
  populationYear,
  studentCount, 
  universityCount,
  region 
}: CityFactsSidebarProps) {
  return (
    <Card className="sticky top-24 shadow-lg">
      <CardHeader>
        <CardTitle className="text-xl">Facts</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Population */}
        {population && (
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{population.toLocaleString()}</p>
              <p className="text-sm text-muted-foreground">
                Inhabitants {populationYear && `¹ (${populationYear})`}
              </p>
            </div>
          </div>
        )}
        
        {/* Students */}
        {studentCount && (
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-secondary/10">
              <GraduationCap className="h-5 w-5 text-secondary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{studentCount.toLocaleString()}</p>
              <p className="text-sm text-muted-foreground">Students ²</p>
            </div>
          </div>
        )}
        
        {/* Universities */}
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-accent/10">
            <Building2 className="h-5 w-5 text-accent" />
          </div>
          <div>
            <p className="text-2xl font-bold">{universityCount}</p>
            <p className="text-sm text-muted-foreground">
              Higher Education {universityCount === 1 ? 'Institution' : 'Institutions'} ²
            </p>
          </div>
        </div>
        
        {/* Region */}
        {region && (
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <MapPin className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-lg font-semibold">{region}</p>
              <p className="text-sm text-muted-foreground">Region</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}