import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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
  field_of_study_id: string | null;
  field_of_study_name: string | null;
  confidence: 'high' | 'medium' | 'low' | 'none';
  confidence_score: number;
  match_reason: string;
}

// Comprehensive keyword mapping for common fields
const KEYWORD_MAPPINGS: Record<string, string[]> = {
  'computer_science': ['computer science', 'cs', 'informatics', 'software engineering', 'it', 'information technology', 'software development', 'programming', 'informatik', 'computing'],
  'artificial_intelligence': ['ai', 'artificial intelligence', 'machine learning', 'ml', 'deep learning', 'data science', 'data analytics', 'big data', 'neural networks'],
  'business_administration': ['business', 'management', 'mba', 'administration', 'business administration', 'business management', 'betriebswirtschaft', 'bwl'],
  'engineering': ['engineering', 'engineer', 'ingenieurwesen'],
  'mechanical_engineering': ['mechanical', 'mechatronics', 'automotive', 'maschinenbau'],
  'electrical_engineering': ['electrical', 'electronics', 'automation', 'elektrotechnik'],
  'civil_engineering': ['civil', 'construction', 'building', 'bauingenieur'],
  'medicine': ['medicine', 'medical', 'health', 'healthcare', 'medizin'],
  'law': ['law', 'legal', 'jurisprudence', 'jura', 'rechtswissenschaft'],
  'economics': ['economics', 'economy', 'economic', 'volkswirtschaft', 'vwl'],
  'finance': ['finance', 'financial', 'banking', 'finanzwesen'],
  'marketing': ['marketing', 'brand', 'advertising'],
  'design': ['design', 'ux', 'ui', 'graphic', 'visual', 'gestaltung'],
  'architecture': ['architecture', 'architectural', 'architektur'],
  'psychology': ['psychology', 'psychological', 'psychotherapy', 'psychologie'],
  'education': ['education', 'teaching', 'pedagogy', 'pädagogik', 'lehramt'],
  'mathematics': ['mathematics', 'math', 'statistics', 'mathematik'],
  'physics': ['physics', 'physical', 'physik'],
  'chemistry': ['chemistry', 'chemical', 'chemie'],
  'biology': ['biology', 'biological', 'life sciences', 'biologie'],
  'environmental': ['environmental', 'sustainability', 'ecology', 'umwelt'],
  'communication': ['communication', 'media', 'journalism', 'kommunikation', 'medien'],
  'social_sciences': ['social', 'sociology', 'political', 'sozialwissenschaft'],
  'history': ['history', 'historical', 'geschichte'],
  'philosophy': ['philosophy', 'philosophical', 'philosophie'],
  'languages': ['language', 'linguistics', 'translation', 'sprach'],
  'arts': ['arts', 'art', 'kunst', 'fine arts'],
  'music': ['music', 'musical', 'musik'],
};

function normalizeText(text: string): string {
  return text.toLowerCase().trim().replace(/[^a-z0-9äöüß\s]/g, ' ').replace(/\s+/g, ' ');
}

function extractKeywords(fieldOfStudyText: string): string[] {
  if (!fieldOfStudyText) return [];
  // Split by common delimiters
  const parts = fieldOfStudyText.split(/[;,\/&]/);
  return parts.map(p => normalizeText(p)).filter(p => p.length > 0);
}

