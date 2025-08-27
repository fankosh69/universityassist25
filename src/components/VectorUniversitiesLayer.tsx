import { useEffect } from 'react';
import mapboxgl from 'mapbox-gl';

const TILESET_ID = 'uniassist25.8hyvrccf';
const SOURCE_LAYER = 'de-universities-b2h52i';

type Props = {
  map: mapboxgl.Map;
  cityFilter?: string; // case-insensitive exact match on 'city' property
};

export default function VectorUniversitiesLayer({ map, cityFilter }: Props) {
  useEffect(() => {
    if (!map.getSource('de-unis-tiles')) {
      map.addSource('de-unis-tiles', { type: 'vector', url: `mapbox://${TILESET_ID}` });
    }
    if (!map.getLayer('de-unis-points')) {
      map.addLayer({
        id: 'de-unis-points',
        type: 'circle',
        source: 'de-unis-tiles',
        'source-layer': SOURCE_LAYER,
        paint: {
          'circle-radius': ['interpolate', ['linear'], ['zoom'], 4, 2.5, 12, 6],
          'circle-color': '#2f6fff',
          'circle-stroke-color': '#ffffff',
          'circle-stroke-width': 1
        }
      });

      map.on('click', 'de-unis-points', (e) => {
        const f = e.features && e.features[0];
        if (!f) return;
        const p: any = f.properties || {};
        const html = `
          <div style="min-width:220px">
            <strong>${p.name || 'University'}</strong><br/>
            ${p.city ? `${p.city}<br/>` : ''}
            ${p.website ? `<a href="${p.website}" target="_blank" rel="noopener">Website</a>` : ''}
          </div>
        `;
        new mapboxgl.Popup().setLngLat(e.lngLat).setHTML(html).addTo(map);
      });
      map.on('mouseenter', 'de-unis-points', () => map.getCanvas().style.cursor = 'pointer');
      map.on('mouseleave', 'de-unis-points', () => map.getCanvas().style.cursor = '');
    }

    // Apply / clear city filter
    if (cityFilter && cityFilter.trim()) {
      map.setFilter('de-unis-points', ['==', ['downcase', ['get', 'city']], cityFilter.toLowerCase()]);
    } else {
      map.setFilter('de-unis-points', null);
    }
  }, [map, cityFilter]);

  return null;
}