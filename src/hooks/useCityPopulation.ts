import { useEffect, useState } from 'react';
import { CityPopulationService } from '@/services/citypopulation';

export function useCityPopulation() {
  const [isUpdating, setIsUpdating] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });

  const updateAllCities = async () => {
    setIsUpdating(true);
    try {
      await CityPopulationService.batchUpdateCityPopulations();
    } catch (error) {
      console.error('Error updating city populations:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  return {
    isUpdating,
    progress,
    updateAllCities
  };
}