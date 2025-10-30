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
  sort_order: number;
  is_active: boolean;
}

interface FieldNode extends FieldOfStudy {
  programCount: number;
  children: FieldNode[];
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Fetching fields of study hierarchy...');

    // Fetch all active fields
    const { data: fields, error: fieldsError } = await supabase
      .from('fields_of_study')
      .select('*')
      .eq('is_active', true)
      .order('level', { ascending: true })
      .order('sort_order', { ascending: true });

    if (fieldsError) {
      console.error('Error fetching fields:', fieldsError);
      throw fieldsError;
    }

    console.log(`Fetched ${fields?.length || 0} fields`);

    // Fetch program counts for each field
    const fieldIds = fields?.map(f => f.id) || [];
    const programCounts: Record<string, number> = {};

    // Get program counts efficiently
    for (const fieldId of fieldIds) {
      const { data: countData, error: countError } = await supabase
        .rpc('count_programs_by_field', { field_id: fieldId });

      if (!countError && countData !== null) {
        programCounts[fieldId] = countData;
      } else {
        programCounts[fieldId] = 0;
      }
    }

    console.log('Program counts calculated');

    // Build hierarchy
    const buildHierarchy = (parentId: string | null = null): FieldNode[] => {
      return fields
        ?.filter(f => (parentId === null ? !f.parent_id : f.parent_id === parentId))
        .map(field => ({
          ...field,
          programCount: programCounts[field.id] || 0,
          children: buildHierarchy(field.id),
        }))
        .sort((a, b) => a.sort_order - b.sort_order) || [];
    };

    const hierarchy = buildHierarchy();

    console.log(`Built hierarchy with ${hierarchy.length} top-level fields`);

    return new Response(
      JSON.stringify({
        success: true,
        fields: hierarchy,
        totalFields: fields?.length || 0,
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('Error in get-fields-hierarchy:', error);
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
