import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const UNIVERSITY_EXTRACTION_PROMPT = `Analyze this German university webpage and extract factual information.

Extract these specific facts ONLY if clearly stated (do not estimate):
1. Total number of students
2. Percentage of international students
3. Number of campuses/locations
4. Year established/founded
5. Brief description (2-3 sentences from official text)
6. List of faculties/departments

Return JSON format:
{
  "totalStudents": {"value": 35000, "confidence": 0.95, "source_text": "35,000 students"},
  "internationalStudentPercentage": {"value": 18, "confidence": 0.9, "source_text": "18% international"},
  "numberOfCampuses": {"value": 3, "confidence": 1.0, "source_text": "3 campus locations"},
  "establishedYear": {"value": 1868, "confidence": 1.0, "source_text": "founded in 1868"},
  "generalInfo": {"value": "...", "confidence": 0.95},
  "faculties": {"value": ["Engineering", "Medicine", "Business"], "confidence": 0.9}
}

If information is not found, return: {"value": null, "confidence": 0.0}
Do NOT make estimates or guesses. Only return data explicitly stated on the page.`;

async function tryFetchPage(url: string): Promise<string | null> {
  try {
    console.log('Attempting to fetch:', url);
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; UniversityAssist/1.0)',
      },
      signal: AbortSignal.timeout(8000), // 8 second timeout
    });

    if (!response.ok) {
      console.log(`Failed to fetch ${url}: ${response.status}`);
      return null;
    }

    const html = await response.text();
    
    // Extract text content from HTML
    const textContent = html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 8000); // Limit to 8000 chars

    return textContent;
  } catch (error) {
    console.log(`Error fetching ${url}:`, error.message);
    return null;
  }
}

async function extractDataWithAI(textContent: string, lovableApiKey: string): Promise<any> {
  const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${lovableApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash',
      messages: [
        { role: 'system', content: UNIVERSITY_EXTRACTION_PROMPT },
        { role: 'user', content: `Extract university information from this webpage text:\n\n${textContent}` }
      ],
      temperature: 0.2,
    }),
  });

  if (!aiResponse.ok) {
    throw new Error(`AI extraction failed: ${aiResponse.status}`);
  }

  const aiData = await aiResponse.json();
  const extractedText = aiData.choices[0].message.content;

  // Parse JSON from AI response
  const jsonMatch = extractedText.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    return JSON.parse(jsonMatch[0]);
  }
  
  throw new Error('No JSON found in AI response');
}

async function scrapeWikipedia(universityName: string): Promise<any> {
  try {
    const searchUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(universityName)}`;
    const response = await fetch(searchUrl, {
      headers: { 'User-Agent': 'UniversityAssist/1.0' },
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) return null;

    const data = await response.json();
    
    if (!data.extract) return null;

    // Extract student numbers
    const studentMatch = data.extract.match(/(\d{1,3}(?:,\d{3})*)\s*(?:students|undergraduates)/i);
    const yearMatch = data.extract.match(/(?:founded|established|created).*?(\d{4})/i);

    return {
      totalStudents: studentMatch ? { value: parseInt(studentMatch[1].replace(/,/g, '')), confidence: 0.7 } : { value: null, confidence: 0.0 },
      establishedYear: yearMatch ? { value: parseInt(yearMatch[1]), confidence: 0.8 } : { value: null, confidence: 0.0 },
      generalInfo: { value: data.extract, confidence: 0.75 },
      source: 'wikipedia'
    };
  } catch (error) {
    console.log('Wikipedia scraping failed:', error.message);
    return null;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('[scrape-university-website] Function invoked');

    // Require authenticated admin caller
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ success: false, error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const { createClient: createUserClient } = await import('https://esm.sh/@supabase/supabase-js@2.55.0');
    const userClient = createUserClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: claims, error: claimsErr } = await userClient.auth.getClaims(authHeader.replace('Bearer ', ''));
    if (claimsErr || !claims?.claims) {
      return new Response(JSON.stringify({ success: false, error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const callerId = claims.claims.sub as string;
    const { data: roleRow } = await userClient
      .from('user_roles').select('role').eq('profile_id', callerId).eq('role', 'admin').maybeSingle();
    if (!roleRow) {
      return new Response(JSON.stringify({ success: false, error: 'Forbidden: admin role required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { universityName, city } = await req.json();

    if (!universityName || !city) {
      throw new Error('University name and city are required');
    }

    console.log(`[scrape-university-website] Scraping info for: ${universityName} in ${city}`);

    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!lovableApiKey) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // Try to get website URL from database
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    let websiteUrl = null;
    if (supabaseUrl && supabaseServiceKey) {
      try {
        const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2.55.0');
        const supabase = createClient(supabaseUrl, supabaseServiceKey);
        
        const { data } = await supabase
          .from('universities')
          .select('website')
          .ilike('name', `%${universityName}%`)
          .single();
        
        websiteUrl = data?.website;
      } catch (dbError) {
        console.log('Could not fetch website from database:', dbError.message);
      }
    }

    let extractedData = null;
    let dataSource = 'none';

    // Strategy 1: Try official university website
    if (websiteUrl) {
      const pagePaths = [
        '',
        '/en/about',
        '/en/university',
        '/en/international',
        '/about',
        '/studium',
        '/university/facts',
      ];

      for (const path of pagePaths) {
        const fullUrl = websiteUrl.replace(/\/$/, '') + path;
        const textContent = await tryFetchPage(fullUrl);
        
        if (textContent) {
          try {
            extractedData = await extractDataWithAI(textContent, lovableApiKey);
            dataSource = 'official_website';
            console.log('Successfully extracted from:', fullUrl);
            break;
          } catch (error) {
            console.log('AI extraction failed for', fullUrl, error.message);
          }
        }
      }
    }

    // Strategy 2: Try Wikipedia as fallback
    if (!extractedData || (extractedData.totalStudents?.confidence || 0) < 0.7) {
      console.log('Falling back to Wikipedia...');
      const wikiData = await scrapeWikipedia(universityName);
      
      if (wikiData && (wikiData.totalStudents?.confidence || 0) > 0.6) {
        extractedData = wikiData;
        dataSource = 'wikipedia';
      }
    }

    // Strategy 3: Return "Unknown" for missing data (no estimates)
    const finalData = {
      name: universityName,
      city: city,
      totalStudents: extractedData?.totalStudents?.value || null,
      internationalStudentPercentage: extractedData?.internationalStudentPercentage?.value || null,
      numberOfCampuses: extractedData?.numberOfCampuses?.value || null,
      establishedYear: extractedData?.establishedYear?.value || null,
      generalInfo: extractedData?.generalInfo?.value || 
        `Information not available. Please visit the official ${universityName} website for details.`,
      faculties: extractedData?.faculties?.value || [],
      researchAreas: extractedData?.researchAreas?.value || [],
      dataSource,
      sourceUrl: websiteUrl || 'unknown',
    };

    return new Response(
      JSON.stringify({
        success: true,
        data: finalData,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in scrape-university-website:', error);
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
