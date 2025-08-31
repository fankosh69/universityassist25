// src/components/CityMap.tsx
import React, { useEffect, useRef, useState } from "react";
import { getMapboxToken } from "@/lib/env";

type City = { name: string; slug: string; lat?: number|null; lng?: number|null };

export default function CityMap({ city, className }: { city: City; className?: string }) {
  const wrapRef = useRef<HTMLDivElement|null>(null);
  const [error, setError] = useState<string|null>(null);

  useEffect(() => {
    (async () => {
      try {
        if (typeof window === "undefined" || !wrapRef.current) return;
        const token = getMapboxToken();
        const mapboxgl = (await import("mapbox-gl")).default as any;
        mapboxgl.accessToken = token;

        const has = typeof city.lat === "number" && typeof city.lng === "number";
        const center: [number, number] = has ? [city.lng!, city.lat!] : [10.4515, 51.1657];

        const map = new mapboxgl.Map({
          container: wrapRef.current,
          style: "mapbox://styles/mapbox/streets-v12",
          center,
          zoom: has ? 11 : 5
        });

        map.on("load", () => { if (has) new mapboxgl.Marker().setLngLat(center).addTo(map); });
        map.on("error", (e: any) => { console.error(e); setError("Failed to initialize map"); });
      } catch (e: any) {
        console.error(e);
        setError(e?.message ?? "Failed to initialize map");
      }
    })();
  }, [city.slug, city.lat, city.lng]);

  return (
    <div className={`w-full ${className || ''}`}>
      <div ref={wrapRef} className="w-full rounded-xl overflow-hidden border" style={{ height: 380 }} />
      {error && <p className="text-sm text-gray-500 mt-2">Map unavailable — {error}</p>}
      {!city?.lat || !city?.lng ? (
        <p className="text-xs text-gray-500 mt-1">Map will appear once coordinates are confirmed for {city.name}.</p>
      ) : null}
    </div>
  );
}