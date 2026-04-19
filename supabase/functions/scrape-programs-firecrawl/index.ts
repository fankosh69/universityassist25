const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const PROGRAM_EXTRACTION_PROMPT = `You are extracting university program information from a German university webpage.
Extract the following fields as accurately as possible. Return a JSON object with these fields:

{
  "name": "Program name (string, required)",
  "degree_type": "Degree type like B.Sc., B.A., M.Sc., M.A., M.Eng., etc. (string)",
  "degree_level": "bachelor or master (string)",
  "description": "Brief program description (string, max 500 chars)",
  "duration_semesters": "Number of semesters (integer)",
  "ects_credits": "ECTS credits (integer)",
  "language_of_instruction": "Array of language codes like ['de'], ['en'], or ['de', 'en']",
  "tuition_amount": "Tuition fee amount in EUR (number, 0 if free)",
  "tuition_fee_structure": "monthly, semester, or yearly (string)",
  "uni_assist_required": "Whether uni-assist application is required (boolean)",
  "application_method": "direct, uni_assist_direct, uni_assist_vpd, or recognition_certificates (string)",
  "winter_intake": "Whether winter intake is available (boolean)",
  "summer_intake": "Whether summer intake is available (boolean)",
  "winter_deadline": "Winter application deadline in YYYY-MM-DD format (string or null)",
  "summer_deadline": "Summer application deadline in YYYY-MM-DD format (string or null)",
  "program_url": "URL of the program page (string)",
  "field_of_study": "Primary field like Computer Science, Engineering, Business, etc. (string)",
  "minimum_gpa": "Minimum GPA requirement if mentioned (number or null)",
  "confidence": "Overall confidence score 0-100 (number)"
}

Important guidelines:
- For German universities, most bachelor programs are in German (de), master programs often in English (en)
- If no tuition mentioned, assume 0 (public German universities are tuition-free)
- Common semester fees (Semesterbeitrag) of 100-400 EUR are NOT tuition
- Winter semester typically starts October, summer semester April
- Common deadlines: July 15 for winter, January 15 for summer
- Return ONLY valid JSON, no markdown or explanations`;

interface ScrapedProgram {
  name: string;
  degree_type?: string;
  degree_level?: 'bachelor' | 'master';
  description?: string;
  duration_semesters?: number;
  ects_credits?: number;
  language_of_instruction?: string[];
  tuition_amount?: number;
  tuition_fee_structure?: string;
  uni_assist_required?: boolean;
  application_method?: string;
  winter_intake?: boolean;
  summer_intake?: boolean;
  winter_deadline?: string;
  summer_deadline?: string;
  program_url?: string;
  field_of_study?: string;
  field_of_study_id?: string;
  field_of_study_name?: string;
  field_match_confidence?: 'high' | 'medium' | 'low' | 'none';
  field_match_score?: number;
  minimum_gpa?: number;
  confidence?: number;
}

interface FieldMatchResult {
  field_of_study_id: string | null;
  field_of_study_name: string | null;
  confidence: 'high' | 'medium' | 'low' | 'none';
  confidence_score: number;
  match_reason: string;
}

// Common paths where universities list their programs
const PROGRAM_LISTING_PATHS = [
  '/studienangebot',
  '/studiengaenge',
  '/studium/studienangebot',
  '/en/studium/studienangebot',
  '/en/studies',
  '/en/degree-programs',
  '/en/programs',
  '/en/courses',
  '/study/degree-programmes',
  '/study/programs',
  '/academics/programs',
  '/academics/degrees',
  '/studying/degree-programmes',
  '/education/programs',
];

async function scrapeWithFirecrawl(url: string, apiKey: string): Promise<string | null> {
  try {
    const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url,
        formats: ['markdown'],
        onlyMainContent: true,
        waitFor: 2000,
      }),
    });

    if (!response.ok) {
      console.error(`Firecrawl scrape failed for ${url}:`, response.status);
      return null;
    }

    const data = await response.json();
    return data.data?.markdown || data.markdown || null;
  } catch (error) {
    console.error(`Error scraping ${url}:`, error);
    return null;
  }
}

