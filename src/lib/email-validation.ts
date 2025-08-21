// Email validation utility with comprehensive typo detection and domain validation

// Known email providers with their correct domains
const KNOWN_PROVIDERS = [
  'gmail.com', 'googlemail.com',
  'yahoo.com', 'ymail.com',
  'outlook.com', 'hotmail.com', 'live.com', 'msn.com',
  'icloud.com', 'me.com', 'mac.com',
  'aol.com', 'proton.me', 'protonmail.com',
  'yandex.com', 'yandex.ru',
  'zoho.com', 'gmx.com', 'mail.com'
];

// Common typo mappings
const COMMON_TYPO_MAP: { [key: string]: string } = {
  // Gmail typos
  'gamil.com': 'gmail.com',
  'gmai.com': 'gmail.com',
  'gmial.com': 'gmail.com',
  'gmaill.com': 'gmail.com',
  'gmail.co': 'gmail.com',
  'gmai.co': 'gmail.com',
  'gmail.cm': 'gmail.com',
  'gmail.om': 'gmail.com',
  'gnail.com': 'gmail.com',
  'gmaik.com': 'gmail.com',
  
  // Yahoo typos
  'yaho.com': 'yahoo.com',
  'yahooo.com': 'yahoo.com',
  'yahoo.co': 'yahoo.com',
  'yahoo.net': 'yahoo.com',
  'yahoo.cm': 'yahoo.com',
  'yahoo.om': 'yahoo.com',
  'yahho.com': 'yahoo.com',
  'ymail.co': 'ymail.com',
  
  // Outlook/Hotmail typos
  'hotmial.com': 'hotmail.com',
  'hotmai.com': 'hotmail.com',
  'hotmil.com': 'hotmail.com',
  'hotmail.co': 'hotmail.com',
  'hotmail.cm': 'hotmail.com',
  'hotmail.om': 'hotmail.com',
  'hotnail.com': 'hotmail.com',
  'outlok.com': 'outlook.com',
  'outlook.co': 'outlook.com',
  'outlook.cm': 'outlook.com',
  'outlook.om': 'outlook.com',
  
  // iCloud typos
  'iclod.com': 'icloud.com',
  'ic1oud.com': 'icloud.com',
  'icloud.co': 'icloud.com',
  'icloud.cm': 'icloud.com',
  'icloud.om': 'icloud.com',
  
  // Other providers
  'aol.co': 'aol.com',
  'aol.cm': 'aol.com',
  'aol.om': 'aol.com',
  'live.co': 'live.com',
  'live.cm': 'live.com',
  'live.om': 'live.com',
};

// Common disposable email domains
const DISPOSABLE_DOMAINS = [
  '10minutemail.com', '10minutemail.net', 'tempmail.org', 'guerrillamail.com',
  'mailinator.com', 'throwaway.email', 'temp-mail.org', 'getnada.com',
  'yopmail.com', 'maildrop.cc', 'guerrillamailblock.com', 'sharklasers.com',
  'guerrillamail.net', 'guerrillamail.biz', 'guerrillamail.org', 'guerrillamailblock.com'
];

// Role-based email prefixes
const ROLE_PREFIXES = [
  'admin', 'support', 'info', 'sales', 'hr', 'contact', 'help', 'service',
  'marketing', 'billing', 'accounts', 'noreply', 'no-reply'
];

// Calculate Levenshtein distance
function levenshteinDistance(str1: string, str2: string): number {
  const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));
  
  for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
  for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;
  
  for (let j = 1; j <= str2.length; j++) {
    for (let i = 1; i <= str1.length; i++) {
      const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1,     // deletion
        matrix[j - 1][i] + 1,     // insertion
        matrix[j - 1][i - 1] + indicator // substitution
      );
    }
  }
  
  return matrix[str2.length][str1.length];
}

// Find closest provider domain
function findClosestProvider(domain: string): string | null {
  // Check direct typo mapping first
  if (COMMON_TYPO_MAP[domain]) {
    return COMMON_TYPO_MAP[domain];
  }
  
  let bestMatch = null;
  let bestDistance = Infinity;
  
  for (const provider of KNOWN_PROVIDERS) {
    const distance = levenshteinDistance(domain, provider);
    if (distance <= 2 && distance < bestDistance) {
      bestDistance = distance;
      bestMatch = provider;
    }
  }
  
  return bestMatch;
}

// Basic email format validation
function validateEmailFormat(email: string): { valid: boolean; message?: string } {
  if (!email) return { valid: false, message: "Email is required" };
  
  if (email.length > 254) {
    return { valid: false, message: "Email address is too long" };
  }
  
  // Check for multiple @ symbols
  const atCount = (email.match(/@/g) || []).length;
  if (atCount !== 1) {
    return { valid: false, message: "Email must contain exactly one @ symbol" };
  }
  
  const [localPart, domain] = email.split('@');
  
  if (!localPart || !domain) {
    return { valid: false, message: "Enter a valid email like name@example.com" };
  }
  
  // Check for consecutive dots or leading/trailing dots
  if (localPart.includes('..') || domain.includes('..') || 
      localPart.startsWith('.') || localPart.endsWith('.') ||
      domain.startsWith('.') || domain.endsWith('.')) {
    return { valid: false, message: "Email contains invalid dot placement" };
  }
  
  // Check for invalid characters in local part
  const validLocalChars = /^[a-zA-Z0-9._+-]+$/;
  if (!validLocalChars.test(localPart)) {
    return { valid: false, message: "Email contains invalid characters" };
  }
  
  // Basic domain format check
  if (!domain.includes('.') || domain.endsWith('.')) {
    return { valid: false, message: "Please enter a valid email domain (e.g., example.com)" };
  }
  
  return { valid: true };
}

