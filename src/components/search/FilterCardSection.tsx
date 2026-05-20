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

  return (
    <section
      className={cn(
        "rounded-2xl border border-border bg-card shadow-sm overflow-hidden transition-all",
        open
          ? "shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)] ring-1 ring-black/5"
          : "hover:border-primary/30"
      )}
    >
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="w-full flex items-center justify-between gap-3 p-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-2xl"
      >
        <div className="flex items-center gap-3 min-w-0">
          <span
            className={cn(
              "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors",
              open
                ? "bg-primary/5 text-primary"
                : "bg-muted-foreground/10 text-muted-foreground"
            )}
          >
            {icon}
          </span>
          <h3
            className="text-sm font-bold tracking-tight text-foreground truncate"
            style={{ fontFamily: "'Space Grotesk', var(--font-sans, ui-sans-serif)" }}
          >
            {title}
          </h3>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {activeCount > 0 && (
            <span
              className="inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 rounded-full bg-primary text-primary-foreground text-[11px] font-bold leading-none"
              aria-hidden="true"
            >
              {activeCount}
            </span>
          )}
          <ChevronDown
            className={cn(
              "h-4 w-4 text-muted-foreground transition-transform",
              open && "rotate-180"
            )}
          />
        </div>
      </button>

      {open && (
        <>
          <div className="px-3 pb-3 -mt-1 min-w-0">{children}</div>
          {onClear && activeCount > 0 && (
            <div className="border-t border-border bg-muted/30 p-2.5 flex justify-center">
              <button
                type="button"
                onClick={onClear}
                className="text-xs font-bold text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-sm px-2 py-0.5"
              >
                {clearLabel}
              </button>
            </div>
          )}
        </>
      )}
    </section>
  );
}