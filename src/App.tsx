import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState, useRef, lazy, Suspense } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AdminProvider } from "@/contexts/AdminContext";
import { HelmetProvider } from "react-helmet-async";
import { mergeGuestWatchlistInto } from "@/lib/guest-watchlist";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Search from "./pages/Search";
import SavedPrograms from "./pages/SavedPrograms";
import NotFound from "./pages/NotFound";
import LoadingScreen from "./components/LoadingScreen";
import LoadingSpinner from "./components/LoadingSpinner";
import DashboardEnhanced from "./pages/DashboardEnhanced";
import OnboardingFlow from "./pages/onboarding/OnboardingFlow";
import RouteTransition from "./components/RouteTransition";
import { useLocation } from "react-router-dom";
import { prefetchOnIdle } from "@/lib/route-prefetch";


// Lazy load secondary pages
const Profile = lazy(() => import("./pages/Profile"));
const Cities = lazy(() => import("./pages/Cities"));
const Universities = lazy(() => import("./pages/Universities"));
const ProgramDetail = lazy(() => import("./pages/ProgramDetail"));
const CityPage = lazy(() => import("./pages/cities/CityPage"));
const UniversityPage = lazy(() => import("./pages/universities/UniversityPage"));
const ProgramPage = lazy(() => import("./pages/programs/ProgramPage"));
const AmbassadorsList = lazy(() => import("./pages/ambassadors/AmbassadorsList"));
const AmbassadorProfile = lazy(() => import("./pages/ambassadors/AmbassadorProfile"));
const ShortlistsReceived = lazy(() => import("./pages/ShortlistsReceived"));
const AIAssistant = lazy(() => import("./pages/AIAssistant"));
const ProfilePage = lazy(() => import("./pages/profile/ProfilePage"));
const Impressum = lazy(() => import("./pages/Impressum"));
const Regions = lazy(() => import("./pages/Regions"));
const RegionDetail = lazy(() => import("./pages/RegionDetail"));
const AdmissionsNavigator = lazy(() => import("./pages/AdmissionsNavigator"));
const DocumentsPage = lazy(() => import("./pages/DocumentsPage"));
const SalesDashboard = lazy(() => import("./pages/SalesDashboard"));
const EligibilityChecker = lazy(() => import("./pages/EligibilityChecker"));

// Legacy blog routes — recreated WordPress posts that still rank on Google.
// Slugs MUST match the legacy URLs for SEO continuity.
const BlogIndex = lazy(() => import("./pages/blog/BlogIndex"));
const LegacyBlogRoute = lazy(() => import("./pages/blog/LegacyBlogRoute"));
import { LEGACY_BLOG_POSTS, LEGACY_BLOG_REDIRECTS } from "@/content/legacy-blog-posts";

// SEO landing pages targeting high-intent keywords; funnel into /search.
const LandingRoute = lazy(() => import("./pages/landing/LandingRoute"));
import { LANDING_PAGES } from "@/content/landing-pages";

// Lazy load admin pages
const AdminLayout = lazy(() => import("./components/admin/AdminLayout").then(m => ({ default: m.AdminLayout })));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard").then(m => ({ default: m.AdminDashboard })));
const AdminPrograms = lazy(() => import("./pages/admin/AdminPrograms").then(m => ({ default: m.AdminPrograms })));
const AdminUniversities = lazy(() => import("./pages/admin/AdminUniversities").then(m => ({ default: m.AdminUniversities })));
const AdminCities = lazy(() => import("./pages/admin/AdminCities").then(m => ({ default: m.AdminCities })));
const AdminRegions = lazy(() => import("./pages/admin/AdminRegions").then(m => ({ default: m.AdminRegions })));
const AdminUsers = lazy(() => import("./pages/admin/AdminUsers").then(m => ({ default: m.AdminUsers })));
const AdminServicePackages = lazy(() => import("./pages/admin/AdminServicePackages").then(m => ({ default: m.AdminServicePackages })));
const AdminSecurity = lazy(() => import("./pages/admin/AdminSecurity"));
const AdminSitemap = lazy(() => import("./pages/admin/AdminSitemap"));
const AdminDesign = lazy(() => import("./pages/admin/AdminDesign"));
const AdminAdmissionRequirements = lazy(() => import("./pages/admin/AdminAdmissionRequirements"));
const AdminHistoricalData = lazy(() => import("./pages/admin/AdminHistoricalData"));
const AdminFieldsOfStudy = lazy(() => import("./pages/admin/AdminFieldsOfStudy"));
const AdminShortlists = lazy(() => import("./pages/admin/AdminShortlists"));
const AdminProgramInquiries = lazy(() => import("./pages/admin/AdminProgramInquiries"));
const AdminHubSpot = lazy(() => import("./pages/admin/AdminHubSpot"));

