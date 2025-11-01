import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Lightbulb } from "lucide-react";

interface RegionHighlightsCardProps {
  highlights?: string;
}

export function RegionHighlightsCard({ highlights }: RegionHighlightsCardProps) {
  if (!highlights) return null;

  return (
    <Card className="sticky top-24">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-accent" />
          Regional Highlights
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="prose prose-sm dark:prose-invert">
          {highlights.split('\n\n').map((section, index) => (
            <p key={index} className="text-sm leading-relaxed mb-3 last:mb-0">
              {section}
            </p>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
