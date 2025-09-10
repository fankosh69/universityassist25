import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0';
import { parse } from "https://deno.land/std@0.224.0/csv/parse.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CSVRow {
  program_name: string;
  university_id: string;
  field_of_study: string;
  degree_type: string;
  degree_level: 'bachelor' | 'master';
  duration_semesters: string;
  ects_credits?: string;
  semester_fees?: string;
  minimum_gpa?: string;
  language_of_instruction?: string;
  language_requirements?: string;
  prerequisites?: string;
  application_method: 'direct' | 'uni_assist_direct' | 'uni_assist_vpd' | 'recognition_certificates';
  uni_assist_required?: string;
  recognition_weeks_before?: string;
  program_url?: string;
  delivery_mode?: string;
  description?: string;
  published?: string;
  intake_season: 'winter' | 'summer';
  application_start_date: string;
  application_end_date: string;
  semester_start_date: string;
  notes?: string;
}

// Utility function to parse comma-separated values
function parseArrayField(value: string | undefined): string[] {
  if (!value || value.trim() === '') return [];
  return value.split(',').map(item => item.trim()).filter(item => item !== '');
}

// Utility function to parse boolean values
function parseBoolean(value: string | undefined, defaultValue: boolean = false): boolean {
  if (!value || value.trim() === '') return defaultValue;
  return value.toLowerCase() === 'true';
}

