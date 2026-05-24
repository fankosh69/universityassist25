import { createClient } from "https://esm.sh/@supabase/supabase-js@2.55.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const FIRECRAWL = "https://api.firecrawl.dev/v2";
const LOVABLE_AI = "https://ai.gateway.lovable.dev/v1/chat/completions";

// Canonical program fields we extract. Used both as LLM schema and diff scope.
const PROGRAM_FIELDS = [
  "name", "degree_type", "degree_level", "description",
  "duration_semesters", "ects_credits", "language_of_instruction",
  "tuition_amount", "tuition_fee_structure", "uni_assist_required",
  "application_method", "winter_intake", "summer_intake",
  "winter_deadline_month", "winter_deadline_day",
  "summer_deadline_month", "summer_deadline_day",
  "program_url", "field_of_study", "minimum_gpa",
  "admission_regulations_url", "program_flyer_url", "module_description_url",
] as const;

const EXTRACT_PROMPT = `You are extracting program data from a German university page. Return STRICT JSON matching this schema (omit unknown fields, do NOT guess):
{
  "name": string,
  "degree_type": "B.Sc."|"B.A."|"B.Eng."|"M.Sc."|"M.A."|"M.Eng."|"M.B.A."|null,
  "degree_level": "bachelor"|"master"|null,
  "description": string,
  "duration_semesters": integer,
  "ects_credits": integer,
  "language_of_instruction": ["de"|"en"...],
  "tuition_amount": number,
  "tuition_fee_structure": "semester"|"yearly"|"monthly"|null,
  "uni_assist_required": boolean,
  "application_method": "direct"|"uni_assist_direct"|"uni_assist_vpd"|null,
  "winter_intake": boolean, "summer_intake": boolean,
  "winter_deadline_month": 1-12, "winter_deadline_day": 1-31,
  "summer_deadline_month": 1-12, "summer_deadline_day": 1-31,
  "program_url": string,
  "field_of_study": string,
  "minimum_gpa": number,
  "admission_regulations_url": string,
  "program_flyer_url": string,
  "module_description_url": string,
  "_confidence": { "<field>": 0.0-1.0 }
}
No prose. JSON only.`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const service = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
  const firecrawlKey = Deno.env.get("FIRECRAWL_API_KEY");
  const aiKey = Deno.env.get("LOVABLE_API_KEY");

  try {
    const { jobId, universityId: bodyUniId, dryRun } = await req.json().catch(() => ({}));

    // Resolve job — either explicit or pull next pending.
    let job: any = null;
    if (jobId) {
      const { data } = await service.from("scrape_jobs").select("*").eq("id", jobId).maybeSingle();
      job = data;
    } else if (bodyUniId) {
      const { data } = await service.from("scrape_jobs").insert({
        university_id: bodyUniId, job_type: "university_refresh", status: "running",
      }).select("*").single();
      job = data;
    } else {
      const { data } = await service.from("scrape_jobs")
        .select("*").eq("status", "pending").order("priority").order("scheduled_at").limit(1).maybeSingle();
      job = data;
    }
    if (!job) return json({ ok: true, reason: "no_jobs" });

    await service.from("scrape_jobs").update({ status: "running", started_at: new Date().toISOString(), attempt_count: (job.attempt_count ?? 0) + 1 }).eq("id", job.id);

    const { data: profile } = await service
      .from("university_scrape_profiles")
      .select("*").eq("university_id", job.university_id).maybeSingle();
    const { data: university } = await service
      .from("universities").select("id, name, website").eq("id", job.university_id).maybeSingle();

    if (!profile || !university?.website) {
      await failJob(service, job.id, "missing profile or university website");
      return json({ ok: false, reason: "missing_profile_or_url" });
    }

    const { data: run } = await service.from("scrape_runs").insert({
      job_id: job.id, university_id: job.university_id, status: "running",
    }).select("*").single();

    let credits = 0;
    let pages = 0;
    let pdfs = 0;
    let diffs = 0;
    const errors: any[] = [];

    try {
      // ---- Pass 1: discover candidate program URLs (Firecrawl MAP) ----
      const candidateUrls = new Set<string>();
      const bases = profile.base_urls?.length ? profile.base_urls : [university.website];
      for (const base of bases) {
        const m = await firecrawl(firecrawlKey, "map", {
          url: base, limit: Math.min(profile.max_pages ?? 200, 500),
          includeSubdomains: false,
        });
        credits += 1;
        const links: string[] = m?.links ?? m?.data?.links ?? [];
        for (const l of links) {
          if (matchesAny(l, profile.exclude_patterns)) continue;
          if (!profile.program_url_patterns?.length || matchesAny(l, profile.program_url_patterns)) {
            candidateUrls.add(l);
          }
        }
      }

      // Cap to budget.
      const urls = Array.from(candidateUrls).slice(0, profile.max_pages ?? 200);

      // ---- Pass 2 + 3: per-program surface scrape, gap chasing, PDF ingest ----
      for (const url of urls) {
        try {
          const surface = await firecrawl(firecrawlKey, "scrape", {
            url, formats: ["markdown", "links"], onlyMainContent: true,
            waitFor: profile.wait_for_ms ?? 0,
          });
          credits += 1; pages += 1;
          const md: string = surface?.markdown ?? surface?.data?.markdown ?? "";
          if (!md) continue;

          let extracted = await llmExtract(aiKey, md, url, profile.extraction_prompt_overrides);

          // Gap chase: missing required fields → score sub-links → scrape top 3 → merge.
          const links: string[] = surface?.links ?? surface?.data?.links ?? [];
          const missing = PROGRAM_FIELDS.filter((f) => extracted?.[f] == null);
          if (missing.length > 0 && links.length > 0) {
            const candidates = scoreGapLinks(links, missing, url).slice(0, 3);
            for (const cand of candidates) {
              const sub = await firecrawl(firecrawlKey, "scrape", {
                url: cand.url, formats: ["markdown"], onlyMainContent: true,
              });
              credits += 1; pages += 1;
              const subMd: string = sub?.markdown ?? sub?.data?.markdown ?? "";
              if (!subMd) continue;
              const subExtracted = await llmExtract(aiKey, subMd, cand.url);
              extracted = mergePreferExisting(extracted, subExtracted, cand.url);
            }
          }

          // PDF ingest: collect matching pdf links.
          const pdfLinks = links.filter((l) =>
            /\.pdf($|\?)/i.test(l) || matchesAny(l, profile.pdf_link_patterns ?? []),
          ).slice(0, 5);
          for (const pdfUrl of pdfLinks) {
            try {
              const stored = await ingestPdf(service, job.university_id, pdfUrl);
              if (stored) pdfs += 1;
            } catch (e) { errors.push({ url: pdfUrl, err: String(e) }); }
          }

          // Diff against existing program (matched by name + university).
          const { data: existing } = await service
            .from("programs")
            .select("*")
            .eq("university_id", job.university_id)
            .ilike("name", extracted?.name ?? "___no_match___")
            .maybeSingle();

          if (existing && !dryRun) {
            for (const f of PROGRAM_FIELDS) {
              const newVal = (extracted as any)?.[f];
              const oldVal = (existing as any)?.[f];
              if (newVal == null) continue;
              if (JSON.stringify(newVal) === JSON.stringify(oldVal)) continue;
              const conf = extracted?._confidence?.[f] ?? 0.6;
              await service.from("scrape_diffs").insert({
                run_id: run.id,
                program_id: existing.id,
                university_id: job.university_id,
                field_path: f,
                old_value: oldVal ?? null,
                new_value: newVal,
                confidence: conf,
                source_url: url,
                source_kind: "page",
                status: "pending",
              });
              diffs += 1;
              await service.from("program_field_sources").upsert({
                program_id: existing.id,
                field_path: f,
                source_url: url,
                source_kind: "page",
                confidence: conf,
                last_verified_at: new Date().toISOString(),
              }, { onConflict: "program_id,field_path" });
            }
          }
        } catch (e) {
          errors.push({ url, err: String(e) });
        }
      }

      await service.from("scrape_runs").update({
        finished_at: new Date().toISOString(),
        status: errors.length === pages ? "failed" : "completed",
        pages_crawled: pages, pdfs_ingested: pdfs, credits_used: credits, diffs_created: diffs,
        errors,
      }).eq("id", run.id);

      await service.from("scrape_jobs").update({
        status: "done", finished_at: new Date().toISOString(),
      }).eq("id", job.id);

      await service.from("university_scrape_profiles").update({
        last_success_at: new Date().toISOString(),
        health_score: errors.length === 0 ? 1.0 : Math.max(0.1, 1 - errors.length / Math.max(pages, 1)),
      }).eq("id", profile.id);

      // Budget bookkeeping.
      await service.rpc("increment_scrape_budget", { add_credits: credits }).then(() => {}).catch(async () => {
        const { data: b } = await service.from("scrape_budget").select("current_month_used").maybeSingle();
        await service.from("scrape_budget").update({ current_month_used: (b?.current_month_used ?? 0) + credits }).eq("id", true);
      });

      return json({ ok: true, runId: run.id, pages, pdfs, credits, diffs });
    } catch (e) {
      await service.from("scrape_runs").update({
        finished_at: new Date().toISOString(), status: "failed",
        errors: [...errors, { fatal: String(e) }],
      }).eq("id", run.id);
      await failJob(service, job.id, String(e));
      throw e;
    }
  } catch (e) {
    console.error("scrape-university error", e);
    return json({ error: String(e) }, 500);
  }
});

