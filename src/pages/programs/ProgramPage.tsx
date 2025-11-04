import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import Navigation from '@/components/Navigation';
import SEOHead from '@/components/SEOHead';
import { ProgramQuickFacts } from '@/components/program/ProgramQuickFacts';
import { ProgramApplicationTimeline } from '@/components/program/ProgramApplicationTimeline';
import { ProgramCosts } from '@/components/program/ProgramCosts';
import { ProgramContact } from '@/components/program/ProgramContact';
import { ProgramSidebar } from '@/components/program/ProgramSidebar';
import { ConsultationModal } from '@/components/consultation/ConsultationModal';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { InstitutionTypeBadge } from '@/components/InstitutionTypeBadge';
import { ControlTypeBadge } from '@/components/ControlTypeBadge';
import { MapPin, GraduationCap, BookOpen, FileCheck, Info, CheckCircle2, XCircle } from 'lucide-react';
import { formatProgramTitle } from '@/lib/degree-formatting';
import type { StudentProfile, ProgramRequirements } from '@/lib/matching';
import { EnglishLanguageRequirementsCard } from '@/components/program/EnglishLanguageRequirementsCard';
import type { EnglishLanguageRequirements } from '@/types/language-requirements';

export default function ProgramPage() {
  const { uni, program } = useParams();
  const [programData, setProgramData] = useState<any>(null);
  const [university, setUniversity] = useState<any>(null);
  const [deadlines, setDeadlines] = useState<any[]>([]);
  const [requirements, setRequirements] = useState<any[]>([]);
  const [studentProfile, setStudentProfile] = useState<StudentProfile | undefined>(undefined);
  const [consultationModalOpen, setConsultationModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      if (!program) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);

      const { data: prog, error } = await supabase
        .from('programs')
        .select('*')
        .eq('slug', program)
        .maybeSingle();
      
      if (error || !prog) {
        console.error('Error fetching program:', error);
        setProgramData(null);
        setIsLoading(false);
        return;
      }
      
      if (prog?.university_id) {
        const { data: universityData } = await supabase
          .from('universities')
          .select('*')
          .eq('id', prog.university_id)
          .maybeSingle();
        setUniversity(universityData);
      }
      
      setProgramData(prog);

      if (prog?.id) {
        const [deadlinesRes, reqRes] = await Promise.all([
          supabase.from('program_deadlines').select('*').eq('program_id', prog.id),
          supabase.from('program_requirements').select('*').eq('program_id', prog.id)
        ]);
        
        setDeadlines(deadlinesRes.data || []);
        setRequirements(reqRes.data || []);
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: academics } = await supabase
          .from('student_academics')
          .select('*')
          .eq('profile_id', user.id)
          .maybeSingle();
        
        if (academics) {
          setStudentProfile({
            gpa_de: academics.gpa_de || 0,
            ects_total: academics.ects_total || 0,
            language_certificates: (academics.language_certificates || []) as { language: string; level: string; certificate_type: string; }[],
            target_intake: academics.target_intake || '',
          });
        }
      }

      setIsLoading(false);
    }

    fetchData();
  }, [program]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading program details...</p>
        </div>
      </div>
    );
  }

  if (!programData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Program Not Found</h1>
          <p className="text-muted-foreground mb-4">The program you're looking for could not be found.</p>
          <Button asChild><Link to="/search">Browse Programs</Link></Button>
        </div>
      </div>
    );
  }

  const programRequirements: ProgramRequirements = {
    minimum_gpa: requirements.find(r => r.requirement_type === 'gpa')?.details?.minimum || 2.5,
    language_requirements: requirements
      .filter(r => r.requirement_type === 'language')
      .map(r => `${Object.keys(r.details)[0]}:${Object.values(r.details)[0]}`)
      .filter(Boolean),
    ects_credits: requirements.find(r => r.requirement_type === 'ects')?.details?.minimum || 180,
    degree_level: programData.degree_level,
    semester_start: deadlines[0]?.intake
  };

  const nextDeadline = programData.winter_deadline 
    ? new Date(programData.winter_deadline) 
    : programData.summer_deadline 
    ? new Date(programData.summer_deadline) 
    : undefined;

  return (
    <div className="min-h-screen bg-background">
      <SEOHead 
        title={`${formatProgramTitle(programData.degree_type, programData.name)} at ${university?.name}`}
        description={`${programData.degree_level} program in ${programData.field_of_study}. Learn about requirements, deadlines, costs, and how to apply.`}
      />
      <Navigation />
      
      <div className="container mx-auto px-4 py-6">
        {/* Breadcrumbs */}
        <Breadcrumb className="mb-6">
          <BreadcrumbList>
            <BreadcrumbItem><BreadcrumbLink href="/">Home</BreadcrumbLink></BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem><BreadcrumbLink href="/search">Programs</BreadcrumbLink></BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem><BreadcrumbLink href={`/universities/${university?.slug}`}>{university?.name}</BreadcrumbLink></BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbPage>{programData.name}</BreadcrumbPage>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Hero Section */}
        <div className="mb-8">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex-1">
              <h1 className="text-3xl md:text-4xl font-bold mb-3">{formatProgramTitle(programData.degree_type, programData.name)}</h1>
              <Link to={`/universities/${university?.slug}`} className="text-xl text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-2 mb-3">
                <GraduationCap className="h-5 w-5" />
                {university?.name}
              </Link>
              <div className="flex items-center gap-2 text-muted-foreground mb-4">
                <MapPin className="h-4 w-4" />
                <span>{university?.city}, Germany</span>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge variant="default" className="text-sm">{programData.degree_level?.toUpperCase()}</Badge>
                <Badge variant="secondary">{programData.degree_type}</Badge>
                <InstitutionTypeBadge type={university?.type} />
                <ControlTypeBadge type={university?.control_type} />
                {programData.uni_assist_required && <Badge variant="outline"><FileCheck className="h-3 w-3 mr-1" />Uni-Assist</Badge>}
              </div>
            </div>
          </div>
        </div>

        {/* Main Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Quick Facts */}
            <ProgramQuickFacts
              durationSemesters={programData.duration_semesters}
              startDates={{ winter: programData.winter_intake ? 'October' : undefined, summer: programData.summer_intake ? 'April' : undefined }}
              languages={programData.language_of_instruction || ['German']}
              tuitionAmount={programData.tuition_amount}
              tuitionFeeStructure={programData.tuition_fee_structure}
              tuitionFees={programData.semester_fees}
              ectsCredits={programData.ects_credits}
              nextDeadline={nextDeadline}
              applicationMethod={programData.application_method}
              uniAssistRequired={programData.uni_assist_required}
              deliveryMode={programData.delivery_mode}
              programUrl={programData.program_url}
            />

            {/* Description */}
            {programData.description && (
              <Card>
                <CardHeader><CardTitle className="flex items-center gap-2"><BookOpen className="h-5 w-5" />Program Description</CardTitle></CardHeader>
                <CardContent><p className="text-muted-foreground whitespace-pre-wrap">{programData.description}</p></CardContent>
              </Card>
            )}

            {/* Admission Requirements */}
            <Card>
              <CardHeader><CardTitle>Admission Requirements</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {programData.prerequisites && (
                  <div><h4 className="font-semibold mb-2 flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-600" />Prerequisites</h4><p className="text-sm text-muted-foreground">{programData.prerequisites}</p></div>
                )}
                {programData.minimum_gpa && (
                  <div><h4 className="font-semibold mb-2">Minimum GPA</h4><p className="text-sm text-muted-foreground">German GPA: {programData.minimum_gpa} or better</p></div>
                )}
                {programData.language_requirements && (
                  <div><h4 className="font-semibold mb-2">Language Requirements</h4><p className="text-sm text-muted-foreground">{programData.language_requirements}</p></div>
                )}
              </CardContent>
            </Card>

            {/* English Language Requirements */}
            {programData.language_of_instruction?.includes('en') && programData.english_language_requirements && (
              <EnglishLanguageRequirementsCard 
                requirements={programData.english_language_requirements as EnglishLanguageRequirements} 
              />
            )}

            {/* Application Timeline */}
            <ProgramApplicationTimeline
              winterIntake={programData.winter_intake ? {
                season: 'winter' as const,
                applicationOpenDate: programData.winter_application_open_date,
                applicationDeadline: programData.winter_deadline,
                semesterStart: programData.winter_semester_start,
                recognitionWeeksBefore: programData.recognition_weeks_before
              } : undefined}
              summerIntake={programData.summer_intake ? {
                season: 'summer' as const,
                applicationOpenDate: programData.summer_application_open_date,
                applicationDeadline: programData.summer_deadline,
                semesterStart: programData.summer_semester_start,
                recognitionWeeksBefore: programData.recognition_weeks_before
              } : undefined}
              applicationMethod={programData.application_method}
              uniAssistRequired={programData.uni_assist_required}
            />

            {/* Costs */}
            <ProgramCosts 
              tuitionAmount={programData.tuition_amount !== undefined ? programData.tuition_amount : programData.semester_fees} 
              tuitionStructure={programData.tuition_fee_structure || 'semester'}
              durationSemesters={programData.duration_semesters} 
            />

            {/* Contact & Apply */}
            <ProgramContact
              programId={programData.id}
              programName={programData.name}
              universityName={university?.name}
              universitySlug={university?.slug}
              universityWebsite={university?.website}
              programUrl={programData.program_url}
              applicationMethod={programData.application_method}
              uniAssistRequired={programData.uni_assist_required}
              onConsultationClick={() => setConsultationModalOpen(true)}
            />
          </div>

          {/* Sidebar */}
          <div className="lg:sticky lg:top-6 lg:self-start">
            <ProgramSidebar
              programId={programData.id}
              programName={programData.name}
              studentProfile={studentProfile}
              programRequirements={programRequirements}
              university={{
                id: university?.id,
                name: university?.name,
                slug: university?.slug,
                city: university?.city,
                type: university?.type,
                control_type: university?.control_type,
                website: university?.website
              }}
              nextDeadline={nextDeadline}
              onConsultationClick={() => setConsultationModalOpen(true)}
            />
          </div>
        </div>
      </div>

      {/* Consultation Modal */}
      <ConsultationModal
        open={consultationModalOpen}
        onOpenChange={setConsultationModalOpen}
        programId={programData.id}
        programName={programData.name}
        universityName={university?.name}
      />
    </div>
  );
}
