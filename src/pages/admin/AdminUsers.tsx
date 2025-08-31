import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, Users, Mail, Calendar, Shield, Eye, Lock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import LoadingSpinner from "@/components/LoadingSpinner";
import { getMaskedProfileData } from "@/lib/secure-profile-api";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface UserProfile {
  id: string;
  display_name: string;
  masked_email: string;
  masked_phone: string;
  education_level?: string;
  field_of_study?: string;
  nationality?: string;
  created_at: string;
  user_roles?: {
    role: string;
  }[];
}

export const AdminUsers = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      // First get all user IDs and roles
      const { data: profileData, error } = await supabase
        .from('profiles')
        .select(`
          id,
          created_at,
          nationality,
          user_roles (role)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Then get masked profile data for each user using our secure function
      const usersWithMaskedData = await Promise.all(
        (profileData || []).map(async (profile) => {
          try {
            const maskedData = await getMaskedProfileData(profile.id);
            const userData = maskedData?.[0];
            
            return {
              id: profile.id,
              display_name: userData?.display_name || 'Anonymous User',
              masked_email: userData?.masked_email || 'Hidden',
              masked_phone: userData?.masked_phone || 'Hidden',
              education_level: userData?.education_level,
              field_of_study: userData?.field_of_study,
              nationality: userData?.nationality || profile.nationality,
              created_at: profile.created_at,
              user_roles: profile.user_roles
            };
          } catch (err) {
            console.warn(`Failed to get masked data for user ${profile.id}:`, err);
            return {
              id: profile.id,
              display_name: 'Protected User',
              masked_email: 'Access Restricted',
              masked_phone: 'Access Restricted',
              education_level: undefined,
              field_of_study: undefined,
              nationality: undefined,
              created_at: profile.created_at,
              user_roles: profile.user_roles
            };
          }
        })
      );

      setUsers(usersWithMaskedData);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: "Error",
        description: "Failed to fetch users. Enhanced security may be limiting access.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(user =>
    user.display_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.masked_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.nationality?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getUserRoles = (user: UserProfile) => {
    return user.user_roles?.map(ur => ur.role) || ['student'];
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'destructive';
      case 'university_staff':
        return 'secondary';
      case 'school_counselor':
        return 'outline';
      default:
        return 'default';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">User Management</h1>
          <p className="text-muted-foreground">
            View and manage registered users
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          <span className="font-semibold">{users.length} Users</span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <Alert className="mb-6">
        <Lock className="h-4 w-4" />
        <AlertDescription>
          Enhanced Security: User data is now protected by multiple security layers. 
          Sensitive information is automatically masked based on access levels.
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredUsers.map((user) => (
          <Card key={user.id} className="hover:shadow-medium transition-shadow">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-sm font-semibold">
                  {user.display_name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                <div className="flex-1">
                  <div className="font-semibold flex items-center gap-2">
                    {user.display_name}
                    <Eye className="h-3 w-3 text-muted-foreground" />
                  </div>
                  <div className="text-sm text-muted-foreground font-normal">
                    {user.masked_email}
                  </div>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>Joined {new Date(user.created_at).toLocaleDateString()}</span>
                </div>

                {user.nationality && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-medium">Nationality:</span>
                    <Badge variant="outline">{user.nationality}</Badge>
                  </div>
                )}

                {user.education_level && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-medium">Education:</span>
                    <Badge variant="secondary">{user.education_level}</Badge>
                  </div>
                )}

                {user.field_of_study && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-medium">Field:</span>
                    <Badge variant="outline">{user.field_of_study}</Badge>
                  </div>
                )}

                <div className="flex items-center gap-2 text-sm">
                  <Shield className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Roles:</span>
                  <div className="flex flex-wrap gap-1">
                    {getUserRoles(user).map((role, index) => (
                      <Badge key={index} variant={getRoleColor(role)} className="text-xs">
                        {role.replace('_', ' ')}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2 mt-4">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="flex items-center gap-1"
                    onClick={() => {
                      if (user.masked_email && !user.masked_email.includes('***')) {
                        window.location.href = `mailto:${user.masked_email}`;
                      } else {
                        toast({
                          title: "Contact Restricted",
                          description: "Email is masked for security. Use admin functions for direct contact.",
                          variant: "destructive"
                        });
                      }
                    }}
                    disabled={user.masked_email.includes('***') || user.masked_email === 'Hidden'}
                  >
                    <Mail className="h-3 w-3" />
                    Contact
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredUsers.length === 0 && (
        <div className="text-center py-12">
          <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No users found</h3>
          <p className="text-muted-foreground">
            {searchTerm ? 'Try adjusting your search criteria.' : 'No users have registered yet.'}
          </p>
        </div>
      )}
    </div>
  );
};