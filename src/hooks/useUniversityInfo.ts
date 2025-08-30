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
        const { data: result, error } = await supabase.functions.invoke('university-info-enricher', {
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
        
        // Provide fallback data
        setData({
          name: universityName,
          city: city,
          totalStudents: 25000,
          internationalStudentPercentage: 15,
          numberOfCampuses: 1,
          generalInfo: `${universityName} is a university located in ${city}, Germany, offering various academic programs to both domestic and international students.`,
          researchAreas: ['Engineering', 'Sciences', 'Humanities']
        });
      } finally {
        setLoading(false);
      }
    };

    fetchUniversityInfo();
  }, [universityName, city]);

  return { data, loading, error };
}