import { Award, Lock } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface BadgeItem {
  id: string;
  code: string;
  title_en: string;
  icon?: string;
  earned_at?: string;
}

interface BadgeDisplayProps {
  badges: BadgeItem[];
  allBadges?: BadgeItem[];
}

export function BadgeDisplay({ badges, allBadges = [] }: BadgeDisplayProps) {
  const earnedCodes = new Set(badges.map(b => b.code));
  const displayBadges = allBadges.length > 0 ? allBadges : badges;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {displayBadges.map((badge) => {
        const isEarned = earnedCodes.has(badge.code);
        
        return (
          <Card
            key={badge.id}
            className={`p-4 text-center transition-all ${
              isEarned
                ? "bg-gradient-to-br from-accent/20 to-primary/20 border-accent"
                : "opacity-50 border-dashed"
            }`}
          >
            <div
              className={`w-16 h-16 mx-auto mb-3 rounded-full flex items-center justify-center ${
                isEarned ? "bg-accent/20" : "bg-muted"
              }`}
            >
              {isEarned ? (
                <Award className="w-8 h-8 text-accent" />
              ) : (
                <Lock className="w-8 h-8 text-muted-foreground" />
              )}
            </div>
            <h4 className="font-semibold text-sm mb-1">{badge.title_en}</h4>
            {isEarned && badge.earned_at && (
              <Badge variant="secondary" className="text-xs">
                {new Date(badge.earned_at).toLocaleDateString()}
              </Badge>
            )}
          </Card>
        );
      })}
    </div>
  );
}
