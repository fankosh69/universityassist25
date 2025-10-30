import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Program {
  id: string;
  name: string;
  field_of_study: string | null;
  field_of_study_id: string | null;
}

interface FieldOfStudy {
  id: string;
  name: string;
  name_de?: string;
  name_ar?: string;
  slug: string;
  parent_id?: string;
  level: number;
}

interface MatchResult {
  programId: string;
  programName: string;
  oldFieldText: string;
  matchedFieldId: string | null;
  matchedFieldName: string | null;
  confidence: 'high' | 'medium' | 'low' | 'none';
  keywords: string[];
}

// Comprehensive keyword mapping
const KEYWORD_MAPPINGS: Record<string, string[]> = {
  'computer_science': ['computer science', 'cs', 'informatics', 'software engineering', 'it', 'information technology', 'software development', 'programming'],
  'artificial_intelligence': ['ai', 'artificial intelligence', 'machine learning', 'ml', 'deep learning', 'data science', 'data analytics', 'big data'],
  'business_administration': ['business', 'management', 'mba', 'administration', 'business administration', 'business management'],
  'engineering': ['engineering', 'engineer'],
  'mechanical_engineering': ['mechanical', 'mechatronics', 'automotive'],
  'electrical_engineering': ['electrical', 'electronics', 'automation'],
  'medicine': ['medicine', 'medical', 'health', 'healthcare'],
  'law': ['law', 'legal', 'jurisprudence'],
  'economics': ['economics', 'economy', 'economic'],
  'finance': ['finance', 'financial', 'banking'],
  'marketing': ['marketing', 'brand', 'advertising'],
  'design': ['design', 'ux', 'ui', 'graphic', 'visual'],
  'architecture': ['architecture', 'architectural'],
  'psychology': ['psychology', 'psychological', 'psychotherapy'],
  'education': ['education', 'teaching', 'pedagogy'],
  'mathematics': ['mathematics', 'math', 'statistics'],
  'physics': ['physics', 'physical'],
  'chemistry': ['chemistry', 'chemical'],
  'biology': ['biology', 'biological', 'life sciences'],
};

function normalizeText(text: string): string {
  return text.toLowerCase().trim().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ');
}

function extractKeywords(fieldOfStudyText: string): string[] {
  if (!fieldOfStudyText) return [];
  const parts = fieldOfStudyText.split(/[;,]/);
  return parts.map(p => normalizeText(p)).filter(p => p.length > 0);
}

function scoreMatch(keyword: string, field: FieldOfStudy, allFields: FieldOfStudy[]): { score: number; reason: string } {
  const normalizedKeyword = normalizeText(keyword);
  const normalizedFieldName = normalizeText(field.name);
  const normalizedFieldSlug = normalizeText(field.slug);
  
  // Exact match (highest priority)
  if (normalizedKeyword === normalizedFieldName) {
    return { score: 100 + (field.level * 10), reason: 'exact_match' };
  }
  
  // Slug match
  if (normalizedKeyword.includes(normalizedFieldSlug) || normalizedFieldSlug.includes(normalizedKeyword)) {
    return { score: 90 + (field.level * 10), reason: 'slug_match' };
  }
  
  // Partial word match in name
  if (normalizedFieldName.includes(normalizedKeyword) || normalizedKeyword.includes(normalizedFieldName)) {
    return { score: 80 + (field.level * 10), reason: 'partial_match' };
  }
  
  // Check keyword mappings
  for (const [fieldKey, keywords] of Object.entries(KEYWORD_MAPPINGS)) {
    if (keywords.some(k => normalizedKeyword.includes(k) || k.includes(normalizedKeyword))) {
      if (normalizedFieldSlug.includes(fieldKey.replace('_', ' ')) || normalizedFieldName.includes(fieldKey.replace('_', ' '))) {
        return { score: 70 + (field.level * 10), reason: 'keyword_mapping' };
      }
    }
  }
  
  // Fuzzy match with word overlap
  const keywordWords = normalizedKeyword.split(' ');
  const fieldWords = normalizedFieldName.split(' ');
  const commonWords = keywordWords.filter(w => fieldWords.includes(w) && w.length > 3);
  
  if (commonWords.length > 0) {
    return { score: 60 + (commonWords.length * 10) + (field.level * 5), reason: 'word_overlap' };
  }
  
  return { score: 0, reason: 'no_match' };
}

