import React, { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import StaticMap from "@/components/StaticMap";
import { getClientToken, getStyleUrl, isWebGLSupported } from "@/lib/mapboxSupport";

type City = { name: string; slug: string; lat?: number|null; lng?: number|null };

export default function CityMap({ city, className }: { city: City; className?: string }) {
  const ref = useRef<HTMLDivElement|null>(null);
  const [error, setError] = useState<string|null>(null);
  const [enabled, setEnabled] = useState<boolean>(true);

  useEffect(() => {
    (async () => {
      if (typeof window === "undefined" || !ref.current) return;

      // 1) Feature detect WebGL. If unsupported, disable interactive map.
      const supported = await isWebGLSupported();
      if (!supported) { setEnabled(false); return; }

      try {
        mapboxgl.accessToken = getClientToken();

        const has = typeof city.lat === "number" && typeof city.lng === "number";
        const center: [number, number] = has ? [city.lng!, city.lat!] : [10.4515, 51.1657];

        const map = new mapboxgl.Map({
          container: ref.current,
          style: getStyleUrl(),    // your custom style
          center,
          zoom: has ? 11 : 5
          // Note: failIfMajorPerformanceCaveat defaults to false – keeps more devices eligible
        });

        map.on("load", () => { if (has) new mapboxgl.Marker().setLngLat(center).addTo(map); });
        map.on("error", (e) => {
          console.error("Mapbox error", e);
          // 2) If initialization fails later, fallback to static.
          setEnabled(false);
          setError("Failed to initialize WebGL");
          map.remove();
        });

        return () => map.remove();
      } catch (e: any) {
        console.error("CityMap init failure", e);
        setEnabled(false);
        setError(e?.message ?? "Failed to initialize map");
      }
    })();
  }, [city.slug, city.lat, city.lng]);

  if (!enabled) {
    return (
      <div className={`w-full ${className || ''}`}>
        <StaticMap city={city} />
        {error && <p className="text-xs text-gray-500 mt-1">Map unavailable — {error}</p>}
      </div>
    );
  }

  return <div ref={ref} className={`w-full rounded-xl overflow-hidden border ${className || ''}`} style={{ height: 380 }} />;
}
