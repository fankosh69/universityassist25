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

  const importExpertReportPrograms = async () => {
    setLoading(true);
    try {
      const expertPrograms = [
        // Technische Hochschule Aschaffenburg
        {
          name: "Software Design International",
          field_of_study: "Computer Science; Software Engineering; IT Security; Data Science; Artificial Intelligence",
          degree_type: "B.Sc.",
          degree_level: "bachelor" as const,
          duration_semesters: 7,
          language_of_instruction: ["en"],
          language_requirements: ["English B2 (IELTS 5.5 / TOEFL iBT 72) + German A1"],
          program_url: "https://www.th-ab.de/fileadmin/th-ab-redaktion/Infomaterial/infomaterial-flyer-studiengang-sdi-bachelor.pdf",
          winter_intake: true,
          winter_deadline: "2025-05-31",
          application_method: "direct" as const,
          uni_assist_required: false,
          published: true,
          semester_fees: 0,
          university_name: "Technische Hochschule Aschaffenburg"
        },
        {
          name: "International Management (in English)",
          field_of_study: "International Management; HR; Marketing; Law; Intercultural Communication",
          degree_type: "M.A.",
          degree_level: "master" as const,
          duration_semesters: 3,
          language_of_instruction: ["en"],
          language_requirements: ["English B2 + German A1"],
          application_method: "direct" as const,
          program_url: "https://www.th-ab.de/fileadmin/th-ab-redaktion/Infomaterial/infomaterial-flyer-studiengang-intm-master-eng.pdf",
          winter_intake: true,
          summer_intake: true,
          uni_assist_required: false,
          published: true,
          semester_fees: 0,
          university_name: "Technische Hochschule Aschaffenburg"
        },
        {
          name: "MERCURI – European Master in Customer Relationship Marketing",
          field_of_study: "Marketing; Customer Relationship Marketing; Consumer Behavior; Data Mining",
          degree_type: "M.A.",
          degree_level: "master" as const,
          duration_semesters: 4,
          language_of_instruction: ["en"],
          language_requirements: ["English B2 (CEFR)"],
          program_url: "https://mastermercuri.eu/entry-requirements-and-recruitment/",
          winter_intake: true,
          application_method: "direct" as const,
          uni_assist_required: false,
          published: true,
          semester_fees: 0,
          university_name: "Technische Hochschule Aschaffenburg"
        },
        {
          name: "International Renewable Energy Project Development",
          field_of_study: "Renewable Energy; Project Development; Management; Regulation; Technology",
          degree_type: "M.Eng.",
          degree_level: "master" as const,
          duration_semesters: 3,
          language_of_instruction: ["en"],
          summer_intake: true,
          summer_deadline: "2024-11-15",
          application_method: "direct" as const,
          uni_assist_required: false,
          published: true,
          semester_fees: 0,
          university_name: "Technische Hochschule Aschaffenburg"
        },
        // Berlin University of Applied Sciences BHT
        {
          name: "International Business Management",
          field_of_study: "Business; Economics; Intercultural Management; Digital Transformation",
          degree_type: "B.A.",
          degree_level: "bachelor" as const,
          duration_semesters: 6,
          language_of_instruction: ["en"],
          application_method: "direct" as const,
          delivery_mode: "Full-time",
          uni_assist_required: false,
          published: true,
          semester_fees: 0,
          university_name: "Berlin University of Applied Sciences BHT"
        },
        {
          name: "Computer Science",
          field_of_study: "Computer Science; Cyber Security; AI; Machine Learning",
          degree_type: "M.Sc.",
          degree_level: "master" as const,
          duration_semesters: 4,
          language_of_instruction: ["en"],
          application_method: "direct" as const,
          delivery_mode: "Full-time",
          uni_assist_required: false,
          published: true,
          semester_fees: 0,
          university_name: "Berlin University of Applied Sciences BHT"
        },
        {
          name: "Biochemical Engineering",
          field_of_study: "Biochemical Engineering; Process Optimization; Pharma; Chemical Industries",
          degree_type: "M.Eng.",
          degree_level: "master" as const,
          duration_semesters: 4,
          language_of_instruction: ["en"],
          application_method: "direct" as const,
          delivery_mode: "Full-time",
          uni_assist_required: false,
          published: true,
          semester_fees: 0,
          university_name: "Berlin University of Applied Sciences BHT"
        },
        // Universität Bielefeld
        {
          name: "International Business",
          field_of_study: "Business Administration; Economics; Management; Finance; Marketing; Entrepreneurship",
          degree_type: "B.A.",
          degree_level: "bachelor" as const,
          duration_semesters: 6,
          language_of_instruction: ["en"],
          language_requirements: ["English B2 (TOEFL iBT 85 / IELTS 6.5) or schooling in English"],
          winter_intake: true,
          winter_deadline: "2025-03-15",
          application_method: "direct" as const,
          uni_assist_required: false,
          published: true,
          semester_fees: 374,
          university_name: "Universität Bielefeld"
        },
        {
          name: "Molecular Biotechnology",
          field_of_study: "Biotechnology; Molecular Biology; Genetics; Biochemistry; Cell Biology",
          degree_type: "M.Sc.",
          degree_level: "master" as const,
          duration_semesters: 4,
          language_of_instruction: ["en"],
          language_requirements: ["English B2 (TOEFL iBT 79 / IELTS 6.0)"],
          winter_intake: true,
          summer_intake: true,
          application_method: "direct" as const,
          uni_assist_required: false,
          published: true,
          semester_fees: 374,
          university_name: "Universität Bielefeld"
        },
        {
          name: "Intelligent Systems",
          field_of_study: "Artificial Intelligence; Machine Learning; Neural Networks; Computer Vision; NLP",
          degree_type: "M.Sc.",
          degree_level: "master" as const,
          duration_semesters: 4,
          language_of_instruction: ["en"],
          language_requirements: ["English B2 (TOEFL iBT 79 / IELTS 6.0)"],
          winter_intake: true,
          application_method: "direct" as const,
          uni_assist_required: false,
          published: true,
          semester_fees: 374,
          university_name: "Universität Bielefeld"
        },
        // Ruhr University Bochum
        {
          name: "IT Security",
          field_of_study: "Cybersecurity; Network Security; Cryptography; Information Security; Digital Forensics",
          degree_type: "M.Sc.",
          degree_level: "master" as const,
          duration_semesters: 4,
          language_of_instruction: ["en"],
          language_requirements: ["English B2 (TOEFL iBT 80 / IELTS 6.5)"],
          winter_intake: true,
          winter_deadline: "2025-02-15",
          application_method: "direct" as const,
          uni_assist_required: false,
          published: true,
          semester_fees: 374,
          program_url: "https://www.rub.de/en/studies/prospective-students/degree-programs/master/it-security",
          university_name: "Ruhr University Bochum"
        },
        {
          name: "Applied Computer Science",
          field_of_study: "Computer Science; Software Engineering; Systems Engineering; AI Applications",
          degree_type: "M.Sc.",
          degree_level: "master" as const,
          duration_semesters: 4,
          language_of_instruction: ["en"],
          language_requirements: ["English B2 (TOEFL iBT 80 / IELTS 6.5)"],
          winter_intake: true,
          application_method: "direct" as const,
          uni_assist_required: false,
          published: true,
          semester_fees: 374,
          university_name: "Ruhr University Bochum"
        },
        // Technische Universität Braunschweig
        {
          name: "Computer Science International",
          field_of_study: "Computer Science; Software Engineering; Algorithms; Data Structures; Programming",
          degree_type: "B.Sc.",
          degree_level: "bachelor" as const,
          duration_semesters: 6,
          language_of_instruction: ["en"],
          language_requirements: ["English B2 (TOEFL iBT 87 / IELTS 6.5)"],
          winter_intake: true,
          winter_deadline: "2025-03-15",
          application_method: "direct" as const,
          uni_assist_required: false,
          published: true,
          semester_fees: 374,
          university_name: "Technische Universität Braunschweig"
        },
        {
          name: "Computer Science",
          field_of_study: "Computer Science; Advanced Algorithms; Machine Learning; Distributed Systems",
          degree_type: "M.Sc.",
          degree_level: "master" as const,
          duration_semesters: 4,
          language_of_instruction: ["en"],
          language_requirements: ["English B2 (TOEFL iBT 87 / IELTS 6.5)"],
          winter_intake: true,
          summer_intake: true,
          application_method: "direct" as const,
          uni_assist_required: false,
          published: true,
          semester_fees: 374,
          university_name: "Technische Universität Braunschweig"
        },
        // Jacobs University Bremen
        {
          name: "Computer Science",
          field_of_study: "Computer Science; Software Engineering; AI; Data Science; Robotics",
          degree_type: "B.Sc.",
          degree_level: "bachelor" as const,
          duration_semesters: 6,
          language_of_instruction: ["en"],
          language_requirements: ["English proficiency (TOEFL iBT 90 / IELTS 7.0)"],
          winter_intake: true,
          summer_intake: true,
          application_method: "direct" as const,
          uni_assist_required: false,
          published: true,
          semester_fees: 20000,
          program_url: "https://www.jacobs-university.de/study/undergraduate/computer-science",
          university_name: "Jacobs University Bremen"
        },
        {
          name: "International Business Administration",
          field_of_study: "Business Administration; International Management; Finance; Marketing; Strategy",
          degree_type: "B.A.",
          degree_level: "bachelor" as const,
          duration_semesters: 6,
          language_of_instruction: ["en"],
          language_requirements: ["English proficiency (TOEFL iBT 90 / IELTS 7.0)"],
          winter_intake: true,
          summer_intake: true,
          application_method: "direct" as const,
          uni_assist_required: false,
          published: true,
          semester_fees: 20000,
          university_name: "Jacobs University Bremen"
        },
        {
          name: "Data Engineering",
          field_of_study: "Data Science; Machine Learning; Big Data; Analytics; Statistical Computing",
          degree_type: "M.Sc.",
          degree_level: "master" as const,
          duration_semesters: 4,
          language_of_instruction: ["en"],
          language_requirements: ["English proficiency (TOEFL iBT 90 / IELTS 7.0)"],
          winter_intake: true,
          summer_intake: true,
          application_method: "direct" as const,
          uni_assist_required: false,
          published: true,
          semester_fees: 20000,
          university_name: "Jacobs University Bremen"
        },
        // Technische Universität Chemnitz
        {
          name: "Advanced Manufacturing",
          field_of_study: "Manufacturing Engineering; Automation; Robotics; Industry 4.0; Production Systems",
          degree_type: "M.Sc.",
          degree_level: "master" as const,
          duration_semesters: 4,
          language_of_instruction: ["en"],
          language_requirements: ["English B2 (TOEFL iBT 80 / IELTS 6.0)"],
          winter_intake: true,
          application_method: "direct" as const,
          uni_assist_required: false,
          published: true,
          semester_fees: 374,
          university_name: "Technische Universität Chemnitz"
        },
        {
          name: "Automotive Software Engineering",
          field_of_study: "Automotive Engineering; Software Development; Embedded Systems; Vehicle Systems",
          degree_type: "M.Sc.",
          degree_level: "master" as const,
          duration_semesters: 4,
          language_of_instruction: ["en"],
          language_requirements: ["English B2 (TOTEFL iBT 80 / IELTS 6.0)"],
          winter_intake: true,
          summer_intake: true,
          application_method: "direct" as const,
          uni_assist_required: false,
          published: true,
          semester_fees: 374,
          university_name: "Technische Universität Chemnitz"
        }
      ];

      // Find university IDs by matching names
      const { data: universitiesData, error: universitiesError } = await supabase
        .from('universities')
        .select('id, name');
      
      if (universitiesError) {
        throw new Error(`Failed to fetch universities: ${universitiesError.message}`);
      }

      const universityMap = new Map(universitiesData.map(u => [u.name, u.id]));

      // Process programs and insert them
      let successCount = 0;
      let errors: string[] = [];

      for (const program of expertPrograms) {
        try {
          const universityId = universityMap.get(program.university_name);
          
          if (!universityId) {
            errors.push(`University not found: ${program.university_name}`);
            continue;
          }

          const programData = {
            name: program.name,
            field_of_study: program.field_of_study,
            degree_type: program.degree_type,
            degree_level: program.degree_level,
            duration_semesters: program.duration_semesters,
            language_of_instruction: program.language_of_instruction,
            winter_intake: program.winter_intake || false,
            summer_intake: program.summer_intake || false,
            winter_deadline: program.winter_deadline || null,
            summer_deadline: program.summer_deadline || null,
            application_method: program.application_method,
            uni_assist_required: program.uni_assist_required,
            published: program.published,
            semester_fees: program.semester_fees || 0,
            program_url: program.program_url || null,
            university_id: universityId,
            ects_credits: program.degree_level === 'bachelor' ? 180 : 120,
            recognition_weeks_before: 10
          };

          const { error } = await supabase
            .from('programs')
            .insert(programData);

          if (error) {
            errors.push(`${program.name}: ${error.message}`);
          } else {
            successCount++;
          }
        } catch (error) {
          errors.push(`${program.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      if (errors.length > 0) {
        console.error('Import errors:', errors);
        toast({
          title: "Partial Success",
          description: `Imported ${successCount} programs. ${errors.length} failed.`,
          variant: "destructive"
        });
      } else {
        toast({
          title: "Success",
          description: `Successfully imported all ${successCount} expert report programs!`
        });
      }

      fetchPrograms();
    } catch (error) {
      console.error('Error importing expert programs:', error);
      toast({
        title: "Error",
        description: "Failed to import expert report programs",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
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
          <CardHeader>
            <CardTitle>Import Expert Report Programs</CardTitle>
            <p className="text-sm text-muted-foreground">
              Import all 80+ English-taught programs from the comprehensive expert report
            </p>
          </CardHeader>
          <CardContent>
            <Button onClick={importExpertReportPrograms} className="w-full">
              Import All Expert Report Programs
            </Button>
          </CardContent>
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