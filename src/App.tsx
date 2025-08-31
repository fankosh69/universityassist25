import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect, lazy, Suspense } from "react";
import type { Session } from "@supabase/supabase-js";
import QABanner from "@/components/QABanner";
import LoadingSpinner from "@/components/LoadingSpinner";

// Core pages (not lazy loaded for better UX)
import Index from "@/pages/Index";
import Auth from "@/pages/Auth";
import Dashboard from "@/pages/Dashboard";
import NotFound from "@/pages/NotFound";

// Lazy loaded pages for better performance
const Profile = lazy(() => import("@/pages/Profile"));
const Search = lazy(() => import("@/pages/Search"));
const SavedPrograms = lazy(() => import("@/pages/SavedPrograms"));
const Cities = lazy(() => import("@/pages/Cities"));
const Universities = lazy(() => import("@/pages/Universities"));
const QAPacket = lazy(() => import("@/pages/QAPacket"));

// Admin pages - import AdminLayout directly since it has named export
import { AdminLayout } from "@/components/admin/AdminLayout";
const AdminDashboard = lazy(() => import("@/pages/admin/AdminDashboard").then(module => ({ default: module.AdminDashboard })));
const AdminUsers = lazy(() => import("@/pages/admin/AdminUsers").then(module => ({ default: module.AdminUsers })));
const AdminUniversities = lazy(() => import("@/pages/admin/AdminUniversities").then(module => ({ default: module.AdminUniversities })));
const AdminPrograms = lazy(() => import("@/pages/admin/AdminPrograms").then(module => ({ default: module.AdminPrograms })));
const AdminCities = lazy(() => import("@/pages/admin/AdminCities").then(module => ({ default: module.AdminCities })));
const AdminSitemap = lazy(() => import("@/pages/admin/AdminSitemap"));
const AdminQASetup = lazy(() => import("@/pages/admin/AdminQASetup"));
const AdminTestSprite = lazy(() => import("@/pages/admin/AdminTestSprite"));
const AdminSecurity = lazy(() => import("@/pages/admin/AdminSecurity"));
const AdminServicePackages = lazy(() => import("@/pages/admin/AdminServicePackages").then(module => ({ default: module.AdminServicePackages })));

// Detail pages (lazy loaded)
const CityDetail = lazy(() => import("@/pages/CityDetail"));
const UniversityDetail = lazy(() => import("@/pages/UniversityDetail"));
const ProgramDetail = lazy(() => import("@/pages/ProgramDetail"));

// Other pages (lazy loaded)
const AmbassadorsList = lazy(() => import("@/pages/ambassadors/AmbassadorsList"));
const AmbassadorProfile = lazy(() => import("@/pages/ambassadors/AmbassadorProfile"));
const CityPage = lazy(() => import("@/pages/cities/CityPage"));
const UniversityPage = lazy(() => import("@/pages/universities/UniversityPage"));
const ProgramPage = lazy(() => import("@/pages/programs/ProgramPage"));
const ProfilePage = lazy(() => import("@/pages/profile/ProfilePage"));

// Documentation pages (lazy loaded)
const ApiDocs = lazy(() => import("@/pages/docs/ApiDocs"));
const ApiQuickstart = lazy(() => import("@/pages/docs/ApiQuickstart"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Improve caching and performance
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (renamed from cacheTime)
    },
  },
});

