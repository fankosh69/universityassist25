// Helper functions for fetching nearby amenities and transit using Mapbox APIs

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

// Categorize POI based on Mapbox category
function categorizePOI(properties: any): NearbyAmenity['category'] {
  const category = properties.category?.toLowerCase() || '';
  const name = properties.text?.toLowerCase() || '';
  
  if (category.includes('restaurant') || category.includes('food') || name.includes('restaurant')) return 'restaurant';
  if (category.includes('cafe') || category.includes('coffee') || name.includes('cafe')) return 'cafe';
  if (category.includes('grocery') || category.includes('supermarket') || name.includes('grocery')) return 'grocery';
  if (category.includes('pharmacy') || name.includes('pharmacy') || name.includes('apotheke')) return 'pharmacy';
  if (category.includes('library') || name.includes('library') || name.includes('bibliothek')) return 'library';
  if (category.includes('bank') || name.includes('bank')) return 'bank';
  
  return 'other';
}

// Fetch nearby amenities using Mapbox Geocoding API
export async function fetchNearbyAmenities(
  lat: number, 
  lng: number, 
  mapboxToken: string,
  radiusMeters: number = 1000
): Promise<NearbyAmenity[]> {
  try {
    const response = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?` +
      `types=poi&limit=50&proximity=${lng},${lat}&access_token=${mapboxToken}`
    );

    if (!response.ok) {
      throw new Error('Failed to fetch amenities');
    }

    const data = await response.json();
    const amenities: NearbyAmenity[] = [];

    for (const feature of data.features || []) {
      const [featureLng, featureLat] = feature.center;
      const distance = calculateDistance(lat, lng, featureLat, featureLng);
      
      // Only include POIs within the specified radius
      if (distance <= radiusMeters) {
        const category = categorizePOI(feature.properties);
        
        // Filter to only relevant categories
        if (category !== 'other') {
          amenities.push({
            id: feature.id,
            name: feature.text,
            category,
            lat: featureLat,
            lng: featureLng,
            distance: Math.round(distance),
            address: feature.place_name,
          });
        }
      }
    }

    // Sort by distance
    amenities.sort((a, b) => a.distance - b.distance);

    return amenities;
  } catch (error) {
    console.error('Error fetching amenities:', error);
    return [];
  }
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
