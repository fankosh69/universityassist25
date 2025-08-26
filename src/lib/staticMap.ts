import { getGoogleMapsToken } from './googleMaps';

export async function staticMapUrl(lat: number, lng: number, zoom = 12, w = 1200, h = 630) {
  const apiKey = await getGoogleMapsToken();
  return `https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lng}&zoom=${zoom}&size=${w}x${h}&markers=color:blue|${lat},${lng}&key=${apiKey}`;
}