// Timezone utilities for German academic calendar
import { formatInTimeZone } from 'date-fns-tz';
import { differenceInDays, parseISO, format } from 'date-fns';

export const BERLIN_TZ = 'Europe/Berlin';

export function formatDateInBerlin(date: Date | string, formatStr: string = 'PPP'): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return formatInTimeZone(dateObj, BERLIN_TZ, formatStr);
}

export function getDaysUntilDeadline(deadline: Date | string): number {
  const deadlineDate = typeof deadline === 'string' ? parseISO(deadline) : deadline;
  const now = new Date();
  return differenceInDays(deadlineDate, now);
}

export function getDeadlineStatus(deadline: Date | string): {
  status: 'upcoming' | 'soon' | 'urgent' | 'passed';
  daysRemaining: number;
  color: string;
} {
  const days = getDaysUntilDeadline(deadline);
  
  if (days < 0) {
    return { status: 'passed', daysRemaining: days, color: 'text-destructive' };
  } else if (days <= 7) {
    return { status: 'urgent', daysRemaining: days, color: 'text-destructive' };
  } else if (days <= 30) {
    return { status: 'soon', daysRemaining: days, color: 'text-orange-500' };
  } else {
    return { status: 'upcoming', daysRemaining: days, color: 'text-muted-foreground' };
  }
}

export function createICSEvent(
  title: string, 
  startDate: Date | string, 
  description?: string
): string {
  const dateObj = typeof startDate === 'string' ? parseISO(startDate) : startDate;
  const utcDate = format(dateObj, "yyyyMMdd'T'HHmmss'Z'");
  
  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//University Assist//Application Deadline//EN',
    'BEGIN:VEVENT',
    `DTSTART:${utcDate}`,
    `DTEND:${utcDate}`,
    `SUMMARY:${title}`,
    description ? `DESCRIPTION:${description}` : '',
    'END:VEVENT',
    'END:VCALENDAR'
  ].filter(Boolean).join('\r\n');
  
  return icsContent;
}

export function downloadICS(filename: string, content: string): void {
  const blob = new Blob([content], { type: 'text/calendar' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Academic year helpers
export function getAcademicYear(date: Date = new Date()): { start: number; end: number } {
  const year = date.getFullYear();
  const month = date.getMonth() + 1; // JavaScript months are 0-indexed
  
  if (month >= 10) {
    // October or later = current academic year
    return { start: year, end: year + 1 };
  } else {
    // Before October = previous academic year
    return { start: year - 1, end: year };
  }
}

export function getSemesterInfo(intake: 'winter' | 'summer', year: number) {
  if (intake === 'winter') {
    return {
      start: new Date(year, 9, 1), // October 1st
      applicationDeadline: new Date(year, 6, 15), // July 15th
      name: `Winter ${year}/${year + 1}`
    };
  } else {
    return {
      start: new Date(year, 3, 1), // April 1st
      applicationDeadline: new Date(year, 0, 15), // January 15th
      name: `Summer ${year}`
    };
  }
}