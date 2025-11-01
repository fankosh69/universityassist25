export type TuitionStructure = 'monthly' | 'semester' | 'yearly';

export interface TuitionCalculation {
  monthly: number;
  semester: number;
  yearly: number;
  structure: TuitionStructure;
  originalAmount: number;
}

/**
 * Calculate all tuition formats from the stored structure
 */
export function calculateTuitionFees(
  amount: number,
  structure: TuitionStructure
): TuitionCalculation {
  let monthly = 0;
  let semester = 0;
  let yearly = 0;

  switch (structure) {
    case 'monthly':
      monthly = amount;
      semester = amount * 6; // 6 months per semester
      yearly = amount * 12;
      break;
    
    case 'semester':
      monthly = Math.round(amount / 6);
      semester = amount;
      yearly = amount * 2; // 2 semesters per year
      break;
    
    case 'yearly':
      monthly = Math.round(amount / 12);
      semester = Math.round(amount / 2);
      yearly = amount;
      break;
  }

  return {
    monthly,
    semester,
    yearly,
    structure,
    originalAmount: amount,
  };
}

/**
 * Format tuition display with structure label
 */
export function formatTuitionDisplay(
  amount: number,
  structure: TuitionStructure
): string {
  if (amount === 0) return 'Free';
  
  const labels = {
    monthly: '/month',
    semester: '/semester',
    yearly: '/year',
  };
  
  return `€${amount.toLocaleString()}${labels[structure]}`;
}
