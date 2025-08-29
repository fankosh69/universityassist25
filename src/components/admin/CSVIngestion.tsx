import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Upload, CheckCircle, AlertCircle } from "lucide-react";

export function CSVIngestion() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleIngest = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const { data, error } = await supabase.functions.invoke('ingest-universities', {
        method: 'POST'
      });

      if (error) throw error;
      setResult(data);
    } catch (err: any) {
      setError(err.message || 'Failed to ingest CSV data');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          CSV Data Ingestion
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-muted-foreground">
          Ingest universities data from the CSV file in Supabase Storage (bucket: ingest, file: Universities_with_Logos.csv).
          This will populate cities and universities with SEO-optimized data.
        </p>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {result && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              Successfully processed: {result.upsertedCities} cities, {result.upsertedUnis} universities
              {result.errors && ` (${result.errors.length} errors)`}
            </AlertDescription>
          </Alert>
        )}

        <Button 
          onClick={handleIngest} 
          disabled={loading}
          className="w-full"
        >
          {loading ? 'Processing...' : 'Ingest CSV Data'}
        </Button>
      </CardContent>
    </Card>
  );
}