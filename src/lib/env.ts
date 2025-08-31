// src/lib/env.ts
export function getMapboxToken(): string | undefined {
  // Vite public env (the only client-safe source)
  const t = (import.meta as any)?.env?.VITE_MAPBOX_TOKEN;
  return t && String(t).trim() ? t : undefined;
}