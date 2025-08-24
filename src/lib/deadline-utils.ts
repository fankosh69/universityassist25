import { differenceInDays, differenceInMonths, format, addYears, isBefore } from 'date-fns';

export interface DeadlineInfo {
  status: 'open' | 'closing_soon' | 'urgent' | 'closed';
  daysRemaining: number;
  monthsRemaining: number;
  timeText: string;
  nextDeadline?: Date;
  canApplyForAlternateIntake?: boolean;
  alternateIntake?: 'winter' | 'summer';
  alternateDeadline?: Date;
}

export function getDeadlineStatus(
  deadline: Date | null,
  intake: 'winter' | 'summer',
  hasWinterIntake: boolean,
  hasSummerIntake: boolean,
  winterDeadline?: Date | null,
  summerDeadline?: Date | null
): DeadlineInfo {
  const now = new Date();
  
  if (!deadline) {
    return {
      status: 'closed',
      daysRemaining: 0,
      monthsRemaining: 0,
      timeText: 'No deadline set',
    };
  }

  const days = differenceInDays(deadline, now);
  const months = differenceInMonths(deadline, now);

  let status: 'open' | 'closing_soon' | 'urgent' | 'closed';
  let timeText: string;
  let nextDeadline: Date | undefined;
  let canApplyForAlternateIntake = false;
  let alternateIntake: 'winter' | 'summer' | undefined;
  let alternateDeadline: Date | undefined;

  if (days < 0) {
    status = 'closed';
    
    // Check for alternate intake
    if (intake === 'winter' && hasSummerIntake && summerDeadline) {
      const summerDays = differenceInDays(summerDeadline, now);
      if (summerDays > 0) {
        canApplyForAlternateIntake = true;
        alternateIntake = 'summer';
        alternateDeadline = summerDeadline;
        timeText = `Winter intake closed. Summer intake open (${summerDays} days left)`;
      } else {
        nextDeadline = addYears(deadline, 1);
        timeText = `Closed. Next ${intake} intake: ${format(nextDeadline, 'MMM d, yyyy')}`;
      }
    } else if (intake === 'summer' && hasWinterIntake && winterDeadline) {
      const winterDays = differenceInDays(winterDeadline, now);
      if (winterDays > 0) {
        canApplyForAlternateIntake = true;
        alternateIntake = 'winter';
        alternateDeadline = winterDeadline;
        timeText = `Summer intake closed. Winter intake open (${winterDays} days left)`;
      } else {
        nextDeadline = addYears(deadline, 1);
        timeText = `Closed. Next ${intake} intake: ${format(nextDeadline, 'MMM d, yyyy')}`;
      }
    } else {
      nextDeadline = addYears(deadline, 1);
      timeText = `Closed. Next ${intake} intake: ${format(nextDeadline, 'MMM d, yyyy')}`;
    }
  } else if (days <= 7) {
    status = 'urgent';
    timeText = days === 0 ? 'Deadline today!' : `${days} day${days === 1 ? '' : 's'} left`;
  } else if (days <= 30) {
    status = 'closing_soon';
    timeText = `${days} days left`;
  } else {
    status = 'open';
    if (months > 0) {
      timeText = `${months} month${months === 1 ? '' : 's'} left`;
    } else {
      timeText = `${days} days left`;
    }
  }

  return {
    status,
    daysRemaining: Math.max(0, days),
    monthsRemaining: Math.max(0, months),
    timeText,
    nextDeadline,
    canApplyForAlternateIntake,
    alternateIntake,
    alternateDeadline,
  };
}

export function getApplicationMethodInfo(method: string) {
  switch (method) {
    case 'direct':
      return {
        name: 'Direct Application',
        description: 'Apply directly to the university',
        disclaimer: null,
      };
    case 'uni_assist_direct':
      return {
        name: 'Uni-Assist Direct Application',
        description: 'Apply through Uni-Assist platform',
        disclaimer: null,
      };
    case 'uni_assist_vpd':
      return {
        name: 'Uni-Assist VPD',
        description: 'Vorprüfungsdokumentation through Uni-Assist',
        disclaimer: 'Application to uni-assist should be submitted at least 5 weeks before the university deadline.',
      };
    case 'recognition_certificates':
      return {
        name: 'Recognition of Certificates',
        description: 'Certificate recognition through Hochschule Konstanz',
        disclaimer: 'Application for recognition should be submitted at least 10 weeks before the visible deadline. This process is only applicable for specific universities in Baden-Württemberg.',
      };
    default:
      return {
        name: 'Unknown Method',
        description: '',
        disclaimer: null,
      };
  }
}

export function getStatusColor(status: 'open' | 'closing_soon' | 'urgent' | 'closed') {
  switch (status) {
    case 'open':
      return 'text-green-600 bg-green-50 border-green-200';
    case 'closing_soon':
      return 'text-orange-600 bg-orange-50 border-orange-200';
    case 'urgent':
      return 'text-red-600 bg-red-50 border-red-200';
    case 'closed':
      return 'text-muted-foreground bg-muted border-border';
    default:
      return 'text-muted-foreground bg-muted border-border';
  }
}