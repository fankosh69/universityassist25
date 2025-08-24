/**
 * University Assist - German GPA Conversion Service
 * Implements the Modified Bavarian Formula for GPA conversion
 */

export interface GPAInput {
  gradeAchieved: number;  // Nd - Student's actual grade
  maxGrade: number;       // Nmax - Best possible grade in the system
  minPassGrade: number;   // Nmin - Minimum passing grade
}

export interface GPAConversionResult {
  germanGPA: number;
  formula: string;
  explanation: string;
  status: 'excellent' | 'good' | 'satisfactory' | 'sufficient' | 'poor';
}

/**
 * Modified Bavarian Formula: X = 1 + 3 * (Nmax - Nd) / (Nmax - Nmin)
 * Where:
 * - X = German grade (1.0 - 4.0+)
 * - Nd = Student's grade
 * - Nmax = Maximum grade in system
 * - Nmin = Minimum passing grade
 */
export function convertToGermanGPA(input: GPAInput): GPAConversionResult {
  const { gradeAchieved, maxGrade, minPassGrade } = input;

  // Validation
  if (maxGrade <= minPassGrade) {
    throw new Error('Maximum grade must be higher than minimum passing grade');
  }
  
  if (gradeAchieved < minPassGrade || gradeAchieved > maxGrade) {
    throw new Error('Grade achieved must be between minimum passing grade and maximum grade');
  }

  // Apply Modified Bavarian Formula
  const germanGPA = 1 + (3 * (maxGrade - gradeAchieved)) / (maxGrade - minPassGrade);
  
  // Clamp to German scale (1.0 - 4.0+)
  const clampedGPA = Math.max(1.0, Math.min(4.0, germanGPA));
  
  // Round to 2 decimal places
  const finalGPA = Math.round(clampedGPA * 100) / 100;

  // Determine status
  let status: GPAConversionResult['status'];
  if (finalGPA >= 1.0 && finalGPA <= 1.5) status = 'excellent';
  else if (finalGPA <= 2.5) status = 'good';
  else if (finalGPA <= 3.5) status = 'satisfactory';
  else if (finalGPA <= 4.0) status = 'sufficient';
  else status = 'poor';

  return {
    germanGPA: finalGPA,
    formula: `1 + 3 × (${maxGrade} - ${gradeAchieved}) / (${maxGrade} - ${minPassGrade}) = ${finalGPA}`,
    explanation: `Your grade of ${gradeAchieved}/${maxGrade} converts to ${finalGPA} on the German scale (${status}).`,
    status
  };
}

/**
 * Common GPA scale presets for easy selection
 */
export const GPA_SCALES = {
  US_4: { max: 4.0, min: 2.0, name: 'US 4.0 Scale' },
  US_100: { max: 100, min: 60, name: 'US Percentage (100%)' },
  UK_CLASS: { max: 100, min: 40, name: 'UK Classification' },
  GERMAN: { max: 1.0, min: 4.0, name: 'German Scale' },
  FRENCH_20: { max: 20, min: 10, name: 'French 20-Point Scale' },
  CGPA_10: { max: 10, min: 5, name: 'CGPA 10-Point Scale' },
  CGPA_4: { max: 4.0, min: 2.0, name: 'CGPA 4-Point Scale' }
} as const;

/**
 * Get eligibility status based on German GPA for typical program requirements
 */
export function getEligibilityStatus(germanGPA: number, programMinGPA: number = 2.5): {
  eligible: boolean;
  status: 'excellent' | 'good' | 'borderline' | 'insufficient';
  message: string;
} {
  if (germanGPA <= programMinGPA - 0.5) {
    return {
      eligible: true,
      status: 'excellent',
      message: 'Excellent - Well above minimum requirements'
    };
  } else if (germanGPA <= programMinGPA) {
    return {
      eligible: true,
      status: 'good',
      message: 'Good - Meets program requirements comfortably'
    };
  } else if (germanGPA <= programMinGPA + 0.3) {
    return {
      eligible: true,
      status: 'borderline',
      message: 'Borderline - Meets minimum requirements'
    };
  } else {
    return {
      eligible: false,
      status: 'insufficient',
      message: 'Insufficient - Below minimum GPA requirement'
    };
  }
}