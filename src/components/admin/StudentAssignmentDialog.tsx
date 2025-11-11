import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { UserPlus, Search } from "lucide-react";

interface StudentAssignmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  userName: string;
  userRoles: string[];
  onSuccess: () => void;
}

interface Student {
  id: string;
  full_name: string;
  email: string;
  assigned: boolean;
}

export const StudentAssignmentDialog = ({
  open,
  onOpenChange,
  userId,
  userName,
  userRoles,
  onSuccess,
}: StudentAssignmentDialogProps) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  // Check if user can have students assigned
  const canHaveAssignments = userRoles.some(role => 
    ['admin', 'company_sales', 'company_admissions', 'school_counselor'].includes(role)
  );

  useEffect(() => {
    if (open && canHaveAssignments) {
      fetchStudents();
    }
  }, [open, userId]);

  const fetchStudents = async () => {
    setIsLoading(true);
    try {
      const url = new URL(`https://zfiexgjcuojodmnsinsz.supabase.co/functions/v1/admin-secure-operations`);
      url.searchParams.set('operation', 'get_students_for_assignment');
      url.searchParams.set('user_id', userId);

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch students');
      }

      const data = await response.json();
      setStudents(data.students || []);
      setSelectedStudents(data.students?.filter((s: Student) => s.assigned).map((s: Student) => s.id) || []);
    } catch (error) {
      console.error('Error fetching students:', error);
      toast({
        title: "Error",
        description: "Failed to load students",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleStudent = (studentId: string) => {
    setSelectedStudents(prev =>
      prev.includes(studentId)
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const url = new URL(`https://zfiexgjcuojodmnsinsz.supabase.co/functions/v1/admin-secure-operations`);
      url.searchParams.set('operation', 'update_student_assignments');

      const response = await fetch(url.toString(), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          studentIds: selectedStudents,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update assignments');
      }

      toast({
        title: "Success",
        description: "Student assignments updated successfully",
      });

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating assignments:', error);
      toast({
        title: "Error",
        description: "Failed to update student assignments",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const filteredStudents = students.filter(student =>
    student.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!canHaveAssignments) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Assign Students
            </DialogTitle>
          </DialogHeader>
          <div className="py-6 text-center text-muted-foreground">
            This user role cannot have students assigned.
            <br />
            Only Sales, Admissions, and Counselor roles can manage students.
          </div>
          <DialogFooter>
            <Button onClick={() => onOpenChange(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Assign Students - {userName}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search students..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>

          {isLoading ? (
            <div className="py-8 text-center text-muted-foreground">
              Loading students...
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              No students found
            </div>
          ) : (
            <div className="max-h-[400px] space-y-3 overflow-y-auto rounded-md border p-4">
              {filteredStudents.map((student) => (
                <div key={student.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={student.id}
                    checked={selectedStudents.includes(student.id)}
                    onCheckedChange={() => handleToggleStudent(student.id)}
                  />
                  <Label
                    htmlFor={student.id}
                    className="flex-1 cursor-pointer text-sm font-normal"
                  >
                    <div>
                      <div className="font-medium">{student.full_name || 'Unnamed Student'}</div>
                      <div className="text-xs text-muted-foreground">{student.email}</div>
                    </div>
                  </Label>
                </div>
              ))}
            </div>
          )}

          <div className="text-sm text-muted-foreground">
            {selectedStudents.length} student(s) selected
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving || isLoading}>
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};