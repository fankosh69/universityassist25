import { Card, CardContent } from "@/components/ui/card";
import { Lightbulb } from "lucide-react";

interface CityTipsCardProps {
  tips?: string;
}

export function CityTipsCard({ tips }: CityTipsCardProps) {
  if (!tips) return null;

  return (
    <Card className="my-12 bg-gradient-to-br from-accent/10 to-secondary/10 border-accent/20">
      <CardContent className="p-8">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-full bg-accent/20">
            <Lightbulb className="h-6 w-6 text-accent" />
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-bold mb-3">Tip</h3>
            <div className="prose dark:prose-invert">
              {tips.split('\n\n').map((paragraph, index) => (
                <p key={index} className="text-base leading-relaxed mb-2 last:mb-0">
                  {paragraph}
                </p>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}