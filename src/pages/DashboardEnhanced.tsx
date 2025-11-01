import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { GamificationService } from "@/services/gamification";
import { XPDisplay } from "@/components/gamification/XPDisplay";
import { BadgeDisplay } from "@/components/gamification/BadgeDisplay";
import { StreakDisplay } from "@/components/gamification/StreakDisplay";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen, FileText, Calendar, Trophy, Target } from "lucide-react";
import LoadingSpinner from "@/components/LoadingSpinner";
import { toast } from "sonner";

export default function DashboardEnhanced() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [matches, setMatches] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/auth');
        return;
      }

      // Update streak
      await GamificationService.updateStreak(user.id);

      // Load gamification stats
      const gamificationStats = await GamificationService.getUserStats(user.id);
      setStats(gamificationStats);

      // Load top matches
      const { data: matchesData } = await supabase
        .from('program_matches_v2')
        .select(`
          *,
          program:programs(*)
        `)
        .eq('profile_id', user.id)
        .order('match_score', { ascending: false })
        .limit(5);

      setMatches(matchesData || []);

      // Load upcoming tasks
      const { data: tasksData } = await supabase
        .from('tasks')
        .select('*')
        .eq('profile_id', user.id)
        .eq('completed', false)
        .order('due_date', { ascending: true })
        .limit(5);

      setTasks(tasksData || []);

    } catch (error: any) {
      console.error('Dashboard load error:', error);
      toast.error('Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-accent/5 py-8">
      <div className="container">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Your Dashboard</h1>
          <p className="text-muted-foreground">Track your progress and achievements</p>
        </div>

        {/* Gamification Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="md:col-span-2">
            <XPDisplay
              currentXP={stats?.xp || 0}
              level={stats?.level || 1}
              xpForNextLevel={stats?.xpForNextLevel || 100}
            />
          </div>
          <StreakDisplay days={stats?.streak || 0} />
        </div>

        {/* Main Content */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:w-auto">
            <TabsTrigger value="overview">
              <Target className="w-4 h-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="matches">
              <BookOpen className="w-4 h-4 mr-2" />
              Matches
            </TabsTrigger>
            <TabsTrigger value="tasks">
              <Calendar className="w-4 h-4 mr-2" />
              Tasks
            </TabsTrigger>
            <TabsTrigger value="achievements">
              <Trophy className="w-4 h-4 mr-2" />
              Badges
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <BookOpen className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{matches.length}</div>
                    <div className="text-sm text-muted-foreground">Program Matches</div>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center">
                    <FileText className="w-6 h-6 text-accent" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold">0</div>
                    <div className="text-sm text-muted-foreground">Applications</div>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-orange-500/10 flex items-center justify-center">
                    <Calendar className="w-6 h-6 text-orange-500" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{tasks.length}</div>
                    <div className="text-sm text-muted-foreground">Pending Tasks</div>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-secondary/10 flex items-center justify-center">
                    <Trophy className="w-6 h-6 text-secondary" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{stats?.badges?.length || 0}</div>
                    <div className="text-sm text-muted-foreground">Badges Earned</div>
                  </div>
                </div>
              </Card>
            </div>

            <Card className="p-6">
              <h3 className="text-xl font-semibold mb-4">Quick Actions</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Button onClick={() => navigate('/search')} className="w-full">
                  Find Programs
                </Button>
                <Button onClick={() => navigate('/documents')} variant="outline" className="w-full">
                  Upload Documents
                </Button>
                <Button onClick={() => navigate('/planner')} variant="outline" className="w-full">
                  View Planner
                </Button>
                <Button onClick={() => navigate('/profile')} variant="outline" className="w-full">
                  Edit Profile
                </Button>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="matches">
            <Card className="p-6">
              <h3 className="text-xl font-semibold mb-4">Top Program Matches</h3>
              {matches.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No matches yet. Complete your profile to get started!</p>
                  <Button onClick={() => navigate('/profile')} className="mt-4">
                    Complete Profile
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {matches.map((match: any) => (
                    <div key={match.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-semibold">{match.program?.name}</h4>
                          <p className="text-sm text-muted-foreground">{match.program?.university_id}</p>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-primary">{Math.round(match.match_score)}%</div>
                          <div className="text-xs text-muted-foreground">Match Score</div>
                        </div>
                      </div>
                      <Button onClick={() => navigate(`/programs/${match.program_id}`)} className="w-full mt-4">
                        View Details
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </TabsContent>

          <TabsContent value="tasks">
            <Card className="p-6">
              <h3 className="text-xl font-semibold mb-4">Upcoming Tasks</h3>
              {tasks.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No tasks yet. Great job staying on top of things!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {tasks.map((task: any) => (
                    <div key={task.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-semibold">{task.title}</h4>
                          {task.description && (
                            <p className="text-sm text-muted-foreground mt-1">{task.description}</p>
                          )}
                        </div>
                        {task.due_date && (
                          <div className="text-sm text-muted-foreground">
                            {new Date(task.due_date).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </TabsContent>

          <TabsContent value="achievements">
            <Card className="p-6">
              <h3 className="text-xl font-semibold mb-4">Your Badges</h3>
              <BadgeDisplay badges={stats?.badges || []} />
            </Card>
          </TabsContent>
        </Tabs>

        {/* Recent XP Activity */}
        {stats?.recentXP && stats.recentXP.length > 0 && (
          <Card className="p-6 mt-6">
            <h3 className="text-xl font-semibold mb-4">Recent Activity</h3>
            <div className="space-y-3">
              {stats.recentXP.map((event: any) => (
                <div key={event.id} className="flex justify-between items-center">
                  <div>
                    <div className="font-medium">{event.description}</div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(event.created_at).toLocaleString()}
                    </div>
                  </div>
                  <div className="text-accent font-bold">+{event.xp_earned} XP</div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
