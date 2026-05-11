import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CalendarClock, ExternalLink, Snowflake, Sun, BookmarkPlus, AlertTriangle } from "lucide-react";
import { differenceInCalendarDays, format, parseISO, isValid } from "date-fns";

type SavedRow = {
  program_id: string;
  program: any | null;
};

type DeadlineEntry = {
  programId: string;
  programName: string;
  programSlug: string | null;
  universityName: string;
  universitySlug: string | null;
  intake: "winter" | "summer";
  intakeYear?: number | null;
  applicationOpens: Date | null;
  applicationCloses: Date;
  semesterStart: Date | null;
  source: "application_periods" | "program";
};

function asDate(value: string | Date | null | undefined): Date | null {
  if (!value) return null;
  if (value instanceof Date) return isValid(value) ? value : null;
  const d = parseISO(value);
  return isValid(d) ? d : null;
}

function urgencyBadge(daysLeft: number) {
  if (daysLeft < 0) {
    return { label: "Closed", cls: "bg-muted text-muted-foreground border-border" };
  }
  if (daysLeft <= 14) {
    return { label: `${daysLeft}d left`, cls: "bg-destructive/10 text-destructive border-destructive/30" };
  }
  if (daysLeft <= 60) {
    return { label: `${daysLeft}d left`, cls: "bg-warning/15 text-warning border-warning/40" };
  }
  return { label: `${daysLeft}d left`, cls: "bg-success/15 text-success border-success/30" };
}

