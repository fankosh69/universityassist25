import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DomainCheckResult {
  domain: string;
  hasMX: boolean;
  hasAorAAAA: boolean;
  mxSummary?: string;
  webReachable: boolean;
  organizationHint: 'company' | 'school' | 'unknown';
}

// Check if domain looks like educational institution
function isEducationalDomain(domain: string, title?: string): boolean {
  const lowerDomain = domain.toLowerCase();
  
  // Common educational TLDs
  if (lowerDomain.endsWith('.edu') || 
      lowerDomain.includes('.edu.') ||
      lowerDomain.includes('.ac.') ||
      lowerDomain.includes('.uni.')) {
    return true;
  }
  
  // Common university keywords in domain
  const eduKeywords = ['uni', 'university', 'college', 'campus', 'school', 'academic'];
  if (eduKeywords.some(keyword => lowerDomain.includes(keyword))) {
    return true;
  }
  
  // Check title for educational indicators
  if (title) {
    const lowerTitle = title.toLowerCase();
    const titleEduKeywords = ['university', 'college', 'school', 'academic', 'education', 'campus'];
    return titleEduKeywords.some(keyword => lowerTitle.includes(keyword));
  }
  
  return false;
}

// Check if domain looks like a company
function isCompanyDomain(title?: string): boolean {
  if (!title) return false;
  
  const lowerTitle = title.toLowerCase();
  const companyKeywords = ['company', 'corporation', 'inc', 'ltd', 'llc', 'careers', 'about us', 'services'];
  return companyKeywords.some(keyword => lowerTitle.includes(keyword));
}

// Perform DNS lookups
async function checkDNS(domain: string): Promise<{ hasMX: boolean; hasAorAAAA: boolean; mxSummary?: string }> {
  try {
    // Check MX records
    let hasMX = false;
    let mxSummary = '';
    
    try {
      const mxResponse = await fetch(`https://dns.google/resolve?name=${domain}&type=MX`);
      const mxData = await mxResponse.json();
      
      if (mxData.Answer && mxData.Answer.length > 0) {
        hasMX = true;
        mxSummary = mxData.Answer[0].data.split(' ')[1]; // Get the mail server
      }
    } catch (error) {
      console.log('MX lookup failed:', error);
    }
    
    // Check A/AAAA records
    let hasAorAAAA = false;
    
    try {
      const aResponse = await fetch(`https://dns.google/resolve?name=${domain}&type=A`);
      const aData = await aResponse.json();
      
      if (aData.Answer && aData.Answer.length > 0) {
        hasAorAAAA = true;
      }
    } catch (error) {
      console.log('A record lookup failed:', error);
    }
    
    // If no A record, try AAAA
    if (!hasAorAAAA) {
      try {
        const aaaaResponse = await fetch(`https://dns.google/resolve?name=${domain}&type=AAAA`);
        const aaaaData = await aaaaResponse.json();
        
        if (aaaaData.Answer && aaaaData.Answer.length > 0) {
          hasAorAAAA = true;
        }
      } catch (error) {
        console.log('AAAA record lookup failed:', error);
      }
    }
    
    return { hasMX, hasAorAAAA, mxSummary };
  } catch (error) {
    console.error('DNS check failed:', error);
    return { hasMX: false, hasAorAAAA: false };
  }
}

// Check web reachability and get page title
async function checkWebReachability(domain: string): Promise<{ reachable: boolean; title?: string }> {
  const urls = [`https://${domain}`, `https://www.${domain}`];
  
  for (const url of urls) {
    try {
      console.log(`Checking ${url}`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch(url, {
        method: 'HEAD',
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; EmailValidator/1.0)'
        }
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        // If HEAD worked, try to get title with GET
        try {
          const getController = new AbortController();
          const getTimeoutId = setTimeout(() => getController.abort(), 3000);
          
          const getResponse = await fetch(url, {
            method: 'GET',
            signal: getController.signal,
            headers: {
              'User-Agent': 'Mozilla/5.0 (compatible; EmailValidator/1.0)'
            }
          });
          
          clearTimeout(getTimeoutId);
          
          if (getResponse.ok) {
            const html = await getResponse.text();
            const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
            const title = titleMatch ? titleMatch[1].trim() : undefined;
            
            return { reachable: true, title };
          }
        } catch (error) {
          console.log('GET request failed, but HEAD succeeded:', error);
        }
        
        return { reachable: true };
      }
    } catch (error) {
      console.log(`Failed to reach ${url}:`, error);
      continue;
    }
  }
  
  return { reachable: false };
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    const url = new URL(req.url);
    const domain = url.searchParams.get('domain');
    
    if (!domain) {
      return new Response(
        JSON.stringify({ error: 'Domain parameter is required' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        }
      );
    }
    
    console.log(`Checking domain: ${domain}`);
    
    // Perform DNS and web checks in parallel
    const [dnsResult, webResult] = await Promise.all([
      checkDNS(domain),
      checkWebReachability(domain)
    ]);
    
    // Determine organization hint
    let organizationHint: 'company' | 'school' | 'unknown' = 'unknown';
    
    if (isEducationalDomain(domain, webResult.title)) {
      organizationHint = 'school';
    } else if (isCompanyDomain(webResult.title)) {
      organizationHint = 'company';
    }
    
    const result: DomainCheckResult = {
      domain,
      hasMX: dnsResult.hasMX,
      hasAorAAAA: dnsResult.hasAorAAAA,
      mxSummary: dnsResult.mxSummary,
      webReachable: webResult.reachable,
      organizationHint
    };
    
    console.log('Domain check result:', result);
    
    return new Response(JSON.stringify(result), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
    
  } catch (error: any) {
    console.error('Error in email-domain-check function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      }
    );
  }
};

serve(handler);