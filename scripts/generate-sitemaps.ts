#!/usr/bin/env ts-node
// Sitemap generation script for University Assist

import { createClient } from '@supabase/supabase-js';
import { writeFileSync } from 'fs';
import { join } from 'path';

// Supabase connection (service key needed)
const supabaseUrl = process.env.SUPABASE_URL || 'https://zfiexgjcuojodmnsinsz.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseServiceKey) {
  console.error('SUPABASE_SERVICE_ROLE_KEY is required for sitemap generation');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface SitemapUrl {
  loc: string;
  lastmod?: string;
  changefreq?: 'daily' | 'weekly' | 'monthly' | 'yearly';
  priority?: number;
}

function generateSitemapXML(urls: SitemapUrl[]): string {
  const urlEntries = urls.map(url => `
  <url>
    <loc>${url.loc}</loc>
    ${url.lastmod ? `<lastmod>${url.lastmod}</lastmod>` : ''}
    ${url.changefreq ? `<changefreq>${url.changefreq}</changefreq>` : ''}
    ${url.priority ? `<priority>${url.priority}</priority>` : ''}
  </url>`).join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlEntries}
</urlset>`;
}

async function generateCitiesSitemap() {
  console.log('Generating cities sitemap...');
  
  const { data: cities } = await supabase
    .from('cities')
    .select('slug, created_at');
  
  if (!cities) return;

  const urls: SitemapUrl[] = cities.map(city => ({
    loc: `https://universityassist.com/cities/${city.slug}`,
    lastmod: new Date(city.created_at).toISOString().split('T')[0],
    changefreq: 'weekly',
    priority: 0.8
  }));

  const xml = generateSitemapXML(urls);
  writeFileSync(join(process.cwd(), 'public/sitemap-cities.xml'), xml);
  console.log(`Generated cities sitemap with ${urls.length} entries`);
}

async function generateUniversitiesSitemap() {
  console.log('Generating universities sitemap...');
  
  const { data: universities } = await supabase
    .from('universities')
    .select('slug, created_at');
  
  if (!universities) return;

  const urls: SitemapUrl[] = universities.map(uni => ({
    loc: `https://universityassist.com/universities/${uni.slug}`,
    lastmod: new Date(uni.created_at).toISOString().split('T')[0],
    changefreq: 'weekly',
    priority: 0.9
  }));

  const xml = generateSitemapXML(urls);
  writeFileSync(join(process.cwd(), 'public/sitemap-universities.xml'), xml);
  console.log(`Generated universities sitemap with ${urls.length} entries`);
}

async function generateProgramsSitemap() {
  console.log('Generating programs sitemap...');
  
  const { data: programs } = await supabase
    .from('programs')
    .select(`
      slug, 
      created_at,
      universities!inner(slug)
    `)
    .eq('published', true);
  
  if (!programs) return;

  const urls: SitemapUrl[] = programs.map(program => ({
    loc: `https://universityassist.com/universities/${program.universities.slug}/programs/${program.slug}`,
    lastmod: new Date(program.created_at).toISOString().split('T')[0],
    changefreq: 'monthly',
    priority: 1.0
  }));

  const xml = generateSitemapXML(urls);
  writeFileSync(join(process.cwd(), 'public/sitemap-programs.xml'), xml);
  console.log(`Generated programs sitemap with ${urls.length} entries`);
}

async function generateAmbassadorsSitemap() {
  console.log('Generating ambassadors sitemap...');
  
  const { data: ambassadors } = await supabase
    .from('ambassadors')
    .select('slug, created_at')
    .eq('is_published', true);
  
  if (!ambassadors) return;

  const urls: SitemapUrl[] = ambassadors.map(ambassador => ({
    loc: `https://universityassist.com/ambassadors/${ambassador.slug}`,
    lastmod: new Date(ambassador.created_at).toISOString().split('T')[0],
    changefreq: 'monthly',
    priority: 0.7
  }));

  const xml = generateSitemapXML(urls);
  writeFileSync(join(process.cwd(), 'public/sitemap-ambassadors.xml'), xml);
  console.log(`Generated ambassadors sitemap with ${urls.length} entries`);
}

async function generateMainSitemap() {
  console.log('Generating main sitemap index...');
  
  const sitemapIndex = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>https://universityassist.com/sitemap-cities.xml</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
  </sitemap>
  <sitemap>
    <loc>https://universityassist.com/sitemap-universities.xml</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
  </sitemap>
  <sitemap>
    <loc>https://universityassist.com/sitemap-programs.xml</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
  </sitemap>
  <sitemap>
    <loc>https://universityassist.com/sitemap-ambassadors.xml</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
  </sitemap>
</sitemapindex>`;

  writeFileSync(join(process.cwd(), 'public/sitemap.xml'), sitemapIndex);
  console.log('Generated main sitemap index');
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
    
    console.log('✅ All sitemaps generated successfully!');
  } catch (error) {
    console.error('❌ Error generating sitemaps:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}