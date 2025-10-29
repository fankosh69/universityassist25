import { Button } from '@/components/ui/button';
import { Bot, Sparkles, MessageCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

interface AskAIButtonProps {
  programId: string;
  variant?: 'default' | 'outline' | 'ghost' | 'secondary';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  text?: string;
  icon?: 'bot' | 'sparkles' | 'message';
  className?: string;
}

export function AskAIButton({
  programId,
  variant = 'default',
  size = 'default',
  text = 'Ask AI About This Program',
  icon = 'sparkles',
  className,
}: AskAIButtonProps) {
  const IconComponent = icon === 'bot' ? Bot : icon === 'message' ? MessageCircle : Sparkles;

  return (
    <Button asChild variant={variant} size={size} className={className}>
      <Link to={`/ai-assistant?program_id=${programId}`}>
        <IconComponent className="h-4 w-4 mr-2" />
        {text}
      </Link>
    </Button>
  );
}
