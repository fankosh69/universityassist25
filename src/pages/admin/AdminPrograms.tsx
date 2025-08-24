import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Edit, Trash2, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import LoadingSpinner from "@/components/LoadingSpinner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

interface Program {
  id: string;
  name: string;
  description?: string;
  degree_type: string;
  degree_level: "bachelor" | "master";
  field_of_study: string;
  duration_semesters: number;
  ects_credits?: number;
  tuition_fees: number;
  language_of_instruction: string[];
  uni_assist_required: boolean;
  university_id: string;
  published: boolean;
  universities?: {
    name: string;
    city: string;
  };
}

interface University {
  id: string;
  name: string;
  city: string;
}

export const AdminPrograms = () => {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [universities, setUniversities] = useState<University[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingProgram, setEditingProgram] = useState<Program | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();

  const [formData, setFormData] = useState<{
    name: string;
    description: string;
    degree_type: string;
    degree_level: "bachelor" | "master";
    field_of_study: string;
    duration_semesters: number;
    ects_credits: number;
    tuition_fees: number;
    language_of_instruction: string[];
    uni_assist_required: boolean;
    university_id: string;
    published: boolean;
  }>({
    name: "",
    description: "",
    degree_type: "",
    degree_level: "bachelor",
    field_of_study: "",
    duration_semesters: 6,
    ects_credits: 180,
    tuition_fees: 0,
    language_of_instruction: ["de"],
    uni_assist_required: false,
    university_id: "",
    published: true
  });

  useEffect(() => {
    fetchPrograms();
    fetchUniversities();
  }, []);

  const fetchPrograms = async () => {
    try {
      const { data, error } = await supabase
        .from('programs')
        .select(`
          *,
          universities (name, city)
        `)
        .order('name');

      if (error) throw error;
      setPrograms(data || []);
    } catch (error) {
      console.error('Error fetching programs:', error);
      toast({
        title: "Error",
        description: "Failed to fetch programs",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchUniversities = async () => {
    try {
      const { data, error } = await supabase
        .from('universities')
        .select('id, name, city')
        .order('name');

      if (error) throw error;
      setUniversities(data || []);
    } catch (error) {
      console.error('Error fetching universities:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingProgram) {
        const { error } = await supabase
          .from('programs')
          .update(formData)
          .eq('id', editingProgram.id);

        if (error) throw error;
        toast({
          title: "Success",
          description: "Program updated successfully",
        });
      } else {
        const { error } = await supabase
          .from('programs')
          .insert(formData);

        if (error) throw error;
        toast({
          title: "Success",
          description: "Program created successfully",
        });
      }

      resetForm();
      fetchPrograms();
    } catch (error) {
      console.error('Error saving program:', error);
      toast({
        title: "Error",
        description: "Failed to save program",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this program?')) return;

    try {
      const { error } = await supabase
        .from('programs')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Program deleted successfully",
      });
      fetchPrograms();
    } catch (error) {
      console.error('Error deleting program:', error);
      toast({
        title: "Error",
        description: "Failed to delete program",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (program: Program) => {
    setEditingProgram(program);
    setFormData({
      name: program.name,
      description: program.description || "",
      degree_type: program.degree_type,
      degree_level: program.degree_level,
      field_of_study: program.field_of_study,
      duration_semesters: program.duration_semesters,
      ects_credits: program.ects_credits || 180,
      tuition_fees: program.tuition_fees,
      language_of_instruction: program.language_of_instruction,
      uni_assist_required: program.uni_assist_required,
      university_id: program.university_id,
      published: program.published
    });
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setEditingProgram(null);
    setFormData({
      name: "",
      description: "",
      degree_type: "",
      degree_level: "bachelor",
      field_of_study: "",
      duration_semesters: 6,
      ects_credits: 180,
      tuition_fees: 0,
      language_of_instruction: ["de"],
      uni_assist_required: false,
      university_id: "",
      published: true
    });
    setIsDialogOpen(false);
  };

  const filteredPrograms = programs.filter(program =>
    program.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    program.field_of_study.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
          <h1 className="text-3xl font-bold">Programs Management</h1>
          <p className="text-muted-foreground">
            Manage university programs and their details
          </p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Program
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search programs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPrograms.map((program) => (
          <Card key={program.id} className="hover:shadow-medium transition-shadow">
            <CardHeader>
              <CardTitle className="text-lg">{program.name}</CardTitle>
              <p className="text-sm text-muted-foreground">
                {program.universities?.name} - {program.universities?.city}
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div><strong>Degree:</strong> {program.degree_level} in {program.field_of_study}</div>
                <div><strong>Duration:</strong> {program.duration_semesters} semesters</div>
                <div><strong>ECTS:</strong> {program.ects_credits}</div>
                <div><strong>Tuition:</strong> €{program.tuition_fees}/year</div>
                <div><strong>Language:</strong> {program.language_of_instruction.join(', ')}</div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 rounded text-xs ${program.published ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                    {program.published ? 'Published' : 'Draft'}
                  </span>
                  {program.uni_assist_required && (
                    <span className="px-2 py-1 rounded text-xs bg-blue-100 text-blue-800">
                      Uni-Assist
                    </span>
                  )}
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <Button size="sm" variant="outline" onClick={() => handleEdit(program)}>
                  <Edit className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleDelete(program.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingProgram ? 'Edit Program' : 'Add New Program'}
            </DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Program Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="university">University</Label>
                <Select
                  value={formData.university_id}
                  onValueChange={(value) => setFormData({ ...formData, university_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select university" />
                  </SelectTrigger>
                  <SelectContent>
                    {universities.map((uni) => (
                      <SelectItem key={uni.id} value={uni.id}>
                        {uni.name} - {uni.city}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="degree_level">Degree Level</Label>
                <Select
                  value={formData.degree_level}
                  onValueChange={(value: "bachelor" | "master") => setFormData({ ...formData, degree_level: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bachelor">Bachelor</SelectItem>
                    <SelectItem value="master">Master</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="field_of_study">Field of Study</Label>
                <Input
                  id="field_of_study"
                  value={formData.field_of_study}
                  onChange={(e) => setFormData({ ...formData, field_of_study: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="duration_semesters">Duration (Semesters)</Label>
                <Input
                  id="duration_semesters"
                  type="number"
                  value={formData.duration_semesters}
                  onChange={(e) => setFormData({ ...formData, duration_semesters: parseInt(e.target.value) })}
                  required
                />
              </div>

              <div>
                <Label htmlFor="ects_credits">ECTS Credits</Label>
                <Input
                  id="ects_credits"
                  type="number"
                  value={formData.ects_credits}
                  onChange={(e) => setFormData({ ...formData, ects_credits: parseInt(e.target.value) })}
                />
              </div>

              <div>
                <Label htmlFor="tuition_fees">Tuition Fees (€/year)</Label>
                <Input
                  id="tuition_fees"
                  type="number"
                  value={formData.tuition_fees}
                  onChange={(e) => setFormData({ ...formData, tuition_fees: parseInt(e.target.value) })}
                />
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="uni_assist_required"
                  checked={formData.uni_assist_required}
                  onCheckedChange={(checked) => setFormData({ ...formData, uni_assist_required: !!checked })}
                />
                <Label htmlFor="uni_assist_required">Uni-Assist Required</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="published"
                  checked={formData.published}
                  onCheckedChange={(checked) => setFormData({ ...formData, published: !!checked })}
                />
                <Label htmlFor="published">Published</Label>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={resetForm}>
                Cancel
              </Button>
              <Button type="submit">
                {editingProgram ? 'Update' : 'Create'} Program
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};