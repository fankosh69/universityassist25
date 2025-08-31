export function getClientToken(): string {
  const t = (import.meta as any).env?.VITE_MAPBOX_TOKEN;
  if (!t) throw new Error("Missing VITE_MAPBOX_TOKEN");
  return t;
}
export function getStyleUrl(): string {
  const s = (import.meta as any).env?.VITE_MAPBOX_STYLE || "mapbox://styles/mapbox/streets-v12";
  return s;
}
export function getTileset(): string | undefined {
  return (import.meta as any).env?.VITE_MAPBOX_TILESET;
}

// Fetch the style JSON and detect the source-layer used by our tileset.
// Caches result in-memory for this session.
let _layerCache: string | null = null;
export async function detectSourceLayer(styleUrl: string, tilesetUrl: string, token: string): Promise<string | null> {
  if (!tilesetUrl) return null;
  if (_layerCache) return _layerCache;

  // Convert style url to REST endpoint
  // e.g. mapbox://styles/uniassist25/<styleid> -> https://api.mapbox.com/styles/v1/uniassist25/<styleid>
  const m = styleUrl.match(/^mapbox:\/\/styles\/([^/]+)\/([^/]+)$/);
  const styleApi = m
    ? `https://api.mapbox.com/styles/v1/${m[1]}/${m[2]}?access_token=${token}`
    : `${styleUrl}?access_token=${token}`;

  const res = await fetch(styleApi);
  if (!res.ok) return null;
  const style = await res.json();

  // Find the source key that uses our tileset URL
  const sourceKey = Object.keys(style?.sources || {}).find((k) => {
    const s = style.sources[k];
    return s?.type === "vector" && typeof s?.url === "string" && s.url.includes(tilesetUrl.replace("mapbox://", ""));
  });

  if (!sourceKey) return null;

  // Find first layer that references that source and has a source-layer
  const layer = (style.layers || []).find((ly: any) => ly?.source === sourceKey && ly["source-layer"]);
  _layerCache = layer?.["source-layer"] || null;
  return _layerCache;
}