export default function ShortlistDeadlinesSection({ limit }: { limit?: number }) {
  const [loading, setLoading] = useState(true);
  const [savedCount, setSavedCount] = useState(0);
  const [entries, setEntries] = useState<DeadlineEntry[]>([]);
  const [showPast, setShowPast] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: saved, error } = await supabase
          .from("saved_programs")
          .select(`
            program_id,
            program:programs(
              id, name, slug,
              winter_intake, summer_intake,
              winter_deadline, summer_deadline,
              winter_application_open_date, summer_application_open_date,
              semester_start,
              universities:universities!inner(name, slug)
            )
          `)
          .eq("profile_id", user.id);

        if (error) throw error;

        const rows = (saved || []) as SavedRow[];
        setSavedCount(rows.length);
        const programIds = rows.map((r) => r.program_id);

        // Pull explicit application_periods (preferred when present)
        let periodsByProgram = new Map<string, any[]>();
        if (programIds.length > 0) {
          const { data: periods } = await supabase
            .from("application_periods")
            .select("program_id, intake_season, intake_year, application_start_date, application_end_date, semester_start_date, is_active")
            .in("program_id", programIds)
            .eq("is_active", true);
          (periods || []).forEach((p: any) => {
            const arr = periodsByProgram.get(p.program_id) || [];
            arr.push(p);
            periodsByProgram.set(p.program_id, arr);
          });
        }

        const computed: DeadlineEntry[] = [];
        rows.forEach((row) => {
          const program = row.program;
          if (!program) return;
          const universityName = program.universities?.name ?? "Unknown university";
          const universitySlug = program.universities?.slug ?? null;

          const periods = periodsByProgram.get(row.program_id) || [];
          if (periods.length > 0) {
            periods.forEach((p) => {
              const close = asDate(p.application_end_date);
              if (!close) return;
              const seasonRaw = String(p.intake_season || "").toLowerCase();
              const intake = seasonRaw === "summer" ? "summer" : "winter";
              computed.push({
                programId: row.program_id,
                programName: program.name,
                programSlug: program.slug,
                universityName,
                universitySlug,
                intake,
                intakeYear: p.intake_year ?? null,
                applicationOpens: asDate(p.application_start_date),
                applicationCloses: close,
                semesterStart: asDate(p.semester_start_date),
                source: "application_periods",
              });
            });
            return;
          }

          // Fallback: use deadline columns on the program itself
          if (program.winter_intake && program.winter_deadline) {
            const close = asDate(program.winter_deadline);
            if (close) {
              computed.push({
                programId: row.program_id,
                programName: program.name,
                programSlug: program.slug,
                universityName,
                universitySlug,
                intake: "winter",
                applicationOpens: asDate(program.winter_application_open_date),
                applicationCloses: close,
                semesterStart: asDate(program.semester_start),
                source: "program",
              });
            }
          }
          if (program.summer_intake && program.summer_deadline) {
            const close = asDate(program.summer_deadline);
            if (close) {
              computed.push({
                programId: row.program_id,
                programName: program.name,
                programSlug: program.slug,
                universityName,
                universitySlug,
                intake: "summer",
                applicationOpens: asDate(program.summer_application_open_date),
                applicationCloses: close,
                semesterStart: null,
                source: "program",
              });
            }
          }
        });

        computed.sort((a, b) => a.applicationCloses.getTime() - b.applicationCloses.getTime());
        setEntries(computed);
      } catch (e) {
        console.error("ShortlistDeadlinesSection error", e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const visible = useMemo(() => {
    const filtered = showPast ? entries : entries.filter((e) => e.applicationCloses.getTime() >= today.getTime());
    return typeof limit === "number" ? filtered.slice(0, limit) : filtered;
  }, [entries, showPast, today, limit]);

  if (loading) {
    return (
      <Card className="p-6">
        <div className="text-sm text-muted-foreground">Loading deadlines…</div>
      </Card>
    );
  }

  if (savedCount === 0) {
    return (
      <Card className="p-6">
        <div className="flex flex-col items-center text-center gap-3 py-6">
          <BookmarkPlus className="w-10 h-10 text-muted-foreground" />
          <h3 className="text-lg font-semibold">No programs in your shortlist yet</h3>
          <p className="text-sm text-muted-foreground max-w-sm">
            Save programs from search to track their application periods and deadlines here.
          </p>
          <Button asChild>
            <Link to="/search">Browse programs</Link>
          </Button>
        </div>
      </Card>
    );
  }

  if (entries.length === 0) {
    return (
      <Card className="p-6">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-warning mt-0.5" />
          <div>
            <h3 className="font-semibold">No deadline data available</h3>
            <p className="text-sm text-muted-foreground">
              Your shortlisted programs don&apos;t have published intakes or application deadlines yet.
            </p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4 gap-4">
        <div>
          <h3 className="text-xl font-semibold flex items-center gap-2">
            <CalendarClock className="w-5 h-5 text-primary" />
            Upcoming application deadlines
          </h3>
          <p className="text-sm text-muted-foreground">
            From the {savedCount} program{savedCount === 1 ? "" : "s"} in your shortlist.
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowPast((p) => !p)}
        >
          {showPast ? "Hide past" : "Show past"}
        </Button>
      </div>

      <ul className="divide-y divide-border">
        {visible.map((e, idx) => {
          const daysLeft = differenceInCalendarDays(e.applicationCloses, today);
          const badge = urgencyBadge(daysLeft);
          const IntakeIcon = e.intake === "winter" ? Snowflake : Sun;
          const programHref = e.universitySlug && e.programSlug
            ? `/universities/${e.universitySlug}/programs/${e.programSlug}`
            : `/search`;
          return (
            <li key={`${e.programId}-${e.intake}-${idx}`} className="py-4 flex flex-col md:flex-row md:items-center gap-3 md:gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="outline" className="capitalize gap-1">
                    <IntakeIcon className="w-3 h-3" />
                    {e.intake}{e.intakeYear ? ` ${e.intakeYear}` : ""}
                  </Badge>
                  <Badge variant="outline" className={badge.cls}>{badge.label}</Badge>
                </div>
                <Link to={programHref} className="block mt-1.5 font-semibold hover:text-primary truncate">
                  {e.programName}
                </Link>
                <div className="text-sm text-muted-foreground truncate">{e.universityName}</div>
              </div>
              <div className="flex flex-col md:items-end text-sm">
                <div className="font-medium">
                  Closes {format(e.applicationCloses, "MMM d, yyyy")}
                </div>
                {e.applicationOpens && (
                  <div className="text-xs text-muted-foreground">
                    Opens {format(e.applicationOpens, "MMM d, yyyy")}
                  </div>
                )}
                {e.semesterStart && (
                  <div className="text-xs text-muted-foreground">
                    Semester starts {format(e.semesterStart, "MMM d, yyyy")}
                  </div>
                )}
              </div>
              <Button asChild variant="outline" size="sm" className="md:ml-2">
                <Link to={programHref}>
                  View <ExternalLink className="w-3.5 h-3.5 ml-1" />
                </Link>
              </Button>
            </li>
          );
        })}
      </ul>

      {typeof limit === "number" && entries.length > limit && (
        <div className="mt-4 text-right">
          <Button asChild variant="link" size="sm">
            <Link to="/dashboard?tab=deadlines">See all deadlines</Link>
          </Button>
        </div>
      )}
    </Card>
  );
}