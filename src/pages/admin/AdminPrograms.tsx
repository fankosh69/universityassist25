import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Edit, Trash2, Search, ExternalLink, Clock, AlertTriangle, Upload, Info, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import LoadingSpinner from "@/components/LoadingSpinner";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { LanguageFlags } from "@/components/LanguageFlags";
import { getDeadlineStatus, getApplicationMethodInfo, getStatusColor } from "@/lib/deadline-utils";
import { slugify } from "@/lib/slug";
import { formatTuitionDisplay } from "@/lib/tuition-calculator";
import { ProgramScraper } from "@/components/admin/ProgramScraper";
import { BulkProgramImporter } from "@/components/admin/BulkProgramImporter";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { HierarchicalFieldMultiSelector } from "@/components/admin/HierarchicalFieldMultiSelector";
import { ProgramLanguageConfig } from "@/components/admin/ProgramLanguageConfig";
import { MonthDaySelector } from "@/components/admin/MonthDaySelector";
import { ProgramRequirementsEditor, getDefaultRequirementsData } from "@/components/admin/ProgramRequirementsEditor";
import type { SubjectRequirements } from "@/components/admin/SubjectRequirementsBuilder";
import type { EnglishLanguageRequirements, GermanLanguageRequirements, InstructionLanguageMode } from "@/types/language-requirements";

interface ProgramField {
  field_of_study_id: string;
  is_primary: boolean;
  field: {
    id: string;
    name: string;
    slug: string;
  };
}

