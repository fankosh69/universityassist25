import { supabase } from "@/integrations/supabase/client";

export interface StudentProfile {
  id: string;
  germanGPA?: number;
  totalECTS?: number;
  languageProficiency: Array<{
    language: string;
    cefrLevel: string;
  }>;
  targetIntake?: string;
}

export interface ProgramRequirements {
  id: string;
  minimumGPA?: number;
  minECTS?: number;
  languageRequirements?: Array<string>;
  winterIntake?: boolean;
  summerIntake?: boolean;
}

export interface MatchResult {
  programId: string;
  matchScore: number;
  eligibilityStatus: 'eligible' | 'borderline' | 'missing';
  gpaScore: number;
  languageScore: number;
  ectsScore: number;
  intakeScore: number;
  gapAnalysis: {
    gpa?: string;
    language?: string;
    ects?: string;
    intake?: string;
  };
}

export class MatchingServiceV2 {
  /**
   * Calculate match score between student and program
   * Formula: 0.35*GPA + 0.25*Language + 0.30*ECTS + 0.10*Intake
   */
  static calculateMatch(
    student: StudentProfile,
    program: ProgramRequirements
  ): MatchResult {
    const weights = {
      gpa: 0.35,
      language: 0.25,
      ects: 0.30,
      intake: 0.10
    };

    // GPA Score (0-100)
    const gpaScore = this.calculateGPAScore(student.germanGPA, program.minimumGPA);

    // Language Score (0-100)
    const languageScore = this.calculateLanguageScore(
      student.languageProficiency,
      program.languageRequirements || []
    );

    // ECTS Score (0-100)
    const ectsScore = this.calculateECTSScore(student.totalECTS, program.minECTS);

    // Intake Score (0-100)
    const intakeScore = this.calculateIntakeScore(
      student.targetIntake,
      program.winterIntake,
      program.summerIntake
    );

    // Weighted total
    const matchScore =
      weights.gpa * gpaScore +
      weights.language * languageScore +
      weights.ects * ectsScore +
      weights.intake * intakeScore;

    // Determine eligibility status
    let eligibilityStatus: 'eligible' | 'borderline' | 'missing';
    if (matchScore >= 80) {
      eligibilityStatus = 'eligible';
    } else if (matchScore >= 60) {
      eligibilityStatus = 'borderline';
    } else {
      eligibilityStatus = 'missing';
    }

    // Gap analysis
    const gapAnalysis = this.generateGapAnalysis(
      { gpaScore, languageScore, ectsScore, intakeScore },
      student,
      program
    );

    return {
      programId: program.id,
      matchScore: Math.round(matchScore * 100) / 100,
      eligibilityStatus,
      gpaScore,
      languageScore,
      ectsScore,
      intakeScore,
      gapAnalysis
    };
  }

  private static calculateGPAScore(studentGPA?: number, minGPA?: number): number {
    if (!studentGPA) return 0;
    if (!minGPA) return 100; // No requirement means full score

    // German GPA scale: 1.0 (best) to 4.0 (worst)
    if (studentGPA <= minGPA) {
      return 100;
    } else if (studentGPA <= minGPA + 0.5) {
      return 75;
    } else if (studentGPA <= minGPA + 1.0) {
      return 50;
    } else {
      return 25;
    }
  }

  private static calculateLanguageScore(
    studentLangs: Array<{ language: string; cefrLevel: string }>,
    requirements: Array<string>
  ): number {
    if (requirements.length === 0) return 100;

    const cefrLevels: Record<string, number> = {
      'A1': 1, 'A2': 2, 'B1': 3, 'B2': 4, 'C1': 5, 'C2': 6
    };

    let totalScore = 0;
    let requiredCount = 0;

    requirements.forEach(req => {
      requiredCount++;
      const [lang, level] = req.split(':'); // e.g., "de:B2"
      
      const studentLang = studentLangs.find(l => l.language === lang);
      if (!studentLang) {
        totalScore += 0;
        return;
      }

      const requiredLevel = cefrLevels[level] || 4;
      const studentLevel = cefrLevels[studentLang.cefrLevel] || 0;

      if (studentLevel >= requiredLevel) {
        totalScore += 100;
      } else if (studentLevel === requiredLevel - 1) {
        totalScore += 75;
      } else if (studentLevel === requiredLevel - 2) {
        totalScore += 50;
      } else {
        totalScore += 25;
      }
    });

    return requiredCount > 0 ? totalScore / requiredCount : 100;
  }

