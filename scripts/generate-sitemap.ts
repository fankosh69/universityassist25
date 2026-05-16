/* eslint-disable no-console */
// Generates public/sitemap.xml (sitemap index) plus per-entity sitemaps.
// Runs via `predev` and `prebuild` so dev preview and production stay in sync.
// Uses the Supabase REST API with the publishable (anon) key — public catalog
// data only, no service-role secret required.

import { writeFileSync, mkdirSync } from "fs";
import { resolve } from "path";

const BASE_URL = process.env.SITE_ORIGIN || "https://uniassist.net";
const SUPABASE_URL =
  process.env.VITE_SUPABASE_URL || "https://zfiexgjcuojodmnsinsz.supabase.co";
const SUPABASE_KEY =
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  process.env.SUPABASE_PUBLISHABLE_KEY ||
  "";

const OUT = resolve("public");
const LOCALES = ["en", "ar", "de"] as const;

type Row = Record<string, any>;

async function fetchAll(table: string, select: string, filter = ""): Promise<Row[]> {
  const out: Row[] = [];
  const pageSize = 1000;
  for (let from = 0; ; from += pageSize) {
    const to = from + pageSize - 1;
    const url = `${SUPABASE_URL}/rest/v1/${table}?select=${select}${filter}`;
    const res = await fetch(url, {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        Range: `${from}-${to}`,
        "Range-Unit": "items",
        Prefer: "count=exact",
      },
    });
    if (!res.ok) {
      console.warn(`[sitemap] ${table} fetch failed (${res.status})`);
      break;
    }
    const rows = (await res.json()) as Row[];
    out.push(...rows);
    if (rows.length < pageSize) break;
  }
  return out;
}

function urlEntry(path: string, opts: { changefreq?: string; priority?: string; lastmod?: string; alternates?: boolean } = {}) {
  const loc = `${BASE_URL}${path}`;
  const alts = opts.alternates !== false
    ? LOCALES.map(
        (l) => `    <xhtml:link rel="alternate" hreflang="${l}" href="${BASE_URL}/${l}${path}"/>`
      ).join("\n") + "\n" + `    <xhtml:link rel="alternate" hreflang="x-default" href="${loc}"/>`
    : "";
  return [
    `  <url>`,
    `    <loc>${loc}</loc>`,
    opts.lastmod ? `    <lastmod>${opts.lastmod}</lastmod>` : null,
    opts.changefreq ? `    <changefreq>${opts.changefreq}</changefreq>` : null,
    opts.priority ? `    <priority>${opts.priority}</priority>` : null,
    alts || null,
    `  </url>`,
  ]
    .filter(Boolean)
    .join("\n");
}

function wrapUrlset(urls: string[]) {
  return [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">`,
    ...urls,
    `</urlset>`,
  ].join("\n");
}

function wrapIndex(files: string[]) {
  const today = new Date().toISOString().slice(0, 10);
  const entries = files.map(
    (f) => `  <sitemap><loc>${BASE_URL}/${f}</loc><lastmod>${today}</lastmod></sitemap>`
  );
  return [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
    ...entries,
    `</sitemapindex>`,
  ].join("\n");
}

function write(name: string, body: string) {
  mkdirSync(OUT, { recursive: true });
  writeFileSync(resolve(OUT, name), body);
  console.log(`[sitemap] wrote ${name}`);
}

async function main() {
  // Static / app routes (top-level indexable pages).
  const staticEntries = [
    urlEntry("/", { changefreq: "weekly", priority: "1.0" }),
    urlEntry("/search", { changefreq: "daily", priority: "0.9" }),
    urlEntry("/eligibility-checker", { changefreq: "monthly", priority: "0.9" }),
    urlEntry("/cities", { changefreq: "weekly", priority: "0.8" }),
    urlEntry("/universities", { changefreq: "weekly", priority: "0.8" }),
    urlEntry("/regions", { changefreq: "weekly", priority: "0.7" }),
    urlEntry("/ambassadors", { changefreq: "weekly", priority: "0.7" }),
    urlEntry("/impressum", { changefreq: "yearly", priority: "0.3", alternates: false }),
    urlEntry("/blog", { changefreq: "weekly", priority: "0.7", alternates: false }),
    // High-intent SEO landing pages
    ...[
      "study-in-germany",
      "english-taught-programs-in-germany",
      "masters-in-germany",
      "bachelors-in-germany",
      "free-universities-in-germany",
    ].map((s) => urlEntry(`/${s}`, { changefreq: "weekly", priority: "0.9" })),
    // Legacy WordPress URLs rebuilt as native pages — keep slugs verbatim.
    ...[
      "the-most-budget-friendly-cities-in-germany-for-international-students",
      "karlsruhe-a-city-of-history",
      "ue-university-of-europe-for-applied-sciences",
      "why-to-study-entrepreneurship-in-germany",
      "ebs-germany-a-way-to-success",
      "best-5-universities-to-pursue-a-business-degree-in-germany",
      "ects-and-its-benefits-for-international-students",
      "about-us",
    ].map((s) => urlEntry(`/${s}`, { changefreq: "monthly", priority: "0.8", alternates: false })),
  ];
  write("sitemap-static.xml", wrapUrlset(staticEntries));

  if (!SUPABASE_KEY) {
    console.warn("[sitemap] no Supabase key — skipping dynamic sitemaps");
    write("sitemap.xml", wrapIndex(["sitemap-static.xml"]));
    return;
  }

  const [cities, universities, programs, ambassadors] = await Promise.all([
    fetchAll("cities", "slug"),
    fetchAll("universities", "id,slug"),
    fetchAll("programs", "slug,university_id"),
    fetchAll("ambassadors", "id", "&is_published=eq.true").catch(() => []),
  ]);

  write(
    "sitemap-cities.xml",
    wrapUrlset(
      cities
        .filter((c) => c.slug)
        .map((c) => urlEntry(`/cities/${c.slug}`, { changefreq: "monthly", priority: "0.7" }))
    )
  );

  write(
    "sitemap-universities.xml",
    wrapUrlset(
      universities
        .filter((u) => u.slug)
        .map((u) => urlEntry(`/universities/${u.slug}`, { changefreq: "monthly", priority: "0.7" }))
    )
  );

  const uniMap = new Map<string, string>();
  for (const u of universities) if (u.id && u.slug) uniMap.set(u.id, u.slug);

  write(
    "sitemap-programs.xml",
    wrapUrlset(
      programs
        .filter((p) => p.slug && uniMap.has(p.university_id))
        .map((p) =>
          urlEntry(`/universities/${uniMap.get(p.university_id)}/programs/${p.slug}`, {
            changefreq: "monthly",
            priority: "0.6",
          })
        )
    )
  );

  const ambFiles: string[] = [];
  if (ambassadors.length) {
    write(
      "sitemap-ambassadors.xml",
      wrapUrlset(
        ambassadors.map((a) => urlEntry(`/ambassadors/${a.id}`, { changefreq: "monthly", priority: "0.5" }))
      )
    );
    ambFiles.push("sitemap-ambassadors.xml");
  }

  write(
    "sitemap.xml",
    wrapIndex([
      "sitemap-static.xml",
      "sitemap-cities.xml",
      "sitemap-universities.xml",
      "sitemap-programs.xml",
      ...ambFiles,
    ])
  );

  console.log(
    `[sitemap] cities=${cities.length} universities=${universities.length} programs=${programs.length} ambassadors=${ambassadors.length}`
  );
}

main().catch((e) => {
  console.error("[sitemap] failed:", e);
  process.exit(0); // never fail dev/build because of sitemap
});