import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Send, Save, Eye, Search, Plus, X, GripVertical, Download } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { pdf } from '@react-pdf/renderer';
import { ShortlistPDF } from "@/components/admin/ShortlistPDF";

interface Student {
  id: string;
  full_name: string;
  email: string;
}

interface Program {
  id: string;
  name: string;
  degree_type: string;
  duration_semesters: number;
  semester_fees: number;
  tuition_amount?: number;
  tuition_fee_structure?: 'monthly' | 'semester' | 'yearly';
  university_id: string;
  winter_intake?: boolean;
  summer_intake?: boolean;
  winter_deadline?: string;
  summer_deadline?: string;
  application_method?: string;
  uni_assist_required?: boolean;
}

interface University {
  id: string;
  name: string;
  slug: string;
  city_id: string;
  logo_url?: string;
}

interface Campus {
  id: string;
  name: string;
  city_name: string;
  is_main_campus: boolean;
}

interface ShortlistProgram {
  program: Program & { 
    university: University; 
    city_name?: string;
    campuses?: Campus[];
  };
  staff_notes: string;
  sort_order: number;
}

interface CCRecipient {
  name: string;
  email: string;
}

interface Shortlist {
  id: string;
  title: string;
  message: string;
  status: string;
  sent_at: string | null;
  created_at: string;
  recipient_type: 'internal' | 'external';
  recipient_email?: string;
  recipient_name?: string;
  cc_recipients?: CCRecipient[];
  delivery_status?: string;
  delivery_error?: string;
  delivered_at?: string | null;
  opened_at?: string | null;
  cc_delivery_status?: Array<{ email: string; status: string; delivered_at?: string }>;
  student: Student;
  programs?: ShortlistProgram[];
}

