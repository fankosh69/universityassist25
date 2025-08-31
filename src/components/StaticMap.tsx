import React from "react";
import { staticMapUrl } from "@/lib/mapboxSupport";

export default function StaticMap({ city }: { city: { name: string; lat?: number|null; lng?: number|null } }) {
  const url = staticMapUrl({ lng: city.lng ?? null, lat: city.lat ?? null, zoom: 11, width: 1200, height: 380, pin: true });
  const alt = city?.name ? `Map of ${city.name}` : "Map of Germany";
  const gmaps = (typeof city.lng === "number" && typeof city.lat === "number")
    ? `https://www.google.com/maps/search/?api=1&query=${city.lat},${city.lng}`
    : `https://www.google.com/maps/@51.1657,10.4515,5z`;
  return (
    <div className="w-full">
      <img src={url} alt={alt} className="w-full rounded-xl border shadow-sm" style={{ height: 380, objectFit: "cover" }} />
      <div className="mt-2 text-xs text-gray-500">
        Interactive map unavailable on this device. <a className="underline" href={gmaps} target="_blank" rel="noreferrer">Open in Google Maps</a>
      </div>
    </div>
  );
}