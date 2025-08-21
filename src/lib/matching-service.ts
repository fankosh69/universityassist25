import { supabase } from "@/integrations/supabase/client";

export interface ProfileData {
  id: string;
  current_education_level: string;
  current_gpa?: number;
  current_field_of_study?: string;
  language_certificates: string[];
  preferred_fields: string[];
  preferred_degree_type: string;
  preferred_cities: string[];
  nationality?: string;
}

export interface ProgramData {
  id: string;
  name: string;
  field_of_study: string;
  degree_type: string;
  minimum_gpa: number;
  language_requirements: string[];
  university: {
    city: string;
  };
}

export interface MatchResult {
  program_id: string;
  compatibility_score: number;
  match_reasons: string[];
}

class MatchingService {
  /**
   * Calculate compatibility score between a profile and a program
   */
  calculateCompatibilityScore(profile: ProfileData, program: ProgramData): MatchResult {
    let score = 0;
    const reasons: string[] = [];
    const maxScore = 100;

    // Field of study match (30 points)
    if (profile.preferred_fields.includes(program.field_of_study)) {
      score += 30;
      reasons.push(`Perfect field match: ${program.field_of_study}`);
    } else if (this.isRelatedField(profile.current_field_of_study, program.field_of_study)) {
      score += 15;
      reasons.push(`Related field: ${program.field_of_study}`);
    }

    // Degree type progression (25 points)
    const degreeScore = this.calculateDegreeProgression(profile.current_education_level, program.degree_type);
    score += degreeScore;
    if (degreeScore > 0) {
      reasons.push(`Appropriate degree level: ${program.degree_type}`);
    }

    // GPA compatibility (20 points)
    if (profile.current_gpa && program.minimum_gpa) {
      const gpaScore = this.calculateGPAScore(profile.current_gpa, program.minimum_gpa);
      score += gpaScore;
      if (gpaScore > 15) {
        reasons.push(`Strong GPA match (${profile.current_gpa} vs ${program.minimum_gpa} required)`);
      } else if (gpaScore > 0) {
        reasons.push(`GPA meets requirements`);
      }
    }

    // City preference (15 points)
    if (profile.preferred_cities.includes(program.university.city)) {
      score += 15;
      reasons.push(`Preferred city: ${program.university.city}`);
    }

    // Language requirements (10 points)
    const languageScore = this.calculateLanguageScore(profile.language_certificates, program.language_requirements);
    score += languageScore;
    if (languageScore > 5) {
      reasons.push("Strong language qualifications");
    } else if (languageScore > 0) {
      reasons.push("Basic language requirements met");
    }

    // Ensure score doesn't exceed maximum
    score = Math.min(score, maxScore);

    return {
      program_id: program.id,
      compatibility_score: score,
      match_reasons: reasons
    };
  }

  /**
   * Check if two fields are related
   */
  private isRelatedField(currentField?: string, programField?: string): boolean {
    if (!currentField || !programField) return false;

    const relatedFields: { [key: string]: string[] } = {
      "Computer Science": ["Engineering", "Mathematics", "Physics"],
      "Engineering": ["Computer Science", "Mathematics", "Physics"],
      "Business": ["Economics", "Law"],
      "Economics": ["Business", "Mathematics"],
      "Mathematics": ["Computer Science", "Engineering", "Physics"],
      "Physics": ["Engineering", "Mathematics"],
      "Medicine": ["Biology", "Chemistry"],
      "Biology": ["Medicine", "Chemistry"],
      "Chemistry": ["Medicine", "Biology", "Physics"]
    };

    return relatedFields[currentField]?.includes(programField) || false;
  }

  /**
   * Calculate degree progression score
   */
  private calculateDegreeProgression(currentLevel: string, targetLevel: string): number {
    const progressions: { [key: string]: { [key: string]: number } } = {
      "high_school": {
        "Bachelor's": 25,
        "Master's": 0,
        "PhD": 0
      },
      "bachelor": {
        "Bachelor's": 10, // Second bachelor
        "Master's": 25,
        "PhD": 5
      },
      "master": {
        "Bachelor's": 5,
        "Master's": 15, // Second master
        "PhD": 25
      },
      "phd": {
        "Bachelor's": 0,
        "Master's": 0,
        "PhD": 10
      }
    };

    return progressions[currentLevel]?.[targetLevel] || 0;
  }

