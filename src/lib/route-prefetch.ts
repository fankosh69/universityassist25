/**
 * Lightweight route prefetching. Maps URL paths to the same dynamic
 * `import()` loaders used by `React.lazy` in App.tsx. Calling a loader
 * warms the browser's module cache so the chunk is already resolved by
 * the time the user actually navigates — making the route transition
 * feel instant.
 *
 * Each loader is fired at most once per session.
 */
type Loader = () => Promise<unknown>;

const loaders: Array<{ test: (path: string) => boolean; load: Loader }> = [
  { test: (p) => p === "/search", load: () => import("@/pages/Search") },
  { test: (p) => p === "/dashboard", load: () => import("@/pages/DashboardEnhanced") },
  { test: (p) => p === "/profile", load: () => import("@/pages/profile/ProfilePage") },
  { test: (p) => p === "/saved", load: () => import("@/pages/SavedPrograms") },
  { test: (p) => p === "/auth", load: () => import("@/pages/Auth") },
  { test: (p) => p === "/onboarding", load: () => import("@/pages/onboarding/OnboardingFlow") },
  { test: (p) => p === "/documents", load: () => import("@/pages/DocumentsPage") },
  { test: (p) => p === "/cities", load: () => import("@/pages/Cities") },
  { test: (p) => /^\/cities\/[^/]+$/.test(p), load: () => import("@/pages/cities/CityPage") },
  { test: (p) => p === "/universities", load: () => import("@/pages/Universities") },
  { test: (p) => /^\/universities\/[^/]+$/.test(p), load: () => import("@/pages/universities/UniversityPage") },
  { test: (p) => /^\/universities\/[^/]+\/programs\/[^/]+$/.test(p), load: () => import("@/pages/programs/ProgramPage") },
  { test: (p) => p === "/regions", load: () => import("@/pages/Regions") },
  { test: (p) => /^\/regions\/[^/]+$/.test(p), load: () => import("@/pages/RegionDetail") },
  { test: (p) => p === "/ambassadors", load: () => import("@/pages/ambassadors/AmbassadorsList") },
  { test: (p) => /^\/ambassadors\/[^/]+$/.test(p), load: () => import("@/pages/ambassadors/AmbassadorProfile") },
  { test: (p) => p === "/recommendations", load: () => import("@/pages/ShortlistsReceived") },
  { test: (p) => p === "/ai-assistant", load: () => import("@/pages/AIAssistant") },
  { test: (p) => p === "/admissions-navigator", load: () => import("@/pages/AdmissionsNavigator") },
  { test: (p) => p === "/eligibility-checker", load: () => import("@/pages/EligibilityChecker") },
  { test: (p) => p === "/impressum", load: () => import("@/pages/Impressum") },
  { test: (p) => p === "/sales-dashboard", load: () => import("@/pages/SalesDashboard") },
];

const fired = new Set<Loader>();

export function prefetchRoute(href: string): void {
  if (typeof window === "undefined" || !href) return;
  // Strip query/hash and origin if present.
  let path = href;
  try {
    if (/^https?:\/\//.test(href)) path = new URL(href).pathname;
    else path = href.split("?")[0].split("#")[0];
  } catch {
    /* ignore */
  }
  for (const entry of loaders) {
    if (entry.test(path) && !fired.has(entry.load)) {
      fired.add(entry.load);
      // Fire-and-forget; ignore errors so a failed prefetch never breaks UX.
      entry.load().catch(() => fired.delete(entry.load));
      break;
    }
  }
}

/**
 * Warm a small set of high-intent routes during browser idle time so they
 * are ready before the user has a chance to click.
 */
export function prefetchOnIdle(paths: string[]): void {
  if (typeof window === "undefined") return;
  const nav = navigator as any;
  const conn = nav.connection || nav.mozConnection || nav.webkitConnection;
  if (conn?.saveData) return; // Respect Save-Data.
  if (conn?.effectiveType && /(^|-)2g$/.test(conn.effectiveType)) return;

  const run = () => paths.forEach(prefetchRoute);
  const ric: ((cb: () => void, opts?: { timeout: number }) => number) | undefined =
    (window as any).requestIdleCallback;
  if (ric) ric(run, { timeout: 2500 });
  else setTimeout(run, 1500);
}