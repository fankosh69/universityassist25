/**
 * Curriculum-Specific Eligibility Rules Engine
 * Encodes DAAD / uni-assist requirements for German university admission
 * Sources:
 *   - American Diploma: https://www.uni-assist.de/en/tools/info-country-by-country/details-country/country/us/
 *   - IGCSE/GCE: https://www.daad.de/en/studying-in-germany/requirements/gce/
 *   - IB: https://www.daad.de/en/studying-in-germany/requirements/ib-diploma/
 */

// ─── Types ──────────────────────────────────────────────────────────────────

export type EligibilityStatus =
  | 'direct_admission'
  | 'studienkolleg_required'
  | 'conditional'
  | 'private_university_only'
  | 'not_eligible';

export type AccessType =
  | 'all_subjects'
  | 'restricted_subjects'
  | 'foundation_only'
  | 'private_only'
  | 'none';

export interface EligibilityResult {
  status: EligibilityStatus;
  accessType: AccessType;
  missingRequirements: string[];
  recommendedActions: string[];
  notes: string[];
  sourceUrl?: string;
}

export interface SubjectEntry {
  name: string;
  grade?: string | number;
  planned?: boolean;
  upgrading_to_al?: boolean;
  score?: number;
}

export interface IGCSEData {
  graduated: boolean;
  current_grade?: string;
  has_taken_as_al?: boolean;
  planning_as_al?: boolean;
  as_subjects_count: number;
  as_subjects: SubjectEntry[];
  al_subjects_count: number;
  al_subjects: SubjectEntry[];
  has_university_study?: boolean;
  university_name?: string;
  university_major?: string;
  semesters_completed?: number;
  current_cgpa?: number;
}

export interface AmericanDiplomaData {
  graduated: boolean;
  current_grade?: string;
  gpa_unweighted?: number;
  gpa_scale?: number;
  ap_exams_taken: boolean;
  ap_subjects: SubjectEntry[];
  ap_subjects_planned: SubjectEntry[];
  has_sat: boolean;
  sat_score?: number;
  has_act?: boolean;
  act_score?: number;
  has_university_study?: boolean;
  university_name?: string;
  university_major?: string;
  semesters_completed?: number;
  current_cgpa?: number;
}

export interface IBData {
  graduated: boolean;
  current_grade?: string;
  predicted_total?: number;
  hl_subjects: SubjectEntry[];
  sl_subjects: SubjectEntry[];
  math_level: 'AA_HL' | 'AA_SL' | 'AI_HL' | 'AI_SL' | '';
  has_university_study?: boolean;
  university_name?: string;
  university_major?: string;
  semesters_completed?: number;
  current_cgpa?: number;
}

export interface NationalDiplomaData {
  graduated: boolean;
  current_grade?: string;
  subject_focus?: 'scientific_science' | 'scientific_math' | 'literary';
  grade_10_percentage?: number;
  grade_11_percentage?: number;
  has_university_study?: boolean;
  university_name?: string;
  university_major?: string;
  semesters_completed?: number;
  current_cgpa?: number;
}

export interface CanadianDiplomaData {
  graduated: boolean;
  territory: 'ontario' | 'british_columbia' | '';
  // Ontario
  has_12_general_courses?: boolean;
  has_6_upcs?: boolean;
  upcs_include_required?: boolean;
  upc_average?: number;
  // BC
  has_13_courses?: boolean;
  bc_includes_required?: boolean;
  bc_average_grade?: string;
  has_university_study?: boolean;
  university_name?: string;
  university_major?: string;
  semesters_completed?: number;
  current_cgpa?: number;
}

// ─── AP Subject Categories ──────────────────────────────────────────────────

const AP_MATH = ['Calculus AB', 'Calculus BC'];
const AP_SCIENCE = ['Biology', 'Chemistry', 'Physics C: Mechanics', 'Physics C: Electricity and Magnetism'];
const AP_LANGUAGE = ['French', 'Spanish', 'Latin', 'German', 'English Literature', 'English Language and Composition'];
const AP_ENGLISH = ['English Literature', 'English Language and Composition'];
const AP_FOREIGN_LANGUAGE = ['French', 'Spanish', 'Latin', 'German'];
const AP_FURTHER = ['European History', 'American History', 'Computer Science A', 'Macroeconomics', 'Microeconomics'];

