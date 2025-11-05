import { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, Building2, Users } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { CampusDetailModal } from './CampusDetailModal';

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

interface ProgramCampusLocationProps {
  campuses: Campus[];
}

export function ProgramCampusLocation({ campuses }: ProgramCampusLocationProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Get primary campus (main campus or first one)
  const primaryCampus = campuses.find(c => c.is_main_campus) || campuses[0];

  useEffect(() => {
    if (!mapContainer.current || !primaryCampus?.lat || !primaryCampus?.lng) return;
    if (map.current) return; // Initialize map only once

    // Create Leaflet map
    map.current = L.map(mapContainer.current, {
      center: [primaryCampus.lat, primaryCampus.lng],
      zoom: 13,
      zoomControl: false,
      dragging: false,
      scrollWheelZoom: false,
      doubleClickZoom: false,
      boxZoom: false,
      keyboard: false,
      attributionControl: false,
    });

    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap',
    }).addTo(map.current);

    // Add marker
    const customIcon = L.divIcon({
      className: 'custom-mini-marker',
      html: '<div style="background-color: #2E57F6; width: 20px; height: 20px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>',
      iconSize: [20, 20],
      iconAnchor: [10, 20],
    });

    L.marker([primaryCampus.lat, primaryCampus.lng], { icon: customIcon })
      .addTo(map.current);

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [primaryCampus]);

  if (!campuses || campuses.length === 0) {
    return null;
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
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <MapPin className="h-4 w-4" />
          Campus Location
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Campus Name */}
        {primaryCampus.name && (
          <div>
            <p className="text-sm font-semibold">{primaryCampus.name}</p>
            {primaryCampus.is_main_campus && (
              <Badge variant="secondary" className="mt-1 text-xs">Main Campus</Badge>
            )}
          </div>
        )}

        {/* City */}
        {primaryCampus.city && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4" />
            <span>{primaryCampus.city}, Germany</span>
          </div>
        )}

        {/* Mini Map - Clickable */}
        {primaryCampus.lat && primaryCampus.lng && (
          <div 
            ref={mapContainer} 
            onClick={() => setIsModalOpen(true)}
            className="h-32 rounded-md border border-border overflow-hidden cursor-pointer hover:border-primary transition-colors"
            role="button"
            tabIndex={0}
            aria-label="Click to explore campus location"
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setIsModalOpen(true);
              }
            }}
          />
        )}

        {/* Explore Location Button */}
        {primaryCampus.lat && primaryCampus.lng && (
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setIsModalOpen(true)}
            className="w-full"
          >
            <MapPin className="h-4 w-4 mr-2" />
            Explore Campus Location
          </Button>
        )}

        {/* Student Count */}
        {primaryCampus.student_count && (
          <div className="flex items-center gap-2 text-sm">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">
              {primaryCampus.student_count.toLocaleString()} students
            </span>
          </div>
        )}

        {/* Facilities */}
        {primaryCampus.facilities && primaryCampus.facilities.length > 0 && (
          <div>
            <div className="flex items-center gap-2 text-sm font-semibold mb-2">
              <Building2 className="h-4 w-4" />
              <span>Campus Facilities</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {primaryCampus.facilities.slice(0, 4).map((facility, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  <span className="mr-1">{getFacilityIcon(facility)}</span>
                  {facility}
                </Badge>
              ))}
              {primaryCampus.facilities.length > 4 && (
                <Badge variant="outline" className="text-xs">
                  +{primaryCampus.facilities.length - 4} more
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Multiple Campuses Indicator */}
        {campuses.length > 1 && (
          <div className="pt-2 border-t">
            <p className="text-xs text-muted-foreground">
              Program offered at {campuses.length} campus locations
            </p>
          </div>
        )}
      </CardContent>

      {/* Campus Detail Modal */}
      <CampusDetailModal
        campuses={campuses}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialCampusId={primaryCampus.id}
      />
    </Card>
  );
}
