import * as React from "react";
import { format, addMonths, addDays, parseISO, startOfDay } from "date-fns";
import { Calendar as CalendarIcon, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export interface DeadlineRange {
  from: string | null; // ISO date YYYY-MM-DD
  to: string | null;
}

interface DeadlineRangeFilterProps {
  value: DeadlineRange;
  onChange: (value: DeadlineRange) => void;
}

// Slider operates on day offsets from "today"
const TOTAL_DAYS = 18 * 30; // ~18 months

function dayToDate(day: number, today: Date): Date {
  return addDays(today, day);
}

function dateToDay(iso: string | null, today: Date): number | null {
  if (!iso) return null;
  try {
    const d = parseISO(iso);
    const ms = startOfDay(d).getTime() - startOfDay(today).getTime();
    return Math.round(ms / (1000 * 60 * 60 * 24));
  } catch {
    return null;
  }
}

function toIso(d: Date): string {
  return format(d, "yyyy-MM-dd");
}

export function DeadlineRangeFilter({ value, onChange }: DeadlineRangeFilterProps) {
  const today = React.useMemo(() => startOfDay(new Date()), []);

  const fromDay = dateToDay(value.from, today) ?? 0;
  const toDay = dateToDay(value.to, today) ?? TOTAL_DAYS;

  // Clamp
  const safeFrom = Math.max(0, Math.min(fromDay, TOTAL_DAYS));
  const safeTo = Math.max(safeFrom, Math.min(toDay, TOTAL_DAYS));

  const handleSlider = (vals: number[]) => {
    const [f, t] = vals;
    onChange({
      from: toIso(dayToDate(f, today)),
      to: toIso(dayToDate(t, today)),
    });
  };

  const setPreset = (from: Date | null, to: Date | null) => {
    onChange({
      from: from ? toIso(from) : null,
      to: to ? toIso(to) : null,
    });
  };

  const isActive = !!(value.from || value.to);

  const presets = React.useMemo(() => {
    const t = today;
    const year = t.getFullYear();
    const julyFifteen = new Date(year, 6, 15); // July 15
    if (julyFifteen < t) julyFifteen.setFullYear(year + 1);

    // Winter intake: applications typically Apr 1 – Jul 15
    const winterStart = new Date(year, 3, 1);
    const winterEnd = new Date(year, 6, 15);
    if (winterEnd < t) {
      winterStart.setFullYear(year + 1);
      winterEnd.setFullYear(year + 1);
    }

    // Summer intake: applications typically Oct 1 – Jan 15
    let summerStart = new Date(year, 9, 1);
    let summerEnd = new Date(year + 1, 0, 15);
    if (summerEnd < t) {
      summerStart = new Date(year + 1, 9, 1);
      summerEnd = new Date(year + 2, 0, 15);
    }

    return [
      { label: "Next 30 days", from: t, to: addDays(t, 30) },
      { label: "Next 3 months", from: t, to: addMonths(t, 3) },
      { label: "Before 15 Jul", from: t, to: julyFifteen },
      { label: "Winter intake", from: winterStart, to: winterEnd },
      { label: "Summer intake", from: summerStart, to: summerEnd },
    ];
  }, [today]);

  const fromDate = dayToDate(safeFrom, today);
  const toDate = dayToDate(safeTo, today);

  return (
    <div className="space-y-4">
      {/* Range display */}
      <div className="flex items-center justify-between gap-2 text-xs">
        <div className="flex flex-col">
          <span className="text-muted-foreground">From</span>
          <span className="font-medium text-foreground inline-flex items-center gap-1">
            <CalendarIcon className="h-3 w-3" />
            {value.from ? format(fromDate, "MMM d, yyyy") : "Today"}
          </span>
        </div>
        <div className="flex flex-col text-right">
          <span className="text-muted-foreground">To</span>
          <span className="font-medium text-foreground inline-flex items-center gap-1 justify-end">
            <CalendarIcon className="h-3 w-3" />
            {value.to ? format(toDate, "MMM d, yyyy") : `+18 mo`}
          </span>
        </div>
      </div>

      {/* Slider */}
      <Slider
        min={0}
        max={TOTAL_DAYS}
        step={1}
        value={[safeFrom, safeTo]}
        onValueChange={handleSlider}
        aria-label="Application deadline range"
        className="py-2"
      />

      {/* Presets */}
      <div className="flex flex-wrap gap-1.5">
        {presets.map((p) => (
          <button
            key={p.label}
            type="button"
            onClick={() => setPreset(p.from, p.to)}
            className={cn(
              "px-2.5 py-1 text-xs rounded-full border border-border",
              "bg-background hover:bg-accent hover:text-accent-foreground",
              "transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            )}
          >
            {p.label}
          </button>
        ))}
      </div>

      {isActive && (
        <div className="flex items-center justify-between pt-1">
          <Badge variant="secondary" className="text-xs font-normal">
            {value.from ? format(fromDate, "MMM d") : "Today"} –{" "}
            {value.to ? format(toDate, "MMM d, yyyy") : "+18 mo"}
          </Badge>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs"
            onClick={() => onChange({ from: null, to: null })}
          >
            <X className="h-3 w-3 mr-1" />
            Clear
          </Button>
        </div>
      )}
    </div>
  );
}