function hasAPSubjectInCategory(subjects: SubjectEntry[], category: string[], minScore = 3): boolean {
  return subjects.some(s => category.includes(s.name) && (s.score == null || s.score >= minScore));
}

function countMacroMicro(subjects: SubjectEntry[], minScore = 3): boolean {
  const hasMacro = subjects.some(s => s.name === 'Macroeconomics' && (s.score == null || s.score >= minScore));
  const hasMicro = subjects.some(s => s.name === 'Microeconomics' && (s.score == null || s.score >= minScore));
  return hasMacro && hasMicro;
}

function checkAPForSTEM(subjects: SubjectEntry[]): boolean {
  const hasMath = hasAPSubjectInCategory(subjects, AP_MATH);
  const hasScience = hasAPSubjectInCategory(subjects, AP_SCIENCE);
  const hasLang = hasAPSubjectInCategory(subjects, AP_LANGUAGE);
  const hasFurther = hasAPSubjectInCategory(subjects, AP_FURTHER) || countMacroMicro(subjects);
  return hasMath && hasScience && hasLang && hasFurther;
}

function checkAPForHumanities(subjects: SubjectEntry[]): boolean {
  const hasEnglish = hasAPSubjectInCategory(subjects, AP_ENGLISH);
  const hasForeignLang = hasAPSubjectInCategory(subjects, AP_FOREIGN_LANGUAGE);
  const hasMathOrScience = hasAPSubjectInCategory(subjects, [...AP_MATH, ...AP_SCIENCE]);
  const hasFurther = hasAPSubjectInCategory(subjects, AP_FURTHER) || countMacroMicro(subjects);
  return hasEnglish && hasForeignLang && hasMathOrScience && hasFurther;
}

// ─── IB Subject Lists ───────────────────────────────────────────────────────

export const IB_HL_SUBJECTS = [
  'Biology', 'Chemistry', 'Physics', 'Computer Science', 'Design Technology',
  'Environmental Systems & Societies', 'Sports Exercise & Health Science',
  'Mathematics: Analysis and Approaches', 'Mathematics: Applications and Interpretation',
  'Economics', 'Geography', 'History', 'Global Politics', 'Philosophy',
  'Psychology', 'Business Management', 'Social & Cultural Anthropology',
  'English A: Literature', 'English A: Language & Literature',
  'Arabic A: Literature', 'Arabic A: Language & Literature',
  'French A: Literature', 'French A: Language & Literature',
  'German A: Literature', 'German A: Language & Literature',
  'Spanish A: Literature', 'Spanish A: Language & Literature',
  'French B', 'German B', 'Spanish B', 'Arabic B',
  'Visual Arts', 'Music', 'Theatre', 'Film', 'Dance',
];

export const IB_SL_SUBJECTS = [...IB_HL_SUBJECTS];

// ─── IGCSE/GCE Common Subjects ─────────────────────────────────────────────

export const AL_SUBJECTS = [
  'Mathematics', 'Further Mathematics', 'Physics', 'Chemistry', 'Biology',
  'Computer Science', 'Economics', 'Business Studies', 'Accounting',
  'English Language', 'English Literature', 'Arabic', 'French', 'German', 'Spanish',
  'History', 'Geography', 'Psychology', 'Sociology', 'Art & Design',
  'Law', 'Media Studies', 'Music',
];

// ─── AP Subjects List ───────────────────────────────────────────────────────

export const AP_SUBJECTS_LIST = [
  'Calculus AB', 'Calculus BC', 'Statistics',
  'Biology', 'Chemistry', 'Physics C: Mechanics', 'Physics C: Electricity and Magnetism',
  'Physics 1', 'Physics 2', 'Environmental Science',
  'English Literature', 'English Language and Composition',
  'French', 'Spanish', 'Latin', 'German', 'Chinese', 'Japanese', 'Italian',
  'European History', 'American History', 'World History',
  'Computer Science A', 'Computer Science Principles',
  'Macroeconomics', 'Microeconomics',
  'Psychology', 'Human Geography', 'Government and Politics',
  'Art History', 'Music Theory', 'Studio Art',
];

// ─── National Diploma Subject Focus Options ─────────────────────────────────

export const NATIONAL_DIPLOMA_FOCUS_OPTIONS = [
  { value: 'scientific_science', label: 'ash-shuʼba al-ʼilmiyya (ʻulūm) / Scientific Section (Science)' },
  { value: 'scientific_math', label: "ash-shu'ba al-'ilmiyya (riyāḍiyyāt) / Scientific Section (Mathematics)" },
  { value: 'literary', label: "ash-shu'ba al-adabiyya / Literary Section" },
];

