// Mapbox integration utilities

export interface MapboxConfig {
  accessToken: string;
  style: string;
  center: [number, number];
  zoom: number;
}

export async function getMapboxToken(): Promise<string> {
  // Try environment variables first
  const envToken = 
    import.meta.env.NEXT_PUBLIC_MAPBOX_TOKEN ||
    import.meta.env.VITE_MAPBOX_TOKEN ||
    import.meta.env.REACT_APP_MAPBOX_TOKEN;
    
  if (envToken) {
    return envToken;
  }
  
  // Fallback to Supabase edge function
  try {
    const { supabase } = await import('@/integrations/supabase/client');
    const { data, error } = await supabase.functions.invoke('get-mapbox-token');
    
    if (error) throw error;
    return data?.token || '';
  } catch (error) {
    console.warn('Failed to get Mapbox token:', error);
    return '';
  }
}

export async function getDefaultMapConfig(): Promise<MapboxConfig> {
  return {
    accessToken: await getMapboxToken(),
    style: 'mapbox://styles/mapbox/light-v11',
    center: [10.4515, 51.1657], // Center of Germany
    zoom: 6
  };
}

export interface MapMarker {
  id: string;
  name: string;
  coordinates: [number, number];
  type: 'city' | 'university';
  data: any;
}

export function createClusterConfig() {
  return {
    cluster: true,
    clusterMaxZoom: 14,
    clusterRadius: 50,
    clusterProperties: {
      sum: ['+', ['get', 'count']]
    }
  };
}

export function createMarkerPopupHTML(marker: MapMarker): string {
  if (marker.type === 'city') {
    return `
      <div class="p-3">
        <h3 class="font-semibold text-lg">${marker.name}</h3>
        <p class="text-sm text-muted-foreground">
          ${marker.data.university_count || 0} universities
        </p>
        <a href="/cities/${marker.data.slug}" class="text-primary text-sm hover:underline">
          View Details →
        </a>
      </div>
    `;
  } else {
    return `
      <div class="p-3">
        <h3 class="font-semibold text-lg mb-2">${marker.name}</h3>
        <p class="text-sm text-muted-foreground mb-2">${marker.data.city}</p>
        <div class="space-y-2">
          <button onclick="window.location.href='/universities/${marker.data.slug || marker.data.id}'" class="block w-full text-left text-primary text-sm hover:underline font-medium">
            🏛️ View University Profile
          </button>
          <button onclick="window.location.href='/universities/${marker.data.slug || marker.data.id}#programs'" class="block w-full text-left text-primary text-sm hover:underline">
            📚 View Programs (${marker.data.program_count || 0} available)
          </button>
        </div>
      </div>
    `;
  }
}

export const MAP_STYLES = {
  light: 'mapbox://styles/mapbox/light-v11',
  dark: 'mapbox://styles/mapbox/dark-v11',
  streets: 'mapbox://styles/mapbox/streets-v12',
  satellite: 'mapbox://styles/mapbox/satellite-v9'
};