  private static calculateECTSScore(studentECTS?: number, minECTS?: number): number {
    if (!minECTS) return 100;
    if (!studentECTS) return 0;

    if (studentECTS >= minECTS) {
      return 100;
    } else if (studentECTS >= minECTS * 0.9) {
      return 80;
    } else if (studentECTS >= minECTS * 0.75) {
      return 60;
    } else if (studentECTS >= minECTS * 0.5) {
      return 40;
    } else {
      return 20;
    }
  }

  private static calculateIntakeScore(
    targetIntake?: string,
    winterIntake?: boolean,
    summerIntake?: boolean
  ): number {
    if (!targetIntake) return 100;
    
    const isWinter = targetIntake.toLowerCase().includes('winter');
    const isSummer = targetIntake.toLowerCase().includes('summer');

    if ((isWinter && winterIntake) || (isSummer && summerIntake)) {
      return 100;
    } else if (winterIntake || summerIntake) {
      return 50; // Can apply but different intake
    } else {
      return 0;
    }
  }

  private static generateGapAnalysis(
    scores: { gpaScore: number; languageScore: number; ectsScore: number; intakeScore: number },
    student: StudentProfile,
    program: ProgramRequirements
  ): MatchResult['gapAnalysis'] {
    const gaps: MatchResult['gapAnalysis'] = {};

    if (scores.gpaScore < 100 && program.minimumGPA) {
      gaps.gpa = `Improve GPA to ${program.minimumGPA.toFixed(2)} or better (current: ${student.germanGPA?.toFixed(2) || 'N/A'})`;
    }

    if (scores.languageScore < 100) {
      gaps.language = 'Improve language proficiency to meet requirements';
    }

    if (scores.ectsScore < 100 && program.minECTS) {
      const missing = program.minECTS - (student.totalECTS || 0);
      gaps.ects = `Complete ${missing} more credit points`;
    }

    if (scores.intakeScore < 100) {
      gaps.intake = 'Consider applying for a different intake period';
    }

    return gaps;
  }

  /**
   * Calculate matches for a student against all programs
   */
  static async calculateStudentMatches(profileId: string): Promise<MatchResult[]> {
    try {
      // Get student academic data
      const { data: academics } = await supabase
        .from('student_academics')
        .select('*')
        .eq('profile_id', profileId)
        .single();

      const { data: languages } = await supabase
        .from('language_proficiency')
        .select('*')
        .eq('profile_id', profileId);

      const studentProfile: StudentProfile = {
        id: profileId,
        germanGPA: academics?.gpa_de,
        totalECTS: academics?.ects_total,
        languageProficiency: languages?.map(l => ({
          language: l.language,
          cefrLevel: l.cefr_level || ''
        })) || [],
        targetIntake: academics?.target_intake
      };

      // Get all programs
      const { data: programs } = await supabase
        .from('programs')
        .select('*')
        .eq('published', true);

      if (!programs) return [];

      // Calculate matches
      const matches: MatchResult[] = programs.map(program => {
        const programReqs: ProgramRequirements = {
          id: program.id,
          minimumGPA: program.minimum_gpa,
          minECTS: program.ects_credits,
          languageRequirements: program.language_requirements,
          winterIntake: program.winter_intake,
          summerIntake: program.summer_intake
        };

        return this.calculateMatch(studentProfile, programReqs);
      });

      // Save matches to database
      await this.saveMatches(profileId, matches);

      return matches.sort((a, b) => b.matchScore - a.matchScore);
    } catch (error) {
      console.error('Error calculating matches:', error);
      return [];
    }
  }

  private static async saveMatches(profileId: string, matches: MatchResult[]): Promise<void> {
    try {
      // Delete old matches
      await supabase
        .from('program_matches_v2')
        .delete()
        .eq('profile_id', profileId);

      // Insert new matches
      const matchRecords = matches.map(match => ({
        profile_id: profileId,
        program_id: match.programId,
        match_score: match.matchScore,
        eligibility_status: match.eligibilityStatus,
        gpa_score: match.gpaScore,
        language_score: match.languageScore,
        ects_score: match.ectsScore,
        intake_score: match.intakeScore,
        gap_analysis: match.gapAnalysis
      }));

      await supabase
        .from('program_matches_v2')
        .insert(matchRecords);
    } catch (error) {
      console.error('Error saving matches:', error);
    }
  }
}
