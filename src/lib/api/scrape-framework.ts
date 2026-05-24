import { supabase } from "@/integrations/supabase/client";

export type ScrapeProfile = {
  id: string;
  university_id: string;
  base_urls: string[];
  program_url_patterns: string[];
  exclude_patterns: string[];
  language_mode: string;
  discovery_method: string;
  max_depth: number;
  max_pages: number;
  wait_for_ms: number;
  pdf_link_patterns: string[];
  extraction_prompt_overrides: string | null;
  cadence: "daily" | "weekly" | "monthly";
  enabled: boolean;
  last_run_at: string | null;
  last_success_at: string | null;
  next_run_at: string | null;
  health_score: number | null;
  notes: string | null;
};

export const scrapeApi = {
  async listProfiles() {
    const { data, error } = await supabase
      .from("university_scrape_profiles")
      .select("*, universities(name, website_url)")
      .order("next_run_at", { ascending: true });
    if (error) throw error;
    return data ?? [];
  },

  async upsertProfile(p: Partial<ScrapeProfile> & { university_id: string }) {
    const { data, error } = await supabase
      .from("university_scrape_profiles")
      .upsert(p as any, { onConflict: "university_id" })
      .select("*").single();
    if (error) throw error;
    return data;
  },

  async runNow(universityId: string) {
    const { data, error } = await supabase.functions.invoke("scrape-university", {
      body: { universityId },
    });
    if (error) throw error;
    return data;
  },

  async runOrchestrator() {
    const { data, error } = await supabase.functions.invoke("scrape-orchestrator", {});
    if (error) throw error;
    return data;
  },

  async listDiffs(status: "pending" | "accepted" | "rejected" = "pending") {
    const { data, error } = await supabase
      .from("scrape_diffs")
      .select("*, programs(name), universities(name)")
      .eq("status", status)
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw error;
    return data ?? [];
  },

  async acceptDiff(diffId: string) {
    const { data: diff, error } = await supabase
      .from("scrape_diffs").select("*").eq("id", diffId).single();
    if (error) throw error;
    // Special case: a new draft program was auto-inserted by the scraper.
    // "Accepting" means publishing the draft.
    if (diff.field_path === "__new_program__") {
      const { error: upErr } = await supabase.from("programs").update({
        status: "published",
        published: true,
        last_verified_at: new Date().toISOString(),
      }).eq("id", diff.program_id);
      if (upErr) throw upErr;
    } else {
      // Apply the new value to programs.<field>
      const update: Record<string, unknown> = { [diff.field_path]: diff.new_value, last_verified_at: new Date().toISOString() };
      const { error: upErr } = await supabase.from("programs").update(update).eq("id", diff.program_id);
      if (upErr) throw upErr;
    }
    const { error: dErr } = await supabase.from("scrape_diffs").update({
      status: "accepted", reviewed_at: new Date().toISOString(),
    }).eq("id", diffId);
    if (dErr) throw dErr;
  },

  async rejectDiff(diffId: string, note?: string) {
    const { data: diff } = await supabase
      .from("scrape_diffs").select("*").eq("id", diffId).single();
    // If rejecting a newly auto-inserted draft program, delete it so it never appears.
    if (diff?.field_path === "__new_program__" && diff?.program_id) {
      await supabase.from("programs").delete().eq("id", diff.program_id).eq("status", "draft");
    }
    const { error } = await supabase.from("scrape_diffs").update({
      status: "rejected", reviewed_at: new Date().toISOString(), review_notes: note ?? null,
    }).eq("id", diffId);
    if (error) throw error;
  },

  async budget() {
    const { data } = await supabase.from("scrape_budget").select("*").maybeSingle();
    return data;
  },

  async updateBudget(monthly_credit_ceiling: number, paused: boolean) {
    const { error } = await supabase.from("scrape_budget").update({
      monthly_credit_ceiling, paused, updated_at: new Date().toISOString(),
    }).eq("id", true);
    if (error) throw error;
  },

  async recentRuns(limit = 50) {
    const { data } = await supabase
      .from("scrape_runs")
      .select("*, universities(name)")
      .order("started_at", { ascending: false })
      .limit(limit);
    return data ?? [];
  },
};
