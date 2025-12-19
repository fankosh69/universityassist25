import React from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  GermanLanguageRequirements, 
  GERMAN_CEFR_LEVELS, 
  GERMAN_CERTIFICATE_TYPES,
  GermanCertificateType
} from '@/types/language-requirements';

interface GermanLanguageRequirementsFormProps {
  value: GermanLanguageRequirements | null;
  onChange: (value: GermanLanguageRequirements | null) => void;
  showBasicLevelsOnly?: boolean; // For "mostly_english" mode, show only A1/A2
}

const EXTENDED_LEVELS = [
  ...GERMAN_CEFR_LEVELS.map(l => ({ value: l, label: l })),
  { value: 'DSH-1', label: 'DSH-1' },
  { value: 'DSH-2', label: 'DSH-2' },
  { value: 'DSH-3', label: 'DSH-3' },
  { value: 'TestDaF-3', label: 'TestDaF TDN 3' },
  { value: 'TestDaF-4', label: 'TestDaF TDN 4' },
  { value: 'TestDaF-5', label: 'TestDaF TDN 5' }
];

const BASIC_LEVELS = [
  { value: 'A1', label: 'A1 (Beginner)' },
  { value: 'A2', label: 'A2 (Elementary)' }
];

export function GermanLanguageRequirementsForm({
  value,
  onChange,
  showBasicLevelsOnly = false
}: GermanLanguageRequirementsFormProps) {
  const levels = showBasicLevelsOnly ? BASIC_LEVELS : EXTENDED_LEVELS;
  
  const handleLevelChange = (level: string) => {
    onChange({
      required_level: level as GermanLanguageRequirements['required_level'],
      accepts_certificates: value?.accepts_certificates || ['Goethe', 'TestDaF', 'DSH'],
      notes: value?.notes
    });
  };
  
  const handleCertificateChange = (cert: GermanCertificateType, checked: boolean) => {
    const currentCerts = value?.accepts_certificates || [];
    const newCerts = checked
      ? [...currentCerts, cert]
      : currentCerts.filter(c => c !== cert);
    
    onChange({
      required_level: value?.required_level || 'B1',
      accepts_certificates: newCerts,
      notes: value?.notes
    });
  };
  
  const handleNotesChange = (notes: string) => {
    if (!value) return;
    onChange({
      ...value,
      notes: notes || undefined
    });
  };
  
  return (
    <Card className="border-amber-200 bg-amber-50/30">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          🇩🇪 German Language Requirements
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label>Required German Level</Label>
          <Select 
            value={value?.required_level || ''} 
            onValueChange={handleLevelChange}
          >
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Select required level..." />
            </SelectTrigger>
            <SelectContent>
              {levels.map(level => (
                <SelectItem key={level.value} value={level.value}>
                  {level.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {showBasicLevelsOnly && (
            <p className="text-xs text-muted-foreground mt-1">
              Basic German for everyday communication and university life
            </p>
          )}
        </div>
        
        <div>
          <Label className="mb-2 block">Accepted Certificates</Label>
          <div className="grid grid-cols-2 gap-2">
            {GERMAN_CERTIFICATE_TYPES.map(cert => (
              <div key={cert.value} className="flex items-center space-x-2">
                <Checkbox
                  id={`german-cert-${cert.value}`}
                  checked={value?.accepts_certificates?.includes(cert.value) || false}
                  onCheckedChange={(checked) => 
                    handleCertificateChange(cert.value, !!checked)
                  }
                />
                <Label 
                  htmlFor={`german-cert-${cert.value}`}
                  className="text-sm font-normal cursor-pointer"
                >
                  {cert.label}
                </Label>
              </div>
            ))}
          </div>
        </div>
        
        <div>
          <Label htmlFor="german-notes">Additional Notes (optional)</Label>
          <Textarea
            id="german-notes"
            value={value?.notes || ''}
            onChange={(e) => handleNotesChange(e.target.value)}
            placeholder="e.g., Certificate must be submitted before enrollment..."
            className="mt-1"
            rows={2}
          />
        </div>
      </CardContent>
    </Card>
  );
}
