import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { scrapeApi } from "@/lib/api/scrape-framework";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Check, X, ExternalLink, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function AdminScrapeReview() {
  const qc = useQueryClient();
  const [status, setStatus] = useState<"pending" | "accepted" | "rejected">("pending");
  const { data, isLoading } = useQuery({ queryKey: ["scrape-diffs", status], queryFn: () => scrapeApi.listDiffs(status) });

  const accept = async (id: string) => { await scrapeApi.acceptDiff(id); toast.success("Applied"); qc.invalidateQueries({ queryKey: ["scrape-diffs"] }); };
  const reject = async (id: string) => { await scrapeApi.rejectDiff(id); toast.success("Rejected"); qc.invalidateQueries({ queryKey: ["scrape-diffs"] }); };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Scraping Review Queue</h1>
        <p className="text-sm text-muted-foreground">Review and apply changes detected by the live scraper.</p>
      </div>
      <Tabs value={status} onValueChange={(v) => setStatus(v as any)}>
        <TabsList>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="accepted">Accepted</TabsTrigger>
          <TabsTrigger value="rejected">Rejected</TabsTrigger>
        </TabsList>
      </Tabs>
      {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : (
        <div className="space-y-2">
          {data?.map((d: any) => (
            <Card key={d.id}>
              <CardContent className="p-4">
                <div className="flex flex-wrap items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm">{d.universities?.name}</span>
                      <span className="text-xs text-muted-foreground">·</span>
                      <span className="text-sm">{d.programs?.name}</span>
                      <Badge variant="outline">{d.field_path}</Badge>
                      <Badge variant={d.confidence >= 0.8 ? "default" : "secondary"}>conf {Math.round((d.confidence ?? 0) * 100)}%</Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-3 mt-3 text-xs">
                      <div className="rounded border border-border/60 p-2">
                        <div className="text-muted-foreground mb-1">Old</div>
                        <pre className="whitespace-pre-wrap break-words">{stringify(d.old_value)}</pre>
                      </div>
                      <div className="rounded border border-primary/60 bg-primary/5 p-2">
                        <div className="text-muted-foreground mb-1">New</div>
                        <pre className="whitespace-pre-wrap break-words">{stringify(d.new_value)}</pre>
                      </div>
                    </div>
                    {d.source_url && (
                      <a href={d.source_url} target="_blank" rel="noreferrer" className="text-xs text-primary inline-flex items-center gap-1 mt-2">
                        <ExternalLink className="h-3 w-3" /> source
                      </a>
                    )}
                  </div>
                  {status === "pending" && (
                    <div className="flex flex-col gap-1">
                      <Button size="sm" onClick={() => accept(d.id)}><Check className="h-4 w-4 mr-1" />Apply</Button>
                      <Button size="sm" variant="outline" onClick={() => reject(d.id)}><X className="h-4 w-4 mr-1" />Reject</Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
          {!data?.length && <p className="text-sm text-muted-foreground">Nothing here.</p>}
        </div>
      )}
    </div>
  );
}

function stringify(v: unknown) {
  if (v == null) return "—";
  if (typeof v === "string") return v;
  try { return JSON.stringify(v, null, 2); } catch { return String(v); }
}
