import * as React from "react";
import { Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface InfoHintProps {
  content: React.ReactNode;
  className?: string;
  iconClassName?: string;
  ariaLabel?: string;
  side?: "top" | "right" | "bottom" | "left";
}

/**
 * Hybrid disclaimer hint:
 * - Desktop (non-touch): Tooltip on hover/focus
 * - Mobile / touch: Popover on tap
 */
export function InfoHint({
  content,
  className,
  iconClassName,
  ariaLabel = "More information",
  side = "top",
}: InfoHintProps) {
  const isMobile = useIsMobile();
  const [open, setOpen] = React.useState(false);

  const icon = (
    <Info
      className={cn(
        "h-3.5 w-3.5 text-muted-foreground hover:text-foreground transition-colors",
        iconClassName
      )}
    />
  );

  if (isMobile) {
    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            aria-label={ariaLabel}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setOpen((v) => !v);
            }}
            className={cn(
              "inline-flex items-center justify-center rounded-full p-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              className
            )}
          >
            {icon}
          </button>
        </PopoverTrigger>
        <PopoverContent
          side={side}
          className="max-w-[280px] text-xs p-3 bg-popover text-popover-foreground"
        >
          {content}
        </PopoverContent>
      </Popover>
    );
  }

  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            aria-label={ariaLabel}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            className={cn(
              "inline-flex items-center justify-center rounded-full p-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              className
            )}
          >
            {icon}
          </button>
        </TooltipTrigger>
        <TooltipContent side={side} className="max-w-[280px] text-xs">
          {content}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}