import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // HubSpot sends an array of events
    const events = await req.json();
    const eventArray = Array.isArray(events) ? events : [events];

    const results: any[] = [];

    for (const event of eventArray) {
      const { subscriptionType, objectId, propertyName, propertyValue } = event;

      // Log the webhook event
      await supabase.from("hubspot_webhook_log").insert({
        event_type: subscriptionType || "unknown",
        object_type: subscriptionType?.split(".")[0] || "unknown",
        object_id: String(objectId || ""),
        properties: propertyName ? { [propertyName]: propertyValue } : null,
        raw_payload: event,
        processed: false,
      });

      try {
        // Handle contact property changes
        if (subscriptionType?.startsWith("contact.")) {
          if (subscriptionType === "contact.propertyChange") {
            // Find the profile linked to this HubSpot contact
            const { data: syncLog } = await supabase
              .from("hubspot_sync_log")
              .select("profile_id")
              .eq("hubspot_contact_id", String(objectId))
              .eq("sync_status", "success")
              .order("synced_at", { ascending: false })
              .limit(1)
              .single();

            if (syncLog?.profile_id && propertyName && propertyValue) {
              // Map HubSpot property changes back to profile fields
              const fieldMapping: Record<string, string> = {
                firstname: "full_name",
                phone: "phone",
                lifecyclestage: "role",
              };

              const profileField = fieldMapping[propertyName];
              if (profileField) {
                // Log the mapping but don't auto-update sensitive profile data
                // Admin should review webhook events and approve changes
                await supabase.from("hubspot_webhook_log")
                  .update({
                    processed: true,
                    processed_at: new Date().toISOString(),
                    properties: {
                      hubspot_property: propertyName,
                      hubspot_value: propertyValue,
                      mapped_field: profileField,
                      profile_id: syncLog.profile_id,
                      action: "pending_review",
                    },
                  })
                  .eq("object_id", String(objectId))
                  .eq("event_type", subscriptionType)
                  .order("created_at", { ascending: false })
                  .limit(1);
              }
            }
          }

          results.push({ objectId, type: subscriptionType, status: "logged" });
        }

        // Handle deal stage changes
        if (subscriptionType?.startsWith("deal.")) {
          if (subscriptionType === "deal.propertyChange" && propertyName === "dealstage") {
            // Find application linked to this deal
            const { data: app } = await supabase
              .from("user_applications")
              .select("id")
              .eq("hubspot_deal_id", String(objectId))
              .single();

            if (app) {
              // Map deal stages to application statuses
              const stageMapping: Record<string, string> = {
                appointmentscheduled: "pending",
                qualifiedtobuy: "reviewing",
                presentationscheduled: "interview",
                decisionmakerboughtin: "accepted",
                closedwon: "enrolled",
                closedlost: "rejected",
              };

              const newStatus = stageMapping[propertyValue || ""] || "pending";
              await supabase
                .from("user_applications")
                .update({ status: newStatus })
                .eq("id", app.id);

              await supabase.from("hubspot_webhook_log")
                .update({
                  processed: true,
                  processed_at: new Date().toISOString(),
                  properties: {
                    deal_stage: propertyValue,
                    mapped_status: newStatus,
                    application_id: app.id,
                  },
                })
                .eq("object_id", String(objectId))
                .eq("event_type", subscriptionType)
                .order("created_at", { ascending: false })
                .limit(1);
            }

            results.push({ objectId, type: subscriptionType, status: "processed" });
          }
        }
      } catch (processError: unknown) {
        const msg = processError instanceof Error ? processError.message : "Unknown";
        console.error(`Error processing event ${subscriptionType}:`, msg);
        results.push({ objectId, type: subscriptionType, status: "error", error: msg });
      }
    }

    return new Response(JSON.stringify({ processed: results.length, results }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("hubspot-webhook error:", message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
