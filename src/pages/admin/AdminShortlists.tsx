import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Send, Save, Eye, Search, Plus, X, GripVertical } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
  university_id: string;
}

interface University {
  id: string;
  name: string;
  slug: string;
  city_id: string;
}

interface ShortlistProgram {
  program: Program & { university: University; city_name?: string };
  staff_notes: string;
  sort_order: number;
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
  student: Student;
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
        .select("id, name, degree_type, duration_semesters, semester_fees, university_id")
        .eq("published", true)
        .order("name");

      if (programsError) throw programsError;
      setPrograms(programsData || []);

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

      // Fetch student details separately for internal recipients
      const enrichedData = await Promise.all(
        (data || []).map(async (shortlist) => {
          if (shortlist.recipient_type === 'external') {
            return {
              ...shortlist,
              recipient_type: 'external' as const,
              student: {
                id: "",
                full_name: shortlist.recipient_name,
                email: shortlist.recipient_email,
              },
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
            student: student || { id: "", full_name: "Unknown", email: "" },
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
    setRecipientType("internal");
    setSelectedStudent("");
    setExternalEmail("");
    setExternalName("");
    setTitle("Program Recommendations");
    setMessage("");
    setSelectedPrograms([]);
  };

  const filteredPrograms = programs.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Program Shortlists</h1>
          <p className="text-muted-foreground">
            Create personalized program recommendations for students
          </p>
        </div>

        <Tabs defaultValue="create" className="w-full">
          <TabsList>
            <TabsTrigger value="create">Create New</TabsTrigger>
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
                            <h3 className="text-xl font-semibold mb-2">{program.name}</h3>
                            
                            <p className="text-muted-foreground mb-4">
                              📍 {university.name}, {cityName || 'Germany'}
                            </p>
                            
                            <div className="grid grid-cols-3 gap-4 mb-4 text-sm">
                              <div>🎓 <strong>{program.degree_type}</strong></div>
                              <div>⏱️ <strong>{program.duration_semesters} semesters</strong></div>
                              <div>💶 <strong>€{program.semester_fees}/semester</strong></div>
                            </div>
                            
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
              </DialogContent>
            </Dialog>
          </TabsContent>

          <TabsContent value="history">
            <Card>
              <CardHeader>
                <CardTitle>Sent Shortlists</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {shortlists.map((shortlist) => (
                    <Card key={shortlist.id}>
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <h4 className="font-semibold">{shortlist.title}</h4>
                              <Badge variant={shortlist.recipient_type === 'external' ? 'secondary' : 'default'}>
                                {shortlist.recipient_type === 'external' ? 'External' : 'Student'}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              To: {shortlist.student?.full_name || "Unknown"}
                              {shortlist.student?.email && ` (${shortlist.student.email})`}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(shortlist.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <Badge variant={shortlist.status === "sent" ? "default" : "secondary"}>
                            {shortlist.status}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
