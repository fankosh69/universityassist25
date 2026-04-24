
# SEO + Conversion + UX Polish — Implementation Plan

This plan is organized into the three tracks you requested. I noted what already exists so we don't redo work, and called out where new files / refactors are needed.

---

## Track A — SEO & AI Discoverability (AIO)

### A1. Migrate to React Helmet Async (already installed) on dynamic pages
**Current state**
- `react-helmet-async` is wrapped via `HelmetProvider` in `App.tsx` ✅
- `SEOUniversityPage.tsx` and `SEOCityPage.tsx` already use `<Helmet>` properly ✅
- `ProgramDetail.tsx` and `CityDetail.tsx` use the **old imperative `SEOHead.tsx`** that mutates `document.head` directly (no `<link rel="alternate" hreflang>`, no Twitter image fallback to a real OG image, runs after first paint = bots may miss it)

**Changes**
1. Create `src/components/SEOProgramPage.tsx` (mirrors the Helmet pattern of `SEOUniversityPage.tsx`):
   - Title: `{Degree} {Program Name} at {University} | University Assist`
   - Description: real prose generated from `program.description` (trimmed) + degree, city, language, deadline, tuition.
   - Keywords: program name, field of study, degree, university, city, "study in Germany".
   - Canonical: `https://uniassist.net/universities/{uniSlug}/programs/{programSlug}`
   - `hreflang` alternates for `en`, `ar`, `de`, `x-default` via existing `getHrefLangTags()` from `src/lib/seo-helpers.ts`.
   - Open Graph: `og:type=article`, og:title, og:description, og:image (university hero or default brand image), og:locale, og:site_name.
   - Twitter Card: `summary_large_image` with same image.
