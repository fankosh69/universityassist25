import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const ADMIN_SYSTEM_PROMPT = `You are an AI assistant helping administrators manage historical student application data for University Assist.

Your role:
1. Analyze uploaded documents automatically using OCR and data extraction
2. Extract structured information from transcripts, certificates, and acceptance letters
3. Calculate German GPA using the Bavarian Formula for international grades
4. Build a knowledge base of admission patterns and detect missing data
5. Guide admins through data validation and entry

CRITICAL INSTRUCTIONS:
- Use plain text only in responses - NO MARKDOWN FORMATTING
- Do not use asterisks for bold or emphasis
- Use capitalization, line breaks, or dashes for emphasis instead
- Be proactive - analyze documents without being asked
- Automatically trigger OCR when documents are uploaded

Document Processing Workflow:
1. When documents are uploaded:
   - Automatically trigger OCR processing using trigger_document_ocr
   - Wait briefly, then retrieve extracted text using get_document_text
   - Identify document type (transcript, certificate, acceptance letter)
   - Extract relevant data automatically
   - Present findings to admin for confirmation

2. For transcripts/grade documents:
   - Extract student's grades and grading system
   - Recognize common systems: IGCSE/A-Level (A*=90%, A=80%, B=70%, C=60%, D=50%, E=40%), IB (7-point scale), US GPA (4.0)
   - Use calculate_bavarian_gpa to convert to German GPA
   - Explain the conversion clearly

3. For acceptance/rejection letters:
   - Extract program name, university name, outcome
   - Use search_program_in_database to check if program exists
   - Use check_admission_requirements_exist for country/education system
   - Notify admin if data is missing from database

Available Tools:
- trigger_document_ocr: Process uploaded documents with OCR (call immediately after upload)
- get_document_text: Retrieve extracted text from processed documents
- list_uploaded_documents: See all uploaded documents for current session
- calculate_bavarian_gpa: Convert international grades to German GPA scale
- extract_structured_data: Use AI to extract specific fields from document text
- create_historical_application: Save validated application data to database
- get_similar_cases: Find similar cases for pattern analysis
- search_program_in_database: Check if program exists in database
- check_admission_requirements_exist: Check if admission requirements exist

GPA Conversion Guide:
- IGCSE/A-Level: A*=90-100, A=80-89, B=70-79, C=60-69, D=50-59, E=40-49 (max=100, min=40)
- IB: 7=best, 4=pass (max=7, min=4)
- US GPA: 4.0 scale (max=4.0, min=2.0)
- For percentage systems: typically max=100, min=50

Data to Collect:
- Student identifier (anonymized, no real names)
- Nationality and country of origin
- Education system (high school, bachelor, other)
- Curriculum (IGCSE, IB, etc.)
- GPA (raw, scale, converted German GPA)
- Previous degree field (for Masters applications)
- Program name, university, degree level
- Language certificates (CEFR levels)
- Outcome (accepted, rejected, waitlisted, withdrawn)
- Additional qualifications (work experience, APS, Studienkolleg)

Conversation Style:
- Be proactive, not reactive
- Analyze documents immediately without asking basic questions
- Present findings clearly: "I have analyzed the document and found..."
- Ask only clarifying questions for ambiguous data
- Use natural language, no technical jargon
- Guide admin through validation, not data entry

Example Response Format:
I have analyzed the uploaded transcript. Here is what I found:

Document Type: IGCSE A-Level Transcript
Student Grades: Computer Science (B), Physics (B), Mathematics (B)
Grade System: IGCSE A-Level (A*=90%, A=80%, B=70%)

Calculating German GPA...
Grade B = 70-79% range, using 75% as midpoint
Formula: 1 + 3 × (100 - 75) / (100 - 40) = 2.25
Converted German GPA: 2.25 (GOOD)

Would you like me to record this data for student 27907610059?`;

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
          name: 'trigger_document_ocr',
          description: 'Trigger OCR processing on an uploaded document to extract text',
          parameters: {
            type: 'object',
            properties: {
              document_id: { type: 'string', description: 'UUID of the uploaded document' }
            },
            required: ['document_id']
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'get_document_text',
          description: 'Retrieve extracted text from a processed document',
          parameters: {
            type: 'object',
            properties: {
              document_id: { type: 'string', description: 'UUID of the document' }
            },
            required: ['document_id']
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'list_uploaded_documents',
          description: 'List all uploaded documents in the current session',
          parameters: {
            type: 'object',
            properties: {
              limit: { type: 'number', description: 'Maximum number of documents to return (default: 10)' }
            }
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'calculate_bavarian_gpa',
          description: 'Calculate German GPA using Modified Bavarian Formula',
          parameters: {
            type: 'object',
            properties: {
              gradeAchieved: { type: 'number', description: 'Student grade achieved' },
              maxGrade: { type: 'number', description: 'Maximum possible grade in system' },
              minPassGrade: { type: 'number', description: 'Minimum passing grade' },
              gradeSystem: { 
                type: 'string', 
                enum: ['igcse_a_level', 'ib', 'us_gpa', 'percentage', 'german'],
                description: 'Grade system type (optional, will use predefined scales)' 
              }
            },
            required: ['gradeAchieved', 'maxGrade', 'minPassGrade']
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'extract_structured_data',
          description: 'Use AI to extract specific fields from document text',
          parameters: {
            type: 'object',
            properties: {
              document_text: { type: 'string', description: 'Raw text from document' },
              fields_to_extract: { 
                type: 'array',
                items: { type: 'string' },
                description: 'List of fields to extract (e.g., program_name, university, grades, outcome)' 
              }
            },
            required: ['document_text', 'fields_to_extract']
          }
        }
      },
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

        if (functionName === 'trigger_document_ocr') {
          const { document_id } = args;
          
          try {
            const { data, error } = await supabaseAdmin.functions.invoke('process-document-ocr', {
              body: { document_id }
            });
            
            if (error) throw error;
            
            console.log('OCR triggered for document:', document_id);
          } catch (error: any) {
            console.error('Failed to trigger OCR:', error);
          }
          
        } else if (functionName === 'get_document_text') {
          const { document_id } = args;
          
          const { data, error } = await supabaseAdmin
            .from('document_extractions')
            .select('*')
            .eq('document_id', document_id)
            .order('extracted_at', { ascending: false })
            .limit(1);
          
          if (error || !data || data.length === 0) {
            console.log('Document text not found for:', document_id);
          } else {
            console.log('Document text retrieved:', data[0].raw_text?.substring(0, 100));
          }
          
        } else if (functionName === 'list_uploaded_documents') {
          const limit = args.limit || 10;
          
          const { data } = await supabaseAdmin
            .from('student_documents')
            .select('id, file_name, file_type, uploaded_at, ocr_status')
            .order('uploaded_at', { ascending: false })
            .limit(limit);
          
          console.log('Listed documents:', data?.length || 0);
            
        } else if (functionName === 'calculate_bavarian_gpa') {
          const { gradeAchieved, maxGrade, minPassGrade, gradeSystem } = args;
          
          try {
            const { data, error } = await supabaseAdmin.functions.invoke('calculate-german-gpa', {
              body: { gradeAchieved, maxGrade, minPassGrade, gradeSystem }
            });
            
            if (error) throw error;
            
            console.log('GPA calculated:', data);
          } catch (error: any) {
            console.error('GPA calculation failed:', error);
          }
          
        } else if (functionName === 'extract_structured_data') {
          const { document_text, fields_to_extract } = args;
          
          const extractionPrompt = `Extract the following fields from this document text:
${fields_to_extract.map((f: string) => `- ${f}`).join('\n')}

Document Text:
${document_text}

Return JSON format with extracted fields. If a field cannot be found, set its value to null.`;

          try {
            const extractionResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${lovableApiKey}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                model: 'google/gemini-2.5-flash',
                messages: [
                  { role: 'user', content: extractionPrompt }
                ],
                response_format: { type: 'json_object' }
              }),
            });

            const extractionData = await extractionResponse.json();
            console.log('Extracted data:', extractionData.choices[0].message.content);
          } catch (error: any) {
            console.error('Data extraction failed:', error);
          }
          
        } else if (functionName === 'create_historical_application') {
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
