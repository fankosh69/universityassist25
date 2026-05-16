## Goal

Spin up an automated content engine that produces 7 SEO + AEO-optimized articles per week as **drafts** sitting in an admin review queue. You (or an editor) approve/edit/publish from `/admin/blog`. Published posts render at `/blog` and `/<slug>` using the same template the legacy blog posts use today.

## Architecture

```text
[ pg_cron: daily 06:00 UTC ]
            │
            ▼
[ edge fn: blog-topic-discovery ]──► Semrush API (gap & keyword research)
            │  writes rows to
            ▼
   blog_topic_candidates (status=proposed)
            │
            ▼
[ edge fn: blog-draft-generator ]──► Lovable AI Gateway (Gemini 2.5 Pro)
            │  writes rows to
            ▼
        blog_posts (status=draft)
            │
            ▼
   /admin/blog ──edit──► publish (status=published)
            │
            ▼
   /blog index + /<slug> pages (DB-driven)
```

## What gets built

### 1. Database (Supabase migration)

- `blog_topic_candidates` — keyword, est_volume, kdi, source (`semrush_gap` | `manual`), competitor_url, status (`proposed` | `selected` | `rejected` | `drafted`), created_at.
- `blog_posts` — slug, title, meta_title, meta_description, h1, intro, sections (jsonb), faqs (jsonb), related_links (jsonb), primary_cta (jsonb), keyword, category, reading_minutes, status (`draft` | `published` | `archived`), source_candidate_id, ai_model, ai_prompt_version, created_at, updated_at, published_at, author_id.
- RLS: public can `select` where `status = 'published'`; admins full access (uses existing `has_role` pattern).

### 2. Edge functions (3 new)

- **`blog-topic-discovery`** (daily cron): calls Semrush `domain_organic_organic` (gap) for `uniassist.net` vs 2–3 competitors (`studying-in-germany.org`, `daad.de`, `mastersportal.com`), filters out keywords already covered by existing posts/landing pages, scores by `volume / (kdi + 10)`, inserts top 5 as `proposed`.
- **`blog-draft-generator`** (daily cron, runs 30 min later): picks oldest `proposed` row, calls Lovable AI Gateway with a structured prompt that returns JSON matching the `blog_posts` shape. Prompt enforces SEO + **AEO** (Answer Engine Optimization) rules: question-style H2s, 40–60 word direct answers under each H2, FAQ block (5 Q&A), TL;DR summary, internal links to `/search`, `/cities`, `/universities`, `/eligibility-checker`, schema-ready FAQ + Article JSON-LD. Generates 7 posts per week (1/day) — adjustable in the cron schedule.
- **`blog-publish`** (called from admin UI, not cron): flips status to `published`, sets `published_at`, kicks the sitemap regeneration script via a build hook trigger note (or simply: sitemap is regenerated on every deploy via existing `prebuild`).

### 3. Admin UI — `/admin/blog`

- Table of drafts with title, keyword, est. volume, KDI, created date, status.
- Row click → editor page: title, meta, slug, full markdown editor for sections, FAQ editor, related links, primary CTA. Pre-filled from AI output.
- Buttons: **Save draft**, **Reject** (archives), **Publish**, **Regenerate** (re-runs AI with a feedback note).
- Topic candidates tab: see Semrush-proposed keywords, manually trigger draft generation for any one, or add a manual topic.

### 4. Public rendering migration

- New page `src/pages/blog/BlogPost.tsx` reads from `blog_posts` table by slug (replaces hard-coded `legacy-blog-posts.ts` lookup over time).
- Existing 9 hard-coded posts stay as fallback; new posts come from DB. `BlogIndex` merges both sources, sorted by `published_at`.
- Each post renders Article + FAQPage + BreadcrumbList JSON-LD (AEO essentials).
- Sitemap generator (`scripts/generate-sitemap.ts`) fetches all `status='published'` posts and adds them to `sitemap-static.xml` on each build.

### 5. Cron wiring

- Enable `pg_cron` + `pg_net` extensions.
- `cron.schedule('blog-discover', '0 6 * * *', …)` calls `blog-topic-discovery`.
- `cron.schedule('blog-draft', '30 6 * * *', …)` calls `blog-draft-generator`.

## Secrets required

- **`SEMRUSH_API_KEY`** — needs a paid Semrush API plan ($449/mo Standard or higher; the Semrush tool I use in chat is not the production API). I'll prompt you for this after you approve the plan.
- **`LOVABLE_API_KEY`** — already configured.

If you don't want to pay for Semrush API, the fallback is: I provide a similar discovery flow using **Google Search Console** (free, via the existing Google connector pattern) + **Firecrawl** (already connected) scraping competitor sitemaps for keyword-rich URLs. Slightly lower precision but $0 incremental cost. Just say which path.

## AEO specifics (what makes this different from generic AI blogs)

Each article ships with:
1. **TL;DR** in the first 80 words (Perplexity / ChatGPT cite this block).
2. **Question-style H2s** matching real "People Also Ask" phrasing.
3. **Direct 40–60 word answers** immediately under each H2 — what answer engines extract verbatim.
4. **FAQ JSON-LD** block with 5 Q&As.
5. **Article + Author + Publisher JSON-LD** with `dateModified` always = today.
6. **Concrete numbers and citations** (tuition €, deadlines, ECTS counts) pulled from your own DB to make answers verifiable.
7. **Internal links** to converting pages (`/search`, `/eligibility-checker`) — every article funnels back.

## What stays manual

- Initial topic strategy (you can override candidates).
- Final publish click (no auto-publish, per your choice).
- Hero images (skipped by default; can add an imagegen step later).

## Out of scope for v1

- Multi-language (en/ar/de) — current pipeline is EN only; AR/DE translation can be added as a follow-up edge function.
- Auto-republish/refresh of stale posts.
- Newsletter distribution.

## Open question before I build

**Semrush API ($449+/mo) vs free Google Search Console + Firecrawl fallback** — which discovery source do you want? Reply with "Semrush" or "GSC fallback" and I'll start building.
