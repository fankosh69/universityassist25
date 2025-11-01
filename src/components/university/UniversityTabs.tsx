import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { 
  BookOpen, 
  GraduationCap, 
  Users, 
  FlaskConical, 
  Trophy, 
  MapPin, 
  Mail 
} from "lucide-react";

interface UniversityTabsProps {
  programsCount?: number;
  children: {
    overview: React.ReactNode;
    programs: React.ReactNode;
    admissions: React.ReactNode;
    studentLife: React.ReactNode;
    research: React.ReactNode;
    rankings: React.ReactNode;
    campuses: React.ReactNode;
    contact: React.ReactNode;
  };
}

export function UniversityTabs({ programsCount, children }: UniversityTabsProps) {
  return (
    <Tabs defaultValue="overview" className="w-full">
      <TabsList className="w-full flex flex-wrap justify-start gap-2 h-auto p-2 bg-muted/50">
        <TabsTrigger value="overview" className="flex items-center gap-2">
          <BookOpen className="h-4 w-4" />
          Overview
        </TabsTrigger>
        <TabsTrigger value="programs" className="flex items-center gap-2">
          <GraduationCap className="h-4 w-4" />
          Programs {programsCount && `(${programsCount})`}
        </TabsTrigger>
        <TabsTrigger value="admissions" className="flex items-center gap-2">
          <GraduationCap className="h-4 w-4" />
          Admissions
        </TabsTrigger>
        <TabsTrigger value="studentLife" className="flex items-center gap-2">
          <Users className="h-4 w-4" />
          Student Life
        </TabsTrigger>
        <TabsTrigger value="research" className="flex items-center gap-2">
          <FlaskConical className="h-4 w-4" />
          Research
        </TabsTrigger>
        <TabsTrigger value="rankings" className="flex items-center gap-2">
          <Trophy className="h-4 w-4" />
          Rankings
        </TabsTrigger>
        <TabsTrigger value="campuses" className="flex items-center gap-2">
          <MapPin className="h-4 w-4" />
          Campuses
        </TabsTrigger>
        <TabsTrigger value="contact" className="flex items-center gap-2">
          <Mail className="h-4 w-4" />
          Contact
        </TabsTrigger>
      </TabsList>

      <TabsContent value="overview" className="mt-6">
        {children.overview}
      </TabsContent>

      <TabsContent value="programs" className="mt-6">
        {children.programs}
      </TabsContent>

      <TabsContent value="admissions" className="mt-6">
        {children.admissions}
      </TabsContent>

      <TabsContent value="studentLife" className="mt-6">
        {children.studentLife}
      </TabsContent>

      <TabsContent value="research" className="mt-6">
        {children.research}
      </TabsContent>

      <TabsContent value="rankings" className="mt-6">
        {children.rankings}
      </TabsContent>

      <TabsContent value="campuses" className="mt-6">
        {children.campuses}
      </TabsContent>

      <TabsContent value="contact" className="mt-6">
        {children.contact}
      </TabsContent>
    </Tabs>
  );
}
