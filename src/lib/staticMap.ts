import { GOOGLE_MAPS_API_KEY } from './googleMaps';

export function staticMapUrl(lat: number, lng: number, zoom = 12, w = 1200, h = 630) {
  return `https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lng}&zoom=${zoom}&size=${w}x${h}&markers=color:blue|${lat},${lng}&key=${GOOGLE_MAPS_API_KEY}`;
}