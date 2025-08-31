export function getClientToken(): string {
  const t = (import.meta as any)?.env?.VITE_MAPBOX_TOKEN;
  if (!t || !String(t).trim()) throw new Error("Missing VITE_MAPBOX_TOKEN");
  return t;
}

export function getStyleUrl(): string {
  return (import.meta as any)?.env?.VITE_MAPBOX_STYLE || "mapbox://styles/mapbox/streets-v12";
}

// Convert a style URL to REST base for Static Images API
export function styleToApiBase(styleUrl: string): string {
  const m = styleUrl.match(/^mapbox:\/\/styles\/([^/]+)\/([^/]+)$/);
  if (!m) return "https://api.mapbox.com/styles/v1/mapbox/streets-v12";
  return `https://api.mapbox.com/styles/v1/${m[1]}/${m[2]}`;
}

// Build a Static Images API URL with optional marker
export function staticMapUrl({
  lng, lat, zoom = 11, width = 1200, height = 630, pin = true
}: { lng?: number|null; lat?: number|null; zoom?: number; width?: number; height?: number; pin?: boolean }): string {
  const token = getClientToken();
  const base = styleToApiBase(getStyleUrl());
  const center = (typeof lng === "number" && typeof lat === "number")
    ? `${lng},${lat},${zoom},0`
    : `10.4515,51.1657,5,0`; // Germany
  const marker = (typeof lng === "number" && typeof lat === "number" && pin)
    ? `pin-s+2E57F6(${lng},${lat})/`
    : "";
  const scale = (typeof window !== "undefined" && window.devicePixelRatio > 1) ? "@2x" : "";
  return `${base}/static/${marker}${center}/${width}x${height}${scale}?access_token=${encodeURIComponent(token)}`;
}

export async function isWebGLSupported(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  try {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
    return !!gl;
  } catch { return false; }
}