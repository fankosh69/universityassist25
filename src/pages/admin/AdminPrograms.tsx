import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Edit, Trash2, Search, ExternalLink, Clock, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import LoadingSpinner from "@/components/LoadingSpinner";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { LanguageFlags } from "@/components/LanguageFlags";
import { getDeadlineStatus, getApplicationMethodInfo, getStatusColor } from "@/lib/deadline-utils";
import { CSVProgramsUpload } from "@/components/admin/CSVProgramsUpload";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
interface Program {
  id: string;
  name: string;
  description?: string;
  degree_type: string;
  degree_level: "bachelor" | "master";
  field_of_study: string;
  duration_semesters: number;
  ects_credits?: number;
  semester_fees: number;
  language_of_instruction: string[];
  uni_assist_required: boolean;
  university_id: string;
  published: boolean;
  application_method: 'direct' | 'uni_assist_direct' | 'uni_assist_vpd' | 'recognition_certificates';
  program_url?: string;
  winter_intake: boolean;
  summer_intake: boolean;
  winter_deadline?: string;
  summer_deadline?: string;
  recognition_weeks_before: number;
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
  const {
    toast
  } = useToast();
  const [formData, setFormData] = useState<{
    name: string;
    description: string;
    degree_type: string;
    degree_level: "bachelor" | "master";
    field_of_study: string;
    duration_semesters: number;
    ects_credits: number;
    semester_fees: number;
    language_of_instruction: string[];
    uni_assist_required: boolean;
    university_id: string;
    published: boolean;
    application_method: 'direct' | 'uni_assist_direct' | 'uni_assist_vpd' | 'recognition_certificates';
    program_url: string;
    winter_intake: boolean;
    summer_intake: boolean;
    winter_deadline: Date | null;
    summer_deadline: Date | null;
    recognition_weeks_before: number;
  }>({
    name: "",
    description: "",
    degree_type: "B.A.",
    degree_level: "bachelor",
    field_of_study: "",
    duration_semesters: 6,
    ects_credits: 180,
    semester_fees: 0,
    language_of_instruction: ["de"],
    uni_assist_required: false,
    university_id: "",
    published: true,
    application_method: "direct",
    program_url: "",
    winter_intake: true,
    summer_intake: false,
    winter_deadline: null,
    summer_deadline: null,
    recognition_weeks_before: 10
  });
  useEffect(() => {
    fetchPrograms();
    fetchUniversities();
  }, []);
  const fetchPrograms = async () => {
    try {
      const {
        data,
        error
      } = await supabase.from('programs').select(`
          *,
          universities (name, city)
        `).order('name');
      if (error) throw error;

      // Cast data to proper types
      const typedData = (data || []).map(program => ({
        ...program,
        application_method: program.application_method as 'direct' | 'uni_assist_direct' | 'uni_assist_vpd' | 'recognition_certificates'
      }));
      setPrograms(typedData);
    } catch (error) {
      console.error('Error fetching programs:', error);
      toast({
        title: "Error",
        description: "Failed to fetch programs",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  const fetchUniversities = async () => {
    try {
      const {
        data,
        error
      } = await supabase.from('universities').select('id, name, city').order('name');
      if (error) throw error;
      setUniversities(data || []);
    } catch (error) {
      console.error('Error fetching universities:', error);
    }
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Convert dates to strings for database
      const submitData = {
        ...formData,
        winter_deadline: formData.winter_deadline ? formData.winter_deadline.toISOString().split('T')[0] : null,
        summer_deadline: formData.summer_deadline ? formData.summer_deadline.toISOString().split('T')[0] : null
      };
      if (editingProgram) {
        const {
          error
        } = await supabase.from('programs').update(submitData).eq('id', editingProgram.id);
        if (error) throw error;
        toast({
          title: "Success",
          description: "Program updated successfully"
        });
      } else {
        const {
          error
        } = await supabase.from('programs').insert(submitData);
        if (error) throw error;
        toast({
          title: "Success",
          description: "Program created successfully"
        });
      }
      resetForm();
      fetchPrograms();
    } catch (error) {
      console.error('Error saving program:', error);
      toast({
        title: "Error",
        description: "Failed to save program",
        variant: "destructive"
      });
    }
  };
  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this program?')) return;
    try {
      const {
        error
      } = await supabase.from('programs').delete().eq('id', id);
      if (error) throw error;
      toast({
        title: "Success",
        description: "Program deleted successfully"
      });
      fetchPrograms();
    } catch (error) {
      console.error('Error deleting program:', error);
      toast({
        title: "Error",
        description: "Failed to delete program",
        variant: "destructive"
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
      semester_fees: program.semester_fees,
      language_of_instruction: program.language_of_instruction,
      uni_assist_required: program.uni_assist_required,
      university_id: program.university_id,
      published: program.published,
      application_method: program.application_method || 'direct',
      program_url: program.program_url || '',
      winter_intake: program.winter_intake,
      summer_intake: program.summer_intake,
      winter_deadline: program.winter_deadline ? new Date(program.winter_deadline) : null,
      summer_deadline: program.summer_deadline ? new Date(program.summer_deadline) : null,
      recognition_weeks_before: program.recognition_weeks_before || 10
    });
    setIsDialogOpen(true);
  };
  const resetForm = () => {
    setEditingProgram(null);
    setFormData({
      name: "",
      description: "",
      degree_type: "B.A.",
      degree_level: "bachelor",
      field_of_study: "",
      duration_semesters: 6,
      ects_credits: 180,
      semester_fees: 0,
      language_of_instruction: ["de"],
      uni_assist_required: false,
      university_id: "",
      published: true,
      application_method: "direct",
      program_url: "",
      winter_intake: true,
      summer_intake: false,
      winter_deadline: null,
      summer_deadline: null,
      recognition_weeks_before: 10
    });
    setIsDialogOpen(false);
  };
  const filteredPrograms = programs.filter(program => program.name.toLowerCase().includes(searchTerm.toLowerCase()) || program.field_of_study.toLowerCase().includes(searchTerm.toLowerCase()));
  if (loading) {
    return <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
      </div>;
  }
  return <div className="space-y-6">
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
          <Input placeholder="Search programs..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10" />
        </div>
      </div>

      <div className="space-y-6">
        {/* Expert Report Programs Upload */}
        <Card>
          
          
        </Card>

        {/* CSV Upload Section */}
        <CSVProgramsUpload />
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPrograms.map(program => <Card key={program.id} className="hover:shadow-medium transition-shadow">
            <CardHeader>
              <CardTitle className="text-lg">{program.name}</CardTitle>
              <p className="text-sm text-muted-foreground">
                {program.universities?.name} - {program.universities?.city}
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {program.program_url ? <a href={program.program_url} target="_blank" rel="noopener noreferrer" className="font-medium hover:underline flex items-center gap-1">
                        {program.name}
                        <ExternalLink className="h-3 w-3" />
                      </a> : <span className="font-medium">{program.name}</span>}
                  </div>
                  <Badge variant="outline">{program.degree_type}</Badge>
                </div>

                <div className="flex items-center gap-2">
                  <strong>Language:</strong>
                  <LanguageFlags languages={program.language_of_instruction} />
                </div>

                <div><strong>Duration:</strong> {program.duration_semesters} semesters</div>
                <div><strong>ECTS:</strong> {program.ects_credits}</div>
                <div><strong>Semester Fees:</strong> €{program.semester_fees}/semester</div>
                
                <div>
                  <strong>Intake:</strong> 
                  <div className="flex gap-1 mt-1">
                    {program.winter_intake && <Badge variant="secondary" className="text-xs">
                        Winter
                        {program.winter_deadline && <span className="ml-1">
                            <Clock className="h-3 w-3 inline ml-1" />
                            {(() => {
                        const deadline = getDeadlineStatus(new Date(program.winter_deadline), 'winter', program.winter_intake, program.summer_intake, program.winter_deadline ? new Date(program.winter_deadline) : null, program.summer_deadline ? new Date(program.summer_deadline) : null);
                        return deadline.timeText;
                      })()}
                          </span>}
                      </Badge>}
                    {program.summer_intake && <Badge variant="secondary" className="text-xs">
                        Summer
                        {program.summer_deadline && <span className="ml-1">
                            <Clock className="h-3 w-3 inline ml-1" />
                            {(() => {
                        const deadline = getDeadlineStatus(new Date(program.summer_deadline), 'summer', program.winter_intake, program.summer_intake, program.winter_deadline ? new Date(program.winter_deadline) : null, program.summer_deadline ? new Date(program.summer_deadline) : null);
                        return deadline.timeText;
                      })()}
                          </span>}
                      </Badge>}
                  </div>
                </div>

                <div>
                  <Badge variant="outline" className="text-xs">
                    {getApplicationMethodInfo(program.application_method).name}
                  </Badge>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 rounded text-xs ${program.published ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                    {program.published ? 'Published' : 'Draft'}
                  </span>
                  {program.uni_assist_required && <span className="px-2 py-1 rounded text-xs bg-blue-100 text-blue-800">
                      Uni-Assist
                    </span>}
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
          </Card>)}
        </div>
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
                <Input id="name" value={formData.name} onChange={e => setFormData({
                ...formData,
                name: e.target.value
              })} required />
              </div>
              
              <div>
                <Label htmlFor="university">University</Label>
                <Select value={formData.university_id} onValueChange={value => setFormData({
                ...formData,
                university_id: value
              })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select university" />
                  </SelectTrigger>
                  <SelectContent>
                    {universities.map(uni => <SelectItem key={uni.id} value={uni.id}>
                        {uni.name} - {uni.city}
                      </SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" value={formData.description} onChange={e => setFormData({
              ...formData,
              description: e.target.value
            })} rows={3} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="degree_level">Degree Level</Label>
                <Select value={formData.degree_level} onValueChange={(value: "bachelor" | "master") => setFormData({
                ...formData,
                degree_level: value
              })}>
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
                <Label htmlFor="degree_type">Degree Type</Label>
                <Select value={formData.degree_type} onValueChange={value => setFormData({
                ...formData,
                degree_type: value
              })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select degree type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="B.A.">B.A. - Bachelor of Arts</SelectItem>
                    <SelectItem value="B.Sc.">B.Sc. - Bachelor of Science</SelectItem>
                    <SelectItem value="B.Eng.">B.Eng. - Bachelor of Engineering</SelectItem>
                    <SelectItem value="B.Ed.">B.Ed. - Bachelor of Education</SelectItem>
                    <SelectItem value="B.Com.">B.Com. - Bachelor of Commerce</SelectItem>
                    <SelectItem value="M.A.">M.A. - Master of Arts</SelectItem>
                    <SelectItem value="M.Sc.">M.Sc. - Master of Science</SelectItem>
                    <SelectItem value="M.Eng.">M.Eng. - Master of Engineering</SelectItem>
                    <SelectItem value="M.Ed.">M.Ed. - Master of Education</SelectItem>
                    <SelectItem value="M.Com.">M.Com. - Master of Commerce</SelectItem>
                    <SelectItem value="MBA">MBA - Master of Business Administration</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="field_of_study">Field of Study</Label>
                <Input id="field_of_study" value={formData.field_of_study} onChange={e => setFormData({
                ...formData,
                field_of_study: e.target.value
              })} required />
              </div>

              <div>
                <Label htmlFor="program_url">Program URL</Label>
                <Input id="program_url" type="url" value={formData.program_url} onChange={e => setFormData({
                ...formData,
                program_url: e.target.value
              })} placeholder="https://university.edu/program" />
              </div>
            </div>

            <div>
              <Label htmlFor="application_method">Application Method</Label>
              <Select value={formData.application_method} onValueChange={(value: 'direct' | 'uni_assist_direct' | 'uni_assist_vpd' | 'recognition_certificates') => setFormData({
              ...formData,
              application_method: value
            })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="direct">Direct Application</SelectItem>
                  <SelectItem value="uni_assist_direct">Uni-Assist Direct Application</SelectItem>
                  <SelectItem value="uni_assist_vpd">Uni-Assist VPD</SelectItem>
                  <SelectItem value="recognition_certificates">Recognition of Certificates (Hochschule Konstanz)</SelectItem>
                </SelectContent>
              </Select>
              
              {formData.application_method === 'uni_assist_vpd' && <Alert className="mt-2">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Application to uni-assist should be submitted at least 5 weeks before the university deadline.
                  </AlertDescription>
                </Alert>}
              
              {formData.application_method === 'recognition_certificates' && <Alert className="mt-2">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Application for recognition should be submitted at least 10 weeks before the visible deadline. 
                    This process is only applicable for specific universities in Baden-Württemberg.
                  </AlertDescription>
                </Alert>}
            </div>

            <div className="space-y-4">
              <Label>Intake Availability</Label>
              <div className="flex gap-6">
                <div className="flex items-center space-x-2">
                  <Checkbox id="winter_intake" checked={formData.winter_intake} onCheckedChange={checked => setFormData({
                  ...formData,
                  winter_intake: !!checked
                })} />
                  <Label htmlFor="winter_intake">Winter Intake</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox id="summer_intake" checked={formData.summer_intake} onCheckedChange={checked => setFormData({
                  ...formData,
                  summer_intake: !!checked
                })} />
                  <Label htmlFor="summer_intake">Summer Intake</Label>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {formData.winter_intake && <div>
                  <Label>Winter Deadline</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !formData.winter_deadline && "text-muted-foreground")}>
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.winter_deadline ? format(formData.winter_deadline, "PPP") : "Select date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar mode="single" selected={formData.winter_deadline} onSelect={date => setFormData({
                    ...formData,
                    winter_deadline: date || null
                  })} initialFocus className="p-3 pointer-events-auto" />
                    </PopoverContent>
                  </Popover>
                </div>}
              
