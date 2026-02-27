import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface LeadData {
  sync_type?: "signup" | "onboarding_complete";
  platform_user_id?: string;
  email: string;
  full_name: string;
  phone?: string;
  gender?: string;
  date_of_birth?: string;
  country_code?: string;
  is_underage?: boolean;
  parent_email?: string;
  parent_consent_given?: boolean;
  // Onboarding fields
  nationality?: string;
  country_of_residence?: string;
  curriculum?: string;
  desired_education_level?: string;
  desired_major?: string;
  school_name?: string;
  blocked_bank_account_aware?: string;
  gpa_raw?: number;
  gpa_scale?: number;
  gpa_min_pass?: number;
  german_gpa?: number;
  total_ects?: number;
  languages?: Array<{
    language: string;
    cefr_level?: string;
    test_type?: string;
    test_score?: string;
  }>;
  preferred_fields?: string[];
  preferred_cities?: string[];
  career_goals?: string;
  xp_points?: number;
  profile_completion_pct?: number;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const ZAPIER_WEBHOOK_URL = Deno.env.get("ZAPIER_HUBSPOT_WEBHOOK_URL");
    
    if (!ZAPIER_WEBHOOK_URL) {
      console.error("ZAPIER_HUBSPOT_WEBHOOK_URL is not configured");
      return new Response(
        JSON.stringify({ success: false, error: "Webhook URL not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const leadData: LeadData = await req.json();
    const syncType = leadData.sync_type || "signup";
    
    console.log(`Received ${syncType} lead data for sync:`, { 
      email: leadData.email, 
      name: leadData.full_name 
    });

    if (!leadData.email || !leadData.full_name) {
      return new Response(
        JSON.stringify({ success: false, error: "Email and full_name are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Extract language test details from languages array
    const englishLang = leadData.languages?.find(l => l.language.toLowerCase() === "english");
    const germanLang = leadData.languages?.find(l => l.language.toLowerCase() === "german");

    // Build payload using canonical HubSpot property names (per audit plan)
    let zapierPayload: Record<string, any>;

    if (syncType === "onboarding_complete") {
      zapierPayload = {
        sync_type: "onboarding_complete",
        // Core identity
        email: leadData.email,
        full_name: leadData.full_name,
        platform_user_id: leadData.platform_user_id || "",
        nationality: leadData.nationality || "",
        country_of_residence: leadData.country_of_residence || "",
        // Academic — canonical names
        curriculum: leadData.curriculum || "",
        desired_education_level: leadData.desired_education_level || "",
        desired_major: leadData.desired_major || "",
        high_school_name: leadData.school_name || "",
        blocked_bank_account_aware: leadData.blocked_bank_account_aware || "",
        // GPA — new numeric properties
        gpa_raw: leadData.gpa_raw ?? null,
        gpa_scale: leadData.gpa_scale ?? null,
        gpa_min_pass: leadData.gpa_min_pass ?? null,
        german_gpa: leadData.german_gpa ?? null,
        total_ects: leadData.total_ects ?? 0,
        // Language — CEFR canonical + test details
        english_cefr_level: englishLang?.cefr_level || "",
        language_test_english_type: englishLang?.test_type || "",
        language_test_english_score: englishLang?.test_score || "",
        german_cefr_level: germanLang?.cefr_level || "",
        language_test_german_type: germanLang?.test_type || "",
        language_test_german_score: germanLang?.test_score || "",
        // Preferences
        preferred_fields: (leadData.preferred_fields || []).join(", "),
        preferred_cities: (leadData.preferred_cities || []).join(", "),
        career_goals: leadData.career_goals || "",
        // Gamification & progress
        xp_points: leadData.xp_points ?? 0,
        profile_completion_pct: leadData.profile_completion_pct ?? 0,
        // Timestamps
        onboarding_completed_date: new Date().toISOString(),
        signup_source: "university_assist_platform",
      };
    } else {
      zapierPayload = {
        sync_type: "signup",
        email: leadData.email,
        full_name: leadData.full_name,
        platform_user_id: leadData.platform_user_id || "",
        phone: leadData.country_code && leadData.phone 
          ? `${leadData.country_code}${leadData.phone}` 
          : leadData.phone || "",
        gender: leadData.gender || "",
        date_of_birth: leadData.date_of_birth || "",
        signup_date: new Date().toISOString(),
        signup_source: "university_assist_platform",
        is_minor: leadData.is_underage || false,
        parent_email: leadData.parent_email || "",
        parent_consent_given: leadData.parent_consent_given || false,
      };
    }

    console.log(`Sending ${syncType} to Zapier webhook...`);

    let syncStatus = "success";
    let errorMessage: string | null = null;
    let responseData: any = null;

    try {
      const zapierResponse = await fetch(ZAPIER_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(zapierPayload),
      });

      responseData = {
        status: zapierResponse.status,
        statusText: zapierResponse.statusText,
      };

      try {
        const responseText = await zapierResponse.text();
        if (responseText) responseData.body = responseText;
      } catch { /* ignore */ }

      if (!zapierResponse.ok) {
        syncStatus = "failed";
        errorMessage = `Zapier returned status ${zapierResponse.status}`;
        console.error("Zapier webhook error:", errorMessage);
      } else {
        console.log(`Successfully sent ${syncType} to Zapier`);
      }
    } catch (fetchError) {
      syncStatus = "failed";
      errorMessage = fetchError instanceof Error ? fetchError.message : "Unknown fetch error";
      console.error("Failed to call Zapier webhook:", errorMessage);
    }

    // Log to hubspot_sync_log table
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { error: logError } = await supabase
      .from("hubspot_sync_log")
      .insert({
        sync_type: syncType,
        sync_status: syncStatus,
        request_data: zapierPayload,
        response_data: responseData,
        error_message: errorMessage,
        synced_at: new Date().toISOString(),
      });

    if (logError) {
      console.error("Failed to log sync attempt:", logError);
    }

    return new Response(
      JSON.stringify({ 
        success: syncStatus === "success",
        message: syncStatus === "success" 
          ? `Lead ${syncType} synced to HubSpot via Zapier` 
          : "Sync attempted but may have failed",
        error: errorMessage,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in sync-hubspot-lead:", error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
