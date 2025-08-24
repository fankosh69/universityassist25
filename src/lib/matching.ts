// Program Matching Algorithm
// Score = 0.35*GPA + 0.25*Language + 0.30*ECTS + 0.10*Intake

export interface StudentProfile {
  gpa_de?: number;
  language_certificates: Array<{
    language: string;
    level: string;
    certificate_type: string;
  }>;
  ects_total?: number;
  target_intake?: string;
  target_level?: string;
}

export interface ProgramRequirements {
  minimum_gpa?: number;
  language_requirements: string[];
  ects_credits?: number;
  degree_level: string;
  semester_start?: string;
}

export interface MatchResult {
  score: number;
  status: 'eligible' | 'borderline' | 'missing';
  components: {
    gpa: number;
    language: number;
    ects: number;
    intake: number;
  };
  gaps: string[];
}

export function calculateMatch(
  profile: StudentProfile,
  requirements: ProgramRequirements
): MatchResult {
  const components = {
    gpa: calculateGPAScore(profile.gpa_de, requirements.minimum_gpa),
    language: calculateLanguageScore(profile.language_certificates, requirements.language_requirements),
    ects: calculateECTSScore(profile.ects_total, requirements.ects_credits),
    intake: calculateIntakeScore(profile.target_intake, requirements.semester_start)
  };
  
  const score = Math.round(
    (components.gpa * 0.35 + 
     components.language * 0.25 + 
     components.ects * 0.30 + 
     components.intake * 0.10) * 100
  ) / 100;
  
  const gaps = identifyGaps(profile, requirements, components);
  
  let status: 'eligible' | 'borderline' | 'missing';
  if (score >= 0.75) status = 'eligible';
  else if (score >= 0.55) status = 'borderline';
  else status = 'missing';
  
  return {
    score,
    status,
    components,
    gaps
  };
}

function calculateGPAScore(studentGPA?: number, requiredGPA?: number): number {
  if (!studentGPA || !requiredGPA) return 0;
  
  if (studentGPA <= requiredGPA) return 1.0;
  
  // Linear decay for GPA above requirement (German scale is inverted)
  const difference = studentGPA - requiredGPA;
  return Math.max(0, 1 - (difference / 2));
}

function calculateLanguageScore(
  certificates: Array<{ language: string; level: string }>,
  requirements: string[]
): number {
  if (!requirements || requirements.length === 0) return 1.0;
  
  const cefr_levels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
  let totalScore = 0;
  let reqCount = 0;
  
  for (const req of requirements) {
    reqCount++;
    const [lang, requiredLevel] = req.split(':');
    
    const studentCert = certificates.find(c => 
      c.language.toLowerCase() === lang.toLowerCase()
    );
    
    if (!studentCert) {
      totalScore += 0;
      continue;
    }
    
    const studentLevelIndex = cefr_levels.indexOf(studentCert.level);
    const requiredLevelIndex = cefr_levels.indexOf(requiredLevel);
    
    if (studentLevelIndex >= requiredLevelIndex) {
      totalScore += 1.0;
    } else if (studentLevelIndex === requiredLevelIndex - 1) {
      totalScore += 0.7; // Close but not quite
    } else {
      totalScore += 0;
    }
  }
  
  return reqCount > 0 ? totalScore / reqCount : 1.0;
}

function calculateECTSScore(studentECTS?: number, requiredECTS?: number): number {
  if (!requiredECTS) return 1.0;
  if (!studentECTS) return 0;
  
  if (studentECTS >= requiredECTS) return 1.0;
  
  // Proportional score for partial ECTS
  return studentECTS / requiredECTS;
}

function calculateIntakeScore(targetIntake?: string, programIntake?: string): number {
  if (!targetIntake || !programIntake) return 0.8; // Neutral if not specified
  
  return targetIntake.toLowerCase() === programIntake.toLowerCase() ? 1.0 : 0.5;
}

function identifyGaps(
  profile: StudentProfile,
  requirements: ProgramRequirements,
  components: { gpa: number; language: number; ects: number; intake: number }
): string[] {
  const gaps: string[] = [];
  
  if (components.gpa < 0.5) {
    gaps.push(`GPA requirement: ${requirements.minimum_gpa} (German scale)`);
  }
  
  if (components.language < 0.7) {
    gaps.push(`Language requirements: ${requirements.language_requirements.join(', ')}`);
  }
  
  if (components.ects < 0.8 && requirements.ects_credits) {
    const missing = requirements.ects_credits - (profile.ects_total || 0);
    gaps.push(`ECTS credits: ${missing} more credits needed`);
  }
  
  return gaps;
}