// ─── Checker Functions ──────────────────────────────────────────────────────

export function checkIGCSEEligibility(data: IGCSEData): EligibilityResult {
  const result: EligibilityResult = {
    status: 'not_eligible',
    accessType: 'none',
    missingRequirements: [],
    recommendedActions: [],
    notes: [],
    sourceUrl: 'https://www.daad.de/en/studying-in-germany/requirements/gce/',
  };

  const alCount = data.al_subjects_count || data.al_subjects?.length || 0;

  // If student has university study
  if (data.has_university_study && data.semesters_completed) {
    if (data.semesters_completed >= 4) {
      result.status = 'direct_admission';
      result.accessType = 'all_subjects';
      result.notes.push('With 4+ semesters of university study, you qualify for direct admission.');
      return result;
    } else if (data.semesters_completed >= 2) {
      result.status = 'studienkolleg_required';
      result.accessType = 'foundation_only';
      result.notes.push('With 2+ semesters, you can attend any Studienkolleg in Germany.');
      return result;
    }
  }

  if (alCount >= 3) {
    // Check if all have at least grade C (if grades provided)
    const gradedAL = data.al_subjects?.filter(s => s.grade != null) || [];
    const allPassGrade = gradedAL.every(s => {
      const g = String(s.grade).toUpperCase();
      return ['A*', 'A', 'B', 'C'].includes(g);
    });

    if (gradedAL.length === 0 || allPassGrade) {
      result.status = 'direct_admission';
      result.accessType = 'all_subjects';
      result.notes.push('With 3+ A-Level subjects (grade C or better), you qualify for direct admission to German public universities.');
    } else {
      result.status = 'conditional';
      result.accessType = 'restricted_subjects';
      result.missingRequirements.push('Some A-Level subjects have grades below C.');
      result.recommendedActions.push('Retake A-Level exams to achieve at least grade C.');
    }
  } else if (alCount > 0) {
    result.status = 'private_university_only';
    result.accessType = 'private_only';
    result.missingRequirements.push(`You have ${alCount} A-Level subject(s), but need at least 3 for public universities.`);
    result.recommendedActions.push('Consider completing additional A-Level subjects.');
    result.recommendedActions.push('You may be eligible for private universities in Germany, possibly with a foundation year.');
    result.notes.push('With fewer than 3 A-Levels, public universities and public Studienkolleg are not accessible.');
  } else {
    result.status = 'private_university_only';
    result.accessType = 'private_only';
    result.missingRequirements.push('No A-Level subjects detected.');
    result.recommendedActions.push('Take at least 3 A-Level subjects to qualify for public universities.');
    result.recommendedActions.push('Private universities may still accept you, potentially with a foundation year.');
  }

  return result;
}

