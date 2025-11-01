import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.55.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// System prompt for the AI assistant
const SYSTEM_PROMPT = `You are a helpful university admissions assistant for University Assist, helping students find the right university programs in Germany.

IMPORTANT: Use plain text only. Do not use asterisks (*), underscores (_), or any markdown formatting in your responses. Write naturally without special formatting characters.

=== PROGRAM RECOMMENDATIONS FORMAT ===

When recommending programs to users, you MUST return structured JSON data wrapped in special markers:

:::PROGRAM_RECOMMENDATIONS:::
{
  "programs": [
    {
      "program_id": "uuid",
      "university_name": "string",
      "university_slug": "string",
      "program_name": "string",
      "program_slug": "string",
      "city": "string",
      "match_score": 85,
      "eligibility": "eligible|borderline|missing",
      "why_it_fits": "Clear explanation why this program matches the student",
      "requirements_met": ["GPA acceptable", "English proficiency ready"],
      "requirements_missing": ["Need B2 German certificate", "ECTS verification needed"]
    }
  ]
}
:::END_RECOMMENDATIONS:::

After the JSON, add conversational text explaining your recommendations.

=== CRITICAL TOOL CALLING RULES ===

1. IMMEDIATE TOOL CALLING IS MANDATORY:
   - The INSTANT a user provides ANY information, you MUST call the appropriate tool
   - DO NOT wait to collect multiple pieces of information
   - DO NOT summarize first - call the tool FIRST, then acknowledge
   - ALWAYS call tools BEFORE responding to the user
   - THIS IS YOUR PRIMARY JOB - SAVE DATA IMMEDIATELY

2. MANDATORY CONFIRMATION PATTERN:
   After EVERY tool call, you MUST:
   - Explicitly confirm what you saved: "Got it! I've saved that you're from Egypt"
   - Ask the next question immediately
   - NEVER skip confirmation
   - Use checkmark symbol: ✓

3. TOOL SELECTION GUIDE:
   - Personal info (name, nationality, DOB, contact) → update_profile_data
   - Education (level, institution, field, career goals) → update_profile_data  
   - Preferences (degree type, cities, fields) → update_profile_data
   - Academic records (GPA, ECTS, curriculum) → update_academic_data
   - Language certificates (German, English) → update_academic_data

=== EXAMPLES OF IMMEDIATE TOOL CALLING ===

USER: "I'm from Egypt"
YOU: [IMMEDIATELY CALL update_profile_data with nationality: "Egypt"]
RESPONSE: "✓ Got it! I've saved that you're from Egypt. What is your current education level? Are you in high school, pursuing a Bachelor's, or do you have a Bachelor's and are looking for a Master's program?"

USER: "I have a 3.5 GPA out of 4.0"  
YOU: [IMMEDIATELY CALL update_academic_data with gpa_raw: 3.5, gpa_scale_max: 4.0]
RESPONSE: "✓ Perfect! I've saved your GPA. That converts to approximately 1.5 on the German scale, which is excellent! Do you have any German language certificates like TestDaF, DSH, or Goethe?"

USER: "I study Computer Science at Cairo University"
YOU: [IMMEDIATELY CALL update_profile_data with current_field_of_study: "Computer Science", current_institution: "Cairo University"]
RESPONSE: "✓ Excellent! I've saved that you're studying Computer Science at Cairo University. What year are you in, and what is your current GPA?"

USER: "I have B2 German certificate from Goethe Institute"
YOU: [IMMEDIATELY CALL update_academic_data with language_certificates: [{language: "German", level: "B2", certificate: "Goethe"}]]
RESPONSE: "✓ Great! I've saved your B2 German certificate. That's a solid level for many programs! Do you also have an English language certificate like IELTS or TOEFL?"

=== WRONG BEHAVIOR - NEVER DO THIS ===

❌ WRONG: "I'll note that down..." → NO! Call the tool FIRST!
❌ WRONG: "I'm manually holding this data..." → IMPOSSIBLE! You have no memory! Use tools!
❌ WRONG: "Let me make sure I have this..." → Call the tool NOW, not later!
❌ WRONG: "I've got your information..." → Only say this AFTER calling the tool successfully!
❌ WRONG: "Thank you for confirming..." → Only after tool call!

✓ CORRECT: Call update_academic_data → THEN say "✓ Got it! I've saved your GPA..."
✓ CORRECT: Call update_profile_data → THEN say "✓ Perfect! I've saved that you're from Egypt..."

=== YOUR CONVERSATION FLOW ===

1. Personal Background (ask 2-3 questions at a time):
   - Full name → CALL TOOL → confirm
   - Nationality/Country → CALL TOOL → confirm
   - Date of birth → CALL TOOL → confirm

2. Academic Background (ask 2-3 questions at a time):
   - Education level → CALL TOOL → confirm
   - Institution name → CALL TOOL → confirm
   - Field of study → CALL TOOL → confirm
   - GPA with scale → CALL TOOL → confirm

3. Language Proficiency (ask separately):
   - German certificates → CALL TOOL → confirm
   - English certificates → CALL TOOL → confirm

4. Goals & Preferences:
   - Preferred degree type → CALL TOOL → confirm
   - Preferred fields → CALL TOOL → confirm
   - Preferred cities → CALL TOOL → confirm
   - Career goals → CALL TOOL → confirm

=== CONVERSATION GUIDELINES ===
- Ask 2-3 related questions per message, not one at a time
- Be warm, encouraging, and conversational
- Explain why you need information when appropriate
- After collecting essentials, recommend programs using check_program_eligibility
- NEVER forget to call tools - this is your primary job!
- USE TOOLS EVERY TIME USER PROVIDES INFORMATION

Remember: TOOL CALLS FIRST, THEN RESPONSE. Every single time. This is non-negotiable.`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')!;

    const authHeader = req.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');

    const supabaseAdmin = createClient(supabaseUrl, supabaseKey);
    const supabaseClient = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: `Bearer ${token}` } }
    });

    // Verify user authentication
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    const { conversationId, message, programId } = await req.json();

    console.log('AI Assistant request:', { conversationId, userId: user.id, messageLength: message?.length, programId });

    // Get or create conversation
    let conversation;
    if (conversationId) {
      const { data, error } = await supabaseAdmin
        .from('ai_conversations')
        .select('*')
        .eq('id', conversationId)
        .eq('profile_id', user.id)
        .single();
      
      if (error) throw error;
      conversation = data;
    } else {
      // Create new conversation
      const { data, error } = await supabaseAdmin
        .from('ai_conversations')
        .insert({
          profile_id: user.id,
          title: 'Profile Completion Chat',
          status: 'active'
        })
        .select()
        .single();
      
      if (error) throw error;
      conversation = data;
      console.log('Created new conversation:', conversation.id);
    }

    // Save user message
    await supabaseAdmin.from('ai_messages').insert({
      conversation_id: conversation.id,
      role: 'user',
      content: message
    });

    // Get conversation history
    const { data: messages, error: messagesError } = await supabaseAdmin
      .from('ai_messages')
      .select('role, content')
      .eq('conversation_id', conversation.id)
      .order('created_at', { ascending: true });

    if (messagesError) throw messagesError;

    // Get user profile for context
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    const { data: academics } = await supabaseAdmin
      .from('student_academics')
      .select('*')
      .eq('profile_id', user.id)
      .single();

    // Fetch program data if programId is provided
    let programContext = '';
    let programData = null;
    if (programId) {
      const { data, error } = await supabaseAdmin
        .from('programs')
        .select(`
          id, name, degree_level, field_of_study, 
          minimum_gpa, ects_credits, duration_semesters,
          language_requirements, prerequisites,
          uni_assist_required, application_method,
          winter_deadline, summer_deadline, winter_intake, summer_intake,
          description,
          universities!inner(id, name, city, type, control_type)
        `)
        .eq('id', programId)
        .single();

      if (!error && data) {
        programData = data;
        programContext = `\n\nPROGRAM CONTEXT:\nThe user is inquiring about: ${data.name}
- University: ${data.universities.name}, ${data.universities.city}
- Degree Level: ${data.degree_level}
- Field: ${data.field_of_study}
- Duration: ${data.duration_semesters} semesters
- Minimum GPA: ${data.minimum_gpa || 'Not specified'}
- ECTS Required: ${data.ects_credits || 'Not specified'}
- Language Requirements: ${JSON.stringify(data.language_requirements || [])}
- Winter Intake: ${data.winter_intake ? 'Yes' : 'No'}${data.winter_deadline ? ` (Deadline: ${data.winter_deadline})` : ''}
- Summer Intake: ${data.summer_intake ? 'Yes' : 'No'}${data.summer_deadline ? ` (Deadline: ${data.summer_deadline})` : ''}
- Uni-Assist Required: ${data.uni_assist_required ? 'Yes' : 'No'}
- Application Method: ${data.application_method}

Provide specific guidance about this program, check eligibility, and answer questions about admission requirements.`;
      }
    }

    // Build context about what we already know
    let contextInfo = '\n\nCURRENT PROFILE DATA:\n';
    if (profile) {
      contextInfo += `- Full Name: ${profile.full_name || 'Not provided'}\n`;
      contextInfo += `- Email: ${profile.email || 'Not provided'}\n`;
      contextInfo += `- Nationality: ${profile.nationality || 'Not provided'}\n`;
      contextInfo += `- Date of Birth: ${profile.date_of_birth || 'Not provided'}\n`;
      contextInfo += `- Current Education: ${profile.current_education_level || 'Not provided'}\n`;
      contextInfo += `- Current Institution: ${profile.current_institution || 'Not provided'}\n`;
      contextInfo += `- Field of Study: ${profile.current_field_of_study || 'Not provided'}\n`;
      contextInfo += `- Career Goals: ${profile.career_goals || 'Not provided'}\n`;
    }
    if (academics) {
      contextInfo += `- GPA: ${academics.gpa_raw || 'Not provided'} / ${academics.gpa_scale_max || '?'}\n`;
      contextInfo += `- Language Certificates: ${academics.language_certificates ? JSON.stringify(academics.language_certificates) : 'None'}\n`;
      contextInfo += `- ECTS Credits: ${academics.ects_total || 'Not provided'}\n`;
      contextInfo += `- Target Level: ${academics.target_level || 'Not provided'}\n`;
    }
    contextInfo += '\nAsk about information that is "Not provided". Do not repeat questions about information we already have.';
    contextInfo += programContext;

    // Define tools for updating profile data and checking eligibility
    const tools = [
      {
        type: "function",
        function: {
          name: "update_profile_data",
          description: "Update user profile with collected information. Call this whenever you collect new data about the user.",
          parameters: {
            type: "object",
            properties: {
              nationality: { type: "string", description: "User's nationality/country of origin" },
              current_education_level: { type: "string", description: "Current education level (e.g., high school, bachelor's, master's)" },
              current_institution: { type: "string", description: "Name of current educational institution" },
              current_field_of_study: { type: "string", description: "Current field of study/major" },
              career_goals: { type: "string", description: "User's career goals and motivations" },
              preferred_degree_type: { type: "string", description: "Preferred degree type (Bachelor's, Master's, etc.)" },
              preferred_fields: { type: "array", items: { type: "string" }, description: "Preferred fields of study in Germany" },
              preferred_cities: { type: "array", items: { type: "string" }, description: "Preferred cities in Germany" },
            },
            additionalProperties: false
          }
        }
      },
      {
        type: "function",
        function: {
          name: "update_academic_data",
          description: "Update user's academic records. Call this when you collect GPA, language certificates, or other academic information.",
          parameters: {
            type: "object",
            properties: {
              gpa_raw: { type: "number", description: "Raw GPA score" },
              gpa_scale_max: { type: "number", description: "Maximum GPA scale (e.g., 4.0, 100)" },
              gpa_min_pass: { type: "number", description: "Minimum passing GPA" },
              curriculum: { type: "string", description: "Educational curriculum (e.g., Egyptian, IB, A-Levels)" },
              prev_major: { type: "string", description: "Previous major/field of study" },
              ects_total: { type: "number", description: "Total ECTS credits earned" },
              target_level: { type: "string", enum: ["bachelor", "master", "phd"], description: "Target degree level" },
              target_intake: { type: "string", description: "Target intake (e.g., Winter 2025, Summer 2026)" },
              language_certificates: { 
                type: "array", 
                items: { 
                  type: "object",
                  properties: {
                    language: { type: "string" },
                    level: { type: "string" },
                    certificate: { type: "string" },
                    score: { type: "string" }
                  }
                },
                description: "Language certificates" 
              },
            },
            additionalProperties: false
          }
        }
      },
      {
        type: "function",
        function: {
          name: "check_program_eligibility",
          description: "Check user's eligibility for the current program based on their profile and academic data. Use this when user asks about eligibility or chances.",
          parameters: {
            type: "object",
            properties: {},
            additionalProperties: false
          }
        }
      },
      {
        type: "function",
        function: {
          name: "query_matching_programs",
          description: "Search for programs that match the user's preferences and profile. Use this when ready to recommend programs after collecting sufficient information.",
          parameters: {
            type: "object",
            properties: {
              degree_level: { type: "string", description: "Degree level: bachelor, master, or phd" },
              field_of_study: { type: "string", description: "Field of study the user is interested in" },
              preferred_cities: { type: "array", items: { type: "string" }, description: "Preferred cities" },
              limit: { type: "number", description: "Maximum number of programs to return", default: 5 }
            },
            additionalProperties: false
          }
        }
      }
    ];

    // Call Lovable AI with tool calling enabled
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT + contextInfo },
          ...messages.map(m => ({ role: m.role, content: m.content }))
        ],
        tools: tools,
        tool_choice: "auto",
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI Gateway error:', aiResponse.status, errorText);
      throw new Error(`AI Gateway error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const choice = aiData.choices[0];
    
    let assistantMessage = '';
    const toolResults: any[] = [];
    
    // Handle tool calls if present
    if (choice.message.tool_calls && choice.message.tool_calls.length > 0) {
      for (const toolCall of choice.message.tool_calls) {
        const functionName = toolCall.function.name;
        const args = JSON.parse(toolCall.function.arguments);
        
        console.log('Tool call:', functionName, args);
        
        let toolResult: any = { success: false, message: 'Unknown tool' };
        
        if (functionName === 'check_program_eligibility') {
          // Calculate eligibility based on profile, academics, and program data
          if (!programData) {
            console.log('No program data available for eligibility check');
            toolResult = { success: false, message: 'No program data available' };
          } else {
            // Build eligibility response
            let eligibilityResult = 'ELIGIBILITY ANALYSIS:\n';
            const issues = [];
            const strengths = [];

            // Check GPA
            if (academics?.gpa_raw && academics?.gpa_scale_max && academics?.gpa_min_pass) {
              const normalizedGPA = ((academics.gpa_raw - academics.gpa_min_pass) / (academics.gpa_scale_max - academics.gpa_min_pass)) * 4.0;
              const germanGPA = 1 + (4 - 1) * (1 - (normalizedGPA / 4.0));
              const requiredGPA = programData.minimum_gpa || 2.5;
              
              if (germanGPA <= requiredGPA) {
                strengths.push(`GPA meets requirements (German equivalent: ${germanGPA.toFixed(2)})`);
              } else {
                issues.push(`GPA may be below requirement (German equivalent: ${germanGPA.toFixed(2)}, required: ${requiredGPA})`);
              }
            } else {
              issues.push('GPA information not provided');
            }

            // Check language requirements
            if (programData.language_requirements && programData.language_requirements.length > 0) {
              if (academics?.language_certificates && academics.language_certificates.length > 0) {
                strengths.push('Has language certificates');
              } else {
                issues.push('Language certificates required but not provided');
              }
            }

            // Check ECTS
            if (programData.ects_credits) {
              if (academics?.ects_total && academics.ects_total >= programData.ects_credits) {
                strengths.push(`ECTS credits sufficient (${academics.ects_total}/${programData.ects_credits})`);
              } else {
                issues.push(`Need more ECTS credits (current: ${academics?.ects_total || 0}, required: ${programData.ects_credits})`);
              }
            }

            eligibilityResult += '\nSTRENGTHS:\n' + (strengths.length > 0 ? strengths.map(s => `- ${s}`).join('\n') : '- None identified yet');
            eligibilityResult += '\n\nAREAS TO ADDRESS:\n' + (issues.length > 0 ? issues.map(i => `- ${i}`).join('\n') : '- None identified');
            eligibilityResult += '\n\nProvide this analysis to the user in a friendly, encouraging way. Offer specific advice on how to address any issues.';
            
            console.log('Eligibility check result:', eligibilityResult);
            toolResult = { success: true, analysis: eligibilityResult };
          }
        } else if (functionName === 'query_matching_programs') {
          // Query programs from database based on user preferences
          try {
            const { degree_level, field_of_study, preferred_cities, limit = 5 } = args;
            
            let query = supabaseAdmin
              .from('programs')
              .select(`
                id,
                name,
                slug,
                degree_level,
                field_of_study,
                minimum_gpa,
                ects_credits,
                language_requirements,
                universities!inner(
                  id,
                  name,
                  slug,
                  city
                )
              `)
              .eq('is_published', true)
              .limit(limit);
            
            if (degree_level) {
              query = query.ilike('degree_level', degree_level);
            }
            if (field_of_study) {
              query = query.ilike('field_of_study', `%${field_of_study}%`);
            }
            if (preferred_cities && preferred_cities.length > 0) {
              query = query.in('universities.city', preferred_cities);
            }
            
            const { data: programs, error: programsError } = await query;
            
            if (programsError) throw programsError;
            
            // Calculate match scores for each program
            const programsWithScores = (programs || []).map(prog => {
              let matchScore = 50; // Base score
              let eligibility = 'borderline';
              const requirementsMet = [];
              const requirementsMissing = [];
              
              // GPA check
              if (academics?.gpa_raw && academics?.gpa_scale_max && academics?.gpa_min_pass) {
                const normalizedGPA = ((academics.gpa_raw - academics.gpa_min_pass) / (academics.gpa_scale_max - academics.gpa_min_pass)) * 4.0;
                const germanGPA = 1 + (4 - 1) * (1 - (normalizedGPA / 4.0));
                const requiredGPA = prog.minimum_gpa || 2.5;
                
                if (germanGPA <= requiredGPA) {
                  matchScore += 25;
                  requirementsMet.push(`GPA qualifies (German: ${germanGPA.toFixed(2)})`);
                } else {
                  requirementsMissing.push(`GPA improvement needed (Current: ${germanGPA.toFixed(2)}, Required: ${requiredGPA})`);
                }
              } else {
                requirementsMissing.push('GPA not provided');
              }
              
              // Language check
              if (prog.language_requirements && prog.language_requirements.length > 0) {
                if (academics?.language_certificates && academics.language_certificates.length > 0) {
                  matchScore += 15;
                  requirementsMet.push('Language certificates provided');
                } else {
                  requirementsMissing.push('Language certificates required');
                }
              } else {
                matchScore += 10;
              }
              
              // ECTS check
              if (prog.ects_credits) {
                if (academics?.ects_total && academics.ects_total >= prog.ects_credits) {
                  matchScore += 10;
                  requirementsMet.push(`ECTS sufficient (${academics.ects_total}/${prog.ects_credits})`);
                } else {
                  requirementsMissing.push(`ECTS needed (Current: ${academics?.ects_total || 0}, Required: ${prog.ects_credits})`);
                }
              }
              
              // Determine eligibility
              if (matchScore >= 75 && requirementsMissing.length === 0) {
                eligibility = 'eligible';
              } else if (matchScore >= 50 && requirementsMissing.length <= 2) {
                eligibility = 'borderline';
              } else {
                eligibility = 'missing';
              }
              
              return {
                program_id: prog.id,
                university_name: prog.universities.name,
                university_slug: prog.universities.slug,
                program_name: prog.name,
                program_slug: prog.slug,
                city: prog.universities.city,
                match_score: Math.min(matchScore, 95),
                eligibility,
                requirements_met: requirementsMet,
                requirements_missing: requirementsMissing,
                why_it_fits: ''  // AI will fill this
              };
            });
            
            // Sort by match score
            programsWithScores.sort((a, b) => b.match_score - a.match_score);
            
            toolResult = { 
              success: true, 
              programs: programsWithScores,
              message: `Found ${programsWithScores.length} matching programs. Use these to create recommendations with :::PROGRAM_RECOMMENDATIONS::: JSON format.`
            };
            
            console.log('Program query successful:', programsWithScores.length, 'programs found');
          } catch (error: any) {
            console.error('Program query error:', error);
            toolResult = { 
              success: false, 
              message: `Failed to query programs: ${error.message}` 
            };
          }
        } else if (functionName === 'update_profile_data') {
          // Call the dedicated update function for better reliability
          try {
            const updateResponse = await fetch(
              `${supabaseUrl}/functions/v1/update-profile-from-ai`,
              {
                method: 'POST',
                headers: {
                  'Authorization': authHeader || '',
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  profileData: args,
                  academicData: null
                })
              }
            );
            
            const updateResult = await updateResponse.json();
            
            if (!updateResult.success) {
              console.error('Profile update failed:', updateResult.error || updateResult.errors);
              toolResult = { 
                success: false, 
                message: `Update failed: ${(updateResult.errors || []).join(', ')}` 
              };
            } else {
              console.log('Profile updated successfully:', updateResult.updates);
              toolResult = { 
                success: true, 
                message: `Successfully updated: ${updateResult.updates.join(', ')}` 
              };
            }
          } catch (error: any) {
            console.error('Profile update exception:', error);
            toolResult = { 
              success: false, 
              message: `Update error: ${error.message}` 
            };
          }
        } else if (functionName === 'update_academic_data') {
          // Call the dedicated update function for academic data
          try {
            const updateResponse = await fetch(
              `${supabaseUrl}/functions/v1/update-profile-from-ai`,
              {
                method: 'POST',
                headers: {
                  'Authorization': authHeader || '',
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  profileData: null,
                  academicData: args
                })
              }
            );
            
            const updateResult = await updateResponse.json();
            
            if (!updateResult.success) {
              console.error('Academic update failed:', updateResult.error || updateResult.errors);
              toolResult = { 
                success: false, 
                message: `Update failed: ${(updateResult.errors || []).join(', ')}` 
              };
            } else {
              console.log('Academic data updated successfully:', updateResult.updates);
              toolResult = { 
                success: true, 
                message: `Successfully updated: ${updateResult.updates.join(', ')}` 
              };
            }
          } catch (error: any) {
            console.error('Academic update exception:', error);
            toolResult = { 
              success: false, 
              message: `Update error: ${error.message}` 
            };
          }
        }
        
        toolResults.push({
          id: toolCall.id,
          name: functionName,
          result: toolResult
        });
      }
      
      // CRITICAL FIX: If no content returned (only tool calls), make second API call
      const rawMessage = choice.message.content || '';
      if (!rawMessage || rawMessage.trim() === '') {
        console.log('No content in first response, making second API call with tool results...');
        
        // Build messages array with tool results
        const messagesWithToolResults = [
          { role: 'system', content: SYSTEM_PROMPT + contextInfo },
          ...messages.map(m => ({ role: m.role, content: m.content })),
          { 
            role: 'assistant',
            content: null,
            tool_calls: choice.message.tool_calls
          },
          ...toolResults.map(tr => ({
            role: 'tool',
            tool_call_id: tr.id,
            name: tr.name,
            content: JSON.stringify(tr.result)
          }))
        ];
        
        // Make second API call to get the actual text response
        const secondResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${lovableApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash',
            messages: messagesWithToolResults,
          }),
        });
        
        if (secondResponse.ok) {
          const secondData = await secondResponse.json();
          const secondMessage = secondData.choices[0]?.message?.content || "I've processed your information.";
          assistantMessage = secondMessage.replace(/\*/g, ''); // Remove asterisks
          console.log('Second API call successful, got response:', assistantMessage.substring(0, 100));
        } else {
          console.error('Second API call failed:', secondResponse.status);
          assistantMessage = "I've updated your information successfully!";
        }
      } else {
        // Use the content from first response
        assistantMessage = rawMessage.replace(/\*/g, ''); // Remove asterisks
      }
    } else {
      // No tool calls, just use the message content
      const rawMessage = choice.message.content || "I'm here to help!";
      assistantMessage = rawMessage.replace(/\*/g, ''); // Remove asterisks
      
      // POST-PROCESSING VALIDATION: Detect if AI should have called a tool but didn't
      const lowerMessage = message.toLowerCase();
      
      // Check for GPA data
      const gpaMatch = message.match(/(\d+\.?\d*)\s*(?:out of|\/|on)\s*(\d+\.?\d*)/i);
      if (gpaMatch && !choice.message.tool_calls) {
        console.warn('⚠️ AI failed to call tool for GPA data. Force-calling update_academic_data...');
        try {
          const [_, raw, max] = gpaMatch;
          const updateResponse = await fetch(
            `${supabaseUrl}/functions/v1/update-profile-from-ai`,
            {
              method: 'POST',
              headers: {
                'Authorization': authHeader || '',
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                profileData: null,
                academicData: {
                  gpa_raw: parseFloat(raw),
                  gpa_scale_max: parseFloat(max)
                }
              })
            }
          );
          const updateResult = await updateResponse.json();
          if (updateResult.success) {
            console.log('✓ Failsafe GPA save successful:', updateResult.updates);
            assistantMessage = `✓ Got it! I've saved your GPA (${raw}/${max}). ` + assistantMessage;
          }
        } catch (error: any) {
          console.error('Failsafe GPA save failed:', error);
        }
      }
      
      // Check for language certificates
      const languageMatch = message.match(/(TestDaF|DSH|Goethe|IELTS|TOEFL|B1|B2|C1|C2)/i);
      if (languageMatch && !choice.message.tool_calls) {
        console.warn('⚠️ AI failed to call tool for language data. User mentioned:', languageMatch[0]);
        // Note: We log but don't force-save because we need more context (level, certificate type)
        assistantMessage = `I noticed you mentioned ${languageMatch[0]}. Let me confirm: what's your exact certificate level? ` + assistantMessage;
      }
      
      // Check for nationality/location
      const nationalityKeywords = ['from', 'nationality', 'country', 'citizen'];
      if (nationalityKeywords.some(kw => lowerMessage.includes(kw)) && !choice.message.tool_calls) {
        console.warn('⚠️ AI failed to call tool for nationality/location data');
      }
    }

    // Save assistant message
    await supabaseAdmin.from('ai_messages').insert({
      conversation_id: conversation.id,
      role: 'assistant',
      content: assistantMessage
    });

    // Update conversation timestamp
    await supabaseAdmin
      .from('ai_conversations')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', conversation.id);

    console.log('AI Assistant response generated successfully');

    return new Response(
      JSON.stringify({
        conversationId: conversation.id,
        message: assistantMessage,
        toolResults: toolResults.length > 0 ? toolResults : undefined
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in ai-assistant function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
