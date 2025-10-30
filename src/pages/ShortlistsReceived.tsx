import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";
import { ExternalLink, BookmarkPlus, Mail } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface ShortlistProgram {
  id: string;
  staff_notes: string;
  program: {
    id: string;
    name: string;
    slug: string;
    degree_type: string;
    duration_semesters: number;
    semester_fees: number;
    winter_deadline: string | null;
    summer_deadline: string | null;
    university: {
      name: string;
      slug: string;
      city_id: string;
    };
  };
}

interface Shortlist {
  id: string;
  title: string;
  message: string;
  status: string;
  sent_at: string;
  created_at: string;
  creator: {
    full_name: string;
    email: string;
  };
  programs: ShortlistProgram[];
}

export default function ShortlistsReceived() {
  const { toast } = useToast();
  const [shortlists, setShortlists] = useState<Shortlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [cities, setCities] = useState<Map<string, string>>(new Map());

  useEffect(() => {
    fetchShortlists();
  }, []);

  const fetchShortlists = async () => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      const { data: shortlistsData, error: shortlistsError } = await supabase
        .from("program_shortlists")
        .select("*")
        .eq("student_profile_id", user.user.id)
        .eq("status", "sent")
        .order("sent_at", { ascending: false });

      if (shortlistsError) throw shortlistsError;

      // Fetch programs for each shortlist
      const enrichedShortlists = await Promise.all(
        (shortlistsData || []).map(async (shortlist) => {
          // Fetch creator profile
          const { data: creatorProfile } = await supabase
            .from("profiles")
            .select("full_name, email")
            .eq("id", shortlist.created_by)
            .single();

          const { data: programsData, error: programsError } = await supabase
            .from("shortlist_programs")
            .select(`
              id,
              staff_notes,
              program:program_id(
                id,
                name,
                slug,
                degree_type,
                duration_semesters,
                semester_fees,
                winter_deadline,
                summer_deadline,
                university:university_id(
                  name,
                  slug,
                  city_id
                )
              )
            `)
            .eq("shortlist_id", shortlist.id)
            .order("sort_order");

          if (programsError) throw programsError;

          // Fetch cities
          const cityIds = programsData
            ?.map((p: any) => p.program?.university?.city_id)
            .filter(Boolean);

          const { data: citiesData } = await supabase
            .from("cities")
            .select("id, name")
            .in("id", cityIds || []);

          const cityMap = new Map(citiesData?.map((c) => [c.id, c.name]) || []);
          setCities((prev) => new Map([...prev, ...cityMap]));

          return {
            ...shortlist,
            creator: {
              full_name: creatorProfile?.full_name || "Your Advisor",
              email: creatorProfile?.email || "",
            },
            programs: programsData || [],
          };
        })
      );

      setShortlists(enrichedShortlists);
    } catch (error: any) {
      toast({
        title: "Error loading recommendations",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const saveToWatchlist = async (programId: string) => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      const { error } = await supabase
        .from("saved_programs")
        .insert({
          profile_id: user.user.id,
          program_id: programId,
        });

      if (error) {
        if (error.code === "23505") {
          toast({
            title: "Already saved",
            description: "This program is already in your watchlist",
          });
          return;
        }
        throw error;
      }

      toast({
        title: "Program saved",
        description: "Added to your watchlist",
      });
    } catch (error: any) {
      toast({
        title: "Error saving program",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8 space-y-6">
        <Skeleton className="h-12 w-96" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Program Recommendations</h1>
        <p className="text-muted-foreground">
          Personalized program suggestions from your advisors
        </p>
      </div>

      {shortlists.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <Mail className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No recommendations yet</h3>
              <p className="text-muted-foreground">
                Your advisors will send you personalized program recommendations
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {shortlists.map((shortlist) => (
            <Card key={shortlist.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle>{shortlist.title}</CardTitle>
                    <CardDescription>
                      From {shortlist.creator.full_name} •{" "}
                      {new Date(shortlist.sent_at).toLocaleDateString()}
                    </CardDescription>
                  </div>
                  <Badge>Sent</Badge>
                </div>
                {shortlist.message && (
                  <div className="mt-4 p-4 bg-accent rounded-lg">
                    <p className="text-sm italic">{shortlist.message}</p>
                  </div>
                )}
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {shortlist.programs.map((sp) => (
                    <Card key={sp.id}>
                      <CardContent className="pt-6">
                        <div className="space-y-4">
                          <div>
                            <h3 className="text-lg font-semibold">{sp.program.name}</h3>
                            <p className="text-sm text-muted-foreground">
                              {sp.program.university.name} •{" "}
                              {cities.get(sp.program.university.city_id) || "Germany"}
                            </p>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            <Badge variant="secondary">{sp.program.degree_type}</Badge>
                            <Badge variant="outline">
                              {sp.program.duration_semesters} semesters
                            </Badge>
                            <Badge variant="outline">
                              €{sp.program.semester_fees}/semester
                            </Badge>
                          </div>

                          {sp.staff_notes && (
                            <div className="p-3 bg-muted rounded-lg">
                              <p className="text-sm font-medium mb-1">💡 Why this program?</p>
                              <p className="text-sm">{sp.staff_notes}</p>
                            </div>
                          )}

                          <div className="flex gap-2">
                            <Button asChild variant="default">
                              <Link
                                to={`/universities/${sp.program.university.slug}/programs/${sp.program.slug}`}
                              >
                                <ExternalLink className="mr-2 h-4 w-4" />
                                View Details
                              </Link>
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => saveToWatchlist(sp.program.id)}
                            >
                              <BookmarkPlus className="mr-2 h-4 w-4" />
                              Save to Watchlist
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