// Utility function to parse dates (DD/MM/YYYY to YYYY-MM-DD)
function parseDate(dateStr: string): string | null {
  if (!dateStr || dateStr.trim() === '') return null;
  
  // Handle DD/MM/YYYY format
  const parts = dateStr.trim().split('/');
  if (parts.length === 3) {
    const [day, month, year] = parts;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }
  
  // If already in YYYY-MM-DD format, return as is
  if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
    return dateStr;
  }
  
  throw new Error(`Invalid date format: ${dateStr}. Expected DD/MM/YYYY`);
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { csvContent } = await req.json();
    
    if (!csvContent) {
      throw new Error('No CSV content provided');
    }

    console.log('Processing CSV content...');

    // Parse CSV
    const records = parse(csvContent, {
      skipFirstRow: true,
      columns: [
        'program_name',
        'university_id', 
        'field_of_study',
        'degree_type',
        'degree_level',
        'duration_semesters',
        'ects_credits',
        'semester_fees',
        'minimum_gpa',
        'language_of_instruction',
        'language_requirements',
        'prerequisites',
        'application_method',
        'uni_assist_required',
        'recognition_weeks_before',
        'program_url',
        'delivery_mode',
        'description',
        'published',
        'intake_season',
        'application_start_date',
        'application_end_date',
        'semester_start_date',
        'notes'
      ]
    }) as CSVRow[];

    console.log(`Parsed ${records.length} records from CSV`);

    const errors: Array<{ row: number; error: string; data?: any }> = [];
    const successfulPrograms: Array<{ name: string; university: string }> = [];
    const currentYear = new Date().getFullYear();

    // Get all universities for validation
    const { data: universities, error: uniError } = await supabase
      .from('universities')
      .select('id, name');
    
    if (uniError) {
      throw new Error(`Failed to fetch universities: ${uniError.message}`);
    }

    const universityMap = new Map(universities.map(uni => [uni.id, uni.name]));

    // Process each record
    for (let i = 0; i < records.length; i++) {
      const rowNum = i + 2; // +2 because we skip header and arrays are 0-indexed
      const record = records[i];

      try {
        // Validate required fields
        if (!record.program_name?.trim()) {
          throw new Error('Program name is required');
        }
        
        if (!record.university_id?.trim()) {
          throw new Error('University ID is required');
        }

        if (!universityMap.has(record.university_id)) {
          throw new Error(`University ID '${record.university_id}' not found`);
        }

        if (!record.field_of_study?.trim()) {
          throw new Error('Field of study is required');
        }

        if (!record.degree_type?.trim()) {
          throw new Error('Degree type is required');
        }

        if (!record.degree_level || !['bachelor', 'master'].includes(record.degree_level)) {
          throw new Error('Degree level must be either "bachelor" or "master"');
        }

        if (!record.duration_semesters || isNaN(parseInt(record.duration_semesters))) {
          throw new Error('Duration semesters must be a valid number');
        }

        if (!record.intake_season || !['winter', 'summer'].includes(record.intake_season)) {
          throw new Error('Intake season must be either "winter" or "summer"');
        }

        if (!record.application_start_date || !record.application_end_date || !record.semester_start_date) {
          throw new Error('Application start date, end date, and semester start date are required');
        }

        // Parse and validate dates
        const applicationStartDate = parseDate(record.application_start_date);
        const applicationEndDate = parseDate(record.application_end_date);
        const semesterStartDate = parseDate(record.semester_start_date);

        if (!applicationStartDate || !applicationEndDate || !semesterStartDate) {
          throw new Error('Invalid date format in application periods');
        }

        // Validate date logic
        if (new Date(applicationStartDate) >= new Date(applicationEndDate)) {
          throw new Error('Application start date must be before end date');
        }

        if (new Date(applicationEndDate) >= new Date(semesterStartDate)) {
          throw new Error('Application end date must be before semester start date');
        }

        // Prepare program data
        const programData = {
          name: record.program_name.trim(),
          university_id: record.university_id,
          field_of_study: record.field_of_study.trim(),
          degree_type: record.degree_type.trim(),
          degree_level: record.degree_level,
          duration_semesters: parseInt(record.duration_semesters),
          ects_credits: record.ects_credits ? parseInt(record.ects_credits) : null,
          semester_fees: record.semester_fees ? parseInt(record.semester_fees) : 0,
          minimum_gpa: record.minimum_gpa ? parseFloat(record.minimum_gpa) : null,
          language_of_instruction: parseArrayField(record.language_of_instruction),
          language_requirements: parseArrayField(record.language_requirements),
          prerequisites: parseArrayField(record.prerequisites),
          application_method: record.application_method || 'direct',
          uni_assist_required: parseBoolean(record.uni_assist_required, false),
          recognition_weeks_before: record.recognition_weeks_before ? parseInt(record.recognition_weeks_before) : 10,
          program_url: record.program_url?.trim() || null,
          delivery_mode: record.delivery_mode?.trim() || 'on_campus',
          description: record.description?.trim() || null,
          published: parseBoolean(record.published, true),
          country_code: 'DE',
          // Set intake flags based on the current record's intake_season
          winter_intake: record.intake_season === 'winter',
          summer_intake: record.intake_season === 'summer'
        };

        // Check if program already exists
        const { data: existingProgram } = await supabase
          .from('programs')
          .select('id')
          .eq('name', programData.name)
          .eq('university_id', programData.university_id)
          .single();

        let programId: string;

        if (existingProgram) {
          // Update existing program
          const { data: updatedProgram, error: updateError } = await supabase
            .from('programs')
            .update(programData)
            .eq('id', existingProgram.id)
            .select('id')
            .single();

          if (updateError) throw updateError;
          programId = updatedProgram.id;
        } else {
          // Insert new program
          const { data: newProgram, error: insertError } = await supabase
            .from('programs')
            .insert(programData)
            .select('id')
            .single();

          if (insertError) throw insertError;
          programId = newProgram.id;
        }

        // Now create/update application period
        const applicationPeriodData = {
          program_id: programId,
          intake_season: record.intake_season,
          intake_year: currentYear,
          application_start_date: applicationStartDate,
          application_end_date: applicationEndDate,
          semester_start_date: semesterStartDate,
          notes: record.notes?.trim() || null,
          is_active: true
        };

        // Check if application period exists for this program and season/year
        const { data: existingPeriod } = await supabase
          .from('application_periods')
          .select('id')
          .eq('program_id', programId)
          .eq('intake_season', record.intake_season)
          .eq('intake_year', currentYear)
          .single();

        if (existingPeriod) {
          // Update existing period
          const { error: updatePeriodError } = await supabase
            .from('application_periods')
            .update(applicationPeriodData)
            .eq('id', existingPeriod.id);

          if (updatePeriodError) throw updatePeriodError;
        } else {
          // Insert new period
          const { error: insertPeriodError } = await supabase
            .from('application_periods')
            .insert(applicationPeriodData);

          if (insertPeriodError) throw insertPeriodError;
        }

        successfulPrograms.push({
          name: programData.name,
          university: universityMap.get(record.university_id) || 'Unknown University'
        });

        console.log(`Successfully processed row ${rowNum}: ${programData.name}`);

      } catch (error) {
        console.error(`Error processing row ${rowNum}:`, error.message);
        errors.push({
          row: rowNum,
          error: error.message,
          data: record
        });
      }
    }

    const result = {
      success: errors.length === 0,
      processedRows: records.length,
      errors: errors,
      successfulPrograms: successfulPrograms
    };

    console.log('Processing complete:', result);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in ingest-programs-bulk:', error);
    return new Response(
      JSON.stringify({
        success: false,
        processedRows: 0,
        errors: [{
          row: 0,
          error: `Processing failed: ${error.message}`
        }]
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});