              {formData.summer_intake && <div>
                  <Label>Summer Deadline</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !formData.summer_deadline && "text-muted-foreground")}>
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.summer_deadline ? format(formData.summer_deadline, "PPP") : "Select date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar mode="single" selected={formData.summer_deadline} onSelect={date => setFormData({
                    ...formData,
                    summer_deadline: date || null
                  })} initialFocus className="p-3 pointer-events-auto" />
                    </PopoverContent>
                  </Popover>
                </div>}
            </div>

            <div>
              <Label>Language of Instruction</Label>
              <div className="flex gap-4 mt-2">
                <div className="flex items-center space-x-2">
                  <Checkbox id="lang_de" checked={formData.language_of_instruction.includes('de')} onCheckedChange={checked => {
                  if (checked) {
                    setFormData({
                      ...formData,
                      language_of_instruction: [...formData.language_of_instruction.filter(l => l !== 'de'), 'de']
                    });
                  } else {
                    setFormData({
                      ...formData,
                      language_of_instruction: formData.language_of_instruction.filter(l => l !== 'de')
                    });
                  }
                }} />
                  <Label htmlFor="lang_de" className="flex items-center gap-2">
                    🇩🇪 German
                  </Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox id="lang_en" checked={formData.language_of_instruction.includes('en')} onCheckedChange={checked => {
                  if (checked) {
                    setFormData({
                      ...formData,
                      language_of_instruction: [...formData.language_of_instruction.filter(l => l !== 'en'), 'en']
                    });
                  } else {
                    setFormData({
                      ...formData,
                      language_of_instruction: formData.language_of_instruction.filter(l => l !== 'en')
                    });
                  }
                }} />
                  <Label htmlFor="lang_en" className="flex items-center gap-2">
                    🇬🇧 English
                  </Label>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="duration_semesters">Duration (Semesters)</Label>
                  <Input id="duration_semesters" type="number" value={formData.duration_semesters} onChange={e => setFormData({
                  ...formData,
                  duration_semesters: parseInt(e.target.value)
                })} required />
                </div>

                <div>
                  <Label htmlFor="ects_credits">ECTS Credits</Label>
                  <Input id="ects_credits" type="number" value={formData.ects_credits} onChange={e => setFormData({
                  ...formData,
                  ects_credits: parseInt(e.target.value)
                })} />
                </div>

                <div>
                  <Label htmlFor="tuition_fees">Tuition Fees (€/year)</Label>
                  <Input id="tuition_fees" type="number" value={formData.semester_fees} onChange={e => setFormData({
                  ...formData,
                  semester_fees: parseInt(e.target.value)
                })} />
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Checkbox id="published" checked={formData.published} onCheckedChange={checked => setFormData({
                ...formData,
                published: !!checked
              })} />
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
    </div>;
};