interface Program {
  id: string;
  name: string;
  description?: string;
  degree_type: string;
  degree_level: "bachelor" | "master";
  field_of_study: string;
  field_of_study_id?: string;
  program_fields?: ProgramField[];
  duration_semesters: number;
  ects_credits?: number;
  semester_fees: number;
  tuition_amount?: number;
  tuition_fee_structure?: 'monthly' | 'semester' | 'yearly';
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
  winter_application_open_date?: string;
  summer_application_open_date?: string;
  recognition_weeks_before: number;
  slug?: string;
  created_at?: string;
  updated_at?: string;
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
  const [availableCampuses, setAvailableCampuses] = useState<Array<{
    id: string;
    name: string | null;
    city: { name: string };
    is_main_campus: boolean;
  }>>([]);
  const [loading, setLoading] = useState(true);
  const [editingProgram, setEditingProgram] = useState<Program | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isBulkImporterOpen, setIsBulkImporterOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterUniversity, setFilterUniversity] = useState<string>("all");
  const [filterField, setFilterField] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<'all' | 'draft' | 'published'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'updated_at'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const {
    toast
  } = useToast();
  const [formData, setFormData] = useState<{
    name: string;
    description: string;
    degree_type: string;
    degree_level: "bachelor" | "master";
    field_of_study: string;
    field_of_study_id: string | null;
    field_of_study_ids: string[];
    primary_field_id: string | null;
    duration_semesters: number;
    ects_credits: number;
    semester_fees: number;
    tuition_amount: number;
    tuition_fee_structure: 'monthly' | 'semester' | 'yearly';
    language_of_instruction: string[];
    uni_assist_required: boolean;
    university_id: string;
    published: boolean;
    status: 'draft' | 'published';
    application_method: 'direct' | 'uni_assist_direct' | 'uni_assist_vpd' | 'recognition_certificates';
    program_url: string;
    winter_intake: boolean;
    summer_intake: boolean;
    // Year-agnostic month/day fields
    winter_deadline_month: number | null;
    winter_deadline_day: number | null;
    summer_deadline_month: number | null;
    summer_deadline_day: number | null;
    winter_open_month: number | null;
    winter_open_day: number | null;
    summer_open_month: number | null;
    summer_open_day: number | null;
    recognition_weeks_before: number;
    // Enhanced language config
    instruction_mode: InstructionLanguageMode;
    english_language_requirements: EnglishLanguageRequirements | null;
    german_language_requirements: GermanLanguageRequirements | null;
    campus_ids: string[];
    // Academic requirements
    gpa_minimum: number | null;
    gpa_competitive: number | null;
    gpa_notes: string;
    gmat_required: boolean;
    gmat_minimum: number | null;
    gre_required: boolean;
    gre_minimum_verbal: number | null;
    gre_minimum_quant: number | null;
    gre_minimum_total: number | null;
    accepted_degrees: string[];
    subject_requirements: SubjectRequirements;
    admission_regulations_url: string | null;
    program_flyer_url: string | null;
    module_description_url: string | null;
    // Admission process steps
    admission_test_required: boolean;
    admission_test_details: string | null;
    interview_required: boolean;
    interview_details: string | null;
    // Application fee fields
    has_application_fee: boolean | null;
    application_fee_amount: number | null;
  }>({
    name: "",
    description: "",
    degree_type: "B.A.",
    degree_level: "bachelor",
    field_of_study: "",
    field_of_study_id: null,
    field_of_study_ids: [],
    primary_field_id: null,
    duration_semesters: 6,
    ects_credits: 180,
    semester_fees: 0,
    tuition_amount: 0,
    tuition_fee_structure: 'semester',
    language_of_instruction: ["de"],
    uni_assist_required: false,
    university_id: "",
    published: true,
    status: 'published',
    application_method: "direct",
    program_url: "",
    winter_intake: true,
    summer_intake: false,
    winter_deadline_month: null,
    winter_deadline_day: null,
    summer_deadline_month: null,
    summer_deadline_day: null,
    winter_open_month: null,
    winter_open_day: null,
    summer_open_month: null,
    summer_open_day: null,
    recognition_weeks_before: 10,
    instruction_mode: 'fully_german',
    english_language_requirements: null,
    german_language_requirements: null,
    campus_ids: [],
    // Academic requirements defaults
    ...getDefaultRequirementsData(),
    // Application fee defaults
    has_application_fee: null,
    application_fee_amount: null
  });
  useEffect(() => {
    fetchPrograms();
    fetchUniversities();
  }, []);

  useEffect(() => {
    if (formData.university_id) {
      fetchCampusesForUniversity(formData.university_id);
    } else {
      setAvailableCampuses([]);
    }
  }, [formData.university_id]);

  const fetchCampusesForUniversity = async (universityId: string) => {
    try {
      const { data, error } = await supabase
        .from('university_campuses')
        .select('id, name, is_main_campus, city:cities(name)')
        .eq('university_id', universityId)
        .order('is_main_campus', { ascending: false });
      
      if (error) throw error;
      setAvailableCampuses(data || []);
      
      // Auto-select main campus if only one campus
      if (data && data.length === 1) {
        setFormData(prev => ({ ...prev, campus_ids: [data[0].id] }));
      }
    } catch (error) {
      console.error('Error fetching campuses:', error);
    }
  };
  const fetchPrograms = async () => {
    try {
      const {
        data,
        error
      } = await supabase.from('programs').select(`
          *,
          universities (name, city),
          program_fields:program_fields_of_study(
            field_of_study_id,
            is_primary,
            field:fields_of_study(id, name, slug)
          )
        `).order('name');
      if (error) throw error;

      // Cast data to proper types
      const typedData = (data || []).map(program => ({
        ...program,
        application_method: program.application_method as 'direct' | 'uni_assist_direct' | 'uni_assist_vpd' | 'recognition_certificates',
        tuition_fee_structure: (program.tuition_fee_structure || 'semester') as 'monthly' | 'semester' | 'yearly'
      }));
      setPrograms(typedData);
    } catch (error: any) {
      console.error('Error fetching programs:', error);
      toast({
        title: "Error",
        description: error?.message || "Failed to fetch programs",
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
  const handleSubmit = async (e: React.FormEvent, saveStatus: 'draft' | 'published' = 'published') => {
    e.preventDefault();
    try {
      // Validate fields selection
      if (formData.field_of_study_ids.length === 0) {
        toast({
          title: "Error",
          description: "Please select at least one field of study",
          variant: "destructive"
        });
        return;
      }

      // Generate slug from program name
      const baseSlug = slugify(formData.name);
      
      // Check for slug conflicts and add suffix if needed
      let slug = baseSlug;
      let counter = 1;
      while (true) {
        const { data: existing } = await supabase
          .from('programs')
          .select('id')
          .eq('slug', slug)
          .maybeSingle();
        
        // If editing, allow the same slug for this program
        if (!existing || (editingProgram && existing.id === editingProgram.id)) {
          break;
        }
        
        slug = `${baseSlug}-${counter}`;
        counter++;
      }
      
      // Build submit data with new month/day fields
      const submitData = {
        ...formData,
        slug,
        status: saveStatus,
        tuition_amount: formData.tuition_amount,
        tuition_fee_structure: formData.tuition_fee_structure,
        semester_fees: formData.tuition_amount, // Keep for backward compatibility
        // New month/day fields
        winter_deadline_month: formData.winter_deadline_month,
        winter_deadline_day: formData.winter_deadline_day,
        summer_deadline_month: formData.summer_deadline_month,
        summer_deadline_day: formData.summer_deadline_day,
        winter_open_month: formData.winter_open_month,
        winter_open_day: formData.winter_open_day,
        summer_open_month: formData.summer_open_month,
        summer_open_day: formData.summer_open_day,
        // Language config
        instruction_mode: formData.instruction_mode,
        english_language_requirements: formData.english_language_requirements as any,
        german_language_requirements: formData.german_language_requirements as any,
        // Academic requirements
        gpa_minimum: formData.gpa_minimum,
        gpa_competitive: formData.gpa_competitive,
        gpa_notes: formData.gpa_notes || null,
        gmat_required: formData.gmat_required,
        gmat_minimum: formData.gmat_minimum,
        gre_required: formData.gre_required,
        gre_minimum_verbal: formData.gre_minimum_verbal,
        gre_minimum_quant: formData.gre_minimum_quant,
        gre_minimum_total: formData.gre_minimum_total,
        accepted_degrees: formData.accepted_degrees,
        subject_requirements: formData.subject_requirements as any,
        admission_regulations_url: formData.admission_regulations_url,
        program_flyer_url: formData.program_flyer_url,
        module_description_url: formData.module_description_url,
        // Application fee fields - only set for direct application
        has_application_fee: formData.application_method === 'direct' ? formData.has_application_fee : null,
        application_fee_amount: formData.application_method === 'direct' && formData.has_application_fee ? formData.application_fee_amount : null
      };

      // Remove fields that belong to the junction table, not the programs table
      delete (submitData as any).field_of_study_ids;
      delete (submitData as any).primary_field_id;
      delete (submitData as any).campus_ids;

      let programId: string;

      if (editingProgram) {
        const { error } = await supabase
          .from('programs')
          .update(submitData as any)
          .eq('id', editingProgram.id);
        if (error) throw error;
        if (error) throw error;
        programId = editingProgram.id;
      } else {
        const { data, error } = await supabase
          .from('programs')
          .insert(submitData as any)
          .select()
          .single();
        if (error) throw error;
        programId = data.id;
      }
      await supabase
        .from('program_fields_of_study')
        .delete()
        .eq('program_id', programId);

      // Insert new field associations
      const fieldAssociations = formData.field_of_study_ids.map(fieldId => ({
        program_id: programId,
        field_of_study_id: fieldId,
        is_primary: fieldId === formData.primary_field_id
      }));

      const { error: fieldsError } = await supabase
        .from('program_fields_of_study')
        .insert(fieldAssociations);

      if (fieldsError) throw fieldsError;

      // Delete existing campus associations
      await supabase
        .from('program_campuses')
        .delete()
        .eq('program_id', programId);

      // Insert new campus associations
      if (formData.campus_ids.length > 0) {
        const campusAssociations = formData.campus_ids.map(campusId => ({
          program_id: programId,
          campus_id: campusId,
          auto_migrated: false,
          migration_date: new Date().toISOString()
        }));

        const { error: campusError } = await supabase
          .from('program_campuses')
          .insert(campusAssociations);

        if (campusError) throw campusError;
      }

      toast({
        title: "Success",
        description: editingProgram ? "Program updated successfully" : "Program created successfully"
      });

      resetForm();
      fetchPrograms();
    } catch (error: any) {
      console.error('Error saving program:', error);
      
      // Extract meaningful error message
      const errorMessage = error?.message || 
                           error?.error_description || 
                           error?.details || 
                           "Failed to save program";
      
      toast({
        title: "Error",
        description: errorMessage,
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
  const handleEdit = async (program: Program) => {
    setEditingProgram(program);
    
    // Extract field IDs and primary from program_fields
    const fieldIds = program.program_fields?.map(pf => pf.field_of_study_id) || [];
    const primaryFieldId = program.program_fields?.find(pf => pf.is_primary)?.field_of_study_id || null;
    
    // Fetch existing campus associations
    const { data: campusData, error: campusError } = await supabase
      .from('program_campuses')
      .select('campus_id')
      .eq('program_id', program.id);
    
    const campusIds = campusData?.map(pc => pc.campus_id) || [];
    
    setFormData({
      name: program.name,
      description: program.description || "",
      degree_type: program.degree_type,
      degree_level: program.degree_level,
      field_of_study: program.field_of_study,
      field_of_study_id: program.field_of_study_id || null,
      field_of_study_ids: fieldIds,
      primary_field_id: primaryFieldId,
      duration_semesters: program.duration_semesters,
      ects_credits: program.ects_credits || 180,
      semester_fees: program.semester_fees,
      tuition_amount: program.tuition_amount || program.semester_fees,
      tuition_fee_structure: program.tuition_fee_structure || 'semester',
      language_of_instruction: program.language_of_instruction,
      uni_assist_required: program.uni_assist_required,
      university_id: program.university_id,
      published: program.published,
      status: (program as any).status || 'published',
      application_method: program.application_method || 'direct',
      program_url: program.program_url || '',
      winter_intake: program.winter_intake,
      summer_intake: program.summer_intake,
      // New month/day fields
      winter_deadline_month: (program as any).winter_deadline_month || null,
      winter_deadline_day: (program as any).winter_deadline_day || null,
      summer_deadline_month: (program as any).summer_deadline_month || null,
      summer_deadline_day: (program as any).summer_deadline_day || null,
      winter_open_month: (program as any).winter_open_month || null,
      winter_open_day: (program as any).winter_open_day || null,
      summer_open_month: (program as any).summer_open_month || null,
      summer_open_day: (program as any).summer_open_day || null,
      recognition_weeks_before: program.recognition_weeks_before || 10,
      // Enhanced language config
      instruction_mode: (program as any).instruction_mode || 'fully_german',
      english_language_requirements: (program as any).english_language_requirements || null,
      german_language_requirements: (program as any).german_language_requirements || null,
      campus_ids: campusIds,
      // Academic requirements
      gpa_minimum: (program as any).gpa_minimum || null,
      gpa_competitive: (program as any).gpa_competitive || null,
      gpa_notes: (program as any).gpa_notes || '',
      gmat_required: (program as any).gmat_required || false,
      gmat_minimum: (program as any).gmat_minimum || null,
      gre_required: (program as any).gre_required || false,
      gre_minimum_verbal: (program as any).gre_minimum_verbal || null,
      gre_minimum_quant: (program as any).gre_minimum_quant || null,
      gre_minimum_total: (program as any).gre_minimum_total || null,
      accepted_degrees: (program as any).accepted_degrees || [],
      subject_requirements: (program as any).subject_requirements || { total_ects: 180, subject_areas: [] },
      admission_regulations_url: (program as any).admission_regulations_url || null,
      program_flyer_url: (program as any).program_flyer_url || null,
      module_description_url: (program as any).module_description_url || null,
      // Admission process steps
      admission_test_required: (program as any).admission_test_required || false,
      admission_test_details: (program as any).admission_test_details || null,
      interview_required: (program as any).interview_required || false,
      interview_details: (program as any).interview_details || null,
      // Application fee fields
      has_application_fee: (program as any).has_application_fee ?? null,
      application_fee_amount: (program as any).application_fee_amount || null
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
      field_of_study_id: null,
      field_of_study_ids: [],
      primary_field_id: null,
      duration_semesters: 6,
      ects_credits: 180,
      semester_fees: 0,
      tuition_amount: 0,
      tuition_fee_structure: 'semester',
      language_of_instruction: ["de"],
      uni_assist_required: false,
      university_id: "",
      published: true,
      status: 'published',
      application_method: "direct",
      program_url: "",
      winter_intake: true,
      summer_intake: false,
      winter_deadline_month: null,
      winter_deadline_day: null,
      summer_deadline_month: null,
      summer_deadline_day: null,
      winter_open_month: null,
      winter_open_day: null,
      summer_open_month: null,
      summer_open_day: null,
      recognition_weeks_before: 10,
      instruction_mode: 'fully_german',
      english_language_requirements: null,
      german_language_requirements: null,
      campus_ids: [],
      // Reset academic requirements
      ...getDefaultRequirementsData(),
      // Reset application fee
      has_application_fee: null,
      application_fee_amount: null
    });
    setIsDialogOpen(false);
  };

  const importComprehensivePrograms = async () => {
    setLoading(true);
    try {
      // First, delete existing programs to avoid duplicates
      const { error: deleteError } = await supabase
        .from('programs')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all programs
      
      if (deleteError) {
        console.warn('Could not clear existing programs:', deleteError);
      }

      const comprehensivePrograms = [
        // A. TH Aschaffenburg (004e52c6-5b0d-4ebe-9bd8-2a815057d4ed)
        {
          name: "Software Design International",
          field_of_study: "Computer Science; Software Engineering; IT Security; Data Science; Artificial Intelligence",
          degree_type: "B.Sc.",
          degree_level: "bachelor" as const,
          duration_semesters: 7,
          ects_credits: 210,
          language_of_instruction: ["en"],
          winter_intake: true,
          winter_deadline: "2025-05-31",
          application_method: "direct" as const,
          uni_assist_required: false,
          published: true,
          semester_fees: 70,
          program_url: "https://www.th-ab.de/fileadmin/th-ab-redaktion/Infomaterial/infomaterial-flyer-studiengang-sdi-bachelor.pdf",
          university_id: "004e52c6-5b0d-4ebe-9bd8-2a815057d4ed"
        },
        {
          name: "International Management",
          field_of_study: "Management; Human Resource Management; Marketing; Law; Intercultural Communication",
          degree_type: "M.A.",
          degree_level: "master" as const,
          duration_semesters: 3,
          ects_credits: 90,
          language_of_instruction: ["en"],
          winter_intake: true,
          summer_intake: true,
          application_method: "direct" as const,
          uni_assist_required: false,
          published: true,
          semester_fees: 70,
          program_url: "https://www.th-ab.de/fileadmin/th-ab-redaktion/Infomaterial/infomaterial-flyer-studiengang-intm-master-eng.pdf",
          university_id: "004e52c6-5b0d-4ebe-9bd8-2a815057d4ed"
        },
        {
          name: "MERCURI – European Master in Customer Relationship Marketing",
          field_of_study: "Marketing; Customer Relationship Marketing; Consumer Behavior; Data Mining",
          degree_type: "M.A.",
          degree_level: "master" as const,
          duration_semesters: 4,
          ects_credits: 180,
          language_of_instruction: ["en"],
          winter_intake: true,
          application_method: "direct" as const,
          uni_assist_required: false,
          published: true,
          semester_fees: 1000,
          program_url: "https://mastermercuri.eu/entry-requirements-and-recruitment/",
          university_id: "004e52c6-5b0d-4ebe-9bd8-2a815057d4ed"
        },
        {
          name: "International Renewable Energy Project Development",
          field_of_study: "Renewable Energy; Project Development; Management; Regulation; Technology",
          degree_type: "M.Eng.",
          degree_level: "master" as const,
          duration_semesters: 3,
          ects_credits: 90,
          language_of_instruction: ["en"],
          summer_intake: true,
          summer_deadline: "2024-11-15",
          application_method: "direct" as const,
          uni_assist_required: false,
          published: true,
          semester_fees: 70,
          university_id: "004e52c6-5b0d-4ebe-9bd8-2a815057d4ed"
        },
        
        // B. Hochschule Fresenius (0050d04c-14b7-4020-8e67-a8af085f43a8)
        {
          name: "International Business Management",
          field_of_study: "Business Management; Economics",
          degree_type: "B.A.",
          degree_level: "bachelor" as const,
          duration_semesters: 6,
          ects_credits: 180,
          language_of_instruction: ["en"],
          winter_intake: true,
          summer_intake: true,
          application_method: "direct" as const,
          uni_assist_required: false,
          published: true,
          semester_fees: 950,
          delivery_mode: "on_campus",
          university_id: "0050d04c-14b7-4020-8e67-a8af085f43a8"
        },
        {
          name: "Computer Science (Fresenius)",
          field_of_study: "Computer Science; Cyber Security",
          degree_type: "M.Sc.",
          degree_level: "master" as const,
          duration_semesters: 4,
          ects_credits: 120,
          language_of_instruction: ["en"],
          winter_intake: true,
          summer_intake: true,
          application_method: "direct" as const,
          uni_assist_required: false,
          published: true,
          semester_fees: 880,
          delivery_mode: "on_campus",
          university_id: "0050d04c-14b7-4020-8e67-a8af085f43a8"
        },
        {
          name: "Biochemical Engineering",
          field_of_study: "Biochemical Engineering; Process Optimization; Pharmaceuticals; Chemical Industries",
          degree_type: "M.Eng.",
          degree_level: "master" as const,
          duration_semesters: 4,
          ects_credits: 120,
          language_of_instruction: ["en"],
          winter_intake: true,
          summer_intake: true,
          application_method: "direct" as const,
          uni_assist_required: false,
          published: true,
          semester_fees: 880,
          delivery_mode: "on_campus",
          university_id: "0050d04c-14b7-4020-8e67-a8af085f43a8"
        },
        
        // C. Munich Business School (00940d36-d1b1-40d0-ab6e-d6c227d2b6ca)
        {
          name: "Bachelor International Business",
          field_of_study: "Business Administration; Economics; Management; Finance; Marketing; Entrepreneurship",
          degree_type: "B.A.",
          degree_level: "bachelor" as const,
          duration_semesters: 6,
          ects_credits: 210,
          language_of_instruction: ["en"],
          winter_intake: true,
          summer_intake: true,
          winter_deadline: "2025-07-15",
          summer_deadline: "2024-12-15",
          application_method: "direct" as const,
          uni_assist_required: false,
          published: true,
          semester_fees: 6965,
          university_id: "00940d36-d1b1-40d0-ab6e-d6c227d2b6ca"
        },
        {
          name: "Master of Business Administration",
          field_of_study: "Business Administration; Management; Leadership; International Business",
          degree_type: "MBA",
          degree_level: "master" as const,
          duration_semesters: 2,
          ects_credits: 60,
          language_of_instruction: ["en"],
          winter_intake: true,
          summer_intake: true,
          application_method: "direct" as const,
          uni_assist_required: false,
          published: true,
          semester_fees: 2666,
          university_id: "00940d36-d1b1-40d0-ab6e-d6c227d2b6ca"
        },
        {
          name: "Master International Marketing and Brand Management",
          field_of_study: "Marketing; Brand Management; Digital Marketing; Customer Behavior",
          degree_type: "M.A.",
          degree_level: "master" as const,
          duration_semesters: 3,
          ects_credits: 90,
          language_of_instruction: ["en"],
          winter_intake: true,
          summer_intake: true,
          application_method: "direct" as const,
          uni_assist_required: false,
          published: true,
          semester_fees: 8580,
          university_id: "00940d36-d1b1-40d0-ab6e-d6c227d2b6ca"
        },
        
        // E. SRH Fernhochschule (031e4c61-1592-4688-9003-bf7f702e0479)
        {
          name: "Industrial Engineering",
          field_of_study: "Industrial Engineering; Management; Economics; Legal aspects",
          degree_type: "B.Sc.",
          degree_level: "bachelor" as const,
          duration_semesters: 6,
          ects_credits: 180,
          language_of_instruction: ["en"],
          winter_intake: true,
          summer_intake: true,
          application_method: "direct" as const,
          uni_assist_required: false,
          published: true,
          semester_fees: 235,
          delivery_mode: "online",
          university_id: "031e4c61-1592-4688-9003-bf7f702e0479"
        },
        {
          name: "Global Business Administration",
          field_of_study: "Business Administration",
          degree_type: "MBA",
          degree_level: "master" as const,
          duration_semesters: 4,
          ects_credits: 120,
          language_of_instruction: ["en"],
          winter_intake: true,
          summer_intake: true,
          application_method: "direct" as const,
          uni_assist_required: false,
          published: true,
          semester_fees: 400,
          delivery_mode: "online",
          university_id: "031e4c61-1592-4688-9003-bf7f702e0479"
        },
        {
          name: "UX & Service Design",
          field_of_study: "User Experience Design; Service Design; Innovation; Technology; Management",
          degree_type: "M.A.",
          degree_level: "master" as const,
          duration_semesters: 3,
          ects_credits: 90,
          language_of_instruction: ["en"],
          winter_intake: true,
          summer_intake: true,
          application_method: "direct" as const,
          uni_assist_required: false,
          published: true,
          semester_fees: 500,
          delivery_mode: "online",
          university_id: "031e4c61-1592-4688-9003-bf7f702e0479"
        },
        
        // F. JMU Würzburg (05e44d0b-7409-4da6-8624-5c28c72aea70) - Major Programs Selection
        {
          name: "Diversity, Ethics and Religions",
          field_of_study: "Diversity Studies; Ethics; Religious Studies; Intercultural Studies",
          degree_type: "B.A.",
          degree_level: "bachelor" as const,
          duration_semesters: 6,
          ects_credits: 180,
          language_of_instruction: ["en"],
          winter_intake: true,
          winter_deadline: "2025-07-15",
          application_method: "uni_assist_vpd" as const,
          uni_assist_required: true,
          published: true,
          semester_fees: 374,
          university_id: "05e44d0b-7409-4da6-8624-5c28c72aea70"
        },
        {
          name: "Aerospace Informatics",
          field_of_study: "Aerospace Engineering; Informatics; Satellite Technology; Space Systems",
          degree_type: "M.Sc.",
          degree_level: "master" as const,
          duration_semesters: 4,
          ects_credits: 120,
          language_of_instruction: ["en"],
          winter_intake: true,
          summer_intake: true,
          winter_deadline: "2025-07-15",
          summer_deadline: "2025-01-15",
          application_method: "uni_assist_vpd" as const,
          uni_assist_required: true,
          published: true,
          semester_fees: 374,
          university_id: "05e44d0b-7409-4da6-8624-5c28c72aea70"
        },
        {
          name: "Artificial Intelligence & Extended Reality",
          field_of_study: "Artificial Intelligence; Virtual Reality; Augmented Reality; Extended Reality; Computer Science",
          degree_type: "M.Sc.",
          degree_level: "master" as const,
          duration_semesters: 4,
          ects_credits: 120,
          language_of_instruction: ["en"],
          winter_intake: true,
          winter_deadline: "2025-03-15",
          application_method: "uni_assist_vpd" as const,
          uni_assist_required: true,
          published: true,
          semester_fees: 374,
          university_id: "05e44d0b-7409-4da6-8624-5c28c72aea70"
        },
        {
          name: "Computer Science (Würzburg)",
          field_of_study: "Computer Science; Software Engineering",
          degree_type: "M.Sc.",
          degree_level: "master" as const,
          duration_semesters: 4,
          ects_credits: 120,
          language_of_instruction: ["en"],
          winter_intake: true,
          summer_intake: true,
          winter_deadline: "2024-10-15",
          summer_deadline: "2025-04-15",
          application_method: "uni_assist_vpd" as const,
          uni_assist_required: true,
          published: true,
          semester_fees: 374,
          university_id: "05e44d0b-7409-4da6-8624-5c28c72aea70"
        },
        {
          name: "Biochemistry",
          field_of_study: "Biochemistry; Molecular Biology; Chemical Biology; Life Sciences",
          degree_type: "M.Sc.",
          degree_level: "master" as const,
          duration_semesters: 4,
          ects_credits: 120,
          language_of_instruction: ["en"],
          winter_intake: true,
          winter_deadline: "2025-06-01",
          application_method: "uni_assist_vpd" as const,
          uni_assist_required: true,
          published: true,
          semester_fees: 374,
          university_id: "05e44d0b-7409-4da6-8624-5c28c72aea70"
        },
        
        // G. TH Deggendorf (036ccf51-2c83-44c7-ad61-15a6af1a71ce) - Selection of key programs
        {
          name: "International Management (Deggendorf)",
          field_of_study: "Management; Marketing",
          degree_type: "B.A.",
          degree_level: "bachelor" as const,
          duration_semesters: 7,
          ects_credits: 210,
          language_of_instruction: ["en"],
          winter_intake: true,
          winter_deadline: "2025-07-15",
          application_method: "direct" as const,
          uni_assist_required: false,
          published: true,
          semester_fees: 60,
          university_id: "036ccf51-2c83-44c7-ad61-15a6af1a71ce"
        },
        {
          name: "Artificial Intelligence",
          field_of_study: "Artificial Intelligence; Machine Learning; Deep Learning; Data Science; Neural Networks",
          degree_type: "B.Sc.",
          degree_level: "bachelor" as const,
          duration_semesters: 7,
          ects_credits: 210,
          language_of_instruction: ["en"],
          winter_intake: true,
          application_method: "direct" as const,
          uni_assist_required: false,
          published: true,
          semester_fees: 60,
          university_id: "036ccf51-2c83-44c7-ad61-15a6af1a71ce"
        },
        {
          name: "Artificial Intelligence and Data Science",
          field_of_study: "Artificial Intelligence; Data Science; Machine Learning; Big Data; Analytics",
          degree_type: "M.Sc.",
          degree_level: "master" as const,
          duration_semesters: 3,
          ects_credits: 90,
          language_of_instruction: ["en"],
          winter_intake: true,
          summer_intake: true,
          application_method: "direct" as const,
          uni_assist_required: false,
          published: true,
          semester_fees: 60,
          university_id: "036ccf51-2c83-44c7-ad61-15a6af1a71ce"
        },
        {
          name: "Digital Health",
          field_of_study: "Digital Health; Health Informatics; Medical Technology; Healthcare Systems",
          degree_type: "M.Sc.",
          degree_level: "master" as const,
          duration_semesters: 3,
          ects_credits: 90,
          language_of_instruction: ["en"],
          winter_intake: true,
          summer_intake: true,
          application_method: "direct" as const,
          uni_assist_required: false,
          published: true,
          semester_fees: 60,
          university_id: "036ccf51-2c83-44c7-ad61-15a6af1a71ce"
        },
        
        // I. TH OWL (08b8fc16-60d6-4d6e-9e52-a586069bb68b)
        {
          name: "General Engineering",
          field_of_study: "Engineering; Computer Science; Food Technology; Mechanical Engineering; Life Sciences",
          degree_type: "B.Sc.",
          degree_level: "bachelor" as const,
          duration_semesters: 8,
          ects_credits: 240,
          language_of_instruction: ["en", "de"],
          winter_intake: true,
          winter_deadline: "2025-08-15",
          application_method: "direct" as const,
          uni_assist_required: false,
          published: true,
          semester_fees: 374,
          university_id: "08b8fc16-60d6-4d6e-9e52-a586069bb68b"
        },
        {
          name: "Information Technology",
          field_of_study: "Information Technology; Computer Science; AI; Management; Business Administration",
          degree_type: "M.Sc.",
          degree_level: "master" as const,
          duration_semesters: 4,
          ects_credits: 120,
          language_of_instruction: ["en"],
          winter_intake: true,
          summer_intake: true,
          application_method: "direct" as const,
          uni_assist_required: false,
          published: true,
          semester_fees: 374,
          university_id: "08b8fc16-60d6-4d6e-9e52-a586069bb68b"
        },
        
        // J. PFH Göttingen (08df20bb-69b9-405f-9a6e-a9ada9e64dd6) - Selection of programs
        {
          name: "MBA Business Administration",
          field_of_study: "Business Administration; Leadership; Management; Strategy",
          degree_type: "MBA",
          degree_level: "master" as const,
          duration_semesters: 3,
          ects_credits: 90,
          language_of_instruction: ["en"],
          winter_intake: true,
          summer_intake: true,
          application_method: "direct" as const,
          uni_assist_required: false,
          published: true,
          semester_fees: 5940,
          delivery_mode: "online",
          university_id: "08df20bb-69b9-405f-9a6e-a9ada9e64dd6"
        },
        {
          name: "General Management",
          field_of_study: "Management; Business Strategy; Leadership; Operations",
          degree_type: "M.Sc.",
          degree_level: "master" as const,
          duration_semesters: 3,
          ects_credits: 90,
          language_of_instruction: ["en"],
          winter_intake: true,
          summer_intake: true,
          application_method: "direct" as const,
          uni_assist_required: false,
          published: true,
          semester_fees: 4800,
          university_id: "08df20bb-69b9-405f-9a6e-a9ada9e64dd6"
        },
        {
          name: "UX Design & Management",
          field_of_study: "UX Design; User Experience; Design Management; Product Design",
          degree_type: "M.Sc.",
          degree_level: "master" as const,
          duration_semesters: 3,
          ects_credits: 90,
          language_of_instruction: ["en"],
          winter_intake: true,
          summer_intake: true,
          application_method: "direct" as const,
          uni_assist_required: false,
          published: true,
          semester_fees: 4800,
          university_id: "08df20bb-69b9-405f-9a6e-a9ada9e64dd6"
        },
        {
          name: "Digitalization & Automation",
          field_of_study: "Digitalization; Automation; Industry 4.0; Process Management",
          degree_type: "M.Sc.",
          degree_level: "master" as const,
          duration_semesters: 4,
          ects_credits: 120,
          language_of_instruction: ["en"],
          winter_intake: true,
          application_method: "direct" as const,
          uni_assist_required: false,
          published: true,
          semester_fees: 5400,
          university_id: "08df20bb-69b9-405f-9a6e-a9ada9e64dd6"
        }
      ];

      // Process programs and insert them
      let successCount = 0;
      let errors: string[] = [];

      for (const program of comprehensivePrograms) {
        try {
          // Generate slug for the program
          const slug = program.name.toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '');

          const programData = {
            name: program.name,
            field_of_study: program.field_of_study.split(';').slice(0, 2).map(f => f.trim()).join('; '), // Simplify to first 2 fields
            degree_type: program.degree_type,
            degree_level: program.degree_level,
            duration_semesters: program.duration_semesters,
            ects_credits: program.ects_credits,
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
            delivery_mode: program.delivery_mode || "on_campus",
            university_id: program.university_id,
            recognition_weeks_before: 10,
            slug: slug
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
          description: `Successfully imported all ${successCount} comprehensive programs!`
        });
      }

      fetchPrograms();
    } catch (error) {
      console.error('Error importing comprehensive programs:', error);
      toast({
        title: "Error",
        description: "Failed to import comprehensive programs",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  const filteredPrograms = programs
    .filter(program => {
      // Search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch = program.name.toLowerCase().includes(searchLower) ||
          program.field_of_study.toLowerCase().includes(searchLower) ||
          program.universities?.name.toLowerCase().includes(searchLower);
        if (!matchesSearch) return false;
      }
      
      // Status filter
      if (statusFilter !== 'all') {
        if ((program as any).status !== statusFilter) return false;
      }
      
      // University filter
      if (filterUniversity && filterUniversity !== "all" && program.university_id !== filterUniversity) {
        return false;
      }
      
      // Field filter
      if (filterField) {
        const fieldLower = filterField.toLowerCase();
        const matchesField = program.field_of_study?.toLowerCase().includes(fieldLower) ||
          program.program_fields?.some(pf => 
            pf.field.name.toLowerCase().includes(fieldLower)
          );
        if (!matchesField) return false;
      }
      
      return true;
    })
    .sort((a, b) => {
      let comparison = 0;
      
      if (sortBy === 'name') {
        comparison = a.name.localeCompare(b.name);
      } else if (sortBy === 'updated_at') {
        const aDate = new Date(a.updated_at || a.created_at || 0).getTime();
        const bDate = new Date(b.updated_at || b.created_at || 0).getTime();
        comparison = aDate - bDate;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });
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
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setIsBulkImporterOpen(true)} className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Bulk Import
          </Button>
          <Button onClick={() => setIsDialogOpen(true)} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add Program
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-4 flex-wrap">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input placeholder="Search programs..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10" />
        </div>
        
        <Select value={filterUniversity} onValueChange={setFilterUniversity}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="All Universities" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Universities</SelectItem>
            {universities.map(uni => (
              <SelectItem key={uni.id} value={uni.id}>{uni.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <Input 
          placeholder="Filter by field..." 
          value={filterField}
          onChange={(e) => setFilterField(e.target.value)}
          className="w-[200px]"
        />
        
        <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="published">Published</SelectItem>
            <SelectItem value="draft">Drafts</SelectItem>
          </SelectContent>
        </Select>
        
        <Select value={sortBy} onValueChange={(v) => setSortBy(v as 'name' | 'updated_at')}>
          <SelectTrigger className="w-[150px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="name">Sort by Name</SelectItem>
            <SelectItem value="updated_at">Sort by Modified</SelectItem>
          </SelectContent>
        </Select>
        
        <Select value={sortOrder} onValueChange={(v) => setSortOrder(v as 'asc' | 'desc')}>
          <SelectTrigger className="w-[120px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="asc">Ascending</SelectItem>
            <SelectItem value="desc">Descending</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-6">
        {/* Import Tools */}
        <Card>
          <CardHeader>
            <CardTitle>Import Programs</CardTitle>
            <p className="text-sm text-muted-foreground">
              Import programs from various sources
            </p>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-4">
            <Button onClick={importComprehensivePrograms}>
              Import Comprehensive Database
            </Button>
            {filterUniversity !== 'all' && (
              <ProgramScraper 
                universityId={filterUniversity}
                universityName={universities.find(u => u.id === filterUniversity)?.name || 'Selected University'}
                onProgramsImported={fetchPrograms}
              />
            )}
            {filterUniversity === 'all' && (
              <p className="text-sm text-muted-foreground self-center">
                Select a university to enable web scraping
              </p>
            )}
          </CardContent>
        </Card>

        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPrograms.map(program => <Card key={program.id} className="hover:shadow-medium transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <CardTitle className="text-lg">{program.name}</CardTitle>
                {(program as any).status === 'draft' && (
                  <Badge variant="secondary" className="text-xs">Draft</Badge>
                )}
              </div>
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
                
                {program.program_fields && program.program_fields.length > 0 && (
                  <div>
                    <strong>Fields of Study:</strong>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {program.program_fields.map(pf => (
                        <Badge 
                          key={pf.field_of_study_id} 
                          variant={pf.is_primary ? "default" : "secondary"}
                          className="text-xs"
                        >
                          {pf.field.name}
                          {pf.is_primary && " ⭐"}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                
                <div>
                  <strong>Semester Fees:</strong>{' '}
                  {(() => {
                    const amount = program.tuition_amount !== undefined && program.tuition_amount !== null 
                      ? program.tuition_amount 
                      : program.semester_fees;
                    const structure = program.tuition_fee_structure || 'semester';
                    return amount === 0 ? 'Free' : formatTuitionDisplay(amount, structure);
                  })()}
                </div>
                
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
                <SearchableSelect
                  value={formData.university_id}
                  onValueChange={(value) => setFormData({
                    ...formData,
                    university_id: value
                  })}
                  options={universities.map(uni => ({
                    value: uni.id,
                    label: `${uni.name} - ${uni.city}`
                  }))}
                  placeholder="Search and select university..."
                  emptyText="No university found"
                />
              </div>
            </div>

            {/* Campus Selection */}
            {formData.university_id && availableCampuses.length > 0 && (
              <div>
                <Label>Available at Campus(es) *</Label>
                <div className="mt-2 space-y-2 border rounded-md p-3">
                  {availableCampuses.map((campus) => (
                    <div key={campus.id} className="flex items-center gap-2">
                      <Checkbox
                        id={`campus-${campus.id}`}
                        checked={formData.campus_ids.includes(campus.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setFormData({
                              ...formData,
                              campus_ids: [...formData.campus_ids, campus.id]
                            });
                          } else {
                            setFormData({
                              ...formData,
                              campus_ids: formData.campus_ids.filter(id => id !== campus.id)
                            });
                          }
                        }}
                      />
                      <Label 
                        htmlFor={`campus-${campus.id}`}
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <span>{campus.name || 'Main Campus'}</span>
                        <Badge variant="outline" className="text-xs">
                          {campus.city.name}
                        </Badge>
                        {campus.is_main_campus && (
                          <Badge variant="default" className="text-xs">Main</Badge>
                        )}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {formData.university_id && availableCampuses.length === 0 && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  No campuses found for this university. Please add campuses in University Management first.
                </AlertDescription>
              </Alert>
            )}

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

            <div>
              <Label>Fields of Study</Label>
              <HierarchicalFieldMultiSelector
                selectedFieldIds={formData.field_of_study_ids}
                primaryFieldId={formData.primary_field_id}
                onChange={(fieldIds, primaryId) => {
                  setFormData({
                    ...formData,
                    field_of_study_ids: fieldIds,
                    primary_field_id: primaryId
                  });
                }}
                required
              />
            </div>

            <div>
              <Label htmlFor="program_url">Program URL</Label>
              <Input id="program_url" type="url" value={formData.program_url} onChange={e => setFormData({
              ...formData,
              program_url: e.target.value
            })} placeholder="https://university.edu/program" />
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

              {/* Application Fee for Uni-Assist */}
              {(formData.application_method === 'uni_assist_direct' || formData.application_method === 'uni_assist_vpd') && (
                <Alert className="mt-2 border-blue-200 bg-blue-50">
                  <Info className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-blue-800">
                    <strong>Standard Uni-Assist application fees apply:</strong>
                    <ul className="list-disc ml-4 mt-1 text-sm">
                      <li>€75 for the first application</li>
                      <li>€30 for each additional application</li>
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

              {/* Application Fee for Direct Application */}
              {formData.application_method === 'direct' && (
                <div className="mt-3 p-3 border rounded-lg bg-muted/30 space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="has_application_fee"
                      checked={formData.has_application_fee === true}
                      onCheckedChange={(checked) => setFormData({
                        ...formData,
                        has_application_fee: checked ? true : false,
                        application_fee_amount: checked ? formData.application_fee_amount : null
                      })}
                    />
                    <Label htmlFor="has_application_fee" className="cursor-pointer">
                      This program has an application fee
                    </Label>
                  </div>
                  
                  {formData.has_application_fee === true && (
                    <div className="flex items-center gap-2">
                      <Label htmlFor="application_fee_amount" className="whitespace-nowrap">Fee Amount:</Label>
                      <div className="relative flex-1 max-w-[150px]">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">€</span>
                        <Input
                          id="application_fee_amount"
                          type="number"
                          min="0"
                          step="0.01"
                          className="pl-7"
                          value={formData.application_fee_amount || ''}
                          onChange={(e) => setFormData({
                            ...formData,
                            application_fee_amount: e.target.value ? parseFloat(e.target.value) : null
                          })}
                          placeholder="0.00"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}
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

            <div className="grid grid-cols-1 gap-6">
              {formData.winter_intake && (
                <div className="space-y-4 p-4 border rounded-lg bg-muted/20">
                  <h4 className="font-medium text-lg">Winter Intake Period</h4>
                  <p className="text-sm text-muted-foreground">Set dates as month and day - they will automatically apply to each year.</p>
                  <div className="grid grid-cols-2 gap-4">
                    <MonthDaySelector
                      label="Application Opens"
                      month={formData.winter_open_month}
                      day={formData.winter_open_day}
                      onMonthChange={(m) => setFormData({ ...formData, winter_open_month: m })}
                      onDayChange={(d) => setFormData({ ...formData, winter_open_day: d })}
                      intake="winter"
                      dateType="opening"
                    />
                    <MonthDaySelector
                      label="Application Deadline"
                      month={formData.winter_deadline_month}
                      day={formData.winter_deadline_day}
                      onMonthChange={(m) => setFormData({ ...formData, winter_deadline_month: m })}
                      onDayChange={(d) => setFormData({ ...formData, winter_deadline_day: d })}
                      intake="winter"
                    />
                  </div>
                </div>
              )}
              
              {formData.summer_intake && (
                <div className="space-y-4 p-4 border rounded-lg bg-muted/20">
                  <h4 className="font-medium text-lg">Summer Intake Period</h4>
                  <p className="text-sm text-muted-foreground">Set dates as month and day - they will automatically apply to each year.</p>
                  <div className="grid grid-cols-2 gap-4">
                    <MonthDaySelector
                      label="Application Opens"
                      month={formData.summer_open_month}
                      day={formData.summer_open_day}
                      onMonthChange={(m) => setFormData({ ...formData, summer_open_month: m })}
                      onDayChange={(d) => setFormData({ ...formData, summer_open_day: d })}
                      intake="summer"
                      dateType="opening"
                    />
                    <MonthDaySelector
                      label="Application Deadline"
                      month={formData.summer_deadline_month}
                      day={formData.summer_deadline_day}
                      onMonthChange={(m) => setFormData({ ...formData, summer_deadline_month: m })}
                      onDayChange={(d) => setFormData({ ...formData, summer_deadline_day: d })}
                      intake="summer"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Language of Instruction Configuration */}
            <ProgramLanguageConfig
              instructionMode={formData.instruction_mode}
              englishRequirements={formData.english_language_requirements}
              germanRequirements={formData.german_language_requirements}
              onInstructionModeChange={(mode) => {
                // Update language_of_instruction array based on mode for backward compatibility
                let langs: string[] = [];
                if (mode === 'fully_english') langs = ['en'];
                else if (mode === 'fully_german') langs = ['de'];
                else if (mode === 'mostly_english') langs = ['en'];
                else if (mode === 'hybrid' || mode === 'either_or') langs = ['en', 'de'];
                
                setFormData({ 
                  ...formData, 
                  instruction_mode: mode,
                  language_of_instruction: langs
                });
              }}
              onEnglishRequirementsChange={(value) => setFormData({ ...formData, english_language_requirements: value })}
              onGermanRequirementsChange={(value) => setFormData({ ...formData, german_language_requirements: value })}
            />

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
                  <Label htmlFor="tuition_fee_structure">Tuition Fee Structure</Label>
                  <Select
                    value={formData.tuition_fee_structure}
                    onValueChange={(value: 'monthly' | 'semester' | 'yearly') => setFormData({ 
                      ...formData, 
                      tuition_fee_structure: value 
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select fee structure" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="semester">Per Semester</SelectItem>
                      <SelectItem value="yearly">Per Year</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div>
                <Label htmlFor="tuition_amount">
                  Tuition Amount (€{formData.tuition_fee_structure === 'monthly' ? '/month' : formData.tuition_fee_structure === 'semester' ? '/semester' : '/year'})
                </Label>
                <Input 
                  id="tuition_amount" 
                  type="number" 
                  value={formData.tuition_amount} 
                  onChange={e => setFormData({
                    ...formData,
                    tuition_amount: parseInt(e.target.value) || 0,
                    semester_fees: parseInt(e.target.value) || 0
                  })} 
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Enter the tuition fee based on the selected structure. Equivalent amounts will be calculated automatically.
                </p>
              </div>
            </div>

            {/* Academic Requirements Editor */}
            <ProgramRequirementsEditor
              value={{
                gpa_minimum: formData.gpa_minimum,
                gpa_competitive: formData.gpa_competitive,
                gpa_notes: formData.gpa_notes,
                gmat_required: formData.gmat_required,
                gmat_minimum: formData.gmat_minimum,
                gre_required: formData.gre_required,
                gre_minimum_verbal: formData.gre_minimum_verbal,
                gre_minimum_quant: formData.gre_minimum_quant,
                gre_minimum_total: formData.gre_minimum_total,
                accepted_degrees: formData.accepted_degrees,
                subject_requirements: formData.subject_requirements,
                admission_regulations_url: formData.admission_regulations_url,
                program_flyer_url: formData.program_flyer_url,
                module_description_url: formData.module_description_url,
                admission_test_required: formData.admission_test_required ?? false,
                admission_test_details: formData.admission_test_details ?? null,
                interview_required: formData.interview_required ?? false,
                interview_details: formData.interview_details ?? null
              }}
              onChange={(reqData) => setFormData({ ...formData, ...reqData })}
              programId={editingProgram?.id}
              degreeLevel={formData.degree_level}
            />

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
              <Button 
                type="button" 
                variant="secondary"
                onClick={(e: any) => handleSubmit(e, 'draft')}
              >
                {editingProgram ? 'Save as Draft' : 'Save Draft'}
              </Button>
              <Button 
                type="submit"
                onClick={(e: any) => handleSubmit(e, 'published')}
              >
                {editingProgram ? 'Publish Changes' : 'Publish Program'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <BulkProgramImporter
        open={isBulkImporterOpen}
        onOpenChange={setIsBulkImporterOpen}
        onProgramsImported={fetchPrograms}
      />
    </div>;
};