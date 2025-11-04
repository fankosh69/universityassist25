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
