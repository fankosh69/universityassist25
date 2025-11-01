import { Flame } from "lucide-react";
import { Card } from "@/components/ui/card";

interface StreakDisplayProps {
  days: number;
}

export function StreakDisplay({ days }: StreakDisplayProps) {
  return (
    <Card className="p-6 bg-gradient-to-br from-orange-500/10 to-red-500/10">
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-orange-500/20 flex items-center justify-center">
          <Flame className="w-8 h-8 text-orange-500" />
        </div>
        <div>
          <h3 className="text-3xl font-bold text-foreground">{days} Days</h3>
          <p className="text-sm text-muted-foreground">Current Streak 🔥</p>
        </div>
      </div>
    </Card>
  );
}
