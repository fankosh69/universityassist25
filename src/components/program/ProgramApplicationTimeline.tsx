import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Calendar, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { 
  getUpcomingIntakes, 
  formatIntakeDate,
  type IntakeDeadline,
  type ComputedIntake 
} from '@/lib/intake-calculator';

interface IntakePeriodInput {
  season: 'winter' | 'summer';
  deadlineMonth?: number | null;
  deadlineDay?: number | null;
  openMonth?: number | null;
  openDay?: number | null;
  recognitionWeeksBefore?: number;
}

interface ProgramApplicationTimelineProps {
  winterIntake?: IntakePeriodInput;
  summerIntake?: IntakePeriodInput;
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

  // Convert input to IntakeDeadline format and compute upcoming intakes
  const winterData: IntakeDeadline | null = winterIntake ? {
    season: 'winter',
    deadlineMonth: winterIntake.deadlineMonth,
    deadlineDay: winterIntake.deadlineDay,
    openMonth: winterIntake.openMonth,
    openDay: winterIntake.openDay,
    recognitionWeeksBefore: winterIntake.recognitionWeeksBefore
  } : null;

  const summerData: IntakeDeadline | null = summerIntake ? {
    season: 'summer',
    deadlineMonth: summerIntake.deadlineMonth,
    deadlineDay: summerIntake.deadlineDay,
    openMonth: summerIntake.openMonth,
    openDay: summerIntake.openDay,
    recognitionWeeksBefore: summerIntake.recognitionWeeksBefore
  } : null;

  const upcomingIntakes = getUpcomingIntakes(winterData, summerData);

  const getStatusColor = (status: string) => {
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open':
        return <Badge variant="default" className="bg-green-600">✓ Open</Badge>;
      case 'closing_soon':
        return <Badge variant="default" className="bg-orange-500">⚠ Closing Soon</Badge>;
      case 'urgent':
        return <Badge variant="destructive">🔥 Urgent</Badge>;
      case 'closed':
        return <Badge variant="secondary">✕ Closed</Badge>;
      default:
        return null;
    }
  };

  const renderIntakeTimeline = (intake: ComputedIntake) => {
    const recognitionWeeks = intake.season === 'winter' 
      ? winterIntake?.recognitionWeeksBefore 
      : summerIntake?.recognitionWeeksBefore;

    return (
      <div key={`${intake.season}-${intake.year}`} className={`border rounded-lg p-4 ${getStatusColor(intake.status)}`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold capitalize flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            {intake.displayLabel}
          </h3>
          {getStatusBadge(intake.status)}
        </div>

        {/* Timeline visualization */}
        <div className="space-y-3">
          {/* Application Opens */}
          {intake.openDate && (
            <div className="flex items-start gap-3">
              <div className="flex flex-col items-center">
                <div className="rounded-full bg-primary p-1.5">
                  <CheckCircle2 className="h-3 w-3 text-primary-foreground" />
                </div>
                <div className="w-0.5 h-8 bg-border" />
              </div>
              <div className="flex-1 pt-0.5">
                <p className="text-sm font-medium">Application Opens</p>
                <p className="text-xs text-muted-foreground">{formatIntakeDate(intake.openDate)}</p>
              </div>
            </div>
          )}

          {/* Recognition Deadline (if applicable) */}
          {recognitionWeeks && (
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
                  {recognitionWeeks} weeks before application deadline
                </p>
              </div>
            </div>
          )}

          {/* Application Deadline */}
          <div className="flex items-start gap-3">
            <div className="flex flex-col items-center">
              <div className={`rounded-full p-1.5 ${
                intake.status === 'urgent' ? 'bg-red-500' :
                intake.status === 'closing_soon' ? 'bg-orange-500' :
                intake.status === 'open' ? 'bg-green-500' : 'bg-muted'
              }`}>
                <Clock className="h-3 w-3 text-white" />
              </div>
              <div className="w-0.5 h-8 bg-border" />
            </div>
            <div className="flex-1 pt-0.5">
              <p className="text-sm font-medium">Application Deadline</p>
              <p className="text-xs text-muted-foreground">
                {formatIntakeDate(intake.deadlineDate)}
              </p>
              {intake.daysUntilDeadline > 0 && (
                <Badge variant="outline" className="mt-1 text-xs">
                  {intake.daysUntilDeadline} days remaining
                </Badge>
              )}
            </div>
          </div>

          {/* Semester Starts */}
          <div className="flex items-start gap-3">
            <div className="flex flex-col items-center">
              <div className="rounded-full bg-primary p-1.5">
                <Calendar className="h-3 w-3 text-primary-foreground" />
              </div>
            </div>
            <div className="flex-1 pt-0.5">
              <p className="text-sm font-medium">Semester Starts</p>
              <p className="text-xs text-muted-foreground">{formatIntakeDate(intake.semesterStartDate)}</p>
            </div>
          </div>
        </div>

        {/* Important note if Uni-Assist is required */}
        {uniAssistRequired && intake.status !== 'closed' && (
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
        {upcomingIntakes.length > 0 ? (
          upcomingIntakes.map(renderIntakeTimeline)
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No intake information available</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
