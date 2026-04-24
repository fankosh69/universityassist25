import { ReactNode, useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

/**
 * Lightweight route-change transition. Plays a short fade + 4px slide
 * whenever the pathname changes. Respects `prefers-reduced-motion` via the
 * `motion-safe:` Tailwind variant — users who disable motion get an instant
 * swap with no animation.
 */
export default function RouteTransition({ children }: { children: ReactNode }) {
  const location = useLocation();
  const [displayKey, setDisplayKey] = useState(location.pathname);

  useEffect(() => {
    setDisplayKey(location.pathname);
  }, [location.pathname]);

  return (
    <div
      key={displayKey}
      className="motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-1 motion-safe:duration-200"
    >
      {children}
    </div>
  );
}