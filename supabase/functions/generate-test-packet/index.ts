import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.55.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Get environment variables
    const testspriteApiKey = Deno.env.get('TESTSPRITE_API_KEY');
    const qaMode = Deno.env.get('QA_MODE');
    const sendgridSandbox = Deno.env.get('SENDGRID_SANDBOX');
    
    const studentEmail = Deno.env.get('TESTSPRITE_STUDENT_EMAIL');
    const counselorEmail = Deno.env.get('TESTSPRITE_COUNSELOR_EMAIL');
    const adminEmail = Deno.env.get('TESTSPRITE_ADMIN_EMAIL');

    // Mask API key for security
    function maskKey(key: string | undefined): string {
      if (!key) return "<MISSING - CHECK SECRETS>";
      return key.slice(0, 10) + "…";
    }

    // Check credential status
    function credentialStatus(email: string | undefined, password: string | undefined): string {
      if (!email || !password) return "<MISSING - CHECK SECRETS>";
      return "<PROVIDED SEPARATELY>";
    }

    // Get data counts for verification
    const { count: citiesCount } = await supabase
      .from('cities')
      .select('*', { count: 'exact', head: true });

    const { count: universitiesCount } = await supabase
      .from('universities')
      .select('*', { count: 'exact', head: true });

    const { count: programsCount } = await supabase
      .from('programs')
      .select('*', { count: 'exact', head: true });

    // Generate timestamp
    const timestamp = new Date().toISOString();

    // Generate the test packet
    const packet = `
═══════════════════════════════════════════════════════════════
🧪 TESTSPRITE QA PACKET - UNIVERSITY ASSIST
═══════════════════════════════════════════════════════════════

Project: University Assist (Staging Environment)
Generated: ${timestamp}
Mode: QA Testing (${qaMode === 'true' ? '✅ Active' : '❌ Inactive'})
Email Sandbox: ${sendgridSandbox === 'true' ? '✅ Active' : '❌ Inactive'}

───────────────────────────────────────────────────────────────
📍 ENVIRONMENT DETAILS
───────────────────────────────────────────────────────────────
Base URL: https://universityassist25.lovable.app
Auth System: Supabase Authentication
Database: PostgreSQL with RLS
Map Integration: Mapbox GL JS
Email System: SendGrid (Sandbox Mode)

Data Verification:
- Cities: ${citiesCount || 0}
- Universities: ${universitiesCount || 0} 
- Programs: ${programsCount || 0}

───────────────────────────────────────────────────────────────
🔐 API CREDENTIALS (Store in TestSprite - DO NOT PASTE IN APP)
───────────────────────────────────────────────────────────────
TestSprite API Key: ${maskKey(testspriteApiKey)}

───────────────────────────────────────────────────────────────
👥 TEST USER ACCOUNTS
───────────────────────────────────────────────────────────────
Student Account:
  Email: ${studentEmail || '<MISSING>'}
  Password: ${credentialStatus(studentEmail, Deno.env.get('TESTSPRITE_STUDENT_PASSWORD'))}
  Role: student
  Use Case: Basic user journey, eligibility checking, watchlist

School Counselor Account:
  Email: ${counselorEmail || '<MISSING>'}
  Password: ${credentialStatus(counselorEmail, Deno.env.get('TESTSPRITE_COUNSELOR_PASSWORD'))}
  Role: school_counselor  
  Use Case: Student management, cohort tracking, reporting

Admin Account:
  Email: ${adminEmail || '<MISSING>'}
  Password: ${credentialStatus(adminEmail, Deno.env.get('TESTSPRITE_ADMIN_PASSWORD'))}
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

    return new Response(JSON.stringify({
      success: true,
      packet: packet,
      summary: {
        apiKey: testspriteApiKey ? 'Present' : 'Missing',
        studentAccount: studentEmail ? 'Configured' : 'Missing',
        counselorAccount: counselorEmail ? 'Configured' : 'Missing',
        adminAccount: adminEmail ? 'Configured' : 'Missing',
        qaMode: qaMode === 'true' ? 'Active' : 'Inactive',
        emailSandbox: sendgridSandbox === 'true' ? 'Active' : 'Inactive',
        dataCounts: {
          cities: citiesCount || 0,
          universities: universitiesCount || 0,
          programs: programsCount || 0
        }
      }
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });

  } catch (error) {
    console.error('Error in generate-test-packet function:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });
  }
});