const App = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-hero">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <QABanner />
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Index />} />
            <Route path="/search" element={
              <Suspense fallback={<LoadingSpinner />}>
                <Search />
              </Suspense>
            } />
            <Route path="/cities" element={
              <Suspense fallback={<LoadingSpinner />}>
                <Cities />
              </Suspense>
            } />
            <Route path="/cities/:citySlug" element={
              <Suspense fallback={<LoadingSpinner />}>
                <CityDetail />
              </Suspense>
            } />
            <Route path="/cities/:city" element={
              <Suspense fallback={<LoadingSpinner />}>
                <CityPage />
              </Suspense>
            } />
            <Route path="/universities" element={
              <Suspense fallback={<LoadingSpinner />}>
                <Universities />
              </Suspense>
            } />
            <Route path="/universities/:universitySlug" element={
              <Suspense fallback={<LoadingSpinner />}>
                <UniversityDetail />
              </Suspense>
            } />
            <Route path="/universities/:uni" element={
              <Suspense fallback={<LoadingSpinner />}>
                <UniversityPage />
              </Suspense>
            } />
            <Route path="/universities/:universitySlug/programs/:programSlug" element={
              <Suspense fallback={<LoadingSpinner />}>
                <ProgramDetail />
              </Suspense>
            } />
            <Route path="/universities/:uni/programs/:program" element={
              <Suspense fallback={<LoadingSpinner />}>
                <ProgramPage />
              </Suspense>
            } />
            <Route path="/ambassadors" element={
              <Suspense fallback={<LoadingSpinner />}>
                <AmbassadorsList />
              </Suspense>
            } />
            <Route path="/ambassadors/:ambassadorSlug" element={
              <Suspense fallback={<LoadingSpinner />}>
                <AmbassadorProfile />
              </Suspense>
            } />
            <Route path="/qa/packet" element={
              <Suspense fallback={<LoadingSpinner />}>
                <QAPacket />
              </Suspense>
            } />
            
            {/* Documentation Routes */}
            <Route path="/docs/api" element={
              <Suspense fallback={<LoadingSpinner />}>
                <ApiDocs />
              </Suspense>
            } />
            <Route path="/docs/api/index.html" element={
              <Suspense fallback={<LoadingSpinner />}>
                <ApiDocs />
              </Suspense>
            } />
            <Route path="/docs/api/quickstart" element={
              <Suspense fallback={<LoadingSpinner />}>
                <ApiQuickstart />
              </Suspense>
            } />
            <Route path="/docs/api/quickstart.html" element={
              <Suspense fallback={<LoadingSpinner />}>
                <ApiQuickstart />
              </Suspense>
            } />

            {/* Protected Routes - require authentication */}
            <Route 
              path="/dashboard" 
              element={user ? <Dashboard /> : <Navigate to="/auth" replace />} 
            />
            <Route 
              path="/saved" 
              element={user ? (
                <Suspense fallback={<LoadingSpinner />}>
                  <SavedPrograms />
                </Suspense>
              ) : <Navigate to="/auth" replace />} 
            />
            <Route 
              path="/profile" 
              element={user ? (
                <Suspense fallback={<LoadingSpinner />}>
                  <ProfilePage />
                </Suspense>
              ) : <Navigate to="/auth" replace />} 
            />

            {/* Auth Route - redirect to dashboard if already logged in */}
            <Route 
              path="/auth" 
              element={user ? <Navigate to="/dashboard" replace /> : <Auth />} 
            />

            {/* Admin Routes - using Outlet pattern */}
            <Route path="/admin" element={<AdminLayout><div /></AdminLayout>}>
              <Route index element={
                <Suspense fallback={<LoadingSpinner />}>
                  <AdminDashboard />
                </Suspense>
              } />
              <Route path="users" element={
                <Suspense fallback={<LoadingSpinner />}>
                  <AdminUsers />
                </Suspense>
              } />
              <Route path="universities" element={
                <Suspense fallback={<LoadingSpinner />}>
                  <AdminUniversities />
                </Suspense>
              } />
              <Route path="programs" element={
                <Suspense fallback={<LoadingSpinner />}>
                  <AdminPrograms />
                </Suspense>
              } />
              <Route path="cities" element={
                <Suspense fallback={<LoadingSpinner />}>
                  <AdminCities />
                </Suspense>
              } />
              <Route path="sitemap" element={
                <Suspense fallback={<LoadingSpinner />}>
                  <AdminSitemap />
                </Suspense>
              } />
              <Route path="qa-setup" element={
                <Suspense fallback={<LoadingSpinner />}>
                  <AdminQASetup />
                </Suspense>
              } />
              <Route path="testsprite" element={
                <Suspense fallback={<LoadingSpinner />}>
                  <AdminTestSprite />
                </Suspense>
              } />
              <Route path="security" element={
                <Suspense fallback={<LoadingSpinner />}>
                  <AdminSecurity />
                </Suspense>
              } />
              <Route path="packages" element={
                <Suspense fallback={<LoadingSpinner />}>
                  <AdminServicePackages />
                </Suspense>
              } />
            </Route>

            {/* Catch-all route for 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
