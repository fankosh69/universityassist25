import { createClient } from "https://esm.sh/@supabase/supabase-js@2.55.0";
import { requireCronOrAdmin } from "../_shared/auth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Pulls one pending job and hands it to scrape-university. Designed to be
// called frequently by pg_cron — each tick processes a single job to stay
// well within Supabase edge-function timeouts.
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const unauth = await requireCronOrAdmin(req);
  if (unauth) return unauth;

  const service = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  // Budget check.
  const { data: budget } = await service.from("scrape_budget").select("*").maybeSingle();
  if (budget?.paused) return ok({ skipped: "paused" });
  if (budget && budget.current_month_used >= budget.monthly_credit_ceiling) {
    return ok({ skipped: "budget" });
  }

  const { data: job } = await service.from("scrape_jobs")
    .select("id").eq("status", "pending").order("priority").order("scheduled_at").limit(1).maybeSingle();
  if (!job) return ok({ skipped: "no_jobs" });

  const url = `${Deno.env.get("SUPABASE_URL")}/functions/v1/scrape-university`;
  const resp = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ jobId: job.id }),
  });
  const out = await resp.json().catch(() => ({}));
  return ok({ ranJob: job.id, result: out });
});

function ok(b: unknown) {
  return new Response(JSON.stringify(b), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