const queryClient = new QueryClient();

const App = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const loadingRef = useRef(true);
  const pendingUserRef = useRef<any>(undefined);

  useEffect(() => {
    // Get initial session - defer state update if still loading
    supabase.auth.getSession().then(({ data: { session } }) => {
      const newUser = session?.user ?? null;
      if (loadingRef.current) {
        // Store for later - don't trigger re-render during loading animation
        pendingUserRef.current = newUser;
      } else {
        setUser(newUser);
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      const newUser = session?.user ?? null;
      if (loadingRef.current) {
        pendingUserRef.current = newUser;
      } else {
        setUser(newUser);
      }
      // Merge any guest-watchlist entries into the user's saved list on sign-in.
      if (event === "SIGNED_IN" && newUser?.id) {
        // Defer to avoid running inside the auth callback.
        setTimeout(() => {
          mergeGuestWatchlistInto(supabase as any, newUser.id).catch(() => {});
        }, 0);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLoadingComplete = () => {
    loadingRef.current = false;
    // Apply any pending user state that was captured during loading
    if (pendingUserRef.current !== undefined) {
      setUser(pendingUserRef.current);
    }
    setLoading(false);
  };

  if (loading) {
    return <LoadingScreen key="app-loader" onComplete={handleLoadingComplete} />;
  }

  // Debug check - add temporary test
  if (process.env.NODE_ENV === 'development') {
    console.log('App is loading in development mode');
  }

  return (
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <AdminProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
            <Suspense fallback={<LoadingSpinner />}>
              <AnimatedRoutes user={user} />
            </Suspense>
          </BrowserRouter>
        </TooltipProvider>
      </AdminProvider>
    </QueryClientProvider>
    </HelmetProvider>
  );
};

const AnimatedRoutes = ({ user }: { user: any }) => {
  const location = useLocation();

  // Prefetch high-intent routes during browser idle time, and warm the
  // routes that depend on auth state once we know whether the user is
  // signed in.
  useEffect(() => {
    prefetchOnIdle([
      "/search",
      "/cities",
      "/universities",
      user ? "/dashboard" : "/auth",
    ]);
  }, [user]);

  return (
    <RouteTransition>
      <Routes location={location}>
                <Route path="/" element={<Index />} />
                <Route path="/search" element={<Search />} />
                <Route 
                  path="/auth" 
                  element={user ? <Navigate to="/dashboard" /> : <Auth />} 
                />
                <Route 
                  path="/dashboard" 
                  element={user ? <DashboardEnhanced /> : <Navigate to="/auth" />} 
                />
                <Route 
                  path="/onboarding" 
                  element={user ? <OnboardingFlow /> : <Navigate to="/auth" />} 
                />
                <Route 
                  path="/documents" 
                  element={user ? <DocumentsPage /> : <Navigate to="/auth" />} 
                />
                <Route 
                  path="/saved" 
                  element={user ? <SavedPrograms /> : <Navigate to="/auth" />} 
                />
                <Route 
                  path="/sales-dashboard" 
                  element={user ? <SalesDashboard /> : <Navigate to="/auth" />} 
                />
                <Route path="/cities" element={<Cities />} />
                <Route path="/cities/:city" element={<CityPage />} />
                <Route path="/universities" element={<Universities />} />
                <Route path="/universities/:uni" element={<UniversityPage />} />
                <Route path="/universities/:uni/programs/:program" element={<ProgramPage />} />
          <Route path="/ambassadors" element={<AmbassadorsList />} />
          <Route path="/ambassadors/:slug" element={<AmbassadorProfile />} />
          <Route path="/recommendations" element={<ShortlistsReceived />} />
                <Route path="/ai-assistant" element={user ? <AIAssistant /> : <Navigate to="/auth" />} />
                <Route path="/impressum" element={<Impressum />} />
                <Route path="/regions" element={<Regions />} />
                <Route path="/regions/:slug" element={<RegionDetail />} />
                <Route path="/admissions-navigator" element={<AdmissionsNavigator />} />
                <Route path="/eligibility-checker" element={<EligibilityChecker />} />
                {/* Blog index + legacy ranking URLs rebuilt as native pages */}
                <Route path="/blog" element={<BlogIndex />} />
                {LEGACY_BLOG_POSTS.flatMap((p) => [
                  <Route key={p.slug} path={`/${p.slug}`} element={<LegacyBlogRoute slug={p.slug} />} />,
                  <Route key={`${p.slug}-trailing`} path={`/${p.slug}/`} element={<LegacyBlogRoute slug={p.slug} />} />,
                ])}
                {/* Old WordPress slugs that map to a rebuilt canonical post */}
                {Object.entries(LEGACY_BLOG_REDIRECTS).flatMap(([from, to]) => [
                  <Route key={`rdr-${from}`} path={`/${from}`} element={<Navigate to={`/${to}`} replace />} />,
                  <Route key={`rdr-${from}-tr`} path={`/${from}/`} element={<Navigate to={`/${to}`} replace />} />,
                ])}
                {/* SEO landing pages (high-intent keywords -> search funnel) */}
                {LANDING_PAGES.flatMap((p) => [
                  <Route key={`lp-${p.slug}`} path={`/${p.slug}`} element={<LandingRoute slug={p.slug} />} />,
                  <Route key={`lp-${p.slug}-tr`} path={`/${p.slug}/`} element={<LandingRoute slug={p.slug} />} />,
                ])}
                <Route 
                  path="/profile" 
                  element={user ? <ProfilePage /> : <Navigate to="/auth" />} 
                />
                
                {/* Admin Routes */}
                <Route path="/admin" element={<AdminLayout><AdminDashboard /></AdminLayout>} />
                <Route path="/admin/programs" element={<AdminLayout><AdminPrograms /></AdminLayout>} />
                <Route path="/admin/fields-of-study" element={<AdminLayout><AdminFieldsOfStudy /></AdminLayout>} />
                <Route path="/admin/shortlists" element={<AdminLayout><AdminShortlists /></AdminLayout>} />
                <Route path="/admin/security" element={<AdminLayout><AdminSecurity /></AdminLayout>} />
                <Route path="/admin/cities" element={<AdminLayout><AdminCities /></AdminLayout>} />
                <Route path="/admin/regions" element={<AdminLayout><AdminRegions /></AdminLayout>} />
                <Route path="/admin/universities" element={<AdminLayout><AdminUniversities /></AdminLayout>} />
                <Route path="/admin/packages" element={<AdminLayout><AdminServicePackages /></AdminLayout>} />
                <Route path="/admin/design" element={<AdminLayout><AdminDesign /></AdminLayout>} />
                <Route path="/admin/users" element={<AdminLayout><AdminUsers /></AdminLayout>} />
                <Route path="/admin/sitemap" element={<AdminLayout><AdminSitemap /></AdminLayout>} />
                <Route path="/admin/admission-requirements" element={<AdminLayout><AdminAdmissionRequirements /></AdminLayout>} />
                <Route path="/admin/historical-data" element={<AdminLayout><AdminHistoricalData /></AdminLayout>} />
                <Route path="/admin/program-inquiries" element={<AdminLayout><AdminProgramInquiries /></AdminLayout>} />
                <Route path="/admin/hubspot" element={<AdminLayout><AdminHubSpot /></AdminLayout>} />
                
                <Route path="*" element={<NotFound />} />
              </Routes>
    </RouteTransition>
  );
};

export default App;
