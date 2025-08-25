import { Badge } from '@/components/ui/badge';
import { getControlType, getControlTypeLabel, normalizeControlType } from '@/lib/institution-types';
import { useTranslation } from 'react-i18next';

interface ControlTypeBadgeProps {
  type: string;
  useShort?: boolean;
  className?: string;
}

export function ControlTypeBadge({ type, useShort = false, className = '' }: ControlTypeBadgeProps) {
  const { i18n } = useTranslation();
  const currentLanguage = i18n.language === 'de' ? 'de' : 'en';
  
  const normalizedType = normalizeControlType(type);
  const controlType = getControlType(normalizedType);
  
  if (!controlType) {
    return (
      <Badge variant="outline" className={className}>
        {type}
      </Badge>
    );
  }
  
  const label = getControlTypeLabel(normalizedType, currentLanguage, useShort);
  
  return (
    <Badge 
      variant={controlType.badgeVariant}
      className={`${controlType.badgeColor} ${className}`}
      title={controlType.description}
    >
      {label}
    </Badge>
  );
}