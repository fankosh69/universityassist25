// Discovers SEO topic candidates from Google Search Console + Firecrawl.
// Strategy:
//   1. Pull GSC queries from the last 90 days where avg position is 8–25
//      and impressions >= 50 — i.e. queries we almost rank for. These are
//      the highest-ROI articles to write.
//   2. Scrape sitemaps of 2 competitor sites via Firecrawl /v2/map and
//      extract URL slugs as additional candidate keywords.
//   3. Score = impressions / position. Insert top N as `proposed`.
//
// Runs from pg_cron daily. Service-role auth (no end-user session needed).

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SITE_PROPERTY = "https://uniassist.net/";
const COMPETITOR_DOMAINS = ["studying-in-germany.org", "mastersportal.com"];
const TOP_N = 7;

const GSC_GATEWAY = "https://connector-gateway.lovable.dev/google_search_console";
const FIRECRAWL_API = "https://api.firecrawl.dev/v2";

interface GscRow {
  keys: string[];
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

async function fetchGscQueries(lovableKey: string, gscKey: string): Promise<GscRow[]> {
  const end = new Date().toISOString().slice(0, 10);
  const start = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const url = `${GSC_GATEWAY}/webmasters/v3/sites/${encodeURIComponent(SITE_PROPERTY)}/searchAnalytics/query`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${lovableKey}`,
      "X-Connection-Api-Key": gscKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      startDate: start,
      endDate: end,
      dimensions: ["query"],
      rowLimit: 500,
    }),
  });
  if (!res.ok) {
    console.warn(`[gsc] ${res.status} ${await res.text()}`);
    return [];
  }
  const data = await res.json();
  return (data.rows ?? []) as GscRow[];
}

async function fetchCompetitorSlugs(firecrawlKey: string, domain: string): Promise<string[]> {
  try {
    const res = await fetch(`${FIRECRAWL_API}/map`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${firecrawlKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url: `https://${domain}`,
        search: "germany",
        limit: 200,
        includeSubdomains: false,
      }),
    });
    if (!res.ok) {
      console.warn(`[firecrawl] map ${domain} failed: ${res.status}`);
      return [];
    }
    const data = await res.json();
    const links: string[] = data.links ?? data.data?.links ?? [];
    return links;
  } catch (e) {
    console.warn(`[firecrawl] ${domain} error`, e);
    return [];
  }
}

function slugToKeyword(url: string): string | null {
  try {
    const u = new URL(url);
    const last = u.pathname.split("/").filter(Boolean).pop();
    if (!last) return null;
    const kw = last.replace(/-/g, " ").replace(/\d{4}\b/g, "").trim();
    if (kw.length < 8 || kw.length > 80) return null;
    if (!/germany|german|berlin|munich|hamburg|frankfurt|study|university|master|bachelor|tuition|visa|scholarship/i.test(kw)) {
      return null;
    }
    return kw.toLowerCase();
  } catch {
    return null;
  }
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const lovableKey = Deno.env.get("LOVABLE_API_KEY");
  const gscKey = Deno.env.get("GOOGLE_SEARCH_CONSOLE_API_KEY");
  const firecrawlKey = Deno.env.get("FIRECRAWL_API_KEY");

  if (!lovableKey) return json({ error: "LOVABLE_API_KEY missing" }, 500);

  const sb = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } }
  );

  // Existing keywords / slugs to deduplicate against
  const [{ data: existingPosts }, { data: existingCandidates }] = await Promise.all([
    sb.from("blog_posts").select("keyword, slug"),
    sb.from("blog_topic_candidates").select("keyword"),
  ]);
  const taken = new Set<string>();
  for (const p of existingPosts ?? []) {
    if (p.keyword) taken.add(p.keyword.toLowerCase());
    if (p.slug) taken.add(p.slug.toLowerCase().replace(/-/g, " "));
  }
  for (const c of existingCandidates ?? []) {
    if (c.keyword) taken.add(c.keyword.toLowerCase());
  }

  const candidates: Array<{
    keyword: string;
    est_volume: number | null;
    current_position: number | null;
    source: "gsc" | "firecrawl_gap";
    source_url: string | null;
    score: number;
  }> = [];

  // 1. GSC near-miss queries
  if (gscKey) {
    const rows = await fetchGscQueries(lovableKey, gscKey);
    for (const r of rows) {
      const kw = r.keys[0]?.toLowerCase().trim();
      if (!kw || taken.has(kw)) continue;
      if (r.impressions < 50) continue;
      if (r.position < 8 || r.position > 25) continue;
      candidates.push({
        keyword: kw,
        est_volume: Math.round(r.impressions),
        current_position: Number(r.position.toFixed(1)),
        source: "gsc",
        source_url: null,
        score: r.impressions / r.position,
      });
      taken.add(kw);
    }
  } else {
    console.warn("[discovery] GOOGLE_SEARCH_CONSOLE_API_KEY missing — skipping GSC step");
  }

  // 2. Competitor sitemap slugs (Firecrawl)
  if (firecrawlKey) {
    for (const domain of COMPETITOR_DOMAINS) {
      const links = await fetchCompetitorSlugs(firecrawlKey, domain);
      for (const link of links.slice(0, 80)) {
        const kw = slugToKeyword(link);
        if (!kw || taken.has(kw)) continue;
        candidates.push({
          keyword: kw,
          est_volume: null,
          current_position: null,
          source: "firecrawl_gap",
          source_url: link,
          score: 10,
        });
        taken.add(kw);
      }
    }
  } else {
    console.warn("[discovery] FIRECRAWL_API_KEY missing — skipping competitor scrape");
  }

  candidates.sort((a, b) => b.score - a.score);
  const toInsert = candidates.slice(0, TOP_N);

  if (toInsert.length === 0) {
    return json({ inserted: 0, message: "no new candidates" });
  }

  const { error } = await sb
    .from("blog_topic_candidates")
    .upsert(toInsert.map((c) => ({ ...c, status: "proposed" as const })), {
      onConflict: "keyword",
      ignoreDuplicates: true,
    });
  if (error) {
    console.error("[discovery] insert error", error);
    return json({ error: error.message }, 500);
  }

  return json({ inserted: toInsert.length, candidates: toInsert });
});