import { motion, useReducedMotion, type Variants } from "framer-motion";
import { ReactNode } from "react";
import { useMotionGuard } from "@/hooks/useMotionGuard";

interface RevealProps {
  children: ReactNode;
  delay?: number;
  y?: number;
  className?: string;
  as?: "div" | "section" | "article" | "header";
  once?: boolean;
}

/**
 * Scroll-triggered fade + slide-in. Respects prefers-reduced-motion.
 */
export function Reveal({ children, delay = 0, y = 24, className, as = "div", once = true }: RevealProps) {
  const prefersReduce = useReducedMotion();
  const lowEnd = useMotionGuard();
  const reduce = prefersReduce || lowEnd;
  const MotionTag = motion[as] as typeof motion.div;
  const variants: Variants = {
    hidden: { opacity: 0, y: reduce ? 0 : y },
    show: { opacity: 1, y: 0, transition: { duration: reduce ? 0.2 : 0.6, ease: [0.22, 1, 0.36, 1], delay: reduce ? 0 : delay } },
  };
  return (
    <MotionTag
      className={className}
      initial="hidden"
      whileInView="show"
      viewport={{ once, amount: 0.15, margin: "0px 0px -10% 0px" }}
      variants={variants}
    >
      {children}
    </MotionTag>
  );
}

interface StaggerProps {
  children: ReactNode;
  className?: string;
  stagger?: number;
  delay?: number;
}

export function StaggerGroup({ children, className, stagger = 0.08, delay = 0 }: StaggerProps) {
  const prefersReduce = useReducedMotion();
  const lowEnd = useMotionGuard();
  const reduce = prefersReduce || lowEnd;
  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.1, margin: "0px 0px -10% 0px" }}
      variants={{
        hidden: {},
        show: { transition: { staggerChildren: reduce ? 0 : stagger, delayChildren: delay } },
      }}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({ children, className, y = 24 }: { children: ReactNode; className?: string; y?: number }) {
  const prefersReduce = useReducedMotion();
  const lowEnd = useMotionGuard();
  const reduce = prefersReduce || lowEnd;
  return (
    <motion.div
      className={className}
      variants={{
        hidden: { opacity: 0, y: reduce ? 0 : y },
        show: { opacity: 1, y: 0, transition: { duration: reduce ? 0.2 : 0.5, ease: [0.22, 1, 0.36, 1] } },
      }}
    >
      {children}
    </motion.div>
  );
}
