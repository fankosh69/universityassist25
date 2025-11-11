import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, Users, Mail, Calendar, Shield, Edit, Download, Filter, Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import LoadingSpinner from "@/components/LoadingSpinner";
import { RoleManagementDialog } from "@/components/admin/RoleManagementDialog";
import { UserDetailsModal } from "@/components/admin/UserDetailsModal";
import { StudentAssignmentDialog } from "@/components/admin/StudentAssignmentDialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";

interface UserProfile {
  id: string;
  full_name?: string;
  email?: string;
  phone?: string;
  country_code?: string;
  date_of_birth?: string;
  created_at: string;
  nationality?: string;
  current_education_level?: string;
  user_roles?: {
    role: string;
  }[];
}

const AVAILABLE_ROLES = [
  { value: 'student', label: 'Student' },
  { value: 'admin', label: 'Admin' },
  { value: 'school_counselor', label: 'School Counselor' },
  { value: 'university_staff', label: 'University Staff' },
  { value: 'company_sales', label: 'Company Sales' },
  { value: 'company_admissions', label: 'Company Admissions' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'parent', label: 'Parent' },
];

export const AdminUsers = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [assignmentDialogOpen, setAssignmentDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const url = new URL(`https://zfiexgjcuojodmnsinsz.supabase.co/functions/v1/admin-secure-operations`);
      url.searchParams.set('operation', 'get_users');
      
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }

      const result = await response.json();
      setUsers(result.users || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: "Error",
        description: "Failed to fetch users securely",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.nationality?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = selectedRoles.length === 0 || 
      getUserRoles(user).some(role => selectedRoles.includes(role));
    
    return matchesSearch && matchesRole;
  });

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

  const toggleRoleFilter = (role: string) => {
    setSelectedRoles(prev =>
      prev.includes(role)
        ? prev.filter(r => r !== role)
        : [...prev, role]
    );
  };

  const clearRoleFilters = () => {
    setSelectedRoles([]);
  };

  const exportToCSV = () => {
    const headers = ['Full Name', 'Email', 'Phone', 'Age', 'Nationality', 'Education Level', 'Roles', 'Joined Date'];
    const csvData = filteredUsers.map(user => [
      user.full_name || '',
      user.email || '',
      user.phone ? `${user.country_code} ${user.phone}` : '',
      calculateAge(user.date_of_birth) || '',
      user.nationality || '',
      user.current_education_level || '',
      getUserRoles(user).join('; '),
      new Date(user.created_at).toLocaleDateString(),
    ]);

    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `users_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Export Complete",
      description: `Exported ${filteredUsers.length} users to CSV`,
    });
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

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Filter className="h-4 w-4" />
                Roles
                {selectedRoles.length > 0 && (
                  <Badge variant="secondary" className="ml-1">
                    {selectedRoles.length}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Filter by Role</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {AVAILABLE_ROLES.map((role) => (
                <DropdownMenuCheckboxItem
                  key={role.value}
                  checked={selectedRoles.includes(role.value)}
                  onCheckedChange={() => toggleRoleFilter(role.value)}
                >
                  {role.label}
                </DropdownMenuCheckboxItem>
              ))}
              {selectedRoles.length > 0 && (
                <>
                  <DropdownMenuSeparator />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full"
                    onClick={clearRoleFilters}
                  >
                    Clear Filters
                  </Button>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            variant="outline"
            className="gap-2"
            onClick={exportToCSV}
            disabled={filteredUsers.length === 0}
          >
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredUsers.map((user) => (
          <Card key={user.id} className="hover:shadow-medium transition-shadow">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-sm font-semibold">
                  {user.full_name?.charAt(0)?.toUpperCase() || user.email?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                <div className="flex-1">
                  <div className="font-semibold">
                    {user.full_name || 'Unnamed User'}
                  </div>
                  <div className="text-sm text-muted-foreground font-normal">
                    {user.email || 'No email'}
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

                {user.date_of_birth && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-medium">Age:</span>
                    <Badge variant="outline">{calculateAge(user.date_of_birth)} years</Badge>
                  </div>
                )}

                {user.phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-medium">Phone:</span>
                    <span className="text-muted-foreground">
                      {user.country_code} {user.phone}
                    </span>
                  </div>
                )}

                {user.nationality && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-medium">Nationality:</span>
                    <Badge variant="outline">{user.nationality}</Badge>
                  </div>
                )}

                {user.current_education_level && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-medium">Education:</span>
                    <Badge variant="secondary">{user.current_education_level}</Badge>
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
                    variant="default"
                    className="flex items-center gap-1"
                    onClick={() => {
                      setSelectedUser(user);
                      setDetailsDialogOpen(true);
                    }}
                  >
                    <Eye className="h-3 w-3" />
                    View
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="flex items-center gap-1"
                    onClick={() => {
                      if (user.email) {
                        window.location.href = `mailto:${user.email}`;
                      }
                    }}
                  >
                    <Mail className="h-3 w-3" />
                    Contact
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex items-center gap-1"
                    onClick={() => {
                      setSelectedUser(user);
                      setRoleDialogOpen(true);
                    }}
                  >
                    <Edit className="h-3 w-3" />
                    Roles
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex items-center gap-1"
                    onClick={() => {
                      setSelectedUser(user);
                      setAssignmentDialogOpen(true);
                    }}
                  >
                    <Users className="h-3 w-3" />
                    Assign
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

      {selectedUser && (
        <>
          <RoleManagementDialog
            open={roleDialogOpen}
            onOpenChange={setRoleDialogOpen}
            userId={selectedUser.id}
            userName={selectedUser.full_name || selectedUser.email || 'User'}
            currentRoles={getUserRoles(selectedUser)}
            onSuccess={fetchUsers}
          />
          <UserDetailsModal
            open={detailsDialogOpen}
            onOpenChange={setDetailsDialogOpen}
            userId={selectedUser.id}
            onUserUpdated={fetchUsers}
          />
          <StudentAssignmentDialog
            open={assignmentDialogOpen}
            onOpenChange={setAssignmentDialogOpen}
            userId={selectedUser.id}
            userName={selectedUser.full_name || selectedUser.email || 'User'}
            userRoles={getUserRoles(selectedUser)}
            onSuccess={fetchUsers}
          />
        </>
      )}
    </div>
  );
};