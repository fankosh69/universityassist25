import { createClient } from "https://esm.sh/@supabase/supabase-js@2.55.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function requireAdmin(req: Request) {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return { ok: false as const, status: 401, msg: 'Unauthorized' };
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } }
  );
  const { data: claims, error } = await supabase.auth.getClaims(authHeader.replace('Bearer ', ''));
  if (error || !claims?.claims) return { ok: false as const, status: 401, msg: 'Unauthorized' };
  const userId = claims.claims.sub as string;
  const { data: roleRow } = await supabase
    .from('user_roles').select('role').eq('profile_id', userId).eq('role', 'admin').maybeSingle();
  if (!roleRow) return { ok: false as const, status: 403, msg: 'Forbidden: admin role required' };
  return { ok: true as const };
}

function isSafeUrl(input: string): { ok: boolean; reason?: string; url?: string } {
  let url: URL;
  try { url = new URL(input.startsWith('http') ? input : `https://${input}`); }
  catch { return { ok: false, reason: 'Invalid URL' }; }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') return { ok: false, reason: 'Only http/https URLs allowed' };
  const host = url.hostname.toLowerCase();
  if (host === 'localhost' || host.endsWith('.local') || host.endsWith('.internal') ||
      /^(?:\d{1,3}\.){3}\d{1,3}$/.test(host) || host.includes(':')) {
    return { ok: false, reason: 'URL host is not publicly routable' };
  }
  return { ok: true, url: url.toString() };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const auth = await requireAdmin(req);
  if (!auth.ok) {
    return new Response(JSON.stringify({ success: false, error: auth.msg }), {
      status: auth.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  try {
    const { url, options } = await req.json();
    if (!url) {
      return new Response(JSON.stringify({ success: false, error: 'URL is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const safe = isSafeUrl(url);
    if (!safe.ok) {
      return new Response(JSON.stringify({ success: false, error: safe.reason }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const apiKey = Deno.env.get('FIRECRAWL_API_KEY');
    if (!apiKey) {
      return new Response(JSON.stringify({ success: false, error: 'Firecrawl connector not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const response = await fetch('https://api.firecrawl.dev/v1/map', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: safe.url,
        search: options?.search,
        limit: options?.limit || 5000,
        includeSubdomains: options?.includeSubdomains ?? false,
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      return new Response(JSON.stringify({ success: false, error: data.error || `Request failed with status ${response.status}` }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    return new Response(JSON.stringify(data), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error('Error mapping:', error);
    return new Response(JSON.stringify({ success: false, error: 'Failed to map' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