export function checkAmericanDiplomaEligibility(data: AmericanDiplomaData): EligibilityResult {
  const result: EligibilityResult = {
    status: 'not_eligible',
    accessType: 'none',
    missingRequirements: [],
    recommendedActions: [],
    notes: [],
    sourceUrl: 'https://www.uni-assist.de/en/tools/info-country-by-country/details-country/country/us/',
  };

  // If student has university study
  if (data.has_university_study && data.semesters_completed) {
    if (data.semesters_completed >= 4) {
      result.status = 'direct_admission';
      result.accessType = 'all_subjects';
      result.notes.push('With 4+ semesters of university study, you qualify for direct admission to any public German university.');
      return result;
    } else if (data.semesters_completed >= 2) {
      result.status = 'studienkolleg_required';
      result.accessType = 'foundation_only';
      result.notes.push('With 2+ semesters, you can attend any Studienkolleg (foundation year) in Germany.');
      return result;
    }
  }

  if (!data.ap_exams_taken || data.ap_subjects.length === 0) {
    result.status = 'private_university_only';
    result.accessType = 'private_only';
    result.missingRequirements.push('No AP exams taken. AP exams are required for direct admission to public German universities.');
    result.recommendedActions.push('Take AP exams in required subject areas to qualify for direct admission.');
    result.recommendedActions.push('If you complete 2 semesters at a university, you can attend a Studienkolleg. With 4 semesters, direct admission is possible.');
    result.recommendedActions.push('Private universities in Germany may still accept you.');
    result.notes.push('AP (Advanced Placement) exams are college-level exams administered by the College Board. They demonstrate readiness for university-level coursework and are required by German public universities for American Diploma holders.');
    return result;
  }

  // Check STEM path
  const stemQualified = checkAPForSTEM(data.ap_subjects);
  // Check Humanities path
  const humanitiesQualified = checkAPForHumanities(data.ap_subjects);

  if (stemQualified && humanitiesQualified) {
    result.status = 'direct_admission';
    result.accessType = 'all_subjects';
    result.notes.push('Your AP exams cover both STEM and Humanities requirements. You qualify for direct admission to all subject areas.');
  } else if (stemQualified) {
    result.status = 'direct_admission';
    result.accessType = 'restricted_subjects';
    result.notes.push('Your AP exams qualify you for: Mathematics, Technology, Natural Sciences, Medicine, or Pharmacy.');
    result.missingRequirements.push('For Humanities/Social Sciences, you would need: English + a foreign language + Math/Science + one further subject.');
  } else if (humanitiesQualified) {
    result.status = 'direct_admission';
    result.accessType = 'restricted_subjects';
    result.notes.push('Your AP exams qualify you for: Humanities, Social Sciences, Jurisprudence, or Economics.');
    result.missingRequirements.push('For STEM subjects, you would need: Math (Calculus) + a natural science + a language + one further subject.');
  } else {
    result.status = 'private_university_only';
    result.accessType = 'private_only';
    result.missingRequirements.push('Your AP exams do not fully cover the required subject areas for direct admission.');

    // Provide specific gap analysis
    if (!hasAPSubjectInCategory(data.ap_subjects, AP_MATH)) {
      result.missingRequirements.push('Missing: Mathematics (Calculus AB or BC)');
    }
    if (!hasAPSubjectInCategory(data.ap_subjects, AP_SCIENCE)) {
      result.missingRequirements.push('Missing: Natural Science (Biology, Chemistry, or Physics C)');
    }
    if (!hasAPSubjectInCategory(data.ap_subjects, AP_LANGUAGE)) {
      result.missingRequirements.push('Missing: Language subject');
    }

    result.recommendedActions.push('Take additional AP exams to cover the missing subject areas.');
    result.recommendedActions.push('Complete 2 semesters at a university to become eligible for Studienkolleg.');
    result.recommendedActions.push('Private universities in Germany may accept you without full AP coverage.');
  }

  return result;
}

