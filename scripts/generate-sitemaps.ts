/* eslint-disable no-console */
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const SITE = process.env.SITE_ORIGIN || 'https://universityassist25.lovable.app';
const OUT = path.join(process.cwd(), 'public');

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://zfiexgjcuojodmnsinsz.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY; // set in Lovable secrets

if (!SUPABASE_SERVICE_KEY) {
  console.error('SUPABASE_SERVICE_ROLE_KEY is required for sitemap generation');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_KEY!, { auth: { persistSession: false } });

type Row = { slug: string };
const LOCALES = ['en', 'ar', 'de'];

function urlEntry(pathname: string, lastmod?: string) {
  const locs = LOCALES.map(l => `<xhtml:link rel="alternate" hreflang="${l}" href="${SITE}/${l}${pathname}"/>`).join('');
  return `<url>
  <loc>${SITE}${pathname}</loc>
  ${lastmod ? `<lastmod>${lastmod}</lastmod>` : ''}
  ${locs}
</url>`;
}

async function writeFile(name: string, body: string) {
  fs.mkdirSync(OUT, { recursive: true });
  fs.writeFileSync(path.join(OUT, name), body.trim());
  console.log('wrote', name);
}

function wrapSet(urlset: string) {
  return `<?xml version="1.0" encoding="UTF-8"?>
  <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
          xmlns:xhtml="http://www.w3.org/1999/xhtml">
  ${urlset}
  </urlset>`;
}

function wrapIndex(sitemaps: string) {
  return `<?xml version="1.0" encoding="UTF-8"?>
  <sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${sitemaps}
  </sitemapindex>`;
}

async function generateCitiesSitemap() {
  console.log('Generating cities sitemap...');
  
  const cities = await supabase.from('cities').select('slug').limit(5000);
  const cityUrls = (cities.data as Row[] || []).map(c => urlEntry(`/cities/${c.slug}`)).join('\n');
  await writeFile('sitemap-cities.xml', wrapSet(cityUrls));
}

async function generateUniversitiesSitemap() {
  console.log('Generating universities sitemap...');
  
  const unis = await supabase.from('universities').select('slug').limit(10000);
  const uniUrls = (unis.data as any[] || []).map((u: any) => urlEntry(`/universities/${u.slug}`)).join('\n');
  await writeFile('sitemap-universities.xml', wrapSet(uniUrls));
}

async function generateProgramsSitemap() {
  console.log('Generating programs sitemap...');
  
  const progs = await supabase.from('programs').select('slug, university_id').limit(20000);
  const unis = await supabase.from('universities').select('id, slug').limit(10000);
  
  // Create uni ID to slug mapping
  const uniMap = new Map<string, string>();
  if (unis.data) for (const u of unis.data as any[]) uniMap.set(u.id, u.slug);
  
  const progUrls = (progs.data as any[] || []).map((p: any) => {
    const uniSlug = uniMap.get(p.university_id) || 'university';
    return urlEntry(`/universities/${uniSlug}/programs/${p.slug}`);
  }).join('\n');
  await writeFile('sitemap-programs.xml', wrapSet(progUrls));
}

async function generateAmbassadorsSitemap() {
  console.log('Generating ambassadors sitemap...');
  
  const ambs = await supabase.from('ambassadors').select('id').eq('is_published', true).limit(20000);
  const ambUrls = (ambs.data as any[] || []).map((a: any) => urlEntry(`/ambassadors/${a.id}`)).join('\n');
  await writeFile('sitemap-ambassadors.xml', wrapSet(ambUrls));
}

async function generateMainSitemap() {
  console.log('Generating main sitemap index...');
  
  const idx = [
    'sitemap-cities.xml',
    'sitemap-universities.xml',
    'sitemap-programs.xml',
    'sitemap-ambassadors.xml',
  ].map(f => `<sitemap><loc>${SITE}/${f}</loc></sitemap>`).join('\n');
  await writeFile('sitemap-index.xml', wrapIndex(idx));
}

async function main() {
  try {
    await Promise.all([
      generateCitiesSitemap(),
      generateUniversitiesSitemap(),
      generateProgramsSitemap(),
      generateAmbassadorsSitemap()
    ]);
    
    await generateMainSitemap();
    
    // robots.txt
    await writeFile('robots.txt', `User-agent: *\nAllow: /\nSitemap: ${SITE}/sitemap-index.xml\n`);
    
    console.log('✅ All sitemaps generated successfully!');
  } catch (error) {
    console.error('❌ Error generating sitemaps:', error);
    process.exit(1);
  }
}

main().catch(e => { console.error(e); process.exit(1); });