# Live Program Data Extraction Framework (Firecrawl)

Goal: keep program data on each university page fresh automatically — no manual updates — by crawling each university's website with a strategy tuned to its structure, following sub-pages, ingesting linked PDFs, and surfacing freshness + gaps in the admin UI.

## 1. Canonical data points to extract

For every program these are the "showcase" fields the crawler targets (already used across `scrape-programs-firecrawl` and the program detail page):

- Identity: program name, degree type, language of instruction, faculty/department
- Field of study (auto-matched to internal hierarchy)
- Duration, credit points (ECTS / Total Credit Points), start intakes
- Tuition / semester fees, application fees
- Application deadlines (winter / summer), Uni-Assist flag
- Admission requirements: GPA threshold, language certs (DE/EN), prior degree(s), required documents
- Curriculum / modules summary
- Program URL, contact, brochure / module handbook / admission regulation PDFs
- Last-seen timestamp + source URL per field

## 2. Architecture overview

```text
 ┌─────────────────────────────┐
 │ Admin: Crawl Console        │  trigger / monitor / approve diffs
 └──────────────┬──────────────┘
                │
                ▼
 ┌─────────────────────────────┐    pg_cron (nightly / weekly)
 │ orchestrator edge fn        │◄───────────────────────────────┐
 │  scrape-orchestrator        │                                │
 └──────────────┬──────────────┘                                │
                │ enqueues jobs per university                   │
                ▼                                                │
 ┌─────────────────────────────┐                                │
 │ scrape_jobs (DB queue)      │                                │
 └──────────────┬──────────────┘                                │
                │ worker pulls due jobs                          │
                ▼                                                │
 ┌─────────────────────────────────────────────────────────────┐│
 │ scrape-university (per-uni worker)                           ││
 │  1. load UniversityScrapeProfile (strategy)                  ││
 │  2. Firecrawl MAP → candidate program URLs                   ││
 │  3. Firecrawl CRAWL/SCRAPE with depth + path filters         ││
 │  4. Follow redirects, detect data gaps, re-query             ││
 │  5. Ingest linked PDFs (admission regs, module handbook)     ││
 │  6. LLM (Lovable AI) extract → canonical schema              ││
 │  7. Diff vs current row → write to scrape_runs + staging     ││
 └──────────────┬──────────────────────────────────────────────┘│
                │                                                │
                ▼                                                │
 ┌─────────────────────────────┐    auto-publish low-risk        │
 │ scrape_diffs (staging)      │───► programs / program_documents┘
 │                             │    high-risk → admin review
 └─────────────────────────────┘
```

## 3. Per-university strategy (the "different per site" requirement)

A new table `university_scrape_profiles` stores a strategy per university so the crawler adapts to each site structure:

- `base_urls[]` — program catalog roots (e.g. `/en/study/programs`)
- `program_url_patterns[]` / `exclude_patterns[]` — regex/glob for Firecrawl `includePaths` / `excludePaths`
- `language_mode` — English / German / Hybrid / Bilingual / Auto (reuses existing language-aware discovery memory)
- `max_depth`, `max_pages`, `wait_for_ms`
- `discovery_method` — `map` | `crawl` | `search` | `sitemap-only`
- `selectors_hint` — optional CSS / JSON-LD hints for non-standard sites
- `pdf_link_patterns[]` — e.g. `/admission.*\.pdf`, `module-handbook`, `Studienordnung`
- `extraction_prompt_overrides` — per-uni LLM prompt tweaks
- `cadence` — `daily` | `weekly` | `monthly`
- `last_run_at`, `last_success_at`, `health_score`

Admins manage these via a new **Admin → Scraping Profiles** page. Sensible defaults are auto-generated on first run by inspecting sitemap + `og:` metadata.

## 4. Deep crawling + gap chasing

Per program URL the worker runs a 3-pass pipeline:

1. **Surface scrape** — Firecrawl `scrape` (`formats: markdown, links, json`) with a JSON schema for the canonical fields.
2. **Gap detection** — after LLM extraction, compare against the required-field checklist. For each missing field, score candidate sub-page links (admission, requirements, fees, deadlines, downloads) using URL + anchor heuristics + embeddings.
3. **Targeted follow-up** — Firecrawl `scrape` on the top N candidates and merge results, preferring the field's most authoritative source (e.g. fees from `/tuition`, not the program homepage). Up to `max_depth` hops, with redirect chains resolved and recorded.