// ---------- helpers ----------

async function firecrawl(key: string | undefined, path: "scrape" | "map" | "crawl", body: any) {
  if (!key) throw new Error("FIRECRAWL_API_KEY not configured");
  const res = await fetch(`${FIRECRAWL}/${path}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`firecrawl ${path} ${res.status}`);
  return await res.json();
}

async function llmExtract(aiKey: string | undefined, markdown: string, url: string, override?: string | null) {
  if (!aiKey) throw new Error("LOVABLE_API_KEY not configured");
  const prompt = (override?.trim() ? override : EXTRACT_PROMPT) + `\n\nSOURCE URL: ${url}\n\nPAGE:\n` + markdown.slice(0, 12000);
  const res = await fetch(LOVABLE_AI, {
    method: "POST",
    headers: { Authorization: `Bearer ${aiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
    }),
  });
  if (!res.ok) throw new Error(`ai ${res.status}`);
  const j = await res.json();
  const txt = j?.choices?.[0]?.message?.content ?? "{}";
  try { return JSON.parse(txt); } catch { return {}; }
}

function matchesAny(url: string, patterns: string[] | null | undefined) {
  if (!patterns?.length) return false;
  return patterns.some((p) => {
    try { return new RegExp(p, "i").test(url); }
    catch { return url.toLowerCase().includes(p.toLowerCase()); }
  });
}

