import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState, lazy, Suspense } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AdminProvider } from "@/contexts/AdminContext";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Search from "./pages/Search";
import SavedPrograms from "./pages/SavedPrograms";
import NotFound from "./pages/NotFound";
import LoadingScreen from "./components/LoadingScreen";
import LoadingSpinner from "./components/LoadingSpinner";

// Lazy load secondary pages
const Profile = lazy(() => import("./pages/Profile"));
const Cities = lazy(() => import("./pages/Cities"));
const CityDetail = lazy(() => import("./pages/CityDetail"));
const Universities = lazy(() => import("./pages/Universities"));
const UniversityDetail = lazy(() => import("./pages/UniversityDetail"));
const ProgramDetail = lazy(() => import("./pages/ProgramDetail"));
const CityPage = lazy(() => import("./pages/cities/CityPage"));
const UniversityPage = lazy(() => import("./pages/universities/UniversityPage"));
const ProgramPage = lazy(() => import("./pages/programs/ProgramPage"));
const AmbassadorsList = lazy(() => import("./pages/ambassadors/AmbassadorsList"));
const AmbassadorProfile = lazy(() => import("./pages/ambassadors/AmbassadorProfile"));
const AIAssistant = lazy(() => import("./pages/AIAssistant"));
const ProfilePage = lazy(() => import("./pages/profile/ProfilePage"));
const Impressum = lazy(() => import("./pages/Impressum"));
const Regions = lazy(() => import("./pages/Regions"));
const RegionDetail = lazy(() => import("./pages/RegionDetail"));
const AdmissionsNavigator = lazy(() => import("./pages/AdmissionsNavigator"));

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

const queryClient = new QueryClient();

const App = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLoadingComplete = () => {
    setLoading(false);
  };

  if (loading) {
    return <LoadingScreen onComplete={handleLoadingComplete} />;
  }

  // Debug check - add temporary test
  if (process.env.NODE_ENV === 'development') {
    console.log('App is loading in development mode');
  }

  return (
    <QueryClientProvider client={queryClient}>
      <AdminProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Suspense fallback={<LoadingSpinner />}>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/search" element={<Search />} />
                <Route 
                  path="/auth" 
                  element={user ? <Navigate to="/dashboard" /> : <Auth />} 
                />
                <Route 
                  path="/dashboard" 
                  element={user ? <Dashboard /> : <Navigate to="/auth" />} 
                />
                <Route 
                  path="/saved" 
                  element={user ? <SavedPrograms /> : <Navigate to="/auth" />} 
                />
                <Route path="/cities" element={<Cities />} />
                <Route path="/cities/:city" element={<CityPage />} />
                <Route path="/universities" element={<Universities />} />
                <Route path="/universities/:uni" element={<UniversityPage />} />
                <Route path="/universities/:uni/programs/:program" element={<ProgramPage />} />
                <Route path="/ambassadors" element={<AmbassadorsList />} />
                <Route path="/ambassadors/:slug" element={<AmbassadorProfile />} />
                <Route path="/ai-assistant" element={<AIAssistant />} />
                <Route path="/impressum" element={<Impressum />} />
                <Route path="/regions" element={<Regions />} />
                <Route path="/regions/:slug" element={<RegionDetail />} />
                <Route path="/admissions-navigator" element={<AdmissionsNavigator />} />
                <Route 
                  path="/profile" 
                  element={user ? <ProfilePage /> : <Navigate to="/auth" />} 
                />
                
                {/* Admin Routes */}
                <Route path="/admin" element={<AdminLayout><AdminDashboard /></AdminLayout>} />
                <Route path="/admin/programs" element={<AdminLayout><AdminPrograms /></AdminLayout>} />
                <Route path="/admin/fields-of-study" element={<AdminLayout><AdminFieldsOfStudy /></AdminLayout>} />
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
                
                {/* Legacy routes */}
                <Route path="/cities/:citySlug" element={<CityDetail />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </TooltipProvider>
      </AdminProvider>
    </QueryClientProvider>
  );
};

export default App;
