import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, AlertTriangle, XCircle, RefreshCw, Sparkles, GraduationCap, Languages, BookOpen, CalendarDays } from "lucide-react";
import { toast } from "sonner";
import {
  computeMatchesForProfile,
  fetchPersistedMatches,
} from "@/services/match-programs";

interface PersistedMatch {
  id: string;
  program_id: string;
  match_score: number;
  eligibility_status: string;
  gpa_score: number;
  language_score: number;
  ects_score: number;
  intake_score: number;
  gap_analysis: { gaps?: string[]; reasons?: string[] } | null;
  program: any;
}

const STATUS_META: Record<string, { label: string; cls: string; Icon: typeof CheckCircle2 }> = {
  eligible: { label: "Eligible", cls: "bg-success/15 text-success border-success/30", Icon: CheckCircle2 },
  borderline: { label: "Borderline", cls: "bg-warning/15 text-warning border-warning/40", Icon: AlertTriangle },
  missing: { label: "Gaps", cls: "bg-destructive/10 text-destructive border-destructive/30", Icon: XCircle },
};

export default function MatchesSection({ limit = 5 }: { limit?: number }) {
  const [matches, setMatches] = useState<PersistedMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [profileId, setProfileId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }
      setProfileId(user.id);
      try {
        const data = await fetchPersistedMatches(user.id, limit);
        setMatches(data as any);
      } finally {
        setLoading(false);
      }
    })();
  }, [limit]);

  const handleRefresh = async () => {
    if (!profileId) return;
    setRefreshing(true);
    try {
      await computeMatchesForProfile(profileId);
      const data = await fetchPersistedMatches(profileId, limit);
      setMatches(data as any);
      toast.success("Matches refreshed");
    } catch (e: any) {
      toast.error(e?.message || "Failed to refresh matches");
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4 gap-2">
        <div>
          <h3 className="text-xl font-semibold flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Top program matches
          </h3>
          <p className="text-sm text-muted-foreground">
            Ranked using your GPA, language, credits, and intake.
          </p>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={handleRefresh}
          disabled={refreshing || !profileId}
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
          {refreshing ? "Computing…" : "Recompute"}
        </Button>
      </div>

      {loading ? (
        <div className="text-sm text-muted-foreground py-6">Loading matches…</div>
      ) : matches.length === 0 ? (
        <div className="text-center py-8 space-y-3">
          <p className="text-sm text-muted-foreground">
            No matches yet. Recompute after completing your profile.
          </p>
          <Button onClick={handleRefresh} disabled={!profileId || refreshing}>
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
            Compute my matches
          </Button>
        </div>
      ) : (
        <ul className="space-y-3">
          {matches.map((m) => {
            const status = STATUS_META[m.eligibility_status] ?? STATUS_META.missing;
            const StatusIcon = status.Icon;
            const reasons = m.gap_analysis?.reasons ?? [];
            const gaps = m.gap_analysis?.gaps ?? [];
            const uni = m.program?.universities;
            const programHref = `/universities/${uni?.slug || m.program?.university_id}/programs/${m.program?.slug || m.program?.id}`;
            return (
              <li
                key={m.id}
                className="border rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-semibold truncate">{m.program?.name}</h4>
                      <Badge variant="outline" className={`gap-1 ${status.cls}`}>
                        <StatusIcon className="w-3 h-3" />
                        {status.label}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">
                      {uni?.name}{uni?.city ? ` · ${uni.city}` : ""}
                      {m.program?.degree_type ? ` · ${m.program.degree_type}` : ""}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-2xl font-bold text-primary leading-none">{Math.round(m.match_score)}%</div>
                    <div className="text-[10px] uppercase tracking-wide text-muted-foreground">match</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3">
                  <ComponentBar icon={GraduationCap} label="GPA" value={m.gpa_score} />
                  <ComponentBar icon={Languages} label="Language" value={m.language_score} />
                  <ComponentBar icon={BookOpen} label="Credits" value={m.ects_score} />
                  <ComponentBar icon={CalendarDays} label="Intake" value={m.intake_score} />
                </div>

                {reasons.length > 0 && (
                  <ul className="mt-3 space-y-1">
                    {reasons.slice(0, 3).map((r, i) => (
                      <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                        <CheckCircle2 className="w-3 h-3 mt-0.5 text-success shrink-0" />
                        <span>{r}</span>
                      </li>
                    ))}
                  </ul>
                )}

                {gaps.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {gaps.map((g, i) => (
                      <Badge key={i} variant="secondary" className="text-[10px] font-normal">
                        {g}
                      </Badge>
                    ))}
                  </div>
                )}

                <div className="mt-3 flex justify-end">
                  <Button asChild size="sm" variant="outline">
                    <Link to={programHref}>View program</Link>
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}

function ComponentBar({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof GraduationCap;
  label: string;
  value: number;
}) {
  return (
    <div>
      <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-0.5">
        <span className="inline-flex items-center gap-1">
          <Icon className="w-3 h-3" />
          {label}
        </span>
        <span>{Math.round(value)}</span>
      </div>
      <Progress value={value} className="h-1.5" />
    </div>
  );
}
