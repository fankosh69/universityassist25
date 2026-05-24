## Pilot scrape plan

Goal: validate the full pipeline (scraping profile → Firecrawl discovery → per-program deep scrape → AI extraction → diff review → publish to `programs`) on a single, well-behaved university before unleashing the orchestrator on all ~2,000.

### 1. Pick the pilot university
Recommend **Heinrich Heine University Düsseldorf** (`hhu.de`) — clean site, well-structured program catalog in EN/DE, manageable size. If you'd prefer a different one (e.g. TU Munich, RWTH Aachen), say so.

### 2. Create a scraping profile (no code, via `/admin/scrape-profiles`)
- University: HHU Düsseldorf
- Base URL: `https://www.hhu.de/en/studies/before-you-start-studying/degree-programmes-from-a-to-z`
- Discovery method: `map` (Firecrawl URL discovery)
- Language mode: `hybrid` (EN preferred, DE fallback)
- Max pages: **15** (capped low for the pilot to limit credit burn)
- Max depth: 2
- Cadence: `monthly`
- Program URL patterns: regex matching program detail pages
- PDF link patterns: defaults (admission, module, handbook, regulation)
- Enabled: on

### 3. Run a dry-run first
Trigger `scrape-university` with `dryRun: true` to:
- Verify Firecrawl discovery returns sensible program URLs
- Verify the LLM extraction returns valid JSON
- Confirm no DB writes happen
- Check Firecrawl credit usage (~15–20 credits expected)

### 4. Review proposed diffs
Open `/admin/scrape-review` to inspect the proposed program rows + per-field confidence scores. Spot-check 2–3 programs against the live HHU pages for accuracy (name, degree, language, deadlines, tuition, ECTS).

### 5. Run for real, then verify
- Re-run `scrape-university` (no dryRun) to apply diffs.
- Verify in DB: count of new/updated `programs` rows for HHU, and that `scrape_jobs` shows status=`completed`.
- Check `/admin/live-data` for the freshness indicator.

### 6. Sign-off criteria
- ≥10 programs ingested with valid `name`, `degree_level`, `language_of_instruction`
- ≥70% have a deadline month/day populated
- Zero edge function errors in logs
- Firecrawl credits used < 25

If all green, we're ready to enable more profiles. If any step fails, I'll diagnose from edge function logs + Firecrawl response shapes and patch the orchestrator/extractor before scaling.

### Open questions
1. Pilot university — HHU OK, or pick another?
2. Should I cap at 15 pages, or go fuller (~50) to get a more representative sample at the cost of more credits?