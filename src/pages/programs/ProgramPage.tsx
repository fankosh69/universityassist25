import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Navigation from '@/components/Navigation';
import SEOHead from '@/components/SEOHead';
import EligibilityPanel from '@/components/EligibilityPanel';
import WatchlistButton from '@/components/WatchlistButton';
import { getDaysUntilDeadline } from '@/lib/tz';
import { Calendar, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LanguageFlags } from '@/components/LanguageFlags';
import { formatProgramTitle } from '@/lib/degree-formatting';
import { Link } from 'react-router-dom';

export default function ProgramPage() {
  const { uni, program } = useParams();
  const [programData, setProgramData] = useState<any>(null);
  const [university, setUniversity] = useState<any>(null);
  const [deadlines, setDeadlines] = useState<any[]>([]);
  const [requirements, setRequirements] = useState<any[]>([]);
  const [studentProfile, setStudentProfile] = useState<any>(null);

  useEffect(() => {
    async function fetchData() {
      if (!program) return;

      // Fetch program
      const { data: prog, error } = await supabase
        .from('programs')
        .select('*')
        .eq('slug', program)
        .maybeSingle();
      
      if (error) {
        console.error('Error fetching program:', error);
        return;
      }
      
      if (!prog) {
        console.error('Program not found with slug:', program);
        return;
      }
      
      // Fetch university separately
      if (prog?.university_id) {
        const { data: universityData } = await supabase
          .from('universities')
          .select('*')
          .eq('id', prog.university_id)
          .maybeSingle();
        setUniversity(universityData);
      }
      
      setProgramData(prog);

      // Fetch deadlines and requirements
      if (prog?.id) {
        const [deadlinesRes, reqRes] = await Promise.all([
          supabase.from('program_deadlines').select('*').eq('program_id', prog.id),
          supabase.from('program_requirements').select('*').eq('program_id', prog.id)
        ]);
        
        setDeadlines(deadlinesRes.data || []);
        setRequirements(reqRes.data || []);
      }

      // Fetch student profile if logged in
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('student_academics')
          .select('*')
          .eq('profile_id', user.id)
          .maybeSingle();
        setStudentProfile(profile);
      }
    }

    fetchData();
  }, [program]);

  if (!programData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Program Not Found</h1>
          <p className="text-muted-foreground mb-4">
            The program you're looking for could not be found.
          </p>
          <Button asChild>
            <Link to="/search">Browse Programs</Link>
          </Button>
        </div>
      </div>
    );
  }

  const programRequirements = {
    minimum_gpa: requirements.find(r => r.requirement_type === 'gpa')?.details?.minimum || 2.5,
    language_requirements: requirements
      .filter(r => r.requirement_type === 'language')
      .map(r => `${Object.keys(r.details)[0]}:${Object.values(r.details)[0]}`)
      .filter(Boolean),
    ects_credits: requirements.find(r => r.requirement_type === 'ects')?.details?.minimum || 180,
    degree_level: programData.degree_level,
    semester_start: deadlines[0]?.intake
  };

  return (
    <div className="min-h-screen bg-background">
      <SEOHead 
        title={`${programData.title} at ${university?.name} | University Assist`}
        description={`${programData.degree_level} in ${programData.major}. Learn about requirements, deadlines, and eligibility.`}
      />
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-4xl font-bold mb-2">
                  {programData.program_url ? (
                    <a 
                      href={programData.program_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="hover:text-primary transition-colors"
                    >
                      {formatProgramTitle(programData.degree_type, programData.name)}
                    </a>
                  ) : (
                    formatProgramTitle(programData.degree_type, programData.name)
                  )}
                </h1>
                <a 
                  href={`/universities/${university?.slug}`}
                  className="text-xl text-muted-foreground hover:text-primary transition-colors mb-4 inline-block"
                >
                  {university?.name}
                </a>
              <div className="flex gap-2 flex-wrap">
                <Badge variant="secondary">
                  {programData.degree_level?.charAt(0).toUpperCase() + programData.degree_level?.slice(1).toLowerCase()}
                </Badge>
                <Badge variant="outline">
                  {programData.degree_type?.charAt(0).toUpperCase() + programData.degree_type?.slice(1).toLowerCase()}
                </Badge>
                <Badge variant="outline">{programData.field_of_study}</Badge>
                {programData.application_method === 'uni_assist' && (
                  <Badge variant="destructive">Uni-Assist Required</Badge>
                )}
                {programData.application_method === 'direct' && (
                  <Badge variant="default">Direct Application</Badge>
                )}
                {/* Intake badges */}
                {programData.winter_intake && programData.summer_intake && (
                  <Badge variant="outline">Winter & Summer Intake</Badge>
                )}
                {programData.winter_intake && !programData.summer_intake && (
                  <Badge variant="outline">Winter Intake Only</Badge>
                )}
                {!programData.winter_intake && programData.summer_intake && (
                  <Badge variant="outline">Summer Intake Only</Badge>
                )}
              </div>
            </div>
            <WatchlistButton programId={programData.id} />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Program Overview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Duration:</span>
                    <p>{programData.duration_semesters} semesters</p>
                  </div>
                  <div>
                    <span className="font-medium">Language:</span>
                    <div className="mt-1">
                      <LanguageFlags languages={programData.language_of_instruction || ['de']} size="md" />
                    </div>
                  </div>
                  <div>
                    <span className="font-medium">Tuition:</span>
                    <p>{programData.semester_fees ? `€${programData.semester_fees}/semester` : 'Free'}</p>
                  </div>
                  <div>
                    <span className="font-medium">ECTS:</span>
                    <p>{programData.ects_credits || 120} credits</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Application Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Available Intakes */}
                <div>
                  <h4 className="font-medium mb-2">Available Intakes</h4>
                  <div className="flex flex-wrap gap-2">
                    {programData.winter_intake && programData.summer_intake && (
                      <Badge variant="default">Winter and Summer Intake</Badge>
                    )}
                    {programData.winter_intake && !programData.summer_intake && (
                      <Badge variant="default">Winter Intake Only</Badge>
                    )}
                    {!programData.winter_intake && programData.summer_intake && (
                      <Badge variant="default">Summer Intake Only</Badge>
                    )}
                  </div>
                </div>

                {/* Application Method */}
                <div>
                  <h4 className="font-medium mb-2">Application Method</h4>
                  <div className="flex items-center gap-2">
                    {programData.application_method === 'direct' && (
                      <Badge variant="outline">Direct Application</Badge>
                    )}
                    {programData.application_method === 'uni_assist_direct' && (
                      <Badge variant="destructive">Uni-Assist Direct Application</Badge>
                    )}
                    {programData.application_method === 'uni_assist_vpd' && (
                      <Badge variant="destructive">Uni-Assist VPD</Badge>
                    )}
                  </div>
                </div>

                {/* Application Fee */}
                <div>
                  <h4 className="font-medium mb-2">Application Fee</h4>
                  <div className="flex items-center gap-2">
                    <Badge variant={
                      (programData.application_method === 'uni_assist_direct' || programData.application_method === 'uni_assist_vpd') 
                        ? "destructive" : "default"
                    }>
                      {(programData.application_method === 'uni_assist_direct' || programData.application_method === 'uni_assist_vpd') ? 'Yes' : 'No'}
                    </Badge>
                  </div>
                </div>

                {/* Application Periods */}
                <div>
                  <h4 className="font-medium mb-2">Application Periods</h4>
                  <div className="space-y-3">
                    {programData.winter_intake && programData.winter_deadline && (
                      <div className="p-3 bg-muted rounded-lg">
                        <p className="text-sm">
                          <span className="font-medium">Winter Intake</span> - Application Open: {programData.winter_application_open_date ? new Date(programData.winter_application_open_date).toLocaleDateString() : 'October 1st'} - Application Deadline: {new Date(programData.winter_deadline).toLocaleDateString()} - {getDaysUntilDeadline(programData.winter_deadline) > 0 
                            ? `${getDaysUntilDeadline(programData.winter_deadline)} days remaining` 
                            : 'Deadline passed'}
                        </p>
                      </div>
                    )}
                    {programData.summer_intake && programData.summer_deadline && (
                      <div className="p-3 bg-muted rounded-lg">
                        <p className="text-sm">
                          <span className="font-medium">Summer Intake</span> - Application Open: {programData.summer_application_open_date ? new Date(programData.summer_application_open_date).toLocaleDateString() : 'October 1st'} - Application Deadline: {new Date(programData.summer_deadline).toLocaleDateString()} - {getDaysUntilDeadline(programData.summer_deadline) > 0 
                            ? `${getDaysUntilDeadline(programData.summer_deadline)} days remaining` 
                            : 'Deadline passed'}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div>
            <EligibilityPanel 
              studentProfile={studentProfile}
              programRequirements={programRequirements}
              className="mb-6"
            />
          </div>
        </div>
      </div>
    </div>
  );
}