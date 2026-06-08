import { createClient } from "https://esm.sh/@supabase/supabase-js@2.55.0";
import { requireCronOrAdmin } from "../_shared/auth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Selects due university scrape profiles, enqueues jobs.
// Triggered by pg_cron or manually from the admin UI.
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const unauth = await requireCronOrAdmin(req);
  if (unauth) return unauth;

  const service = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  try {
    // Budget guard: reset monthly counter if needed, abort if paused or over ceiling.
    const { data: budget } = await service.from("scrape_budget").select("*").maybeSingle();
    if (budget) {
      const monthStart = new Date(new Date().toISOString().slice(0, 7) + "-01").toISOString().slice(0, 10);
      if (budget.current_month_start !== monthStart) {
        await service.from("scrape_budget").update({
          current_month_start: monthStart,
          current_month_used: 0,
        }).eq("id", true);
      }
      if (budget.paused) {
        return json({ enqueued: 0, reason: "paused" });
      }
      if (budget.current_month_used >= budget.monthly_credit_ceiling) {
        return json({ enqueued: 0, reason: "budget_exceeded" });
      }
    }

    // Pick at most 20 due profiles per tick.
    const { data: due } = await service
      .from("university_scrape_profiles")
      .select("id, university_id, cadence")
      .eq("enabled", true)
      .lte("next_run_at", new Date().toISOString())
      .order("next_run_at", { ascending: true })
      .limit(20);

    let enqueued = 0;
    for (const p of due ?? []) {
      // Skip if a pending/running job already exists.
      const { count } = await service
        .from("scrape_jobs")
        .select("id", { count: "exact", head: true })
        .eq("university_id", p.university_id)
        .in("status", ["pending", "running"]);
      if ((count ?? 0) > 0) continue;

      await service.from("scrape_jobs").insert({
        profile_id: p.id,
        university_id: p.university_id,
        job_type: "university_refresh",
        status: "pending",
      });

      const next = cadenceToNext(p.cadence);
      await service
        .from("university_scrape_profiles")
        .update({ next_run_at: next, last_run_at: new Date().toISOString() })
        .eq("id", p.id);
      enqueued++;
    }

    return json({ enqueued });
  } catch (e) {
    console.error("orchestrator error", e);
    return json({ error: String(e) }, 500);
  }
});

function cadenceToNext(c: string): string {
  const d = new Date();
  if (c === "daily") d.setDate(d.getDate() + 1);
  else if (c === "weekly") d.setDate(d.getDate() + 7);
  else d.setMonth(d.getMonth() + 1);
  return d.toISOString();
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
