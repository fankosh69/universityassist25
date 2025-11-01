import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface Campus {
  id: string;
  name: string;
  lat: number;
  lng: number;
  isMainCampus?: boolean;
}

interface CampusMapProps {
  campuses: Campus[];
  mapboxToken: string;
  className?: string;
}

export function CampusMap({ campuses, mapboxToken, className }: CampusMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!mapContainer.current || !mapboxToken || campuses.length === 0) return;

    mapboxgl.accessToken = mapboxToken;

    // Calculate center and bounds
    const avgLat = campuses.reduce((sum, c) => sum + c.lat, 0) / campuses.length;
    const avgLng = campuses.reduce((sum, c) => sum + c.lng, 0) / campuses.length;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/light-v11",
      center: [avgLng, avgLat],
      zoom: campuses.length === 1 ? 13 : 11,
    });

    map.current.on("load", () => {
      setIsLoading(false);

      // Add markers for each campus
      campuses.forEach((campus) => {
        if (!map.current) return;

        const el = document.createElement("div");
        el.className = "campus-marker";
        el.style.width = campus.isMainCampus ? "40px" : "30px";
        el.style.height = campus.isMainCampus ? "40px" : "30px";
        el.style.borderRadius = "50%";
        el.style.backgroundColor = campus.isMainCampus ? "#2E57F6" : "#5DC6C5";
        el.style.border = "3px solid white";
        el.style.boxShadow = "0 2px 8px rgba(0,0,0,0.2)";
        el.style.cursor = "pointer";

        const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(
          `<div style="padding: 8px;">
            <strong>${campus.name}</strong>
            ${campus.isMainCampus ? '<br/><span style="color: #2E57F6; font-size: 12px;">Main Campus</span>' : ''}
          </div>`
        );

        new mapboxgl.Marker(el)
          .setLngLat([campus.lng, campus.lat])
          .setPopup(popup)
          .addTo(map.current);
      });

      // Fit bounds to show all campuses
      if (campuses.length > 1) {
        const bounds = new mapboxgl.LngLatBounds();
        campuses.forEach((campus) => {
          bounds.extend([campus.lng, campus.lat]);
        });
        map.current.fitBounds(bounds, { padding: 50 });
      }
    });

    return () => {
      map.current?.remove();
    };
  }, [campuses, mapboxToken]);

  if (campuses.length === 0) {
    return (
      <Card className="p-6">
        <p className="text-center text-muted-foreground">
          No campus locations available
        </p>
      </Card>
    );
  }

  return (
    <div className={className}>
      {isLoading && (
        <Skeleton className="w-full h-[500px] rounded-lg" />
      )}
      <div
        ref={mapContainer}
        className="w-full h-[500px] rounded-lg overflow-hidden"
        style={{ display: isLoading ? "none" : "block" }}
      />
    </div>
  );
}
