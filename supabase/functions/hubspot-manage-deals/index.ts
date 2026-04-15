import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const GATEWAY_URL = "https://connector-gateway.lovable.dev/hubspot";

async function verifyAdmin(req: Request) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) throw new Error("Authorization required");

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  const token = authHeader.replace("Bearer ", "");
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) throw new Error("Invalid authentication");

  const { data: roles } = await supabase
    .from("user_roles")
    .select("role")
    .eq("profile_id", user.id)
    .eq("role", "admin");
  if (!roles || roles.length === 0) throw new Error("Admin access required");

  return { user, supabase };
}

function getGatewayHeaders() {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");
  const HUBSPOT_API_KEY = Deno.env.get("HUBSPOT_API_KEY");
  if (!HUBSPOT_API_KEY) throw new Error("HUBSPOT_API_KEY is not configured");

  return {
    Authorization: `Bearer ${LOVABLE_API_KEY}`,
    "X-Connection-Api-Key": HUBSPOT_API_KEY,
    "Content-Type": "application/json",
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { supabase } = await verifyAdmin(req);
    const headers = getGatewayHeaders();

    if (req.method === "GET") {
      // List deals for a contact
      const url = new URL(req.url);
      const contactId = url.searchParams.get("contactId");
      const after = url.searchParams.get("after");
      const limit = url.searchParams.get("limit") || "10";

      let endpoint: string;
      if (contactId) {
        // Get deals associated with a contact
        endpoint = `${GATEWAY_URL}/crm/v3/objects/contacts/${contactId}/associations/deals`;
      } else {
        const params = new URLSearchParams({
          limit,
          properties: "dealname,amount,dealstage,pipeline,closedate,hubspot_owner_id",
          ...(after ? { after } : {}),
        });
        endpoint = `${GATEWAY_URL}/crm/v3/objects/deals?${params}`;
      }

      const response = await fetch(endpoint, { method: "GET", headers });
      const data = await response.json();
      if (!response.ok) throw new Error(`HubSpot API error [${response.status}]: ${JSON.stringify(data)}`);

      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (req.method === "POST") {
      const body = await req.json();
      const { action } = body;

      if (action === "create") {
        const { dealName, amount, stage, pipeline, contactId, applicationId, properties: extraProps } = body;

        const dealProperties: Record<string, string> = {
          dealname: dealName || "New Application",
          dealstage: stage || "appointmentscheduled",
          pipeline: pipeline || "default",
          ...(amount ? { amount: String(amount) } : {}),
          ...extraProps,
        };

        const associations = contactId ? [{
          to: { id: contactId },
          types: [{ associationCategory: "HUBSPOT_DEFINED", associationTypeId: 3 }],
        }] : [];

        const response = await fetch(`${GATEWAY_URL}/crm/v3/objects/deals`, {
          method: "POST",
          headers,
          body: JSON.stringify({ properties: dealProperties, associations }),
        });

        const data = await response.json();
        if (!response.ok) throw new Error(`HubSpot API error [${response.status}]: ${JSON.stringify(data)}`);

        // Store deal ID back in user_applications if applicationId provided
        if (applicationId && data.id) {
          await supabase
            .from("user_applications")
            .update({ hubspot_deal_id: data.id })
            .eq("id", applicationId);
        }

        return new Response(JSON.stringify(data), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (action === "update") {
        const { dealId, properties: updateProps } = body;
        if (!dealId) throw new Error("dealId is required for update");

        const response = await fetch(`${GATEWAY_URL}/crm/v3/objects/deals/${dealId}`, {
          method: "PATCH",
          headers,
          body: JSON.stringify({ properties: updateProps }),
        });

        const data = await response.json();
        if (!response.ok) throw new Error(`HubSpot API error [${response.status}]: ${JSON.stringify(data)}`);

        return new Response(JSON.stringify(data), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      throw new Error("Invalid action. Use 'create' or 'update'");
    }

    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("hubspot-manage-deals error:", message);
    return new Response(JSON.stringify({ error: message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
