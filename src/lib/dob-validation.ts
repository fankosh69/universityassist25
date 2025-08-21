// Date of Birth validation utility with age calculation and underage detection

export interface DOBValidationResult {
  valid: boolean;
  age?: number;
  isUnderage?: boolean;
  message?: string;
}

export interface ParentInfo {
  fullName: string;
  email: string;
  phone: string;
  countryCode: string;
}

// Calculate age from date of birth
export function calculateAge(dateOfBirth: Date): number {
  const today = new Date();
  let age = today.getFullYear() - dateOfBirth.getFullYear();
  const monthDiff = today.getMonth() - dateOfBirth.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dateOfBirth.getDate())) {
    age--;
  }
  
  return age;
}

// Check if a date is valid
export function isValidDate(dateString: string): boolean {
  // Check format YYYY-MM-DD
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(dateString)) {
    return false;
  }
  
  const date = new Date(dateString);
  const [year, month, day] = dateString.split('-').map(num => parseInt(num, 10));
  
  // Check if the date components match (catches impossible dates like Feb 30)
  return date.getFullYear() === year &&
         date.getMonth() === month - 1 && // getMonth() returns 0-11
         date.getDate() === day &&
         !isNaN(date.getTime());
}

// Main DOB validation function
export function validateDOB(dobString: string): DOBValidationResult {
  if (!dobString.trim()) {
    return {
      valid: false,
      message: "Date of birth is required"
    };
  }

  // Check format first
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dobString)) {
    return {
      valid: false,
      message: "Please enter your birthdate in YYYY-MM-DD format."
    };
  }

  // Check if it's a valid date
  if (!isValidDate(dobString)) {
    return {
      valid: false,
      message: "Hmm… that date doesn't exist. Try again."
    };
  }

  const dob = new Date(dobString);
  const today = new Date();
  
  // Check for future dates
  if (dob > today) {
    return {
      valid: false,
      message: "Hey! You haven't been born yet!"
    };
  }
  
  // Check for very old dates (probably a typo)
  const age = calculateAge(dob);
  if (age > 120) {
    return {
      valid: false,
      message: "That would make you over 120 years old! Please check your birth year."
    };
  }
  
  const isUnderage = age < 18;
  
  return {
    valid: true,
    age,
    isUnderage,
    message: isUnderage ? `You're ${age} years old. We'll need your parent's contact information.` : undefined
  };
}

// Validate parent full name
export function validateParentName(name: string): { valid: boolean; message?: string } {
  if (!name.trim()) {
    return {
      valid: false,
      message: "Parent's full name is required"
    };
  }
  
  if (name.trim().length < 2) {
    return {
      valid: false,
      message: "Please enter a valid full name"
    };
  }
  
  // Check for at least first and last name
  const nameParts = name.trim().split(/\s+/);
  if (nameParts.length < 2) {
    return {
      valid: false,
      message: "Please enter both first and last name"
    };
  }
  
  // Basic character validation (letters, spaces, hyphens, apostrophes)
  const nameRegex = /^[a-zA-ZÀ-ÿ\s\-'\.]+$/;
  if (!nameRegex.test(name)) {
    return {
      valid: false,
      message: "Name can only contain letters, spaces, hyphens, and apostrophes"
    };
  }
  
  return { valid: true };
}

// Validate complete parent information
export function validateParentInfo(parentInfo: ParentInfo, phoneValidator: (phone: string, countryCode: string) => string, emailValidator: (email: string) => { valid: boolean; message?: string }): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Validate parent name
  const nameValidation = validateParentName(parentInfo.fullName);
  if (!nameValidation.valid) {
    errors.push(nameValidation.message!);
  }
  
  // Validate parent email
  const emailValidation = emailValidator(parentInfo.email);
  if (!emailValidation.valid && emailValidation.message) {
    errors.push(`Parent's email: ${emailValidation.message}`);
  }
  
  // Validate parent phone
  const phoneError = phoneValidator(parentInfo.phone, parentInfo.countryCode);
  if (phoneError) {
    errors.push(`Parent's phone: ${phoneError}`);
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}