All resolved URLs are stored per field in `program_field_sources` so we can show "where did this value come from" and re-verify only the changed sub-pages on later runs.

## 5. File ingestion (PDFs etc.)

- During crawl, collect every linked file matching `pdf_link_patterns` or with `.pdf/.docx` extensions.
- Download via `firecrawl-scrape` (`formats: rawHtml` fallback) or direct fetch from the worker; store in Supabase Storage bucket `program-documents` (private, signed URLs via existing `SignedDocumentLink`).
- Classify (admission regulations, module handbook, fact sheet, application form) with the LLM.
- Attach to `program_documents` rows on the program — these already render in the existing program documents section.
- For admission regulations, additionally run a structured extraction pass (GPA, deadlines, language) and feed those values into the gap-chasing merge above with lower confidence weight than the official program page.

## 6. Change detection & safe publishing

- `scrape_runs` records each run (status, pages crawled, credits used, errors).
- `scrape_diffs` records field-level before/after with a confidence score.
- Auto-publish rules:
  - Confidence ≥ 0.9 **and** field is "soft" (description, modules, document list) → write straight to `programs` / `program_documents`.
  - Otherwise → queue in admin review with side-by-side diff and one-click accept/reject/bulk-accept-per-university.
- Every published change updates `programs.last_verified_at`; the program page shows a subtle "Verified {relativeTime}" badge.

## 7. Scheduling

- `pg_cron` job hits `scrape-orchestrator` nightly. It selects universities whose `next_run_at <= now()` based on their cadence and enqueues `scrape_jobs`.
- A second cron drains the queue at a throttled rate (Firecrawl credit-aware: stop when monthly budget hits configured threshold; surface a banner in admin).
- Manual triggers from the admin UI (single university, single program, "re-verify all stale > 30d").

## 8. Live data visualization (Admin)

New **Admin → Live Data** dashboard:

- Per-university cards: last run, freshness %, pages crawled, errors, credit usage sparkline.
- Pending diffs queue with filters (university, field, confidence).
- Per-program "lineage" drawer: each field → source URL, last verified, history.
- Health alerts: site structure change detected (sudden ≥ 30% field-loss → auto-pause + notify).

On public program pages, add a small "Last updated {date}" line and, for premium trust, a tooltip linking to the source URL.

## 9. Reusing what already exists

- Keep current `firecrawl-scrape/map/crawl/search` proxies (admin-auth, SSRF-safe) as-is.
- Refactor `scrape-programs-firecrawl` into the new `scrape-university` worker; the existing 4-step Firecrawl + Gemini extraction (per memory) becomes pass 1 of the new pipeline.
- Reuse `match-field-of-study`, `auto-create-field-of-study`, `translate-content`, and the existing private documents bucket pattern.

## 10. Build phases

1. **Schema + profiles UI** — new tables (`university_scrape_profiles`, `scrape_jobs`, `scrape_runs`, `scrape_diffs`, `program_field_sources`); Admin Scraping Profiles page.
2. **Worker rewrite** — `scrape-university` with 3-pass deep crawl + gap chasing + per-field source tracking.
3. **PDF ingestion** — storage bucket, classifier, link to `program_documents`, structured extraction from admission regulations.
4. **Diff + publish pipeline** — staging table, auto-publish rules, admin review queue with side-by-side diffs.
5. **Scheduler + budget guard** — pg_cron orchestrator, cadence per university, Firecrawl credit metering.
6. **Live Data dashboard + freshness badges** on program pages.

## Technical notes

- All Firecrawl calls stay server-side; reuse the existing admin-auth + `isSafeUrl` guards.
- LLM extraction goes through the Lovable AI Gateway (Gemini), reusing the prompt patterns already memorialized for the scraper (language-aware discovery, German→English translation).
- New tables get RLS: admin-only write; reads restricted to admin/sales/admissions per existing role memory.
- No service-role keys on the client; signed URLs only for PDFs.
- Performance budget: per-university run capped (max_pages, timeout, credit budget) so a misconfigured profile cannot drain Firecrawl credits.  
  
We can also create a skill out of this, that identifys this framework and work with it accordingly, if there are any paid third party tools that should be included, outline which, why, and how much.
  &nbsp;