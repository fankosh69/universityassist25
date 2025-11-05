import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { MapPin, Users, Building2, Navigation, ExternalLink } from 'lucide-react';
import {
  fetchNearbyAmenities,
  groupAmenitiesByCategory,
  formatDistance,
  getCategoryIcon,
  getCategoryLabel,
  type NearbyAmenity,
} from '@/lib/osm-amenities';

// Fix for default marker icons in Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

interface Campus {
  id: string;
  name: string | null;
  city: string | null;
  lat: number | null;
  lng: number | null;
  is_main_campus: boolean;
  facilities: string[] | null;
  student_count: number | null;
}

interface CampusDetailModalProps {
  campuses: Campus[];
  isOpen: boolean;
  onClose: () => void;
  initialCampusId: string;
}

export function CampusDetailModal({
  campuses,
  isOpen,
  onClose,
  initialCampusId,
}: CampusDetailModalProps) {
  const [selectedCampus, setSelectedCampus] = useState<Campus | null>(null);
  const [amenities, setAmenities] = useState<Record<string, NearbyAmenity[]>>({});
  const [isLoadingAmenities, setIsLoadingAmenities] = useState(false);
  const [hoveredAmenity, setHoveredAmenity] = useState<string | null>(null);

  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const markers = useRef<L.Marker[]>([]);

  // Set initial selected campus
  useEffect(() => {
    if (isOpen && campuses.length > 0) {
      const initial = campuses.find(c => c.id === initialCampusId) || campuses[0];
      setSelectedCampus(initial);
    }
  }, [isOpen, campuses, initialCampusId]);

  // Initialize map
  useEffect(() => {
    if (!isOpen || !mapContainer.current || !selectedCampus?.lat || !selectedCampus?.lng) return;
    if (map.current) return; // Map already initialized

    // Small delay to ensure container is rendered with dimensions
    setTimeout(() => {
      if (!mapContainer.current) return;
      
      // Create Leaflet map
      map.current = L.map(mapContainer.current, {
        center: [selectedCampus.lat, selectedCampus.lng],
        zoom: 15,
        zoomControl: true,
      });

    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map.current);

    // Add main campus marker (custom blue marker)
    const customIcon = L.divIcon({
      className: 'custom-campus-marker',
      html: '<div style="background-color: #2E57F6; width: 24px; height: 24px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"><div style="transform: rotate(45deg); margin: 4px 0 0 6px; color: white; font-size: 12px;">📍</div></div>',
      iconSize: [24, 24],
      iconAnchor: [12, 24],
    });

      const mainMarker = L.marker([selectedCampus.lat, selectedCampus.lng], { icon: customIcon })
        .addTo(map.current)
        .bindPopup(`<strong>${selectedCampus.name || 'Campus'}</strong><br>${selectedCampus.city || ''}`);
      
      markers.current.push(mainMarker);

      // Force map to recalculate size
      map.current.invalidateSize();
    }, 100);

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
        markers.current = [];
      }
    };
  }, [isOpen, selectedCampus]);

  // Fetch amenities when campus changes
  useEffect(() => {
    if (!selectedCampus?.lat || !selectedCampus?.lng) return;

    async function loadAmenities() {
      setIsLoadingAmenities(true);
      try {
        const nearbyAmenities = await fetchNearbyAmenities(
          selectedCampus.lat!,
          selectedCampus.lng!,
          1000 // 1km radius
        );
        const grouped = groupAmenitiesByCategory(nearbyAmenities);
        setAmenities(grouped);

        // Add amenity markers to map
        if (map.current) {
          // Clear existing amenity markers (keep campus marker)
          markers.current.slice(1).forEach(marker => marker.remove());
          markers.current = markers.current.slice(0, 1);

          // Add new amenity markers
          Object.values(grouped).flat().forEach((amenity) => {
            const amenityMarker = L.marker([amenity.lat, amenity.lng], {
              icon: L.divIcon({
                className: 'amenity-marker',
                html: `<div style="font-size: 16px; filter: drop-shadow(0 1px 2px rgba(0,0,0,0.3));">${getCategoryIcon(amenity.category)}</div>`,
                iconSize: [24, 24],
                iconAnchor: [12, 12],
              })
            })
              .addTo(map.current!)
              .bindPopup(`
                <div style="min-width: 150px;">
                  <strong>${amenity.name}</strong><br>
                  <span style="color: #666; font-size: 12px;">${getCategoryLabel(amenity.category)}</span><br>
                  <span style="color: #999; font-size: 11px;">${formatDistance(amenity.distance)}</span>
                </div>
              `);
            
            markers.current.push(amenityMarker);
          });
        }
      } catch (error) {
        console.error('Error loading amenities:', error);
      } finally {
        setIsLoadingAmenities(false);
      }
    }

    loadAmenities();
  }, [selectedCampus]);

  // Handle amenity hover
  const handleAmenityHover = (amenity: NearbyAmenity | null) => {
    setHoveredAmenity(amenity?.id || null);
    
    if (amenity && map.current) {
      map.current.setView([amenity.lat, amenity.lng], 17, { animate: true });
      
      // Find and open popup for this amenity
      const marker = markers.current.find(m => {
        const pos = m.getLatLng();
        return pos.lat === amenity.lat && pos.lng === amenity.lng;
      });
      marker?.openPopup();
    }
  };

  // Update map center when campus changes
  useEffect(() => {
    if (map.current && selectedCampus?.lat && selectedCampus?.lng) {
      map.current.setView([selectedCampus.lat, selectedCampus.lng], 15, { animate: true });
    }
  }, [selectedCampus]);

  if (!selectedCampus) return null;

  const facilityIcons = {
    'Library': '📚',
    'Sports': '⚽',
    'Lab': '🔬',
    'Cafeteria': '🍽️',
    'Dormitory': '🏢',
    'default': '🏛️'
  };

  const getFacilityIcon = (facility: string) => {
    const key = Object.keys(facilityIcons).find(k => 
      facility.toLowerCase().includes(k.toLowerCase())
    );
    return key ? facilityIcons[key as keyof typeof facilityIcons] : facilityIcons.default;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl h-[90vh] p-0 overflow-hidden flex flex-col">
        <DialogHeader className="px-6 py-4 border-b flex-shrink-0">
          <DialogTitle>Campus Location & Nearby Amenities</DialogTitle>
        </DialogHeader>

        {campuses.length > 1 && (
          <Tabs 
            value={selectedCampus.id} 
            onValueChange={(id) => {
              const campus = campuses.find(c => c.id === id);
              if (campus) setSelectedCampus(campus);
            }}
            className="px-6 pt-4 flex-shrink-0"
          >
            <TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(${campuses.length}, 1fr)` }}>
              {campuses.map((campus) => (
                <TabsTrigger key={campus.id} value={campus.id}>
                  {campus.name || campus.city}
                  {campus.is_main_campus && <Badge variant="secondary" className="ml-2 text-xs">Main</Badge>}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        )}

        <div className="flex-1 flex overflow-hidden min-h-0">
            {/* Map Section */}
            <div className="flex-1 relative min-h-0">
              <div ref={mapContainer} className="absolute inset-0 w-full h-full" />
            </div>

            {/* Details Sidebar */}
            <div className="w-80 border-l overflow-y-auto bg-background flex-shrink-0">
              <div className="p-6 space-y-6">
                {/* Campus Info */}
                <div>
                  <h3 className="font-semibold text-lg mb-2">{selectedCampus.name || 'Campus'}</h3>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      <span>{selectedCampus.city}, Germany</span>
                    </div>
                    {selectedCampus.student_count && (
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        <span>{selectedCampus.student_count.toLocaleString()} students</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Facilities */}
                {selectedCampus.facilities && selectedCampus.facilities.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 font-semibold mb-2">
                      <Building2 className="h-4 w-4" />
                      <span>Campus Facilities</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {selectedCampus.facilities.map((facility, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          <span className="mr-1">{getFacilityIcon(facility)}</span>
                          {facility}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Nearby Amenities */}
                <div>
                  <div className="flex items-center gap-2 font-semibold mb-3">
                    <MapPin className="h-4 w-4" />
                    <span>Nearby Amenities</span>
                  </div>

                  {isLoadingAmenities ? (
                    <div className="space-y-3">
                      {[1, 2, 3, 4].map(i => (
                        <Skeleton key={i} className="h-12 w-full" />
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {Object.entries(amenities).map(([category, items]) => {
                        if (items.length === 0) return null;
                        return (
                          <div key={category}>
                            <h4 className="text-sm font-medium mb-2">
                              {getCategoryIcon(category as NearbyAmenity['category'])} {getCategoryLabel(category as NearbyAmenity['category'])}
                            </h4>
                            <div className="space-y-2">
                              {items.map((amenity) => (
                                <button
                                  key={amenity.id}
                                  onMouseEnter={() => handleAmenityHover(amenity)}
                                  onMouseLeave={() => handleAmenityHover(null)}
                                  onClick={() => handleAmenityHover(amenity)}
                                  className={`w-full p-3 rounded-md border cursor-pointer transition-all text-left ${
                                    hoveredAmenity === amenity.id 
                                      ? 'bg-primary/10 border-primary shadow-sm scale-[1.02]' 
                                      : 'hover:bg-accent/50 hover:border-accent'
                                  }`}
                                >
                                  <p className="text-sm font-medium">{amenity.name}</p>
                                  <p className="text-xs text-muted-foreground">{formatDistance(amenity.distance)}</p>
                                </button>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                      {Object.values(amenities).every(arr => arr.length === 0) && (
                        <p className="text-sm text-muted-foreground">No amenities data available nearby</p>
                      )}
                    </div>
                  )}
                </div>

                {/* Getting There */}
                <div>
                  <div className="flex items-center gap-2 font-semibold mb-3">
                    <Navigation className="h-4 w-4" />
                    <span>Getting There</span>
                  </div>
                  <div className="space-y-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full justify-start"
                      asChild
                    >
                      <a
                        href={`https://www.google.com/maps/dir/?api=1&destination=${selectedCampus.lat},${selectedCampus.lng}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Directions via Google Maps
                      </a>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full justify-start"
                      asChild
                    >
                      <a
                        href={`https://www.openstreetMap.org/directions?from=&to=${selectedCampus.lat},${selectedCampus.lng}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Directions via OpenStreetMap
                      </a>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
      </DialogContent>
    </Dialog>
  );
}
