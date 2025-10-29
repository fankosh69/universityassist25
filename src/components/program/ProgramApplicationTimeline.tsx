import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Calendar, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { getDeadlineStatus, type DeadlineInfo } from '@/lib/deadline-utils';
import { useTranslation } from 'react-i18next';

interface IntakePeriod {
  season: 'winter' | 'summer';
  applicationOpenDate?: string;
  applicationDeadline?: string;
  semesterStart?: string;
  recognitionWeeksBefore?: number;
}

interface ProgramApplicationTimelineProps {
  winterIntake?: IntakePeriod;
  summerIntake?: IntakePeriod;
  applicationMethod: string;
  uniAssistRequired: boolean;
}

export function ProgramApplicationTimeline({
  winterIntake,
  summerIntake,
  applicationMethod,
  uniAssistRequired,
}: ProgramApplicationTimelineProps) {
  const { t } = useTranslation();

  const renderIntakeTimeline = (intake: IntakePeriod) => {
    const deadline = intake.applicationDeadline ? new Date(intake.applicationDeadline) : null;
    const openDate = intake.applicationOpenDate ? new Date(intake.applicationOpenDate) : null;
    const startDate = intake.semesterStart ? new Date(intake.semesterStart) : null;
    
    let deadlineInfo: DeadlineInfo | null = null;
    if (deadline) {
      deadlineInfo = getDeadlineStatus(
        deadline,
        intake.season,
        !!winterIntake,
        !!summerIntake,
        winterIntake?.applicationDeadline ? new Date(winterIntake.applicationDeadline) : null,
        summerIntake?.applicationDeadline ? new Date(summerIntake.applicationDeadline) : null
      );
    }

    const getStatusColor = (status?: string) => {
      switch (status) {
        case 'open':
          return 'border-green-500 bg-green-50 dark:bg-green-950';
        case 'closing_soon':
          return 'border-orange-500 bg-orange-50 dark:bg-orange-950';
        case 'urgent':
          return 'border-red-500 bg-red-50 dark:bg-red-950';
        case 'closed':
          return 'border-border bg-muted';
        default:
          return 'border-border bg-background';
      }
    };

    const daysUntilDeadline = deadline ? differenceInDays(deadline, new Date()) : null;

    return (
      <div className={`border rounded-lg p-4 ${getStatusColor(deadlineInfo?.status)}`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold capitalize flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            {intake.season} Semester {new Date().getFullYear()}
          </h3>
          {deadlineInfo && (
            <Badge
              variant={deadlineInfo.status === 'closed' ? 'secondary' : 'default'}
              className="capitalize"
            >
              {deadlineInfo.status === 'open' && '✓ Open'}
              {deadlineInfo.status === 'closing_soon' && '⚠ Closing Soon'}
              {deadlineInfo.status === 'urgent' && '🔥 Urgent'}
              {deadlineInfo.status === 'closed' && '✕ Closed'}
            </Badge>
          )}
        </div>

        {/* Timeline visualization */}
        <div className="space-y-3">
          {/* Application Opens */}
          {openDate && (
            <div className="flex items-start gap-3">
              <div className="flex flex-col items-center">
                <div className="rounded-full bg-primary p-1.5">
                  <CheckCircle2 className="h-3 w-3 text-primary-foreground" />
                </div>
                <div className="w-0.5 h-8 bg-border" />
              </div>
              <div className="flex-1 pt-0.5">
                <p className="text-sm font-medium">Application Opens</p>
                <p className="text-xs text-muted-foreground">{format(openDate, 'MMMM d, yyyy')}</p>
              </div>
            </div>
          )}

          {/* Recognition Deadline (if applicable) */}
          {intake.recognitionWeeksBefore && deadline && (
            <div className="flex items-start gap-3">
              <div className="flex flex-col items-center">
                <div className="rounded-full bg-orange-500 p-1.5">
                  <AlertCircle className="h-3 w-3 text-white" />
                </div>
                <div className="w-0.5 h-8 bg-border" />
              </div>
              <div className="flex-1 pt-0.5">
                <p className="text-sm font-medium">Recognition Deadline</p>
                <p className="text-xs text-muted-foreground">
                  {intake.recognitionWeeksBefore} weeks before application deadline
                </p>
              </div>
            </div>
          )}

          {/* Application Deadline */}
          {deadline && (
            <div className="flex items-start gap-3">
              <div className="flex flex-col items-center">
                <div className={`rounded-full p-1.5 ${
                  deadlineInfo?.status === 'urgent' ? 'bg-red-500' :
                  deadlineInfo?.status === 'closing_soon' ? 'bg-orange-500' :
                  deadlineInfo?.status === 'open' ? 'bg-green-500' : 'bg-muted'
                }`}>
                  <Clock className="h-3 w-3 text-white" />
                </div>
                <div className="w-0.5 h-8 bg-border" />
              </div>
              <div className="flex-1 pt-0.5">
                <p className="text-sm font-medium">Application Deadline</p>
                <p className="text-xs text-muted-foreground">
                  {format(deadline, 'MMMM d, yyyy')}
                </p>
                {daysUntilDeadline !== null && daysUntilDeadline > 0 && (
                  <Badge variant="outline" className="mt-1 text-xs">
                    {daysUntilDeadline} days remaining
                  </Badge>
                )}
              </div>
            </div>
          )}

          {/* Semester Starts */}
          {startDate && (
            <div className="flex items-start gap-3">
              <div className="flex flex-col items-center">
                <div className="rounded-full bg-primary p-1.5">
                  <Calendar className="h-3 w-3 text-primary-foreground" />
                </div>
              </div>
              <div className="flex-1 pt-0.5">
                <p className="text-sm font-medium">Semester Starts</p>
                <p className="text-xs text-muted-foreground">{format(startDate, 'MMMM d, yyyy')}</p>
              </div>
            </div>
          )}
        </div>

        {/* Important note if Uni-Assist is required */}
        {uniAssistRequired && deadlineInfo?.status !== 'closed' && (
          <Alert className="mt-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-xs">
              {applicationMethod === 'uni_assist_vpd' 
                ? 'Apply to uni-assist at least 5 weeks before this deadline.'
                : applicationMethod === 'recognition_certificates'
                ? 'Submit recognition documents at least 10 weeks before this deadline.'
                : 'Allow extra time for uni-assist processing.'}
            </AlertDescription>
          </Alert>
        )}
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Application Timeline
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {winterIntake && renderIntakeTimeline(winterIntake)}
        {summerIntake && renderIntakeTimeline(summerIntake)}

        {!winterIntake && !summerIntake && (
          <div className="text-center py-8 text-muted-foreground">
            <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No intake information available</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
