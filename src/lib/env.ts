// src/lib/env.ts
export function getMapboxToken(): string {
  const t = (import.meta as any)?.env?.VITE_MAPBOX_TOKEN;
  if (!t || !String(t).trim()) throw new Error("Missing Mapbox client token (VITE_MAPBOX_TOKEN)");
  return t;
}