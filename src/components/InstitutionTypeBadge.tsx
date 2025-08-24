import { Badge } from '@/components/ui/badge';
import { getInstitutionType, getInstitutionTypeLabel, normalizeInstitutionType } from '@/lib/institution-types';
import { useTranslation } from 'react-i18next';

interface InstitutionTypeBadgeProps {
  type: string;
  useShort?: boolean;
  className?: string;
}

export function InstitutionTypeBadge({ type, useShort = false, className = '' }: InstitutionTypeBadgeProps) {
  const { i18n } = useTranslation();
  const currentLanguage = i18n.language === 'de' ? 'de' : 'en';
  
  const normalizedType = normalizeInstitutionType(type);
  const institutionType = getInstitutionType(normalizedType);
  
  if (!institutionType) {
    return (
      <Badge variant="outline" className={className}>
        {type}
      </Badge>
    );
  }
  
  const label = getInstitutionTypeLabel(normalizedType, currentLanguage, useShort);
  
  return (
    <Badge 
      variant={institutionType.badgeVariant}
      className={`${institutionType.badgeColor} ${className}`}
      title={institutionType.description}
    >
      {label}
    </Badge>
  );
}