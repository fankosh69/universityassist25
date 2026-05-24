import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { scrapeApi } from "@/lib/api/scrape-framework";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function AdminLiveData() {
  const { data: budget, refetch: refetchBudget } = useQuery({ queryKey: ["scrape-budget"], queryFn: scrapeApi.budget });
  const { data: runs } = useQuery({ queryKey: ["scrape-runs"], queryFn: () => scrapeApi.recentRuns(30) });
  const { data: profiles } = useQuery({ queryKey: ["scrape-profiles-livedata"], queryFn: scrapeApi.listProfiles });

  const [ceiling, setCeiling] = useState<number | null>(null);
  const saveBudget = async () => {
    await scrapeApi.updateBudget(ceiling ?? budget?.monthly_credit_ceiling ?? 25000, budget?.paused ?? false);
    toast.success("Budget updated"); refetchBudget();
  };
  const togglePause = async () => {
    await scrapeApi.updateBudget(budget?.monthly_credit_ceiling ?? 25000, !(budget?.paused ?? false));
    refetchBudget();
  };

  if (!budget) return <Loader2 className="h-6 w-6 animate-spin" />;

  const used = budget.current_month_used;
  const ceil = budget.monthly_credit_ceiling;
  const pct = Math.min(100, Math.round((used / Math.max(ceil, 1)) * 100));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Live Data</h1>
        <p className="text-sm text-muted-foreground">Firecrawl-powered freshness monitor.</p>
      </div>

      <Card>
        <CardHeader><CardTitle>Firecrawl budget</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <Progress value={pct} />
          <p className="text-sm text-muted-foreground">{used.toLocaleString()} / {ceil.toLocaleString()} credits this month</p>
          <div className="flex items-center gap-3">
            <Input type="number" defaultValue={ceil} onChange={(e) => setCeiling(Number(e.target.value))} className="max-w-[180px]" />
            <Button onClick={saveBudget}>Update ceiling</Button>
            <div className="flex items-center gap-2 ml-auto">
              <Switch checked={!!budget.paused} onCheckedChange={togglePause} />
              <span className="text-sm">{budget.paused ? "Paused" : "Active"}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Universities</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {profiles?.map((p: any) => (
              <div key={p.id} className="rounded border border-border/60 p-3 text-sm">
                <div className="font-semibold">{p.universities?.name}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  health {Math.round((p.health_score ?? 0) * 100)}% · last {p.last_run_at ? new Date(p.last_run_at).toLocaleDateString() : "never"} · {p.cadence}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Recent runs</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-1 text-sm">
            {runs?.map((r: any) => (
              <div key={r.id} className="flex items-center justify-between border-b border-border/40 py-1">
                <span>{r.universities?.name ?? r.university_id}</span>
                <span className="text-xs text-muted-foreground">
                  {r.status} · {r.pages_crawled}p · {r.pdfs_ingested}pdf · {r.diffs_created}Δ · {r.credits_used}c ·{" "}
                  {new Date(r.started_at).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
