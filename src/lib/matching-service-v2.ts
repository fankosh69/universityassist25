/**
 * University Assist - Enhanced Matching Service
 * Calculates program compatibility based on GPA, language, ECTS, and intake preferences
 */

import { convertToGermanGPA } from './gpa-conversion';

export interface StudentProfile {
  // Academic background
  curriculum?: string;
  prevMajor?: string;
  gpaRaw?: number;
  gpaScaleMax?: number;
  gpaMinPass?: number;
  germanGPA?: number;
  targetLevel?: 'bachelor' | 'master';
  targetIntake?: 'winter' | 'summer';
  
  // Language certifications
  languageCertificates?: Array<{
    language: string;
    level: string; // CEFR levels: A1, A2, B1, B2, C1, C2
    test?: string; // TestDaF, DSH, IELTS, TOEFL, etc.
    score?: number;
  }>;
  
  // ECTS credits
  ectsTotal?: number;
  
  // Preferences
  preferredCities?: string[];
  preferredFields?: string[];
}

export interface ProgramInfo {
  id: string;
  name: string;
  degreeLevel: 'bachelor' | 'master';
  fieldOfStudy: string;
  languageOfInstruction: string[];
  minimumGPA?: number;
  ectsCredits?: number;
  
  // Requirements
  languageRequirements?: Array<{
    language: string;
    minLevel: string;
    acceptedTests?: string[];
  }>;
  
  // Deadlines and intake
  intakes?: Array<{
    intake: 'winter' | 'summer';
    deadline: string;
  }>;
  
  // University info
  university: {
    id: string;
    name: string;
    city: string;
  };
}

export interface MatchResult {
  programId: string;
  score: number;
  status: 'eligible' | 'borderline' | 'missing';
  components: {
    gpa: number;
    language: number;
    ects: number;
    intake: number;
  };
  gaps: string[];
  recommendations: string[];
}

export class MatchingServiceV2 {
  private readonly WEIGHTS = {
    GPA: 0.35,
    LANGUAGE: 0.25,
    ECTS: 0.30,
    INTAKE: 0.10
  };

  /**
   * Calculate comprehensive match score for a student-program pair
   */
  calculateMatch(profile: StudentProfile, program: ProgramInfo): MatchResult {
    const components = {
      gpa: this.calculateGPAScore(profile, program),
      language: this.calculateLanguageScore(profile, program),
      ects: this.calculateECTSScore(profile, program),
      intake: this.calculateIntakeScore(profile, program)
    };

    const totalScore = 
      components.gpa * this.WEIGHTS.GPA +
      components.language * this.WEIGHTS.LANGUAGE +
      components.ects * this.WEIGHTS.ECTS +
      components.intake * this.WEIGHTS.INTAKE;

    const gaps = this.identifyGaps(profile, program, components);
    const recommendations = this.generateRecommendations(profile, program, gaps);

    let status: MatchResult['status'];
    if (totalScore >= 0.75) status = 'eligible';
    else if (totalScore >= 0.55) status = 'borderline';
    else status = 'missing';

    return {
      programId: program.id,
      score: Math.round(totalScore * 100) / 100,
      status,
      components,
      gaps,
      recommendations
    };
  }

  private calculateGPAScore(profile: StudentProfile, program: ProgramInfo): number {
    // Use German GPA if available, otherwise convert
    let germanGPA = profile.germanGPA;
    
    if (!germanGPA && profile.gpaRaw && profile.gpaScaleMax && profile.gpaMinPass) {
      try {
        const conversion = convertToGermanGPA({
          gradeAchieved: profile.gpaRaw,
          maxGrade: profile.gpaScaleMax,
          minPassGrade: profile.gpaMinPass
        });
        germanGPA = conversion.germanGPA;
      } catch {
        return 0; // Can't evaluate without valid GPA data
      }
    }

    if (!germanGPA) return 0;

    const requiredGPA = program.minimumGPA || 2.5; // Default requirement
    
    if (germanGPA <= requiredGPA - 0.5) return 1.0; // Excellent
    else if (germanGPA <= requiredGPA) return 0.8; // Good
    else if (germanGPA <= requiredGPA + 0.3) return 0.6; // Borderline
    else return 0.2; // Below requirement
  }

