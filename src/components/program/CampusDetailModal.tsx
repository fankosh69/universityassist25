import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { MapPin, Users, Building2, Navigation, ExternalLink, Eye, EyeOff, Filter } from 'lucide-react';
import { Toggle } from '@/components/ui/toggle';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
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
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [hoveredAmenity, setHoveredAmenity] = useState<string | null>(null);
  const [showAmenityMarkers, setShowAmenityMarkers] = useState(true);
  const [amenitiesError, setAmenitiesError] = useState(false);
  // Start with all categories selected by default
  const allCategories: NearbyAmenity['category'][] = [
    'restaurant', 'cafe', 'grocery', 'pharmacy', 'library', 'bank'
  ];
  const [selectedCategories, setSelectedCategories] = useState<Set<NearbyAmenity['category']>>(
    new Set(allCategories)
  );

  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const markers = useRef<L.Marker[]>([]);
  const amenityMarkersRef = useRef<L.Marker[]>([]);

  // Set initial selected campus
  useEffect(() => {
    if (isOpen && campuses.length > 0) {
      const initial = campuses.find(c => c.id === initialCampusId) || campuses[0];
      setSelectedCampus(initial);
    }
  }, [isOpen, campuses, initialCampusId]);

  // Reset map loaded state when modal closes
  useEffect(() => {
    if (!isOpen) {
      console.log('Modal closed, resetting map state');
      setIsMapLoaded(false);
    }
  }, [isOpen]);

  // Initialize map when modal opens
  useEffect(() => {
    // Validate coordinates before proceeding
    if (!selectedCampus?.lat || !selectedCampus?.lng) {
      console.warn('Invalid campus coordinates:', selectedCampus);
      return;
    }

    if (!mapContainer.current || map.current) return;

    console.log('Initializing map for campus:', selectedCampus.name || selectedCampus.city);

    // Single timeout for map initialization
    const timeoutId = setTimeout(() => {
      if (!mapContainer.current) return;

      try {
        const newMap = L.map(mapContainer.current, {
          center: [selectedCampus.lat!, selectedCampus.lng!],
          zoom: 14,
          scrollWheelZoom: true,
        });

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors',
          maxZoom: 19,
        }).addTo(newMap);

        // Add main campus marker
        const campusIcon = L.divIcon({
          className: 'custom-campus-marker',
          html: '<div style="background-color: hsl(var(--primary)); color: white; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);">🎓</div>',
          iconSize: [32, 32],
          iconAnchor: [16, 16],
        });

        const mainMarker = L.marker([selectedCampus.lat!, selectedCampus.lng!], {
          icon: campusIcon,
        })
          .addTo(newMap)
          .bindPopup(
            selectedCampus.name 
              ? `<b>${selectedCampus.name}</b><br/>${selectedCampus.city || ''}` 
              : `<b>Campus</b><br/>${selectedCampus.city || ''}`
          );

        markers.current = [mainMarker];
        map.current = newMap;

        // Immediately resize and mark as loaded
        newMap.invalidateSize();
        setIsMapLoaded(true);
        console.log('Map loaded successfully');
      } catch (error) {
        console.error('Error initializing map:', error);
        setIsMapLoaded(true); // Mark as loaded even on error to prevent infinite loading
      }
    }, 150);

    return () => {
      clearTimeout(timeoutId);
      if (map.current) {
        map.current.remove();
        map.current = null;
        markers.current = [];
        amenityMarkersRef.current = [];
        // DON'T reset isMapLoaded here - only reset on modal close
      }
    };
  }, [selectedCampus]);

  // Fetch nearby amenities when campus changes (ONCE - not affected by toggle)
  useEffect(() => {
    if (!selectedCampus?.lat || !selectedCampus?.lng || !isMapLoaded) return;

    const loadAmenities = async () => {
      setIsLoadingAmenities(true);
      setAmenitiesError(false);
      try {
        const nearbyAmenities = await fetchNearbyAmenities(
          selectedCampus.lat,
          selectedCampus.lng,
          1000
        );

        const grouped = groupAmenitiesByCategory(nearbyAmenities);
        setAmenities(grouped);

        if (nearbyAmenities.length === 0) {
          setAmenitiesError(true);
        }
      } catch (error) {
        console.error('Failed to load amenities:', error);
        setAmenitiesError(true);
      } finally {
        setIsLoadingAmenities(false);
      }
    };

    loadAmenities();
  }, [selectedCampus, isMapLoaded]);

  // Add/remove amenity markers based on toggle, amenities data, and selected categories
  useEffect(() => {
    if (!map.current || !isMapLoaded) return;

    // Remove existing amenity markers
    amenityMarkersRef.current.forEach(marker => marker.remove());
    amenityMarkersRef.current = [];

    // Add markers if toggle is on and we have amenities
    if (showAmenityMarkers && amenities) {
      const allAmenities = Object.values(amenities).flat();
      
      // Filter amenities by selected categories
      const filteredAmenities = allAmenities.filter(amenity => 
        selectedCategories.has(amenity.category)
      );
      
      filteredAmenities.forEach((amenity) => {
        const amenityIcon = L.divIcon({
          className: 'custom-amenity-marker',
          html: `<div style="background-color: hsl(var(--secondary)); color: white; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; border: 2px solid white; box-shadow: 0 1px 4px rgba(0,0,0,0.3);">${getCategoryIcon(amenity.category)}</div>`,
          iconSize: [24, 24],
          iconAnchor: [12, 12],
        });

        const marker = L.marker([amenity.lat, amenity.lng], {
          icon: amenityIcon,
        })
          .addTo(map.current!)
          .bindPopup(
            `<b>${amenity.name}</b><br/>${getCategoryLabel(amenity.category)}<br/>${formatDistance(amenity.distance)} away`
          );

        amenityMarkersRef.current.push(marker);
      });
    }
  }, [showAmenityMarkers, amenities, isMapLoaded, selectedCategories]);

  // Handle amenity hover
  const handleAmenityHover = (amenity: NearbyAmenity | null) => {
    setHoveredAmenity(amenity?.id || null);
    
    if (amenity && map.current) {
      map.current.setView([amenity.lat, amenity.lng], 17, { animate: true });
      
      // Find and open popup for this amenity in amenityMarkersRef
      const marker = amenityMarkersRef.current.find(m => {
        const pos = m.getLatLng();
        return Math.abs(pos.lat - amenity.lat) < 0.0001 && Math.abs(pos.lng - amenity.lng) < 0.0001;
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

  // Toggle category filter
  const toggleCategory = (category: NearbyAmenity['category']) => {
    const newCategories = new Set(selectedCategories);
    if (newCategories.has(category)) {
      newCategories.delete(category);
    } else {
      newCategories.add(category);
    }
    setSelectedCategories(newCategories);
  };


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
          <DialogDescription>
            Explore the campus location, nearby amenities, and facilities
          </DialogDescription>
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
              <div ref={mapContainer} className="absolute inset-0 w-full h-full rounded-l-lg" style={{ minHeight: '500px' }} />
              
              {/* Loading overlay */}
              {!isMapLoaded && (
                <div className="absolute inset-0 flex items-center justify-center bg-muted/50 rounded-l-lg">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                    <p className="text-sm text-muted-foreground">Loading map...</p>
                  </div>
                </div>
              )}
              
              {/* Map Controls - Toggle Amenities & Filter */}
              {isMapLoaded && (
                <div className="absolute top-4 right-4 z-[1000] flex gap-2">
                  <div className="bg-background/95 backdrop-blur-sm rounded-lg shadow-lg border p-2">
                    <Toggle
                      pressed={showAmenityMarkers}
                      onPressedChange={setShowAmenityMarkers}
                      aria-label="Toggle amenity markers"
                      className="gap-2"
                    >
                      {showAmenityMarkers ? (
                        <>
                          <Eye className="h-4 w-4" />
                          <span className="text-xs font-medium">Amenities</span>
                        </>
                      ) : (
                        <>
                          <EyeOff className="h-4 w-4" />
                          <span className="text-xs font-medium">Amenities</span>
                        </>
                      )}
                    </Toggle>
                  </div>
                  
                  <div className="bg-background/95 backdrop-blur-sm rounded-lg shadow-lg border">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="px-3 py-2 hover:bg-accent rounded-lg transition-colors flex items-center gap-2">
                          <Filter className="h-4 w-4" />
                          <span className="text-xs font-medium">Filter</span>
                          {selectedCategories.size < allCategories.length && (
                            <Badge variant="secondary" className="h-5 px-1.5 text-xs">
                              {selectedCategories.size}
                            </Badge>
                          )}
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent 
                        align="end" 
                        className="w-56 bg-background border shadow-lg z-[1001]"
                      >
                        <DropdownMenuLabel>Amenity Categories</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {allCategories.map((category) => (
                          <DropdownMenuCheckboxItem
                            key={category}
                            checked={selectedCategories.has(category)}
                            onCheckedChange={() => toggleCategory(category)}
                            className="cursor-pointer"
                          >
                            <span className="mr-2">{getCategoryIcon(category)}</span>
                            {getCategoryLabel(category)}
                          </DropdownMenuCheckboxItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              )}
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
                      {[1, 2, 3].map((i) => (
                        <Skeleton key={i} className="h-16 w-full" />
                      ))}
                    </div>
                  ) : amenitiesError ? (
                    <div className="p-4 border border-dashed rounded-lg bg-muted/30">
                      <p className="text-sm text-muted-foreground text-center">
                        Unable to load nearby amenities. Please try again later.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {Object.entries(amenities)
                        .filter(([category]) => selectedCategories.has(category as NearbyAmenity['category']))
                        .map(([category, items]) =>
                          items.length > 0 ? (
                            <div key={category}>
                              <h4 className="text-sm font-medium text-muted-foreground mb-2">
                                {getCategoryIcon(category as NearbyAmenity['category'])} {getCategoryLabel(category as NearbyAmenity['category'])}
                              </h4>
                              <div className="space-y-2">
                                {items.slice(0, 3).map((amenity) => (
                                  <button
                                    key={amenity.id}
                                    onClick={() => handleAmenityHover(amenity)}
                                    onMouseEnter={() => setHoveredAmenity(amenity.id)}
                                    onMouseLeave={() => setHoveredAmenity(null)}
                                    className={`w-full flex items-start justify-between p-3 rounded-lg border transition-all cursor-pointer hover:bg-accent hover:scale-[1.02] active:scale-[0.98] ${
                                      hoveredAmenity === amenity.id && "bg-primary/10 border-primary/50"
                                    }`}
                                  >
                                    <div className="flex-1 min-w-0 text-left">
                                      <p className="font-medium text-sm truncate">{amenity.name}</p>
                                      <p className="text-xs text-muted-foreground mt-1">
                                        {formatDistance(amenity.distance)} away
                                      </p>
                                    </div>
                                  </button>
                                ))}
                              </div>
                            </div>
                          ) : null
                        )}
                      {Object.entries(amenities).filter(([category]) => 
                        selectedCategories.has(category as NearbyAmenity['category'])
                      ).every(([_, items]) => items.length === 0) && (
                        <p className="text-sm text-muted-foreground text-center">
                          No amenities found for selected categories
                        </p>
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
