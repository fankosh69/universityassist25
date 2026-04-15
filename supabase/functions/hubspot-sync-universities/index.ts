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

    // Verify admin
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

    const gatewayHeaders = {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "X-Connection-Api-Key": HUBSPOT_API_KEY,
      "Content-Type": "application/json",
    };

    const body = await req.json();
    const { universityId } = body; // optional: sync single university

    // Fetch universities to sync
    let query = supabase.from("universities").select("id, name, website, city_id, control_type, country_code, hubspot_company_id");
    if (universityId) {
      query = query.eq("id", universityId);
    }
    const { data: universities, error: dbError } = await query;
    if (dbError) throw new Error(`Database error: ${dbError.message}`);
    if (!universities || universities.length === 0) throw new Error("No universities found");

    // Fetch city names for mapping
    const cityIds = [...new Set(universities.map((u: any) => u.city_id).filter(Boolean))];
    let cityMap: Record<string, string> = {};
    if (cityIds.length > 0) {
      const { data: cities } = await supabase.from("cities").select("id, name").in("id", cityIds);
      if (cities) {
        cityMap = Object.fromEntries(cities.map((c: any) => [c.id, c.name]));
      }
    }

    const results: any[] = [];

    for (const uni of universities) {
      try {
        const companyProperties: Record<string, string> = {
          name: uni.name,
          industry: "Higher Education",
          ...(uni.website ? { website: uni.website } : {}),
          ...(uni.city_id && cityMap[uni.city_id] ? { city: cityMap[uni.city_id] } : {}),
          ...(uni.country_code ? { country: uni.country_code === "DE" ? "Germany" : uni.country_code } : {}),
          ...(uni.control_type ? { description: `Type: ${uni.control_type}` } : {}),
        };

        let response;
        if (uni.hubspot_company_id) {
          // Update existing
          response = await fetch(`${GATEWAY_URL}/crm/v3/objects/companies/${uni.hubspot_company_id}`, {
            method: "PATCH",
            headers: gatewayHeaders,
            body: JSON.stringify({ properties: companyProperties }),
          });
        } else {
          // Create new
          response = await fetch(`${GATEWAY_URL}/crm/v3/objects/companies`, {
            method: "POST",
            headers: gatewayHeaders,
            body: JSON.stringify({ properties: companyProperties }),
          });
        }

        const data = await response.json();
        if (!response.ok) {
          results.push({ university: uni.name, status: "error", error: data });
          continue;
        }

        // Store company ID back
        if (!uni.hubspot_company_id && data.id) {
          await supabase
            .from("universities")
            .update({ hubspot_company_id: data.id })
            .eq("id", uni.id);
        }

        // Log to sync log
        await supabase.from("hubspot_sync_log").insert({
          profile_id: user.id,
          sync_type: uni.hubspot_company_id ? "company_update" : "company_create",
          sync_status: "success",
          hubspot_contact_id: data.id,
          request_data: companyProperties,
          response_data: data,
        });

        results.push({ university: uni.name, status: "success", hubspot_id: data.id });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Unknown error";
        results.push({ university: uni.name, status: "error", error: msg });
      }
    }

    return new Response(JSON.stringify({ synced: results.length, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("hubspot-sync-universities error:", message);
    return new Response(JSON.stringify({ error: message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
