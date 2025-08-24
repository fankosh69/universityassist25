// German GPA Conversion using Modified Bavarian Formula
// Formula: x = 1 + 3 * (Nmax - Nd) / (Nmax - Nmin)
// Where: Nmax = maximum grade, Nmin = minimum passing grade, Nd = achieved grade

export interface GPAInput {
  gradeAchieved: number;
  maxGrade: number;
  minPassGrade: number;
}

export interface GPAConversionResult {
  germanGPA: number;
  formula: string;
  explanation: string;
  status: 'excellent' | 'good' | 'borderline' | 'insufficient';
}

export function computeGermanGPA(nmax: number, nmin: number, nd: number): number | null {
  if (!nmax || !nmin || !nd || nmax === nmin) return null;
  
  const x = 1 + 3 * (nmax - nd) / (nmax - nmin);
  return Math.max(1, Number(x.toFixed(2)));
}

export function convertToGermanGPA(input: GPAInput): GPAConversionResult {
  const { gradeAchieved, maxGrade, minPassGrade } = input;
  
  // Validation
  if (gradeAchieved > maxGrade || gradeAchieved < minPassGrade) {
    throw new Error('Invalid grade: achieved grade must be between min pass and max grade');
  }
  
  const germanGPA = computeGermanGPA(maxGrade, minPassGrade, gradeAchieved);
  
  if (germanGPA === null) {
    throw new Error('Unable to compute German GPA with provided values');
  }
  
  const formula = `1 + 3 × (${maxGrade} - ${gradeAchieved}) / (${maxGrade} - ${minPassGrade}) = ${germanGPA}`;
  
  let status: 'excellent' | 'good' | 'borderline' | 'insufficient';
  let explanation: string;
  
  if (germanGPA <= 1.5) {
    status = 'excellent';
    explanation = 'Excellent - You have strong chances for competitive programs';
  } else if (germanGPA <= 2.5) {
    status = 'good';
    explanation = 'Good - You meet requirements for most programs';
  } else if (germanGPA <= 3.5) {
    status = 'borderline';
    explanation = 'Borderline - Some programs may require additional qualifications';
  } else {
    status = 'insufficient';
    explanation = 'Below requirements for most programs - consider improving grades';
  }
  
  return {
    germanGPA,
    formula,
    explanation,
    status
  };
}

// Common GPA scale presets
export const GPA_SCALES = {
  US_4_0: { max: 4.0, minPass: 2.0 },
  UK_CLASSIFICATION: { max: 100, minPass: 40 },
  PERCENTAGE: { max: 100, minPass: 50 },
  GERMAN: { max: 1.0, minPass: 4.0 },
  CGPA_10: { max: 10, minPass: 5 }
};