import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Search, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CityOption } from "./FilterSidebar";

interface CityLocationFilterProps {
  cities: CityOption[];
  value: string; // 'all' or city name
  onChange: (v: string) => void;
  popularCities?: string[];
}

const DEFAULT_POPULAR = ["Berlin", "Munich", "Hamburg", "Cologne", "Frankfurt"];

export function CityLocationFilter({
  cities,
  value,
  onChange,
  popularCities = DEFAULT_POPULAR,
}: CityLocationFilterProps) {
  const [query, setQuery] = useState("");

  const sorted = useMemo(
    () =>
      [...cities].sort((a, b) => {
        // Cities with programs first, then alpha
        if ((b.programCount > 0 ? 1 : 0) !== (a.programCount > 0 ? 1 : 0)) {
          return (b.programCount > 0 ? 1 : 0) - (a.programCount > 0 ? 1 : 0);
        }
        return a.name.localeCompare(b.name);
      }),
    [cities]
  );

  const popular = useMemo(() => {
    const map = new Map(cities.map((c) => [c.name.toLowerCase(), c]));
    return popularCities
      .map((n) => map.get(n.toLowerCase()))
      .filter((c): c is CityOption => !!c && c.programCount > 0);
  }, [cities, popularCities]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return sorted.slice(0, 80);
    return sorted
      .filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          (c.region || "").toLowerCase().includes(q)
      )
      .slice(0, 80);
  }, [sorted, query]);

  const isSelected = (name: string) => value === name;

  const toggle = (name: string) => {
    onChange(isSelected(name) ? "all" : name);
  };

  return (
    <div className="space-y-3">
      {/* Popular city chips */}
      {popular.length > 0 && (
        <div className="space-y-2">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
            Popular Cities
          </p>
          <div className="flex flex-wrap gap-1.5">
            {popular.map((c) => {
              const active = isSelected(c.name);
              return (
                <button
                  key={c.name}
                  type="button"
                  onClick={() => toggle(c.name)}
                  aria-pressed={active}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-xs font-medium border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                    active
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-background text-muted-foreground hover:border-primary hover:text-primary"
                  )}
                >
                  {c.name}
                  <span
                    className={cn(
                      "ml-1.5 text-[10px] font-bold",
                      active ? "opacity-90" : "opacity-60"
                    )}
                  >
                    {c.programCount}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search all cities..."
          className="pl-8 pr-8 h-9 text-sm"
          aria-label="Search cities"
        />
        {query && (
          <button
            type="button"
            aria-label="Clear search"
            onClick={() => setQuery("")}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* City list */}
      <div
        className="max-h-72 overflow-y-auto -mx-1 px-1 space-y-1"
        role="listbox"
        aria-label="Cities"
      >
        {filtered.length === 0 ? (
          <div className="text-xs text-muted-foreground py-6 text-center">
            No matching city
          </div>
        ) : (
          filtered.map((c) => {
            const active = isSelected(c.name);
            const hasPrograms = c.programCount > 0;
            return (
              <button
                key={c.name}
                type="button"
                role="option"
                aria-selected={active}
                onClick={() => toggle(c.name)}
                className={cn(
                  "w-full flex items-center justify-between gap-2 p-2.5 rounded-xl border text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
                  active
                    ? "bg-primary/5 border-primary/30"
                    : "border-transparent hover:bg-muted/50 hover:border-border",
                  !hasPrograms && !active && "opacity-60"
                )}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span
                    className={cn(
                      "flex h-4 w-4 shrink-0 items-center justify-center",
                      active ? "text-primary" : "text-transparent"
                    )}
                  >
                    <Check className="h-3.5 w-3.5" strokeWidth={3} />
                  </span>
                  <div className="min-w-0">
                    <p
                      className={cn(
                        "text-sm font-medium truncate",
                        active ? "text-foreground" : "text-foreground"
                      )}
                    >
                      {c.name}
                    </p>
                    <p className="text-[11px] text-muted-foreground truncate">
                      {c.region || (hasPrograms ? "" : "No programs yet")}
                      {c.region && !hasPrograms ? " · No programs yet" : ""}
                    </p>
                  </div>
                </div>
                {hasPrograms ? (
                  <span
                    className={cn(
                      "shrink-0 px-2 py-0.5 text-[10px] font-bold rounded-md",
                      active
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    {c.programCount}
                  </span>
                ) : (
                  <span
                    className="shrink-0 h-2 w-2 rounded-full bg-muted"
                    aria-hidden="true"
                  />
                )}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}