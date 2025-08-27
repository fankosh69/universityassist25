export function slugify(input: string): string {
  return (input || '')
    .toLowerCase()
    .normalize('NFKD')            // strip accents
    .replace(/[^\w\s-]/g, '')     // remove non-word except space/hyphen
    .replace(/\s+/g, '-')         // spaces → hyphens
    .replace(/-+/g, '-')          // collapse
    .replace(/^-|-$/g, '');       // trim
}

export function deslugifyToLooseName(slug: string): string {
  // turn "humboldt-university-berlin" → "humboldt university berlin"
  return (slug || '').toLowerCase().replace(/-/g, ' ').replace(/\s+/g, ' ').trim();
}