// English Language Proof Types

export type LanguageProofType = 'moi' | 'ielts_academic' | 'toefl_ibt' | 'pte_academic' | 'other';

export interface MOIDetails {
  institution: string;
  degree_program: string;
  study_period: string;
}

export interface IELTSDetails {
  overall: number;
  reading?: number;
  writing?: number;
  listening?: number;
  speaking?: number;
  test_date: string;
  certificate_number?: string;
}

export interface TOEFLDetails {
  overall: number;
  test_date: string;
  certificate_number?: string;
}

export interface PTEDetails {
  overall: number;
  test_date: string;
  certificate_number?: string;
}

export interface LanguageCertificate {
  language: string;
  proof_type: LanguageProofType;
  moi_details?: MOIDetails;
  ielts_details?: IELTSDetails;
  toefl_details?: TOEFLDetails;
  pte_details?: PTEDetails;
  verified?: boolean;
  certificate_url?: string;
}

export interface IELTSRequirement {
  required: boolean;
  overall_min: number;
  reading_min?: number;
  writing_min?: number;
  listening_min?: number;
  speaking_min?: number;
}

export interface TOEFLRequirement {
  required: boolean;
  overall_min: number;
}

export interface PTERequirement {
  required: boolean;
  overall_min: number;
}

export interface EnglishLanguageRequirements {
  accepts_moi: boolean;
  ielts_academic?: IELTSRequirement;
  toefl_ibt?: TOEFLRequirement;
  pte_academic?: PTERequirement;
}

// Language Instruction Mode Types
export type InstructionLanguageMode = 
  | 'fully_english'     // 100% English, no German needed
  | 'fully_german'      // 100% German
  | 'mostly_english'    // English with basic German required (A1/A2)
  | 'hybrid'            // 50% English / 50% German
  | 'either_or';        // Student can choose English OR German track

export type GermanCEFRLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
export type GermanCertificateType = 'Goethe' | 'TestDaF' | 'DSH' | 'telc' | 'ÖSD';

export interface GermanLanguageRequirements {
  required_level: GermanCEFRLevel | 'DSH-1' | 'DSH-2' | 'DSH-3' | 'TestDaF-3' | 'TestDaF-4' | 'TestDaF-5';
  accepts_certificates: GermanCertificateType[];
  notes?: string;
}

export interface ProgramLanguageConfig {
  instruction_mode: InstructionLanguageMode;
  german_requirements?: GermanLanguageRequirements;
  english_requirements?: EnglishLanguageRequirements;
}

// Helper to get display labels for instruction modes
export const INSTRUCTION_MODE_LABELS: Record<InstructionLanguageMode, { en: string; description: string }> = {
  fully_english: {
    en: 'Fully in English',
    description: 'All courses taught in English, no German required'
  },
  fully_german: {
    en: 'Fully in German',
    description: 'All courses taught in German'
  },
  mostly_english: {
    en: 'Mostly English (with basic German)',
    description: 'Taught in English with basic German (A1/A2) required'
  },
  hybrid: {
    en: 'Hybrid (50% English / 50% German)',
    description: 'Courses split between English and German'
  },
  either_or: {
    en: 'English or German Track',
    description: 'Student chooses to study in English OR German'
  }
};

export const GERMAN_CEFR_LEVELS: GermanCEFRLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

export const GERMAN_CERTIFICATE_TYPES: { value: GermanCertificateType; label: string }[] = [
  { value: 'Goethe', label: 'Goethe-Zertifikat' },
  { value: 'TestDaF', label: 'TestDaF' },
  { value: 'DSH', label: 'DSH (Deutsche Sprachprüfung für den Hochschulzugang)' },
  { value: 'telc', label: 'telc Deutsch' },
  { value: 'ÖSD', label: 'ÖSD (Österreichisches Sprachdiplom)' }
];
