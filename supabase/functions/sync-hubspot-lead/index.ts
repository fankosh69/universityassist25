import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface LeadData {
  email: string;
  full_name: string;
  phone?: string;
  gender?: string;
  date_of_birth?: string;
  country_code?: string;
  is_underage?: boolean;
  parent_email?: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const ZAPIER_WEBHOOK_URL = Deno.env.get("ZAPIER_HUBSPOT_WEBHOOK_URL");
    
    if (!ZAPIER_WEBHOOK_URL) {
      console.error("ZAPIER_HUBSPOT_WEBHOOK_URL is not configured");
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Webhook URL not configured" 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    const leadData: LeadData = await req.json();
    console.log("Received lead data for sync:", { 
      email: leadData.email, 
      name: leadData.full_name 
    });

    // Validate required fields
    if (!leadData.email || !leadData.full_name) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Email and full_name are required" 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    // Prepare payload for Zapier
    const zapierPayload = {
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

    console.log("Sending to Zapier webhook...");

    // Send to Zapier webhook
    let syncStatus = "success";
    let errorMessage: string | null = null;
    let responseData: any = null;

    try {
      const zapierResponse = await fetch(ZAPIER_WEBHOOK_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(zapierPayload),
      });

      responseData = {
        status: zapierResponse.status,
        statusText: zapierResponse.statusText,
      };

      // Try to read response body if available
      try {
        const responseText = await zapierResponse.text();
        if (responseText) {
          responseData.body = responseText;
        }
      } catch {
        // Ignore if we can't read the body
      }

      if (!zapierResponse.ok) {
        syncStatus = "failed";
        errorMessage = `Zapier returned status ${zapierResponse.status}`;
        console.error("Zapier webhook error:", errorMessage);
      } else {
        console.log("Successfully sent to Zapier");
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
        sync_type: "signup",
        sync_status: syncStatus,
        request_data: zapierPayload,
        response_data: responseData,
        error_message: errorMessage,
        synced_at: new Date().toISOString(),
      });

    if (logError) {
      console.error("Failed to log sync attempt:", logError);
    } else {
      console.log("Sync attempt logged successfully");
    }

    return new Response(
      JSON.stringify({ 
        success: syncStatus === "success",
        message: syncStatus === "success" 
          ? "Lead synced to HubSpot via Zapier" 
          : "Sync attempted but may have failed",
        error: errorMessage,
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );

  } catch (error) {
    console.error("Error in sync-hubspot-lead:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : "Unknown error" 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
