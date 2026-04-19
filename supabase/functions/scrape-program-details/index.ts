import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.55.0";

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

// SSRF protection: only allow public HTTPS URLs
function isSafeUrl(input: string): { ok: boolean; url?: URL; reason?: string } {
  let url: URL;
  try {
    url = new URL(input);
  } catch {
    return { ok: false, reason: 'Invalid URL' };
  }
  if (url.protocol !== 'https:') {
    return { ok: false, reason: 'Only https:// URLs are allowed' };
  }
  const host = url.hostname.toLowerCase();
  // Block localhost, internal hostnames, and IP literals
  if (
    host === 'localhost' ||
    host === '0.0.0.0' ||
    host.endsWith('.local') ||
    host.endsWith('.internal') ||
    /^(?:\d{1,3}\.){3}\d{1,3}$/.test(host) || // IPv4 literal
    host.includes(':') // IPv6 literal
  ) {
    return { ok: false, reason: 'URL host is not publicly routable' };
  }
  return { ok: true, url };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Require authenticated admin caller
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ success: false, error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsErr } = await supabase.auth.getClaims(token);
    if (claimsErr || !claimsData?.claims) {
      return new Response(JSON.stringify({ success: false, error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const userId = claimsData.claims.sub as string;
    const { data: roleRow } = await supabase
      .from('user_roles')
      .select('role')
      .eq('profile_id', userId)
      .eq('role', 'admin')
      .maybeSingle();
    if (!roleRow) {
      return new Response(JSON.stringify({ success: false, error: 'Forbidden: admin role required' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { programUrl } = await req.json();

    if (!programUrl || typeof programUrl !== 'string') {
      throw new Error('Program URL is required');
    }

    const safe = isSafeUrl(programUrl);
    if (!safe.ok) {
      return new Response(JSON.stringify({ success: false, error: safe.reason }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Scraping program details from:', safe.url!.toString());

    const response = await fetch(safe.url!.toString(), {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; UniversityAssist/1.0)',
      },
      redirect: 'follow',
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch program page: ${response.status}`);
    }

    const html = await response.text();

    const textContent = html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 8000);

    console.log('Extracted text length:', textContent.length);

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

    let extractedData;
    try {
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
        source_url: safe.url!.toString(),
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in scrape-program-details:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
