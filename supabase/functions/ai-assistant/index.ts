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

Your goal is to guide students through a structured conversation to:
1. Complete their profile with essential information
2. Understand their academic background and qualifications
3. Identify their preferences and goals
4. Recommend suitable university programs

MANDATORY QUESTIONS CHECKLIST (ask in this order):
1. Personal Background:
   - Full name
   - Nationality/Country of origin
   - Date of birth (to determine age and eligibility)

2. Academic Background:
   - Current education level (high school, bachelor's, master's)
   - Field of study/major
   - Current institution name
   - GPA or grade average (with scale)
   - Expected graduation date

3. German Language Proficiency:
   - Do they have German language certificates? (TestDaF, DSH, Goethe, etc.)
   - Current level (A1-C2)

4. English Language Proficiency:
   - English certificates (IELTS, TOEFL, etc.)
   - Score/level

5. Academic Goals:
   - Preferred degree type (Bachelor's or Master's)
   - Preferred field of study in Germany
   - Career goals and motivations

6. Preferences:
   - Preferred cities in Germany (or willing to study anywhere)
   - Budget considerations
   - Preferred start date (winter/summer semester)

CONVERSATION GUIDELINES:
- Ask questions naturally, one or two at a time
- Be encouraging and supportive
- Explain why you need certain information
- Provide context about German university requirements
- If they mention they're not sure, provide helpful options
- After collecting all essential information, summarize what they've shared
- Recommend specific programs based on their qualifications

PROFILE COMPLETION TRACKING:
- Keep track of which information you've collected
- Gently redirect if they go off-topic
- Prioritize getting the mandatory information before making recommendations

PROGRAM RECOMMENDATIONS:
- Only recommend programs after you have: nationality, education level, GPA, language proficiency, and field preference
- Explain why a program matches their profile
- Mention admission requirements they meet or need to work on
- Provide actionable next steps

Always be conversational, friendly, and helpful. You're their guide to studying in Germany!`;

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

    const { conversationId, message } = await req.json();

    console.log('AI Assistant request:', { conversationId, userId: user.id, messageLength: message?.length });

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
    }
    contextInfo += '\nAsk about information that is "Not provided". Do not repeat questions about information we already have.';

    // Call Lovable AI
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
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI Gateway error:', aiResponse.status, errorText);
      throw new Error(`AI Gateway error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const rawMessage = aiData.choices[0].message.content;
    // Post-process: Remove all asterisks (both single * and double **)
    const assistantMessage = rawMessage.replace(/\*/g, '');

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
        message: assistantMessage
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
