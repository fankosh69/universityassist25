import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { User, BookOpen, Target, Award, Settings, Bookmark, Heart } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import Navigation from "@/components/Navigation";
import { useAdmin } from "@/hooks/useAdmin";
import { getCurrentUserProfile } from "@/lib/secure-profile-api";
import { formatProgramTitle } from "@/lib/degree-formatting";

interface Profile {
  full_name?: string;
  email?: string;
  phone?: string;
  nationality?: string;
}

interface Match {
  id: string;
  compatibility_score: number;
  program: {
    name: string;
    field_of_study: string;
    degree_type: string;
    university: {
      name: string;
      city: string;
    };
  };
}

interface SavedProgram {
  id: string;
  program_id: string;
  programs: {
    id: string;
    name: string;
    degree_type: string;
    degree_level: string;
    slug: string;
    universities: {
      name: string;
      city: string;
      slug: string;
    };
  };
}

const Dashboard = () => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [savedPrograms, setSavedPrograms] = useState<SavedProgram[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { isAdmin, loading: adminLoading } = useAdmin();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch profile using secure API
      const profileData = await getCurrentUserProfile();
      if (profileData) {
        setProfile(profileData);
      }

      // Fetch matches with program and university info
      const { data: matchesData } = await supabase
        .from('matches')
        .select(`
          id,
          compatibility_score,
          match_reasons,
          programs!inner(
            name,
            field_of_study,
            degree_type,
            universities!inner(name, city)
          )
        `)
        .eq('profile_id', user.id)
        .order('compatibility_score', { ascending: false })
        .limit(5);

      if (matchesData) {
        // Transform the data structure - handle the array from inner join
        const transformedMatches = matchesData.map((match: any) => ({
          id: match.id,
          compatibility_score: match.compatibility_score,
          match_reasons: match.match_reasons,
          program: {
            name: match.programs.name,
            field_of_study: match.programs.field_of_study,
            degree_type: match.programs.degree_type,
            university: {
              name: match.programs.universities.name,
              city: match.programs.universities.city
            }
          }
        }));
        setMatches(transformedMatches);
      }

      // Fetch saved programs
      const { data: savedData } = await supabase
        .from('saved_programs')
        .select(`
          id,
          program_id,
          programs!inner(
            id,
            name,
            degree_type,
            degree_level,
            slug,
            universities!inner(name, city, slug)
          )
        `)
        .eq('profile_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (savedData) {
        setSavedPrograms(savedData as any);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast({
        title: "Error",
        description: "Failed to load dashboard data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-1/4"></div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-32 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const profileCompletion = profile ? 
    (Object.values(profile).filter(Boolean).length / Object.keys(profile).length) * 100 : 0;

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Admin Quick Access */}
      {isAdmin && !adminLoading && (
        <div className="bg-primary/10 border-b">
          <div className="container mx-auto px-4 py-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Settings className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium text-primary">Admin Dashboard</span>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => navigate("/admin")}
                className="border-primary text-primary hover:bg-primary hover:text-white"
              >
                Go to Admin Panel
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Welcome back, {profile?.full_name?.split(' ')[0] || 'Student'}!
          </h1>
          <p className="text-muted-foreground mt-1">
            Your journey to German universities continues
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-soft">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Profile Completion</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(profileCompletion)}%</div>
            <Progress value={profileCompletion} className="mt-2" />
          </CardContent>
        </Card>

        <Card className="shadow-soft">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Program Matches</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{matches.length}</div>
            <p className="text-xs text-muted-foreground">
              Based on your profile
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-soft">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Universities</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">400+</div>
            <p className="text-xs text-muted-foreground">
              Programs available
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-soft">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Top Match Score</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {matches.length > 0 ? `${matches[0].compatibility_score}%` : '0%'}
            </div>
            <p className="text-xs text-muted-foreground">
              Compatibility rating
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Two Column Layout for Matches and Saved Programs */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Program Matches */}
        <Card className="shadow-medium">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Your Best Matches
            </CardTitle>
          </CardHeader>
          <CardContent>
            {matches.length > 0 ? (
              <div className="space-y-4">
                {matches.map((match) => (
                  <div
                    key={match.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="space-y-1">
                      <h3 className="font-semibold">{match.program?.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {match.program?.university?.name} • {match.program?.university?.city}
                      </p>
                      <div className="flex gap-2">
                        <Badge variant="secondary">
                          {match.program?.degree_type}
                        </Badge>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-primary">
                        {match.compatibility_score}%
                      </div>
                      <p className="text-xs text-muted-foreground">Match Score</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-semibold mb-2">No matches yet</h3>
                <p className="text-muted-foreground mb-4">
                  Complete your profile to get personalized program recommendations
                </p>
                <Button variant="hero" onClick={() => navigate("/profile")}>Complete Profile</Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Saved Programs */}
        <Card className="shadow-medium">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Bookmark className="h-5 w-5" />
                Saved Programs
              </CardTitle>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => navigate("/saved")}
              >
                View All
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {savedPrograms.length > 0 ? (
              <div className="space-y-3">
                {savedPrograms.map((saved) => (
                  <Link
                    key={saved.id}
                    to={`/universities/${saved.programs.universities.slug}/programs/${saved.programs.slug}`}
                    className="flex items-start gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <Heart className="h-4 w-4 text-primary fill-primary mt-1 shrink-0" />
                    <div className="space-y-1 flex-1 min-w-0">
                      <h3 className="font-medium text-sm line-clamp-1">
                        {formatProgramTitle(saved.programs.degree_type, saved.programs.name)}
                      </h3>
                      <p className="text-xs text-muted-foreground line-clamp-1">
                        {saved.programs.universities.name}
                      </p>
                      <Badge variant="secondary" className="text-xs">
                        {saved.programs.degree_level.charAt(0).toUpperCase() + saved.programs.degree_level.slice(1)}
                      </Badge>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Bookmark className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-semibold mb-2">No saved programs</h3>
                <p className="text-muted-foreground mb-4">
                  Save programs you're interested in to keep track of them
                </p>
                <Button variant="hero" onClick={() => navigate("/search")}>Browse Programs</Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      </div>
    </div>
  );
};

export default Dashboard;