export function checkIBEligibility(data: IBData): EligibilityResult {
  const result: EligibilityResult = {
    status: 'not_eligible',
    accessType: 'none',
    missingRequirements: [],
    recommendedActions: [],
    notes: [],
    sourceUrl: 'https://www.daad.de/en/studying-in-germany/requirements/ib-diploma/',
  };

  // If student has university study
  if (data.has_university_study && data.semesters_completed) {
    if (data.semesters_completed >= 4) {
      result.status = 'direct_admission';
      result.accessType = 'all_subjects';
      result.notes.push('With 4+ semesters of university study, you qualify for direct admission.');
      return result;
    } else if (data.semesters_completed >= 2) {
      result.status = 'studienkolleg_required';
      result.accessType = 'foundation_only';
      result.notes.push('With 2+ semesters, you can attend any Studienkolleg in Germany.');
      return result;
    }
  }

  const totalPoints = data.predicted_total || 0;
  const allSubjects = [...(data.hl_subjects || []), ...(data.sl_subjects || [])];
  const totalSubjects = allSubjects.length;

  // Check minimum 24 points
  if (totalPoints > 0 && totalPoints < 24) {
    result.missingRequirements.push(`Total points: ${totalPoints}/45. Minimum 24 required.`);
    // Check compensation rule
    const below4 = allSubjects.filter(s => s.grade != null && Number(s.grade) < 4);
    if (below4.length > 0) {
      result.notes.push('A non-passing grade of 3 can be compensated by a grade of 5 in a different subject at the same or higher level, provided total is ≥24.');
    }
  }

  // Check total subjects (need 6)
  if (totalSubjects < 6 && totalSubjects > 0) {
    result.missingRequirements.push(`Only ${totalSubjects} subjects selected. IB requires 6 subjects (3 HL + 3 SL).`);
  }

  // Check individual grades (each ≥ 4, with compensation)
  const failingSubjects = allSubjects.filter(s => s.grade != null && Number(s.grade) < 4);
  if (failingSubjects.length > 1) {
    result.missingRequirements.push(`${failingSubjects.length} subjects have grades below 4. Only one grade of 3 can be compensated.`);
  }

  // Check math level
  const mathIsHL = data.math_level === 'AA_HL' || data.math_level === 'AI_HL';
  const mathIsSL = data.math_level === 'AA_SL' || data.math_level === 'AI_SL';

  const hasScienceHL = (data.hl_subjects || []).some(s =>
    ['Biology', 'Chemistry', 'Physics'].includes(s.name)
  );
  const hasLanguageHL = (data.hl_subjects || []).some(s =>
    s.name.includes('Literature') || s.name.includes('Language') || s.name.includes(' B')
  );

  if (mathIsHL) {
    if (totalPoints >= 24 && failingSubjects.length <= 1) {
      result.status = 'direct_admission';
      result.accessType = 'all_subjects';
      result.notes.push('With Mathematics at HL, you are eligible for all subject areas at German public universities.');
    }
  } else if (mathIsSL && (hasScienceHL || hasLanguageHL)) {
    if (totalPoints >= 24 && failingSubjects.length <= 1) {
      result.status = 'direct_admission';
      result.accessType = 'restricted_subjects';
      result.notes.push('With Mathematics at SL and a science/language HL subject, you are eligible for subjects NOT in mathematics, natural sciences, or technology.');
      result.missingRequirements.push('To access STEM subjects, Mathematics must be at Higher Level (HL).');
    }
  } else if (data.math_level) {
    // Math SL without science/language HL
    result.status = 'studienkolleg_required';
    result.accessType = 'foundation_only';
    result.missingRequirements.push('Without Mathematics at HL and without a science/language subject at HL, direct admission is limited.');
    result.recommendedActions.push('Consider attending a Studienkolleg (foundation year) or applying to a private university.');
  }

  // If no math level selected yet, give general guidance
  if (!data.math_level && totalSubjects === 0) {
    result.status = 'conditional';
    result.accessType = 'all_subjects';
    result.notes.push('Complete your subject selections to get a detailed eligibility assessment.');
  }

  // Override for students without adequate qualifications
  if (result.status === 'not_eligible' && totalPoints >= 24) {
    result.status = 'studienkolleg_required';
    result.accessType = 'foundation_only';
    result.recommendedActions.push('A Studienkolleg (foundation year) can provide the preparation needed for direct admission.');
  }

  return result;
}

export function checkNationalDiplomaEligibility(data: NationalDiplomaData): EligibilityResult {
  const result: EligibilityResult = {
    status: 'studienkolleg_required',
    accessType: 'foundation_only',
    missingRequirements: [],
    recommendedActions: [],
    notes: [],
  };

  // If student has university study
  if (data.has_university_study && data.semesters_completed) {
    if (data.semesters_completed >= 4) {
      result.status = 'direct_admission';
      result.accessType = 'all_subjects';
      result.notes.push('With 4+ semesters of university study, you qualify for direct admission.');
      return result;
    } else if (data.semesters_completed >= 2) {
      result.status = 'studienkolleg_required';
      result.accessType = 'foundation_only';
      result.notes.push('With 2+ semesters, you can attend any Studienkolleg in Germany.');
      return result;
    }
  }

  // National Diploma holders without university study need Studienkolleg
  result.notes.push('The National Diploma (Thānawiyya ʻĀmma) qualifies you for a Studienkolleg (foundation year) in Germany.');
  result.recommendedActions.push('Complete at least 2 semesters at a university for Studienkolleg eligibility, or 4 semesters for direct admission.');

  if (data.subject_focus) {
    const focusLabel = NATIONAL_DIPLOMA_FOCUS_OPTIONS.find(o => o.value === data.subject_focus)?.label || data.subject_focus;
    result.notes.push(`Your section: ${focusLabel}. This may determine which Studienkolleg course type you can attend.`);
  }

  return result;
}

