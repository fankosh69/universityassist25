import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Plus, Edit2, Trash2, Eye, EyeOff, Database } from "lucide-react";

interface FieldOfStudy {
  id: string;
  name: string;
  name_de?: string;
  name_ar?: string;
  slug: string;
  parent_id?: string;
  level: number;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export default function AdminFieldsOfStudy() {
  const [fields, setFields] = useState<FieldOfStudy[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingField, setEditingField] = useState<FieldOfStudy | null>(null);
  const [migrationRunning, setMigrationRunning] = useState(false);
  const [migrationResults, setMigrationResults] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: "",
    name_de: "",
    name_ar: "",
    slug: "",
    parent_id: "",
    level: 1,
    sort_order: 0,
    is_active: true,
  });

  useEffect(() => {
    loadFields();
  }, []);

  const loadFields = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("fields_of_study")
        .select("*")
        .order("level")
        .order("sort_order");

      if (error) throw error;
      setFields(data || []);
    } catch (error) {
      console.error("Error loading fields:", error);
      toast.error("Failed to load fields of study");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingField(null);
    setFormData({
      name: "",
      name_de: "",
      name_ar: "",
      slug: "",
      parent_id: "",
      level: 1,
      sort_order: 0,
      is_active: true,
    });
    setDialogOpen(true);
  };

  const handleEdit = (field: FieldOfStudy) => {
    setEditingField(field);
    setFormData({
      name: field.name,
      name_de: field.name_de || "",
      name_ar: field.name_ar || "",
      slug: field.slug,
      parent_id: field.parent_id || "",
      level: field.level,
      sort_order: field.sort_order,
      is_active: field.is_active,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      // Auto-generate slug from name if not provided
      const slug = formData.slug || formData.name.toLowerCase().replace(/\s+/g, "-");

      // Convert empty parent_id to null for proper UUID handling
      const dataToSave = {
        ...formData,
        slug,
        parent_id: formData.parent_id || null,
      };

      if (editingField) {
        const { error } = await supabase
          .from("fields_of_study")
          .update(dataToSave)
          .eq("id", editingField.id);

        if (error) throw error;
        toast.success("Field updated successfully");
      } else {
        const { error } = await supabase
          .from("fields_of_study")
          .insert(dataToSave);

        if (error) throw error;
        toast.success("Field created successfully");
      }

      setDialogOpen(false);
      loadFields();
    } catch (error: any) {
      console.error("Error saving field:", error);
      toast.error(error.message || "Failed to save field");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this field? All child fields will also be deleted.")) {
      return;
    }

    try {
      const { error } = await supabase
        .from("fields_of_study")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast.success("Field deleted successfully");
      loadFields();
    } catch (error: any) {
      console.error("Error deleting field:", error);
      toast.error(error.message || "Failed to delete field");
    }
  };

  const toggleActive = async (field: FieldOfStudy) => {
    try {
      const { error } = await supabase
        .from("fields_of_study")
        .update({ is_active: !field.is_active })
        .eq("id", field.id);

      if (error) throw error;
      toast.success(`Field ${field.is_active ? "deactivated" : "activated"}`);
      loadFields();
    } catch (error) {
      console.error("Error toggling field:", error);
      toast.error("Failed to update field status");
    }
  };

  const runMigration = async (dryRun: boolean = false) => {
    setMigrationRunning(true);
    setMigrationResults(null);

    try {
      const { data, error } = await supabase.functions.invoke('migrate-program-fields', {
        body: { dryRun, onlyHighConfidence: false },
      });

      if (error) throw error;

      setMigrationResults(data);
      
      if (!dryRun && data.success) {
        toast.success(`Migration complete! ${data.summary.updated} programs updated.`);
        loadFields();
      } else if (dryRun && data.success) {
        toast.info(`Dry run complete. ${data.summary.matched} programs would be updated.`);
      }
    } catch (error: any) {
      console.error('Migration error:', error);
      toast.error(`Migration failed: ${error.message}`);
    } finally {
      setMigrationRunning(false);
    }
  };

  const getParentName = (parentId?: string) => {
    if (!parentId) return "-";
    const parent = fields.find((f) => f.id === parentId);
    return parent?.name || "-";
  };

  const levelOneFields = fields.filter((f) => f.level === 1);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Fields of Study</h1>
            <p className="text-muted-foreground">
              Manage hierarchical fields of study taxonomy
            </p>
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={() => runMigration(true)} 
              variant="outline"
              disabled={migrationRunning}
            >
              <Database className="h-4 w-4 mr-2" />
              {migrationRunning ? 'Running...' : 'Preview Migration'}
            </Button>
            <Button 
              onClick={() => runMigration(false)} 
              disabled={migrationRunning}
              variant="secondary"
            >
              <Database className="h-4 w-4 mr-2" />
              {migrationRunning ? 'Running...' : 'Run Migration'}
            </Button>
            <Button onClick={handleCreate}>
              <Plus className="h-4 w-4 mr-2" />
              Add Field
            </Button>
          </div>
        </div>

        {migrationResults && (
          <Card className="p-6">
            <h3 className="font-semibold text-lg mb-4">Migration Results</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div>
                <p className="text-sm text-muted-foreground">Total Programs</p>
                <p className="text-3xl font-bold">{migrationResults.summary.totalPrograms}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">High Confidence</p>
                <p className="text-3xl font-bold text-green-600">{migrationResults.summary.highConfidence}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Medium Confidence</p>
                <p className="text-3xl font-bold text-yellow-600">{migrationResults.summary.mediumConfidence}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Low/No Match</p>
                <p className="text-3xl font-bold text-red-600">
                  {migrationResults.summary.lowConfidence + migrationResults.summary.noMatch}
                </p>
              </div>
            </div>
            {migrationResults.summary.updated > 0 && (
              <p className="text-sm text-green-600 font-medium">
                ✓ {migrationResults.summary.updated} programs successfully updated
              </p>
            )}
            {migrationResults.summary.dryRun && (
              <p className="text-sm text-muted-foreground italic mt-2">
                This was a dry run. No changes were made to the database.
              </p>
            )}
          </Card>
        )}

        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-16 bg-muted animate-pulse rounded-md" />
            ))}
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Level</TableHead>
                  <TableHead>Parent</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Sort Order</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fields.map((field) => (
                  <TableRow key={field.id}>
                    <TableCell className="font-medium">
                      <span className={field.level > 1 ? `ml-${(field.level - 1) * 4}` : ""}>
                        {field.name}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">Level {field.level}</Badge>
                    </TableCell>
                    <TableCell>{getParentName(field.parent_id)}</TableCell>
                    <TableCell className="font-mono text-sm text-muted-foreground">
                      {field.slug}
                    </TableCell>
                    <TableCell>{field.sort_order}</TableCell>
                    <TableCell>
                      <Badge variant={field.is_active ? "default" : "secondary"}>
                        {field.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleActive(field)}
                      >
                        {field.is_active ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(field)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(field.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingField ? "Edit Field" : "Create Field"}
              </DialogTitle>
              <DialogDescription>
                {editingField
                  ? "Update the field details below"
                  : "Add a new field of study to the taxonomy"}
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Name (English) *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="e.g., Mechanical Engineering"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="name_de">Name (German)</Label>
                  <Input
                    id="name_de"
                    value={formData.name_de}
                    onChange={(e) =>
                      setFormData({ ...formData, name_de: e.target.value })
                    }
                    placeholder="e.g., Maschinenbau"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="name_ar">Name (Arabic)</Label>
                  <Input
                    id="name_ar"
                    value={formData.name_ar}
                    onChange={(e) =>
                      setFormData({ ...formData, name_ar: e.target.value })
                    }
                    placeholder="e.g., هندسة ميكانيكية"
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="slug">Slug</Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) =>
                    setFormData({ ...formData, slug: e.target.value })
                  }
                  placeholder="Auto-generated from name if empty"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="level">Level *</Label>
                  <Select
                    value={formData.level.toString()}
                    onValueChange={(value) =>
                      setFormData({ ...formData, level: parseInt(value) })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Level 1 (Main Category)</SelectItem>
                      <SelectItem value="2">Level 2 (Subcategory)</SelectItem>
                      <SelectItem value="3">Level 3 (Specialization)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="sort_order">Sort Order</Label>
                  <Input
                    id="sort_order"
                    type="number"
                    value={formData.sort_order}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        sort_order: parseInt(e.target.value) || 0,
                      })
                    }
                  />
                </div>
              </div>

              {formData.level > 1 && (
                <div className="grid gap-2">
                  <Label htmlFor="parent_id">Parent Field</Label>
                  <Select
                    value={formData.parent_id}
                    onValueChange={(value) =>
                      setFormData({ ...formData, parent_id: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select parent field" />
                    </SelectTrigger>
                    <SelectContent>
                      {fields
                        .filter((f) => f.level < formData.level)
                        .map((field) => (
                          <SelectItem key={field.id} value={field.id}>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">
                                L{field.level}
                              </Badge>
                              <span className={field.level === 2 ? "ml-4" : ""}>
                                {field.name}
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave}>
                {editingField ? "Update" : "Create"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
