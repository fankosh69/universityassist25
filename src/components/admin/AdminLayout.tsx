import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAdmin } from "@/hooks/useAdmin";
import LoadingSpinner from "@/components/LoadingSpinner";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "./AdminSidebar";
import LanguageSelector from "@/components/LanguageSelector";

interface AdminLayoutProps {
  children: ReactNode;
}

export const AdminLayout = ({ children }: AdminLayoutProps) => {
  const { isAdmin, loading } = useAdmin();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        {/* Global header with trigger */}
        <header className="fixed top-0 left-0 right-0 h-12 flex items-center border-b bg-white/95 backdrop-blur-sm z-50">
          <SidebarTrigger className="ml-2" />
          <div className="flex-1 flex items-center justify-between px-4">
            <h1 className="text-lg font-semibold text-primary">Admin Panel</h1>
            <LanguageSelector />
          </div>
        </header>

        <AdminSidebar />

        <main className="flex-1 pt-12">
          <div className="p-6">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};