export default function AdminShortlists() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [students, setStudents] = useState<Student[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [universities, setUniversities] = useState<University[]>([]);
  const [cities, setCities] = useState<Map<string, string>>(new Map());
  const [shortlists, setShortlists] = useState<Shortlist[]>([]);
  
  // Form state
  const [recipientType, setRecipientType] = useState<'internal' | 'external'>('internal');
  const [selectedStudent, setSelectedStudent] = useState<string>("");
  const [externalEmail, setExternalEmail] = useState("");
  const [externalName, setExternalName] = useState("");
  const [title, setTitle] = useState("Program Recommendations");
  const [message, setMessage] = useState("");
  const [selectedPrograms, setSelectedPrograms] = useState<ShortlistProgram[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [currentUserName, setCurrentUserName] = useState<string>("Your Advisor");
  const [editingShortlist, setEditingShortlist] = useState<string | null>(null);
  const [viewingShortlist, setViewingShortlist] = useState<Shortlist | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [activeTab, setActiveTab] = useState<string>("create");
  
  // CC recipients state
  const [ccRecipients, setCcRecipients] = useState<CCRecipient[]>([]);
  const [ccName, setCcName] = useState("");
  const [ccEmail, setCcEmail] = useState("");

  useEffect(() => {
    fetchData();
    fetchShortlists();
    fetchCurrentUser();
  }, []);

  const fetchCurrentUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", user.id)
          .single();
        
        if (profile?.full_name) {
          setCurrentUserName(profile.full_name);
        }
      }
    } catch (error) {
      console.error("Error fetching current user:", error);
    }
  };

  const fetchData = async () => {
    try {
      // Fetch students
      const { data: studentsData, error: studentsError } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .not("full_name", "is", null)
        .order("full_name");

      if (studentsError) throw studentsError;
      setStudents(studentsData || []);

      // Fetch programs
      const { data: programsData, error: programsError } = await supabase
        .from("programs")
        .select("id, name, degree_type, duration_semesters, semester_fees, tuition_amount, tuition_fee_structure, university_id, winter_intake, summer_intake, winter_deadline, summer_deadline, application_method, uni_assist_required")
        .eq("published", true)
        .order("name");

      if (programsError) throw programsError;
      setPrograms((programsData || []).map(p => ({
        ...p,
        tuition_fee_structure: p.tuition_fee_structure as 'monthly' | 'semester' | 'yearly' | undefined
      })));

      // Fetch universities
      const { data: universitiesData, error: universitiesError } = await supabase
        .from("universities")
        .select("id, name, slug, city_id");

      if (universitiesError) throw universitiesError;
      setUniversities(universitiesData || []);

      // Fetch cities
      const { data: citiesData, error: citiesError } = await supabase
        .from("cities")
        .select("id, name");

      if (citiesError) throw citiesError;
      const cityMap = new Map(citiesData?.map(c => [c.id, c.name]) || []);
      setCities(cityMap);
    } catch (error: any) {
      toast({
        title: "Error loading data",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const fetchShortlists = async () => {
    try {
      const { data, error } = await supabase
        .from("program_shortlists")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch student details and programs for each shortlist
      const enrichedData = await Promise.all(
        (data || []).map(async (shortlist) => {
          // Fetch programs for this shortlist
          const { data: shortlistPrograms } = await supabase
            .from("shortlist_programs")
            .select(`
              staff_notes,
              sort_order,
              program:programs(
                id,
                name,
                degree_type,
                duration_semesters,
                semester_fees,
                tuition_amount,
                tuition_fee_structure,
                winter_intake,
                summer_intake,
                winter_deadline,
                summer_deadline,
                application_method,
                uni_assist_required,
                university:universities(
                  id,
                  name,
                  slug,
                  city_id,
                  city:cities(name)
                ),
                program_campuses(
                  campus:university_campuses(
                    id,
                    name,
                    city_id,
                    is_main_campus,
                    city:cities(name)
                  )
                )
              )
            `)
            .eq("shortlist_id", shortlist.id)
            .order("sort_order");

          const programs: ShortlistProgram[] = (shortlistPrograms || []).map((sp: any) => {
            const campuses = (sp.program.program_campuses || []).map((pc: any) => ({
              id: pc.campus?.id || '',
              name: pc.campus?.name || '',
              city_name: pc.campus?.city?.name || '',
              is_main_campus: pc.campus?.is_main_campus || false,
            }));

            return {
              program: {
                ...sp.program,
                university: sp.program.university,
                city_name: sp.program.university.city?.name,
                campuses,
              },
              staff_notes: sp.staff_notes,
              sort_order: sp.sort_order,
            };
          });

          if (shortlist.recipient_type === 'external') {
            return {
              ...shortlist,
              recipient_type: 'external' as const,
              cc_recipients: (shortlist.cc_recipients as unknown as CCRecipient[]) || [],
              cc_delivery_status: (shortlist.cc_delivery_status as unknown as Array<{ email: string; status: string; delivered_at?: string }>) || [],
              student: {
                id: "",
                full_name: shortlist.recipient_name,
                email: shortlist.recipient_email,
              },
              programs,
            };
          }

          const { data: student } = await supabase
            .from("profiles")
            .select("id, full_name, email")
            .eq("id", shortlist.student_profile_id)
            .single();

          return {
            ...shortlist,
            recipient_type: 'internal' as const,
            cc_recipients: (shortlist.cc_recipients as unknown as CCRecipient[]) || [],
            cc_delivery_status: (shortlist.cc_delivery_status as unknown as Array<{ email: string; status: string; delivered_at?: string }>) || [],
            student: student || { id: "", full_name: "Unknown", email: "" },
            programs,
          };
        })
      );

      setShortlists(enrichedData);
    } catch (error: any) {
      toast({
        title: "Error loading shortlists",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const addProgram = (programId: string) => {
    const program = programs.find(p => p.id === programId);
    if (!program) return;

    const university = universities.find(u => u.id === program.university_id);
    if (!university) return;

    const alreadyAdded = selectedPrograms.some(sp => sp.program.id === programId);
    if (alreadyAdded) {
      toast({
        title: "Program already added",
        variant: "destructive",
      });
      return;
    }

    setSelectedPrograms([
      ...selectedPrograms,
      {
        program: {
          ...program,
          university,
          city_name: cities.get(university.city_id),
        },
        staff_notes: "",
        sort_order: selectedPrograms.length,
      },
    ]);
    setSearchTerm("");
  };

  const removeProgram = (index: number) => {
    setSelectedPrograms(selectedPrograms.filter((_, i) => i !== index));
  };

  const updateNotes = (index: number, notes: string) => {
    const updated = [...selectedPrograms];
    updated[index].staff_notes = notes;
    setSelectedPrograms(updated);
  };

  const validateRecipient = () => {
    if (recipientType === 'internal') {
      return selectedStudent !== '';
    } else {
      return externalEmail !== '' && externalName !== '' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(externalEmail);
    }
  };

  const exportPDF = async (programs: ShortlistProgram[], studentName: string) => {
    try {
      const pdfBlob = await pdf(
        <ShortlistPDF
          title={title}
          studentName={studentName}
          staffName={currentUserName}
          message={message}
          programs={programs.map(sp => ({
            ...sp.program,
            staff_notes: sp.staff_notes,
          }))}
        />
      ).toBlob();

      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${title.replace(/[^a-z0-9]/gi, '_')}_${studentName.replace(/[^a-z0-9]/gi, '_')}.pdf`;
      link.click();
      URL.revokeObjectURL(url);

      toast({
        title: "PDF exported",
        description: "Shortlist has been downloaded successfully",
      });
    } catch (error: any) {
      toast({
        title: "Export failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const saveDraft = async () => {
    if (!validateRecipient() || selectedPrograms.length === 0) {
      toast({
        title: "Missing information",
        description: recipientType === 'internal' 
          ? "Please select a student and at least one program"
          : "Please provide recipient name, valid email, and at least one program",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error("Not authenticated");

      const shortlistData: any = {
        created_by: user.user.id,
        title,
        message,
        status: "draft",
        recipient_type: recipientType,
        cc_recipients: ccRecipients,
      };

      if (recipientType === 'internal') {
        shortlistData.student_profile_id = selectedStudent;
      } else {
        shortlistData.recipient_email = externalEmail;
        shortlistData.recipient_name = externalName;
      }

      // Create shortlist
      const { data: shortlist, error: shortlistError } = await supabase
        .from("program_shortlists")
        .insert(shortlistData)
        .select()
        .single();

      if (shortlistError) throw shortlistError;

      // Add programs to shortlist
      const programsToInsert = selectedPrograms.map((sp, index) => ({
        shortlist_id: shortlist.id,
        program_id: sp.program.id,
        staff_notes: sp.staff_notes,
        sort_order: index,
      }));

      const { error: programsError } = await supabase
        .from("shortlist_programs")
        .insert(programsToInsert);

      if (programsError) throw programsError;

      toast({
        title: "Draft saved",
        description: "Shortlist saved successfully",
      });

      resetForm();
      fetchShortlists();
    } catch (error: any) {
      toast({
        title: "Error saving draft",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const sendShortlist = async () => {
    if (!validateRecipient() || selectedPrograms.length === 0) {
      toast({
        title: "Missing information",
        description: recipientType === 'internal' 
          ? "Please select a student and at least one program"
          : "Please provide recipient name, valid email, and at least one program",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error("Not authenticated");

      const shortlistData: any = {
        created_by: user.user.id,
        title,
        message,
        status: "draft",
        recipient_type: recipientType,
        cc_recipients: ccRecipients,
      };

      if (recipientType === 'internal') {
        shortlistData.student_profile_id = selectedStudent;
      } else {
        shortlistData.recipient_email = externalEmail;
        shortlistData.recipient_name = externalName;
      }

      // Create shortlist
      const { data: shortlist, error: shortlistError } = await supabase
        .from("program_shortlists")
        .insert(shortlistData)
        .select()
        .single();

      if (shortlistError) throw shortlistError;

      // Add programs to shortlist
      const programsToInsert = selectedPrograms.map((sp, index) => ({
        shortlist_id: shortlist.id,
        program_id: sp.program.id,
        staff_notes: sp.staff_notes,
        sort_order: index,
      }));

      const { error: programsError } = await supabase
        .from("shortlist_programs")
        .insert(programsToInsert);

      if (programsError) throw programsError;

      // Send email via edge function
      const { error: sendError } = await supabase.functions.invoke(
        "send-program-shortlist",
        {
          body: { shortlistId: shortlist.id },
        }
      );

      if (sendError) throw sendError;

      toast({
        title: "Shortlist sent!",
        description: "The student will receive the recommendations by email",
      });

      resetForm();
      fetchShortlists();
    } catch (error: any) {
      toast({
        title: "Error sending shortlist",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setEditingShortlist(null);
    setRecipientType("internal");
    setSelectedStudent("");
    setExternalEmail("");
    setExternalName("");
    setTitle("Program Recommendations");
    setMessage("");
    setSelectedPrograms([]);
    setCcRecipients([]);
    setCcName("");
    setCcEmail("");
  };

  const addCcRecipient = () => {
    // Validate email
    if (!ccEmail || !ccName) {
      toast({
        title: "Missing information",
        description: "Please provide both name and email",
        variant: "destructive",
      });
      return;
    }

    // Validate email format
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(ccEmail)) {
      toast({
        title: "Invalid email",
        description: "Please provide a valid email address",
        variant: "destructive",
      });
      return;
    }

    // Check for duplicates
    if (ccRecipients.some(cc => cc.email.toLowerCase() === ccEmail.toLowerCase())) {
      toast({
        title: "Duplicate email",
        description: "This email is already added",
        variant: "destructive",
      });
      return;
    }

    // Check limit
    if (ccRecipients.length >= 5) {
      toast({
        title: "Maximum CC limit reached",
        description: "You can add up to 5 CC recipients",
        variant: "destructive",
      });
      return;
    }

    setCcRecipients([...ccRecipients, { name: ccName, email: ccEmail }]);
    setCcName("");
    setCcEmail("");
  };

  const removeCcRecipient = (index: number) => {
    setCcRecipients(ccRecipients.filter((_, i) => i !== index));
  };

  const loadDraftForEditing = (shortlist: Shortlist) => {
    setEditingShortlist(shortlist.id);
    setRecipientType(shortlist.recipient_type);
    if (shortlist.recipient_type === 'internal') {
      setSelectedStudent(shortlist.student.id);
    } else {
      setExternalEmail(shortlist.student.email);
      setExternalName(shortlist.student.full_name);
    }
    setTitle(shortlist.title);
    setMessage(shortlist.message || "");
    setCcRecipients(shortlist.cc_recipients || []);
    setSelectedPrograms(shortlist.programs || []);
    setActiveTab("create");
  };

  const cloneShortlist = async (shortlist: Shortlist) => {
    // Load the shortlist data but without the ID so it creates a new one
    setEditingShortlist(null);
    setRecipientType(shortlist.recipient_type);
    if (shortlist.recipient_type === 'internal') {
      setSelectedStudent(shortlist.student.id);
    } else {
      setExternalEmail(shortlist.student.email);
      setExternalName(shortlist.student.full_name);
    }
    setTitle(shortlist.title + " (Copy)");
    setMessage(shortlist.message || "");
    setCcRecipients(shortlist.cc_recipients || []);
    setSelectedPrograms(shortlist.programs || []);
    setActiveTab("create");
    
    toast({
      title: "Shortlist cloned",
      description: "You can now edit and save/send the cloned shortlist",
    });
  };

  const deleteShortlist = async (shortlistId: string) => {
    if (!confirm("Are you sure you want to delete this shortlist? This action cannot be undone.")) {
      return;
    }

    try {
      const { error } = await supabase
        .from("program_shortlists")
        .delete()
        .eq("id", shortlistId);

      if (error) throw error;

      toast({
        title: "Shortlist deleted",
        description: "The shortlist has been permanently deleted",
      });

      fetchShortlists();
    } catch (error: any) {
      toast({
        title: "Error deleting shortlist",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const updateDraft = async () => {
    if (!editingShortlist || !validateRecipient() || selectedPrograms.length === 0) {
      toast({
        title: "Missing information",
        description: "Please complete all required fields",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Update shortlist
      const shortlistData: any = {
        title,
        message,
        recipient_type: recipientType,
        cc_recipients: ccRecipients,
      };

      if (recipientType === 'internal') {
        shortlistData.student_profile_id = selectedStudent;
        shortlistData.recipient_email = null;
        shortlistData.recipient_name = null;
      } else {
        shortlistData.recipient_email = externalEmail;
        shortlistData.recipient_name = externalName;
        shortlistData.student_profile_id = null;
      }

      const { error: updateError } = await supabase
        .from("program_shortlists")
        .update(shortlistData)
        .eq("id", editingShortlist);

      if (updateError) throw updateError;

      // Delete existing programs
      const { error: deleteError } = await supabase
        .from("shortlist_programs")
        .delete()
        .eq("shortlist_id", editingShortlist);

      if (deleteError) throw deleteError;

      // Insert updated programs
      const programsToInsert = selectedPrograms.map((sp, index) => ({
        shortlist_id: editingShortlist,
        program_id: sp.program.id,
        staff_notes: sp.staff_notes,
        sort_order: index,
      }));

      const { error: programsError } = await supabase
        .from("shortlist_programs")
        .insert(programsToInsert);

      if (programsError) throw programsError;

      toast({
        title: "Draft updated",
        description: "Your changes have been saved",
      });

      resetForm();
      fetchShortlists();
    } catch (error: any) {
      toast({
        title: "Error updating draft",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const sendExistingDraft = async () => {
    if (!editingShortlist || !validateRecipient() || selectedPrograms.length === 0) {
      toast({
        title: "Missing information",
        description: "Please complete all required fields",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Update shortlist with current form data
      const shortlistData: any = {
        title,
        message,
        recipient_type: recipientType,
        cc_recipients: ccRecipients,
      };

      if (recipientType === 'internal') {
        shortlistData.student_profile_id = selectedStudent;
        shortlistData.recipient_email = null;
        shortlistData.recipient_name = null;
      } else {
        shortlistData.recipient_email = externalEmail;
        shortlistData.recipient_name = externalName;
        shortlistData.student_profile_id = null;
      }

      const { error: updateError } = await supabase
        .from("program_shortlists")
        .update(shortlistData)
        .eq("id", editingShortlist);

      if (updateError) throw updateError;

      // Delete existing programs
      const { error: deleteError } = await supabase
        .from("shortlist_programs")
        .delete()
        .eq("shortlist_id", editingShortlist);

      if (deleteError) throw deleteError;

      // Insert updated programs
      const programsToInsert = selectedPrograms.map((sp, index) => ({
        shortlist_id: editingShortlist,
        program_id: sp.program.id,
        staff_notes: sp.staff_notes,
        sort_order: index,
      }));

      const { error: programsError } = await supabase
        .from("shortlist_programs")
        .insert(programsToInsert);

      if (programsError) throw programsError;

      // Send email via edge function
      const { error: sendError } = await supabase.functions.invoke(
        "send-program-shortlist",
        {
          body: { shortlistId: editingShortlist },
        }
      );

      if (sendError) throw sendError;

      toast({
        title: "Shortlist sent!",
        description: "The recipient will receive the recommendations by email",
      });

      resetForm();
      fetchShortlists();
    } catch (error: any) {
      toast({
        title: "Error sending shortlist",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredPrograms = programs.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredShortlists = shortlists.filter(s => {
    if (filterStatus === "all") return true;
    return s.status === filterStatus;
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Program Shortlists</h1>
          <p className="text-muted-foreground">
            Create personalized program recommendations for students
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList>
            <TabsTrigger value="create">
              {editingShortlist ? "Edit Shortlist" : "Create New"}
            </TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>

          <TabsContent value="create" className="space-y-6">
            {/* Recipient Selection */}
            <Card>
              <CardHeader>
                <CardTitle>Select Recipient</CardTitle>
                <CardDescription>Choose who will receive this recommendation</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-4">
                  <Button
                    type="button"
                    variant={recipientType === 'internal' ? 'default' : 'outline'}
                    onClick={() => setRecipientType('internal')}
                  >
                    Existing Student
                  </Button>
                  <Button
                    type="button"
                    variant={recipientType === 'external' ? 'default' : 'outline'}
                    onClick={() => setRecipientType('external')}
                  >
                    External Email
                  </Button>
                </div>

                {recipientType === 'internal' ? (
                  <SearchableSelect
                    value={selectedStudent}
                    onValueChange={setSelectedStudent}
                    options={students.map(s => ({
                      value: s.id,
                      label: `${s.full_name} (${s.email})`,
                    }))}
                    placeholder="Search students..."
                  />
                ) : (
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="external-name">Recipient Name</Label>
                      <Input
                        id="external-name"
                        value={externalName}
                        onChange={(e) => setExternalName(e.target.value)}
                        placeholder="John Doe"
                      />
                    </div>
                    <div>
                      <Label htmlFor="external-email">Email Address</Label>
                      <Input
                        id="external-email"
                        type="email"
                        value={externalEmail}
                        onChange={(e) => setExternalEmail(e.target.value)}
                        placeholder="john@example.com"
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* CC Recipients */}
            <Card>
              <CardHeader>
                <CardTitle>CC Recipients (Optional)</CardTitle>
                <CardDescription>
                  Add parents, counselors, or other stakeholders to receive a copy
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="cc-name">Name</Label>
                    <Input
                      id="cc-name"
                      value={ccName}
                      onChange={(e) => setCcName(e.target.value)}
                      placeholder="John Parent"
                    />
                  </div>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <Label htmlFor="cc-email">Email</Label>
                      <Input
                        id="cc-email"
                        type="email"
                        value={ccEmail}
                        onChange={(e) => setCcEmail(e.target.value)}
                        placeholder="john@example.com"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            addCcRecipient();
                          }
                        }}
                      />
                    </div>
                    <div className="flex items-end">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={addCcRecipient}
                        disabled={!ccName || !ccEmail}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                {ccRecipients.length > 0 && (
                  <div className="space-y-2">
                    <Label>Added CC Recipients ({ccRecipients.length}/5)</Label>
                    <div className="space-y-2">
                      {ccRecipients.map((cc, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 bg-muted rounded-lg"
                        >
                          <div>
                            <p className="font-medium text-sm">{cc.name}</p>
                            <p className="text-xs text-muted-foreground">{cc.email}</p>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeCcRecipient(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Customization */}
            <Card>
              <CardHeader>
                <CardTitle>Customize Message</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Program Recommendations"
                  />
                </div>
                <div>
                  <Label htmlFor="message">Personal Message</Label>
                  <Textarea
                    id="message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Add a personal message explaining why you selected these programs..."
                    rows={4}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Program Selection */}
            <Card>
              <CardHeader>
                <CardTitle>Add Programs</CardTitle>
                <CardDescription>
                  Search and add programs ({selectedPrograms.length} selected)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search programs..."
                      className="pl-10"
                    />
                  </div>
                </div>

                {searchTerm && (
                  <div className="max-h-60 overflow-y-auto border rounded-lg">
                    {filteredPrograms.map((program) => {
                      const university = universities.find(u => u.id === program.university_id);
                      return (
                        <div
                          key={program.id}
                          className="p-3 hover:bg-accent cursor-pointer border-b last:border-b-0"
                          onClick={() => addProgram(program.id)}
                        >
                          <div className="font-medium">{program.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {university?.name} • {program.degree_type}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Selected Programs */}
                <div className="space-y-4">
                  {selectedPrograms.map((sp, index) => (
                    <Card key={index}>
                      <CardContent className="pt-6">
                        <div className="flex items-start gap-3">
                          <GripVertical className="h-5 w-5 text-muted-foreground mt-1" />
                          <div className="flex-1 space-y-3">
                            <div className="flex items-start justify-between">
                              <div>
                                <h4 className="font-semibold">{sp.program.name}</h4>
                                <p className="text-sm text-muted-foreground">
                                  {sp.program.university.name} • {sp.program.degree_type}
                                </p>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => removeProgram(index)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                            <div>
                              <Label htmlFor={`notes-${index}`}>Why recommend this program?</Label>
                              <Textarea
                                id={`notes-${index}`}
                                value={sp.staff_notes}
                                onChange={(e) => updateNotes(index, e.target.value)}
                                placeholder="Add notes about why this program fits the student..."
                                rows={2}
                              />
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex gap-3">
              {editingShortlist ? (
                <>
                  <Button
                    onClick={updateDraft}
                    disabled={loading || !validateRecipient() || selectedPrograms.length === 0}
                    variant="outline"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Update Draft
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={() => setShowPreview(true)}
                    disabled={!validateRecipient() || selectedPrograms.length === 0}
                    variant="outline"
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    Preview
                  </Button>
                  <Button
                    onClick={sendExistingDraft}
                    disabled={loading || !validateRecipient() || selectedPrograms.length === 0}
                    variant="default"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="mr-2 h-4 w-4" />
                        Send Shortlist
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={resetForm}
                    variant="ghost"
                  >
                    Cancel
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    onClick={saveDraft}
                    disabled={loading || !validateRecipient() || selectedPrograms.length === 0}
                    variant="outline"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Save Draft
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={() => setShowPreview(true)}
                    disabled={!validateRecipient() || selectedPrograms.length === 0}
                    variant="outline"
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    Preview
                  </Button>
                  <Button
                    onClick={sendShortlist}
                    disabled={loading || !validateRecipient() || selectedPrograms.length === 0}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="mr-2 h-4 w-4" />
                        {recipientType === 'external' ? 'Send Email' : 'Send to Student'}
                      </>
                    )}
                  </Button>
                </>
              )}
            </div>

            {/* Preview Dialog */}
            <Dialog open={showPreview} onOpenChange={setShowPreview}>
              <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Email Preview</DialogTitle>
                  <DialogDescription>
                    This is how the email will appear to the recipient
                  </DialogDescription>
                </DialogHeader>
                
                <div className="border rounded-lg bg-background">{/* ... keep existing code */}
                  {/* Email Header */}
                  <div className="bg-primary p-5 rounded-t-lg">
                    <img 
                      src="/lovable-uploads/logo-white-transparent.png" 
                      alt="University Assist" 
                      className="h-12 mx-auto"
                    />
                  </div>
                  
                  {/* Email Body */}
                  <div className="bg-card p-6">
                    <h1 className="text-2xl font-semibold mb-4">
                      Hi {recipientType === 'internal' ? 
                        students.find(s => s.id === selectedStudent)?.full_name : 
                        externalName}! 👋
                    </h1>
                    
                    <p className="mb-4">
                      <strong>{currentUserName}</strong> has carefully curated these programs for you:
                    </p>
                    
                    {message && (
                      <div className="bg-primary/10 border-l-4 border-primary p-4 mb-4 italic">
                        {message}
                      </div>
                    )}

                    {ccRecipients.length > 0 && (
                      <div className="bg-muted/50 rounded p-3 mb-4 text-sm">
                        <p className="font-semibold mb-1">📧 CC Recipients:</p>
                        <p className="text-muted-foreground">
                          {ccRecipients.map(cc => cc.name).join(', ')}
                        </p>
                      </div>
                    )}
                    
                    {recipientType === 'external' && (
                      <div className="bg-accent/10 border-2 border-accent rounded-lg p-6 text-center mb-6">
                        <h2 className="text-xl font-bold mb-2">
                          🎓 Ready to Start Your Journey to Germany?
                        </h2>
                        <p className="mb-4">
                          Create a free account to save these programs, track deadlines, 
                          and get personalized guidance throughout your application process.
                        </p>
                        <Button className="mb-2">Create Free Account →</Button>
                        <p className="text-sm text-muted-foreground">
                          Already have an account? <a href="#" className="text-primary">Sign in here</a>
                        </p>
                      </div>
                    )}
                    
                    {/* Programs List */}
                    <div className="space-y-6">
                      {selectedPrograms.map((prog, idx) => {
                        const program = prog.program;
                        const university = prog.program.university;
                        const cityName = prog.program.city_name;
                        
                        return (
                          <div key={program.id} className="border rounded-lg p-6 bg-card">
                            {university.logo_url && (
                              <img
                                src={university.logo_url}
                                alt={`${university.name} logo`}
                                className="h-12 w-auto object-contain mb-4"
                              />
                            )}
                            
                            <h3 className="text-xl font-semibold mb-2">{program.name}</h3>
                            
                            <p className="text-muted-foreground mb-2">
                              🏛️ {university.name}
                            </p>

                            {prog.program.campuses && prog.program.campuses.length > 0 && (
                              <p className="text-sm text-muted-foreground mb-4">
                                📍 <strong>Campus{prog.program.campuses.length > 1 ? 'es' : ''}:</strong>{' '}
                                {prog.program.campuses
                                  .sort((a, b) => (b.is_main_campus ? 1 : 0) - (a.is_main_campus ? 1 : 0))
                                  .map((campus, idx) => (
                                    <span key={campus.id}>
                                      {idx > 0 && ', '}
                                      {campus.name} ({campus.city_name})
                                      {campus.is_main_campus && ' ⭐'}
                                    </span>
                                  ))}
                              </p>
                            )}
                            
                            <div className="grid grid-cols-3 gap-4 mb-4 text-sm">
                              <div>🎓 <strong>{program.degree_type}</strong></div>
                              <div>⏱️ <strong>{program.duration_semesters} semesters</strong></div>
                              <div>💶 <strong>
                                {(() => {
                                  const amount = program.tuition_amount !== undefined && program.tuition_amount !== null 
                                    ? program.tuition_amount 
                                    : program.semester_fees;
                                  const structure = program.tuition_fee_structure || 'semester';
                                  const labels = { monthly: '/month', semester: '/semester', yearly: '/year' };
                                  return amount === 0 ? 'Free' : `€${amount.toLocaleString()}${labels[structure]}`;
                                })()}
                              </strong></div>
                            </div>
                            
                            <div className="flex flex-wrap gap-4 mb-4 text-sm">
                              <div>
                                📅 <strong>Intake:</strong>{' '}
                                {program.winter_intake && program.summer_intake && 'Winter & Summer'}
                                {program.winter_intake && !program.summer_intake && 'Winter Only'}
                                {!program.winter_intake && program.summer_intake && 'Summer Only'}
                                {!program.winter_intake && !program.summer_intake && 'Not specified'}
                              </div>
                              <div>
                                📝 <strong>Application:</strong>{' '}
                                {program.uni_assist_required ? 'Via Uni-Assist' : 'Direct Application'}
                              </div>
                            </div>
                            
                            {(program.winter_intake || program.summer_intake) && (
                              <div className="mb-4 text-sm text-destructive space-y-1">
                                {program.winter_intake && program.winter_deadline && (
                                  <p>📅 <strong>Winter Intake Deadline:</strong> {program.winter_deadline}</p>
                                )}
                                {program.summer_intake && program.summer_deadline && (
                                  <p>📅 <strong>Summer Intake Deadline:</strong> {program.summer_deadline}</p>
                                )}
                              </div>
                            )}
                            
                            {prog.staff_notes && (
                              <div className="bg-muted rounded p-3 mb-4">
                                <p className="font-semibold text-sm mb-1">💡 Why this program?</p>
                                <p className="text-sm">{prog.staff_notes}</p>
                              </div>
                            )}
                            
                            <Button variant="default" size="sm">View Program Details →</Button>
                            
                            {idx < selectedPrograms.length - 1 && <hr className="mt-6" />}
                          </div>
                        );
                      })}
                    </div>
                    
                    {/* Footer */}
                    <div className="mt-8 text-center text-muted-foreground">
                      <p className="mb-4">
                        {recipientType === 'external' 
                          ? 'Have questions? Create an account or visit our website for more information.'
                          : 'Have questions? Reply to this email or contact your advisor.'
                        }
                      </p>
                      <p className="text-xs italic">
                        University Assist is not affiliated with uni-assist e.V., DAAD, or
                        German universities. All trademarks belong to their respective owners.
                      </p>
                    </div>
                  </div>
                </div>

                <DialogFooter className="mt-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      const studentName = recipientType === 'internal' 
                        ? students.find(s => s.id === selectedStudent)?.full_name || 'Student'
                        : externalName;
                      exportPDF(selectedPrograms, studentName);
                    }}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Export as PDF
                  </Button>
                  <Button onClick={() => setShowPreview(false)}>
                    Close
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </TabsContent>

          <TabsContent value="history">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Shortlist History</CardTitle>
                    <CardDescription>Manage all your shortlists</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant={filterStatus === "all" ? "default" : "outline"}
                      onClick={() => setFilterStatus("all")}
                    >
                      All ({shortlists.length})
                    </Button>
                    <Button
                      size="sm"
                      variant={filterStatus === "draft" ? "default" : "outline"}
                      onClick={() => setFilterStatus("draft")}
                    >
                      Drafts ({shortlists.filter(s => s.status === "draft").length})
                    </Button>
                    <Button
                      size="sm"
                      variant={filterStatus === "sent" ? "default" : "outline"}
                      onClick={() => setFilterStatus("sent")}
                    >
                      Sent ({shortlists.filter(s => s.status === "sent").length})
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {filteredShortlists.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No shortlists found
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredShortlists.map((shortlist) => (
                      <Card key={shortlist.id}>
                        <CardContent className="pt-6">
                          <div className="space-y-4">
                            <div className="flex items-start justify-between">
                              <div className="space-y-1 flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h4 className="font-semibold">{shortlist.title}</h4>
                                  <Badge variant={shortlist.status === "sent" ? "default" : "secondary"}>
                                    {shortlist.status}
                                  </Badge>
                                  <Badge variant={shortlist.recipient_type === 'external' ? 'outline' : 'secondary'}>
                                    {shortlist.recipient_type === 'external' ? 'External' : 'Student'}
                                  </Badge>
                                  {shortlist.status === "sent" && shortlist.delivery_status && (
                                    <Badge variant={
                                      shortlist.delivery_status === 'delivered' ? 'default' :
                                      shortlist.delivery_status === 'failed' ? 'destructive' :
                                      'secondary'
                                    }>
                                      {shortlist.delivery_status}
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-sm text-muted-foreground">
                                  <strong>To:</strong> {shortlist.student?.full_name || "Unknown"}
                                  {shortlist.student?.email && ` (${shortlist.student.email})`}
                                </p>
                                {shortlist.cc_recipients && shortlist.cc_recipients.length > 0 && (
                                  <p className="text-xs text-muted-foreground">
                                    <strong>CC:</strong> {shortlist.cc_recipients.map(cc => cc.name).join(', ')}
                                  </p>
                                )}
                                <p className="text-xs text-muted-foreground">
                                  <strong>Programs:</strong> {shortlist.programs?.length || 0}
                                </p>
                                <div className="flex gap-4 text-xs text-muted-foreground">
                                  <span>Created: {new Date(shortlist.created_at).toLocaleDateString()}</span>
                                  {shortlist.sent_at && (
                                    <span>Sent: {new Date(shortlist.sent_at).toLocaleDateString()}</span>
                                  )}
                                  {shortlist.delivered_at && (
                                    <span>Delivered: {new Date(shortlist.delivered_at).toLocaleDateString()}</span>
                                  )}
                                  {shortlist.opened_at && (
                                    <span>Opened: {new Date(shortlist.opened_at).toLocaleDateString()}</span>
                                  )}
                                </div>
                                {shortlist.delivery_error && (
                                  <p className="text-xs text-destructive mt-2">
                                    <strong>Error:</strong> {shortlist.delivery_error}
                                  </p>
                                )}
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setViewingShortlist(shortlist)}
                                >
                                  <Eye className="h-4 w-4 mr-1" />
                                  View
                                </Button>
                                {shortlist.status === "draft" && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => loadDraftForEditing(shortlist)}
                                  >
                                    Edit
                                  </Button>
                                )}
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => cloneShortlist(shortlist)}
                                >
                                  Clone
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => deleteShortlist(shortlist.id)}
                                >
                                  Delete
                                </Button>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* View Shortlist Dialog */}
            <Dialog open={!!viewingShortlist} onOpenChange={() => setViewingShortlist(null)}>
              <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{viewingShortlist?.title}</DialogTitle>
                  <DialogDescription>
                    {viewingShortlist?.status === 'sent' ? 'Sent shortlist preview' : 'Draft preview'}
                  </DialogDescription>
                </DialogHeader>
                
                {viewingShortlist && (
                  <div className="border rounded-lg bg-background">
                    {/* Email Header */}
                    <div className="bg-primary p-5 rounded-t-lg">
                      <img 
                        src="/lovable-uploads/logo-white-transparent.png" 
                        alt="University Assist" 
                        className="h-12 mx-auto"
                      />
                    </div>
                    
                    {/* Email Body */}
                    <div className="bg-card p-6">
                      <h1 className="text-2xl font-semibold mb-4">
                        Hi {viewingShortlist.student.full_name}! 👋
                      </h1>
                      
                      <p className="mb-4">
                        <strong>{currentUserName}</strong> has carefully curated these programs for you:
                      </p>
                      
                      {viewingShortlist.message && (
                        <div className="bg-primary/10 border-l-4 border-primary p-4 mb-4 italic">
                          {viewingShortlist.message}
                        </div>
                      )}

                      {viewingShortlist.cc_recipients && viewingShortlist.cc_recipients.length > 0 && (
                        <div className="bg-muted/50 rounded p-3 mb-4 text-sm">
                          <p className="font-semibold mb-1">📧 CC Recipients:</p>
                          <div className="space-y-1">
                            {viewingShortlist.cc_recipients.map((cc, idx) => {
                              const ccStatus = viewingShortlist.cc_delivery_status?.find(ccd => ccd.email === cc.email);
                              return (
                                <div key={idx} className="flex items-center justify-between">
                                  <span className="text-muted-foreground">{cc.name} ({cc.email})</span>
                                  {ccStatus && (
                                    <Badge variant={ccStatus.status === 'delivered' ? 'default' : 'secondary'} className="text-xs">
                                      {ccStatus.status}
                                    </Badge>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                      
                      {/* Programs List */}
                      <div className="space-y-6">
                        {viewingShortlist.programs?.map((prog, idx) => {
                          const program = prog.program;
                          const university = prog.program.university;
                          const cityName = prog.program.city_name;
                          
                          return (
                            <div key={program.id} className="border rounded-lg p-6 bg-card">
                              <h3 className="text-xl font-semibold mb-2">{program.name}</h3>
                              
                              <p className="text-muted-foreground mb-2">
                                🏛️ {university.name}
                              </p>

                              {prog.program.campuses && prog.program.campuses.length > 0 && (
                                <p className="text-sm text-muted-foreground mb-4">
                                  📍 <strong>Campus{prog.program.campuses.length > 1 ? 'es' : ''}:</strong>{' '}
                                  {prog.program.campuses
                                    .sort((a, b) => (b.is_main_campus ? 1 : 0) - (a.is_main_campus ? 1 : 0))
                                    .map((campus, idx) => (
                                      <span key={campus.id}>
                                        {idx > 0 && ', '}
                                        {campus.name} ({campus.city_name})
                                        {campus.is_main_campus && ' ⭐'}
                                      </span>
                                    ))}
                                </p>
                              )}
                              
                              <div className="grid grid-cols-3 gap-4 mb-4 text-sm">
                                <div>🎓 <strong>{program.degree_type}</strong></div>
                                <div>⏱️ <strong>{program.duration_semesters} semesters</strong></div>
                                <div>💶 <strong>
                                  {(() => {
                                    const amount = program.tuition_amount !== undefined && program.tuition_amount !== null 
                                      ? program.tuition_amount 
                                      : program.semester_fees;
                                    const structure = program.tuition_fee_structure || 'semester';
                                    const labels = { monthly: '/month', semester: '/semester', yearly: '/year' };
                                    return amount === 0 ? 'Free' : `€${amount.toLocaleString()}${labels[structure]}`;
                                  })()}
                                </strong></div>
                              </div>
                              
                              {prog.staff_notes && (
                                <div className="bg-muted rounded p-3 mb-4">
                                  <p className="font-semibold text-sm mb-1">💡 Why this program?</p>
                                  <p className="text-sm">{prog.staff_notes}</p>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                <DialogFooter className="mt-4">
                  {viewingShortlist && (
                    <Button
                      variant="outline"
                      onClick={() => {
                        exportPDF(
                          viewingShortlist.programs || [],
                          viewingShortlist.student.full_name
                        );
                      }}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Export as PDF
                    </Button>
                  )}
                  <Button onClick={() => setViewingShortlist(null)}>
                    Close
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