  /**
   * Calculate GPA compatibility score
   */
  private calculateGPAScore(userGPA: number, minimumGPA: number): number {
    if (userGPA < minimumGPA) return 0;
    
    const excess = userGPA - minimumGPA;
    if (excess >= 1.0) return 20; // Excellent
    if (excess >= 0.5) return 15; // Good
    if (excess >= 0.2) return 10; // Adequate
    return 5; // Just meets requirements
  }

  /**
   * Calculate language requirements score
   */
  private calculateLanguageScore(certificates: string[], requirements: string[]): number {
    if (requirements.length === 0) return 10; // No requirements
    
    let score = 0;
    const maxScore = 10;
    
    for (const requirement of requirements) {
      const hasMatchingCert = certificates.some(cert => 
        this.languageMatches(cert, requirement)
      );
      
      if (hasMatchingCert) {
        score += maxScore / requirements.length;
      }
    }
    
    return Math.round(score);
  }

  /**
   * Check if a language certificate matches a requirement
   */
  private languageMatches(certificate: string, requirement: string): boolean {
    const cert = certificate.toLowerCase();
    const req = requirement.toLowerCase();
    
    // Extract language and level
    if (req.includes('english')) {
      return cert.includes('ielts') || cert.includes('toefl') || cert.includes('english');
    }
    if (req.includes('german')) {
      return cert.includes('testdaf') || cert.includes('dsh') || cert.includes('german');
    }
    
    return cert.includes(req.split(' ')[0]); // Basic language match
  }

  /**
   * Generate matches for a user profile
   */
  async generateMatches(profileId: string): Promise<void> {
    try {
      // Get user profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', profileId)
        .single();

      if (profileError || !profile) {
        throw new Error('Profile not found');
      }

      // Get all programs with university info
      const { data: programs, error: programsError } = await supabase
        .from('programs')
        .select(`
          *,
          universities!inner(
            name,
            city,
            website
          )
        `);

      if (programsError || !programs) {
        throw new Error('Failed to fetch programs');
      }

      // Calculate matches
      const matches: MatchResult[] = [];
      
      for (const program of programs) {
        const match = this.calculateCompatibilityScore(profile, {
          id: program.id,
          name: program.name,
          field_of_study: program.field_of_study,
          degree_type: program.degree_type,
          minimum_gpa: program.minimum_gpa,
          language_requirements: program.language_requirements || [],
          university: {
            city: program.universities.city
          }
        });

        // Only save matches with score > 30
        if (match.compatibility_score > 30) {
          matches.push(match);
        }
      }

      // Sort by compatibility score
      matches.sort((a, b) => b.compatibility_score - a.compatibility_score);

      // Delete existing matches
      await supabase
        .from('matches')
        .delete()
        .eq('profile_id', profileId);

      // Insert new matches
      if (matches.length > 0) {
        const matchRecords = matches.map(match => ({
          profile_id: profileId,
          program_id: match.program_id,
          compatibility_score: match.compatibility_score,
          match_reasons: match.match_reasons
        }));

        const { error: insertError } = await supabase
          .from('matches')
          .insert(matchRecords);

        if (insertError) {
          throw insertError;
        }
      }

    } catch (error) {
      console.error('Error generating matches:', error);
      throw error;
    }
  }

  /**
   * Get matches for a user
   */
  async getMatches(profileId: string) {
    const { data, error } = await supabase
      .from('matches')
      .select(`
        id,
        compatibility_score,
        match_reasons,
        programs!inner(
          name,
          field_of_study,
          degree_type,
          universities!inner(name, city)
        )
      `)
      .eq('profile_id', profileId)
      .order('compatibility_score', { ascending: false })
      .limit(10);

    if (error) {
      throw error;
    }

    return data;
  }
}

export const matchingService = new MatchingService();