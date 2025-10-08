import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const EXTRACTION_PROMPT = `Analyze this German university program webpage and extract structured information.

Extract the following fields:
1. Program Name (official name in English and German if available)
2. Degree Type (Bachelor/Master/PhD)
3. Duration in semesters
4. ECTS Credits
5. Language of Instruction (German/English/Both)
6. Application Deadlines (Winter/Summer intake dates)
7. Language Requirements (German level: A1-C2, English level if applicable)
8. Prerequisites (e.g., "Bachelor in Computer Science", "GPA 2.5+")
9. Semester Fees (in EUR)
10. Program Description (2-3 sentences)

Return JSON format:
{
  "program_name": {"value": "...", "confidence": 0.95},
  "degree_type": {"value": "master", "confidence": 1.0},
  "duration_semesters": {"value": 4, "confidence": 0.9},
  "ects_credits": {"value": 120, "confidence": 0.95},
  "language_of_instruction": {"value": "English", "confidence": 1.0},
  "winter_deadline": {"value": "2024-07-15", "confidence": 0.8},
  "summer_deadline": {"value": null, "confidence": 0.0},
  "german_level_required": {"value": "B2", "confidence": 0.9},
  "english_level_required": {"value": "C1", "confidence": 0.9},
  "prerequisites": {"value": ["Bachelor in related field", "GPA 2.5+"], "confidence": 0.85},
  "semester_fees": {"value": 350, "confidence": 0.9},
  "description": {"value": "...", "confidence": 0.95},
  "missing_fields": ["summer_deadline"]
}

If a field cannot be found or is ambiguous, set confidence < 0.5 and include in missing_fields.`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { programUrl } = await req.json();

    if (!programUrl) {
      throw new Error('Program URL is required');
    }

    console.log('Scraping program details from:', programUrl);

    // Fetch the webpage HTML
    const response = await fetch(programUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; UniversityAssist/1.0)',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch program page: ${response.status}`);
    }

    const html = await response.text();

    // Extract text content from HTML (simple extraction)
    const textContent = html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 8000); // Limit to 8000 chars to fit in AI context

    console.log('Extracted text length:', textContent.length);

    // Use Lovable AI to extract structured data
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!lovableApiKey) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: EXTRACTION_PROMPT },
          { role: 'user', content: `Extract program information from this webpage text:\n\n${textContent}` }
        ],
        temperature: 0.3,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI Gateway error:', aiResponse.status, errorText);
      throw new Error(`AI extraction failed: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const extractedText = aiData.choices[0].message.content;

    console.log('AI extracted data:', extractedText);

    // Parse JSON from AI response
    let extractedData;
    try {
      // Try to extract JSON from the response
      const jsonMatch = extractedText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        extractedData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in AI response');
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      extractedData = {
        error: 'Failed to parse extracted data',
        raw_response: extractedText,
        missing_fields: ['all']
      };
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: extractedData,
        source_url: programUrl,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in scrape-program-details:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
