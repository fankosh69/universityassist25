// Intelligent Intake Calculator for Year-Agnostic Deadlines
// Automatically calculates the next upcoming intakes based on current date

import { differenceInDays, format } from 'date-fns';

export interface IntakeDeadline {
  season: 'winter' | 'summer';
  deadlineMonth?: number | null;  // 1-12
  deadlineDay?: number | null;    // 1-31
  openMonth?: number | null;
  openDay?: number | null;
  semesterStartMonth?: number;    // Winter: 10 (October), Summer: 4 (April)
  recognitionWeeksBefore?: number;
}

export interface ComputedIntake {
  season: 'winter' | 'summer';
  year: number;
  deadlineDate: Date;
  openDate: Date | null;
  semesterStartDate: Date;
  daysUntilDeadline: number;
  status: 'open' | 'closing_soon' | 'urgent' | 'closed';
  displayLabel: string;  // e.g., "Winter 2026/2027" or "Summer 2027"
  isPassed: boolean;
}

/**
 * Get the semester display label with proper year formatting
 * Winter: "Winter YYYY/YYYY+1" (e.g., Winter 2026/2027)
 * Summer: "Summer YYYY" (e.g., Summer 2027)
 */
export function getSemesterLabel(season: 'winter' | 'summer', year: number): string {
  if (season === 'winter') {
    return `Winter ${year}/${year + 1}`;
  }
  return `Summer ${year}`;
}

/**
 * Calculate the next occurrence of a month/day deadline
 * If the deadline has passed this year, returns next year's date
 */
export function getNextDeadlineDate(
  month: number,
  day: number,
  referenceDate: Date = new Date()
): Date {
  const currentYear = referenceDate.getFullYear();
  
  // Create date for this year
  let deadlineDate = new Date(currentYear, month - 1, day);
  
  // If the deadline has already passed this year, use next year
  if (deadlineDate < referenceDate) {
    deadlineDate = new Date(currentYear + 1, month - 1, day);
  }
  
  return deadlineDate;
}

/**
 * Determine the academic year for a semester based on deadline date
 * Winter semester starting in October YYYY belongs to academic year YYYY/YYYY+1
 * Summer semester starting in April YYYY belongs to academic year YYYY
 */
export function getSemesterYear(season: 'winter' | 'summer', deadlineDate: Date): number {
  const deadlineYear = deadlineDate.getFullYear();
  const deadlineMonth = deadlineDate.getMonth() + 1;
  
  if (season === 'winter') {
    // Winter semester deadlines are typically May-July
    // The semester starts in October of the same year as the deadline
    // If deadline is in May-July YYYY, semester is Winter YYYY/YYYY+1
    if (deadlineMonth <= 9) {
      return deadlineYear;
    }
    // If deadline is Oct-Dec (unusual), semester is next winter
    return deadlineYear + 1;
  } else {
    // Summer semester deadlines are typically Nov-Jan
    // If deadline is Nov-Dec YYYY, semester starts April YYYY+1
    // If deadline is Jan YYYY, semester starts April YYYY
    if (deadlineMonth >= 10) {
      return deadlineYear + 1;
    }
    return deadlineYear;
  }
}

/**
 * Calculate deadline status based on days remaining
 */
export function getDeadlineStatusFromDays(daysRemaining: number): 'open' | 'closing_soon' | 'urgent' | 'closed' {
  if (daysRemaining < 0) return 'closed';
  if (daysRemaining <= 7) return 'urgent';
  if (daysRemaining <= 30) return 'closing_soon';
  return 'open';
}

/**
 * Compute the full intake information including dates and status
 */
export function computeIntake(
  intake: IntakeDeadline,
  referenceDate: Date = new Date()
): ComputedIntake | null {
  if (!intake.deadlineMonth || !intake.deadlineDay) {
    return null;
  }

  const deadlineDate = getNextDeadlineDate(intake.deadlineMonth, intake.deadlineDay, referenceDate);
  const daysUntilDeadline = differenceInDays(deadlineDate, referenceDate);
  const status = getDeadlineStatusFromDays(daysUntilDeadline);
  const semesterYear = getSemesterYear(intake.season, deadlineDate);

  // Calculate open date if available
  let openDate: Date | null = null;
  if (intake.openMonth && intake.openDay) {
    // Open date should be before the deadline in the same cycle
    const potentialOpenDate = new Date(deadlineDate.getFullYear(), intake.openMonth - 1, intake.openDay);
    
    // If open date would be after deadline, it's from the previous year
    if (potentialOpenDate >= deadlineDate) {
      openDate = new Date(deadlineDate.getFullYear() - 1, intake.openMonth - 1, intake.openDay);
    } else {
      openDate = potentialOpenDate;
    }
  }

  // Calculate semester start date
  const semesterStartMonth = intake.season === 'winter' ? 10 : 4; // October or April
  const semesterStartDate = new Date(semesterYear, semesterStartMonth - 1, 1);

  return {
    season: intake.season,
    year: semesterYear,
    deadlineDate,
    openDate,
    semesterStartDate,
    daysUntilDeadline,
    status,
    displayLabel: getSemesterLabel(intake.season, semesterYear),
    isPassed: daysUntilDeadline < 0
  };
}

/**
 * Get the next upcoming intakes, ordered by deadline date (soonest first)
 * Returns up to 2 intakes for display
 */
export function getUpcomingIntakes(
  winterIntake?: IntakeDeadline | null,
  summerIntake?: IntakeDeadline | null,
  referenceDate: Date = new Date()
): ComputedIntake[] {
  const intakes: ComputedIntake[] = [];

  // Compute winter intake
  if (winterIntake?.deadlineMonth && winterIntake?.deadlineDay) {
    const computed = computeIntake(winterIntake, referenceDate);
    if (computed) intakes.push(computed);
  }

  // Compute summer intake
  if (summerIntake?.deadlineMonth && summerIntake?.deadlineDay) {
    const computed = computeIntake(summerIntake, referenceDate);
    if (computed) intakes.push(computed);
  }

  // Sort by deadline date (soonest first)
  intakes.sort((a, b) => a.deadlineDate.getTime() - b.deadlineDate.getTime());

  // If the first intake is closed (passed), we might want to show next year's version
  // But only if we have the intake data
  if (intakes.length > 0 && intakes[0].isPassed) {
    // Calculate next occurrence
    const firstIntake = intakes[0];
    const nextYearDate = new Date(
      firstIntake.deadlineDate.getFullYear() + 1,
      firstIntake.deadlineDate.getMonth(),
      firstIntake.deadlineDate.getDate()
    );
    
    const originalIntakeData = firstIntake.season === 'winter' ? winterIntake : summerIntake;
    if (originalIntakeData) {
      const nextComputed = computeIntake(originalIntakeData, nextYearDate);
      if (nextComputed) {
        // Replace the passed intake with the next occurrence
        intakes[0] = nextComputed;
        // Re-sort
        intakes.sort((a, b) => a.deadlineDate.getTime() - b.deadlineDate.getTime());
      }
    }
  }

  return intakes.slice(0, 2);
}

/**
 * Format a computed intake for display
 */
export function formatIntakeDate(date: Date): string {
  return format(date, 'MMMM d, yyyy');
}
