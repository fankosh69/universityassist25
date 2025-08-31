#!/usr/bin/env node

/**
 * TestSprite QA Packet Generator
 * 
 * This script generates a test packet for TestSprite containing all necessary
 * information for QA testing, while keeping sensitive data secure.
 *
 * Usage: npm run testsprite:packet
 * 
 * Environment: Server/CI only - DO NOT bundle client-side
 */

// Load environment variables from secrets
const {
  TESTSPRITE_API_KEY,
  TESTSPRITE_STUDENT_EMAIL,
  TESTSPRITE_STUDENT_PASSWORD,
  TESTSPRITE_COUNSELOR_EMAIL, 
  TESTSPRITE_COUNSELOR_PASSWORD,
  TESTSPRITE_ADMIN_EMAIL,
  TESTSPRITE_ADMIN_PASSWORD,
  QA_MODE,
  SENDGRID_SANDBOX
} = process.env;

/**
 * Mask sensitive keys for logging (show first 10 chars + ellipsis)
 */
function maskKey(key) {
  if (!key) return "<MISSING - CHECK SECRETS>";
  return key.slice(0, 10) + "…";
}

/**
 * Check if a credential pair exists
 */
function credentialStatus(email, password) {
  if (!email || !password) return "<MISSING - CHECK SECRETS>";
  return "<PROVIDED SEPARATELY>";
}

/**
 * Generate timestamp for packet
 */
function getTimestamp() {
  return new Date().toISOString();
}

// Validate required environment variables
const missingVars = [];
if (!TESTSPRITE_API_KEY) missingVars.push('TESTSPRITE_API_KEY');
if (!TESTSPRITE_STUDENT_EMAIL) missingVars.push('TESTSPRITE_STUDENT_EMAIL');
if (!TESTSPRITE_STUDENT_PASSWORD) missingVars.push('TESTSPRITE_STUDENT_PASSWORD');
if (!TESTSPRITE_COUNSELOR_EMAIL) missingVars.push('TESTSPRITE_COUNSELOR_EMAIL');
if (!TESTSPRITE_COUNSELOR_PASSWORD) missingVars.push('TESTSPRITE_COUNSELOR_PASSWORD');
if (!TESTSPRITE_ADMIN_EMAIL) missingVars.push('TESTSPRITE_ADMIN_EMAIL');
if (!TESTSPRITE_ADMIN_PASSWORD) missingVars.push('TESTSPRITE_ADMIN_PASSWORD');

if (missingVars.length > 0) {
  console.error('❌ Missing required environment variables:');
  missingVars.forEach(v => console.error(`  - ${v}`));
  process.exit(1);
}

