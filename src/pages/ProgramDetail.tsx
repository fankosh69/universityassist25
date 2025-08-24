import { useParams, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import LoadingSpinner from "@/components/LoadingSpinner";
import SEOHead from "@/components/SEOHead";
import JsonLd from "@/components/JsonLd";
import Navigation from "@/components/Navigation";
import { MapPin, Clock, Euro, GraduationCap, Calendar, FileText, Heart } from "lucide-react";
import { toast } from "sonner";
import { LanguageFlags } from "@/components/LanguageFlags";
import { formatProgramTitle } from "@/lib/degree-formatting";
import { InstitutionTypeBadge } from "@/components/InstitutionTypeBadge";

interface Program {
  id: string;
  name: string;
  field_of_study: string;
  degree_type: string;
  degree_level: string;
  duration_semesters: number;
  tuition_fees: number;
  language_of_instruction: string[];
  language_requirements: string[];
  prerequisites: string[];
  uni_assist_required: boolean;
  description: string;
  ects_credits: number;
  minimum_gpa: number;
  application_method: string;
  program_url: string;
  winter_intake: boolean;
  summer_intake: boolean;
  winter_deadline: string;
  summer_deadline: string;
  universities: {
    name: string;
    city: string;
    state?: string;
    type: string;
    slug: string;
  };
  program_deadlines: {
    intake: string;
    application_deadline: string;
  }[];
}

export default function ProgramDetail() {
  const { universitySlug, programSlug } = useParams();
  const [program, setProgram] = useState<Program | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSaved, setIsSaved] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });
  }, []);

  useEffect(() => {
    const fetchProgram = async () => {
      try {
        const { data, error } = await supabase
          .from('programs')
          .select(`
            *,
            universities!inner(name, city, type, slug),
            program_deadlines(intake, application_deadline)
          `)
          .eq('slug', programSlug)
          .eq('universities.slug', universitySlug)
          .single();

        if (error) throw error;
        setProgram(data);

        // Check if program is saved
        if (user) {
          const { data: savedData } = await supabase
            .from('saved_programs')
            .select('id')
            .eq('profile_id', user.id)
            .eq('program_id', data.id)
            .single();
          
          setIsSaved(!!savedData);
        }
      } catch (error) {
        console.error('Error fetching program:', error);
        toast.error('Failed to load program details');
      } finally {
        setLoading(false);
      }
    };

    if (programSlug && universitySlug) {
      fetchProgram();
    }
  }, [programSlug, universitySlug, user]);

  const handleSaveProgram = async () => {
    if (!user) {
      toast.error('Please sign in to save programs');
      return;
    }

    if (!program) return;

    try {
      if (isSaved) {
        const { error } = await supabase
          .from('saved_programs')
          .delete()
          .eq('profile_id', user.id)
          .eq('program_id', program.id);

        if (error) throw error;
        setIsSaved(false);
        toast.success('Program removed from saved list');
      } else {
        const { error } = await supabase
          .from('saved_programs')
          .insert({
            profile_id: user.id,
            program_id: program.id
          });

        if (error) throw error;
        setIsSaved(true);
        toast.success('Program saved successfully');
      }
    } catch (error) {
      console.error('Error saving program:', error);
      toast.error('Failed to save program');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  if (!program) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <Card>
            <CardContent className="p-8 text-center">
              <h2 className="text-2xl font-bold mb-4">Program Not Found</h2>
              <p className="text-muted-foreground mb-6">
                The program you're looking for doesn't exist or has been removed.
              </p>
              <Link to="/search">
                <Button>Browse Programs</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Course",
    "name": program.name,
    "description": program.description,
    "provider": {
      "@type": "CollegeOrUniversity",
      "name": program.universities.name,
      "address": {
        "@type": "PostalAddress",
        "addressLocality": program.universities.city,
        "addressCountry": "DE"
      }
    },
    "courseCode": program.degree_type,
    "educationalLevel": program.degree_level,
    "timeRequired": `${program.duration_semesters} semesters`,
    "offers": {
      "@type": "Offer",
      "price": program.tuition_fees,
      "priceCurrency": "EUR"
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5">
      <SEOHead 
        title={`${program.name} - ${program.universities.name} | University Assist`}
        description={`Study ${program.name} at ${program.universities.name} in ${program.universities.city}. ${program.degree_type} in ${program.field_of_study}. ${program.description?.substring(0, 150)}...`}
      />
      <JsonLd data={jsonLd} />
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <nav className="text-sm text-muted-foreground mb-4">
            <Link to="/" className="hover:text-primary">Home</Link>
            <span className="mx-2">/</span>
            <Link to="/universities" className="hover:text-primary">Universities</Link>
            <span className="mx-2">/</span>
            <Link to={`/universities/${universitySlug}`} className="hover:text-primary">
              {program.universities.name}
            </Link>
            <span className="mx-2">/</span>
            <span>{program.name}</span>
          </nav>
          
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
            <div>
              {program.program_url ? (
                <a 
                  href={program.program_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-4xl font-bold mb-4 hover:text-primary transition-colors inline-block"
                >
                  {formatProgramTitle(program.degree_type, program.name)}
                </a>
              ) : (
                <h1 className="text-4xl font-bold mb-4">
                  {formatProgramTitle(program.degree_type, program.name)}
                </h1>
              )}
              <Link 
                to={`/universities/${universitySlug}`}
                className="text-xl text-muted-foreground hover:text-primary transition-colors mb-4 inline-block"
              >
                {program.universities.name}
              </Link>
                <div className="flex flex-wrap items-center gap-4 text-muted-foreground mb-4">
                  <div className="flex items-center gap-2">
                    <GraduationCap className="h-5 w-5" />
                    <Link 
                      to={`/universities/${universitySlug}`}
                      className="hover:text-primary transition-colors"
                    >
                      {program.universities.name}
                    </Link>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    <Link 
                      to={`/cities/${program.universities.city.toLowerCase().replace(/\s+/g, '-')}`}
                      className="hover:text-primary transition-colors"
                    >
                      {program.universities.city}
                    </Link>
                    {program.universities.state && (
                      <span>, {program.universities.state}</span>
                    )}
                  </div>
                </div>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">
                  {program.degree_type.charAt(0).toUpperCase() + program.degree_type.slice(1).toLowerCase()}
                </Badge>
                <Badge variant="outline">
                  {program.degree_level.charAt(0).toUpperCase() + program.degree_level.slice(1).toLowerCase()}
                </Badge>
                <Badge variant="outline">{program.field_of_study}</Badge>
                <InstitutionTypeBadge type={program.universities.type} />
                {program.application_method === 'uni_assist_direct' && (
                  <Badge variant="destructive">Uni-Assist Direct Application</Badge>
                )}
                {program.application_method === 'uni_assist_vpd' && (
                  <Badge variant="destructive">Uni-Assist VPD</Badge>
                )}
                {program.application_method === 'direct' && (
                  <Badge variant="default">Direct Application</Badge>
                )}
              </div>
            </div>
            
            <Button 
              onClick={handleSaveProgram}
              variant={isSaved ? "default" : "outline"}
              size="lg"
              className="flex items-center gap-2"
            >
              <Heart className={`h-5 w-5 ${isSaved ? 'fill-current' : ''}`} />
              {isSaved ? 'Saved' : 'Save Program'}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Program Overview */}
            <Card>
              <CardHeader>
                <CardTitle>Program Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">
                  {program.description || `This ${program.degree_type} program in ${program.field_of_study} offers comprehensive education and practical experience in the field.`}
                </p>
              </CardContent>
            </Card>

            {/* Requirements */}
            <Card>
              <CardHeader>
                <CardTitle>Admission Requirements</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {program.minimum_gpa && (
                  <div>
                    <h4 className="font-semibold mb-2">Minimum GPA</h4>
                    <p>{program.minimum_gpa}/4.0 (German equivalent)</p>
                  </div>
                )}
                
                {program.language_requirements?.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2">Language Requirements</h4>
                    <div className="flex flex-wrap gap-2">
                      {program.language_requirements.map((req, index) => (
                        <Badge key={index} variant="outline">{req}</Badge>
                      ))}
                    </div>
                  </div>
                )}
                
                {program.prerequisites?.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2">Prerequisites</h4>
                    <ul className="list-disc list-inside space-y-1">
                      {program.prerequisites.map((prereq, index) => (
                        <li key={index} className="text-muted-foreground">{prereq}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Application Periods & Intake Information */}
            <Card>
              <CardHeader>
                <CardTitle>Application Periods</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Intake Availability */}
                <div>
                  <h4 className="font-semibold mb-2">Available Intakes</h4>
                  <div className="flex flex-wrap gap-2">
                    {program.winter_intake && program.summer_intake && (
                      <Badge variant="default">Winter and Summer Intake</Badge>
                    )}
                    {program.winter_intake && !program.summer_intake && (
                      <Badge variant="default">Winter Intake Only</Badge>
                    )}
                    {!program.winter_intake && program.summer_intake && (
                      <Badge variant="default">Summer Intake Only</Badge>
                    )}
                  </div>
                </div>

                {/* Application Method */}
                <div>
                  <h4 className="font-semibold mb-2">Application Method</h4>
                  <div className="flex items-center gap-2">
                    {program.application_method === 'direct' && (
                      <Badge variant="outline">Direct Application</Badge>
                    )}
                    {program.application_method === 'uni_assist_direct' && (
                      <Badge variant="destructive">Uni-Assist Direct Application</Badge>
                    )}
                    {program.application_method === 'uni_assist_vpd' && (
                      <Badge variant="destructive">Uni-Assist VPD</Badge>
                    )}
                  </div>
                </div>

                {/* Application Fee */}
                <div>
                  <h4 className="font-semibold mb-2">Application Fee</h4>
                  <div className="flex items-center gap-2">
                    <Badge variant={
                      (program.application_method === 'uni_assist_direct' || program.application_method === 'uni_assist_vpd') 
                        ? "destructive" : "default"
                    }>
                      {(program.application_method === 'uni_assist_direct' || program.application_method === 'uni_assist_vpd') ? 'Yes' : 'No'}
                    </Badge>
                  </div>
                </div>

                {/* Application Periods */}
                <div>
                  <h4 className="font-semibold mb-2">Application Periods</h4>
                  <div className="space-y-3">
                    {program.winter_intake && program.winter_deadline && (
                      <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          <span className="font-medium">Winter Intake</span>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">Application Deadline</p>
                          <span className="text-muted-foreground">
                            {new Date(program.winter_deadline).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    )}
                    {program.summer_intake && program.summer_deadline && (
                      <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          <span className="font-medium">Summer Intake</span>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">Application Deadline</p>
                          <span className="text-muted-foreground">
                            {new Date(program.summer_deadline).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    )}
                    {program.program_deadlines?.length > 0 && program.program_deadlines.map((deadline, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          <span className="font-medium">
                            {deadline.intake.charAt(0).toUpperCase() + deadline.intake.slice(1)} Intake
                          </span>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">Application Deadline</p>
                          <span className="text-muted-foreground">
                            {new Date(deadline.application_deadline).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Program Details */}
            <Card>
              <CardHeader>
                <CardTitle>Program Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Duration</p>
                    <p className="text-sm text-muted-foreground">
                      {program.duration_semesters} semesters
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <Euro className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Tuition Fees</p>
                    <p className="text-sm text-muted-foreground">
                      €{program.tuition_fees?.toLocaleString() || 'Free'} per semester
                    </p>
                  </div>
                </div>
                
                {program.ects_credits && (
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">ECTS Credits</p>
                      <p className="text-sm text-muted-foreground">
                        {program.ects_credits} credits
                      </p>
                    </div>
                  </div>
                )}
                
                <div className="pt-2 border-t">
                  <p className="font-medium mb-2">Language of Instruction</p>
                  <div className="flex flex-wrap gap-2">
                    <LanguageFlags languages={program.language_of_instruction || ['de']} size="md" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* University Info */}
            <Card>
              <CardHeader>
                <CardTitle>University</CardTitle>
              </CardHeader>
              <CardContent>
                    <div className="space-y-3">
                      <div>
                        <Link 
                          to={`/universities/${universitySlug}`}
                          className="font-medium hover:text-primary transition-colors"
                        >
                          {program.universities.name}
                        </Link>
                        <p className="text-sm text-muted-foreground">
                          {program.universities.type} in {program.universities.city}
                        </p>
                      </div>
                      <Link to={`/universities/${universitySlug}`}>
                        <Button variant="outline" size="sm" className="w-full">
                          View University Details
                        </Button>
                      </Link>
                    </div>
              </CardContent>
            </Card>

            {/* Call to Action */}
            <Card>
              <CardHeader>
                <CardTitle>Ready to Apply?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Check your eligibility and start your application process.
                </p>
                <div className="space-y-2">
                  <Button className="w-full">Check Eligibility</Button>
                  <Button variant="outline" className="w-full">
                    Start Application
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}