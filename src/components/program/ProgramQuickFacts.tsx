import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, Globe, Euro, Award, FileCheck, GraduationCap, Monitor } from 'lucide-react';
import { format } from 'date-fns';
import { useTranslation } from 'react-i18next';
import { formatTuitionDisplay, type TuitionStructure } from '@/lib/tuition-calculator';

interface ProgramQuickFactsProps {
  durationSemesters: number | null;
  startDates: {
    winter?: string;
    summer?: string;
  };
  languages: string[];
  tuitionFees?: number | null;
  tuitionAmount?: number | null;
  tuitionFeeStructure?: TuitionStructure;
  ectsCredits: number | null;
  nextDeadline?: Date;
  applicationMethod: string;
  uniAssistRequired: boolean;
  deliveryMode?: string;
  programUrl?: string;
}

export function ProgramQuickFacts({
  durationSemesters,
  startDates,
  languages,
  tuitionFees,
  tuitionAmount,
  tuitionFeeStructure,
  ectsCredits,
  nextDeadline,
  applicationMethod,
  uniAssistRequired,
  deliveryMode,
  programUrl,
}: ProgramQuickFactsProps) {
  const { t } = useTranslation();

  // Determine which tuition values to use (new fields take priority)
  const displayTuitionAmount = tuitionAmount !== undefined && tuitionAmount !== null ? tuitionAmount : tuitionFees;
  const displayTuitionStructure = tuitionFeeStructure || 'semester';

  const getDeliveryModeLabel = (mode?: string) => {
    switch (mode) {
      case 'on_campus':
        return 'On Campus';
      case 'online':
        return 'Online';
      case 'hybrid':
        return 'Hybrid';
      default:
        return 'On Campus';
    }
  };

  const getApplicationMethodLabel = (method: string) => {
    switch (method) {
      case 'direct':
        return 'Direct Application';
      case 'uni_assist_direct':
        return 'Uni-Assist Direct';
      case 'uni_assist_vpd':
        return 'Uni-Assist VPD';
      case 'recognition_certificates':
        return 'Recognition of Certificates';
      default:
        return method;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">At a Glance</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Duration */}
          {durationSemesters && (
            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
              <Clock className="h-5 w-5 text-primary mt-0.5" />
              <div className="space-y-0.5">
                <p className="text-xs text-muted-foreground">Duration</p>
                <p className="text-sm font-medium">
                  {durationSemesters} semester{durationSemesters > 1 ? 's' : ''}
                  <span className="text-muted-foreground ml-1">
                    ({Math.ceil(durationSemesters / 2)} year{Math.ceil(durationSemesters / 2) > 1 ? 's' : ''})
                  </span>
                </p>
              </div>
            </div>
          )}

          {/* Start Dates */}
          {(startDates.winter || startDates.summer) && (
            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
              <Calendar className="h-5 w-5 text-primary mt-0.5" />
              <div className="space-y-0.5">
                <p className="text-xs text-muted-foreground">Start Date</p>
                <div className="text-sm font-medium">
                  {startDates.winter && <Badge variant="secondary" className="mr-1">Winter</Badge>}
                  {startDates.summer && <Badge variant="secondary">Summer</Badge>}
                </div>
              </div>
            </div>
          )}

          {/* Language */}
          {languages.length > 0 && (
            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
              <Globe className="h-5 w-5 text-primary mt-0.5" />
              <div className="space-y-0.5">
                <p className="text-xs text-muted-foreground">Language</p>
                <p className="text-sm font-medium">{languages.join(', ')}</p>
              </div>
            </div>
          )}

          {/* Tuition Fees */}
          <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
            <Euro className="h-5 w-5 text-primary mt-0.5" />
            <div className="space-y-0.5">
              <p className="text-xs text-muted-foreground">Tuition Fees</p>
              <p className="text-sm font-medium">
                {displayTuitionAmount === 0 || !displayTuitionAmount ? (
                  <span className="text-green-600">Tuition-free</span>
                ) : (
                  formatTuitionDisplay(displayTuitionAmount, displayTuitionStructure)
                )}
              </p>
            </div>
          </div>

          {/* ECTS Credits */}
          {ectsCredits && (
            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
              <Award className="h-5 w-5 text-primary mt-0.5" />
              <div className="space-y-0.5">
                <p className="text-xs text-muted-foreground">ECTS Credits</p>
                <p className="text-sm font-medium">{ectsCredits} credits</p>
              </div>
            </div>
          )}

          {/* Application Method */}
          <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
            <FileCheck className="h-5 w-5 text-primary mt-0.5" />
            <div className="space-y-0.5">
              <p className="text-xs text-muted-foreground">Application Method</p>
              <p className="text-sm font-medium">
                {getApplicationMethodLabel(applicationMethod)}
                {uniAssistRequired && (
                  <Badge variant="outline" className="ml-1 text-xs">Uni-Assist</Badge>
                )}
              </p>
            </div>
          </div>

          {/* Next Deadline */}
          {nextDeadline && (
            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
              <Calendar className="h-5 w-5 text-primary mt-0.5" />
              <div className="space-y-0.5">
                <p className="text-xs text-muted-foreground">Next Deadline</p>
                <p className="text-sm font-medium">{format(nextDeadline, 'MMM d, yyyy')}</p>
              </div>
            </div>
          )}

          {/* Delivery Mode */}
          {deliveryMode && (
            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
              <Monitor className="h-5 w-5 text-primary mt-0.5" />
              <div className="space-y-0.5">
                <p className="text-xs text-muted-foreground">Study Mode</p>
                <p className="text-sm font-medium">{getDeliveryModeLabel(deliveryMode)}</p>
              </div>
            </div>
          )}

          {/* Program Website */}
          {programUrl && (
            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
              <GraduationCap className="h-5 w-5 text-primary mt-0.5" />
              <div className="space-y-0.5">
                <p className="text-xs text-muted-foreground">Program Website</p>
                <a
                  href={programUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium text-primary hover:underline"
                >
                  Visit official page →
                </a>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
