import { useEffect, useState } from "react";

/**
 * Lightweight motion/perf guard.
 * Returns `true` when animations should be reduced or skipped because the
 * user prefers reduced motion, the device looks low-end (few CPU cores,
 * little memory), the network is slow / save-data is on, or the tab is
 * hidden. Cheap to call — values are cached after first mount.
 */
let cached: boolean | null = null;

function detectLowEnd(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const nav = navigator as any;
    const cores = nav.hardwareConcurrency ?? 8;
    const mem = nav.deviceMemory ?? 8;
    const conn = nav.connection || nav.mozConnection || nav.webkitConnection;
    const saveData = !!conn?.saveData;
    const slowNet = conn?.effectiveType && /(^|-)2g$/.test(conn.effectiveType);
    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    return reduced || saveData || slowNet || cores <= 4 || mem <= 2;
  } catch {
    return false;
  }
}

export function useMotionGuard(): boolean {
  const [low, setLow] = useState<boolean>(() => {
    if (cached !== null) return cached;
    cached = detectLowEnd();
    return cached;
  });

  useEffect(() => {
    const mq = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    const onChange = () => {
      cached = detectLowEnd();
      setLow(cached);
    };
    mq?.addEventListener?.("change", onChange);
    return () => mq?.removeEventListener?.("change", onChange);
  }, []);

  return low;
}

/**
 * Shared IntersectionObserver factory — throttles callbacks via rAF so many
 * Reveal elements don't each spin up their own observer + layout work.
 */
type Cb = (entry: IntersectionObserverEntry) => void;
const registries = new WeakMap<Element, Cb>();
let sharedObserver: IntersectionObserver | null = null;
let pending: IntersectionObserverEntry[] = [];
let scheduled = false;

function flush() {
  scheduled = false;
  const entries = pending;
  pending = [];
  for (const e of entries) {
    const cb = registries.get(e.target);
    if (cb) cb(e);
  }
}

export function observeOnce(el: Element, cb: Cb, rootMargin = "0px 0px -10% 0px") {
  if (typeof window === "undefined" || !("IntersectionObserver" in window)) {
    cb({ isIntersecting: true } as IntersectionObserverEntry);
    return () => {};
  }
  if (!sharedObserver) {
    sharedObserver = new IntersectionObserver(
      (entries) => {
        pending.push(...entries);
        if (!scheduled) {
          scheduled = true;
          requestAnimationFrame(flush);
        }
      },
      { rootMargin, threshold: 0.15 }
    );
  }
  registries.set(el, cb);
  sharedObserver.observe(el);
  return () => {
    sharedObserver?.unobserve(el);
    registries.delete(el);
  };
}