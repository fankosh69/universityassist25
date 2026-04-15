import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const GATEWAY_URL = "https://connector-gateway.lovable.dev/hubspot";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const HUBSPOT_API_KEY = Deno.env.get("HUBSPOT_API_KEY");
    if (!HUBSPOT_API_KEY) throw new Error("HUBSPOT_API_KEY is not configured");

    // Verify admin access
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Authorization required");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) throw new Error("Invalid authentication");

    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("profile_id", user.id)
      .eq("role", "admin");
    if (!roles || roles.length === 0) throw new Error("Admin access required");

    const url = new URL(req.url);
    const email = url.searchParams.get("email");
    const after = url.searchParams.get("after");
    const limit = url.searchParams.get("limit") || "10";
    const properties = url.searchParams.get("properties") || "firstname,lastname,email,phone,lifecyclestage,hs_lead_status";

    const gatewayHeaders = {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "X-Connection-Api-Key": HUBSPOT_API_KEY,
      "Content-Type": "application/json",
    };

    let response;

    if (email) {
      // Search by email
      response = await fetch(`${GATEWAY_URL}/crm/v3/objects/contacts/search`, {
        method: "POST",
        headers: gatewayHeaders,
        body: JSON.stringify({
          filterGroups: [{
            filters: [{ propertyName: "email", operator: "EQ", value: email }],
          }],
          properties: properties.split(","),
          limit: parseInt(limit),
        }),
      });
    } else {
      // List contacts
      const params = new URLSearchParams({
        limit,
        properties,
        ...(after ? { after } : {}),
      });
      response = await fetch(`${GATEWAY_URL}/crm/v3/objects/contacts?${params}`, {
        method: "GET",
        headers: gatewayHeaders,
      });
    }

    const data = await response.json();
    if (!response.ok) {
      throw new Error(`HubSpot API error [${response.status}]: ${JSON.stringify(data)}`);
    }

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("hubspot-read-contacts error:", message);
    return new Response(JSON.stringify({ error: message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
