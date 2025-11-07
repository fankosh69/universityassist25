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
import { Toggle } from '@/components/ui/toggle';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MapPin, Users, Building2, Navigation, ExternalLink, Loader2, AlertCircle } from 'lucide-react';
import { 
  fetchNearbyAmenities, 
  formatDistance, 
  getCategoryIcon, 
  getCategoryLabel,
  type NearbyAmenity 
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
  console.log('🔵 CampusDetailModal rendered', { isOpen, campusCount: campuses.length });
  
  const [activeCampusId, setActiveCampusId] = useState<string | null>(null);
  const [mapLoadFailed, setMapLoadFailed] = useState(false);
  const [isMapReady, setIsMapReady] = useState(false);

  const mapContainer = useRef<HTMLDivElement | null>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const campusMarkerRef = useRef<L.Marker | null>(null);

  const selectedCampus = useMemo(() => {
    if (!isOpen || campuses.length === 0) return null;
    const targetId = activeCampusId || initialCampusId;
    return campuses.find(c => c.id === targetId) || campuses[0];
  }, [isOpen, campuses, initialCampusId, activeCampusId]);

  // Function to initialize the map
  const initializeMap = () => {
    if (mapInstance.current || !mapContainer.current) {
      console.log('⚠️ Cannot initialize:', { 
        hasMap: !!mapInstance.current, 
        hasContainer: !!mapContainer.current 
      });
      return;
    }

    const isVisible = mapContainer.current.offsetWidth > 0 && 
                      mapContainer.current.offsetHeight > 0;
    
    console.log('📐 Container dimensions:', {
      width: mapContainer.current.offsetWidth,
      height: mapContainer.current.offsetHeight,
      isVisible
    });

    if (!isVisible) {
      console.log('❌ Container not visible');
      return;
    }

    try {
      console.log('🗺️ Creating map...');
      const map = L.map(mapContainer.current, {
        center: [49.798294, 10.004028],
        zoom: 14,
        scrollWheelZoom: true,
      });

      const tileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19,
      });

      tileLayer.on('loading', () => console.log('🔄 Tiles loading...'));
      tileLayer.on('load', () => console.log('✅ Tiles loaded'));
      tileLayer.on('tileerror', (err) => console.error('❌ Tile error:', err));
      
      tileLayer.addTo(map);
      mapInstance.current = map;

      map.whenReady(() => {
        console.log('✅ Map ready');
        // Multiple invalidateSize calls at staggered intervals to account for dialog animation
        setTimeout(() => {
          map.invalidateSize(true);
          // Manually redraw all tile layers
          map.eachLayer(layer => {
            if (layer instanceof L.TileLayer) {
              console.log('🔄 Redrawing tile layer');
              layer.redraw();
            }
          });
        }, 50);
        setTimeout(() => map.invalidateSize(true), 100);
        setTimeout(() => map.invalidateSize(true), 200);
        setTimeout(() => map.invalidateSize(true), 500);
        setIsMapReady(true);
      });

    } catch (error) {
      console.error('💥 Map initialization error:', error);
      setMapLoadFailed(true);
    }
  };

  // Cleanup map when modal closes
  useEffect(() => {
    if (!isOpen) {
      console.log('🔴 Cleaning up map');
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
      campusMarkerRef.current = null;
      setActiveCampusId(null);
      setMapLoadFailed(false);
      setIsMapReady(false);
    }
  }, [isOpen]);

  // Wait for container to become available when modal opens
  useEffect(() => {
    console.log('🟢 Container watch effect triggered', { 
      isOpen, 
      hasContainer: !!mapContainer.current 
    });
    
    if (!isOpen || !mapContainer.current) {
      return;
    }

    // Container is now available, trigger map initialization
    const timer = setTimeout(() => {
      initializeMap();
    }, 50);

    return () => clearTimeout(timer);
  }, [isOpen, mapContainer.current]);

  // Final size recalculation after map is ready
  useEffect(() => {
    if (isMapReady && mapInstance.current) {
      // One final invalidateSize after a longer delay to catch any late animations
      const timer = setTimeout(() => {
        mapInstance.current?.invalidateSize(true);
        console.log('🔄 Final map size recalculation');
      }, 1000); // Increased delay to account for slower dialog animations
      return () => clearTimeout(timer);
    }
  }, [isMapReady]);

  // Update campus marker and view
  useEffect(() => {
    if (!isMapReady || !mapInstance.current || !selectedCampus?.lat || !selectedCampus?.lng) return;

    // Remove old campus marker
    if (campusMarkerRef.current) {
      campusMarkerRef.current.remove();
    }

    // Update view
    mapInstance.current.setView([selectedCampus.lat, selectedCampus.lng], 14, { 
      animate: true,
      duration: 0.5 
    });

    // Force resize after view change
    setTimeout(() => {
      mapInstance.current?.invalidateSize();
    }, 100);

    // Add new campus marker
    const campusIcon = L.divIcon({
      className: 'custom-campus-marker',
      html: '<div style="font-size: 36px;">🎓</div>',
      iconSize: [36, 36],
      iconAnchor: [18, 18],
    });

    const marker = L.marker([selectedCampus.lat, selectedCampus.lng], {
      icon: campusIcon,
    })
      .addTo(mapInstance.current)
      .bindPopup(
        `<strong>${selectedCampus.name || 'Campus'}</strong><br/>${selectedCampus.city || ''}`
      );

    campusMarkerRef.current = marker;
  }, [isMapReady, selectedCampus?.id, selectedCampus?.lat, selectedCampus?.lng]);

  const facilityIcons: Record<string, string> = {
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
    return key ? facilityIcons[key] : facilityIcons.default;
  };

  if (!isOpen) return null;

  if (!selectedCampus) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-5xl max-h-[90vh]">
          <div className="flex items-center justify-center p-8">
            <Loader2 className="w-8 h-8 animate-spin" />
            <span className="ml-2">Loading campus information...</span>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Campus Location
          </DialogTitle>
          <DialogDescription>
            Explore the campus location and facilities
          </DialogDescription>
        </DialogHeader>

        {campuses.length > 1 && (
          <Tabs value={selectedCampus.id} onValueChange={setActiveCampusId}>
            <TabsList className="w-full">
              {campuses.map((campus) => (
                <TabsTrigger key={campus.id} value={campus.id} className="flex-1">
                  {campus.name || campus.city}
                  {campus.is_main_campus && <Badge className="ml-2">Main</Badge>}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4" style={{ height: '600px' }}>
          <div className="lg:col-span-2 relative rounded-lg overflow-hidden border" style={{ height: '600px' }}>
            {mapLoadFailed && (
              <div className="absolute inset-0 z-[2000] bg-background/80 backdrop-blur-sm flex items-center justify-center">
                <div className="text-center p-6 bg-card rounded-lg shadow-lg max-w-md">
                  <AlertCircle className="w-12 h-12 mx-auto mb-4 text-destructive" />
                  <h3 className="font-semibold text-lg mb-2">Map Loading Failed</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Unable to load the interactive map. Please check your internet connection or try again.
                  </p>
                  <Button 
                    onClick={() => {
                      setMapLoadFailed(false);
                      if (mapInstance.current) {
                        mapInstance.current.remove();
                        mapInstance.current = null;
                      }
                      window.location.reload();
                    }}
                  >
                    Retry
                  </Button>
                </div>
              </div>
            )}
            
            <div
              ref={mapContainer}
              style={{ 
                width: '100%', 
                height: '600px',
                position: 'relative',
                zIndex: 1
              }}
              className="leaflet-container"
            />
          </div>

          <ScrollArea style={{ height: '600px' }}>
            <div className="space-y-4 pr-4">
              <div>
                <h3 className="font-semibold text-lg mb-2">{selectedCampus.name || 'Campus'}</h3>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="w-4 h-4" />
                  <span>{selectedCampus.city}, Germany</span>
                </div>
                {selectedCampus.student_count && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                    <Users className="w-4 h-4" />
                    <span>{selectedCampus.student_count.toLocaleString()} students</span>
                  </div>
                )}
              </div>

              {selectedCampus.facilities && selectedCampus.facilities.length > 0 && (
                <div>
                  <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                    <Building2 className="w-4 h-4" />
                    Campus Facilities
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedCampus.facilities.map((facility, index) => (
                      <Badge key={index} variant="secondary">
                        {getFacilityIcon(facility)}
                        <span className="ml-1">{facility}</span>
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                  <Navigation className="w-4 h-4" />
                  Getting There
                </h4>
                <div className="space-y-2">
                  <Button variant="outline" size="sm" className="w-full" asChild>
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${selectedCampus.lat},${selectedCampus.lng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="w-4 w-4 mr-2" />
                      Directions via Google Maps
                    </a>
                  </Button>
                  <Button variant="outline" size="sm" className="w-full" asChild>
                    <a
                      href={`https://www.openstreetmap.org/directions?from=&to=${selectedCampus.lat}%2C${selectedCampus.lng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Directions via OpenStreetMap
                    </a>
                  </Button>
                </div>
              </div>
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}
