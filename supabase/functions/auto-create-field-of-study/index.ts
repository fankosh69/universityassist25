import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AutoCreateRequest {
  field_name: string;
  program_name?: string;
  degree_level?: 'bachelor' | 'master';
}

interface AutoCreateResponse {
  success: boolean;
  created: boolean;
  field_of_study_id: string | null;
  field_of_study_name: string | null;
  parent_field_name: string | null;
  message: string;
}

// Mapping of field keywords to parent categories
const FIELD_CATEGORY_MAPPING: Record<string, string[]> = {
  'Engineering': [
    'engineering', 'maschinenbau', 'mechanical', 'electrical', 'elektrotechnik',
    'civil', 'bauingenieur', 'aerospace', 'automotive', 'mechatronics', 'mechatronik',
    'industrial', 'chemical', 'biomedical', 'materials', 'werkstoff', 'manufacturing',
    'robotics', 'automation', 'energy', 'renewable', 'environmental engineering',
    'process engineering', 'verfahrenstechnik', 'production', 'systems engineering'
  ],
  'Computer Science': [
    'computer science', 'informatik', 'software', 'programming', 'data science',
    'artificial intelligence', 'machine learning', 'cybersecurity', 'information systems',
    'it', 'computing', 'digital', 'web development', 'mobile development', 'algorithms',
    'bioinformatics', 'computational', 'applied informatics', 'angewandte informatik',
    'wirtschaftsinformatik', 'business informatics', 'medieninformatik'
  ],
  'Business & Economics': [
    'business', 'economics', 'management', 'finance', 'accounting', 'marketing',
    'betriebswirtschaft', 'bwl', 'vwl', 'volkswirtschaft', 'mba', 'commerce',
    'international business', 'entrepreneurship', 'supply chain', 'logistics',
    'banking', 'insurance', 'real estate', 'human resources', 'hr'
  ],
  'Natural Sciences': [
    'physics', 'physik', 'chemistry', 'chemie', 'biology', 'biologie', 'mathematics',
    'mathematik', 'statistics', 'statistik', 'geology', 'geologie', 'geography',
    'astronomy', 'biochemistry', 'biotechnology', 'environmental science', 'umwelt',
    'neuroscience', 'genetics', 'molecular', 'life sciences'
  ],
  'Medicine & Health': [
    'medicine', 'medizin', 'health', 'gesundheit', 'nursing', 'pflege', 'pharmacy',
    'pharmazie', 'dentistry', 'zahnmedizin', 'public health', 'physiotherapy',
    'nutrition', 'ernährung', 'sports science', 'sportwissenschaft', 'rehabilitation',
    'therapy', 'clinical', 'healthcare management', 'biomedical'
  ],
  'Social Sciences': [
    'psychology', 'psychologie', 'sociology', 'soziologie', 'political science',
    'politikwissenschaft', 'social work', 'sozialarbeit', 'anthropology', 'criminology',
    'international relations', 'public policy', 'public administration', 'gender studies',
    'communication', 'kommunikation', 'media studies', 'journalism'
  ],
  'Arts & Humanities': [
    'art', 'kunst', 'history', 'geschichte', 'philosophy', 'philosophie', 'literature',
    'literatur', 'languages', 'sprachen', 'linguistics', 'linguistik', 'music', 'musik',
    'theatre', 'theater', 'cultural studies', 'kulturwissenschaft', 'religion',
    'archaeology', 'archäologie', 'classics'
  ],
  'Law': [
    'law', 'jura', 'rechtswissenschaft', 'legal', 'recht', 'jurisprudence',
    'international law', 'business law', 'criminal law', 'constitutional'
  ],
  'Architecture & Design': [
    'architecture', 'architektur', 'design', 'gestaltung', 'urban planning',
    'stadtplanung', 'interior design', 'industrial design', 'graphic design',
    'product design', 'fashion', 'mode', 'landscape', 'landschaft'
  ],
  'Education': [
    'education', 'pädagogik', 'erziehungswissenschaft', 'teaching', 'lehramt',
    'didactics', 'didaktik', 'educational', 'pedagogy', 'childhood education',
    'special education', 'sonderpädagogik'
  ]
};

// Find the best parent category for a field name
function findParentCategory(fieldName: string): string | null {
  const lowerFieldName = fieldName.toLowerCase();
  
  for (const [category, keywords] of Object.entries(FIELD_CATEGORY_MAPPING)) {
    for (const keyword of keywords) {
      if (lowerFieldName.includes(keyword) || keyword.includes(lowerFieldName)) {
        return category;
      }
    }
  }
  
  return null;
}

