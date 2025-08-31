import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { AdminLayout } from '@/components/admin/AdminLayout';

export default function AdminCitiesEnrich() {
  const [enriching, setEnriching] = useState(false);
  const [geocoding, setGeocoding] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleEnrichCities = async () => {
    setEnriching(true);
    setError(null);
    setResults(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('enrich-cities-de');
      
      if (fnError) throw fnError;
      
      setResults(data);
    } catch (err: any) {
      setError(err.message || 'Failed to enrich cities');
    } finally {
      setEnriching(false);
    }
  };

  const handleGeocodeAll = async () => {
    setGeocoding(true);
    setError(null);
    setResults(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('geocode-city', {
        body: { all: 'true' }
      });
      
      if (fnError) throw fnError;
      
      setResults(data);
    } catch (err: any) {
      setError(err.message || 'Failed to geocode cities');
    } finally {
      setGeocoding(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">City Data Enrichment</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Enrich from Wikidata</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Fetch population data and region information for German cities from Wikidata.
                This will update cities that are missing population or region data.
              </p>
              
              <Button 
                onClick={handleEnrichCities}
                disabled={enriching}
                className="w-full"
              >
                {enriching ? 'Enriching Cities...' : 'Enrich Cities (Wikidata)'}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Geocode Missing Coordinates</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Use Mapbox Geocoding API to add coordinates for cities that are missing 
                latitude and longitude data.
              </p>
              
              <Button 
                onClick={handleGeocodeAll}
                disabled={geocoding}
                className="w-full"
                variant="outline"
              >
                {geocoding ? 'Geocoding Cities...' : 'Geocode Missing Coords'}
              </Button>
            </CardContent>
          </Card>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {results && (
          <Card>
            <CardHeader>
              <CardTitle>Results</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p><strong>Updated:</strong> {results.updated || 0} cities</p>
                <p><strong>Skipped:</strong> {results.skipped || 0} cities</p>
                {results.message && (
                  <p className="text-sm text-muted-foreground">{results.message}</p>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
}