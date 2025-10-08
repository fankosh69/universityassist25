import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface UniversityInfo {
  name: string;
  city: string;
  totalStudents?: number;
  internationalStudentPercentage?: number;
  numberOfCampuses?: number;
  establishedYear?: number;
  generalInfo?: string;
  faculties?: string[];
  notableAlumni?: string[];
  researchAreas?: string[];
}

interface UseUniversityInfoResult {
  data: UniversityInfo | null;
  loading: boolean;
  error: string | null;
}

export function useUniversityInfo(universityName: string, city: string): UseUniversityInfoResult {
  const [data, setData] = useState<UniversityInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!universityName || !city) return;

    const fetchUniversityInfo = async () => {
      setLoading(true);
      setError(null);

      try {
        const { data: result, error } = await supabase.functions.invoke('scrape-university-website', {
          body: {
            universityName,
            city
          }
        });

        if (error) throw error;

        if (result.success) {
          setData(result.data);
        } else {
          throw new Error(result.error || 'Failed to fetch university information');
        }
      } catch (err) {
        console.error('Error fetching university info:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch university information');
        
        // Return unknown instead of estimates
        setData({
          name: universityName,
          city: city,
          totalStudents: undefined,
          internationalStudentPercentage: undefined,
          numberOfCampuses: undefined,
          generalInfo: `Information about ${universityName} is not currently available. Please check the official university website.`,
          researchAreas: []
        });
      } finally {
        setLoading(false);
      }
    };

    fetchUniversityInfo();
  }, [universityName, city]);

  return { data, loading, error };
}