// Generate the test packet
const packet = `
═══════════════════════════════════════════════════════════════
🧪 TESTSPRITE QA PACKET - UNIVERSITY ASSIST
═══════════════════════════════════════════════════════════════

Project: University Assist (Staging Environment)
Generated: ${getTimestamp()}
Mode: QA Testing (${QA_MODE === 'true' ? '✅ Active' : '❌ Inactive'})
Email Sandbox: ${SENDGRID_SANDBOX === 'true' ? '✅ Active' : '❌ Inactive'}

───────────────────────────────────────────────────────────────
📍 ENVIRONMENT DETAILS
───────────────────────────────────────────────────────────────
Base URL: https://universityassist25.lovable.app
Auth System: Supabase Authentication
Database: PostgreSQL with RLS
Map Integration: Mapbox GL JS
Email System: SendGrid (Sandbox Mode)

───────────────────────────────────────────────────────────────
🔐 API CREDENTIALS (Store in TestSprite - DO NOT PASTE IN APP)
───────────────────────────────────────────────────────────────
TestSprite API Key: ${maskKey(TESTSPRITE_API_KEY)}

───────────────────────────────────────────────────────────────
👥 TEST USER ACCOUNTS
───────────────────────────────────────────────────────────────
Student Account:
  Email: ${TESTSPRITE_STUDENT_EMAIL}
  Password: ${credentialStatus(TESTSPRITE_STUDENT_EMAIL, TESTSPRITE_STUDENT_PASSWORD)}
  Role: student
  Use Case: Basic user journey, eligibility checking, watchlist

School Counselor Account:
  Email: ${TESTSPRITE_COUNSELOR_EMAIL}
  Password: ${credentialStatus(TESTSPRITE_COUNSELOR_EMAIL, TESTSPRITE_COUNSELOR_PASSWORD)}
  Role: school_counselor  
  Use Case: Student management, cohort tracking, reporting

Admin Account:
  Email: ${TESTSPRITE_ADMIN_EMAIL}
  Password: ${credentialStatus(TESTSPRITE_ADMIN_EMAIL, TESTSPRITE_ADMIN_PASSWORD)}
  Role: admin
  Use Case: Full system access, data management, configuration

───────────────────────────────────────────────────────────────
📋 TEST DOCUMENTATION  
───────────────────────────────────────────────────────────────
Runbook: /testsprite/runbook.md
Config: /testsprite/config.json

───────────────────────────────────────────────────────────────
🎯 KEY TEST SCENARIOS
───────────────────────────────────────────────────────────────
1. City → University → Program Navigation
   • Mapbox map loads and markers are clickable
   • University details and program listings functional
   • Eligibility panel shows German GPA conversion

2. Search & Filtering  
   • Full-text search with German characters (ä, ö, ü, ß)
   • Faceted filtering by degree, city, tuition, etc.
   • Performance: Search results < 300ms p95

3. Internationalization (i18n)
   • EN: Default language
   • AR: RTL layout, Arabic text rendering
   • DE: German content and UI translations

4. User Role Access Control
   • Student: Profile, watchlist, eligibility checking
   • Counselor: Student management, cohort tracking  
   • Admin: Full system access, user management

5. Email System (Sandboxed)
   • No real emails sent during testing
   • SendGrid sandbox mode captures all outbound messages
   • Email templates render correctly

───────────────────────────────────────────────────────────────
⚠️  IMPORTANT NOTES
───────────────────────────────────────────────────────────────
• All email sending is SANDBOXED - no real emails will be sent
• QA mode banner should be visible on all pages
• Map uses Mapbox tokens (rate-limited for heavy testing)
• Database includes sample German universities and programs
• RLS policies enforce role-based data access
• Audit logging captures all user actions for security compliance

───────────────────────────────────────────────────────────────
🔧 TECHNICAL REQUIREMENTS
───────────────────────────────────────────────────────────────
• Modern browser (Chrome 90+, Firefox 88+, Safari 14+)
• JavaScript enabled
• Local storage/cookies allowed
• Screen resolution: 1024x768 minimum
• Network: Stable internet for map tiles and API calls

═══════════════════════════════════════════════════════════════
End of TestSprite QA Packet
═══════════════════════════════════════════════════════════════
`;

console.log(packet);

// Summary for build logs
console.log('\n📊 PACKET SUMMARY:');
console.log(`✅ API Key: ${TESTSPRITE_API_KEY ? 'Present' : 'Missing'}`);
console.log(`✅ Student Account: ${TESTSPRITE_STUDENT_EMAIL ? 'Configured' : 'Missing'}`);
console.log(`✅ Counselor Account: ${TESTSPRITE_COUNSELOR_EMAIL ? 'Configured' : 'Missing'}`);
console.log(`✅ Admin Account: ${TESTSPRITE_ADMIN_EMAIL ? 'Configured' : 'Missing'}`);
console.log(`✅ QA Mode: ${QA_MODE === 'true' ? 'Active' : 'Inactive'}`);
console.log(`✅ Email Sandbox: ${SENDGRID_SANDBOX === 'true' ? 'Active' : 'Inactive'}`);