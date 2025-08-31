import { supabase } from '@/integrations/supabase/client';

interface PopulationData {
  population: number;
  year: number;
  source: string;
}

export class CityPopulationService {
  private static readonly BASE_URL = 'https://www.citypopulation.de/en/germany';
  
  /**
   * Generate possible URLs for a city based on common patterns
   */
  private static generateCityUrls(cityName: string, region?: string): string[] {
    const normalizedCity = cityName.toLowerCase()
      .replace(/ä/g, 'a')
      .replace(/ö/g, 'o')
      .replace(/ü/g, 'u')
      .replace(/ß/g, 'ss')
      .replace(/[^a-z0-9]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '');

    const urls: string[] = [];
    
    // Common URL patterns based on region
    const regions = [
      'nordrheinwestfalen',
      'bayern',
      'badenwuerttemberg',
      'niedersachsen',
      'hessen',
      'sachsen',
      'thueringen',
      'rheinlandpfalz',
      'schleswigholstein',
      'saarland',
      'brandenburg',
      'sachsenanhalt',
      'mecklenburgvorpommern'
    ];

    regions.forEach(reg => {
      urls.push(`${this.BASE_URL}/${reg}/${reg}/`);
      urls.push(`${this.BASE_URL}/${reg}/${normalizedCity}/`);
    });

    return urls;
  }

  /**
   * Extract population data from citypopulation.de page content
   */
  private static extractPopulationFromContent(content: string): PopulationData | null {
    try {
      // Look for population pattern: "262,670Population [2024] – Estimate"
      const populationRegex = /(\d{1,3}(?:,\d{3})*)Population\s*\[(\d{4})\]/i;
      const match = content.match(populationRegex);
      
      if (match) {
        const population = parseInt(match[1].replace(/,/g, ''));
        const year = parseInt(match[2]);
        
        return {
          population,
          year,
          source: 'citypopulation.de'
        };
      }

      // Alternative pattern in tables
      const tableRegex = /\|\s*\d{4}-12-31\s*\|\s*(\d{1,3}(?:,\d{3})*)\s*\|[^|]*\|\s*$/gm;
      let latestPopulation = 0;
      let latestYear = 0;
      
      let tableMatch;
      while ((tableMatch = tableRegex.exec(content)) !== null) {
        const pop = parseInt(tableMatch[1].replace(/,/g, ''));
        if (pop > latestPopulation) {
          latestPopulation = pop;
          latestYear = 2024; // Assuming latest data
        }
      }
      
      if (latestPopulation > 0) {
        return {
          population: latestPopulation,
          year: latestYear,
          source: 'citypopulation.de'
        };
      }

      return null;
    } catch (error) {
      console.error('Error extracting population data:', error);
      return null;
    }
  }

  /**
   * Fetch population data for a specific city
   */
  public static async fetchCityPopulation(cityName: string, region?: string): Promise<PopulationData | null> {
    try {
      console.log(`Fetching population for ${cityName}...`);
      
      // Check known cities first
      const knownData = this.getKnownCityData(cityName);
      if (knownData) {
        return knownData;
      }

      // For real implementation, you would need to use a web scraping service
      // For now, return null as we can't directly scrape from the browser
      console.warn('Web scraping from browser not implemented. Use server-side implementation.');
      return null;
      
    } catch (error) {
      console.error(`Error fetching population for ${cityName}:`, error);
      return null;
    }
  }

  /**
   * Get known population data for major German cities
   */
  private static getKnownCityData(cityName: string): PopulationData | null {
    const knownCities: Record<string, PopulationData> = {
      'Aachen': { population: 262670, year: 2024, source: 'citypopulation.de' },
      'Dortmund': { population: 603462, year: 2024, source: 'citypopulation.de' },
      'Berlin': { population: 3677472, year: 2024, source: 'citypopulation.de' },
      'Hamburg': { population: 1945229, year: 2024, source: 'citypopulation.de' },
      'Munich': { population: 1512491, year: 2024, source: 'citypopulation.de' },
      'München': { population: 1512491, year: 2024, source: 'citypopulation.de' },
      'Cologne': { population: 1073096, year: 2024, source: 'citypopulation.de' },
      'Köln': { population: 1073096, year: 2024, source: 'citypopulation.de' },
      'Frankfurt am Main': { population: 753056, year: 2024, source: 'citypopulation.de' },
      'Stuttgart': { population: 632743, year: 2024, source: 'citypopulation.de' },
      'Düsseldorf': { population: 629047, year: 2024, source: 'citypopulation.de' },
      'Leipzig': { population: 597493, year: 2024, source: 'citypopulation.de' },
      'Essen': { population: 579432, year: 2024, source: 'citypopulation.de' },
      'Bremen': { population: 567559, year: 2024, source: 'citypopulation.de' },
      'Dresden': { population: 563311, year: 2024, source: 'citypopulation.de' },
      'Hannover': { population: 545045, year: 2024, source: 'citypopulation.de' },
      'Nuremberg': { population: 545068, year: 2024, source: 'citypopulation.de' },
      'Nürnberg': { population: 545068, year: 2024, source: 'citypopulation.de' },
      'Duisburg': { population: 504358, year: 2024, source: 'citypopulation.de' },
      'Bochum': { population: 364454, year: 2024, source: 'citypopulation.de' },
      'Bonn': { population: 336465, year: 2024, source: 'citypopulation.de' },
      'Bielefeld': { population: 334002, year: 2024, source: 'citypopulation.de' },
      'Mannheim': { population: 309817, year: 2024, source: 'citypopulation.de' },
      'Karlsruhe': { population: 308436, year: 2024, source: 'citypopulation.de' },
      'Augsburg': { population: 301033, year: 2024, source: 'citypopulation.de' },
      'Wiesbaden': { population: 278474, year: 2024, source: 'citypopulation.de' },
      'Münster': { population: 317713, year: 2024, source: 'citypopulation.de' },
      'Gelsenkirchen': { population: 262528, year: 2024, source: 'citypopulation.de' }
    };

    return knownCities[cityName] || null;
  }

  /**
   * Update city population data in the database
   */
  public static async updateCityPopulation(cityId: string, populationData: PopulationData): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('cities')
        .update({
          population_total: populationData.population,
          population_asof: `${populationData.year}-12-31`,
          updated_at: new Date().toISOString()
        })
        .eq('id', cityId);

      if (error) {
        console.error('Error updating city population:', error);
        return false;
      }

      console.log(`Updated population for city ${cityId}: ${populationData.population}`);
      return true;
    } catch (error) {
      console.error('Error updating city population:', error);
      return false;
    }
  }

  /**
   * Batch update population data for all cities
   */
  public static async batchUpdateCityPopulations(): Promise<void> {
    try {
      // Fetch all cities without population data
      const { data: cities, error } = await supabase
        .from('cities')
        .select('id, name, region')
        .is('population_total', null);

      if (error || !cities) {
        console.error('Error fetching cities:', error);
        return;
      }

      console.log(`Updating population data for ${cities.length} cities...`);

      // Update cities with known data
      for (const city of cities) {
        const populationData = await this.fetchCityPopulation(city.name, city.region);
        if (populationData) {
          await this.updateCityPopulation(city.id, populationData);
          // Add small delay to avoid overwhelming the database
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      console.log('Finished updating city population data');
    } catch (error) {
      console.error('Error in batch update:', error);
    }
  }
}