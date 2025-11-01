import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Award } from "lucide-react";

interface RegionFactsSidebarProps {
  funFacts?: Array<{ title: string; description: string }>;
}

export function RegionFactsSidebar({ funFacts }: RegionFactsSidebarProps) {
  if (!funFacts || funFacts.length === 0) return null;

  return (
    <Card className="sticky top-24">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Award className="h-5 w-5 text-secondary" />
          Did You Know?
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {funFacts.map((fact, index) => (
          <div key={index} className="border-l-2 border-primary pl-4">
            <h4 className="font-semibold text-sm mb-1">{fact.title}</h4>
            <p className="text-sm text-muted-foreground">{fact.description}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
