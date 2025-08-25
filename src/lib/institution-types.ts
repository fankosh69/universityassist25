interface InstitutionType {
  value: string;
  labelEn: string;
  labelDe: string;
  shortEn: string;
  shortDe: string;
  description: string;
  badgeVariant: 'default' | 'secondary' | 'outline' | 'destructive';
  badgeColor: string;
  category: 'institution' | 'control';
}

interface ControlType {
  value: string;
  labelEn: string;
  labelDe: string;
  shortEn: string;
  shortDe: string;
  description: string;
  badgeVariant: 'default' | 'secondary' | 'outline' | 'destructive';
  badgeColor: string;
}

export const INSTITUTION_TYPES: InstitutionType[] = [
  {
    value: 'university',
    labelEn: 'Universities',
    labelDe: 'Universitäten',
    shortEn: 'Uni',
    shortDe: 'Uni',
    description: 'Traditional universities focusing on academic research and theory',
    badgeVariant: 'default',
    badgeColor: 'bg-primary/10 text-primary border-primary/20',
    category: 'institution'
  },
  {
    value: 'university_applied_sciences',
    labelEn: 'Universities of Applied Sciences',
    labelDe: 'Fachhochschulen',
    shortEn: 'UAS',
    shortDe: 'FH',
    description: 'Universities focusing on practical, application-oriented education',
    badgeVariant: 'secondary',
    badgeColor: 'bg-secondary/10 text-secondary border-secondary/20',
    category: 'institution'
  },
  {
    value: 'technical_university',
    labelEn: 'Technical Universities',
    labelDe: 'Technische Universitäten',
    shortEn: 'TU',
    shortDe: 'TU',
    description: 'Universities specializing in engineering, technology, and applied sciences',
    badgeVariant: 'outline',
    badgeColor: 'bg-accent/10 text-accent border-accent/20',
    category: 'institution'
  },
  {
    value: 'art_music_university',
    labelEn: 'Art/Music Universities',
    labelDe: 'Kunst-/Musikhochschulen',
    shortEn: 'Art/Music',
    shortDe: 'Kunst/Musik',
    description: 'Specialized universities for arts, music, and creative disciplines',
    badgeVariant: 'outline',
    badgeColor: 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-800',
    category: 'institution'
  }
];

export const CONTROL_TYPES: ControlType[] = [
  {
    value: 'public',
    labelEn: 'Public',
    labelDe: 'Staatlich',
    shortEn: 'Public',
    shortDe: 'Staatl.',
    description: 'State-funded higher education institution',
    badgeVariant: 'default',
    badgeColor: 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800'
  },
  {
    value: 'private',
    labelEn: 'Private',
    labelDe: 'Privat',
    shortEn: 'Private',
    shortDe: 'Privat',
    description: 'Privately funded higher education institution',
    badgeVariant: 'outline',
    badgeColor: 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/20 dark:text-orange-300 dark:border-orange-800'
  },
  {
    value: 'church',
    labelEn: 'Church',
    labelDe: 'Kirchlich',
    shortEn: 'Church',
    shortDe: 'Kirchl.',
    description: 'Church-affiliated higher education institution',
    badgeVariant: 'outline',
    badgeColor: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800'
  }
];

export function getInstitutionType(value: string): InstitutionType | undefined {
  return INSTITUTION_TYPES.find(type => type.value === value);
}

export function getControlType(value: string): ControlType | undefined {
  return CONTROL_TYPES.find(type => type.value === value);
}

export function getInstitutionTypeLabel(value: string, language: 'en' | 'de' = 'en', useShort: boolean = false): string {
  const type = getInstitutionType(value);
  if (!type) return value;
  
  if (useShort) {
    return language === 'de' ? type.shortDe : type.shortEn;
  }
  
  return language === 'de' ? type.labelDe : type.labelEn;
}

export function getControlTypeLabel(value: string, language: 'en' | 'de' = 'en', useShort: boolean = false): string {
  const type = getControlType(value);
  if (!type) return value;
  
  if (useShort) {
    return language === 'de' ? type.shortDe : type.shortEn;
  }
  
  return language === 'de' ? type.labelDe : type.labelEn;
}

export function getInstitutionTypeBadgeProps(value: string) {
  const type = getInstitutionType(value);
  if (!type) return { variant: 'outline' as const, className: '' };
  
  return {
    variant: type.badgeVariant,
    className: type.badgeColor
  };
}

export function getControlTypeBadgeProps(value: string) {
  const type = getControlType(value);
  if (!type) return { variant: 'outline' as const, className: '' };
  
  return {
    variant: type.badgeVariant,
    className: type.badgeColor
  };
}

// Legacy support for existing data
export function normalizeInstitutionType(rawType: string): string {
  const normalized = rawType?.toLowerCase().trim();
  
  switch (normalized) {
    case 'universität':
    case 'university':
      return 'university';
    case 'technical':
    case 'technische universität':
    case 'technical university':
    case 'tu':
      return 'technical_university';
    case 'fachhochschule':
    case 'fh':
    case 'university of applied sciences':
    case 'uas':
    case 'universities of applied sciences/haw':
      return 'university_of_applied_sciences';
    case 'art':
    case 'music':
    case 'kunst':
    case 'musikhochschule':
    case 'art university':
    case 'music university':
    case 'colleges of the arts':
      return 'art_music_university';
    default:
      return normalized || 'university';
  }
}

export function normalizeControlType(rawType: string): string {
  const normalized = rawType?.toLowerCase().trim();
  
  switch (normalized) {
    case 'public':
    case 'state':
    case 'under public law':
    case 'staatlich':
      return 'public';
    case 'private':
    case 'private, state-approved':
    case 'privat':
      return 'private';
    case 'church':
    case 'church, state-approved':
    case 'kirchlich':
      return 'church';
    default:
      return normalized || 'public';
  }
}