function findBestMatch(keywords: string[], fields: FieldOfStudy[]): { fieldId: string | null; fieldName: string | null; confidence: 'high' | 'medium' | 'low' | 'none' } {
  let bestScore = 0;
  let bestField: FieldOfStudy | null = null;
  let bestReason = '';
  
  for (const keyword of keywords) {
    for (const field of fields) {
      const { score, reason } = scoreMatch(keyword, field, fields);
      if (score > bestScore) {
        bestScore = score;
        bestField = field;
        bestReason = reason;
      }
    }
  }
  
  if (!bestField) {
    return { fieldId: null, fieldName: null, confidence: 'none' };
  }
  
  let confidence: 'high' | 'medium' | 'low' = 'low';
  if (bestScore >= 90) confidence = 'high';
  else if (bestScore >= 70) confidence = 'medium';
  
  console.log(`Best match: ${bestField.name} (score: ${bestScore}, reason: ${bestReason})`);
  
  return { fieldId: bestField.id, fieldName: bestField.name, confidence };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { dryRun = false, onlyHighConfidence = false } = await req.json().catch(() => ({}));

    console.log(`Starting migration (dryRun: ${dryRun}, onlyHighConfidence: ${onlyHighConfidence})`);

    // Fetch all programs without field_of_study_id
    const { data: programs, error: programsError } = await supabase
      .from('programs')
      .select('id, name, field_of_study, field_of_study_id')
      .is('field_of_study_id', null)
      .not('field_of_study', 'is', null);

    if (programsError) throw programsError;

    console.log(`Found ${programs?.length || 0} programs to migrate`);

    // Fetch all fields of study
    const { data: fields, error: fieldsError } = await supabase
      .from('fields_of_study')
      .select('*')
      .eq('is_active', true);

    if (fieldsError) throw fieldsError;

    console.log(`Loaded ${fields?.length || 0} fields of study for matching`);

    const results: MatchResult[] = [];
    const updates: { id: string; field_of_study_id: string }[] = [];

    // Process each program
    for (const program of programs || []) {
      const keywords = extractKeywords(program.field_of_study || '');
      const match = findBestMatch(keywords, fields || []);
      
      results.push({
        programId: program.id,
        programName: program.name,
        oldFieldText: program.field_of_study || '',
        matchedFieldId: match.fieldId,
        matchedFieldName: match.fieldName,
        confidence: match.confidence,
        keywords,
      });

      // Only update if we have a match and meet confidence criteria
      if (match.fieldId && (!onlyHighConfidence || match.confidence === 'high')) {
        updates.push({ id: program.id, field_of_study_id: match.fieldId });
      }
    }

    // Perform updates if not dry run
    let updateCount = 0;
    if (!dryRun && updates.length > 0) {
      for (const update of updates) {
        const { error: updateError } = await supabase
          .from('programs')
          .update({ field_of_study_id: update.field_of_study_id })
          .eq('id', update.id);

        if (!updateError) {
          updateCount++;
        } else {
          console.error(`Failed to update program ${update.id}:`, updateError);
        }
      }
    }

    const summary = {
      totalPrograms: programs?.length || 0,
      matched: results.filter(r => r.matchedFieldId).length,
      highConfidence: results.filter(r => r.confidence === 'high').length,
      mediumConfidence: results.filter(r => r.confidence === 'medium').length,
      lowConfidence: results.filter(r => r.confidence === 'low').length,
      noMatch: results.filter(r => r.confidence === 'none').length,
      updated: updateCount,
      dryRun,
    };

    console.log('Migration summary:', summary);

    return new Response(
      JSON.stringify({
        success: true,
        summary,
        results,
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('Error in migrate-program-fields:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Internal server error',
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});
