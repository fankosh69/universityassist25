## 1. Redesigned `/blog` index

Inspired by the study-in-germany.com community page, but on-brand (Primary #2E57F6, Poppins/Ubuntu, rounded-2xl, soft shadows).

**Structure:**
- **Hero band** — full-width brand-gradient header with H1, intro line, and a search input. No stock photo (avoids "stock photo" feel and keeps load fast).
- **Category chips row** — filter by `Cities / Universities / Study tips / Costs / Visa / Language / Careers`. Active chip uses primary; client-side filter.
- **Featured post** — the newest published post gets a large 2-column card: hero image left, title + excerpt + category + read-time + "Read article →" right.
- **Article grid** — 3-column on desktop / 2 on tablet / 1 on mobile. Each card: 16:9 hero image on top, category pill, H3 title, 2-line excerpt, read-time. Hover lifts the card, image zooms slightly.
- **Quick-access landing pages** kept as a slim section below the grid (currently above — moved so articles lead).
- Skeleton loaders while posts fetch; empty-state when a category filter has no results.

Files: `src/pages/blog/BlogIndex.tsx` (rewrite), `src/components/blog/BlogCard.tsx` (new), `src/components/blog/BlogFeaturedCard.tsx` (new), `src/components/blog/BlogCategoryFilter.tsx` (new).

The single blog post page (`/blog/:slug`) also gets the hero image rendered above the title.

## 2. AI-generated hero images

Auto-generate one 16:9 hero image per blog post using **Lovable AI Gateway image model** (`google/gemini-2.5-flash-image` — Nano Banana). No new secret needed; reuses `LOVABLE_API_KEY`.

**Storage:** new public Supabase bucket `blog-images`. Files keyed by post slug (e.g. `what-is-uni-assist-guide.jpg`). Public-read; admin-write via RLS.

**Schema:** add `hero_image_url TEXT` and `hero_image_alt TEXT` to `blog_posts`.

**Generation flow (`blog-draft-generator` edge function):**
1. After inserting the draft, call AI gateway image endpoint with a prompt built from title + category:
   `"Editorial hero image for an article titled \"{title}\". Category: {category}. Style: modern, warm, photographic, soft natural light, featuring international students or German university imagery as appropriate. No text, no logos, no watermarks. Wide 16:9."`
2. Decode the returned base64 PNG, upload to `blog-images/{slug}.png` via service-role client.
3. Update the row with `hero_image_url` (public URL) and `hero_image_alt` = title.
4. Wrapped in try/catch — failure logs but does not fail the draft creation; admin can regenerate from UI.

**Admin UI (`AdminBlog.tsx`):**
- Draft & published cards show the thumbnail.
- "Regenerate image" button per post → calls new edge function `blog-generate-hero-image` with `{ post_id }`.
- Editor dialog adds an "Image" section: preview + Regenerate + manual URL override.

**Backfill:** the new `blog-generate-hero-image` function accepts `{ backfill: true }` and loops over posts where `hero_image_url IS NULL`. Triggered from a one-click admin button.

## 3. Technical notes

- New edge function `blog-generate-hero-image` (config in `supabase/config.toml`, `verify_jwt = true` so only authenticated admins can invoke from UI; internal calls from `blog-draft-generator` use service key).
- Image model call uses Lovable AI Gateway `/v1/chat/completions` with `model: "google/gemini-2.5-flash-image"` and `modalities: ["image","text"]` per gateway image spec; returns base64 PNG in `message.images[0].image_url.url`.
- Card images use `loading="lazy"` + `decoding="async"`; featured card eager-loads.
- All colors via semantic tokens — no raw hex in components.
- Add `BlogPosting.image` to existing JSON-LD on the post page.

## 4. Out of scope

- No translations of blog content (separate effort).
- No comments / community submissions.
- No newsletter signup block (can add later if you want).
