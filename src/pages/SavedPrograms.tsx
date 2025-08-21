import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Bookmark, ExternalLink, Trash2, MapPin, Clock, GraduationCap } from "lucide-react";
import Navigation from "@/components/Navigation";
import SEOHead from "@/components/SEOHead";
import LoadingSpinner from "@/components/LoadingSpinner";

interface SavedProgram {
  id: string;
  program_id: string;
  programs: {
    id: string;
    name: string;
    field_of_study: string;
    degree_type: string;
    duration_semesters: number;
    tuition_fees: number;
    application_deadline: string;
    semester_start: string;
    universities: {
      name: string;
      city: string;
      website: string;
    };
  };
}

const SavedPrograms = () => {
  const [savedPrograms, setSavedPrograms] = useState<SavedProgram[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchSavedPrograms();
  }, []);

  const fetchSavedPrograms = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('saved_programs')
        .select(`
          id,
          program_id,
          programs (
            id,
            name,
            field_of_study,
            degree_type,
            duration_semesters,
            tuition_fees,
            application_deadline,
            semester_start,
            universities (
              name,
              city,
              website
            )
          )
        `)
        .eq('profile_id', user.id);

      if (error) throw error;
      setSavedPrograms(data || []);
    } catch (error) {
      console.error('Error fetching saved programs:', error);
      toast({
        title: "Error",
        description: "Failed to load saved programs",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const removeSavedProgram = async (savedId: string) => {
    try {
      const { error } = await supabase
        .from('saved_programs')
        .delete()
        .eq('id', savedId);

      if (error) throw error;

      setSavedPrograms(savedPrograms.filter(saved => saved.id !== savedId));
      toast({
        title: "Program removed",
        description: "Program removed from your saved list",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to remove program",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <SEOHead 
          title="Saved Programs | UniMatch Germany"
          description="View and manage your saved German university programs."
        />
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <LoadingSpinner size="lg" message="Loading your saved programs..." />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SEOHead 
        title="Saved Programs | UniMatch Germany"
        description="View and manage your saved German university programs."
      />
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center gap-2">
            <Bookmark className="h-8 w-8 text-primary" />
            Saved Programs
          </h1>
          <p className="text-muted-foreground">
            Programs you've bookmarked for future reference
          </p>
        </div>

        {savedPrograms.length === 0 ? (
          <Card className="shadow-soft">
            <CardContent className="p-12 text-center">
              <Bookmark className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">No saved programs yet</h2>
              <p className="text-muted-foreground mb-6">
                Start browsing programs and save the ones that interest you
              </p>
              <Button variant="hero">Browse Programs</Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {savedPrograms.map((saved) => {
              const program = saved.programs;
              return (
                <Card key={saved.id} className="shadow-soft hover:shadow-medium transition-shadow duration-300">
                  <CardContent className="p-6">
                    <div className="flex flex-col lg:flex-row gap-6">
                      <div className="flex-1 space-y-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="text-xl font-semibold text-foreground mb-1">
                              {program.name}
                            </h3>
                            <p className="text-lg text-muted-foreground font-medium">
                              {program.universities.name}
                            </p>
                            <div className="flex items-center text-muted-foreground mt-1">
                              <MapPin className="h-4 w-4 mr-1" />
                              {program.universities.city}
                            </div>
                          </div>
                          <Badge variant="secondary">{program.degree_type}</Badge>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <Badge variant="outline">{program.field_of_study}</Badge>
                          <Badge variant="outline">
                            <Clock className="h-3 w-3 mr-1" />
                            {program.duration_semesters} semesters
                          </Badge>
                          <Badge variant="outline" className={program.tuition_fees === 0 ? "text-success border-success" : ""}>
                            {program.tuition_fees === 0 ? "Free" : `€${program.tuition_fees.toLocaleString()}/year`}
                          </Badge>
                        </div>

                        <div className="text-sm text-muted-foreground">
                          <p>Application Deadline: {new Date(program.application_deadline).toLocaleDateString()}</p>
                          <p>Semester Start: {program.semester_start}</p>
                        </div>
                      </div>

                      <div className="lg:w-48 flex flex-col gap-3">
                        <Button variant="hero" className="w-full">
                          <GraduationCap className="h-4 w-4 mr-2" />
                          Apply Now
                        </Button>
                        <Button 
                          variant="outline" 
                          className="w-full"
                          onClick={() => window.open(program.universities.website, '_blank')}
                        >
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Visit University
                        </Button>
                        <Button 
                          variant="ghost" 
                          className="w-full text-destructive hover:text-destructive"
                          onClick={() => removeSavedProgram(saved.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Remove
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default SavedPrograms;