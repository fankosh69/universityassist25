import { useJsApiLoader } from '@react-google-maps/api';
import { useState, useEffect } from 'react';

let cachedToken: string | null = null;

export async function getGoogleMapsToken(): Promise<string> {
  if (cachedToken) {
    return cachedToken;
  }

  // Try Vite environment variables (browser-safe)
  const envToken = (import.meta as any)?.env?.VITE_GOOGLE_MAPS_API_KEY;
    
  if (envToken) {
    cachedToken = envToken;
    return envToken;
  }
  
  // Fallback to Supabase edge function
  try {
    const { supabase } = await import('@/integrations/supabase/client');
    const { data, error } = await supabase.functions.invoke('get-google-maps-token');
    
    if (error) throw error;
    if (data?.token) {
      cachedToken = data.token;
      return data.token;
    }
    
    throw new Error('No token received from server');
  } catch (error) {
    console.warn('Failed to get Google Maps token:', error);
    return '';
  }
}

export function useGoogleMaps() {
  const [token, setToken] = useState<string>('');
  
  useEffect(() => {
    getGoogleMapsToken().then(setToken).catch(console.error);
  }, []);

  return useJsApiLoader({
    googleMapsApiKey: token,
    libraries: ['places'],
  });
}