2. Refactor `ProgramDetail.tsx` and `pages/programs/ProgramPage.tsx` to use the new `SEOProgramPage` instead of the imperative `SEOHead`.
3. Refactor `CityDetail.tsx` to use the existing `SEOCityPage.tsx` (it's already imported but the old `SEOHead` is also there — remove the duplicate).
4. Keep `SEOHead.tsx` only for the homepage and simple static pages (Auth, NotFound).

### A2. JSON-LD Structured Data per page type
**Current state**
- `JsonLd.tsx` exists with `organizationSchema`, `websiteSchema`, `createEducationalOrganizationSchema` ✅
- `src/lib/jsonld.ts` has `createCitySchema`, `createUniversitySchema`, `createProgramSchema`, `createBreadcrumbSchema`, `createAmbassadorSchema` ✅
- These are wired into `SEOUniversityPage` and `SEOCityPage` ✅
- `ProgramDetail.tsx` has a hand-rolled inline `Course` JSON-LD (incomplete — no provider URL, no breadcrumbs, no offer currency for free programs)

**Changes**
1. **Program page** — use `createProgramSchema()` from `lib/jsonld.ts` (already complete, includes `provider` as `CollegeOrUniversity`, `offers`, `timeRequired`, `inLanguage`) plus `createBreadcrumbSchema()`.
2. **University page** — already emits `CollegeOrUniversity` via `SEOUniversityPage.tsx` ✅. Verify the `hasOfferCatalog` is being populated when programs are passed in.
3. **City page** — already emits `Place` + `ItemList` via `SEOCityPage.tsx` ✅.
4. **FAQPage schema** — add it on:
   - `ProgramDetail.tsx`: an "About this program" FAQ with 4–6 auto-generated Q&A pairs from real fields (e.g., "What are the admission requirements for {program}?", "When is the application deadline?", "Is uni-assist required?", "What's the tuition?", "Which language is the program taught in?"). Skip a Q if data is missing.
   - `pages/Index.tsx`: a static FAQPage about the platform itself ("How does University Assist work?", "Is it free to use?", "Which countries can I apply to?", "What is uni-assist?"). Add a new `homepageFaqSchema` constant in `JsonLd.tsx`.
   - `pages/EligibilityChecker.tsx` (already admin-only — still helpful when admins demo it): FAQPage covering common eligibility questions.
5. Add a small helper `createFaqSchema(items: {q: string, a: string}[])` in `src/lib/jsonld.ts`.

### A3. Semantic HTML5 across landing surfaces
**Current state**
- `Index.tsx` already uses `<section>` for each band ✅, but the page is wrapped in a plain `<div>` instead of `<main>`, lacks `<header>` for the hero, lacks `<article>` wrappers around program/city cards, lacks a real `<footer>` element.
- Cities, Universities, Search pages have similar mixed semantic markup.

**Changes**
1. **`Index.tsx`**:
   - Wrap content under `<Navigation />` in `<main id="main-content" role="main">`.
   - Hero band: `<header>` with `<h1>` and supporting `<p>`.
   - Each program/city tile becomes `<article>` (with the `<h3>` already inside) — this is the LLM-friendly unit Google's NLU groups together.
   - Stats row: `<aside aria-label="Platform statistics">`.
   - Footer: convert wrapping `<div>` to `<footer role="contentinfo">` with `<nav aria-label="Footer">`.
   - Add a "Skip to main content" link for keyboard users at the top.
2. **`Universities.tsx`** and **`Cities.tsx`**: same `<main>` + `<article>` per card pattern.
3. **`ProgramDetail.tsx` / `programs/ProgramPage.tsx`**: wrap in `<main>`, breadcrumbs in `<nav aria-label="Breadcrumb">`, sidebar in `<aside aria-label="Program quick facts">`.
4. **`UniversityPage.tsx`**: `<main>` + each tab panel becomes `<section aria-labelledby="...">`.
5. **`CityDetail.tsx`**: `<main>`, university grid items become `<article>`.

### A4. Image alt tags + lazy loading
**Changes**
1. Audit all `<img>` and `next-image-style` usages and ensure:
   - Every image has a meaningful, content-derived `alt` (e.g., `alt={`${university.name} campus building in ${city.name}`}`) — no empty alts on content images, empty alt only for purely decorative.
   - Above-the-fold hero images: `loading="eager"` + `fetchPriority="high"` (Index hero is already correct ✅).
   - Below-the-fold images (program cards, city cards, university logos in lists, university hero photo, gallery thumbs): `loading="lazy"` + `decoding="async"`.
   - Add `width` and `height` attributes to prevent CLS where they're missing (city hero, university hero, photo gallery, ambassador photos).
2. Files to touch: `cities/CityCard.tsx`, `cities/UniversityCard.tsx`, `university/UniversityCard.tsx`, `university/UniversityHero.tsx`, `university/PhotoGallery.tsx`, `regions/RegionCard.tsx`, `regions/RegionHero.tsx`, `ambassadors/AmbassadorProfile.tsx`, plus the city/region hero images on detail pages.

---

## Track B — Conversion-Optimized User Journey

### B1. Hero "Quick Eligibility / Find Your Program" mini-form (Index.tsx)
**Design**
A compact, single-row form glassmorphism card sitting *over* the hero image, above the fold:

```
┌────────────────────────────────────────────────────────────┐
│  I want to study  [Bachelor ▾]  in  [Field of Study ▾]    │
│  taught in       [English ▾]   →  [ Find Programs → ]      │
└────────────────────────────────────────────────────────────┘
```

**Behavior**
- Three controls (degree level, field of study, language).
- Field of study options come from the existing `fields_of_study` Level-2 list (loaded once on mount).
- Submitting builds a query string and routes to `/search?level=master&field={slug}&lang=en`. `Search`/`EnhancedSearchContainer` already accepts URL filters — verify and extend if missing.
- Secondary link beneath: "Not sure? Check your eligibility →" → routes to `/eligibility-checker`.
- Keep the existing primary CTAs ("Start my journey" / "Browse programs") but move them below the mini-form so the form is the dominant action.

**Mobile**
Stacks vertically with full-width fields, sticky to bottom of hero, large 48px tap targets.

### B2. Sticky progress bar on OnboardingFlow
**Current state**
- Existing step indicator uses circles + a 0.5-px line, plus a "Step 2 of 4 / 50%" text row, but it is **not sticky** — it scrolls off when forms are long.

**Changes**
1. Refactor the step indicator section into a `<div className="sticky top-0 z-30 ...">` band that lives above the form card.
2. Add a real `<Progress value={progress} />` bar (using `components/ui/progress.tsx`) underneath the circles for an obvious horizontal fill.
3. Show "Step X of Y · Estimated 1 min left" copy.
4. Backdrop-blur background so it stays readable over scrolling content.
5. Respect `prefers-reduced-motion` (no animated transition on the fill).

### B3. Local-storage Watchlist for guests
**Current state**
- `WatchlistButton.tsx` requires auth and writes to Supabase. `ProgramCard.tsx` has its own `onSave` button that also requires auth.

**Changes**
1. New util `src/lib/guest-watchlist.ts`:
   - `getGuestWatchlist(): { programId: string; addedAt: string }[]`
   - `addToGuestWatchlist(programId)`, `removeFromGuestWatchlist(programId)`, `isInGuestWatchlist(programId)`
   - Stored under `localStorage["ua.guest.watchlist"]` (versioned key for future migration).
   - Cap at 50 entries to keep storage sane.
2. Update `WatchlistButton.tsx` and the save button inside `ProgramCard.tsx`/`UniversityCard.tsx` (cities + university folders both have UniversityCard variants — touch both):
   - If no `user`, write to localStorage and fire a `toast.success("Saved! Sign up to keep it forever.")` with a "Sign up" action button.
   - If `user`, keep current Supabase behavior **and** on first sign-in merge any existing local items into `saved_programs` then clear local storage.
3. Update `pages/SavedPrograms.tsx`:
   - If unauthenticated, show local-storage items in the same card layout, with a banner CTA "Sign up to sync your list across devices and get reminders."
   - On "Sign up" click → `/auth?tab=signup&redirect=/saved-programs` and the merge runs after successful login.
4. Update `Navigation.tsx` to show the heart-with-count chip even for guests when `getGuestWatchlist().length > 0`.

### B4. Mobile sticky CTA on ProgramDetail
**Changes**
1. Add a bottom-fixed bar visible only `md:hidden` on `ProgramDetail.tsx` and `programs/ProgramPage.tsx`:
```
┌────────────────────────────────────────┐
│ [♡ Save]   [ Check Eligibility ]   [ Apply Now ]
└────────────────────────────────────────┘
```
2. Logic:
   - Save button → reuses watchlist toggle (B3).
   - Check Eligibility → `/eligibility-checker?program={programId}`.
   - Apply Now → if `program.program_url` exists, opens in new tab; otherwise opens the `ConsultationModal` already on the page.
3. Add `pb-24 md:pb-0` to the page container so content isn't hidden behind the bar.
4. Use `safe-area-inset-bottom` padding for iOS notch.

---

## Track C — UX/UI & Perceived Performance

### C1. Skeleton UI replaces generic spinners
**Current state**
- `LoadingSpinner.tsx` (animated graduation cap) is used in `ProgramDetail.tsx`, `CityDetail.tsx`, `Universities.tsx`, `Cities.tsx`, `SavedPrograms.tsx`, etc.
- `LoadingScreen.tsx` is used in `UniversityPage.tsx`.
- `ResultsPanel.tsx` already has a partial skeleton pattern in `EnhancedSearchContainer.tsx` but the inner panel doesn't.
- `components/ui/skeleton.tsx` already exists ✅.

**Changes — create per-layout skeleton components**
1. `src/components/skeletons/ProgramDetailSkeleton.tsx` — mirrors hero (title + breadcrumb + badges) + 2-column grid (overview card, requirements card) + sidebar (sticky facts).
2. `src/components/skeletons/UniversityPageSkeleton.tsx` — hero banner block, stats row of 4 cards, tab strip, content blocks.
3. `src/components/skeletons/CityDetailSkeleton.tsx` — hero with map placeholder + university grid placeholders.
4. `src/components/skeletons/ProgramCardSkeleton.tsx` — already inline in `EnhancedSearchContainer`; extract for reuse, then render in `ResultsPanel.tsx` when `programs === null` or a new `loading` prop is passed.
5. `src/components/skeletons/CardGridSkeleton.tsx` — generic 6-card grid for Universities/Cities pages.
6. Replace `LoadingSpinner` calls in: `ProgramDetail.tsx`, `programs/ProgramPage.tsx`, `CityDetail.tsx`, `cities/CityPage.tsx`, `universities/UniversityPage.tsx` (replace `LoadingScreen`), `Universities.tsx`, `Cities.tsx`, `SavedPrograms.tsx`.
7. Keep `LoadingSpinner.tsx` only for inline button-spinner cases and the initial `App.tsx` Suspense fallback.

All skeletons use `animate-pulse` (already in `Skeleton`) and respect `prefers-reduced-motion` (Tailwind's `motion-reduce:animate-none`).

### C2. Mobile responsiveness & 44×44 touch targets audit
**Changes**
1. Add a global utility class `.tap-target` in `index.css`:
```css
@layer utilities {
  .tap-target { @apply min-h-[44px] min-w-[44px]; }
}
```
2. Audit and apply to:
   - Icon-only buttons in `Navigation.tsx` (mobile menu, language switcher, profile dropdown trigger).
   - Save heart in `ProgramCard.tsx` (currently `h-8 w-8` — bump to 44px on mobile via `h-11 w-11 md:h-8 md:w-8`).
   - Filter chips and pagination dots in `EnhancedSearchContainer.tsx`.
   - Step circles in `OnboardingFlow.tsx` (currently 36px).
   - Close `X` buttons in dialogs (`Dialog`, `Drawer`, `Sheet`) — verify Radix defaults already pass.
   - Form fields: ensure `h-11` not `h-9` on mobile (`Input`, `Select`) — wrap small variants with `md:` prefixes.
3. Verify spacing between adjacent tappable elements ≥ 8px (WCAG 2.5.8).

### C3. Smooth route + hover transitions
**Changes**
1. Wrap routed content in `App.tsx` with a tiny `<RouteTransition>` component using `framer-motion` (already a dep): fade + 8px y-translate on `key={location.pathname}`, 200ms.
2. Add `transition-all duration-300 ease-in-out` (or the existing `transition-shadow duration-300` where used) to all interactive cards: `ProgramCard`, `cities/CityCard`, `cities/UniversityCard`, `university/UniversityCard`, `regions/RegionCard`, `ambassador list cards`.
3. For all primary buttons add `transition-transform` + `hover:-translate-y-0.5 active:translate-y-0` so tactile feedback is consistent.
4. Honor `prefers-reduced-motion` via the existing Tailwind variant — wrap motion classes with `motion-safe:`.

### C4. WCAG 2.1 AA compliance
**Changes**
1. **Contrast**: audit primary `#2E57F6` on white backgrounds and on `--gradient-hero`. The current text-on-gradient white passes, but verify `text-muted-foreground` on `bg-muted/30` — bump from current value if it falls below 4.5:1 by tightening the muted-foreground HSL by ~10% lightness.
2. **aria-labels** on icon-only controls:
   - All `<Button size="icon">` instances (Navigation hamburger, share, close, save heart, theme toggle if any) — search and add.
   - Carousel chevrons in `TestimonialsCarousel`, `PhotoGallery`.
   - Language switcher trigger.
3. **Landmarks**: add `aria-label` to every `<nav>` and `<aside>` introduced in A3.
4. **Forms**: verify every `Input`/`Select` in onboarding, search, profile has an associated `<Label>` (most do via shadcn `Form` ✅) — patch any orphan inputs in `EnhancedSearchContainer` filter sidebar.
5. **Keyboard**: ensure the new sticky mobile CTA bar (B4) is reachable in tab order and not trapped.
6. **Focus styles**: `index.css` already exposes `focus-visible:ring-2 focus-visible:ring-ring` via shadcn — verify the new mini-form, sticky bar, and skeleton-replaced sections preserve those rings.

---

## Files to be created
- `src/components/SEOProgramPage.tsx`
- `src/components/skeletons/ProgramDetailSkeleton.tsx`
- `src/components/skeletons/UniversityPageSkeleton.tsx`
- `src/components/skeletons/CityDetailSkeleton.tsx`
- `src/components/skeletons/ProgramCardSkeleton.tsx`
- `src/components/skeletons/CardGridSkeleton.tsx`
- `src/components/HeroQuickFinder.tsx` (the mini-form for B1)
- `src/components/MobileStickyCTA.tsx` (the bottom bar for B4)
- `src/components/RouteTransition.tsx` (C3)
- `src/lib/guest-watchlist.ts` (B3)

## Files to be modified
- `src/App.tsx` — wrap routes in `RouteTransition`, add skip-link target.
- `src/pages/Index.tsx` — semantic refactor, hero mini-form, FAQPage JSON-LD, `<main>`/`<article>`/`<footer>`.
- `src/pages/ProgramDetail.tsx` and `src/pages/programs/ProgramPage.tsx` — Helmet SEO, FAQPage + breadcrumb JSON-LD, semantic landmarks, skeleton, mobile sticky CTA.
- `src/pages/CityDetail.tsx` and `src/pages/cities/CityPage.tsx` — switch to `SEOCityPage` only, semantic landmarks, skeleton.
- `src/pages/universities/UniversityPage.tsx` — semantic landmarks, swap `LoadingScreen` for `UniversityPageSkeleton`.
- `src/pages/Universities.tsx`, `src/pages/Cities.tsx`, `src/pages/SavedPrograms.tsx` — `<main>`/`<article>`, swap to skeletons, support guest watchlist on SavedPrograms.
- `src/pages/onboarding/OnboardingFlow.tsx` — sticky progress bar with shadcn `Progress`.
- `src/components/SEOHead.tsx` — keep but mark as legacy/simple-pages helper (no behavior change).
- `src/components/JsonLd.tsx` — add `homepageFaqSchema`.
- `src/lib/jsonld.ts` — add `createFaqSchema` helper.
- `src/components/Navigation.tsx` — guest watchlist count chip, ensure all icon buttons have `aria-label`, ensure 44px tap targets.
- `src/components/WatchlistButton.tsx`, `src/components/search/ProgramCard.tsx`, `src/components/cities/UniversityCard.tsx`, `src/components/university/UniversityCard.tsx`, `src/components/cities/CityCard.tsx` — guest-watchlist support, alt-text + lazy loading audit, transitions, tap targets.
- `src/components/search/ResultsPanel.tsx` — add `loading` prop and render `ProgramCardSkeleton` grid.
- `src/index.css` — add `.tap-target` utility, verify focus-ring tokens.

## Out of scope (call out)
- No changes to data model, RLS, or edge functions — purely frontend/SEO.
- Mailchimp/SendGrid/WhatsApp wiring not touched.
- I will not add server-side rendering. JSON-LD + Helmet on the client is what we have today; Google and modern AI crawlers (GPTBot, PerplexityBot, ClaudeBot) execute JS, so this remains effective. (If you want true SSR for SEO later, that is a separate Next.js migration ticket.)

## Verification I'll run after implementation
- `view-source:` of the homepage and a program page → confirm Helmet tags + JSON-LD render.
- Lighthouse pass (run via browser tools) for homepage + program page → target ≥ 90 on SEO and Accessibility, ≥ 85 on Best Practices.
- Mobile viewport (390×844) walkthrough → confirm sticky onboarding bar, sticky program CTA, hero mini-form, and 44px tap targets.
- Guest watchlist → add → refresh → verify persists; sign up → verify merge into Supabase.
