import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { scrapeApi } from "@/lib/api/scrape-framework";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Check, X, ExternalLink, Loader2, GraduationCap, Calendar, Euro, Globe, Clock, FileText, Eye } from "lucide-react";
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
                      <Badge variant={d.field_path === "__new_program__" ? "default" : "outline"}>
                        {d.field_path === "__new_program__" ? "NEW PROGRAM" : d.field_path}
                      </Badge>
                      <Badge variant={d.confidence >= 0.8 ? "default" : "secondary"}>conf {Math.round((d.confidence ?? 0) * 100)}%</Badge>
                    </div>
                    {d.field_path === "__new_program__" ? (
                      <NewProgramPreview data={d.new_value} />
                    ) : (
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
                    )}
                    {d.source_url && (
                      <a href={d.source_url} target="_blank" rel="noreferrer" className="text-xs text-primary inline-flex items-center gap-1 mt-2">
                        <ExternalLink className="h-3 w-3" /> source
                      </a>
                    )}
                  </div>
                  {status === "pending" && (
                    <div className="flex flex-col gap-1">
                      <Button size="sm" onClick={() => accept(d.id)}>
                        <Check className="h-4 w-4 mr-1" />
                        {d.field_path === "__new_program__" ? "Publish" : "Apply"}
                      </Button>
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

function NewProgramPreview({ data }: { data: any }) {
  if (!data || typeof data !== "object") return null;
  const fmtIntake = () => {
    const parts: string[] = [];
    if (data.winter_intake) {
      const d = data.winter_deadline_month && data.winter_deadline_day
        ? `${String(data.winter_deadline_month).padStart(2, "0")}/${String(data.winter_deadline_day).padStart(2, "0")}`
        : "TBA";
      parts.push(`Winter (deadline ${d})`);
    }
    if (data.summer_intake) {
      const d = data.summer_deadline_month && data.summer_deadline_day
        ? `${String(data.summer_deadline_month).padStart(2, "0")}/${String(data.summer_deadline_day).padStart(2, "0")}`
        : "TBA";
      parts.push(`Summer (deadline ${d})`);
    }
    return parts.length ? parts.join(" · ") : "Not specified";
  };
  const tuition = data.tuition_amount
    ? `€${data.tuition_amount} / ${data.tuition_fee_structure || "semester"}`
    : "Free (public university)";

  const Row = ({ icon: Icon, label, value }: any) => (
    <div className="flex items-start gap-2">
      <Icon className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
      <div className="min-w-0">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="text-sm font-medium break-words">{value ?? "—"}</div>
      </div>
    </div>
  );

  return (
    <div className="mt-3 rounded-lg border border-primary/40 bg-primary/5 p-4 space-y-3">
      <div>
        <div className="text-lg font-semibold">{data.name}</div>
        <div className="flex gap-2 mt-1 flex-wrap">
          <Badge variant="secondary">{data.degree_type}</Badge>
          {data.degree_level && <Badge variant="outline">{data.degree_level}</Badge>}
          {data.uni_assist_required && <Badge className="bg-orange-500 hover:bg-orange-600">Uni-Assist Required</Badge>}
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <Row icon={GraduationCap} label="Field of study" value={data.field_of_study} />
        <Row icon={Clock} label="Duration" value={data.duration_semesters ? `${data.duration_semesters} semesters` : null} />
        <Row icon={FileText} label="ECTS credits" value={data.ects_credits} />
        <Row icon={Globe} label="Language" value={Array.isArray(data.language_of_instruction) ? data.language_of_instruction.join(", ") : data.language_of_instruction} />
        <Row icon={Euro} label="Tuition" value={tuition} />
        <Row icon={Calendar} label="Intakes" value={fmtIntake()} />
        <Row icon={GraduationCap} label="Min GPA" value={data.minimum_gpa} />
        <Row icon={FileText} label="Application" value={data.application_method} />
      </div>
      {data.description && (
        <div>
          <div className="text-xs text-muted-foreground mb-1">Description</div>
          <p className="text-sm leading-relaxed">{data.description}</p>
        </div>
      )}
      <details className="text-xs">
        <summary className="cursor-pointer text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
          <Eye className="h-3 w-3" /> View raw extracted JSON
        </summary>
        <pre className="mt-2 p-2 bg-muted rounded whitespace-pre-wrap break-words">{stringify(data)}</pre>
      </details>
    </div>
  );
}

function stringify(v: unknown) {
  if (v == null) return "—";
  if (typeof v === "string") return v;
  try { return JSON.stringify(v, null, 2); } catch { return String(v); }
}