// Check if domain is disposable
function isDisposableEmail(domain: string): boolean {
  return DISPOSABLE_DOMAINS.includes(domain.toLowerCase());
}

// Check if email is role-based
function isRoleBasedEmail(email: string): boolean {
  const localPart = email.split('@')[0].toLowerCase();
  return ROLE_PREFIXES.some(role => localPart.startsWith(role));
}

// Check if domain looks like educational institution
function isEducationalDomain(domain: string): boolean {
  const lowerDomain = domain.toLowerCase();
  
  // Common educational TLDs
  if (lowerDomain.endsWith('.edu') || 
      lowerDomain.includes('.edu.') ||
      lowerDomain.includes('.ac.') ||
      lowerDomain.includes('.uni.')) {
    return true;
  }
  
  // Common university keywords
  const eduKeywords = ['uni', 'university', 'college', 'campus', 'school', 'academic'];
  return eduKeywords.some(keyword => lowerDomain.includes(keyword));
}

export interface EmailValidationResult {
  valid: boolean;
  level: 'ok' | 'warn' | 'error';
  message?: string;
  suggestion?: string;
  needsDomainCheck?: boolean;
}

export interface DomainCheckResult {
  domain: string;
  hasMX: boolean;
  hasAorAAAA: boolean;
  mxSummary?: string;
  webReachable: boolean;
  organizationHint: 'company' | 'school' | 'unknown';
}

// Main email validation function (client-side checks only)
export function validateEmailClient(email: string): EmailValidationResult {
  // Basic format validation
  const formatCheck = validateEmailFormat(email);
  if (!formatCheck.valid) {
    return {
      valid: false,
      level: 'error',
      message: formatCheck.message
    };
  }
  
  const [localPart, domain] = email.split('@');
  const lowerDomain = domain.toLowerCase();
  
  // Check for disposable emails
  if (isDisposableEmail(lowerDomain)) {
    return {
      valid: false,
      level: 'error',
      message: 'Please use a permanent email (disposable addresses aren\'t allowed)'
    };
  }
  
  // Check for role-based emails (warning, not blocking)
  if (isRoleBasedEmail(email)) {
    return {
      valid: true,
      level: 'warn',
      message: 'Role-based emails (like admin@, support@) may have delivery issues'
    };
  }
  
  // Check if it's a known provider
  if (KNOWN_PROVIDERS.includes(lowerDomain)) {
    return { valid: true, level: 'ok' };
  }
  
  // Check for typos in known providers
  const suggestion = findClosestProvider(lowerDomain);
  if (suggestion) {
    return {
      valid: false,
      level: 'error',
      message: `Did you mean ${localPart}@${suggestion}?`,
      suggestion: `${localPart}@${suggestion}`
    };
  }
  
  // For custom domains, we need server-side validation
  return {
    valid: true,
    level: 'ok',
    needsDomainCheck: true
  };
}

// Full email validation (includes server-side domain check)
export async function validateEmail(email: string): Promise<EmailValidationResult> {
  const clientResult = validateEmailClient(email);
  
  // If client validation failed or doesn't need domain check, return early
  if (!clientResult.valid || !clientResult.needsDomainCheck) {
    return clientResult;
  }
  
  const [, domain] = email.split('@');
  
  try {
    // Call our edge function for domain validation
    const response = await fetch(`https://zfiexgjcuojodmnsinsz.supabase.co/functions/v1/email-domain-check?domain=${encodeURIComponent(domain)}`);
    
    if (!response.ok) {
      // If domain check fails, allow the email but warn
      return {
        valid: true,
        level: 'warn',
        message: 'Could not verify domain - please ensure it\'s correct'
      };
    }
    
    const domainInfo: DomainCheckResult = await response.json();
    
    // No MX records found
    if (!domainInfo.hasMX && !domainInfo.hasAorAAAA) {
      return {
        valid: false,
        level: 'error',
        message: 'This email\'s domain can\'t be found (DNS error). Check the spelling or try another email.'
      };
    }
    
    // Has A/AAAA but no MX (warning, not blocking)
    if (!domainInfo.hasMX && domainInfo.hasAorAAAA) {
      return {
        valid: true,
        level: 'warn',
        message: 'This domain may not receive email (no MX records). You can try, but delivery might fail.'
      };
    }
    
    // Educational domain hint
    if (domainInfo.organizationHint === 'school') {
      return {
        valid: true,
        level: 'warn',
        message: 'This looks like a school/university email. To ensure you receive our messages, please add noreply@uniassist.net and support@uniassist.net to your email whitelist or safe senders list. You may also need to check your spam/junk folder initially.'
      };
    }
    
    // Website not reachable for custom domains
    if (!domainInfo.webReachable && domainInfo.organizationHint === 'unknown') {
      return {
        valid: true,
        level: 'warn',
        message: 'We couldn\'t confirm this domain\'s website. If it\'s a company/school address, confirm it\'s active.'
      };
    }
    
    return { valid: true, level: 'ok' };
    
  } catch (error) {
    // If domain check fails, allow the email but warn
    return {
      valid: true,
      level: 'warn',
      message: 'Could not verify domain - please ensure it\'s correct'
    };
  }
}
