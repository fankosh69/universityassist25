import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Send, Save, Eye, Search, Plus, X, GripVertical } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
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
  const [selectedStudent, setSelectedStudent] = useState<string>("");
  const [title, setTitle] = useState("Program Recommendations");
  const [message, setMessage] = useState("");
  const [selectedPrograms, setSelectedPrograms] = useState<ShortlistProgram[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    fetchData();
    fetchShortlists();
  }, []);

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

      // Fetch student details separately
      const enrichedData = await Promise.all(
        (data || []).map(async (shortlist) => {
          const { data: student } = await supabase
            .from("profiles")
            .select("id, full_name, email")
            .eq("id", shortlist.student_profile_id)
            .single();

          return {
            ...shortlist,
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

  const saveDraft = async () => {
    if (!selectedStudent || selectedPrograms.length === 0) {
      toast({
        title: "Missing information",
        description: "Please select a student and at least one program",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error("Not authenticated");

      // Create shortlist
      const { data: shortlist, error: shortlistError } = await supabase
        .from("program_shortlists")
        .insert({
          created_by: user.user.id,
          student_profile_id: selectedStudent,
          title,
          message,
          status: "draft",
        })
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
    if (!selectedStudent || selectedPrograms.length === 0) {
      toast({
        title: "Missing information",
        description: "Please select a student and at least one program",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error("Not authenticated");

      // Create shortlist
      const { data: shortlist, error: shortlistError } = await supabase
        .from("program_shortlists")
        .insert({
          created_by: user.user.id,
          student_profile_id: selectedStudent,
          title,
          message,
          status: "draft",
        })
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
    setSelectedStudent("");
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
            {/* Student Selection */}
            <Card>
              <CardHeader>
                <CardTitle>Select Student</CardTitle>
                <CardDescription>Choose who will receive this recommendation</CardDescription>
              </CardHeader>
              <CardContent>
                <SearchableSelect
                  value={selectedStudent}
                  onValueChange={setSelectedStudent}
                  options={students.map(s => ({
                    value: s.id,
                    label: `${s.full_name} (${s.email})`,
                  }))}
                  placeholder="Search students..."
                />
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
                disabled={loading || !selectedStudent || selectedPrograms.length === 0}
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
                disabled={!selectedStudent || selectedPrograms.length === 0}
                variant="outline"
              >
                <Eye className="mr-2 h-4 w-4" />
                Preview
              </Button>
              <Button
                onClick={sendShortlist}
                disabled={loading || !selectedStudent || selectedPrograms.length === 0}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Send to Student
                  </>
                )}
              </Button>
            </div>
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
                          <div>
                            <h4 className="font-semibold">{shortlist.title}</h4>
                            <p className="text-sm text-muted-foreground">
                              To: {shortlist.student?.full_name || "Unknown"}
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
