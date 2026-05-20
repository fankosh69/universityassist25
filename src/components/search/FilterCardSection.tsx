import { useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface FilterCardSectionProps {
  title: string;
  icon: ReactNode;
  activeCount?: number;
  defaultOpen?: boolean;
  onClear?: () => void;
  clearLabel?: string;
  children: ReactNode;
}

export function FilterCardSection({
  title,
  icon,
  activeCount = 0,
  defaultOpen = false,
  onClear,
  clearLabel = "Clear filter",
  children,
}: FilterCardSectionProps) {
  const [open, setOpen] = useState(defaultOpen || activeCount > 0);
  const active = activeCount > 0;

  return (
    <section className="group">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="w-full flex items-center justify-between gap-3 px-4 py-4 sm:px-5 text-left transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
      >
        <div className="flex items-center gap-3 min-w-0">
          <span
            className={cn(
              "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors",
              active
                ? "bg-primary/10 text-primary"
                : "bg-muted text-muted-foreground group-hover:bg-primary/5 group-hover:text-primary"
            )}
          >
            {icon}
          </span>
          <h3
            className="text-sm font-bold tracking-tight text-foreground truncate leading-none"
            style={{ fontFamily: "'Space Grotesk', var(--font-sans, ui-sans-serif)" }}
          >
            {title}
          </h3>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {active && (
            <span
              className="inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold leading-none"
              aria-hidden="true"
            >
              {activeCount}
            </span>
          )}
          <ChevronDown
            className={cn(
              "h-4 w-4 transition-all",
              open
                ? "rotate-180 text-muted-foreground"
                : "text-muted-foreground/50 group-hover:text-muted-foreground"
            )}
          />
        </div>
      </button>

      {open && (
        <div className="px-4 sm:px-5 pb-5 -mt-1 min-w-0">
          <div className="min-w-0">{children}</div>
          {onClear && active && (
            <div className="mt-4 pt-4 border-t border-border/60">
              <button
                type="button"
                onClick={onClear}
                className="text-xs font-semibold text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-sm"
              >
                {clearLabel}
              </button>
            </div>
          )}
        </div>
      )}
    </section>
  );
}