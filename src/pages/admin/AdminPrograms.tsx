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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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
  const { toast } = useToast();

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
    recognition_weeks_before: 10,
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
      
      // Cast data to proper types
      const typedData = (data || []).map(program => ({
        ...program,
        application_method: program.application_method as 'direct' | 'uni_assist_direct' | 'uni_assist_vpd' | 'recognition_certificates',
      }));
      
      setPrograms(typedData);
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
      // Convert dates to strings for database
      const submitData = {
        ...formData,
        winter_deadline: formData.winter_deadline ? formData.winter_deadline.toISOString().split('T')[0] : null,
        summer_deadline: formData.summer_deadline ? formData.summer_deadline.toISOString().split('T')[0] : null,
      };

      if (editingProgram) {
        const { error } = await supabase
          .from('programs')
          .update(submitData)
          .eq('id', editingProgram.id);

        if (error) throw error;
        toast({
          title: "Success",
          description: "Program updated successfully",
        });
      } else {
        const { error } = await supabase
          .from('programs')
          .insert(submitData);

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
      recognition_weeks_before: program.recognition_weeks_before || 10,
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
      recognition_weeks_before: 10,
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

      <div className="space-y-6">
        {/* Expert Report Programs Upload */}
        <Card>
          <CardHeader>
            <CardTitle>Import Expert Report Programs</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Import all 80+ English-taught programs from the expert report on German universities.
            </p>
            <Button 
              onClick={async () => {
                try {
                  setLoading(true);
                  
                  const csvContent = `program_name,university_id,field_of_study,degree_type,degree_level,duration_semesters,ects_credits,semester_fees,minimum_gpa,language_of_instruction,language_requirements,prerequisites,application_method,uni_assist_required,recognition_weeks_before,program_url,delivery_mode,description,published,intake_season,application_start_date,application_end_date,semester_start_date,notes
Software Design International,004e52c6-5b0d-4ebe-9bd8-2a815057d4ed,Computer Science,B.Sc.,bachelor,7,210,70,,en,"English B2 (IELTS 5.5, TOEFL 72), German A1",General university entrance qualification,direct,false,10,,on_campus,Software Engineering with IT Security and Data Science focus,true,winter,02/05/2025,31/05/2025,01/10/2025,Includes mandatory work placement and Bachelor's thesis
International Management,004e52c6-5b0d-4ebe-9bd8-2a815057d4ed,Management,M.A.,master,3,90,70,2.5,en,"English B2, German A1",Bachelor's degree with minimum 2.5 grade or top 50% ranking,direct,false,10,,on_campus,Management with HR Marketing Law and Intercultural Communication,true,winter,01/04/2025,15/05/2025,01/10/2025,Can be pursued part-time
International Management,004e52c6-5b0d-4ebe-9bd8-2a815057d4ed,Management,M.A.,master,3,90,70,2.5,en,"English B2, German A1",Bachelor's degree with minimum 2.5 grade or top 50% ranking,direct,false,10,,on_campus,Management with HR Marketing Law and Intercultural Communication,true,summer,01/10/2024,30/11/2024,01/04/2025,Can be pursued part-time
MERCURI - European Master in Customer Relationship Marketing,004e52c6-5b0d-4ebe-9bd8-2a815057d4ed,Marketing,M.A.,master,4,180,1000,,en,English B2 (CEFR),Bachelor's degree with at least 180 ECTS and good academic records,direct,false,10,,on_campus,Customer Relationship Marketing Consumer Behavior Data Mining,true,winter,01/06/2025,15/08/2025,01/10/2025,Joint degree program with tuition fee of 4000 EUR total
International Renewable Energy Project Development,004e52c6-5b0d-4ebe-9bd8-2a815057d4ed,Renewable Energy,M.Eng.,master,3,,70,,en,,Bachelor's degree,direct,false,10,,on_campus,Renewable Energy Project Development Management Regulation Technology,true,summer,01/09/2024,15/11/2024,01/04/2025,1.5 years duration
Mechatronic Systems,004e52c6-5b0d-4ebe-9bd8-2a815057d4ed,Mechatronics,M.Eng.,master,4,,,en,,Bachelor's degree,direct,false,10,,on_campus,Mechatronic Systems,false,winter,,,,"Program is listed as expiring"
International Business Management,0050d04c-14b7-4020-8e67-a8af085f43a8,Business Management,B.A.,bachelor,7,,950,,en,,University entrance qualification and admission interview,direct,false,10,,on_campus,Business Management Economics Intercultural Management Digital Transformation,true,winter,01/01/2025,31/12/2025,01/10/2025,Continuous application process with optional study abroad
International Business Management,0050d04c-14b7-4020-8e67-a8af085f43a8,Business Management,B.A.,bachelor,7,,950,,en,,University entrance qualification and admission interview,direct,false,10,,on_campus,Business Management Economics Intercultural Management Digital Transformation,true,summer,01/01/2025,31/12/2025,01/04/2025,Continuous application process with optional study abroad
Computer Science,0050d04c-14b7-4020-8e67-a8af085f43a8,Computer Science,M.Sc.,master,4,120,880,,en,English B2 (CEFR),Bachelor's degree with at least 180 ECTS and minimum 60 ECTS in Computer Science,direct,false,10,,on_campus,Computer Science Cyber Security Artificial Intelligence Machine Learning,true,winter,01/01/2025,31/12/2025,01/10/2025,Applications accepted all year round
Computer Science,0050d04c-14b7-4020-8e67-a8af085f43a8,Computer Science,M.Sc.,master,4,120,880,,en,English B2 (CEFR),Bachelor's degree with at least 180 ECTS and minimum 60 ECTS in Computer Science,direct,false,10,,on_campus,Computer Science Cyber Security Artificial Intelligence Machine Learning,true,summer,01/01/2025,31/12/2025,01/04/2025,Applications accepted all year round
Biochemical Engineering,0050d04c-14b7-4020-8e67-a8af085f43a8,Biochemical Engineering,M.Eng.,master,4,120,880,,en,"English B2 (TOEFL iBT 70, IELTS 6.0)",Bachelor's degree (min. 180 ECTS) in chemistry-related subject,direct,false,10,,on_campus,Biochemical Engineering Process Optimization Pharmaceuticals Chemical Industries,true,winter,01/01/2025,31/12/2025,01/10/2025,Applications accepted all year round
Biochemical Engineering,0050d04c-14b7-4020-8e67-a8af085f43a8,Biochemical Engineering,M.Eng.,master,4,120,880,,en,"English B2 (TOEFL iBT 70, IELTS 6.0)",Bachelor's degree (min. 180 ECTS) in chemistry-related subject,direct,false,10,,on_campus,Biochemical Engineering Process Optimization Pharmaceuticals Chemical Industries,true,summer,01/01/2025,31/12/2025,01/04/2025,Applications accepted all year round
Bachelor International Business,00940d36-d1b1-40d0-ab6e-d6c227d2b6ca,Business Administration,B.A.,bachelor,6,210,6965,,en,"English B2 (TOEFL iBT 85, IELTS 6.5)",School-leaving certificate for university eligibility,direct,false,10,,on_campus,Business Administration Economics Management Finance Marketing Entrepreneurship,true,winter,01/01/2025,15/07/2025,01/09/2025,Integrated internship and mandatory semester abroad
Bachelor International Business,00940d36-d1b1-40d0-ab6e-d6c227d2b6ca,Business Administration,B.A.,bachelor,6,210,6965,,en,"English B2 (TOEFL iBT 85, IELTS 6.5)",School-leaving certificate for university eligibility,direct,false,10,,on_campus,Business Administration Economics Management Finance Marketing Entrepreneurship,true,summer,01/10/2024,15/12/2024,01/02/2025,Integrated internship and mandatory semester abroad
Master of Business Administration,00940d36-d1b1-40d0-ab6e-d6c227d2b6ca,Business Administration,MBA,master,2,60,2666,,en,,Bachelor's degree and professional experience,direct,false,10,,on_campus,Business Administration Management Leadership International Business,true,winter,01/01/2025,01/09/2025,01/09/2025,12 months duration with admission test or interview required
Master of Business Administration,00940d36-d1b1-40d0-ab6e-d6c227d2b6ca,Business Administration,MBA,master,2,60,2666,,en,,Bachelor's degree and professional experience,direct,false,10,,on_campus,Business Administration Management Leadership International Business,true,summer,01/10/2024,01/03/2025,01/03/2025,12 months duration with admission test or interview required
Master International Marketing and Brand Management,00940d36-d1b1-40d0-ab6e-d6c227d2b6ca,Marketing,M.A.,master,3,,1433,,en,"English B2 (TOEFL iBT 85, IELTS 6.5)",Bachelor's degree of 180 ECTS or more,direct,false,10,,on_campus,Marketing Brand Management Digital Marketing Customer Behavior,true,winter,01/05/2025,15/02/2025,01/09/2025,18 months duration with early bird discount available
Master International Marketing and Brand Management,00940d36-d1b1-40d0-ab6e-d6c227d2b6ca,Marketing,M.A.,master,3,,1433,,en,"English B2 (TOEFL iBT 85, IELTS 6.5)",Bachelor's degree of 180 ECTS or more,direct,false,10,,on_campus,Marketing Brand Management Digital Marketing Customer Behavior,true,summer,01/11/2024,15/10/2024,01/03/2025,18 months duration with early bird discount available
Doctor of Business Administration,00940d36-d1b1-40d0-ab6e-d6c227d2b6ca,Business Administration,DBA,master,8,,468,,en,,Research proposal required,direct,false,10,,on_campus,Business and Management Theory Research and Practice,true,winter,01/01/2025,31/12/2025,01/10/2025,Part-time program expected to take at least 4 years
Industrial Engineering,031e4c61-1592-4688-9003-bf7f702e0479,Industrial Engineering,B.Sc.,bachelor,6,180,235,,en,English B1,University entrance qualification,direct,false,10,,online,Industrial Engineering Management Economics Legal aspects,true,winter,01/01/2025,31/01/2025,01/02/2025,Monthly intakes available
Industrial Engineering,031e4c61-1592-4688-9003-bf7f702e0479,Industrial Engineering,B.Sc.,bachelor,6,180,235,,en,English B1,University entrance qualification,direct,false,10,,online,Industrial Engineering Management Economics Legal aspects,true,summer,01/01/2025,31/07/2025,01/08/2025,Monthly intakes available
Global Business Administration,031e4c61-1592-4688-9003-bf7f702e0479,Business Administration,MBA,master,4,,,en,,Bachelor's degree,direct,false,10,,online,Business Administration,true,winter,01/01/2025,31/01/2025,01/02/2025,Online distance learning
UX & Service Design,031e4c61-1592-4688-9003-bf7f702e0479,UX Design,M.A.,master,3,,,,en,English B1,"Bachelor's degree with at least 180 ECTS, minimum one year work experience",direct,false,10,,online,User Experience Design Service Design Innovation Technology Management,true,winter,01/01/2025,31/01/2025,01/02/2025,Motivational interview required
Diversity Ethics and Religions,05e44d0b-7409-4da6-8624-5c28c72aea70,Humanities,B.A.,bachelor,6,,,en,"English B1, German A2",VPD required,uni_assist_vpd,true,10,,on_campus,Diversity Ethics and Religions,true,winter,01/04/2025,15/07/2025,01/10/2025,
Aerospace Informatics,05e44d0b-7409-4da6-8624-5c28c72aea70,Computer Science,M.Sc.,master,4,,,en,"English B2, German A2",University degree from non-EU/EEA requires VPD,uni_assist_vpd,true,10,,on_campus,Aerospace Informatics,true,winter,01/04/2025,15/07/2025,01/10/2025,
Aerospace Informatics,05e44d0b-7409-4da6-8624-5c28c72aea70,Computer Science,M.Sc.,master,4,,,en,"English B2, German A2",University degree from non-EU/EEA requires VPD,uni_assist_vpd,true,10,,on_campus,Aerospace Informatics,true,summer,01/10/2024,15/01/2025,01/04/2025,
Adult Education and Management in Lifelong Education,05e44d0b-7409-4da6-8624-5c28c72aea70,Education,M.A.,master,4,,,en,"English B2, German A1",No VPD required,direct,false,10,,on_campus,Adult Education and Management in Lifelong Education,true,winter,01/04/2025,15/07/2025,01/10/2025,
Artificial Intelligence & Extended Reality,05e44d0b-7409-4da6-8624-5c28c72aea70,Computer Science,M.Sc.,master,4,,,en,"English B2, German A2",University degree from non-EU/EEA requires VPD,uni_assist_vpd,true,10,,on_campus,Artificial Intelligence Extended Reality,true,winter,01/01/2025,15/03/2025,01/10/2025,
Biochemistry,05e44d0b-7409-4da6-8624-5c28c72aea70,Biochemistry,M.Sc.,master,4,,,en,English B2,VPD may be required for non-EU/EEA applicants,uni_assist_vpd,true,10,,on_campus,Biochemistry,true,winter,01/04/2025,01/06/2025,01/10/2025,
Biosciences,05e44d0b-7409-4da6-8624-5c28c72aea70,Life Sciences,M.Sc.,master,4,,,en,English B2/C1,No VPD required,direct,false,10,,on_campus,Biosciences,true,winter,01/04/2025,15/07/2025,01/10/2025,
Biosciences,05e44d0b-7409-4da6-8624-5c28c72aea70,Life Sciences,M.Sc.,master,4,,,en,English B2/C1,No VPD required,direct,false,10,,on_campus,Biosciences,true,summer,01/10/2024,15/01/2025,01/04/2025,
China Business and Economics,05e44d0b-7409-4da6-8624-5c28c72aea70,Economics,M.A.,master,4,,,en,"English B2, German DSH 2",No VPD required,direct,false,10,,on_campus,China Business and Economics,true,winter,01/01/2025,15/03/2025,01/10/2025,Taught in English German and Chinese
Chinese Studies,05e44d0b-7409-4da6-8624-5c28c72aea70,Cultural Studies,M.A.,master,4,,,en,"English B2, German A2",No VPD required,direct,false,10,,on_campus,Chinese Studies,true,winter,01/01/2025,15/03/2025,01/10/2025,
Computational Humanities,05e44d0b-7409-4da6-8624-5c28c72aea70,Humanities,M.A.,master,4,,,en,English B2,VPD decision pending,uni_assist_vpd,true,10,,on_campus,Computational Humanities,true,winter,01/04/2025,15/07/2025,01/10/2025,
Computer Science,05e44d0b-7409-4da6-8624-5c28c72aea70,Computer Science,M.Sc.,master,4,,,en,"English B2, German A2",University degree from non-EU/EEA requires VPD,uni_assist_vpd,true,10,,on_campus,Computer Science,true,winter,01/07/2025,15/10/2025,01/10/2025,
Computer Science,05e44d0b-7409-4da6-8624-5c28c72aea70,Computer Science,M.Sc.,master,4,,,en,"English B2, German A2",University degree from non-EU/EEA requires VPD,uni_assist_vpd,true,10,,on_campus,Computer Science,true,summer,01/01/2025,15/04/2025,01/04/2025,
Educational Sciences,05e44d0b-7409-4da6-8624-5c28c72aea70,Education,M.A.,master,4,,,en,"English B2, German A2",No VPD required,direct,false,10,,on_campus,Educational Sciences,true,winter,01/04/2025,15/07/2025,01/10/2025,
Exercise Science & Training,05e44d0b-7409-4da6-8624-5c28c72aea70,Sports Science,M.Sc.,master,4,,,en,"English B2, German B1",VPD required,uni_assist_vpd,true,10,,on_campus,Exercise Science Training,true,winter,01/04/2025,15/07/2025,01/10/2025,
FOKUS Life Sciences,05e44d0b-7409-4da6-8624-5c28c72aea70,Life Sciences,M.Sc.,master,4,,,en,English C1,No VPD required,direct,false,10,,on_campus,FOKUS Life Sciences,true,winter,01/01/2025,15/03/2025,01/10/2025,
Geographic Science Approaches to Environmental Challenges,05e44d0b-7409-4da6-8624-5c28c72aea70,Geography,M.Sc.,master,4,,,en,"English C1, German A1",Aptitude test required,direct,false,10,,on_campus,Geographic Science Environmental Challenges GEOSPHERES,true,winter,01/04/2025,15/07/2025,01/10/2025,VPD decision pending
Global Challenges for Sustainability,05e44d0b-7409-4da6-8624-5c28c72aea70,Sustainability,M.Sc.,master,4,,,en,English C1,No VPD required,direct,false,10,,on_campus,Global Challenges for Sustainability,true,winter,01/01/2025,15/03/2025,01/10/2025,
Artificial Intelligence,036ccf51-2c83-44c7-ad61-15a6af1a71ce,Computer Science,B.Sc.,bachelor,7,210,0,,en,,General German university entrance qualification or equivalent international qualification,direct,false,10,,on_campus,Artificial Intelligence,true,winter,15/04/2025,15/07/2025,01/10/2025,
Building Products and Processes,036ccf51-2c83-44c7-ad61-15a6af1a71ce,Engineering,B.Eng.,bachelor,7,210,0,,en,,General German university entrance qualification or equivalent international qualification,direct,false,10,,on_campus,Building Products and Processes,true,winter,15/04/2025,15/07/2025,01/10/2025,
Business Administration and Service Management,036ccf51-2c83-44c7-ad61-15a6af1a71ce,Business Administration,B.A.,bachelor,7,210,0,,en,,General German university entrance qualification or equivalent international qualification,direct,false,10,,on_campus,Business Administration and Service Management,true,winter,15/04/2025,15/07/2025,01/10/2025,
Energy Systems Engineering,036ccf51-2c83-44c7-ad61-15a6af1a71ce,Engineering,B.Eng.,bachelor,7,210,0,,en,,General German university entrance qualification or equivalent international qualification,direct,false,10,,on_campus,Energy Systems Engineering,true,winter,15/04/2025,15/07/2025,01/10/2025,
Electromobility Autonomous Driving and Mobile Robotics - INTERNATIONAL,036ccf51-2c83-44c7-ad61-15a6af1a71ce,Engineering,B.Eng.,bachelor,7,210,0,,en,,General German university entrance qualification or equivalent international qualification,direct,false,10,,on_campus,Electromobility Autonomous Driving Mobile Robotics,true,winter,15/04/2025,15/07/2025,01/10/2025,
Electrical Engineering and Information Technology - INTERNATIONAL,036ccf51-2c83-44c7-ad61-15a6af1a71ce,Engineering,B.Eng.,bachelor,7,210,0,,en,,General German university entrance qualification or equivalent international qualification,direct,false,10,,on_campus,Electrical Engineering Information Technology,true,winter,15/04/2025,15/07/2025,01/10/2025,
Electronics Engineering for Artificial Intelligence - INTERNATIONAL,036ccf51-2c83-44c7-ad61-15a6af1a71ce,Engineering,B.Eng.,bachelor,7,210,0,,en,,General German university entrance qualification or equivalent international qualification,direct,false,10,,on_campus,Electronics Engineering Artificial Intelligence,true,winter,15/04/2025,15/07/2025,01/10/2025,
Health Informatics,036ccf51-2c83-44c7-ad61-15a6af1a71ce,Health Informatics,B.Sc.,bachelor,7,210,0,,en,,General German university entrance qualification or equivalent international qualification,direct,false,10,,on_campus,Health Informatics,true,winter,15/04/2025,15/07/2025,01/10/2025,
Industrial Engineering,036ccf51-2c83-44c7-ad61-15a6af1a71ce,Engineering,B.Eng.,bachelor,7,210,0,,en,,General German university entrance qualification or equivalent international qualification,direct,false,10,,on_campus,Industrial Engineering,true,winter,15/04/2025,15/07/2025,01/10/2025,
International Management,036ccf51-2c83-44c7-ad61-15a6af1a71ce,Management,B.A.,bachelor,7,210,0,,en,DIT aptitude test required,General German university entrance qualification or equivalent international qualification,direct,false,10,,on_campus,Management Marketing Finance Economics,true,winter,15/04/2025,15/07/2025,01/10/2025,Mandatory semester abroad and double degree options
International Tourism Management Health and Medical Tourism,036ccf51-2c83-44c7-ad61-15a6af1a71ce,Tourism Management,B.A.,bachelor,7,210,0,,en,,General German university entrance qualification or equivalent international qualification,direct,false,10,,on_campus,International Tourism Management Health Medical Tourism,true,winter,15/04/2025,15/07/2025,01/10/2025,
Nursing,036ccf51-2c83-44c7-ad61-15a6af1a71ce,Nursing,B.Sc.,bachelor,7,210,0,,en,,General German university entrance qualification or equivalent international qualification,direct,false,10,,on_campus,Nursing,true,winter,15/04/2025,15/07/2025,01/10/2025,
Applied Computer Science,036ccf51-2c83-44c7-ad61-15a6af1a71ce,Computer Science,M.Sc.,master,3,90,0,,en,,Bachelor's degree,direct,false,10,,on_campus,Applied Computer Science,true,winter,15/04/2025,15/07/2025,01/10/2025,
Artificial Intelligence and Data Science,036ccf51-2c83-44c7-ad61-15a6af1a71ce,Computer Science,M.Sc.,master,3,90,0,,en,,Bachelor's degree,direct,false,10,,on_campus,Artificial Intelligence Data Science,true,winter,15/04/2025,15/07/2025,01/10/2025,
Robotics,036ccf51-2c83-44c7-ad61-15a6af1a71ce,Engineering,M.Eng.,master,3,90,0,,en,,Bachelor's degree,direct,false,10,,on_campus,Robotics,true,winter,15/04/2025,15/07/2025,01/10/2025,
International Tourism Development,036ccf51-2c83-44c7-ad61-15a6af1a71ce,Tourism Management,M.A.,master,3,90,0,,en,,Bachelor's degree,direct,false,10,,on_campus,International Tourism Development,true,winter,15/04/2025,15/07/2025,01/10/2025,
Digital Health,036ccf51-2c83-44c7-ad61-15a6af1a71ce,Health Informatics,M.Sc.,master,3,90,0,,en,,Bachelor's degree,direct,false,10,,on_campus,Digital Health,true,winter,15/04/2025,15/07/2025,01/10/2025,
Global Public Health,036ccf51-2c83-44c7-ad61-15a6af1a71ce,Public Health,M.Sc.,master,3,90,0,,en,,Bachelor's degree,direct,false,10,,on_campus,Global Public Health,true,winter,15/04/2025,15/07/2025,01/10/2025,
Automotive Software Engineering,036ccf51-2c83-44c7-ad61-15a6af1a71ce,Engineering,M.Eng.,master,3,90,0,,en,,Bachelor's degree,direct,false,10,,on_campus,Automotive Software Engineering,true,winter,15/04/2025,15/07/2025,01/10/2025,
High Performance Computing Quantum Computing,036ccf51-2c83-44c7-ad61-15a6af1a71ce,Computer Science,M.Sc.,master,3,90,0,,en,,Bachelor's degree,direct,false,10,,on_campus,High Performance Computing Quantum Computing,true,winter,15/04/2025,15/07/2025,01/10/2025,
Healthy and Sustainable Buildings,036ccf51-2c83-44c7-ad61-15a6af1a71ce,Engineering,M.Eng.,master,3,90,0,,en,,Bachelor's degree,direct,false,10,,on_campus,Healthy Sustainable Buildings,true,winter,15/04/2025,15/07/2025,01/10/2025,
Applied AI for Digital Production Management,036ccf51-2c83-44c7-ad61-15a6af1a71ce,Engineering,M.Eng.,master,3,90,0,,en,,Bachelor's degree,direct,false,10,,on_campus,Applied AI Digital Production Management,true,winter,15/04/2025,15/07/2025,01/10/2025,
Life Science Informatics,036ccf51-2c83-44c7-ad61-15a6af1a71ce,Life Sciences,M.Sc.,master,3,90,0,,en,,Bachelor's degree,direct,false,10,,on_campus,Life Science Informatics,true,winter,15/04/2025,15/07/2025,01/10/2025,
Electrical Engineering and Information Technology,036ccf51-2c83-44c7-ad61-15a6af1a71ce,Engineering,M.Sc.,master,3,90,0,,en,,Bachelor's degree,direct,false,10,,on_campus,Electrical Engineering Information Technology,true,winter,15/04/2025,15/07/2025,01/10/2025,
Mechatronic and Cyber-Physical Systems,036ccf51-2c83-44c7-ad61-15a6af1a71ce,Engineering,M.Eng.,master,3,90,0,,en,,Bachelor's degree,direct,false,10,,on_campus,Mechatronic Cyber-Physical Systems,true,winter,15/04/2025,15/07/2025,01/10/2025,
Sustainability in Polymer Technology,036ccf51-2c83-44c7-ad61-15a6af1a71ce,Engineering,M.Eng.,master,3,90,0,,en,,Bachelor's degree,direct,false,10,,on_campus,Sustainability Polymer Technology,true,winter,15/04/2025,15/07/2025,01/10/2025,
Artificial Intelligence for Smart Sensors and Actuators,036ccf51-2c83-44c7-ad61-15a6af1a71ce,Engineering,M.Eng.,master,3,90,0,,en,,Bachelor's degree,direct,false,10,,on_campus,AI Smart Sensors Actuators,true,winter,15/04/2025,15/07/2025,01/10/2025,
Advanced Engineering and Engineering Management,04f435f3-a740-42d4-8dae-da62fe0531c1,Engineering,M.Sc.,master,4,120,0,,en,,Bachelor's degree,direct,false,10,,on_campus,Advanced Engineering Engineering Management,true,winter,01/04/2025,15/07/2025,01/10/2025,Business and engineering combination
Business Administration with Informatics,04f435f3-a740-42d4-8dae-da62fe0531c1,Business Administration,B.A.,bachelor,6,180,0,,en,,General university entrance qualification,direct,false,10,,on_campus,Business Administration IT focus,true,winter,01/04/2025,15/07/2025,01/10/2025,
Informatics and Business,04f435f3-a740-42d4-8dae-da62fe0531c1,Computer Science,M.Sc.,master,4,120,0,,en,,Bachelor's degree,direct,false,10,,on_campus,Informatics Communication Systems,true,winter,01/04/2025,15/07/2025,01/10/2025,
International Management & Information Systems,04f435f3-a740-42d4-8dae-da62fe0531c1,Management,M.A.,master,4,120,0,,en,,Bachelor's degree,direct,false,10,,on_campus,Management Information Systems,true,winter,01/04/2025,15/07/2025,01/10/2025,
International Management and Information Systems - Online,04f435f3-a740-42d4-8dae-da62fe0531c1,Management,M.A.,master,4,120,0,,en,,Bachelor's degree,direct,false,10,,online,Management Information Systems,true,winter,01/04/2025,15/07/2025,01/10/2025,Online delivery
General Engineering,08b8fc16-60d6-4d6e-9e52-a586069bb68b,Engineering,B.Sc.,bachelor,8,240,0,,en,"English B2, German A1",General university entrance qualification or equivalent,direct,false,10,,on_campus,Engineering Computer Science Food Technology Mechanical Engineering Life Sciences,true,winter,01/01/2025,15/08/2025,01/10/2025,Bilingual program - first 3 semesters in English then German
Information Technology,08b8fc16-60d6-4d6e-9e52-a586069bb68b,Information Technology,M.Sc.,master,4,120,0,2.5,en,"English B2 (CEFR), GRE or GATE scores required",Bachelor's degree with final grade 2.5 or better in related field,direct,false,10,,on_campus,Information Technology Computer Science AI Management Business Administration,true,winter,01/04/2025,15/07/2025,01/10/2025,Letter of motivation required
Information Technology,08b8fc16-60d6-4d6e-9e52-a586069bb68b,Information Technology,M.Sc.,master,4,120,0,2.5,en,"English B2 (CEFR), GRE or GATE scores required",Bachelor's degree with final grade 2.5 or better in related field,direct,false,10,,on_campus,Information Technology Computer Science AI Management Business Administration,true,summer,01/10/2024,15/01/2025,01/04/2025,Letter of motivation required
MBA Business Administration,08df20bb-69b9-405f-9a6e-a9ada9e64dd6,Business Administration,MBA,master,3,90,5940,,en,,Bachelor's degree,direct,false,10,,online,Business Administration,true,winter,01/01/2025,01/04/2025,01/04/2025,Distance learning
MBA Business Administration,08df20bb-69b9-405f-9a6e-a9ada9e64dd6,Business Administration,MBA,master,3,90,5940,,en,,Bachelor's degree,direct,false,10,,online,Business Administration,true,summer,01/07/2025,01/10/2025,01/10/2025,Distance learning
General Management,08df20bb-69b9-405f-9a6e-a9ada9e64dd6,Management,M.Sc.,master,3,90,4800,,en,,Bachelor's degree,direct,false,10,,on_campus,Management,true,winter,01/01/2025,01/04/2025,01/04/2025,
General Management,08df20bb-69b9-405f-9a6e-a9ada9e64dd6,Management,M.Sc.,master,3,90,4800,,en,,Bachelor's degree,direct,false,10,,on_campus,Management,true,summer,01/07/2025,01/10/2025,01/10/2025,
UX Design & Management,08df20bb-69b9-405f-9a6e-a9ada9e64dd6,UX Design,M.Sc.,master,3,90,4800,,en,,Bachelor's degree,direct,false,10,,on_campus,UX Design Management,true,winter,01/01/2025,01/04/2025,01/04/2025,
UX Design & Management,08df20bb-69b9-405f-9a6e-a9ada9e64dd6,UX Design,M.Sc.,master,3,90,4800,,en,,Bachelor's degree,direct,false,10,,on_campus,UX Design Management,true,summer,01/07/2025,01/10/2025,01/10/2025,
Digitalization & Automation,08df20bb-69b9-405f-9a6e-a9ada9e64dd6,Engineering,M.Sc.,master,4,120,5400,,en,,Bachelor's degree,direct,false,10,,on_campus,Digitalization Automation,true,winter,01/07/2025,01/10/2025,01/10/2025,
Industrial Engineering,08df20bb-69b9-405f-9a6e-a9ada9e64dd6,Engineering,M.Sc.,master,4,120,5400,,en,,Bachelor's degree,direct,false,10,,on_campus,Industrial Engineering,true,winter,01/07/2025,01/10/2025,01/10/2025,
Lightweight Engineering & Composites,08df20bb-69b9-405f-9a6e-a9ada9e64dd6,Engineering,M.Sc.,master,3,90,7200,,en,,Bachelor's degree,direct,false,10,,on_campus,Lightweight Engineering Composites,true,winter,01/07/2025,01/10/2025,01/10/2025,
New Mobility - Micromobility,08df20bb-69b9-405f-9a6e-a9ada9e64dd6,Engineering,M.Sc.,master,4,120,5400,,en,,Bachelor's degree,direct,false,10,,on_campus,New Mobility Micromobility,true,winter,01/07/2025,01/10/2025,01/10/2025,`;
                  
                  const { data, error } = await supabase.functions.invoke('ingest-programs-bulk', {
                    body: { csvContent }
                  });

                  if (error) {
                    throw error;
                  }

                  const result = data;
                  toast({
                    title: "Programs Imported Successfully",
                    description: `Processed ${result.processedRows} programs with ${result.successfulPrograms?.length || 0} successful imports`,
                  });
                  fetchPrograms(); // Refresh the programs list
                } catch (error) {
                  console.error('Import failed:', error);
                  toast({
                    title: "Import Failed",
                    description: "Failed to import programs from expert report",
                    variant: "destructive",
                  });
                } finally {
                  setLoading(false);
                }
              }}
              disabled={loading}
            >
              {loading ? "Importing..." : "Import Expert Report Programs"}
            </Button>
          </CardContent>
        </Card>

        {/* CSV Upload Section */}
        <CSVProgramsUpload />
        
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
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {program.program_url ? (
                      <a 
                        href={program.program_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="font-medium hover:underline flex items-center gap-1"
                      >
                        {program.name}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    ) : (
                      <span className="font-medium">{program.name}</span>
                    )}
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
                    {program.winter_intake && (
                      <Badge variant="secondary" className="text-xs">
                        Winter
                        {program.winter_deadline && (
                          <span className="ml-1">
                            <Clock className="h-3 w-3 inline ml-1" />
                            {(() => {
                              const deadline = getDeadlineStatus(
                                new Date(program.winter_deadline), 
                                'winter', 
                                program.winter_intake, 
                                program.summer_intake,
                                program.winter_deadline ? new Date(program.winter_deadline) : null,
                                program.summer_deadline ? new Date(program.summer_deadline) : null
                              );
                              return deadline.timeText;
                            })()}
                          </span>
                        )}
                      </Badge>
                    )}
                    {program.summer_intake && (
                      <Badge variant="secondary" className="text-xs">
                        Summer
                        {program.summer_deadline && (
                          <span className="ml-1">
                            <Clock className="h-3 w-3 inline ml-1" />
                            {(() => {
                              const deadline = getDeadlineStatus(
                                new Date(program.summer_deadline), 
                                'summer', 
                                program.winter_intake, 
                                program.summer_intake,
                                program.winter_deadline ? new Date(program.winter_deadline) : null,
                                program.summer_deadline ? new Date(program.summer_deadline) : null
                              );
                              return deadline.timeText;
                            })()}
                          </span>
                        )}
                      </Badge>
                    )}
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
                <Label htmlFor="degree_type">Degree Type</Label>
                <Select
                  value={formData.degree_type}
                  onValueChange={(value) => setFormData({ ...formData, degree_type: value })}
                >
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
                <Input
                  id="field_of_study"
                  value={formData.field_of_study}
                  onChange={(e) => setFormData({ ...formData, field_of_study: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label htmlFor="program_url">Program URL</Label>
                <Input
                  id="program_url"
                  type="url"
                  value={formData.program_url}
                  onChange={(e) => setFormData({ ...formData, program_url: e.target.value })}
                  placeholder="https://university.edu/program"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="application_method">Application Method</Label>
              <Select
                value={formData.application_method}
                onValueChange={(value: 'direct' | 'uni_assist_direct' | 'uni_assist_vpd' | 'recognition_certificates') => 
                  setFormData({ ...formData, application_method: value })}
              >
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
              
              {formData.application_method === 'uni_assist_vpd' && (
                <Alert className="mt-2">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Application to uni-assist should be submitted at least 5 weeks before the university deadline.
                  </AlertDescription>
                </Alert>
              )}
              
              {formData.application_method === 'recognition_certificates' && (
                <Alert className="mt-2">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Application for recognition should be submitted at least 10 weeks before the visible deadline. 
                    This process is only applicable for specific universities in Baden-Württemberg.
                  </AlertDescription>
                </Alert>
              )}
            </div>

            <div className="space-y-4">
              <Label>Intake Availability</Label>
              <div className="flex gap-6">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="winter_intake"
                    checked={formData.winter_intake}
                    onCheckedChange={(checked) => setFormData({ ...formData, winter_intake: !!checked })}
                  />
                  <Label htmlFor="winter_intake">Winter Intake</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="summer_intake"
                    checked={formData.summer_intake}
                    onCheckedChange={(checked) => setFormData({ ...formData, summer_intake: !!checked })}
                  />
                  <Label htmlFor="summer_intake">Summer Intake</Label>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {formData.winter_intake && (
                <div>
                  <Label>Winter Deadline</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !formData.winter_deadline && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.winter_deadline ? format(formData.winter_deadline, "PPP") : "Select date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={formData.winter_deadline}
                        onSelect={(date) => setFormData({ ...formData, winter_deadline: date || null })}
                        initialFocus
                        className="p-3 pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              )}
              
              {formData.summer_intake && (
                <div>
                  <Label>Summer Deadline</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !formData.summer_deadline && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.summer_deadline ? format(formData.summer_deadline, "PPP") : "Select date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={formData.summer_deadline}
                        onSelect={(date) => setFormData({ ...formData, summer_deadline: date || null })}
                        initialFocus
                        className="p-3 pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              )}
            </div>

            <div>
              <Label>Language of Instruction</Label>
              <div className="flex gap-4 mt-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="lang_de"
                    checked={formData.language_of_instruction.includes('de')}
                    onCheckedChange={(checked) => {
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
                    }}
                  />
                  <Label htmlFor="lang_de" className="flex items-center gap-2">
                    🇩🇪 German
                  </Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="lang_en"
                    checked={formData.language_of_instruction.includes('en')}
                    onCheckedChange={(checked) => {
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
                    }}
                  />
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
                  value={formData.semester_fees}
                  onChange={(e) => setFormData({ ...formData, semester_fees: parseInt(e.target.value) })}
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-4">
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