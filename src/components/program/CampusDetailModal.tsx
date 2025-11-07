import { useEffect, useRef, useState, useMemo } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, Users, Building2, Navigation, ExternalLink } from 'lucide-react';

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
  const [activeCampusId, setActiveCampusId] = useState<string | null>(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);

  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const markers = useRef<L.Marker[]>([]);

  // Derive selectedCampus synchronously using useMemo - eliminates all race conditions
  const selectedCampus = useMemo(() => {
    if (!isOpen || campuses.length === 0) return null;
    const targetId = activeCampusId || initialCampusId;
    return campuses.find(c => c.id === targetId) || campuses[0];
  }, [isOpen, campuses, initialCampusId, activeCampusId]);

  // Reset states when modal closes
  useEffect(() => {
    if (!isOpen) {
      console.log('Modal closed, resetting map state');
      setIsMapLoaded(false);
      setActiveCampusId(null);
    }
  }, [isOpen]);

  // Initialize map ONCE when modal opens
  useEffect(() => {
    if (!isOpen || !mapContainer.current) return;
    
    // Only create map if it doesn't exist
    if (map.current) return;

    console.log('Creating map instance');
    setIsMapLoaded(false);

    const timeoutId = setTimeout(() => {
      if (!mapContainer.current) return;

      try {
        const newMap = L.map(mapContainer.current, {
          center: [49.798294, 10.004028], // Default center of Germany, will be updated by campus effect
          zoom: 14,
          scrollWheelZoom: true,
        });

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors',
          maxZoom: 19,
        }).addTo(newMap);

        map.current = newMap;

        setTimeout(() => {
          newMap.invalidateSize();
          setIsMapLoaded(true);
          console.log('Map initialized successfully');
        }, 100);
      } catch (error) {
        console.error('Error creating map:', error);
        setIsMapLoaded(true);
      }
    }, 200);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [isOpen]); // Only depend on isOpen!

  // Cleanup map when modal closes
  useEffect(() => {
    return () => {
      if (!isOpen && map.current) {
        map.current.remove();
        map.current = null;
        markers.current = [];
      }
    };
  }, [isOpen]);

  // Update map view and markers when campus changes (don't recreate map!)
  useEffect(() => {
    if (!map.current || !isMapLoaded || !selectedCampus?.lat || !selectedCampus?.lng) return;

    console.log('Updating map for campus:', selectedCampus.name || selectedCampus.city);

    // Remove old campus markers
    markers.current.forEach(marker => marker.remove());
    markers.current = [];

    // Update map center with smooth animation
    map.current.setView([selectedCampus.lat, selectedCampus.lng], 14, { animate: true });

    // Add new campus marker
    const campusIcon = L.divIcon({
      className: 'custom-campus-marker',
      html: '<div style="background-color: hsl(var(--primary)); color: white; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);">🎓</div>',
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    });

    const mainMarker = L.marker([selectedCampus.lat, selectedCampus.lng], {
      icon: campusIcon,
    })
      .addTo(map.current)
      .bindPopup(
        selectedCampus.name 
          ? `<b>${selectedCampus.name}</b><br/>${selectedCampus.city || ''}` 
          : `<b>Campus</b><br/>${selectedCampus.city || ''}`
      );

    markers.current = [mainMarker];
  }, [selectedCampus?.id, selectedCampus?.lat, selectedCampus?.lng, selectedCampus?.name, selectedCampus?.city, isMapLoaded]);

  // Only return null if modal is closed AND no campus selected
  if (!selectedCampus && !isOpen) return null;
  
  // Show loading state if modal is open but campus not ready
  if (!selectedCampus && isOpen) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-6xl h-[85vh]">
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
              <p className="text-sm text-muted-foreground">Loading campus information...</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }



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
            onValueChange={setActiveCampusId}
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