function scoreMatch(keyword: string, field: FieldOfStudy): { score: number; reason: string } {
  const normalizedKeyword = normalizeText(keyword);
  const normalizedFieldName = normalizeText(field.name);
  const normalizedFieldSlug = normalizeText(field.slug.replace(/-/g, ' '));
  const normalizedFieldNameDe = field.name_de ? normalizeText(field.name_de) : '';
  
  // Exact match (highest priority)
  if (normalizedKeyword === normalizedFieldName || normalizedKeyword === normalizedFieldNameDe) {
    return { score: 100 + (field.level * 10), reason: 'exact_match' };
  }
  
  // Slug match
  if (normalizedKeyword.includes(normalizedFieldSlug) || normalizedFieldSlug.includes(normalizedKeyword)) {
    return { score: 90 + (field.level * 10), reason: 'slug_match' };
  }
  
  // Partial word match in name (higher specificity with level bonus)
  if (normalizedFieldName.includes(normalizedKeyword) || normalizedKeyword.includes(normalizedFieldName)) {
    return { score: 80 + (field.level * 10), reason: 'partial_name_match' };
  }
  
  // German name match
  if (normalizedFieldNameDe && (normalizedFieldNameDe.includes(normalizedKeyword) || normalizedKeyword.includes(normalizedFieldNameDe))) {
    return { score: 75 + (field.level * 10), reason: 'german_name_match' };
  }
  
  // Check keyword mappings
  for (const [fieldKey, keywords] of Object.entries(KEYWORD_MAPPINGS)) {
    if (keywords.some(k => normalizedKeyword.includes(k) || k.includes(normalizedKeyword))) {
      const fieldKeyNormalized = fieldKey.replace(/_/g, ' ');
      if (normalizedFieldSlug.includes(fieldKeyNormalized) || normalizedFieldName.includes(fieldKeyNormalized)) {
        return { score: 70 + (field.level * 10), reason: 'keyword_mapping' };
      }
    }
  }
  
  // Fuzzy match with word overlap
  const keywordWords = normalizedKeyword.split(' ').filter(w => w.length > 3);
  const fieldWords = normalizedFieldName.split(' ').filter(w => w.length > 3);
  const commonWords = keywordWords.filter(w => fieldWords.some(fw => fw.includes(w) || w.includes(fw)));
  
  if (commonWords.length > 0) {
    return { score: 50 + (commonWords.length * 10) + (field.level * 5), reason: 'word_overlap' };
  }
  
  return { score: 0, reason: 'no_match' };
}

function findBestMatch(keywords: string[], fields: FieldOfStudy[]): MatchResult {
  let bestScore = 0;
  let bestField: FieldOfStudy | null = null;
  let bestReason = '';
  
  for (const keyword of keywords) {
    for (const field of fields) {
      const { score, reason } = scoreMatch(keyword, field);
      if (score > bestScore) {
        bestScore = score;
        bestField = field;
        bestReason = reason;
      }
    }
  }
  
  if (!bestField) {
    return { 
      field_of_study_id: null, 
      field_of_study_name: null, 
      confidence: 'none',
      confidence_score: 0,
      match_reason: 'no_match'
    };
  }
  
  let confidence: 'high' | 'medium' | 'low' = 'low';
  if (bestScore >= 90) confidence = 'high';
  else if (bestScore >= 70) confidence = 'medium';
  
  return { 
    field_of_study_id: bestField.id, 
    field_of_study_name: bestField.name, 
    confidence,
    confidence_score: Math.min(bestScore, 100),
    match_reason: bestReason
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const body = await req.json();
    
    // Support both single and batch matching
    const isBatch = Array.isArray(body.fields);
    const fieldsToMatch: string[] = isBatch ? body.fields : [body.field_of_study];

    if (fieldsToMatch.length === 0 || !fieldsToMatch[0]) {
      return new Response(
        JSON.stringify({ success: false, error: 'field_of_study or fields array required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch all active fields of study
    const { data: fields, error: fieldsError } = await supabase
      .from('fields_of_study')
      .select('id, name, name_de, name_ar, slug, parent_id, level')
      .eq('is_active', true);

    if (fieldsError) {
      console.error('Error fetching fields:', fieldsError);
      throw fieldsError;
    }

    console.log(`Loaded ${fields?.length || 0} fields of study for matching`);

    const results: MatchResult[] = [];

    for (const fieldText of fieldsToMatch) {
      const keywords = extractKeywords(fieldText || '');
      console.log(`Matching "${fieldText}" with keywords:`, keywords);
      
      const match = findBestMatch(keywords, fields || []);
      results.push(match);
      
      console.log(`Result: ${match.field_of_study_name || 'none'} (${match.confidence}, score: ${match.confidence_score})`);
    }

    // Return single result or array based on input
    return new Response(
      JSON.stringify({
        success: true,
        data: isBatch ? results : results[0],
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in match-field-of-study:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Internal server error',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
