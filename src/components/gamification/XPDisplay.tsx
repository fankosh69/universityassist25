import { Star, TrendingUp } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface XPDisplayProps {
  currentXP: number;
  level: number;
  xpForNextLevel: number;
  showAnimation?: boolean;
}

export function XPDisplay({ currentXP, level, xpForNextLevel, showAnimation = false }: XPDisplayProps) {
  const progressPercentage = xpForNextLevel > 0 
    ? ((currentXP % 1000) / xpForNextLevel) * 100 
    : 100;

  return (
    <Card className="p-6 bg-gradient-to-br from-primary/10 to-accent/10">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
            <Star className="w-6 h-6 text-primary fill-primary" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-foreground">Level {level}</h3>
            <p className="text-sm text-muted-foreground">{currentXP.toLocaleString()} XP</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <TrendingUp className="w-4 h-4" />
          <span>{xpForNextLevel} to next level</span>
        </div>
      </div>
      <Progress value={progressPercentage} className="h-3" />
    </Card>
  );
}
