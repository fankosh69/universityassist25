import { Card } from "@/components/ui/card";
import { 
  BookOpen, 
  FlaskConical, 
  Trophy, 
  Coffee, 
  Briefcase, 
  Globe2, 
  Users,
  Library
} from "lucide-react";

interface FacilityData {
  libraries?: number;
  labs?: number;
  sportsCenters?: number;
  cafeterias?: number;
  studentUnion?: boolean;
  careerCenter?: boolean;
  internationalOffice?: boolean;
}

interface FacilitiesGridProps {
  facilities: FacilityData;
  studentOrganizations?: number;
}

export function FacilitiesGrid({ facilities, studentOrganizations }: FacilitiesGridProps) {
  const facilityItems = [
    {
      icon: Library,
      label: "Libraries",
      value: facilities.libraries,
      color: "text-primary",
    },
    {
      icon: FlaskConical,
      label: "Research Labs",
      value: facilities.labs,
      color: "text-secondary",
    },
    {
      icon: Trophy,
      label: "Sports Centers",
      value: facilities.sportsCenters,
      color: "text-accent",
    },
    {
      icon: Coffee,
      label: "Cafeterias",
      value: facilities.cafeterias,
      color: "text-primary",
    },
    {
      icon: Users,
      label: "Student Organizations",
      value: studentOrganizations,
      color: "text-secondary",
    },
  ];

  const booleanFacilities = [
    {
      icon: Users,
      label: "Student Union",
      available: facilities.studentUnion,
    },
    {
      icon: Briefcase,
      label: "Career Center",
      available: facilities.careerCenter,
    },
    {
      icon: Globe2,
      label: "International Office",
      available: facilities.internationalOffice,
    },
  ];

  return (
    <div className="space-y-6">
      <h3 className="text-2xl font-bold text-foreground">
        🎯 Campus Facilities
      </h3>

      {/* Numbered Facilities */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {facilityItems.map((item, index) => {
          if (item.value === undefined || item.value === null || item.value === 0) return null;
          
          return (
            <Card key={index} className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-lg bg-muted ${item.color}`}>
                  <item.icon className="h-6 w-6" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-foreground">
                    {typeof item.value === 'number' ? item.value.toLocaleString() : item.value}
                  </div>
                  <div className="text-sm text-muted-foreground">{item.label}</div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Boolean Facilities */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {booleanFacilities.map((item, index) => {
          if (!item.available) return null;
          
          return (
            <Card key={index} className="p-4 bg-accent/5 border-accent/20">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0">
                  <item.icon className="h-4 w-4 text-accent" />
                </div>
                <span className="text-sm font-medium text-foreground">
                  {item.label}
                </span>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
