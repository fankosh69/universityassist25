import { Badge } from '@/components/ui/badge';

interface CityTypeBadgeProps {
  type: string;
  className?: string;
}

export function CityTypeBadge({ type, className = '' }: CityTypeBadgeProps) {
  const getBadgeColor = (cityType: string) => {
    switch (cityType) {
      case 'City':
        return 'bg-primary text-primary-foreground hover:bg-primary/80'; // Blue like buttons
      case 'County':
        return 'bg-secondary text-secondary-foreground hover:bg-secondary/80'; // Mint Green
      default:
        return 'bg-muted text-muted-foreground hover:bg-muted/80';
    }
  };

  return (
    <Badge 
      className={`${getBadgeColor(type)} ${className}`}
    >
      {type}
    </Badge>
  );
}