function scoreGapLinks(links: string[], missing: readonly string[], base: string) {
  // Heuristic: score by keyword presence in URL path.
  const keywords: Record<string, string[]> = {
    minimum_gpa: ["admission", "requirements", "voraussetzung", "zulassung"],
    winter_deadline_month: ["deadline", "frist", "apply", "bewerb"],
    summer_deadline_month: ["deadline", "frist", "apply", "bewerb"],
    tuition_amount: ["tuition", "fee", "gebuhr", "kost"],
    ects_credits: ["curriculum", "modules", "studienplan", "modulhandbuch"],
    description: ["overview", "about", "ueberblick"],
    admission_regulations_url: ["regulation", "ordnung", "satzung"],
  };
  const wanted = new Set<string>();
  missing.forEach((m) => (keywords[m] ?? []).forEach((k) => wanted.add(k)));

  const sameHost = new URL(base).hostname;
  return links
    .filter((l) => { try { return new URL(l).hostname === sameHost; } catch { return false; } })
    .map((l) => {
      const lower = l.toLowerCase();
      const score = [...wanted].reduce((acc, k) => acc + (lower.includes(k) ? 1 : 0), 0);
      return { url: l, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score);
}

function mergePreferExisting(base: any, extra: any, sourceUrl: string) {
  const out = { ...base };
  out._confidence = { ...(base?._confidence ?? {}) };
  for (const k of PROGRAM_FIELDS) {
    if (out[k] == null && extra?.[k] != null) {
      out[k] = extra[k];
      out._confidence[k] = (extra?._confidence?.[k] ?? 0.55);
      out[`_source_${k}`] = sourceUrl;
    }
  }
  return out;
}

async function ingestPdf(service: any, universityId: string, url: string) {
  // HEAD-ish check then download.
  const res = await fetch(url);
  if (!res.ok) return false;
  const ct = res.headers.get("content-type") ?? "";
  if (!/pdf/i.test(ct) && !/\.pdf/i.test(url)) return false;
  const buf = new Uint8Array(await res.arrayBuffer());
  if (buf.byteLength > 20 * 1024 * 1024) return false; // 20MB cap.
  const safeName = url.split("/").pop()?.replace(/[^a-z0-9._-]/gi, "_") ?? `doc-${Date.now()}.pdf`;
  const path = `${universityId}/${Date.now()}-${safeName}`;
  const { error } = await service.storage.from("program-documents").upload(path, buf, {
    contentType: "application/pdf", upsert: false,
  });
  if (error) throw error;
  return true;
}

async function failJob(service: any, jobId: string, err: string) {
  await service.from("scrape_jobs").update({
    status: "failed", finished_at: new Date().toISOString(), last_error: err,
  }).eq("id", jobId);
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status, headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
