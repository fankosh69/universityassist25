import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Upload, Download, FileText, AlertCircle, CheckCircle2, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface CSVResult {
  success: boolean;
  processedRows: number;
  errors: Array<{
    row: number;
    error: string;
    data?: any;
  }>;
  successfulPrograms?: Array<{
    name: string;
    university: string;
  }>;
}

export const CSVProgramsUpload = () => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<CSVResult | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const generateCSVTemplate = () => {
    const headers = [
      'program_name',
      'university_id', 
      'field_of_study',
      'degree_type',
      'degree_level',
      'duration_semesters',
      'ects_credits',
      'semester_fees',
      'minimum_gpa',
      'language_of_instruction',
      'language_requirements',
      'prerequisites',
      'application_method',
      'uni_assist_required',
      'recognition_weeks_before',
      'program_url',
      'delivery_mode',
      'description',
      'published',
      'intake_season',
      'application_start_date',
      'application_end_date',
      'semester_start_date',
      'notes'
    ];

    const sampleData = [
      [
        'Computer Science Bachelor',
        '550e8400-e29b-41d4-a716-446655440000', // Sample UUID - replace with actual
        'Computer Science',
        'B.Sc.',
        'bachelor',
        '6',
        '180',
        '350',
        '2.5',
        'de,en',
        'DSH-2,TestDaF',
        'Mathematics,Physics',
        'direct',
        'false',
        '10',
        'https://university.com/cs-program',
        'on_campus',
        'Comprehensive computer science program',
        'true',
        'winter',
        '01/11/2024',
        '15/01/2025',
        '01/04/2025',
        'Application period for winter intake 2025'
      ]
    ];

    const csvContent = [
      headers.join(','),
      ...sampleData.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'programs_template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    toast({
      title: "Template Downloaded",
      description: "CSV template has been downloaded successfully",
    });
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
        toast({
          title: "Invalid File Type",
          description: "Please select a CSV file",
          variant: "destructive",
        });
        return;
      }
      setSelectedFile(file);
      setResult(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast({
        title: "No File Selected",
        description: "Please select a CSV file first",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    setProgress(0);

    try {
      // Read file content
      const fileContent = await selectedFile.text();
      
      // Simulate progress
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      // Call the edge function
      const { data, error } = await supabase.functions.invoke('ingest-programs-bulk', {
        body: {
          csvContent: fileContent,
          fileName: selectedFile.name
        }
      });

      clearInterval(progressInterval);
      setProgress(100);

      if (error) throw error;

      setResult(data);
      
      if (data.success) {
        toast({
          title: "Upload Successful",
          description: `${data.processedRows} programs processed successfully`,
        });
      } else {
        toast({
          title: "Upload Completed with Errors",
          description: `${data.errors.length} errors found in the CSV`,
          variant: "destructive",
        });
      }

    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload Failed",
        description: "Failed to process CSV file",
        variant: "destructive",
      });
      setResult({
        success: false,
        processedRows: 0,
        errors: [{
          row: 0,
          error: `Upload failed: ${error.message || 'Unknown error'}`
        }]
      });
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  const downloadErrorReport = () => {
    if (!result || !result.errors.length) return;

    const headers = ['Row', 'Error', 'Data'];
    const csvContent = [
      headers.join(','),
      ...result.errors.map(err => [
        err.row,
        `"${err.error.replace(/"/g, '""')}"`,
        err.data ? `"${JSON.stringify(err.data).replace(/"/g, '""')}"` : ''
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'program_upload_errors.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Bulk Programs Upload (CSV)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        
        {/* Template Download */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Step 1: Download Template</Label>
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={generateCSVTemplate}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Download CSV Template
            </Button>
            <p className="text-sm text-muted-foreground">
              Download the template with sample data and required format
            </p>
          </div>
        </div>

        {/* File Upload */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Step 2: Upload Filled CSV</Label>
          <div className="space-y-3">
            <Input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileSelect}
              className="cursor-pointer"
            />
            
            {selectedFile && (
              <div className="flex items-center gap-2 p-3 bg-accent rounded-lg">
                <FileText className="h-4 w-4" />
                <span className="text-sm">{selectedFile.name}</span>
                <Badge variant="secondary">{(selectedFile.size / 1024).toFixed(1)} KB</Badge>
              </div>
            )}

            <Button
              onClick={handleUpload}
              disabled={!selectedFile || uploading}
              className="w-full"
            >
              {uploading ? 'Processing...' : 'Upload Programs'}
            </Button>
          </div>
        </div>

        {/* Progress */}
        {uploading && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Processing CSV...</span>
              <span>{progress}%</span>
            </div>
            <Progress value={progress} className="w-full" />
          </div>
        )}

        {/* Results */}
        {result && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              {result.success ? (
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              ) : (
                <XCircle className="h-5 w-5 text-red-600" />
              )}
              <span className="font-medium">
                {result.success ? 'Upload Successful' : 'Upload Completed with Errors'}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <p className="text-sm font-medium">Summary</p>
                <div className="space-y-1 text-sm">
                  <div>Total Rows: {result.processedRows}</div>
                  <div className="text-green-600">
                    Successful: {result.successfulPrograms?.length || 0}
                  </div>
                  <div className="text-red-600">
                    Errors: {result.errors.length}
                  </div>
                </div>
              </div>

              {result.errors.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Actions</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={downloadErrorReport}
                    className="flex items-center gap-2"
                  >
                    <Download className="h-4 w-4" />
                    Download Error Report
                  </Button>
                </div>
              )}
            </div>

            {/* Error Details */}
            {result.errors.length > 0 && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-2">
                    <p className="font-medium">Errors Found:</p>
                    <div className="max-h-32 overflow-y-auto space-y-1">
                      {result.errors.slice(0, 5).map((error, index) => (
                        <div key={index} className="text-sm">
                          Row {error.row}: {error.error}
                        </div>
                      ))}
                      {result.errors.length > 5 && (
                        <div className="text-sm text-muted-foreground">
                          ... and {result.errors.length - 5} more errors
                        </div>
                      )}
                    </div>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {/* Successful Programs */}
            {result.successfulPrograms && result.successfulPrograms.length > 0 && (
              <Alert>
                <CheckCircle2 className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-2">
                    <p className="font-medium">Successfully Added Programs:</p>
                    <div className="max-h-32 overflow-y-auto space-y-1">
                      {result.successfulPrograms.slice(0, 5).map((program, index) => (
                        <div key={index} className="text-sm">
                          {program.name} at {program.university}
                        </div>
                      ))}
                      {result.successfulPrograms.length > 5 && (
                        <div className="text-sm text-muted-foreground">
                          ... and {result.successfulPrograms.length - 5} more programs
                        </div>
                      )}
                    </div>
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        {/* Instructions */}
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <p className="font-medium">Important Notes:</p>
              <ul className="text-sm space-y-1 list-disc list-inside">
                <li>Use comma-separated values for arrays (languages, prerequisites)</li>
                <li>Date format should be DD/MM/YYYY</li>
                <li>Boolean values should be "true" or "false"</li>
                <li>University ID must exist in the database</li>
                <li>One application period per row (create separate rows for winter/summer)</li>
              </ul>
            </div>
          </AlertDescription>
        </Alert>

      </CardContent>
    </Card>
  );
};