export function checkCanadianDiplomaEligibility(data: CanadianDiplomaData): EligibilityResult {
  const result: EligibilityResult = {
    status: 'not_eligible',
    accessType: 'none',
    missingRequirements: [],
    recommendedActions: [],
    notes: [],
  };

  // If student has university study
  if (data.has_university_study && data.semesters_completed) {
    if (data.semesters_completed >= 4) {
      result.status = 'direct_admission';
      result.accessType = 'all_subjects';
      result.notes.push('With 4+ semesters of university study, you qualify for direct admission.');
      return result;
    } else if (data.semesters_completed >= 2) {
      result.status = 'studienkolleg_required';
      result.accessType = 'foundation_only';
      result.notes.push('With 2+ semesters, you can attend any Studienkolleg in Germany.');
      return result;
    }
  }

  if (data.territory === 'ontario') {
    if (!data.has_12_general_courses) {
      result.status = data.graduated ? 'private_university_only' : 'conditional';
      result.accessType = data.graduated ? 'private_only' : 'none';
      result.missingRequirements.push('Need at least 12 general education courses during grade 11 and 12.');
      if (!data.graduated) {
        result.recommendedActions.push('Make sure to take at least 12 general education courses by graduation.');
      }
      return result;
    }
    if (!data.has_6_upcs) {
      result.missingRequirements.push('Need at least 6 University Preparation Courses (UPCs) during grade 12.');
      result.status = 'private_university_only';
      result.accessType = 'private_only';
      return result;
    }
    if (!data.upcs_include_required) {
      result.missingRequirements.push('Your 6 UPCs must include: 2 languages (English/French + foreign language), Mathematics (Advanced Functions + Calculus & Vectors), and a natural science (Chemistry, Biology, or Physics).');
      result.status = 'private_university_only';
      result.accessType = 'private_only';
      return result;
    }
    if (data.upc_average != null && data.upc_average < 65) {
      result.missingRequirements.push(`Your UPC average is ${data.upc_average}%. Minimum 65% required.`);
      result.status = 'private_university_only';
      result.accessType = 'private_only';
      return result;
    }

    result.status = 'direct_admission';
    result.accessType = 'all_subjects';
    result.notes.push('Your Ontario diploma meets the requirements for direct admission to German public universities.');
  } else if (data.territory === 'british_columbia') {
    // BC students cannot get direct admission without university study
    result.notes.push('British Columbia diploma holders cannot directly access German public universities without at least one academic year at a university.');

    if (!data.has_13_courses) {
      result.missingRequirements.push('Need 13 courses in grade XI and XII, with at least 5 in grade XII.');
    }
    if (!data.bc_includes_required) {
      result.missingRequirements.push('Must include: 2 languages (1 with course number 12), mathematics and 1 natural science (1 with course number 12).');
    }

    const passing = ['A', 'A+', 'A-', 'B+', 'B', 'B-', 'C+'].includes(data.bc_average_grade || '');
    if (data.bc_average_grade && !passing) {
      result.missingRequirements.push(`Average grade must be at least C+. Current: ${data.bc_average_grade}.`);
    }

    if (result.missingRequirements.length === 0) {
      result.status = 'studienkolleg_required';
      result.accessType = 'foundation_only';
      result.notes.push('You meet the BC diploma requirements. You can attend a Studienkolleg or apply to a private university.');
    } else {
      result.status = 'private_university_only';
      result.accessType = 'private_only';
    }

    result.recommendedActions.push('Complete at least 1 academic year at a university to qualify for Studienkolleg, or apply to private universities.');
  }

  return result;
}

export function checkGermanAbiturEligibility(): EligibilityResult {
  return {
    status: 'direct_admission',
    accessType: 'all_subjects',
    missingRequirements: [],
    recommendedActions: [],
    notes: ['The German Abitur provides direct admission to all German universities and all subject areas.'],
  };
}

// ─── Unified Checker ────────────────────────────────────────────────────────

export function checkEligibility(curriculum: string, data: any): EligibilityResult {
  switch (curriculum) {
    case 'IGCSE':
      return checkIGCSEEligibility(data as IGCSEData);
    case 'American Diploma':
      return checkAmericanDiplomaEligibility(data as AmericanDiplomaData);
    case 'IB':
      return checkIBEligibility(data as IBData);
    case 'NATIONAL DIPLOMA':
      return checkNationalDiplomaEligibility(data as NationalDiplomaData);
    case 'Canadian Diploma':
      return checkCanadianDiplomaEligibility(data as CanadianDiplomaData);
    case 'German Abitur':
      return checkGermanAbiturEligibility();
    default:
      return {
        status: 'conditional',
        accessType: 'none',
        missingRequirements: [],
        recommendedActions: ['Please contact us for a detailed eligibility assessment for your curriculum type.'],
        notes: [`Eligibility rules for "${curriculum}" are not yet available in our automated system.`],
      };
  }
}
