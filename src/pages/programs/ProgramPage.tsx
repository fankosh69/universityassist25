import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Navigation from '@/components/Navigation';
import SEOHead from '@/components/SEOHead';
import EligibilityPanel from '@/components/EligibilityPanel';
import WatchlistButton from '@/components/WatchlistButton';
import { getDaysUntilDeadline, createICSEvent, downloadICS } from '@/lib/tz';
import { Calendar, Download, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LanguageFlags } from '@/components/LanguageFlags';
import { formatProgramTitle } from '@/lib/degree-formatting';

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
      const { data: prog } = await supabase
        .from('programs')
        .select('*')
        .eq('slug', program)
        .single();
      
      // Fetch university separately
      if (prog?.university_id) {
        const { data: universityData } = await supabase
          .from('universities')
          .select('*')
          .eq('id', prog.university_id)
          .single();
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
          .single();
        setStudentProfile(profile);
      }
    }

    fetchData();
  }, [program]);

  const handleExportDeadline = (deadline: any) => {
    const icsContent = createICSEvent(
      `Application Deadline - ${programData.title}`,
      deadline.application_deadline,
      `Application deadline for ${programData.title} at ${university?.name}`
    );
    downloadICS(`${programData.title}-deadline.ics`, icsContent);
  };

  if (!programData) return <div>Loading...</div>;

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
                    <p>{programData.tuition_fees ? `€${programData.tuition_fees}/semester` : 'Free'}</p>
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
                      <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                        <div>
                          <h5 className="font-medium">Winter Intake</h5>
                          <p className="text-sm text-muted-foreground">
                            Deadline: {new Date(programData.winter_deadline).toLocaleDateString()}
                          </p>
                          <p className="text-sm">
                            {getDaysUntilDeadline(programData.winter_deadline) > 0 
                              ? `${getDaysUntilDeadline(programData.winter_deadline)} days remaining` 
                              : 'Deadline passed'}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleExportDeadline({ application_deadline: programData.winter_deadline, intake: 'winter' })}
                          className="gap-2"
                        >
                          <Download className="h-4 w-4" />
                          Export
                        </Button>
                      </div>
                    )}
                    {programData.summer_intake && programData.summer_deadline && (
                      <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                        <div>
                          <h5 className="font-medium">Summer Intake</h5>
                          <p className="text-sm text-muted-foreground">
                            Deadline: {new Date(programData.summer_deadline).toLocaleDateString()}
                          </p>
                          <p className="text-sm">
                            {getDaysUntilDeadline(programData.summer_deadline) > 0 
                              ? `${getDaysUntilDeadline(programData.summer_deadline)} days remaining` 
                              : 'Deadline passed'}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleExportDeadline({ application_deadline: programData.summer_deadline, intake: 'summer' })}
                          className="gap-2"
                        >
                          <Download className="h-4 w-4" />
                          Export
                        </Button>
                      </div>
                    )}
                    {deadlines.map(deadline => {
                      const daysRemaining = getDaysUntilDeadline(deadline.application_deadline);
                      return (
                        <div key={deadline.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                          <div>
                            <h5 className="font-medium capitalize">{deadline.intake} Intake</h5>
                            <p className="text-sm text-muted-foreground">
                              Deadline: {new Date(deadline.application_deadline).toLocaleDateString()}
                            </p>
                            <p className="text-sm">
                              {daysRemaining > 0 ? `${daysRemaining} days remaining` : 'Deadline passed'}
                            </p>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleExportDeadline(deadline)}
                            className="gap-2"
                          >
                            <Download className="h-4 w-4" />
                            Export
                          </Button>
                        </div>
                      );
                    })}
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