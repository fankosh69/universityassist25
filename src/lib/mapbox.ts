// Mapbox integration utilities

export interface MapboxConfig {
  accessToken: string;
  style: string;
  center: [number, number];
  zoom: number;
}

export function getMapboxToken(): string {
  // Check environment variables in order of preference
  const token = 
    import.meta.env.NEXT_PUBLIC_MAPBOX_TOKEN ||
    import.meta.env.VITE_MAPBOX_TOKEN ||
    import.meta.env.REACT_APP_MAPBOX_TOKEN;
    
  if (!token) {
    console.warn('Mapbox token not found in environment variables');
    return '';
  }
  
  return token;
}

export function getDefaultMapConfig(): MapboxConfig {
  return {
    accessToken: getMapboxToken(),
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
        <h3 class="font-semibold text-lg">${marker.name}</h3>
        <p class="text-sm text-muted-foreground">${marker.data.city}</p>
        <p class="text-sm">
          ${marker.data.program_count || 0} programs available
        </p>
        <a href="/universities/${marker.data.slug}" class="text-primary text-sm hover:underline">
          View Programs →
        </a>
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