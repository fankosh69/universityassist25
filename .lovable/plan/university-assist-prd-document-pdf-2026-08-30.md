# University Assist — PRD Document (PDF)

Produce a branded PDF Product Requirements Document describing University Assist as it exists today, plus the roadmap of planned work. Balanced depth: product-facing narrative with a technical appendix.

## Deliverable

A single PDF written to `/mnt/documents/university-assist-prd.pdf`, styled with brand colors (primary #2E57F6, secondary #5DC6C5, accent #63D581), the University Assist logo on the cover, page numbers, and a table of contents.

## Document outline

1. Cover page — product name, tagline ("Your way to Germany"), version, date
2. Table of contents
3. Executive summary — what the product is, who it serves, current status
4. Goals and success measures
5. Personas and roles — student, parent, counselor, university staff, sales, admissions, marketing, admin
6. Information architecture — regions → cities → universities → programs, plus blog, landing pages, ambassadors
7. Feature specification (as-built), each with purpose, user flow, and current state:
   - Discovery and search (search, filters, city/region/university/program pages, maps)
   - Eligibility checker and Modified Bavarian GPA conversion
   - Admissions Requirements Navigator (curriculum rules engine)
   - Onboarding flow (gamified multi-step, minor/parent consent)
   - Student profile, academics, documents, language certificates
   - Watchlist / saved programs, shortlists and PDF export
   - AI assistant and AI-assisted profile updates
   - Live Data Extraction framework (Firecrawl scraping, review queue, freshness badges)
   - Admin console (universities, programs, cities, regions, blog, users, security, sitemap, scrape profiles/review, live data)
   - Sales and admissions dashboards, program inquiries, consultation requests
   - HubSpot CRM sync, branded transactional email
   - SEO layer (sitemaps, hreflang, JSON-LD, llms.txt)
8. Roadmap — planned/unfinished work, phased:
   - Ambassador program (arrival detection → consent → publish)
   - Document OCR and ECTS extraction at scale
   - Deadline planner, reminders, ICS export
   - Paid application packages, application tracker, AI Quick Apply
   - Admitted-student logistics (visa, housing, banking, insurance)
   - Mobile app (Capacitor/React Native)
   - Full AR/DE localization and RTL coverage
9. Non-goals and constraints — Germany-only MVP, EN/AR/DE only, no background GPS, consent gates, uni-assist e.V. disclaimer
10. Technical appendix
    - Stack as actually built (React 18 + Vite + TypeScript + Tailwind + shadcn, Supabase Postgres/Auth/Storage/Edge Functions, Firecrawl, Lovable AI/Gemini, HubSpot, Resend, Mapbox)
    - Data model summary — core tables and relationships
    - Roles and access control — `user_roles` + `has_role()` security-definer pattern, RLS, PII isolation via `private_profile_data`
    - Edge functions inventory (~39) grouped by purpose
    - Scheduled jobs (pg_cron: scrape orchestrator, queue drain) and secrets
    - Security posture — private buckets, cron secret gating, admin-only endpoints
11. Open questions and assumptions

## How it will be built

- Read the live database schema and RLS/roles configuration so the data-model and access-control sections describe reality, not assumptions.
- Read the routes in `src/App.tsx`, the admin sidebar, and the edge-function directory to build an accurate feature and endpoint inventory.
- Generate the PDF with ReportLab (Platypus) using a DejaVu Sans registration for clean typography, brand-colored headings, and styled tables.
- QA: render every page to images and inspect for clipped text, overflowing tables, bad spacing, or missing assets; fix and re-render until clean.

The PDF is a one-off document artifact — no application code changes.
