import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Info, BookOpen } from 'lucide-react';
import { GermanLanguageRequirements, GERMAN_CERTIFICATE_TYPES } from '@/types/language-requirements';

interface GermanLanguageRequirementsCardProps {
  requirements: GermanLanguageRequirements | null;
  className?: string;
}

export function GermanLanguageRequirementsCard({ 
  requirements,
  className 
}: GermanLanguageRequirementsCardProps) {
  if (!requirements) return null;
  
  const getCertificateLabel = (value: string) => {
    return GERMAN_CERTIFICATE_TYPES.find(c => c.value === value)?.label || value;
  };
  
  // Determine if this is a basic level (A1/A2) or advanced
  const isBasicLevel = requirements.required_level === 'A1' || requirements.required_level === 'A2';
  
  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <span className="text-xl">🇩🇪</span>
          German Language Requirements
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Required Level */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-amber-50 border border-amber-200">
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-amber-600" />
            <span className="font-medium">Required Level</span>
          </div>
          <Badge variant="secondary" className="text-base font-bold bg-amber-100 text-amber-800">
            {requirements.required_level}
          </Badge>
        </div>
        
        {/* Level description */}
        {isBasicLevel && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-50 border border-blue-200">
            <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-blue-800">
              {requirements.required_level === 'A1' && 
                'Basic German for everyday phrases and simple interactions. Sufficient for daily life and university orientation.'}
              {requirements.required_level === 'A2' && 
                'Elementary German for routine tasks and simple communication. Helps with campus life and basic conversations.'}
            </p>
          </div>
        )}
        
        {/* Accepted Certificates */}
        {requirements.accepts_certificates && requirements.accepts_certificates.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-2 flex items-center gap-1">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              Accepted Certificates
            </h4>
            <div className="flex flex-wrap gap-2">
              {requirements.accepts_certificates.map(cert => (
                <Badge key={cert} variant="outline" className="text-xs">
                  {getCertificateLabel(cert)}
                </Badge>
              ))}
            </div>
          </div>
        )}
        
        {/* Notes */}
        {requirements.notes && (
          <div className="p-3 rounded-lg bg-muted/50 text-sm">
            <p className="text-muted-foreground">{requirements.notes}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
