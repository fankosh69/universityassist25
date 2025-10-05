import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2, Globe } from "lucide-react";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

interface RequirementFormData {
  id?: string;
  country_code: string;
  country_name: string;
  education_system: "abitur" | "a_levels" | "ib" | "us_high_school" | "indian_higher_secondary" | "chinese_gaokao" | "french_baccalaureat" | "other";
  degree_level: "bachelor" | "master";
  direct_admission_criteria: any;
  studienkolleg_criteria: any;
  required_documents: string[];
  min_german_level: string;
  accepts_english: boolean;
  min_english_level: string;
  aps_certificate_required: boolean;
  entrance_exam_required: boolean;
  additional_notes: string;
  source_url: string;
}

export default function AdminAdmissionRequirements() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRequirement, setEditingRequirement] = useState<RequirementFormData | null>(null);
  const [formData, setFormData] = useState<RequirementFormData>({
    country_code: "",
    country_name: "",
    education_system: "other",
    degree_level: "bachelor",
    direct_admission_criteria: {},
    studienkolleg_criteria: {},
    required_documents: [],
    min_german_level: "B2",
    accepts_english: false,
    min_english_level: "",
    aps_certificate_required: false,
    entrance_exam_required: false,
    additional_notes: "",
    source_url: "",
  });

  const { data: requirements, isLoading } = useQuery({
    queryKey: ["admin-admission-requirements"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("admission_requirements_by_country")
        .select("*")
        .order("country_name");
      
      if (error) throw error;
      return data;
    },
  });

  const createRequirement = useMutation({
    mutationFn: async (data: RequirementFormData) => {
      const { id, ...insertData } = data;
      const { error } = await supabase
        .from("admission_requirements_by_country")
        .insert([insertData]);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-admission-requirements"] });
      toast({
        title: "Success",
        description: "Admission requirement created successfully",
      });
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateRequirement = useMutation({
    mutationFn: async (data: RequirementFormData) => {
      const { id, ...updateData } = data;
      const { error } = await supabase
        .from("admission_requirements_by_country")
        .update(updateData)
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-admission-requirements"] });
      toast({
        title: "Success",
        description: "Admission requirement updated successfully",
      });
      setIsDialogOpen(false);
      setEditingRequirement(null);
      resetForm();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteRequirement = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("admission_requirements_by_country")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-admission-requirements"] });
      toast({
        title: "Success",
        description: "Admission requirement deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      country_code: "",
      country_name: "",
      education_system: "other",
      degree_level: "bachelor",
      direct_admission_criteria: {},
      studienkolleg_criteria: {},
      required_documents: [],
      min_german_level: "B2",
      accepts_english: false,
      min_english_level: "",
      aps_certificate_required: false,
      entrance_exam_required: false,
      additional_notes: "",
      source_url: "",
    });
  };

  const handleEdit = (requirement: any) => {
    setEditingRequirement(requirement);
    setFormData(requirement);
    setIsDialogOpen(true);
  };

  const handleSubmit = () => {
    if (editingRequirement) {
      updateRequirement.mutate(formData);
    } else {
      createRequirement.mutate(formData);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Admission Requirements</h1>
          <p className="text-muted-foreground">
            Manage country-specific admission requirements based on DAAD and Uni-Assist guidelines
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { resetForm(); setEditingRequirement(null); }}>
              <Plus className="h-4 w-4 mr-2" />
              Add Requirement
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingRequirement ? "Edit Admission Requirement" : "Add New Admission Requirement"}
              </DialogTitle>
              <DialogDescription>
                Define country-specific admission requirements for Bachelor's or Master's programs
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="country_code">Country Code *</Label>
                  <Input
                    id="country_code"
                    value={formData.country_code}
                    onChange={(e) => setFormData({ ...formData, country_code: e.target.value.toUpperCase() })}
                    placeholder="EG"
                    maxLength={2}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="country_name">Country Name *</Label>
                  <Input
                    id="country_name"
                    value={formData.country_name}
                    onChange={(e) => setFormData({ ...formData, country_name: e.target.value })}
                    placeholder="Egypt"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="education_system">Education System *</Label>
                  <Select
                    value={formData.education_system}
                    onValueChange={(value: "abitur" | "a_levels" | "ib" | "us_high_school" | "indian_higher_secondary" | "chinese_gaokao" | "french_baccalaureat" | "other") => 
                      setFormData({ ...formData, education_system: value })
                    }
                  >
                    <SelectTrigger id="education_system">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="abitur">Abitur</SelectItem>
                      <SelectItem value="a_levels">A-Levels</SelectItem>
                      <SelectItem value="ib">IB</SelectItem>
                      <SelectItem value="us_high_school">US High School</SelectItem>
                      <SelectItem value="indian_higher_secondary">Indian Higher Secondary</SelectItem>
                      <SelectItem value="chinese_gaokao">Chinese Gaokao</SelectItem>
                      <SelectItem value="french_baccalaureat">French Baccalauréat</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="degree_level">Degree Level *</Label>
                  <Select
                    value={formData.degree_level}
                    onValueChange={(value: "bachelor" | "master") => setFormData({ ...formData, degree_level: value })}
                  >
                    <SelectTrigger id="degree_level">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bachelor">Bachelor</SelectItem>
                      <SelectItem value="master">Master</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="min_german_level">Minimum German Level</Label>
                  <Input
                    id="min_german_level"
                    value={formData.min_german_level}
                    onChange={(e) => setFormData({ ...formData, min_german_level: e.target.value })}
                    placeholder="B2"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="min_english_level">Minimum English Level</Label>
                  <Input
                    id="min_english_level"
                    value={formData.min_english_level}
                    onChange={(e) => setFormData({ ...formData, min_english_level: e.target.value })}
                    placeholder="IELTS 6.5"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="required_documents">Required Documents (comma-separated)</Label>
                <Input
                  id="required_documents"
                  value={formData.required_documents.join(", ")}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    required_documents: e.target.value.split(",").map(s => s.trim()).filter(Boolean)
                  })}
                  placeholder="Diploma, Transcripts, Translations"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="additional_notes">Additional Notes</Label>
                <Textarea
                  id="additional_notes"
                  value={formData.additional_notes}
                  onChange={(e) => setFormData({ ...formData, additional_notes: e.target.value })}
                  placeholder="Country-specific information and requirements"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="source_url">Source URL</Label>
                <Input
                  id="source_url"
                  value={formData.source_url}
                  onChange={(e) => setFormData({ ...formData, source_url: e.target.value })}
                  placeholder="https://www.daad.de/..."
                />
              </div>

              <div className="flex gap-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="accepts_english"
                    checked={formData.accepts_english}
                    onCheckedChange={(checked) => setFormData({ ...formData, accepts_english: checked as boolean })}
                  />
                  <Label htmlFor="accepts_english" className="text-sm font-normal">
                    Accepts English
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="aps_certificate_required"
                    checked={formData.aps_certificate_required}
                    onCheckedChange={(checked) => setFormData({ ...formData, aps_certificate_required: checked as boolean })}
                  />
                  <Label htmlFor="aps_certificate_required" className="text-sm font-normal">
                    APS Certificate Required
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="entrance_exam_required"
                    checked={formData.entrance_exam_required}
                    onCheckedChange={(checked) => setFormData({ ...formData, entrance_exam_required: checked as boolean })}
                  />
                  <Label htmlFor="entrance_exam_required" className="text-sm font-normal">
                    Entrance Exam Required
                  </Label>
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button onClick={handleSubmit} disabled={!formData.country_code || !formData.country_name}>
                  {editingRequirement ? "Update" : "Create"}
                </Button>
                <Button variant="outline" onClick={() => { setIsDialogOpen(false); resetForm(); setEditingRequirement(null); }}>
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Requirements List */}
      <div className="grid gap-4">
        {isLoading ? (
          <Card>
            <CardContent className="p-6">Loading...</CardContent>
          </Card>
        ) : requirements && requirements.length > 0 ? (
          requirements.map((req: any) => (
            <Card key={req.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Globe className="h-5 w-5 text-primary" />
                    <div>
                      <CardTitle>{req.country_name} ({req.country_code})</CardTitle>
                      <CardDescription>
                        {req.education_system} • {req.degree_level}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(req)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        if (confirm("Are you sure you want to delete this requirement?")) {
                          deleteRequirement.mutate(req.id);
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex gap-2">
                  {req.accepts_english && <Badge variant="secondary">Accepts English</Badge>}
                  {req.aps_certificate_required && <Badge variant="secondary">APS Required</Badge>}
                  {req.entrance_exam_required && <Badge variant="secondary">Entrance Exam</Badge>}
                </div>
                {req.additional_notes && (
                  <p className="text-sm text-muted-foreground">{req.additional_notes}</p>
                )}
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="font-medium">Min German:</span> {req.min_german_level || "N/A"}
                  </div>
                  <div>
                    <span className="font-medium">Min English:</span> {req.min_english_level || "N/A"}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="p-6 text-center text-muted-foreground">
              No admission requirements found. Add your first requirement above.
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
