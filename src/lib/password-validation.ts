export type PersonalInfo = { 
  name?: string; 
  email?: string; 
  dob?: string; // YYYY-MM-DD format
};

export type PasswordCheck = {
  valid: boolean;
  errors: string[];
  suggestions?: string[];
  strength?: 'weak' | 'okay' | 'strong';
};

// Common blocked passwords
const BLOCKED_PASSWORDS = new Set([
  'password', 'qwerty', '123456', '111111', 'letmein', 'admin', 'welcome', 
  'abc123', 'password123', 'admin123', 'root', 'user', 'test', 'guest',
  '1234567890', 'qwertyuiop', 'asdfghjkl', 'zxcvbnm'
]);

// Normalization helpers
export function normalize(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
    .replace(/\s+/g, ' ');
}

export function tokenizeName(name: string): string[] {
  return normalize(name)
    .split(/[\s\-_]+/)
    .filter(token => token.length >= 3);
}

export function tokenizeEmail(email: string): string[] {
  const [localPart, domain] = email.toLowerCase().split('@');
  if (!domain) return [];
  
  const tokens: string[] = [];
  
  // Tokenize local part
  const localTokens = localPart.split(/[.\-_+]/).filter(token => token.length >= 3);
  tokens.push(...localTokens);
  
  // Tokenize domain without TLD
  const domainWithoutTLD = domain.split('.')[0];
  if (domainWithoutTLD.length >= 3) {
    tokens.push(domainWithoutTLD);
  }
  
  return tokens;
}

export function dobVariants(dob: string): string[] {
  // Expected format: YYYY-MM-DD
  const parts = dob.split('-');
  if (parts.length !== 3) return [];
  
  const [year, month, day] = parts;
  const shortYear = year.slice(-2);
  
  return [
    year,           // YYYY
    shortYear,      // YY
    month,          // MM
    day,            // DD
    year + month + day,     // YYYYMMDD
    day + month + year,     // DDMMYYYY
    month + day,            // MMDD
    day + month,            // DDMM
    year + month,           // YYYYMM
    month + year,           // MMYYYY
  ].filter(variant => variant.length >= 2);
}

function detectSequences(password: string): boolean {
  const normalized = normalize(password).replace(/[^a-z0-9]/g, '');
  
  // Check for ascending sequences (123456, abcdef)
  for (let i = 0; i <= normalized.length - 6; i++) {
    let isSequence = true;
    for (let j = 1; j < 6; j++) {
      const current = normalized.charCodeAt(i + j);
      const previous = normalized.charCodeAt(i + j - 1);
      if (current !== previous + 1) {
        isSequence = false;
        break;
      }
    }
    if (isSequence) return true;
  }
  
  // Check for descending sequences (654321, fedcba)
  for (let i = 0; i <= normalized.length - 6; i++) {
    let isSequence = true;
    for (let j = 1; j < 6; j++) {
      const current = normalized.charCodeAt(i + j);
      const previous = normalized.charCodeAt(i + j - 1);
      if (current !== previous - 1) {
        isSequence = false;
        break;
      }
    }
    if (isSequence) return true;
  }
  
  return false;
}

function detectRepeatingChars(password: string): boolean {
  return /^(.)\1{5,}$/.test(password) || /(.)\1{5,}/.test(password);
}

function calculateStrength(password: string): 'weak' | 'okay' | 'strong' {
  let score = 0;
  
  // Length scoring
  if (password.length >= 12) score += 2;
  else if (password.length >= 8) score += 1;
  
  // Character variety
  if (/[a-z]/.test(password)) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;
  
  // Bonus for good length
  if (password.length >= 14) score += 1;
  
  // Penalty for common patterns
  if (detectRepeatingChars(password) || detectSequences(password)) {
    score -= 2;
  }
  
  if (score >= 5) return 'strong';  // More achievable
  if (score >= 3) return 'okay';    // Reasonable
  return 'weak';
}

export function validatePassword(
  password: string,
  info: PersonalInfo,
  confirmPassword?: string
): PasswordCheck {
  const errors: string[] = [];
  const suggestions: string[] = [];
  
  // Length validation
  if (password.length < 8) {
    errors.push("Use at least 8 characters.");
  }
  
  if (password.length > 128) {
    errors.push("Password must be no more than 128 characters.");
  }
  
  // Composition validation
  if (!/[a-z]/.test(password)) {
    errors.push("Add at least one lowercase letter.");
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push("Add at least one uppercase letter.");
  }
  
  if (!/\d/.test(password)) {
    errors.push("Add at least one number.");
  }
  
  if (!/[!@#$%^&*()_+\-=\[\]{}|;:'",.<>/?`~]/.test(password)) {
    errors.push("Add at least one special character (!@#$%^&*()_+-=[]{}|;:'\",.<>/?`~).");
  }
  
  // No whitespace
  if (/\s/.test(password)) {
    errors.push("Passwords can't include spaces.");
  }
  
  // Check against blocked passwords
  const normalizedPwd = normalize(password);
  if (BLOCKED_PASSWORDS.has(normalizedPwd)) {
    errors.push("This password is too common—please choose something more unique.");
  }
  
  // Pattern detection
  if (detectRepeatingChars(password)) {
    errors.push("Avoid repeated characters (like 'aaaaa').");
  }
  
  if (detectSequences(password)) {
    errors.push("Avoid simple sequences (like '123456' or 'abcdef').");
  }
  
  // Personal information checks
  const pwdNormalized = normalize(password).replace(/[^a-z0-9]/g, '');
  
  // Name check
  if (info.name) {
    const nameTokens = tokenizeName(info.name);
    for (const token of nameTokens) {
      const normalizedToken = normalize(token).replace(/[^a-z0-9]/g, '');
      if (pwdNormalized.includes(normalizedToken)) {
        errors.push("For your security, don't include your name.");
        break;
      }
    }
  }
  
  // Email check
  if (info.email) {
    const emailTokens = tokenizeEmail(info.email);
    for (const token of emailTokens) {
      const normalizedToken = normalize(token).replace(/[^a-z0-9]/g, '');
      if (normalizedToken.length >= 3 && pwdNormalized.includes(normalizedToken)) {
        errors.push("Please remove parts of your email from the password.");
        break;
      }
    }
  }
  
  // DOB check
  if (info.dob) {
    const dobVars = dobVariants(info.dob);
    for (const variant of dobVars) {
      if (pwdNormalized.includes(variant.toLowerCase())) {
        errors.push("Don't include your date of birth.");
        break;
      }
    }
  }
  
  // Password confirmation check
  if (confirmPassword !== undefined && password !== confirmPassword) {
    errors.push("Passwords don't match.");
  }
  
  // Generate suggestions
  if (errors.length > 0) {
    if (password.length < 8) {
      suggestions.push("Try adding more characters to reach at least 8.");
    }
    if (!/[!@#$%^&*()_+\-=\[\]{}|;:'",.<>/?`~]/.test(password)) {
      suggestions.push("Add special characters like !, @, #, $, %, etc.");
    }
    if (!/[a-z]/.test(password)) {
      suggestions.push("Include at least one lowercase letter.");
    }
    if (!/[A-Z]/.test(password)) {
      suggestions.push("Include at least one uppercase letter.");
    }
    if (errors.some(e => e.includes("name") || e.includes("email") || e.includes("birth"))) {
      suggestions.push("Create a password that doesn't relate to your personal information.");
    }
  }
  
  const strength = calculateStrength(password);
  
  return {
    valid: errors.length === 0,
    errors,
    suggestions,
    strength
  };
}