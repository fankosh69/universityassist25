import { useJsApiLoader } from '@react-google-maps/api';

export const GOOGLE_MAPS_API_KEY =
  (import.meta as any)?.env?.VITE_GOOGLE_MAPS_API_KEY ||
  (process as any)?.env?.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ||
  (process as any)?.env?.REACT_APP_GOOGLE_MAPS_API_KEY;

export function useGoogleMaps() {
  return useJsApiLoader({
    googleMapsApiKey: GOOGLE_MAPS_API_KEY!,
    libraries: ['places'],
  });
}