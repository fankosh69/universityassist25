/**
 * German GPA Converter Component
 * Interactive tool for converting international GPAs to German scale
 */

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { convertToGermanGPA, GPA_SCALES, getEligibilityStatus, type GPAInput } from '@/lib/gpa-conversion';
import { Calculator, Info, TrendingUp, AlertTriangle } from 'lucide-react';

interface GermanGPAConverterProps {
  onConversionComplete?: (germanGPA: number) => void;
  defaultValues?: Partial<GPAInput>;
}

export function GermanGPAConverter({ onConversionComplete, defaultValues }: GermanGPAConverterProps) {
  const [input, setInput] = useState<GPAInput>({
    gradeAchieved: defaultValues?.gradeAchieved || 0,
    maxGrade: defaultValues?.maxGrade || 4.0,
    minPassGrade: defaultValues?.minPassGrade || 2.0
  });
  
  const [result, setResult] = useState<ReturnType<typeof convertToGermanGPA> | null>(null);
  const [error, setError] = useState<string>('');

  const handlePresetSelect = (preset: keyof typeof GPA_SCALES) => {
    const scale = GPA_SCALES[preset];
    setInput(prev => ({
      ...prev,
      maxGrade: scale.max,
      minPassGrade: scale.min
    }));
    setResult(null);
    setError('');
  };

  const handleConvert = () => {
    try {
      setError('');
      const conversionResult = convertToGermanGPA(input);
      setResult(conversionResult);
      onConversionComplete?.(conversionResult.germanGPA);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Conversion failed');
      setResult(null);
    }
  };

  const eligibilityStatus = result ? getEligibilityStatus(result.germanGPA) : null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent': return 'bg-green-100 text-green-800';
      case 'good': return 'bg-blue-100 text-blue-800';
      case 'satisfactory': return 'bg-yellow-100 text-yellow-800';
      case 'sufficient': return 'bg-orange-100 text-orange-800';
      case 'borderline': return 'bg-orange-100 text-orange-800';
      case 'poor': case 'insufficient': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="h-5 w-5" />
          German GPA Converter
        </CardTitle>
        <CardDescription>
          Convert your international GPA to the German grading scale using the Modified Bavarian Formula
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Preset Scales */}
        <div>
          <Label className="text-sm font-medium">Quick Presets</Label>
          <div className="grid grid-cols-2 gap-2 mt-2">
            {Object.entries(GPA_SCALES).map(([key, scale]) => (
              <Button
                key={key}
                variant="outline"
                size="sm"
                onClick={() => handlePresetSelect(key as keyof typeof GPA_SCALES)}
                className="text-xs"
              >
                {scale.name}
              </Button>
            ))}
          </div>
        </div>

        {/* Manual Input */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="achieved">Your Grade</Label>
            <Input
              id="achieved"
              type="number"
              step="0.01"
              value={input.gradeAchieved || ''}
              onChange={(e) => setInput(prev => ({ ...prev, gradeAchieved: parseFloat(e.target.value) || 0 }))}
              placeholder="e.g., 3.5"
            />
          </div>
          
          <div>
            <Label htmlFor="max">Maximum Grade</Label>
            <Input
              id="max"
              type="number"
              step="0.01"
              value={input.maxGrade || ''}
              onChange={(e) => setInput(prev => ({ ...prev, maxGrade: parseFloat(e.target.value) || 0 }))}
              placeholder="e.g., 4.0"
            />
          </div>
          
          <div>
            <Label htmlFor="min">Minimum Pass</Label>
            <Input
              id="min"
              type="number"
              step="0.01"
              value={input.minPassGrade || ''}
              onChange={(e) => setInput(prev => ({ ...prev, minPassGrade: parseFloat(e.target.value) || 0 }))}
              placeholder="e.g., 2.0"
            />
          </div>
        </div>

        <Button 
          className="w-full" 
          onClick={handleConvert}
          disabled={!input.gradeAchieved || !input.maxGrade || !input.minPassGrade}
        >
          Convert to German GPA
        </Button>

        {/* Error Display */}
        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Results */}
        {result && (
          <div className="space-y-4">
            <div className="p-4 bg-primary/5 rounded-lg border">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">German GPA</span>
                <Badge className={getStatusColor(result.status)}>
                  {result.status.charAt(0).toUpperCase() + result.status.slice(1)}
                </Badge>
              </div>
              
              <div className="text-3xl font-bold text-primary mb-2">
                {result.germanGPA}
              </div>
              
              <div className="text-sm text-muted-foreground">
                <div className="font-mono text-xs mb-1">
                  {result.formula}
                </div>
                <p>{result.explanation}</p>
              </div>
            </div>

            {eligibilityStatus && (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  <strong>{eligibilityStatus.status.charAt(0).toUpperCase() + eligibilityStatus.status.slice(1)} Status:</strong> {eligibilityStatus.message}
                </AlertDescription>
              </Alert>
            )}

            {/* German Grade Scale Reference */}
            <div className="p-3 bg-muted/30 rounded-lg text-sm">
              <h4 className="font-medium mb-2">German Grading Scale Reference:</h4>
              <div className="grid grid-cols-2 gap-1 text-xs">
                <div>1.0 - 1.5: Excellent (sehr gut)</div>
                <div>1.6 - 2.5: Good (gut)</div>
                <div>2.6 - 3.5: Satisfactory (befriedigend)</div>
                <div>3.6 - 4.0: Sufficient (ausreichend)</div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}