import { ReactNode, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useMotionGuard } from "@/hooks/useMotionGuard";

/**
 * Smooth route-change transition using framer-motion. Fades + subtle slide
 * whenever the pathname changes. Respects `prefers-reduced-motion`.
 */
export default function RouteTransition({ children }: { children: ReactNode }) {
  const location = useLocation();
  const prefersReduce = useReducedMotion();
  const lowEnd = useMotionGuard();
  const reduce = prefersReduce || lowEnd;

  // Scroll to top on each route change for a polished feel.
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  }, [location.pathname]);

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: reduce ? 0 : 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: reduce ? 0 : -8 }}
        transition={{ duration: reduce ? 0.15 : 0.25, ease: [0.22, 1, 0.36, 1] }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}