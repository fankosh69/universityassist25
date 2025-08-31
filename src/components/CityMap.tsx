// src/components/CityMap.tsx
import React, { useEffect, useRef, useState } from "react";
import { getMapboxToken } from "@/lib/env";

type Props = { 
  city: { name: string; slug: string; lat?: number|null; lng?: number|null };
  className?: string;
};

export default function CityMap({ city, className = '' }: Props) {
  const wrapRef = useRef<HTMLDivElement|null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        if (!wrapRef.current || typeof window === "undefined") return;

        const token = getMapboxToken();
        if (!token) throw new Error("Missing Mapbox client token (VITE_MAPBOX_TOKEN)");

        const mapboxgl = (await import("mapbox-gl")).default;
        (mapboxgl as any).accessToken = token;

        const has = typeof city.lat === "number" && typeof city.lng === "number";
        const center: [number, number] = has ? [city.lng!, city.lat!] : [10.4515, 51.1657];

        const map = new mapboxgl.Map({
          container: wrapRef.current,
          style: "mapbox://styles/mapbox/streets-v12",
          center,
          zoom: has ? 11 : 5
        });

        map.on("load", () => { if (has) new mapboxgl.Marker().setLngLat([city.lng!, city.lat!]).addTo(map); });
        map.on("error", e => { console.error(e); setError("Failed to initialize map"); });
      } catch (e:any) {
        console.error(e);
        setError(e?.message ?? "Failed to initialize map");
      }
    })();
  }, [city.lat, city.lng, city.slug]);

  return (
    <div className={`w-full ${className}`}>
      <div ref={wrapRef} className="w-full rounded-xl overflow-hidden border" style={{ height: 380 }} />
      {error ? <p className="text-sm text-gray-500 mt-2">Map unavailable — {error}</p> : null}
    </div>
  );
}