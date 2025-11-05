// Helper functions for fetching nearby amenities using OpenStreetMap Overpass API

export interface NearbyAmenity {
  id: string;
  name: string;
  category: 'restaurant' | 'cafe' | 'grocery' | 'pharmacy' | 'library' | 'bank' | 'other';
  lat: number;
  lng: number;
  distance: number; // in meters
  address?: string;
}

export interface TransitStop {
  id: string;
  name: string;
  type: 'bus' | 'tram' | 'metro' | 'train';
  lat: number;
  lng: number;
  distance: number;
  routes?: string[];
}

// Calculate distance between two coordinates (Haversine formula)
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lng2 - lng1) * Math.PI / 180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c;
}

// Categorize POI based on OpenStreetMap tags
function categorizePOI(tags: any): NearbyAmenity['category'] {
  const amenity = tags.amenity?.toLowerCase() || '';
  const shop = tags.shop?.toLowerCase() || '';
  const name = tags.name?.toLowerCase() || '';
  
  if (amenity === 'restaurant' || amenity === 'food_court' || amenity === 'fast_food') return 'restaurant';
  if (amenity === 'cafe' || amenity === 'coffee_shop') return 'cafe';
  if (shop === 'supermarket' || shop === 'convenience' || shop === 'grocery') return 'grocery';
  if (amenity === 'pharmacy' || shop === 'pharmacy') return 'pharmacy';
  if (amenity === 'library') return 'library';
  if (amenity === 'bank' || amenity === 'atm') return 'bank';
  
  return 'other';
}

// Fetch nearby amenities using OpenStreetMap Overpass API with retry logic
export async function fetchNearbyAmenities(
  lat: number, 
  lng: number, 
  radiusMeters: number = 1000
): Promise<NearbyAmenity[]> {
  // Alternative Overpass API endpoints (try in order)
  const endpoints = [
    'https://lz4.overpass-api.de/api/interpreter',
    'https://overpass-api.de/api/interpreter',
    'https://overpass.kumi.systems/api/interpreter'
  ];

  // Build Overpass QL query for nearby amenities
  const query = `
    [out:json][timeout:15];
    (
      node["amenity"~"restaurant|cafe|fast_food|food_court|pharmacy|library|bank|atm"](around:${radiusMeters},${lat},${lng});
      node["shop"~"supermarket|convenience|grocery"](around:${radiusMeters},${lat},${lng});
    );
    out body;
    >;
    out skel qt;
  `;

  // Try each endpoint with timeout
  for (let endpointIndex = 0; endpointIndex < endpoints.length; endpointIndex++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      const response = await fetch(endpoints[endpointIndex], {
        method: 'POST',
        body: `data=${encodeURIComponent(query)}`,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
    const amenities: NearbyAmenity[] = [];

    for (const element of data.elements || []) {
      if (element.type !== 'node' || !element.lat || !element.lon) continue;
      
      const distance = calculateDistance(lat, lng, element.lat, element.lon);
      
      // Only include POIs within the specified radius
      if (distance <= radiusMeters) {
        const category = categorizePOI(element.tags || {});
        
        // Filter to only relevant categories
        if (category !== 'other') {
          amenities.push({
            id: element.id.toString(),
            name: element.tags?.name || 'Unnamed',
            category,
            lat: element.lat,
            lng: element.lon,
            distance: Math.round(distance),
            address: [
              element.tags?.['addr:street'],
              element.tags?.['addr:housenumber'],
              element.tags?.['addr:city']
            ].filter(Boolean).join(' '),
          });
        }
      }
    }

      // Sort by distance
      amenities.sort((a, b) => a.distance - b.distance);

      return amenities;
    } catch (error) {
      console.warn(`Overpass API endpoint ${endpointIndex + 1} failed:`, error);
      // Continue to next endpoint
      if (endpointIndex === endpoints.length - 1) {
        // All endpoints failed
        console.error('All Overpass API endpoints failed:', error);
        return [];
      }
    }
  }

  // Fallback: return empty array if all attempts fail
  return [];
}

// Group amenities by category and limit per category
export function groupAmenitiesByCategory(amenities: NearbyAmenity[]): Record<string, NearbyAmenity[]> {
  const grouped: Record<string, NearbyAmenity[]> = {
    restaurant: [],
    cafe: [],
    grocery: [],
    pharmacy: [],
    library: [],
    bank: [],
  };

  for (const amenity of amenities) {
    if (grouped[amenity.category]) {
      grouped[amenity.category].push(amenity);
    }
  }

  // Limit each category
  return {
    restaurant: grouped.restaurant.slice(0, 5),
    cafe: grouped.cafe.slice(0, 5),
    grocery: grouped.grocery.slice(0, 3),
    pharmacy: grouped.pharmacy.slice(0, 2),
    library: grouped.library.slice(0, 3),
    bank: grouped.bank.slice(0, 2),
  };
}

// Format distance for display
export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${meters}m`;
  }
  return `${(meters / 1000).toFixed(1)}km`;
}

// Get category icon
export function getCategoryIcon(category: NearbyAmenity['category']): string {
  const icons = {
    restaurant: '🍽️',
    cafe: '☕',
    grocery: '🛒',
    pharmacy: '💊',
    library: '📚',
    bank: '🏦',
    other: '📍',
  };
  return icons[category];
}

// Get category label
export function getCategoryLabel(category: NearbyAmenity['category']): string {
  const labels = {
    restaurant: 'Restaurants',
    cafe: 'Cafes',
    grocery: 'Grocery Stores',
    pharmacy: 'Pharmacies',
    library: 'Libraries',
    bank: 'Banks',
    other: 'Other',
  };
  return labels[category];
}
