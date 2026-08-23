---
name: live-scraping-framework
description: Build, extend, debug, or reuse the Firecrawl-based live program-data scraping framework (scrape profiles, jobs, runs, diffs, budget, admin review queue) in this project. Use when working on university/program scraping, discovery, PDF ingestion, the diff review queue, cron scheduling, or Firecrawl credit budgeting.
---

# Live Scraping Framework

A per-university, budget-aware, human-in-the-loop pipeline that keeps program data fresh from university websites using Firecrawl + Lovable AI extraction.

## Architecture at a glance

```text
pg_cron (nightly)  -> scrape-orchestrator  -> enqueues scrape_jobs from due profiles
pg_cron (every 5m) -> scrape-queue-drain   -> pops pending jobs, invokes worker
                       scrape-university   -> 3 passes -> scrape_diffs (pending)
Admin review UI    -> accept/reject diffs  -> writes to programs / publishes drafts
```

Never let the worker write directly to published program fields. Every change lands in `scrape_diffs` with `status='pending'` until an admin accepts it. New programs are the one exception: they are inserted as `status='draft'` plus a `__new_program__` diff, and publishing happens on accept.

## Data model (public schema)

| Table | Role |
| --- | --- |
| `university_scrape_profiles` | Per-university strategy: `base_urls`, `program_url_patterns`, `exclude_patterns`, `discovery_method`, `max_depth`, `max_pages`, `pdf_link_patterns`, `selectors_hint` (jsonb, supports `discovery_search` hints), `cadence`, `next_run_at`, `health_score`. One row per university. |
| `scrape_jobs` | Queue: `status` pending/running/done/failed, `priority`, `attempt_count`, `last_error`. |
| `scrape_runs` | History per execution: `pages_crawled`, `pdfs_ingested`, `credits_used`, `diffs_created`, `errors`. |
| `scrape_diffs` | Proposed field change: `field_path`, `old_value`, `new_value`, `confidence`, `source_url`, `source_kind`, `status`. |
| `program_field_sources` | Provenance per `(program_id, field_path)`: source URL, confidence, `last_verified_at`, `content_hash`. |
| `scrape_budget` | Single-row (`id = true`) ceiling: `monthly_credit_ceiling`, `current_month_used`, `paused`. |

`programs.last_verified_at` drives the public "Verified {date}" badge.

All tables are admin-only via RLS; edge functions use the service role. Any new table here needs `GRANT`s before `ENABLE ROW LEVEL SECURITY` + policies.

## Edge functions

- `supabase/functions/scrape-orchestrator/index.ts` — selects enabled profiles where `next_run_at <= now()`, respects `scrape_budget.paused` and the ceiling, inserts jobs, advances `next_run_at` by cadence.
- `supabase/functions/scrape-queue-drain/index.ts` — pops a small batch of pending jobs and invokes the worker per job. Keep the batch small; each worker invocation is its own wall-clock budget.
- `supabase/functions/scrape-university/index.ts` — the worker. Three passes:
  1. **Discover** — Firecrawl `/v2/map` on `base_urls`, filtered by `program_url_patterns` / `exclude_patterns`; `selectors_hint.discovery_search` narrows results on very large sites.
  2. **Surface extract** — Firecrawl `/v2/scrape` (markdown) per candidate URL, then Lovable AI Gateway with the strict-JSON `EXTRACT_PROMPT`. The LLM must return `_confidence` per field and omit unknown fields rather than guess.
  3. **Gap chase + PDFs** — for fields still missing, follow links matching `pdf_link_patterns`, scrape the PDF, re-extract, and store the file in the private `program-documents` bucket; set `admission_regulations_url` / `module_description_url` / `program_flyer_url`.

Every extracted value is compared to the current DB row; only real changes become diffs.

## Non-negotiable invariants

1. **Auth**: every scrape function starts with `requireCronOrAdmin(req)` from `supabase/functions/_shared/auth.ts`. Cron calls pass `x-cron-secret` (vault secret `CRON_SECRET`).
2. **Timeouts**: wrap every outbound call in `AbortSignal.timeout` — 45s Firecrawl, 30s LLM, 20s PDF — and enforce a `WALL_BUDGET_MS = 110_000` guard so the function finishes and records the run instead of dying silently.
3. **Budget**: increment `scrape_budget.current_month_used` with actual credits; the orchestrator must refuse to enqueue when over ceiling or `paused`.
4. **Idempotence**: use `content_hash` in `program_field_sources` to skip unchanged pages.
5. **Firecrawl mode**: this project's connection is direct-API (`fc-` key) — `Authorization: Bearer ${FIRECRAWL_API_KEY}` against `https://api.firecrawl.dev/v2`. Do not use the connector gateway headers here.
6. **Slugs**: new programs get slugs from the `trg_ensure_program_slug` trigger — never insert a program without letting that trigger run, or the detail route 404s.

## Admin surface

- `src/lib/api/scrape-framework.ts` — client API: list/upsert profiles, enqueue jobs, list runs, `acceptDiff` / `rejectDiff` (accept also publishes `__new_program__` drafts and stamps `last_verified_at`).
- `src/pages/admin/AdminScrapeProfiles.tsx` — per-university strategy editor.
- `src/pages/admin/AdminScrapeReview.tsx` — diff queue with old/new comparison and `NewProgramPreview` card.
- `src/pages/admin/AdminLiveData.tsx` — runs, credits, freshness dashboard.

Routes are registered in `src/App.tsx` and `src/components/admin/AdminSidebar.tsx`.

## Onboarding a new university

1. Create a `university_scrape_profiles` row with `base_urls` = the program catalog URL(s), not the homepage.
2. Set `program_url_patterns` from 2–3 real program URLs on that site; add `exclude_patterns` for news/events/staff paths.
3. Run a dry pilot: invoke `scrape-university` with `{ universityId, dryRun: true }` and read the resulting `scrape_runs` row.
4. Tune `max_pages`, `discovery_search`, and `pdf_link_patterns` until discovery precision is good, then enable the profile.

## Credit budgeting rule of thumb

Discovery ≈ 1 credit per mapped site; refresh ≈ 6 credits per program (surface + gap chase + PDFs). ~2,500 programs ≈ 5–6k credits for the initial fill, ~20k/month on a monthly cadence, ~75k/month weekly. Set `monthly_credit_ceiling` accordingly and leave `paused` as the emergency stop.

## Debugging checklist

- No jobs created → profile `enabled`, `next_run_at`, or budget paused.
- Job runs but zero diffs → discovery returned nothing (check `scrape_runs.summary.candidate_urls`) or values already match.
- Silent failure → check for the wall-clock guard entry in `scrape_runs.errors`; shrink `max_pages`.
- 401 from a cron-triggered run → `CRON_SECRET` mismatch between the vault and the `pg_cron` job header.