// Generate a URL-friendly slug
function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[äÄ]/g, 'ae')
    .replace(/[öÖ]/g, 'oe')
    .replace(/[üÜ]/g, 'ue')
    .replace(/ß/g, 'ss')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { field_name, program_name, degree_level }: AutoCreateRequest = await req.json();

    if (!field_name || field_name.trim().length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: 'field_name is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const cleanFieldName = field_name.trim();
    console.log(`Auto-creating field of study: "${cleanFieldName}"`);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // First, try to find an existing match using the match-field-of-study function
    const matchResponse = await fetch(`${supabaseUrl}/functions/v1/match-field-of-study`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ field_of_study: cleanFieldName }),
    });

    if (matchResponse.ok) {
      const matchResult = await matchResponse.json();
      if (matchResult.success && matchResult.data?.confidence !== 'none' && matchResult.data?.field_of_study_id) {
        console.log(`Found existing match: ${matchResult.data.field_of_study_name} (${matchResult.data.confidence})`);
        
        const response: AutoCreateResponse = {
          success: true,
          created: false,
          field_of_study_id: matchResult.data.field_of_study_id,
          field_of_study_name: matchResult.data.field_of_study_name,
          parent_field_name: null,
          message: `Matched to existing field: ${matchResult.data.field_of_study_name}`
        };
        
        return new Response(
          JSON.stringify(response),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // No match found, need to create a new field
    console.log('No existing match found, attempting to create new field');

    // Find the parent category
    const parentCategoryName = findParentCategory(cleanFieldName);
    
    if (!parentCategoryName) {
      console.log(`Could not determine parent category for: ${cleanFieldName}`);
      
      const response: AutoCreateResponse = {
        success: false,
        created: false,
        field_of_study_id: null,
        field_of_study_name: null,
        parent_field_name: null,
        message: `Could not determine parent category for: ${cleanFieldName}. Manual review required.`
      };
      
      return new Response(
        JSON.stringify(response),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Determined parent category: ${parentCategoryName}`);

    // Find the parent field in the database (should be level 1)
    const { data: parentField, error: parentError } = await supabase
      .from('fields_of_study')
      .select('id, name, level')
      .eq('level', 1)
      .ilike('name', `%${parentCategoryName}%`)
      .limit(1)
      .single();

    if (parentError || !parentField) {
      console.log(`Parent category "${parentCategoryName}" not found in database`);
      
      const response: AutoCreateResponse = {
        success: false,
        created: false,
        field_of_study_id: null,
        field_of_study_name: null,
        parent_field_name: parentCategoryName,
        message: `Parent category "${parentCategoryName}" not found. Manual setup required.`
      };
      
      return new Response(
        JSON.stringify(response),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if there's a level 2 subcategory we should use instead
    const { data: subCategories } = await supabase
      .from('fields_of_study')
      .select('id, name, level')
      .eq('parent_id', parentField.id)
      .eq('level', 2);

    let actualParentId = parentField.id;
    let actualParentName = parentField.name;
    let newLevel = 2;

    // If there are subcategories, try to find a matching one
    if (subCategories && subCategories.length > 0) {
      const lowerFieldName = cleanFieldName.toLowerCase();
      for (const sub of subCategories) {
        if (lowerFieldName.includes(sub.name.toLowerCase()) || 
            sub.name.toLowerCase().includes(lowerFieldName.split(' ')[0])) {
          actualParentId = sub.id;
          actualParentName = sub.name;
          newLevel = 3;
          console.log(`Found matching subcategory: ${sub.name}`);
          break;
        }
      }
    }

    // Generate slug
    const slug = slugify(cleanFieldName);

    // Check if slug already exists
    const { data: existingSlug } = await supabase
      .from('fields_of_study')
      .select('id')
      .eq('slug', slug)
      .limit(1);

    if (existingSlug && existingSlug.length > 0) {
      console.log(`Slug "${slug}" already exists, this field may already exist`);
      
      const response: AutoCreateResponse = {
        success: false,
        created: false,
        field_of_study_id: existingSlug[0].id,
        field_of_study_name: null,
        parent_field_name: actualParentName,
        message: `A field with similar name already exists`
      };
      
      return new Response(
        JSON.stringify(response),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create the new field
    const { data: newField, error: createError } = await supabase
      .from('fields_of_study')
      .insert({
        name: cleanFieldName,
        slug,
        level: newLevel,
        parent_id: actualParentId,
        is_active: true,
        sort_order: 100 // Default sort order
      })
      .select()
      .single();

    if (createError) {
      console.error('Error creating field:', createError);
      throw createError;
    }

    console.log(`Successfully created new field: ${cleanFieldName} (ID: ${newField.id})`);

    const response: AutoCreateResponse = {
      success: true,
      created: true,
      field_of_study_id: newField.id,
      field_of_study_name: newField.name,
      parent_field_name: actualParentName,
      message: `Created new field "${cleanFieldName}" under "${actualParentName}"`
    };

    return new Response(
      JSON.stringify(response),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in auto-create-field-of-study:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
