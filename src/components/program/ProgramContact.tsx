import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ExternalLink, Mail, Phone, Globe, FileText } from 'lucide-react';

interface ProgramContactProps {
  universityName: string;
  universityWebsite?: string;
  programUrl?: string;
  applicationMethod: string;
  uniAssistRequired: boolean;
}

export function ProgramContact({
  universityName,
  universityWebsite,
  programUrl,
  applicationMethod,
  uniAssistRequired,
}: ProgramContactProps) {
  const getApplicationUrl = () => {
    if (programUrl) return programUrl;
    if (uniAssistRequired) return 'https://www.uni-assist.de';
    return universityWebsite || '#';
  };

  return (
    <Card className="border-2 border-primary">
      <CardHeader>
        <CardTitle>Ready to Apply?</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Take the next step in your academic journey. Apply now or get in touch with {universityName} for more information.
          </p>

          {/* Primary Actions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Button asChild size="lg" className="w-full">
              <a href={getApplicationUrl()} target="_blank" rel="noopener noreferrer">
                <FileText className="h-4 w-4 mr-2" />
                Apply Now
                <ExternalLink className="h-3 w-3 ml-2" />
              </a>
            </Button>

            {universityWebsite && (
              <Button asChild variant="outline" size="lg" className="w-full">
                <a href={universityWebsite} target="_blank" rel="noopener noreferrer">
                  <Globe className="h-4 w-4 mr-2" />
                  University Website
                  <ExternalLink className="h-3 w-3 ml-2" />
                </a>
              </Button>
            )}
          </div>

          {/* Uni-Assist Link */}
          {uniAssistRequired && (
            <Button asChild variant="secondary" className="w-full">
              <a href="https://www.uni-assist.de" target="_blank" rel="noopener noreferrer">
                Apply via Uni-Assist
                <ExternalLink className="h-3 w-3 ml-2" />
              </a>
            </Button>
          )}
        </div>

        {/* Contact Information */}
        <div className="border-t pt-4 space-y-3">
          <h4 className="text-sm font-semibold">Contact Information</h4>
          
          <div className="space-y-2">
            <div className="flex items-center gap-3 text-sm">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Admissions Office:</span>
              <a href={`mailto:admissions@${universityWebsite?.replace(/^https?:\/\/(www\.)?/, '')}`} className="text-primary hover:underline">
                Contact via website
              </a>
            </div>

            <div className="flex items-center gap-3 text-sm">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Phone:</span>
              <span>Available on university website</span>
            </div>

            <div className="flex items-center gap-3 text-sm">
              <Globe className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">International Office:</span>
              <a href={universityWebsite} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                Visit website
              </a>
            </div>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="bg-muted p-3 rounded-lg text-xs text-muted-foreground">
          <strong>Important:</strong> Always verify application requirements and deadlines directly with the university, as information may change.
        </div>
      </CardContent>
    </Card>
  );
}
