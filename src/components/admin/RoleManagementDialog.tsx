import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Shield } from "lucide-react";

interface RoleManagementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  userName: string;
  currentRoles: string[];
  onSuccess: () => void;
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

export const RoleManagementDialog = ({
  open,
  onOpenChange,
  userId,
  userName,
  currentRoles,
  onSuccess,
}: RoleManagementDialogProps) => {
  const [selectedRoles, setSelectedRoles] = useState<string[]>(currentRoles);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleRoleToggle = (role: string) => {
    setSelectedRoles(prev =>
      prev.includes(role)
        ? prev.filter(r => r !== role)
        : [...prev, role]
    );
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const url = new URL(`https://zfiexgjcuojodmnsinsz.supabase.co/functions/v1/admin-secure-operations`);
      url.searchParams.set('operation', 'update_user_roles');

      const response = await fetch(url.toString(), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          roles: selectedRoles,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update roles');
      }

      toast({
        title: "Success",
        description: "User roles updated successfully",
      });

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating roles:', error);
      toast({
        title: "Error",
        description: "Failed to update user roles",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Manage Roles - {userName}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <p className="text-sm text-muted-foreground">
            Select the roles to assign to this user:
          </p>
          <div className="space-y-3">
            {AVAILABLE_ROLES.map((role) => (
              <div key={role.value} className="flex items-center space-x-2">
                <Checkbox
                  id={role.value}
                  checked={selectedRoles.includes(role.value)}
                  onCheckedChange={() => handleRoleToggle(role.value)}
                />
                <Label
                  htmlFor={role.value}
                  className="text-sm font-normal cursor-pointer"
                >
                  {role.label}
                </Label>
              </div>
            ))}
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
