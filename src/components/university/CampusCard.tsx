import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Building2, Users, Bus, Mail, Phone, Globe, ExternalLink, Map } from "lucide-react";
import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { CampusDetailModal } from "@/components/program/CampusDetailModal";

interface CampusCardProps {
  id?: string;
  name?: string | null;
  address?: string | null;
  city?: string | { name: string; slug?: string };
  isMainCampus?: boolean;
  description?: string | null;
  studentCount?: number | null;
  buildingCount?: number | null;
  faculties?: string[] | null;
  photoUrl?: string | null;
  lat?: number | null;
  lng?: number | null;
  email?: string | null;
  phone?: string | null;
  websiteUrl?: string | null;
  transport?: {
    type: string;
    line: string;
    stop: string;
  }[] | null;
  allCampuses?: Array<{
    id: string;
    name: string | null;
    city: string | null;
    lat: number | null;
    lng: number | null;
    is_main_campus: boolean;
    facilities: string[] | null;
    student_count: number | null;
  }>;
  onViewPhotos?: () => void;
}

export function CampusCard({
  id,
  name,
  address,
  city,
  isMainCampus,
  description,
  studentCount,
  buildingCount,
  faculties,
  photoUrl,
  lat,
  lng,
  email,
  phone,
  websiteUrl,
  transport,
  allCampuses,
  onViewPhotos,
}: CampusCardProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const [showMapModal, setShowMapModal] = useState(false);

  const cityName = typeof city === 'string' ? city : city?.name || 'Unknown';
  const displayName = name || 'Main Campus';

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || !lat || !lng || map.current) return;

    // Initialize the map
    map.current = L.map(mapContainer.current, {
      center: [lat, lng],
      zoom: 15,
      zoomControl: true,
      scrollWheelZoom: false,
    });

    // Add tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map.current);

    // Add marker
    const customIcon = L.divIcon({
      className: 'custom-marker',
      html: `
        <div style="
          background-color: #2E57F6;
          width: 32px;
          height: 32px;
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          border: 3px solid white;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          <div style="
            width: 12px;
            height: 12px;
            background-color: white;
            border-radius: 50%;
            transform: rotate(45deg);
          "></div>
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 32],
    });

    L.marker([lat, lng], { icon: customIcon })
      .addTo(map.current)
      .bindPopup(`<strong>${displayName}</strong><br/>${cityName}`);

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [lat, lng, displayName, cityName]);

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      {/* Campus Photo */}
      {photoUrl && (
        <div className="relative h-48 w-full overflow-hidden">
          <img 
            src={photoUrl} 
            alt={name} 
            className="w-full h-full object-cover"
          />
          {isMainCampus && (
            <Badge className="absolute top-3 right-3 bg-primary">
              Main Campus
            </Badge>
          )}
        </div>
      )}

      <div className="p-6">
        {/* Campus Name & Badge */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-xl font-bold text-foreground">
                {displayName}
              </h3>
              {isMainCampus && (
                <Badge className="bg-primary text-primary-foreground">
                  Main Campus
                </Badge>
              )}
            </div>
            {address && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4 flex-shrink-0" />
                <span>{address}, {cityName}</span>
              </div>
            )}
          </div>
        </div>

        {/* Mini Map */}
        {lat && lng && (
          <div className="mb-4 rounded-lg overflow-hidden border">
            <div 
              ref={mapContainer} 
              className="h-48 w-full"
              style={{ cursor: 'grab' }}
            />
          </div>
        )}

        {/* Description */}
        {description && (
          <p className="text-sm text-muted-foreground mb-4">
            {description}
          </p>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-4 mb-4 pb-4 border-b">
          {studentCount && (
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              <div>
                <div className="text-sm font-semibold text-foreground">
                  {studentCount.toLocaleString()}
                </div>
                <div className="text-xs text-muted-foreground">Students</div>
              </div>
            </div>
          )}
          {buildingCount && (
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-secondary" />
              <div>
                <div className="text-sm font-semibold text-foreground">
                  {buildingCount}
                </div>
                <div className="text-xs text-muted-foreground">Buildings</div>
              </div>
            </div>
          )}
        </div>

        {/* Faculties */}
        {faculties && faculties.length > 0 && (
          <div className="mb-4 pb-4 border-b">
            <h4 className="text-sm font-semibold text-foreground mb-2">
              🎓 Faculties:
            </h4>
            <div className="flex flex-wrap gap-1">
              {faculties.slice(0, 5).map((faculty, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {faculty}
                </Badge>
              ))}
              {faculties.length > 5 && (
                <Badge variant="outline" className="text-xs">
                  +{faculties.length - 5} more
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Contact Information */}
        {(email || phone || websiteUrl) && (
          <div className="space-y-2 mb-4 pb-4 border-b">
            <h4 className="text-sm font-semibold text-foreground mb-2">
              📞 Contact:
            </h4>
            {email && (
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                <a href={`mailto:${email}`} className="text-primary hover:underline">
                  {email}
                </a>
              </div>
            )}
            {phone && (
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                <a href={`tel:${phone}`} className="text-muted-foreground hover:text-primary">
                  {phone}
                </a>
              </div>
            )}
            {websiteUrl && (
              <div className="flex items-center gap-2 text-sm">
                <Globe className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                <a 
                  href={websiteUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary hover:underline flex items-center gap-1"
                >
                  Campus Website
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            )}
          </div>
        )}

        {/* Transport */}
        {transport && transport.length > 0 && (
          <div className="mb-4 pb-4 border-b">
            <h4 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
              <Bus className="h-4 w-4" />
              Public Transport:
            </h4>
            <div className="space-y-1">
              {transport.map((t, index) => (
                <div key={index} className="text-xs text-muted-foreground">
                  {t.type} {t.line} - {t.stop}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* View on Map Button */}
        {lat && lng && allCampuses && allCampuses.length > 0 && (
          <Button
            onClick={() => setShowMapModal(true)}
            variant="outline"
            className="w-full"
          >
            <Map className="h-4 w-4 mr-2" />
            View on Interactive Map
          </Button>
        )}
      </div>

      {/* Campus Detail Modal */}
      {allCampuses && allCampuses.length > 0 && id && (
        <CampusDetailModal
          campuses={allCampuses}
          initialCampusId={id}
          isOpen={showMapModal}
          onClose={() => setShowMapModal(false)}
        />
      )}
    </Card>
  );
}
