import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface LeadData {
  sync_type?: "signup" | "onboarding_complete";
  email: string;
  full_name: string;
  phone?: string;
  gender?: string;
  date_of_birth?: string;
  country_code?: string;
  is_underage?: boolean;
  parent_email?: string;
  // Onboarding fields
  nationality?: string;
  curriculum?: string;
  gpa_raw?: number;
  gpa_scale?: number;
  gpa_min_pass?: number;
  total_ects?: number;
  languages?: Array<{
    language: string;
    cefr_level?: string;
    test_type?: string;
    test_score?: string;
  }>;
  preferred_fields?: string[];
  preferred_degree_type?: string;
  preferred_cities?: string[];
  career_goals?: string;
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

    // Build payload based on sync type
    let zapierPayload: Record<string, any>;

    if (syncType === "onboarding_complete") {
      zapierPayload = {
        sync_type: "onboarding_complete",
        email: leadData.email,
        full_name: leadData.full_name,
        nationality: leadData.nationality || "",
        curriculum: leadData.curriculum || "",
        gpa_raw: leadData.gpa_raw ?? null,
        gpa_scale: leadData.gpa_scale ?? null,
        gpa_min_pass: leadData.gpa_min_pass ?? null,
        total_ects: leadData.total_ects ?? 0,
        languages: leadData.languages || [],
        preferred_fields: leadData.preferred_fields || [],
        preferred_degree_type: leadData.preferred_degree_type || "",
        preferred_cities: leadData.preferred_cities || [],
        career_goals: leadData.career_goals || "",
        onboarding_completed_date: new Date().toISOString(),
        source: "university_assist_onboarding",
      };
    } else {
      zapierPayload = {
        sync_type: "signup",
        email: leadData.email,
        full_name: leadData.full_name,
        phone: leadData.country_code && leadData.phone 
          ? `${leadData.country_code}${leadData.phone}` 
          : leadData.phone || "",
        gender: leadData.gender || "",
        date_of_birth: leadData.date_of_birth || "",
        signup_date: new Date().toISOString(),
        source: "university_assist_signup",
        is_underage: leadData.is_underage || false,
        parent_email: leadData.parent_email || "",
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
