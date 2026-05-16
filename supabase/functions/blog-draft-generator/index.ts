// Generates a draft blog post from a `proposed` topic candidate using
// Lovable AI Gateway. Output is SEO + AEO optimized:
//   - TL;DR at top (Perplexity/ChatGPT love this)
//   - Question-style H2s matching "People Also Ask" phrasing
//   - 40–60 word direct answer under each H2
//   - 5 FAQ entries (renders as FAQPage JSON-LD on the page)
//   - Internal links to /search, /eligibility-checker, /cities, /universities
//
// Runs from pg_cron daily. Picks oldest `proposed` candidate.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PROMPT_VERSION = "v1-2026-05-16";
const MODEL = "google/gemini-2.5-pro";

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

const SYSTEM_PROMPT = `You are an expert SEO and AEO (Answer Engine Optimization) content writer for University Assist, a platform helping international students from MENA apply to German universities.

Your job: write a 1100-1400 word article optimized for BOTH Google (SEO) and answer engines like ChatGPT / Perplexity / Google AI Overviews (AEO).

AEO rules (strict):
1. The article MUST start with a "tldr" of 60-90 words that answers the keyword directly. Answer engines extract this verbatim.
2. Every H2 must be phrased as a real question someone types or asks (e.g. "What is the cheapest German city for students?" not "Cheap German cities").
3. Immediately under each H2, write a 40-60 word direct, declarative answer. Then 1-2 paragraphs of supporting detail.
4. Include exactly 5 FAQ entries at the end.
5. Use concrete numbers (€, dates, ECTS, deadlines). Hedge unknowns honestly.
6. Voice: helpful, practical, non-salesy. International student audience, mid B2 English.

SEO rules:
- Primary keyword in title, meta_title, H1 (= title), first paragraph, and one H2.
- meta_title <= 60 chars. meta_description 140-160 chars.
- 6-8 H2 sections (sections array).
- Reading time: 6-9 minutes.

Brand rules:
- Never claim affiliation with uni-assist e.V., DAAD or German universities.
- Use "Total Credit Points" instead of "ECTS" in user-facing prose (technical context can use ECTS).
- Internal links should target: /search, /eligibility-checker, /cities, /universities, /blog, or existing landing pages.
- Primary CTA href should be one of: /search, /eligibility-checker, /cities, /universities.

OUTPUT FORMAT: return ONLY a JSON object matching this exact TypeScript type, no markdown, no commentary:

{
  "slug": string,                // url-safe, 3-7 words
  "title": string,               // H1, includes primary keyword
  "metaTitle": string,           // <=60 chars
  "metaDescription": string,     // 140-160 chars
  "category": "Cities" | "Universities" | "Study tips" | "Costs" | "Visa" | "Language" | "Careers",
  "readingMinutes": number,
  "tldr": string,                // 60-90 words
  "intro": string,               // 1 paragraph, 60-100 words, after the TLDR
  "sections": Array<{
    "heading": string,           // question phrasing
    "answer": string,            // 40-60 word direct answer
    "paragraphs": string[],      // 1-2 supporting paragraphs
    "bullets"?: string[]
  }>,
  "faqs": Array<{ "question": string, "answer": string }>,  // exactly 5
  "relatedLinks": Array<{ "label": string, "href": string }>, // 3-4 internal links
  "primaryCta": { "label": string, "href": string }
}`;

async function callAi(lovableKey: string, keyword: string, notes: string | null) {
  const userPrompt = `Write the article for primary keyword: "${keyword}".${
    notes ? `\n\nExtra context: ${notes}` : ""
  }\n\nAudience: international students (mostly from Egypt, MENA, India, China) considering German universities. Make every answer specific and verifiable.`;

  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${lovableKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
      response_format: { type: "json_object" },
      temperature: 0.4,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`AI gateway ${res.status}: ${body}`);
  }
  const data = await res.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error("AI returned empty content");
  return JSON.parse(content);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const lovableKey = Deno.env.get("LOVABLE_API_KEY");
  if (!lovableKey) return json({ error: "LOVABLE_API_KEY missing" }, 500);

  const sb = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } }
  );

  // Allow passing a specific candidate_id via POST body for on-demand runs
  let body: { candidate_id?: string; keyword?: string } = {};
  try {
    body = (await req.json()) ?? {};
  } catch {
    body = {};
  }

  let candidate: {
    id: string;
    keyword: string;
    notes: string | null;
  } | null = null;

  if (body.candidate_id) {
    const { data } = await sb
      .from("blog_topic_candidates")
      .select("id, keyword, notes")
      .eq("id", body.candidate_id)
      .maybeSingle();
    candidate = data as typeof candidate;
  } else if (body.keyword) {
    candidate = { id: "", keyword: body.keyword, notes: null };
  } else {
    const { data } = await sb
      .from("blog_topic_candidates")
      .select("id, keyword, notes")
      .eq("status", "proposed")
      .order("score", { ascending: false })
      .limit(1)
      .maybeSingle();
    candidate = data as typeof candidate;
  }

  if (!candidate) return json({ message: "no proposed candidates" });

  console.log(`[draft] generating for keyword: ${candidate.keyword}`);

  let ai;
  try {
    ai = await callAi(lovableKey, candidate.keyword, candidate.notes);
  } catch (e) {
    console.error("[draft] AI error", e);
    return json({ error: String(e) }, 500);
  }

  const slug = slugify(ai.slug || candidate.keyword);

  const { data: existing } = await sb
    .from("blog_posts")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();
  if (existing) {
    return json({ message: "slug already exists", slug });
  }

  const { data: inserted, error } = await sb
    .from("blog_posts")
    .insert({
      slug,
      title: ai.title,
      meta_title: ai.metaTitle,
      meta_description: ai.metaDescription,
      keyword: candidate.keyword,
      category: ai.category,
      reading_minutes: ai.readingMinutes ?? 7,
      tldr: ai.tldr,
      intro: ai.intro,
      sections: ai.sections ?? [],
      faqs: ai.faqs ?? [],
      related_links: ai.relatedLinks ?? [],
      primary_cta: ai.primaryCta ?? null,
      status: "draft",
      source_candidate_id: candidate.id || null,
      ai_model: MODEL,
      ai_prompt_version: PROMPT_VERSION,
    })
    .select("id, slug")
    .single();

  if (error) {
    console.error("[draft] insert error", error);
    return json({ error: error.message }, 500);
  }

  if (candidate.id) {
    await sb
      .from("blog_topic_candidates")
      .update({ status: "drafted" })
      .eq("id", candidate.id);
  }

  return json({ success: true, post: inserted });
});