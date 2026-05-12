import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SimilarityScore {
  historical_app_id: string;
  score: number;
}

function calculateSimilarityScore(
  currentProfile: any, 
  historicalCase: any
): number {
  let score = 0;
  
  // GPA similarity (30% weight)
  if (currentProfile.gpa_raw && historicalCase.gpa_raw) {
    const gpaDiff = Math.abs(currentProfile.gpa_raw - historicalCase.gpa_raw);
    if (gpaDiff < 0.3) score += 30;
    else if (gpaDiff < 0.5) score += 20;
    else if (gpaDiff < 1.0) score += 10;
  }
  
  // Nationality match (20% weight)
  if (currentProfile.nationality === historicalCase.nationality) {
    score += 20;
  }
  
  // Language level match (25% weight)
  // Simplified - would need better parsing in production
  if (currentProfile.language_level && historicalCase.language_certificates) {
    score += 25;
  }
  
  // Education system match (15% weight)
  if (currentProfile.curriculum === historicalCase.curriculum) {
    score += 15;
  }
  
  // Field of study similarity (10% weight)
  if (currentProfile.field_of_study === historicalCase.previous_degree_field) {
    score += 10;
  }
  
  return score;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');

    if (!lovableApiKey) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Admin-only: this function reads sensitive historical applicant data
    // (GPA, nationality, language scores) using the service role key.
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const token = authHeader.replace('Bearer ', '');
    const { data: userData, error: userErr } = await supabaseAdmin.auth.getUser(token);
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const { data: roles } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('profile_id', userData.user.id)
      .eq('role', 'admin');
    if (!roles || roles.length === 0) {
      return new Response(JSON.stringify({ error: 'Forbidden: admin only' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { program_id, analysis_type } = await req.json();

    if (!program_id) {
      throw new Error('program_id is required');
    }

    // Get historical applications for this program
    const { data: historicalApps, error: appsError } = await supabaseAdmin
      .from('historical_applications')
      .select('*')
      .eq('program_id', program_id);

    if (appsError) {
      throw appsError;
    }

    if (!historicalApps || historicalApps.length === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'No historical data found for this program',
          sample_size: 0
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Calculate statistics
    const acceptedCases = historicalApps.filter(app => app.outcome === 'accepted');
    const rejectedCases = historicalApps.filter(app => app.outcome === 'rejected');
    const acceptanceRate = acceptedCases.length / historicalApps.length;

    // Analyze patterns with AI
    const analysisPrompt = `Analyze the following historical application data for a German university program:

Total Applications: ${historicalApps.length}
Accepted: ${acceptedCases.length}
Rejected: ${rejectedCases.length}
Acceptance Rate: ${(acceptanceRate * 100).toFixed(1)}%

Sample of accepted students:
${acceptedCases.slice(0, 5).map(app => `
- Nationality: ${app.nationality}, GPA: ${app.gpa_raw}/${app.gpa_scale_max}, 
  Language: ${JSON.stringify(app.language_certificates)}, 
  Curriculum: ${app.curriculum}
`).join('\n')}

Sample of rejected students:
${rejectedCases.slice(0, 5).map(app => `
- Nationality: ${app.nationality}, GPA: ${app.gpa_raw}/${app.gpa_scale_max}, 
  Rejection reason: ${app.rejection_reason || 'Not specified'}
`).join('\n')}

Identify:
1. Key success factors (what makes applications successful?)
2. Common rejection reasons
3. Optimal student profile for this program
4. Red flags to watch for

Provide structured insights in JSON format.`;

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: 'You are an expert in analyzing university admission patterns. Provide structured insights in JSON format.'
          },
          {
            role: 'user',
            content: analysisPrompt
          }
        ],
        temperature: 0.3,
      }),
    });

    if (!aiResponse.ok) {
      throw new Error('AI analysis failed');
    }

    const aiData = await aiResponse.json();
    const insights = aiData.choices[0].message.content;

    // Save pattern insights to database
    const { error: patternError } = await supabaseAdmin
      .from('admission_patterns')
      .upsert({
        program_id,
        pattern_type: analysis_type || 'success_factors',
        insights: {
          acceptance_rate: acceptanceRate,
          sample_size: historicalApps.length,
          ai_analysis: insights,
          generated_at: new Date().toISOString()
        },
        sample_size: historicalApps.length,
        confidence_level: historicalApps.length > 20 ? 'high' : historicalApps.length > 10 ? 'medium' : 'low',
        generated_at: new Date().toISOString(),
        last_updated: new Date().toISOString()
      });

    if (patternError) {
      console.error('Error saving pattern:', patternError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        program_id,
        sample_size: historicalApps.length,
        acceptance_rate: acceptanceRate,
        insights,
        confidence_level: historicalApps.length > 20 ? 'high' : historicalApps.length > 10 ? 'medium' : 'low'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in analyze-admission-patterns:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
