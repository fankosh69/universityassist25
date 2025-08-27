import { useEffect } from 'react';
import mapboxgl from 'mapbox-gl';
import { deslugifyToLooseName } from '../lib/slug';

async function fetchUniPointFromWikidata(looseName: string) {
  // Build a permissive regex to match labels containing all tokens
  const tokens = looseName.split(' ').filter(Boolean);
  const pattern = tokens.map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('.*');
  const sparql = `
    PREFIX wd: <http://www.wikidata.org/entity/>
    PREFIX wdt: <http://www.wikidata.org/prop/direct/>
    PREFIX bd: <http://www.bigdata.com/rdf#>
    SELECT ?university ?universityLabel ?coord WHERE {
      ?university wdt:P31/wdt:P279* wd:Q3918 .
      ?university wdt:P17 wd:Q183 .
      ?university wdt:P625 ?coord .
      SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
      FILTER( REGEX(LCASE(?universityLabel), "${pattern}") )
    }
    LIMIT 1
  `;
  const url = `https://query.wikidata.org/sparql?format=json&query=${encodeURIComponent(sparql)}`;
  const res = await fetch(url, { headers: { 'accept': 'application/sparql-results+json' } });
  if (!res.ok) return null;
  const data = await res.json();
  const row = data?.results?.bindings?.[0];
  if (!row) return null;
  const coord = row.coord.value; // "Point(lon lat)"
  const m = coord.match(/Point\(([-0-9.]+)\s+([-0-9.]+)\)/);
  if (!m) return null;
  return {
    lon: parseFloat(m[1]),
    lat: parseFloat(m[2]),
    label: row.universityLabel.value
  };
}

type Props = { map: mapboxgl.Map; slug: string };

export default function UniversityBySlug({ map, slug }: Props) {
  useEffect(() => {
    const loose = deslugifyToLooseName(slug);
    let isCancelled = false;

    (async () => {
      const hit = await fetchUniPointFromWikidata(loose);
      if (isCancelled || !hit) return;

      map.flyTo({ center: [hit.lon, hit.lat], zoom: 13 });
      const el = document.createElement('div');
      el.style.width = '16px';
      el.style.height = '16px';
      el.style.borderRadius = '50%';
      el.style.background = '#2f6fff';
      el.style.border = '2px solid #fff';

      const marker = new mapboxgl.Marker(el)
        .setLngLat([hit.lon, hit.lat])
        .addTo(map);

      new mapboxgl.Popup()
        .setLngLat([hit.lon, hit.lat])
        .setHTML(`<strong>${hit.label}</strong>`)
        .addTo(map);

      return () => marker.remove();
    })();

    return () => { isCancelled = true; };
  }, [map, slug]);

  return null;
}