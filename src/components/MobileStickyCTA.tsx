import { ReactNode } from "react";

interface MobileStickyCTAProps {
  /** Each child renders as a column-flexed action; usually 2–3 buttons. */
  children: ReactNode;
  /** ARIA label for the bar. */
  ariaLabel?: string;
}

/**
 * Bottom-fixed action bar visible only on mobile (`md:hidden`). Use on
 * detail pages so primary actions never scroll out of reach.
 * Includes safe-area padding for iOS notched devices.
 */
export default function MobileStickyCTA({
  children,
  ariaLabel = "Quick actions",
}: MobileStickyCTAProps) {
  return (
    <div
      role="region"
      aria-label={ariaLabel}
      className="md:hidden fixed bottom-0 inset-x-0 z-40 border-t border-border bg-background/95 backdrop-blur-md shadow-[0_-4px_16px_-4px_hsl(var(--primary)/0.15)] pb-safe pt-2 px-3"
    >
      <div className="flex items-stretch gap-2 max-w-3xl mx-auto">
        {children}
      </div>
    </div>
  );
}