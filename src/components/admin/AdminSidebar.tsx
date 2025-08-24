import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Settings,
  MapPin,
  Building,
  GraduationCap,
  Calendar,
  Package,
  Users,
  BarChart3,
  Home,
  Menu,
  Shield
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";

const adminMenuItems = [
  { title: "Dashboard", url: "/admin", icon: BarChart3 },
  { title: "Cities", url: "/admin/cities", icon: MapPin },
  { title: "Universities", url: "/admin/universities", icon: Building },
  { title: "Programs", url: "/admin/programs", icon: GraduationCap },
  { title: "Application Periods", url: "/admin/periods", icon: Calendar },
  { title: "Service Packages", url: "/admin/packages", icon: Package },
  { title: "User Management", url: "/admin/users", icon: Users },
  { title: "Security", url: "/admin/security", icon: Shield },
];

export function AdminSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const { t } = useTranslation('common');
  const currentPath = location.pathname;

  const isActive = (path: string) => currentPath === path;
  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    isActive ? "bg-primary text-primary-foreground font-medium" : "hover:bg-muted/50";

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-primary font-semibold">
            <Settings className="h-4 w-4 mr-2" />
            {state === "expanded" && "Admin Panel"}
          </SidebarGroupLabel>

          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <NavLink to="/" className={getNavCls}>
                    <Home className="h-4 w-4" />
                    {state === "expanded" && <span>Back to Site</span>}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
              
              {adminMenuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} end className={getNavCls}>
                      <item.icon className="h-4 w-4" />
                      {state === "expanded" && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}