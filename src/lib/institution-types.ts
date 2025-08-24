interface InstitutionType {
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
    labelEn: 'University',
    labelDe: 'Universität',
    shortEn: 'Uni',
    shortDe: 'Uni',
    description: 'Traditional universities focusing on academic research and theory',
    badgeVariant: 'default',
    badgeColor: 'bg-primary/10 text-primary border-primary/20'
  },
  {
    value: 'technical_university',
    labelEn: 'Technical University',
    labelDe: 'Technische Universität',
    shortEn: 'TU',
    shortDe: 'TU',
    description: 'Universities specializing in engineering, technology, and applied sciences',
    badgeVariant: 'secondary',
    badgeColor: 'bg-secondary/10 text-secondary border-secondary/20'
  },
  {
    value: 'university_of_applied_sciences',
    labelEn: 'University of Applied Sciences',
    labelDe: 'Fachhochschule',
    shortEn: 'UAS',
    shortDe: 'FH',
    description: 'Universities focusing on practical, application-oriented education',
    badgeVariant: 'outline',
    badgeColor: 'bg-accent/10 text-accent border-accent/20'
  },
  {
    value: 'art_music_university',
    labelEn: 'Art/Music University',
    labelDe: 'Kunst-/Musikhochschule',
    shortEn: 'Art/Music',
    shortDe: 'Kunst/Musik',
    description: 'Specialized universities for arts, music, and creative disciplines',
    badgeVariant: 'outline',
    badgeColor: 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-800'
  },
  {
    value: 'private_university',
    labelEn: 'Private University',
    labelDe: 'Private Hochschule',
    shortEn: 'Private',
    shortDe: 'Privat',
    description: 'Privately funded universities',
    badgeVariant: 'outline',
    badgeColor: 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/20 dark:text-orange-300 dark:border-orange-800'
  }
];

export function getInstitutionType(value: string): InstitutionType | undefined {
  return INSTITUTION_TYPES.find(type => type.value === value);
}

export function getInstitutionTypeLabel(value: string, language: 'en' | 'de' = 'en', useShort: boolean = false): string {
  const type = getInstitutionType(value);
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

// Legacy support for existing data
export function normalizeInstitutionType(rawType: string): string {
  const normalized = rawType?.toLowerCase().trim();
  
  switch (normalized) {
    case 'public':
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
      return 'university_of_applied_sciences';
    case 'private':
    case 'private university':
    case 'private hochschule':
      return 'private_university';
    case 'art':
    case 'music':
    case 'kunst':
    case 'musikhochschule':
    case 'art university':
    case 'music university':
      return 'art_music_university';
    default:
      return normalized || 'university';
  }
}