async function mapWebsiteUrls(url: string, apiKey: string, searchTerm?: string): Promise<string[]> {
  try {
    const response = await fetch('https://api.firecrawl.dev/v1/map', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url,
        search: searchTerm || 'studiengang studienangebot program bachelor master degree studiengaenge',
        limit: 200,
        includeSubdomains: true,
      }),
    });

    if (!response.ok) {
      console.error('Firecrawl map failed:', response.status);
      return [];
    }

    const data = await response.json();
    return data.links || [];
  } catch (error) {
    console.error('Error mapping website:', error);
    return [];
  }
}

// Filter URLs to find likely program pages
function filterProgramUrls(urls: string[]): { filtered: string[], all: string[] } {
  const programPatterns = [
    /studiengang/i,
    /studieng/i,
    /studienangebot/i,
    /program/i,
    /course/i,
    /bachelor/i,
    /master/i,
    /degree/i,
    /study.*program/i,
    /degree.*program/i,
    /studienfach/i,
    /fachbereich.*studium/i,
    /\/ba\//i,
    /\/ma\//i,
    /\/bsc\//i,
    /\/msc\//i,
  ];

  const excludePatterns = [
    /login/i,
    /contact/i,
    /imprint/i,
    /impressum/i,
    /privacy/i,
    /datenschutz/i,
    /news/i,
    /events/i,
    /blog/i,
    /press/i,
    /download/i,
    /\.pdf$/i,
    /\.jpg$/i,
    /\.png$/i,
    /\.gif$/i,
    /\?/,  // Exclude URLs with query params
    /#/,   // Exclude anchor links
    /mailto:/i,
    /tel:/i,
    /javascript:/i,
    /search/i,
    /sitemap/i,
  ];

  const all = urls.filter(url => {
    const isExcluded = excludePatterns.some(pattern => pattern.test(url));
    return !isExcluded;
  });

  const filtered = all.filter(url => {
    const matchesProgram = programPatterns.some(pattern => pattern.test(url));
    return matchesProgram;
  });

  return { filtered, all };
}

// Extract language prefix from URL path (e.g., /en/, /de/, /english/)
function extractLanguagePrefix(url: string): string | null {
  try {
    const urlObj = new URL(url);
    const pathMatch = urlObj.pathname.match(/^\/(en|de|english|german|deutsch)\//i);
    if (pathMatch) {
      return `/${pathMatch[1].toLowerCase()}/`;
    }
  } catch {
    // Invalid URL
  }
  return null;
}

// Generate language-aware program listing paths
function getLanguageAwarePaths(langPrefix: string | null): string[] {
  const basePaths = [
    'studienangebot',
    'studium/studienangebot',
    'studiengaenge',
    'studies',
    'studies/degree-programs',
    'study/degree-programmes',
    'study/programs',
    'academics/programs',
    'degree-programs',
    'programs',
    'courses',
  ];

  const paths: string[] = [];
  
  // If we have a language prefix, prioritize those paths first
  if (langPrefix) {
    for (const basePath of basePaths) {
      paths.push(`${langPrefix}${basePath}`);
    }
  }
  
  // Then add paths without language prefix as fallback
  for (const basePath of basePaths) {
    paths.push(`/${basePath}`);
  }
  
  // Also add the original PROGRAM_LISTING_PATHS that weren't covered
  for (const path of PROGRAM_LISTING_PATHS) {
    if (!paths.includes(path)) {
      paths.push(path);
    }
  }
  
  return paths;
}

// Try to find the program listing page from a base URL, preserving language context
async function findProgramListingPage(baseUrl: string): Promise<string | null> {
  try {
    const urlObj = new URL(baseUrl);
    const origin = urlObj.origin;
    const langPrefix = extractLanguagePrefix(baseUrl);
    
    console.log(`Finding program listing page from: ${baseUrl}`);
    console.log(`Detected language prefix: ${langPrefix || 'none'}`);
    
    const pathsToTry = getLanguageAwarePaths(langPrefix);
    
    for (const path of pathsToTry) {
      const testUrl = `${origin}${path}`;
      try {
        const response = await fetch(testUrl, { method: 'HEAD', redirect: 'follow' });
        if (response.ok) {
          console.log(`Found program listing page: ${testUrl}`);
          return testUrl;
        }
      } catch {
        // URL doesn't exist, continue
      }
    }
  } catch (error) {
    console.error('Error finding program listing page:', error);
  }
  return null;
}

async function matchFieldOfStudy(fieldText: string, supabaseUrl: string, supabaseKey: string): Promise<FieldMatchResult | null> {
  try {
    const response = await fetch(`${supabaseUrl}/functions/v1/match-field-of-study`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ field_of_study: fieldText }),
    });

    if (!response.ok) {
      console.error('Field matching failed:', response.status);
      return null;
    }

    const data = await response.json();
    if (data.success && data.data) {
      return data.data as FieldMatchResult;
    }
    return null;
  } catch (error) {
    console.error('Error matching field of study:', error);
    return null;
  }
}

