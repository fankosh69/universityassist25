// Academic Calendar Utilities for Year-Agnostic Deadlines
import { format, setMonth, setDate, isBefore, addYears } from 'date-fns';

export interface MonthDay {
  month: number; // 1-12
  day: number;   // 1-31
}

// Month names for display
export const MONTHS = [
  { value: 1, label: 'January' },
  { value: 2, label: 'February' },
  { value: 3, label: 'March' },
  { value: 4, label: 'April' },
  { value: 5, label: 'May' },
  { value: 6, label: 'June' },
  { value: 7, label: 'July' },
  { value: 8, label: 'August' },
  { value: 9, label: 'September' },
  { value: 10, label: 'October' },
  { value: 11, label: 'November' },
  { value: 12, label: 'December' }
];

// Get days for a given month (accounts for leap years for February)
export function getDaysInMonth(month: number, year?: number): number {
  const y = year || new Date().getFullYear();
  return new Date(y, month, 0).getDate();
}

// Format month/day for display (e.g., "July 15")
export function formatMonthDay(month: number | null, day: number | null): string {
  if (!month || !day) return '';
  const date = new Date(2024, month - 1, day); // Use arbitrary year for formatting
  return format(date, 'MMMM d');
}

// Get the next occurrence of a month/day deadline
export function getNextDeadlineDate(
  month: number | null, 
  day: number | null,
  referenceDate: Date = new Date()
): Date | null {
  if (!month || !day) return null;
  
  const currentYear = referenceDate.getFullYear();
  
  // Create date for this year
  let deadlineDate = new Date(currentYear, month - 1, day);
  
  // If the deadline has already passed this year, use next year
  if (isBefore(deadlineDate, referenceDate)) {
    deadlineDate = new Date(currentYear + 1, month - 1, day);
  }
  
  return deadlineDate;
}

// Get deadline for a specific year
export function getDeadlineForYear(
  month: number | null, 
  day: number | null, 
  year: number
): Date | null {
  if (!month || !day) return null;
  return new Date(year, month - 1, day);
}

// Check if deadline has passed for current year
export function isDeadlinePassed(
  month: number | null, 
  day: number | null,
  referenceDate: Date = new Date()
): boolean {
  if (!month || !day) return false;
  
  const currentYear = referenceDate.getFullYear();
  const deadlineDate = new Date(currentYear, month - 1, day);
  
  return isBefore(deadlineDate, referenceDate);
}

// Get deadline status with computed year
export interface ComputedDeadlineInfo {
  date: Date | null;
  year: number;
  isPassed: boolean;
  daysRemaining: number;
  status: 'upcoming' | 'soon' | 'urgent' | 'passed' | 'unknown';
  displayText: string;
}

export function getComputedDeadlineInfo(
  month: number | null, 
  day: number | null,
  intake: 'winter' | 'summer'
): ComputedDeadlineInfo {
  if (!month || !day) {
    return {
      date: null,
      year: new Date().getFullYear(),
      isPassed: false,
      daysRemaining: -1,
      status: 'unknown',
      displayText: 'No deadline set'
    };
  }
  
  const now = new Date();
  const nextDate = getNextDeadlineDate(month, day, now);
  
  if (!nextDate) {
    return {
      date: null,
      year: now.getFullYear(),
      isPassed: false,
      daysRemaining: -1,
      status: 'unknown',
      displayText: 'No deadline set'
    };
  }
  
  const diffTime = nextDate.getTime() - now.getTime();
  const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  let status: 'upcoming' | 'soon' | 'urgent' | 'passed' = 'upcoming';
  if (daysRemaining < 0) {
    status = 'passed';
  } else if (daysRemaining <= 7) {
    status = 'urgent';
  } else if (daysRemaining <= 30) {
    status = 'soon';
  }
  
  return {
    date: nextDate,
    year: nextDate.getFullYear(),
    isPassed: daysRemaining < 0,
    daysRemaining,
    status,
    displayText: format(nextDate, 'MMMM d, yyyy')
  };
}

// Get academic year for intake periods
export function getAcademicYearForIntake(intake: 'winter' | 'summer'): string {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1; // 1-12
  
  if (intake === 'winter') {
    // Winter semester starts in October
    // If it's before July (typical deadline), show current year
    // If it's after October, show next year's winter
    if (currentMonth >= 10) {
      return `Winter ${currentYear}/${currentYear + 1}`;
    } else {
      return `Winter ${currentYear}/${currentYear + 1}`;
    }
  } else {
    // Summer semester starts in April
    // Deadlines typically in January
    if (currentMonth >= 4) {
      return `Summer ${currentYear + 1}`;
    } else {
      return `Summer ${currentYear}`;
    }
  }
}

// Parse existing date string to month/day
export function parseDateToMonthDay(dateString: string | null): MonthDay | null {
  if (!dateString) return null;
  
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return null;
    
    return {
      month: date.getMonth() + 1, // Convert 0-indexed to 1-indexed
      day: date.getDate()
    };
  } catch {
    return null;
  }
}
