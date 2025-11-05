import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  MapPin, 
  Users, 
  Building2, 
  Navigation as NavigationIcon,
  Train,
  Bus,
  ExternalLink
} from 'lucide-react';
import { 
  fetchNearbyAmenities, 
  groupAmenitiesByCategory,
  formatDistance,
  getCategoryIcon,
  getCategoryLabel,
  type NearbyAmenity
} from '@/lib/mapbox-amenities';

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
  initialCampusId?: string;
  mapboxToken: string;
}

export function CampusDetailModal({ 
  campuses, 
  isOpen, 
  onClose, 
  initialCampusId,
  mapboxToken 
}: CampusDetailModalProps) {
  const [selectedCampusId, setSelectedCampusId] = useState(
    initialCampusId || campuses[0]?.id
  );
  const [amenities, setAmenities] = useState<Record<string, NearbyAmenity[]>>({});
  const [isLoadingAmenities, setIsLoadingAmenities] = useState(false);
  const [hoveredAmenity, setHoveredAmenity] = useState<string | null>(null);
  
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);

  const selectedCampus = campuses.find(c => c.id === selectedCampusId) || campuses[0];

  // Initialize map
  useEffect(() => {
    if (!isOpen || !mapContainer.current || !selectedCampus?.lat || !selectedCampus?.lng || !mapboxToken) return;
    if (map.current) return;

    mapboxgl.accessToken = mapboxToken;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [selectedCampus.lng, selectedCampus.lat],
      zoom: 14,
      pitch: 45,
    });

    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
    map.current.addControl(new mapboxgl.FullscreenControl(), 'top-right');

    // Add campus marker
    new mapboxgl.Marker({ color: '#2E57F6', scale: 1.2 })
      .setLngLat([selectedCampus.lng, selectedCampus.lat])
      .setPopup(
        new mapboxgl.Popup({ offset: 25 })
          .setHTML(`<strong>${selectedCampus.name || 'Campus'}</strong>`)
      )
      .addTo(map.current);

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, [isOpen, mapboxToken, selectedCampus]);

  // Fetch amenities when campus changes
  useEffect(() => {
    if (!isOpen || !selectedCampus?.lat || !selectedCampus?.lng || !mapboxToken) return;

    const loadAmenities = async () => {
      setIsLoadingAmenities(true);
      try {
        const nearbyAmenities = await fetchNearbyAmenities(
          selectedCampus.lat!,
          selectedCampus.lng!,
          mapboxToken,
          1000
        );
        const grouped = groupAmenitiesByCategory(nearbyAmenities);
        setAmenities(grouped);

        // Add amenity markers to map
        if (map.current) {
          // Clear existing amenity markers
          markersRef.current.forEach(marker => marker.remove());
          markersRef.current = [];

          // Add new markers
          nearbyAmenities.forEach(amenity => {
            const el = document.createElement('div');
            el.className = 'amenity-marker';
            el.innerHTML = getCategoryIcon(amenity.category);
            el.style.fontSize = '20px';
            el.style.cursor = 'pointer';

            const marker = new mapboxgl.Marker({ element: el })
              .setLngLat([amenity.lng, amenity.lat])
              .setPopup(
                new mapboxgl.Popup({ offset: 25 })
                  .setHTML(`
                    <div class="p-1">
                      <strong>${amenity.name}</strong><br/>
                      <span class="text-sm text-muted-foreground">${formatDistance(amenity.distance)} away</span>
                    </div>
                  `)
              )
              .addTo(map.current!);

            markersRef.current.push(marker);
          });
        }
      } catch (error) {
        console.error('Error loading amenities:', error);
      } finally {
        setIsLoadingAmenities(false);
      }
    };

    loadAmenities();
  }, [isOpen, selectedCampus, mapboxToken]);

  // Update map center when campus changes
  useEffect(() => {
    if (map.current && selectedCampus?.lat && selectedCampus?.lng) {
      map.current.flyTo({
        center: [selectedCampus.lng, selectedCampus.lat],
        zoom: 14,
        duration: 1000,
      });
    }
  }, [selectedCampus]);

  const handleAmenityHover = (amenityId: string | null) => {
    setHoveredAmenity(amenityId);
    
    if (amenityId && map.current) {
      // Find the amenity
      const allAmenities = Object.values(amenities).flat();
      const amenity = allAmenities.find(a => a.id === amenityId);
      
      if (amenity) {
        map.current.flyTo({
          center: [amenity.lng, amenity.lat],
          zoom: 16,
          duration: 500,
        });
      }
    }
  };

  const facilityIcons: Record<string, string> = {
    'Library': '📚',
    'Sports': '⚽',
    'Lab': '🔬',
    'Cafeteria': '🍽️',
    'Dormitory': '🏢',
  };

  const getFacilityIcon = (facility: string) => {
    const key = Object.keys(facilityIcons).find(k => 
      facility.toLowerCase().includes(k.toLowerCase())
    );
    return key ? facilityIcons[key] : '🏛️';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl h-[90vh] p-0 gap-0">
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle className="text-xl">Campus Location & Amenities</DialogTitle>
        </DialogHeader>

        {campuses.length > 1 && (
          <Tabs value={selectedCampusId} onValueChange={setSelectedCampusId} className="px-6 pt-2">
            <TabsList>
              {campuses.map(campus => (
                <TabsTrigger key={campus.id} value={campus.id}>
                  {campus.name || campus.city}
                  {campus.is_main_campus && <Badge variant="secondary" className="ml-2 text-xs">Main</Badge>}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        )}

        <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
          {/* Map Section */}
          <div className="w-full md:w-[60%] h-64 md:h-full relative">
            <div ref={mapContainer} className="absolute inset-0" />
          </div>

          {/* Details Panel */}
          <div className="w-full md:w-[40%] overflow-y-auto p-6 space-y-6">
            {/* Campus Header */}
            <div>
              <h3 className="text-lg font-semibold">{selectedCampus?.name || 'Campus'}</h3>
              {selectedCampus?.city && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                  <MapPin className="h-4 w-4" />
                  <span>{selectedCampus.city}, Germany</span>
                </div>
              )}
              {selectedCampus?.is_main_campus && (
                <Badge variant="secondary" className="mt-2">Main Campus</Badge>
              )}
            </div>

            {/* Student Count */}
            {selectedCampus?.student_count && (
              <div className="flex items-center gap-2 text-sm">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{selectedCampus.student_count.toLocaleString()}</span>
                <span className="text-muted-foreground">students</span>
              </div>
            )}

            {/* Facilities */}
            {selectedCampus?.facilities && selectedCampus.facilities.length > 0 && (
              <div>
                <div className="flex items-center gap-2 text-sm font-semibold mb-3">
                  <Building2 className="h-4 w-4" />
                  <span>Campus Facilities</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {selectedCampus.facilities.map((facility, index) => (
                    <Badge key={index} variant="outline">
                      <span className="mr-1">{getFacilityIcon(facility)}</span>
                      {facility}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Nearby Amenities */}
            <div>
              <div className="flex items-center gap-2 text-sm font-semibold mb-3">
                <MapPin className="h-4 w-4" />
                <span>Nearby Amenities</span>
              </div>

              {isLoadingAmenities ? (
                <div className="space-y-2">
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                </div>
              ) : (
                <div className="space-y-4">
                  {Object.entries(amenities).map(([category, items]) => {
                    if (items.length === 0) return null;
                    
                    return (
                      <div key={category}>
                        <h4 className="text-xs font-medium text-muted-foreground mb-2 uppercase">
                          {getCategoryLabel(category as NearbyAmenity['category'])}
                        </h4>
                        <div className="space-y-1">
                          {items.map((amenity) => (
                            <button
                              key={amenity.id}
                              onClick={() => handleAmenityHover(amenity.id)}
                              onMouseEnter={() => setHoveredAmenity(amenity.id)}
                              onMouseLeave={() => setHoveredAmenity(null)}
                              className={`w-full text-left p-2 rounded-md transition-colors ${
                                hoveredAmenity === amenity.id 
                                  ? 'bg-accent' 
                                  : 'hover:bg-muted'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                  <span className="text-base">{getCategoryIcon(amenity.category)}</span>
                                  <span className="text-sm font-medium truncate">{amenity.name}</span>
                                </div>
                                <span className="text-xs text-muted-foreground ml-2 flex-shrink-0">
                                  {formatDistance(amenity.distance)}
                                </span>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                  
                  {Object.values(amenities).every(items => items.length === 0) && (
                    <p className="text-sm text-muted-foreground">No nearby amenities found</p>
                  )}
                </div>
              )}
            </div>

            {/* Getting There */}
            <div className="pt-4 border-t space-y-2">
              <h4 className="text-sm font-semibold mb-3">Getting There</h4>
              <div className="space-y-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full justify-start"
                  asChild
                >
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${selectedCampus?.lat},${selectedCampus?.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <NavigationIcon className="h-4 w-4 mr-2" />
                    Get Directions (Google Maps)
                    <ExternalLink className="h-3 w-3 ml-auto" />
                  </a>
                </Button>
                
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full justify-start"
                  asChild
                >
                  <a
                    href={`https://www.bahn.de/buchung/fahrplan/suche`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Train className="h-4 w-4 mr-2" />
                    Local Transit Planner
                    <ExternalLink className="h-3 w-3 ml-auto" />
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
