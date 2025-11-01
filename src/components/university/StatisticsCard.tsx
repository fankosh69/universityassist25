import { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";

interface StatisticsCardProps {
  icon: LucideIcon;
  value: string | number;
  label: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  color?: "primary" | "secondary" | "accent";
}

export function StatisticsCard({
  icon: Icon,
  value,
  label,
  trend,
  color = "primary",
}: StatisticsCardProps) {
  const colorClasses = {
    primary: "text-primary bg-primary/10",
    secondary: "text-secondary bg-secondary/10",
    accent: "text-accent bg-accent/10",
  };

  return (
    <Card className="p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className={`inline-flex p-3 rounded-lg ${colorClasses[color]} mb-3`}>
            <Icon className="h-6 w-6" />
          </div>
          <div className="text-3xl font-bold text-foreground mb-1">
            {typeof value === 'number' ? value.toLocaleString() : value}
          </div>
          <div className="text-sm text-muted-foreground">{label}</div>
        </div>
        {trend && (
          <div className={`text-sm font-semibold ${trend.isPositive ? 'text-accent' : 'text-destructive'}`}>
            {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
          </div>
        )}
      </div>
    </Card>
  );
}
