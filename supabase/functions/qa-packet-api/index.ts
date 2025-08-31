import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.55.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Cache-Control': 'public, max-age=300'
};

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Only allow GET requests
  if (req.method !== 'GET') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }), 
      { 
        status: 405, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
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
      if (!key) return "Missing";
      return key.slice(0, 10) + "…";
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

    // Generate the API response
    const response = {
      success: true,
      packet: `═══════════════════════════════════════════════════════════════
🧪 TESTSPRITE QA PACKET - UNIVERSITY ASSIST
═══════════════════════════════════════════════════════════════

Project: University Assist (Staging Environment)
Generated: ${new Date().toISOString()}
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
  Password: <PROVIDED SEPARATELY>
  Role: student
  Use Case: Basic user journey, eligibility checking, watchlist

School Counselor Account:
  Email: ${counselorEmail || '<MISSING>'}
  Password: <PROVIDED SEPARATELY>
  Role: school_counselor  
  Use Case: Student management, cohort tracking, reporting

Admin Account:
  Email: ${adminEmail || '<MISSING>'}
  Password: <PROVIDED SEPARATELY>
  Role: admin
  Use Case: Full system access, data management, configuration

───────────────────────────────────────────────────────────────
📋 TEST DOCUMENTATION  
───────────────────────────────────────────────────────────────
Runbook: /testsprite/runbook.md
Config: /testsprite/config.json

───────────────────────────────────────────────────────────────
⚠️  IMPORTANT NOTES
───────────────────────────────────────────────────────────────
• All email sending is SANDBOXED - no real emails will be sent
• QA mode banner should be visible on all pages
• Map uses Mapbox tokens (rate-limited for heavy testing)
• Database includes sample German universities and programs
• RLS policies enforce role-based data access
• Audit logging captures all user actions for security compliance

═══════════════════════════════════════════════════════════════
End of TestSprite QA Packet
═══════════════════════════════════════════════════════════════`,
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
      },
      timestamp: new Date().toISOString()
    };

    return new Response(JSON.stringify(response, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });

  } catch (error) {
    console.error('Error in qa-packet-api function:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Internal server error',
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });
  }
});