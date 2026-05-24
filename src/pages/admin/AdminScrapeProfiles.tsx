import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { scrapeApi } from "@/lib/api/scrape-framework";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, PlayCircle, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export default function AdminScrapeProfiles() {
  const qc = useQueryClient();
  const { data: profiles, isLoading } = useQuery({ queryKey: ["scrape-profiles"], queryFn: scrapeApi.listProfiles });
  const { data: universities } = useQuery({
    queryKey: ["unis-for-scrape"],
    queryFn: async () => (await supabase.from("universities").select("id, name, website_url").order("name")).data ?? [],
  });
  const [editing, setEditing] = useState<any | null>(null);
  const [runningOrch, setRunningOrch] = useState(false);

  const runOrchestrator = async () => {
    setRunningOrch(true);
    try { const r = await scrapeApi.runOrchestrator(); toast.success(`Orchestrator: enqueued ${r?.enqueued ?? 0}`); }
    catch (e: any) { toast.error(e.message); }
    finally { setRunningOrch(false); qc.invalidateQueries({ queryKey: ["scrape-profiles"] }); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Scraping Profiles</h1>
          <p className="text-sm text-muted-foreground">Configure how each university website is crawled.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={runOrchestrator} disabled={runningOrch}>
            {runningOrch ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
            Run orchestrator
          </Button>
          <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
            <DialogTrigger asChild><Button onClick={() => setEditing({})}>New profile</Button></DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader><DialogTitle>{editing?.id ? "Edit" : "New"} scraping profile</DialogTitle></DialogHeader>
              <ProfileForm profile={editing ?? {}} universities={universities ?? []} onSaved={() => { setEditing(null); qc.invalidateQueries({ queryKey: ["scrape-profiles"] }); }} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : (
        <div className="grid gap-3">
          {profiles?.map((p: any) => (
            <Card key={p.id}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <CardTitle className="text-base">{p.universities?.name ?? p.university_id}</CardTitle>
                    <p className="text-xs text-muted-foreground mt-1">
                      {p.base_urls?.[0] ?? p.universities?.website_url}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={p.enabled ? "default" : "secondary"}>{p.cadence}</Badge>
                    <Badge variant="outline">health {p.health_score ?? "—"}</Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <span>last run: {p.last_run_at ? new Date(p.last_run_at).toLocaleString() : "never"}</span>
                <span>·</span>
                <span>next: {p.next_run_at ? new Date(p.next_run_at).toLocaleString() : "—"}</span>
                <div className="ml-auto flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => setEditing(p)}>Edit</Button>
                  <Button size="sm" onClick={async () => {
                    try { toast.message("Run started"); const r = await scrapeApi.runNow(p.university_id); toast.success(`Run done: ${r?.pages ?? 0} pages, ${r?.diffs ?? 0} diffs`); }
                    catch (e: any) { toast.error(e.message); }
                  }}>
                    <PlayCircle className="h-4 w-4 mr-1" /> Run now
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
          {!profiles?.length && <p className="text-sm text-muted-foreground">No profiles yet. Create one to start crawling.</p>}
        </div>
      )}
    </div>
  );
}

function ProfileForm({ profile, universities, onSaved }: { profile: any; universities: any[]; onSaved: () => void }) {
  const [f, setF] = useState<any>({
    university_id: profile.university_id ?? "",
    base_urls: (profile.base_urls ?? []).join("\n"),
    program_url_patterns: (profile.program_url_patterns ?? []).join("\n"),
    exclude_patterns: (profile.exclude_patterns ?? []).join("\n"),
    pdf_link_patterns: (profile.pdf_link_patterns ?? ["admission", "module", "handbook", "regulation"]).join("\n"),
    language_mode: profile.language_mode ?? "auto",
    discovery_method: profile.discovery_method ?? "map",
    cadence: profile.cadence ?? "monthly",
    max_depth: profile.max_depth ?? 3,
    max_pages: profile.max_pages ?? 200,
    wait_for_ms: profile.wait_for_ms ?? 0,
    enabled: profile.enabled ?? true,
    extraction_prompt_overrides: profile.extraction_prompt_overrides ?? "",
    notes: profile.notes ?? "",
    id: profile.id,
  });
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!f.university_id) { toast.error("Pick a university"); return; }
    setSaving(true);
    try {
      await scrapeApi.upsertProfile({
        ...(f.id ? { id: f.id } : {}),
        university_id: f.university_id,
        base_urls: splitLines(f.base_urls),
        program_url_patterns: splitLines(f.program_url_patterns),
        exclude_patterns: splitLines(f.exclude_patterns),
        pdf_link_patterns: splitLines(f.pdf_link_patterns),
        language_mode: f.language_mode,
        discovery_method: f.discovery_method,
        cadence: f.cadence,
        max_depth: Number(f.max_depth),
        max_pages: Number(f.max_pages),
        wait_for_ms: Number(f.wait_for_ms),
        enabled: f.enabled,
        extraction_prompt_overrides: f.extraction_prompt_overrides || null,
        notes: f.notes || null,
      } as any);
      toast.success("Saved");
      onSaved();
    } catch (e: any) { toast.error(e.message); }
    finally { setSaving(false); }
  };

  return (
    <div className="space-y-4">
      <div>
        <Label>University</Label>
        <Select value={f.university_id} onValueChange={(v) => setF({ ...f, university_id: v })}>
          <SelectTrigger><SelectValue placeholder="Choose university" /></SelectTrigger>
          <SelectContent>{universities.map((u) => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div><Label>Cadence</Label>
          <Select value={f.cadence} onValueChange={(v) => setF({ ...f, cadence: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="daily">Daily</SelectItem><SelectItem value="weekly">Weekly</SelectItem><SelectItem value="monthly">Monthly</SelectItem></SelectContent>
          </Select>
        </div>
        <div><Label>Language mode</Label>
          <Select value={f.language_mode} onValueChange={(v) => setF({ ...f, language_mode: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {["auto","english","german","hybrid","bilingual"].map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div><Label>Discovery</Label>
          <Select value={f.discovery_method} onValueChange={(v) => setF({ ...f, discovery_method: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {["map","crawl","search","sitemap-only"].map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div><Label>Max depth</Label><Input type="number" value={f.max_depth} onChange={(e) => setF({ ...f, max_depth: e.target.value })} /></div>
        <div><Label>Max pages</Label><Input type="number" value={f.max_pages} onChange={(e) => setF({ ...f, max_pages: e.target.value })} /></div>
        <div><Label>Wait (ms)</Label><Input type="number" value={f.wait_for_ms} onChange={(e) => setF({ ...f, wait_for_ms: e.target.value })} /></div>
      </div>
      <FieldArea label="Base URLs (one per line)" value={f.base_urls} onChange={(v) => setF({ ...f, base_urls: v })} />
      <FieldArea label="Program URL patterns (regex, one per line)" value={f.program_url_patterns} onChange={(v) => setF({ ...f, program_url_patterns: v })} />
      <FieldArea label="Exclude patterns" value={f.exclude_patterns} onChange={(v) => setF({ ...f, exclude_patterns: v })} />
      <FieldArea label="PDF link patterns" value={f.pdf_link_patterns} onChange={(v) => setF({ ...f, pdf_link_patterns: v })} />
      <div>
        <Label>Extraction prompt overrides (optional)</Label>
        <Textarea value={f.extraction_prompt_overrides} onChange={(e) => setF({ ...f, extraction_prompt_overrides: e.target.value })} rows={3} />
      </div>
      <div className="flex items-center gap-2">
        <Switch checked={f.enabled} onCheckedChange={(v) => setF({ ...f, enabled: v })} />
        <Label>Enabled</Label>
      </div>
      <Button onClick={save} disabled={saving} className="w-full">
        {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Save profile
      </Button>
    </div>
  );
}

function FieldArea({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <Label>{label}</Label>
      <Textarea value={value} onChange={(e) => onChange(e.target.value)} rows={3} />
    </div>
  );
}

function splitLines(s: string): string[] {
  return (s ?? "").split("\n").map((x) => x.trim()).filter(Boolean);
}