  private calculateLanguageScore(profile: StudentProfile, program: ProgramInfo): number {
    if (!program.languageRequirements?.length) return 1.0; // No requirements

    let bestScore = 0;

    for (const requirement of program.languageRequirements) {
      const userCerts = profile.languageCertificates?.filter(
        cert => cert.language.toLowerCase() === requirement.language.toLowerCase()
      ) || [];

      for (const cert of userCerts) {
        const score = this.compareCEFRLevels(cert.level, requirement.minLevel);
        bestScore = Math.max(bestScore, score);
      }
    }

    return bestScore;
  }

  private calculateECTSScore(profile: StudentProfile, program: ProgramInfo): number {
    if (!program.ectsCredits) return 1.0; // No ECTS requirement

    const userECTS = profile.ectsTotal || 0;
    const requiredECTS = program.ectsCredits;

    if (userECTS >= requiredECTS) return 1.0; // Meets requirement
    else if (userECTS >= requiredECTS * 0.8) return 0.7; // Close to requirement
    else if (userECTS >= requiredECTS * 0.6) return 0.4; // Moderate gap
    else return 0.1; // Large gap
  }

  private calculateIntakeScore(profile: StudentProfile, program: ProgramInfo): number {
    if (!profile.targetIntake || !program.intakes?.length) return 0.8; // Neutral

    const hasPreferredIntake = program.intakes.some(
      intake => intake.intake === profile.targetIntake
    );

    return hasPreferredIntake ? 1.0 : 0.5; // Prefer matching intake
  }

  private compareCEFRLevels(userLevel: string, requiredLevel: string): number {
    const levels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
    const userIndex = levels.indexOf(userLevel.toUpperCase());
    const requiredIndex = levels.indexOf(requiredLevel.toUpperCase());

    if (userIndex === -1 || requiredIndex === -1) return 0.5; // Unknown level

    if (userIndex >= requiredIndex) return 1.0; // Meets or exceeds
    else if (userIndex === requiredIndex - 1) return 0.6; // One level below
    else return 0.2; // Significantly below
  }

  private identifyGaps(profile: StudentProfile, program: ProgramInfo, components: MatchResult['components']): string[] {
    const gaps: string[] = [];

    if (components.gpa < 0.6) {
      gaps.push('GPA below minimum requirement');
    }

    if (components.language < 0.6) {
      gaps.push('Language certification requirements not met');
    }

    if (components.ects < 0.6) {
      const required = program.ectsCredits || 0;
      const current = profile.ectsTotal || 0;
      gaps.push(`Need ${required - current} more ECTS credits`);
    }

    if (components.intake < 0.8 && profile.targetIntake) {
      gaps.push(`Program not available for ${profile.targetIntake} intake`);
    }

    return gaps;
  }

  private generateRecommendations(profile: StudentProfile, program: ProgramInfo, gaps: string[]): string[] {
    const recommendations: string[] = [];

    if (gaps.some(gap => gap.includes('GPA'))) {
      recommendations.push('Consider retaking courses to improve your GPA');
      recommendations.push('Look for programs with lower GPA requirements');
    }

    if (gaps.some(gap => gap.includes('Language'))) {
      recommendations.push('Take a language proficiency test (TestDaF, DSH, IELTS)');
      recommendations.push('Consider language preparation courses');
    }

    if (gaps.some(gap => gap.includes('ECTS'))) {
      recommendations.push('Complete additional coursework to earn more credits');
      recommendations.push('Consider taking summer courses or extra electives');
    }

    if (gaps.some(gap => gap.includes('intake'))) {
      recommendations.push('Apply for the available intake semester');
      recommendations.push('Use the gap semester for language/skill improvement');
    }

    return recommendations;
  }

  /**
   * Batch calculate matches for multiple programs
   */
  calculateMatches(profile: StudentProfile, programs: ProgramInfo[]): MatchResult[] {
    return programs
      .map(program => this.calculateMatch(profile, program))
      .sort((a, b) => b.score - a.score); // Sort by score descending
  }
}

export const matchingService = new MatchingServiceV2();