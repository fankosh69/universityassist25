import React, { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import { getClientToken, getStyleUrl, getTileset, detectSourceLayer } from "@/lib/mapboxConfig";

type City = { name: string; slug: string; lat?: number|null; lng?: number|null };

function slugify(s: string) {
  return String(s).toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export default function CityMap({ city, className }: { city: City; className?: string }) {
  const ref = useRef<HTMLDivElement|null>(null);
  const [error, setError] = useState<string|null>(null);

  useEffect(() => {
    (async () => {
      try {
        if (!ref.current || typeof window === "undefined") return;

        const token = getClientToken();
        mapboxgl.accessToken = token;

        const styleUrl = getStyleUrl();
        const tilesetUrl = getTileset();

        const has = typeof city.lat === "number" && typeof city.lng === "number";
        const center: [number, number] = has ? [city.lng!, city.lat!] : [10.4515, 51.1657];

        const map = new mapboxgl.Map({
          container: ref.current,
          style: styleUrl,
          center,
          zoom: has ? 11 : 5
        });

        map.on("load", async () => {
          if (has) new mapboxgl.Marker().setLngLat(center).addTo(map);

          // If a tileset is configured, add a clickable circle layer for it
          if (tilesetUrl) {
            const sourceId = "ua-unis";
            if (!map.getSource(sourceId)) {
              map.addSource(sourceId, { type: "vector", url: tilesetUrl });
            }

            let layerName = await detectSourceLayer(styleUrl, tilesetUrl, token);
            // If auto-detection failed, try a common default (edit later if needed)
            if (!layerName) layerName = "de_universities";

            const layerId = "ua-unis-circles";
            if (!map.getLayer(layerId)) {
              map.addLayer({
                id: layerId,
                type: "circle",
                source: sourceId,
                "source-layer": layerName,
                paint: {
                  "circle-radius": 6,
                  "circle-color": "#2E57F6",
                  "circle-stroke-width": 1,
                  "circle-stroke-color": "#fff"
                }
              });
            }

            map.on("click", layerId, (e) => {
              const f = map.queryRenderedFeatures(e.point, { layers: [layerId] })?.[0];
              if (!f) return;
              const p: any = f.properties || {};
              const name = p.name || p.university || p.title || "university";
              const slug = p.slug || p.uni_slug || slugify(name);
              window.location.href = `/universities/${slug}`;
            });
            map.on("mouseenter", layerId, () => (map.getCanvas().style.cursor = "pointer"));
            map.on("mouseleave", layerId, () => (map.getCanvas().style.cursor = ""));
          } else {
            // Fallback: clustered GeoJSON if no tileset configured
            fetch("/data/de_universities.geojson")
              .then((r) => r.json())
              .then((fc) => {
                map.addSource("ua-unis-geo", { type: "geojson", data: fc, cluster: true, clusterRadius: 40, clusterMaxZoom: 12 });
                map.addLayer({ id: "clusters", type: "circle", source: "ua-unis-geo", filter: ["has","point_count"],
                  paint: { "circle-color": ["step", ["get","point_count"], "#2E57F6", 20, "#5DC6C5", 50, "#63D581"],
                           "circle-radius": ["step", ["get","point_count"], 16, 20, 22, 50, 28] }});
                map.addLayer({ id: "cluster-count", type: "symbol", source: "ua-unis-geo", filter: ["has","point_count"],
                  layout: { "text-field": ["get","point_count_abbreviated"], "text-size": 12 }});
                map.addLayer({ id: "uni-point", type: "circle", source: "ua-unis-geo", filter: ["!", ["has","point_count"]],
                  paint: { "circle-color":"#2E57F6","circle-radius":6,"circle-stroke-width":1,"circle-stroke-color":"#fff" }});
                map.on("click","uni-point",(e:any) => {
                  const p: any = e.features?.[0]?.properties;
                  const slug = p?.slug || p?.uni_slug || (p?.name ? slugify(p.name) : null);
                  if (slug) window.location.href = `/universities/${slug}`;
                });
              })
              .catch((err) => console.error(err));
          }
        });

        map.on("error", (e) => { console.error(e); setError("Failed to initialize map"); });
        return () => map.remove();
      } catch (e:any) {
        console.error(e);
        setError(e?.message ?? "Failed to initialize map");
      }
    })();
  }, [city.slug, city.lat, city.lng]);

  return (
    <div className={`w-full ${className || ''}`}>
      <div ref={ref} className="w-full rounded-xl overflow-hidden border" style={{ height: 380 }} />
      {error && <p className="text-sm text-gray-500 mt-2">Map unavailable — {error}</p>}
      {!city?.lat || !city?.lng ? (
        <p className="text-xs text-gray-500 mt-1">Map will appear once coordinates are confirmed for {city.name}.</p>
      ) : null}
    </div>
  );
}