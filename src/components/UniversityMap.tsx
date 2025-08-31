import React, { useEffect, useState } from 'react';
import UniversalMap from '@/components/UniversalMap';
import { supabase } from '@/integrations/supabase/client';
import LoadingSpinner from '@/components/LoadingSpinner';

interface UniversityData {
  id: string;
  name: string;
  lat: number;
  lng: number;
  city: string;
}

interface UniversityMapProps {
  universityId: string;
  className?: string;
}

const UniversityMap: React.FC<UniversityMapProps> = ({ universityId, className }) => {
  const [university, setUniversity] = useState<UniversityData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchUniversityData();
  }, [universityId]);

  const fetchUniversityData = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('universities')
        .select('id, name, lat, lng, city')
        .eq('id', universityId)
        .single();

      if (error) throw error;
      setUniversity(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={`w-full ${className || ''}`}>
        <div className="flex items-center justify-center border rounded-xl bg-muted" style={{ height: 380 }}>
          <LoadingSpinner />
          <span className="ml-2 text-muted-foreground">Loading university location...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`w-full ${className || ''}`}>
        <div className="flex items-center justify-center border rounded-xl bg-destructive/10 p-4" style={{ height: 380 }}>
          <p className="text-destructive">Error loading map: {error}</p>
        </div>
      </div>
    );
  }

  if (!university) {
    return (
      <div className={`w-full ${className || ''}`}>
        <div className="flex items-center justify-center border rounded-xl bg-muted p-4" style={{ height: 380 }}>
          <p className="text-muted-foreground">University not found</p>
        </div>
      </div>
    );
  }

  const hasCoordinates = typeof university.lat === "number" && typeof university.lng === "number";

  if (!hasCoordinates) {
    return (
      <div className={`w-full ${className || ''}`}>
        <div className="flex flex-col items-center justify-center border rounded-xl bg-muted p-8" style={{ height: 380 }}>
          <h3 className="text-lg font-semibold text-foreground mb-2">Location Information Pending</h3>
          <p className="text-muted-foreground text-center">
            Map coordinates are being updated for {university.name}.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`w-full ${className || ''}`}>
      <UniversalMap
        latitude={university.lat}
        longitude={university.lng}
        locationName={university.name}
        zoom={15}
        height={380}
      />
      <div className="mt-2 text-sm text-muted-foreground">
        <p><span className="font-medium">{university.name}</span> • {university.city}</p>
      </div>
    </div>
  );
};

export default UniversityMap;