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
  minimum_gpa?: number;
  confidence?: number;
}

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
        search: searchTerm || 'studiengang program bachelor master degree',
        limit: 100,
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

function filterProgramUrls(urls: string[]): string[] {
  const programPatterns = [
    /studiengang/i,
    /program/i,
    /bachelor/i,
    /master/i,
    /degree/i,
    /courses?\//i,
    /study/i,
    /studienfach/i,
    /fachbereich.*studium/i,
  ];

  const excludePatterns = [
    /news/i,
    /event/i,
    /blog/i,
    /contact/i,
    /impressum/i,
    /datenschutz/i,
    /privacy/i,
    /login/i,
    /search/i,
    /sitemap/i,
    /\.(pdf|doc|docx|jpg|png|gif)$/i,
  ];

  return urls.filter(url => {
    const matchesProgram = programPatterns.some(pattern => pattern.test(url));
    const isExcluded = excludePatterns.some(pattern => pattern.test(url));
    return matchesProgram && !isExcluded;
  });
}

async function extractProgramData(markdown: string, url: string, lovableApiKey: string): Promise<ScrapedProgram | null> {
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
    const { url, mode = 'discover', programUrls = [] } = await req.json();

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
      
      const allUrls = await mapWebsiteUrls(url, firecrawlApiKey);
      const programUrls = filterProgramUrls(allUrls);
      
      console.log(`Found ${allUrls.length} total URLs, ${programUrls.length} potential program pages`);
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          data: {
            totalUrls: allUrls.length,
            programUrls: programUrls.slice(0, 50), // Limit to 50 for performance
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Mode 2: Scrape and extract data from specific program URLs
    if (mode === 'scrape') {
      const urlsToScrape = programUrls.length > 0 ? programUrls : [url];
      console.log(`Scraping ${urlsToScrape.length} program pages`);
      
      const programs: ScrapedProgram[] = [];
      const errors: string[] = [];

      for (const programUrl of urlsToScrape.slice(0, 20)) { // Limit to 20 per request
        console.log('Scraping:', programUrl);
        
        const markdown = await scrapeWithFirecrawl(programUrl, firecrawlApiKey);
        if (!markdown) {
          errors.push(`Failed to scrape: ${programUrl}`);
          continue;
        }

        const program = await extractProgramData(markdown, programUrl, lovableApiKey);
        if (program && program.name) {
          programs.push(program);
          console.log('Extracted:', program.name);
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
