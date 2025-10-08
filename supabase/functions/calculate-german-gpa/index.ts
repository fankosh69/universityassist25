import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GPAInput {
  gradeAchieved: number;
  maxGrade: number;
  minPassGrade: number;
}

interface GPAConversionResult {
  germanGPA: number;
  formula: string;
  explanation: string;
  status: 'excellent' | 'good' | 'satisfactory' | 'sufficient' | 'poor';
}

function convertToGermanGPA(input: GPAInput): GPAConversionResult {
  const { gradeAchieved, maxGrade, minPassGrade } = input;

  // Validation
  if (maxGrade <= minPassGrade) {
    throw new Error('Maximum grade must be higher than minimum passing grade');
  }
  
  if (gradeAchieved < minPassGrade || gradeAchieved > maxGrade) {
    throw new Error('Grade achieved must be between minimum passing grade and maximum grade');
  }

  // Apply Modified Bavarian Formula: X = 1 + 3 * (Nmax - Nd) / (Nmax - Nmin)
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

// Common grade systems
const GRADE_SYSTEMS: Record<string, { max: number; min: number; description: string }> = {
  'igcse_a_level': { max: 100, min: 40, description: 'IGCSE/A-Level (A*=90+, A=80+, B=70+, C=60+, D=50+, E=40+)' },
  'ib': { max: 7, min: 4, description: 'International Baccalaureate (7=highest, 4=pass)' },
  'us_gpa': { max: 4.0, min: 2.0, description: 'US GPA 4.0 scale' },
  'percentage': { max: 100, min: 50, description: 'Percentage system (100% max, 50% pass)' },
  'german': { max: 1.0, min: 4.0, description: 'Already German system (no conversion needed)' },
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { gradeAchieved, maxGrade, minPassGrade, gradeSystem } = await req.json();

    console.log('[GPA] Calculation request:', { gradeAchieved, maxGrade, minPassGrade, gradeSystem });

    // If grade system is specified, use predefined values
    let finalMaxGrade = maxGrade;
    let finalMinPassGrade = minPassGrade;

    if (gradeSystem && GRADE_SYSTEMS[gradeSystem]) {
      const system = GRADE_SYSTEMS[gradeSystem];
      finalMaxGrade = finalMaxGrade || system.max;
      finalMinPassGrade = finalMinPassGrade || system.min;
      console.log(`[GPA] Using ${gradeSystem} system:`, system.description);
    }

    // Validation
    if (!gradeAchieved || !finalMaxGrade || !finalMinPassGrade) {
      throw new Error('Missing required parameters: gradeAchieved, maxGrade, and minPassGrade are required');
    }

    const result = convertToGermanGPA({
      gradeAchieved: Number(gradeAchieved),
      maxGrade: Number(finalMaxGrade),
      minPassGrade: Number(finalMinPassGrade),
    });

    console.log('[GPA] Conversion result:', result);

    return new Response(
      JSON.stringify({
        success: true,
        ...result,
        gradeSystem: gradeSystem || 'custom',
        input: {
          gradeAchieved: Number(gradeAchieved),
          maxGrade: Number(finalMaxGrade),
          minPassGrade: Number(finalMinPassGrade),
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('[GPA] Error in calculate-german-gpa:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
