import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DomainMatchRequest {
  urls: string[];
}

interface UniversityMatch {
  url: string;
  domain: string;
  university_id: string | null;
  university_name: string | null;
  university_slug: string | null;
  city_name: string | null;
  matched: boolean;
}

interface DomainMatchResponse {
  success: boolean;
  matches: UniversityMatch[];
  unmatched_domains: string[];
  stats: {
    total: number;
    matched: number;
    unmatched: number;
  };
}

// Extract domain from URL
function extractDomain(url: string): string | null {
  try {
    const urlObj = new URL(url);
    // Get the hostname and remove www prefix
    let domain = urlObj.hostname.toLowerCase();
    if (domain.startsWith('www.')) {
      domain = domain.substring(4);
    }
    return domain;
  } catch {
    console.error(`Invalid URL: ${url}`);
    return null;
  }
}

// Group URLs by domain
function groupByDomain(urls: string[]): Map<string, string[]> {
  const groups = new Map<string, string[]>();
  
  for (const url of urls) {
    const domain = extractDomain(url);
    if (domain) {
      const existing = groups.get(domain) || [];
      existing.push(url);
      groups.set(domain, existing);
    }
  }
  
  return groups;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { urls }: DomainMatchRequest = await req.json();

    if (!urls || !Array.isArray(urls) || urls.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: 'URLs array is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Matching ${urls.length} URLs to universities`);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Group URLs by domain
    const domainGroups = groupByDomain(urls);
    const uniqueDomains = Array.from(domainGroups.keys());
    
    console.log(`Found ${uniqueDomains.length} unique domains`);

    // Fetch all universities with their websites
    const { data: universities, error: uniError } = await supabase
      .from('universities')
      .select('id, name, slug, website, city:cities(name)')
      .not('website', 'is', null);

    if (uniError) {
      console.error('Error fetching universities:', uniError);
      throw uniError;
    }

    // Build domain -> university mapping
    const domainToUniversity = new Map<string, { id: string; name: string; slug: string; city_name: string | null }>();
    
    for (const uni of universities || []) {
      if (uni.website) {
        const uniDomain = extractDomain(uni.website);
        if (uniDomain) {
          domainToUniversity.set(uniDomain, {
            id: uni.id,
            name: uni.name,
            slug: uni.slug,
            city_name: (uni.city as any)?.name || null
          });
        }
      }
    }

    console.log(`Built mapping for ${domainToUniversity.size} university domains`);

    // Match each URL to a university
    const matches: UniversityMatch[] = [];
    const unmatchedDomains = new Set<string>();

    for (const url of urls) {
      const domain = extractDomain(url);
      
      if (!domain) {
        matches.push({
          url,
          domain: '',
          university_id: null,
          university_name: null,
          university_slug: null,
          city_name: null,
          matched: false
        });
        continue;
      }

      // Try exact domain match first
      let university = domainToUniversity.get(domain);
      
      // If no exact match, try matching parent domains
      // e.g., for "cs.tu-dortmund.de", try "tu-dortmund.de"
      if (!university) {
        const domainParts = domain.split('.');
        for (let i = 1; i < domainParts.length - 1; i++) {
          const parentDomain = domainParts.slice(i).join('.');
          university = domainToUniversity.get(parentDomain);
          if (university) {
            console.log(`Matched subdomain ${domain} to parent ${parentDomain}`);
            break;
          }
        }
      }

      if (university) {
        matches.push({
          url,
          domain,
          university_id: university.id,
          university_name: university.name,
          university_slug: university.slug,
          city_name: university.city_name,
          matched: true
        });
      } else {
        matches.push({
          url,
          domain,
          university_id: null,
          university_name: null,
          university_slug: null,
          city_name: null,
          matched: false
        });
        unmatchedDomains.add(domain);
      }
    }

    const matchedCount = matches.filter(m => m.matched).length;
    
    console.log(`Matched ${matchedCount}/${urls.length} URLs`);
    if (unmatchedDomains.size > 0) {
      console.log(`Unmatched domains: ${Array.from(unmatchedDomains).join(', ')}`);
    }

    const response: DomainMatchResponse = {
      success: true,
      matches,
      unmatched_domains: Array.from(unmatchedDomains),
      stats: {
        total: urls.length,
        matched: matchedCount,
        unmatched: urls.length - matchedCount
      }
    };

    return new Response(
      JSON.stringify(response),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in match-university-by-domain:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
