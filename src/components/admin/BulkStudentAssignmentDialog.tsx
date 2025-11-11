import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Upload, Users, CheckSquare } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import LoadingSpinner from "@/components/LoadingSpinner";

interface BulkStudentAssignmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

interface User {
  id: string;
  full_name: string;
  email: string;
  roles: string[];
}

interface Student {
  id: string;
  full_name: string;
  email: string;
}

export const BulkStudentAssignmentDialog = ({ open, onOpenChange, onSuccess }: BulkStudentAssignmentDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvMode, setCsvMode] = useState<'users' | 'students'>('students');
  const { toast } = useToast();

  const fetchData = async () => {
    setLoading(true);
    try {
      const session = await supabase.auth.getSession();
      const url = new URL(`https://zfiexgjcuojodmnsinsz.supabase.co/functions/v1/admin-secure-operations`);
      url.searchParams.set('operation', 'get_users');
      
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.data.session?.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) throw new Error('Failed to fetch data');

      const result = await response.json();
      const allUsers = result.users || [];
      
      // Separate assignable users from students
      const assignableUsers = allUsers.filter((u: any) => 
        u.user_roles?.some((r: any) => 
          ['admin', 'company_sales', 'company_admissions', 'school_counselor'].includes(r.role)
        )
      );
      
      const studentUsers = allUsers.filter((u: any) => 
        u.user_roles?.some((r: any) => r.role === 'student')
      );

      setUsers(assignableUsers.map((u: any) => ({
        id: u.id,
        full_name: u.full_name || u.email || 'Unknown',
        email: u.email || '',
        roles: u.user_roles?.map((r: any) => r.role) || []
      })));

      setStudents(studentUsers.map((u: any) => ({
        id: u.id,
        full_name: u.full_name || u.email || 'Unknown',
        email: u.email || ''
      })));
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to load users and students",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCSVUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setCsvFile(file);
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split('\n').filter(line => line.trim());
      
      // Skip header row
      const dataLines = lines.slice(1);
      
      const ids = new Set<string>();
      dataLines.forEach(line => {
        const columns = line.split(',').map(col => col.trim().replace(/^["']|["']$/g, ''));
        const id = columns[0]; // Assuming first column is ID
        if (id && id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
          ids.add(id);
        }
      });

      if (csvMode === 'users') {
        setSelectedUsers(ids);
      } else {
        setSelectedStudents(ids);
      }

      toast({
        title: "CSV Loaded",
        description: `Selected ${ids.size} ${csvMode} from CSV`,
      });
    };

    reader.readAsText(file);
  };

  const handleBulkAssign = async () => {
    if (selectedUsers.size === 0 || selectedStudents.size === 0) {
      toast({
        title: "Selection Required",
        description: "Please select at least one user and one student",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const session = await supabase.auth.getSession();
      const response = await fetch(
        'https://zfiexgjcuojodmnsinsz.supabase.co/functions/v1/admin-secure-operations',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.data.session?.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            operation: 'bulk_assign_students',
            userIds: Array.from(selectedUsers),
            studentIds: Array.from(selectedStudents)
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to assign students');
      }

      toast({
        title: "Success",
        description: `Assigned ${selectedStudents.size} students to ${selectedUsers.size} users`,
      });

      onOpenChange(false);
      onSuccess?.();
      
      // Reset state
      setSelectedUsers(new Set());
      setSelectedStudents(new Set());
      setCsvFile(null);
    } catch (error: any) {
      console.error('Error assigning students:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to assign students",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (isOpen && users.length === 0) {
        fetchData();
      }
      onOpenChange(isOpen);
    }}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Bulk Student Assignment
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center py-8">
            <LoadingSpinner />
          </div>
        ) : (
          <Tabs defaultValue="manual" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="manual">
                <CheckSquare className="h-4 w-4 mr-2" />
                Multi-Select
              </TabsTrigger>
              <TabsTrigger value="csv">
                <Upload className="h-4 w-4 mr-2" />
                CSV Upload
              </TabsTrigger>
            </TabsList>

            <TabsContent value="manual" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <Label className="text-base font-semibold">Select Users (Assignees)</Label>
                  <div className="text-sm text-muted-foreground">
                    {selectedUsers.size} selected
                  </div>
                  <ScrollArea className="h-[300px] border rounded-md p-4">
                    {users.map((user) => (
                      <div key={user.id} className="flex items-center space-x-2 mb-3">
                        <Checkbox
                          id={`user-${user.id}`}
                          checked={selectedUsers.has(user.id)}
                          onCheckedChange={(checked) => {
                            const newSet = new Set(selectedUsers);
                            if (checked) {
                              newSet.add(user.id);
                            } else {
                              newSet.delete(user.id);
                            }
                            setSelectedUsers(newSet);
                          }}
                        />
                        <label
                          htmlFor={`user-${user.id}`}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                        >
                          {user.full_name}
                          <div className="text-xs text-muted-foreground">{user.email}</div>
                        </label>
                      </div>
                    ))}
                  </ScrollArea>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedUsers(new Set(users.map(u => u.id)))}
                  >
                    Select All
                  </Button>
                </div>

                <div className="space-y-3">
                  <Label className="text-base font-semibold">Select Students</Label>
                  <div className="text-sm text-muted-foreground">
                    {selectedStudents.size} selected
                  </div>
                  <ScrollArea className="h-[300px] border rounded-md p-4">
                    {students.map((student) => (
                      <div key={student.id} className="flex items-center space-x-2 mb-3">
                        <Checkbox
                          id={`student-${student.id}`}
                          checked={selectedStudents.has(student.id)}
                          onCheckedChange={(checked) => {
                            const newSet = new Set(selectedStudents);
                            if (checked) {
                              newSet.add(student.id);
                            } else {
                              newSet.delete(student.id);
                            }
                            setSelectedStudents(newSet);
                          }}
                        />
                        <label
                          htmlFor={`student-${student.id}`}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                        >
                          {student.full_name}
                          <div className="text-xs text-muted-foreground">{student.email}</div>
                        </label>
                      </div>
                    ))}
                  </ScrollArea>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedStudents(new Set(students.map(s => s.id)))}
                  >
                    Select All
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="csv" className="space-y-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>CSV Format</Label>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p>Upload a CSV file with the following format:</p>
                    <code className="block bg-muted p-2 rounded text-xs">
                      user_id,student_id<br />
                      uuid-here,uuid-here<br />
                      uuid-here,uuid-here
                    </code>
                    <p className="mt-2">Or separate CSVs for users and students:</p>
                    <code className="block bg-muted p-2 rounded text-xs">
                      id,name,email<br />
                      uuid-here,John Doe,john@example.com
                    </code>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Upload Mode</Label>
                  <div className="flex gap-2">
                    <Button
                      variant={csvMode === 'students' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setCsvMode('students')}
                    >
                      Students
                    </Button>
                    <Button
                      variant={csvMode === 'users' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setCsvMode('users')}
                    >
                      Users
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="csv-upload">Upload CSV</Label>
                  <Input
                    id="csv-upload"
                    type="file"
                    accept=".csv"
                    onChange={handleCSVUpload}
                  />
                  {csvFile && (
                    <p className="text-sm text-muted-foreground">
                      Loaded: {csvFile.name}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4">
                  <div className="space-y-2">
                    <Label>Selected Users</Label>
                    <div className="text-2xl font-bold">{selectedUsers.size}</div>
                  </div>
                  <div className="space-y-2">
                    <Label>Selected Students</Label>
                    <div className="text-2xl font-bold">{selectedStudents.size}</div>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleBulkAssign}
            disabled={loading || selectedUsers.size === 0 || selectedStudents.size === 0}
          >
            {loading ? "Assigning..." : `Assign ${selectedStudents.size} Students`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};