import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { User, Mail, Phone, FileText, MessageSquare, ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import LoadingSpinner from "@/components/LoadingSpinner";

interface AssignedStudent {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  nationality: string;
  current_education_level: string;
  preferred_fields: string[];
  xp_points: number;
  level: number;
  application_count: number;
  last_activity: string;
  notes?: string;
}

const SalesDashboard = () => {
  const [students, setStudents] = useState<AssignedStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    checkAccessAndFetchStudents();
  }, []);

  const checkAccessAndFetchStudents = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate("/auth");
        return;
      }

      // Check user role
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (!profile || !["company_sales", "company_admissions", "school_counselor"].includes(profile.role)) {
        toast({
          title: "Access Denied",
          description: "You don't have permission to access this page",
          variant: "destructive",
        });
        navigate("/dashboard");
        return;
      }

      setUserRole(profile.role);

      // Fetch assigned students
      const { data, error } = await supabase.functions.invoke("admin-secure-operations", {
        body: {
          operation: "get_assigned_students_details",
          userId: user.id,
        },
      });

      if (error) throw error;

      setStudents(data?.students || []);
    } catch (error: any) {
      console.error("Error fetching students:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to load assigned students",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase() || "?";
  };

  const getRoleBadgeText = () => {
    switch (userRole) {
      case "company_sales":
        return "Sales";
      case "company_admissions":
        return "Admissions";
      case "school_counselor":
        return "Counselor";
      default:
        return "";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="flex items-center justify-center h-[calc(100vh-80px)]">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">My Assigned Students</h1>
            <p className="text-muted-foreground">
              Manage and track your assigned student portfolio
            </p>
          </div>
          <Badge variant="outline" className="text-lg px-4 py-2">
            {getRoleBadgeText()}
          </Badge>
        </div>

        {students.length === 0 ? (
          <Card className="p-12 text-center">
            <User className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-semibold mb-2">No Students Assigned</h3>
            <p className="text-muted-foreground">
              You don't have any students assigned to you yet. Contact your administrator.
            </p>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {students.map((student) => (
              <Card key={student.id} className="p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                        {getInitials(student.full_name)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold text-lg">{student.full_name}</h3>
                      <p className="text-sm text-muted-foreground">{student.nationality}</p>
                    </div>
                  </div>
                  <Badge variant="secondary">Level {student.level}</Badge>
                </div>

                <div className="space-y-3 mb-4">
                  {student.email && (
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <span className="truncate">{student.email}</span>
                    </div>
                  )}
                  {student.phone && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <span>{student.phone}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-sm">
                    <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span>{student.current_education_level || "Not specified"}</span>
                  </div>
                </div>

                {student.preferred_fields && student.preferred_fields.length > 0 && (
                  <div className="mb-4">
                    <p className="text-xs text-muted-foreground mb-2">Interested Fields:</p>
                    <div className="flex flex-wrap gap-1">
                      {student.preferred_fields.slice(0, 3).map((field, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {field}
                        </Badge>
                      ))}
                      {student.preferred_fields.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{student.preferred_fields.length - 3}
                        </Badge>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between mb-4 pt-4 border-t">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-primary">{student.application_count}</p>
                    <p className="text-xs text-muted-foreground">Applications</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-accent">{student.xp_points}</p>
                    <p className="text-xs text-muted-foreground">XP Points</p>
                  </div>
                </div>

                {student.notes && (
                  <div className="mb-4 p-3 bg-muted/50 rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">Notes:</p>
                    <p className="text-sm">{student.notes}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => window.open(`/profile?student=${student.id}`, "_blank")}
                  >
                    <ExternalLink className="h-4 w-4 mr-1" />
                    Profile
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => {
                      toast({
                        title: "Coming Soon",
                        description: "Communication features will be available soon",
                      });
                    }}
                  >
                    <MessageSquare className="h-4 w-4 mr-1" />
                    Contact
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SalesDashboard;
