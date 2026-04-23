
# Check: Firecrawl status

Firecrawl is still wired into the project. Here is the current state.

## Active integration points

**Edge functions (deployed, admin-only):**
- `firecrawl-scrape` — single URL scrape
- `firecrawl-map` — discover URLs on a domain
- `firecrawl-search` — web search
- `firecrawl-crawl` — full site crawl
- `scrape-programs-firecrawl` — discover + scrape program pages, AI extraction
- `scrape-program-details` — single program page extraction
- `scrape-university-website` — university facts extraction
- `firecrawl-map` and friends are all listed in `supabase/config.toml` with `verify_jwt = false` (auth is enforced inside each function via the admin role check).

**Client wrapper:**
- `src/lib/api/firecrawl.ts` exposes `firecrawlApi.scrape / search / map / crawl`.

**Admin UI surfaces using it:**
- `src/components/admin/ProgramScraper.tsx` — single-university scraping flow
- `src/components/admin/BulkProgramImporter.tsx` — multi-university bulk import
- Admin Programs page wires both into the admin console.

**Connector:**
- Project memory records the Firecrawl connection as **"University Assist Scrapper"**, providing the `FIRECRAWL_API_KEY` env var read by every edge function above.

## Health caveats to verify

There are two things I cannot confirm without running tools (read-only mode):
1. Whether the connector is still **linked** to this project (token present in env).
2. Whether the API key still has **credits** (Firecrawl returns HTTP 402 when exhausted).

## What I will do once approved

1. Run `list_connections` to confirm the Firecrawl connection is still linked.
2. Call `verify_credentials` against the gateway / hit `firecrawl-map` with a tiny test URL to confirm the key works and has credits.
3. Report back: linked / not linked, credits OK / depleted, and (if anything is broken) the exact remediation step — reconnect, top up, or re-link to the project.

No code changes are planned in this task — it is a status check only. If the check surfaces a problem (missing link, 401, or 402), I will then propose a follow-up fix.
