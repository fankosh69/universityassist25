import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import LoadingSpinner from "@/components/LoadingSpinner";
import {
  User,
  Mail,
  Phone,
  Calendar,
  MapPin,
  GraduationCap,
  Clock,
  FileText,
  Edit2,
  Save,
  X,
  BookOpen,
  TrendingUp,
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

interface UserDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  onUserUpdated: () => void;
}

interface UserDetails {
  id: string;
  full_name?: string;
  email?: string;
  phone?: string;
  country_code?: string;
  date_of_birth?: string;
  nationality?: string;
  gender?: string;
  current_education_level?: string;
  current_institution?: string;
  current_field_of_study?: string;
  current_gpa?: number;
  created_at: string;
  updated_at: string;
  xp_points?: number;
  level?: number;
  user_roles?: { role: string }[];
}

interface Application {
  id: string;
  status: string;
  submitted_at?: string;
  created_at: string;
  program: {
    name: string;
    degree_level: string;
    institution: {
      name: string;
    };
  };
}

interface Match {
  id: string;
  compatibility_score: number;
  created_at: string;
  program: {
    name: string;
    institution: {
      name: string;
    };
  };
}

export const UserDetailsModal = ({
  open,
  onOpenChange,
  userId,
  onUserUpdated,
}: UserDetailsModalProps) => {
  const [user, setUser] = useState<UserDetails | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [editedUser, setEditedUser] = useState<Partial<UserDetails>>({});
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open && userId) {
      fetchUserDetails();
    }
  }, [open, userId]);

  const fetchUserDetails = async () => {
    setLoading(true);
    try {
      // Fetch user profile
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select(`
          *,
          user_roles(role)
        `)
        .eq("id", userId)
        .single();

      if (profileError) throw profileError;
      setUser(profile);
      setEditedUser(profile);

      // Fetch applications
      const { data: apps, error: appsError } = await supabase
        .from("applications")
        .select(`
          id,
          status,
          submitted_at,
          created_at,
          program:programs(
            name,
            degree_level,
            institution:institutions(name)
          )
        `)
        .eq("profile_id", userId)
        .order("created_at", { ascending: false });

      if (!appsError && apps) {
        setApplications(apps as any);
      }

      // Fetch matches
      const { data: userMatches, error: matchesError } = await supabase
        .from("matches")
        .select(`
          id,
          compatibility_score,
          created_at,
          program:programs(
            name,
            institution:institutions(name)
          )
        `)
        .eq("profile_id", userId)
        .order("compatibility_score", { ascending: false })
        .limit(10);

      if (!matchesError && userMatches) {
        setMatches(userMatches as any);
      }
    } catch (error) {
      console.error("Error fetching user details:", error);
      toast({
        title: "Error",
        description: "Failed to load user details",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: editedUser.full_name,
          email: editedUser.email,
          phone: editedUser.phone,
          country_code: editedUser.country_code,
          nationality: editedUser.nationality,
          gender: editedUser.gender,
          current_education_level: editedUser.current_education_level,
          current_institution: editedUser.current_institution,
          current_field_of_study: editedUser.current_field_of_study,
          current_gpa: editedUser.current_gpa,
        })
        .eq("id", userId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "User profile updated successfully",
      });

      setEditMode(false);
      fetchUserDetails();
      onUserUpdated();
    } catch (error) {
      console.error("Error updating user:", error);
      toast({
        title: "Error",
        description: "Failed to update user profile",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const calculateAge = (dateOfBirth: string | undefined) => {
    if (!dateOfBirth) return null;
    const birthDate = new Date(dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "submitted":
        return "default";
      case "draft":
        return "secondary";
      case "accepted":
        return "success";
      case "rejected":
        return "destructive";
      default:
        return "outline";
    }
  };

  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <div className="flex items-center justify-center h-64">
            <LoadingSpinner />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <User className="h-5 w-5" />
              {user.full_name || "User Details"}
            </div>
            <div className="flex gap-2">
              {!editMode ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditMode(true)}
                >
                  <Edit2 className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              ) : (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditMode(false);
                      setEditedUser(user);
                    }}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSave}
                    disabled={saving}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {saving ? "Saving..." : "Save"}
                  </Button>
                </>
              )}
            </div>
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="profile" className="flex-1 overflow-hidden">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
            <TabsTrigger value="applications">Applications</TabsTrigger>
          </TabsList>

          <ScrollArea className="h-[calc(90vh-180px)] mt-4">
            <TabsContent value="profile" className="space-y-4 mt-0">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Personal Information</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Full Name</Label>
                    {editMode ? (
                      <Input
                        value={editedUser.full_name || ""}
                        onChange={(e) =>
                          setEditedUser({ ...editedUser, full_name: e.target.value })
                        }
                      />
                    ) : (
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span>{user.full_name || "N/A"}</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Email</Label>
                    {editMode ? (
                      <Input
                        type="email"
                        value={editedUser.email || ""}
                        onChange={(e) =>
                          setEditedUser({ ...editedUser, email: e.target.value })
                        }
                      />
                    ) : (
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span>{user.email || "N/A"}</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Phone</Label>
                    {editMode ? (
                      <div className="flex gap-2">
                        <Input
                          className="w-24"
                          value={editedUser.country_code || ""}
                          onChange={(e) =>
                            setEditedUser({ ...editedUser, country_code: e.target.value })
                          }
                          placeholder="+49"
                        />
                        <Input
                          value={editedUser.phone || ""}
                          onChange={(e) =>
                            setEditedUser({ ...editedUser, phone: e.target.value })
                          }
                        />
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span>
                          {user.country_code} {user.phone || "N/A"}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Date of Birth</Label>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>
                        {user.date_of_birth
                          ? `${new Date(user.date_of_birth).toLocaleDateString()} (${calculateAge(
                              user.date_of_birth
                            )} years)`
                          : "N/A"}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Nationality</Label>
                    {editMode ? (
                      <Input
                        value={editedUser.nationality || ""}
                        onChange={(e) =>
                          setEditedUser({ ...editedUser, nationality: e.target.value })
                        }
                      />
                    ) : (
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span>{user.nationality || "N/A"}</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Gender</Label>
                    {editMode ? (
                      <Input
                        value={editedUser.gender || ""}
                        onChange={(e) =>
                          setEditedUser({ ...editedUser, gender: e.target.value })
                        }
                      />
                    ) : (
                      <span>{user.gender || "N/A"}</span>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Roles</Label>
                    <div className="flex flex-wrap gap-1">
                      {user.user_roles?.map((ur, idx) => (
                        <Badge key={idx} variant="secondary">
                          {ur.role.replace("_", " ")}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Gamification</Label>
                    <div className="flex gap-4">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                        <span>Level {user.level || 1}</span>
                      </div>
                      <div>
                        <span className="font-semibold">{user.xp_points || 0}</span> XP
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Academic Information</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Education Level</Label>
                    {editMode ? (
                      <Input
                        value={editedUser.current_education_level || ""}
                        onChange={(e) =>
                          setEditedUser({
                            ...editedUser,
                            current_education_level: e.target.value,
                          })
                        }
                      />
                    ) : (
                      <div className="flex items-center gap-2">
                        <GraduationCap className="h-4 w-4 text-muted-foreground" />
                        <span>{user.current_education_level || "N/A"}</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Current Institution</Label>
                    {editMode ? (
                      <Input
                        value={editedUser.current_institution || ""}
                        onChange={(e) =>
                          setEditedUser({
                            ...editedUser,
                            current_institution: e.target.value,
                          })
                        }
                      />
                    ) : (
                      <span>{user.current_institution || "N/A"}</span>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Field of Study</Label>
                    {editMode ? (
                      <Input
                        value={editedUser.current_field_of_study || ""}
                        onChange={(e) =>
                          setEditedUser({
                            ...editedUser,
                            current_field_of_study: e.target.value,
                          })
                        }
                      />
                    ) : (
                      <span>{user.current_field_of_study || "N/A"}</span>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Current GPA</Label>
                    {editMode ? (
                      <Input
                        type="number"
                        step="0.01"
                        value={editedUser.current_gpa || ""}
                        onChange={(e) =>
                          setEditedUser({
                            ...editedUser,
                            current_gpa: parseFloat(e.target.value),
                          })
                        }
                      />
                    ) : (
                      <span>{user.current_gpa || "N/A"}</span>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Account Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Joined:</span>
                    <span>{new Date(user.created_at).toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Last Updated:</span>
                    <span>{new Date(user.updated_at).toLocaleString()}</span>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="activity" className="space-y-4 mt-0">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-primary rounded-full mt-2" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">Account Created</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(user.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    {user.updated_at !== user.created_at && (
                      <div className="flex items-start gap-3">
                        <div className="w-2 h-2 bg-secondary rounded-full mt-2" />
                        <div className="flex-1">
                          <p className="text-sm font-medium">Profile Updated</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(user.updated_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Program Matches</CardTitle>
                </CardHeader>
                <CardContent>
                  {matches.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No program matches yet</p>
                  ) : (
                    <div className="space-y-3">
                      {matches.map((match) => (
                        <div key={match.id} className="flex items-center justify-between">
                          <div className="flex-1">
                            <p className="text-sm font-medium">{match.program.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {match.program.institution.name}
                            </p>
                          </div>
                          <Badge variant="secondary">
                            {match.compatibility_score}% match
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="applications" className="space-y-4 mt-0">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center justify-between">
                    <span>Applications History</span>
                    <Badge variant="outline">{applications.length} total</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {applications.length === 0 ? (
                    <div className="text-center py-8">
                      <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">
                        No applications submitted yet
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {applications.map((app) => (
                        <div key={app.id} className="border rounded-lg p-4 space-y-2">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p className="font-medium">{app.program.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {app.program.institution.name}
                              </p>
                              <Badge variant="outline" className="mt-1">
                                {app.program.degree_level}
                              </Badge>
                            </div>
                            <Badge variant={getStatusColor(app.status) as any}>
                              {app.status}
                            </Badge>
                          </div>
                          <Separator />
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              <span>Created: {new Date(app.created_at).toLocaleDateString()}</span>
                            </div>
                            {app.submitted_at && (
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                <span>
                                  Submitted: {new Date(app.submitted_at).toLocaleDateString()}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