async function extractProgramData(
  markdown: string, 
  url: string, 
  lovableApiKey: string,
  supabaseUrl?: string,
  supabaseKey?: string
): Promise<ScrapedProgram | null> {
  try {
    // Truncate markdown to avoid token limits
    const truncatedMarkdown = markdown.substring(0, 12000);

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: PROGRAM_EXTRACTION_PROMPT },
          { role: 'user', content: `Extract program information from this page content:\n\nURL: ${url}\n\nContent:\n${truncatedMarkdown}` }
        ],
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      console.error('AI extraction failed:', response.status);
      return null;
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    if (!content) return null;

    // Parse JSON from response (handle potential markdown wrapping)
    let jsonStr = content;
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1];
    }

    const program = JSON.parse(jsonStr.trim()) as ScrapedProgram;
    program.program_url = url;
    
    // Auto-match field of study if we have Supabase credentials
    if (program.field_of_study && supabaseUrl && supabaseKey) {
      console.log(`Matching field of study: ${program.field_of_study}`);
      const fieldMatch = await matchFieldOfStudy(program.field_of_study, supabaseUrl, supabaseKey);
      if (fieldMatch) {
        program.field_of_study_id = fieldMatch.field_of_study_id || undefined;
        program.field_of_study_name = fieldMatch.field_of_study_name || undefined;
        program.field_match_confidence = fieldMatch.confidence;
        program.field_match_score = fieldMatch.confidence_score;
        console.log(`Matched to: ${fieldMatch.field_of_study_name} (${fieldMatch.confidence})`);
      }
    }
    
    return program;
  } catch (error) {
    console.error('Error extracting program data:', error);
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Require authenticated admin caller
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ success: false, error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2.55.0");
    const userClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: claims, error: claimsErr } = await userClient.auth.getClaims(authHeader.replace('Bearer ', ''));
    if (claimsErr || !claims?.claims) {
      return new Response(JSON.stringify({ success: false, error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const adminUserId = claims.claims.sub as string;
    const { data: roleRow } = await userClient
      .from('user_roles').select('role').eq('profile_id', adminUserId).eq('role', 'admin').maybeSingle();
    if (!roleRow) {
      return new Response(JSON.stringify({ success: false, error: 'Forbidden: admin role required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { url, mode = 'discover', programUrls = [], deepDiscovery = true } = await req.json();

    // SSRF guard: validate the input URL(s)
    const isSafe = (u: string) => {
      try {
        const parsed = new URL(u);
        if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return false;
        const host = parsed.hostname.toLowerCase();
        if (host === 'localhost' || host.endsWith('.local') || host.endsWith('.internal') ||
            /^(?:\d{1,3}\.){3}\d{1,3}$/.test(host) || host.includes(':')) return false;
        return true;
      } catch { return false; }
    };
    if (url && !isSafe(url)) {
      return new Response(JSON.stringify({ success: false, error: 'URL host is not publicly routable' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    for (const pu of programUrls) {
      if (!isSafe(pu)) {
        return new Response(JSON.stringify({ success: false, error: 'One or more program URLs are not publicly routable' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
    }

    if (!url && programUrls.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: 'URL or programUrls required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const firecrawlApiKey = Deno.env.get('FIRECRAWL_API_KEY');
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');

    if (!firecrawlApiKey) {
      return new Response(
        JSON.stringify({ success: false, error: 'Firecrawl API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!lovableApiKey) {
      return new Response(
        JSON.stringify({ success: false, error: 'Lovable API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Mode 1: Discover program URLs from a university website
    if (mode === 'discover') {
      console.log('Discovering program URLs from:', url);
      
      let discoveryUrl = url;
      let suggestedUrl: string | null = null;

      // If deep discovery is enabled, try to find the program listing page first
      if (deepDiscovery) {
        console.log('Deep discovery enabled, searching for program listing page...');
        const listingPage = await findProgramListingPage(url);
        if (listingPage) {
          discoveryUrl = listingPage;
          suggestedUrl = listingPage;
          console.log(`Using discovered listing page: ${discoveryUrl}`);
        }
      }

      const allUrls = await mapWebsiteUrls(discoveryUrl, firecrawlApiKey);
      const { filtered: programUrlsFiltered, all: cleanUrls } = filterProgramUrls(allUrls);
      
      console.log(`Found ${allUrls.length} total URLs, ${programUrlsFiltered.length} potential program pages`);

      // Generate suggestions if no programs found
      const suggestions: string[] = [];
      if (programUrlsFiltered.length === 0) {
        try {
          const urlObj = new URL(url);
          const origin = urlObj.origin;
          const langPrefix = extractLanguagePrefix(url);
          
          // Suggest language-aware program listing URLs
          if (langPrefix) {
            suggestions.push(
              `${origin}${langPrefix}studienangebot`,
              `${origin}${langPrefix}studium/studienangebot`,
              `${origin}${langPrefix}studies/degree-programs`,
              `${origin}${langPrefix}study/programmes`
            );
          } else {
            suggestions.push(
              `${origin}/en/studienangebot`,
              `${origin}/en/studium/studienangebot`,
              `${origin}/studienangebot`,
              `${origin}/study/programmes`
            );
          }
        } catch {
          // Invalid URL, skip suggestions
        }
      }
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          data: {
            totalUrls: allUrls.length,
            programUrls: programUrlsFiltered.slice(0, 50), // Limit to 50 for performance
            allUrls: cleanUrls.slice(0, 50), // Return first 50 clean URLs for debugging
            suggestedUrl,
            suggestions: suggestions.slice(0, 4),
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Mode 2: Scrape and extract data from specific program URLs
    if (mode === 'scrape') {
      const urlsToScrape = programUrls.length > 0 ? programUrls : [url];
      console.log(`Scraping ${urlsToScrape.length} program pages`);
      
      // Get Supabase credentials for field matching
      const supabaseUrl = Deno.env.get('SUPABASE_URL');
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
      
      const programs: ScrapedProgram[] = [];
      const errors: string[] = [];

      for (const programUrl of urlsToScrape.slice(0, 20)) { // Limit to 20 per request
        console.log('Scraping:', programUrl);
        
        const markdown = await scrapeWithFirecrawl(programUrl, firecrawlApiKey);
        if (!markdown) {
          errors.push(`Failed to scrape: ${programUrl}`);
          continue;
        }

        const program = await extractProgramData(markdown, programUrl, lovableApiKey, supabaseUrl, supabaseKey);
        if (program && program.name) {
          programs.push(program);
          console.log('Extracted:', program.name, program.field_of_study_name ? `[Field: ${program.field_of_study_name}]` : '');
        } else {
          errors.push(`Failed to extract data from: ${programUrl}`);
        }

        // Small delay to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          data: {
            programs,
            errors,
            scraped: programs.length,
            failed: errors.length,
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: false, error: 'Invalid mode. Use "discover" or "scrape"' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in scrape-programs-firecrawl:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});