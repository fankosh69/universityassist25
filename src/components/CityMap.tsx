import React from 'react';
import UniversalMap from '@/components/UniversalMap';

type City = { name: string; slug: string; lat?: number|null; lng?: number|null };

export default function CityMap({ city, className }: { city: City; className?: string }) {
  const hasCoordinates = typeof city.lat === "number" && typeof city.lng === "number";

  if (!hasCoordinates) {
    return (
      <div className={`w-full ${className || ''}`}>
        <div className="flex flex-col items-center justify-center border rounded-xl bg-muted p-8" style={{ height: 380 }}>
          <h3 className="text-lg font-semibold text-foreground mb-2">Map Location Pending</h3>
          <p className="text-muted-foreground text-center">
            Map will appear once coordinates are confirmed for {city.name}.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`w-full ${className || ''}`}>
      <UniversalMap
        latitude={city.lat!}
        longitude={city.lng!}
        locationName={city.name}
        zoom={11}
        height={380}
      />
    </div>
  );
}
