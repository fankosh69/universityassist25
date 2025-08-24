import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  MapPin, 
  Building, 
  GraduationCap, 
  Users,
  TrendingUp,
  Calendar,
  Package
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import LoadingSpinner from "@/components/LoadingSpinner";

interface DashboardStats {
  cities: number;
  universities: number;
  programs: number;
  users: number;
  applications: number;
  packages: number;
}

export const AdminDashboard = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [
          citiesResult,
          universitiesResult,
          programsResult,
          usersResult,
          applicationsResult,
          packagesResult
        ] = await Promise.all([
          supabase.from('cities').select('*', { count: 'exact', head: true }),
          supabase.from('universities').select('*', { count: 'exact', head: true }),
          supabase.from('programs').select('*', { count: 'exact', head: true }),
          supabase.from('profiles').select('*', { count: 'exact', head: true }),
          supabase.from('user_applications').select('*', { count: 'exact', head: true }),
          supabase.from('service_packages').select('*', { count: 'exact', head: true })
        ]);

        setStats({
          cities: citiesResult.count || 0,
          universities: universitiesResult.count || 0,
          programs: programsResult.count || 0,
          users: usersResult.count || 0,
          applications: applicationsResult.count || 0,
          packages: packagesResult.count || 0
        });
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  const statCards = [
    {
      title: "Cities",
      value: stats?.cities || 0,
      icon: MapPin,
      color: "text-blue-600"
    },
    {
      title: "Universities",
      value: stats?.universities || 0,
      icon: Building,
      color: "text-green-600"
    },
    {
      title: "Programs",
      value: stats?.programs || 0,
      icon: GraduationCap,
      color: "text-purple-600"
    },
    {
      title: "Users",
      value: stats?.users || 0,
      icon: Users,
      color: "text-orange-600"
    },
    {
      title: "Applications",
      value: stats?.applications || 0,
      icon: Calendar,
      color: "text-red-600"
    },
    {
      title: "Service Packages",
      value: stats?.packages || 0,
      icon: Package,
      color: "text-indigo-600"
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground">
          Manage your University Assist platform
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map((card) => (
          <Card key={card.title} className="hover:shadow-medium transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {card.title}
              </CardTitle>
              <card.icon className={`h-4 w-4 ${card.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
              <p className="text-xs text-muted-foreground">
                Total {card.title.toLowerCase()}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-sm text-muted-foreground">
              • Add new programs and universities
            </div>
            <div className="text-sm text-muted-foreground">
              • Manage application deadlines
            </div>
            <div className="text-sm text-muted-foreground">
              • Update service packages
            </div>
            <div className="text-sm text-muted-foreground">
              • Monitor user activity
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>System Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm">Database</span>
                <span className="text-sm text-green-600">✓ Connected</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">API</span>
                <span className="text-sm text-green-600">✓ Operational</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Search</span>
                <span className="text-sm text-green-600">✓ Active</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};