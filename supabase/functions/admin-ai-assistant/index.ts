import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const ADMIN_SYSTEM_PROMPT = `You are an intelligent admin assistant for University Assist platform specialized in managing historical student application data.

Your primary role is to help administrators input historical application data to improve future matching accuracy.

**Core Capabilities:**

1. **Document Analysis**: When documents are uploaded, analyze OCR text and extract:
   - Student background (curriculum, nationality, education level)
   - GPA (raw score, scale max, minimum passing grade)
   - Language certificates (type, level, scores)
   - Test scores (GRE, GMAT, etc.)
   - Application outcome (accepted/rejected/waitlisted)

2. **Data Collection Flow**: Guide admins through collecting:
   - Student identifier (e.g., "Student_2023_001" - never real names)
   - Academic details
   - Application program and outcome
   - Reasons for acceptance/rejection

3. **Data Quality**: Always verify:
   - Data completeness
   - Accuracy of extracted information
   - Proper anonymization (no personal names)

4. **Detection Workflows**:
   When analyzing acceptance/rejection letters:
   - Extract program name and university name
   - Use search_program_in_database tool to check if program exists
   - If NOT found, inform admin and ask if they want to add it to database
   - If admin agrees, request program URL for scraping
   
   When analyzing student transcripts/documents:
   - Extract student's country of origin and education system
   - Use check_admission_requirements_exist tool
   - If requirements NOT found, inform admin and ask if they want to add them
   - If admin agrees, collect requirement details through conversation
   
   Always notify admin when you detect missing data that could improve the system.

5. **Tools Available**:
   - create_historical_application: Save a new historical case
   - get_similar_cases: Find similar historical applications
   - get_data_quality_report: Check completeness of data
   - search_program_in_database: Check if a program exists
   - check_admission_requirements_exist: Check if admission requirements exist for a country

**Interaction Guidelines:**
- Be thorough and ask clarifying questions
- Extract data systematically
- Verify extracted data with admin before saving
- Suggest patterns when you notice trends
- Always maintain student privacy (use identifiers, not names)
- Proactively detect missing programs and admission requirements

Start by greeting the admin and asking how you can help with historical data management.`;

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

    // Get user from auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);

    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    // Verify user is admin
    const { data: roles } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('profile_id', user.id)
      .eq('role', 'admin');

    if (!roles || roles.length === 0) {
      throw new Error('Admin access required');
    }

    const { message, conversationHistory } = await req.json();

    // Build messages array for AI
    const messages = [
      { role: 'system', content: ADMIN_SYSTEM_PROMPT },
      ...(conversationHistory || []),
      { role: 'user', content: message }
    ];

    // Define tools for historical data management
    const tools = [
      {
        type: 'function',
        function: {
          name: 'create_historical_application',
          description: 'Save a new historical application case to the database',
          parameters: {
            type: 'object',
            properties: {
              student_identifier: { type: 'string', description: 'Anonymous identifier like Student_2023_001' },
              nationality: { type: 'string', description: 'Student nationality' },
              country_of_origin: { type: 'string', description: 'Country of origin' },
              curriculum: { type: 'string', description: 'Educational curriculum (e.g., Egyptian Tawjihi, IB, A-Levels)' },
              education_level: { type: 'string', description: 'bachelor or master' },
              gpa_raw: { type: 'number', description: 'Raw GPA score' },
              gpa_scale_max: { type: 'number', description: 'Maximum GPA scale' },
              gpa_min_pass: { type: 'number', description: 'Minimum passing GPA' },
              language_certificates: { 
                type: 'array',
                description: 'Array of language certificates',
                items: {
                  type: 'object',
                  properties: {
                    language: { type: 'string' },
                    level: { type: 'string' },
                    test: { type: 'string' },
                    score: { type: 'string' }
                  }
                }
              },
              program_name: { type: 'string', description: 'Name of the program applied to' },
              university_name: { type: 'string', description: 'Name of the university' },
              application_semester: { type: 'string', description: 'e.g., Winter 2023' },
              outcome: { type: 'string', enum: ['accepted', 'rejected', 'waitlisted', 'withdrawn'] },
              rejection_reason: { type: 'string', description: 'Reason for rejection if applicable' },
              had_aps_certificate: { type: 'boolean' },
              notes: { type: 'string', description: 'Any additional notes' }
            },
            required: ['student_identifier', 'nationality', 'country_of_origin', 'education_level', 'program_name', 'university_name', 'outcome']
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'get_similar_cases',
          description: 'Find similar historical applications based on criteria',
          parameters: {
            type: 'object',
            properties: {
              program_name: { type: 'string' },
              nationality: { type: 'string' },
              gpa_range: { 
                type: 'object',
                properties: {
                  min: { type: 'number' },
                  max: { type: 'number' }
                }
              }
            }
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'get_data_quality_report',
          description: 'Get a report on data completeness and quality',
          parameters: {
            type: 'object',
            properties: {}
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'search_program_in_database',
          description: 'Search for programs in the database by name and/or university to check if they exist',
          parameters: {
            type: 'object',
            properties: {
              program_name: { type: 'string', description: 'Name of the program to search for' },
              university_name: { type: 'string', description: 'Name of the university' },
              degree_level: { type: 'string', enum: ['bachelor', 'master'], description: 'Degree level (optional)' }
            },
            required: ['program_name', 'university_name']
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'check_admission_requirements_exist',
          description: 'Check if admission requirements exist for a specific country and education system',
          parameters: {
            type: 'object',
            properties: {
              country_code: { type: 'string', description: 'ISO country code (e.g., EG, IN, NG)' },
              country_name: { type: 'string', description: 'Full country name' },
              education_system: { type: 'string', enum: ['high_school', 'bachelor', 'other'], description: 'Education system type' },
              degree_level: { type: 'string', enum: ['bachelor', 'master'], description: 'Target degree level' }
            },
            required: ['country_name', 'degree_level']
          }
        }
      }
    ];

    // Call Lovable AI Gateway
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages,
        tools,
        temperature: 0.7,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI Gateway error:', aiResponse.status, errorText);
      throw new Error(`AI Gateway error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const aiMessage = aiData.choices[0].message;

    // Handle tool calls
    if (aiMessage.tool_calls && aiMessage.tool_calls.length > 0) {
      for (const toolCall of aiMessage.tool_calls) {
        const functionName = toolCall.function.name;
        const args = JSON.parse(toolCall.function.arguments);

        console.log('Tool call:', functionName, args);

        if (functionName === 'create_historical_application') {
          const { error: insertError } = await supabaseAdmin
            .from('historical_applications')
            .insert({
              ...args,
              created_by: user.id,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            });

          if (insertError) {
            console.error('Error creating historical application:', insertError);
          } else {
            console.log('Historical application created successfully');
          }
        } else if (functionName === 'get_similar_cases') {
          let query = supabaseAdmin
            .from('historical_applications')
            .select('*');

          if (args.program_name) {
            query = query.ilike('program_name', `%${args.program_name}%`);
          }
          if (args.nationality) {
            query = query.eq('nationality', args.nationality);
          }
          if (args.gpa_range) {
            query = query.gte('gpa_raw', args.gpa_range.min).lte('gpa_raw', args.gpa_range.max);
          }

          const { data: similarCases } = await query.limit(10);
          console.log('Found similar cases:', similarCases?.length || 0);
        } else if (functionName === 'get_data_quality_report') {
          const { count } = await supabaseAdmin
            .from('historical_applications')
            .select('*', { count: 'exact', head: true });

          console.log('Total historical applications:', count);
        } else if (functionName === 'search_program_in_database') {
          let query = supabaseAdmin
            .from('programs')
            .select('id, name, slug, degree_level, language_requirements, universities(name, slug)');

          if (args.program_name) {
            query = query.ilike('name', `%${args.program_name}%`);
          }
          if (args.university_name) {
            // Join with universities table
            const { data: universities } = await supabaseAdmin
              .from('universities')
              .select('id')
              .ilike('name', `%${args.university_name}%`);
            
            if (universities && universities.length > 0) {
              const uniIds = universities.map(u => u.id);
              query = query.in('university_id', uniIds);
            }
          }
          if (args.degree_level) {
            query = query.eq('degree_level', args.degree_level);
          }

          const { data: programs, error: programError } = await query.limit(5);
          
          if (programError) {
            console.error('Error searching programs:', programError);
          } else {
            console.log('Found programs:', programs?.length || 0, programs);
          }
        } else if (functionName === 'check_admission_requirements_exist') {
          let query = supabaseAdmin
            .from('admission_requirements_by_country')
            .select('*');

          if (args.country_code) {
            query = query.eq('country_code', args.country_code);
          }
          if (args.country_name) {
            query = query.ilike('country_name', `%${args.country_name}%`);
          }
          if (args.education_system) {
            query = query.eq('education_system', args.education_system);
          }
          if (args.degree_level) {
            query = query.eq('degree_level', args.degree_level);
          }

          const { data: requirements, error: reqError } = await query.limit(1);
          
          if (reqError) {
            console.error('Error checking admission requirements:', reqError);
          } else {
            console.log('Found admission requirements:', requirements?.length || 0, requirements);
          }
        }
      }
    }

    // Return AI response
    return new Response(
      JSON.stringify({
        message: aiMessage.content || 'I\'ve processed your request.',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in admin-ai-assistant:', error);
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
