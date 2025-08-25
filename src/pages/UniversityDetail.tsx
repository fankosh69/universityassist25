import { useParams, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import LoadingSpinner from "@/components/LoadingSpinner";
import SEOHead from "@/components/SEOHead";
import JsonLd from "@/components/JsonLd";
import Navigation from "@/components/Navigation";
import { InstitutionTypeBadge } from "@/components/InstitutionTypeBadge";
import { MapPin, Globe, Users, Trophy, GraduationCap, Calendar, Euro, Clock } from "lucide-react";

interface University {
  id: string;
  name: string;
  city: string;
  type: string;
  ranking: number;
  website: string;
  logo_url: string;
  slug: string;
}

interface Program {
  id: string;
  name: string;
  field_of_study: string;
  degree_type: string;
  degree_level: string;
  duration_semesters: number;
  tuition_fees: number;
  uni_assist_required: boolean;
  slug: string;
  program_deadlines: {
    intake: string;
    application_deadline: string;
  }[];
}

export default function UniversityDetail() {
  const { uni } = useParams();
  const [university, setUniversity] = useState<University | null>(null);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUniversity = async () => {
      try {
        const { data: universityData, error: universityError } = await supabase
          .from('universities')
          .select('*')
          .eq('slug', uni)
          .single();

        if (universityError) throw universityError;
        setUniversity(universityData);

        // Fetch programs for this university
        const { data: programsData, error: programsError } = await supabase
          .from('programs')
          .select(`
            *,
            program_deadlines(intake, application_deadline)
          `)
          .eq('university_id', universityData.id)
          .eq('published', true);

        if (programsError) throw programsError;
        setPrograms(programsData || []);
      } catch (error) {
        console.error('Error fetching university:', error);
      } finally {
        setLoading(false);
      }
    };

    if (uni) {
      fetchUniversity();
    }
  }, [uni]);

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

  if (!university) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <Card>
            <CardContent className="p-8 text-center">
              <h2 className="text-2xl font-bold mb-4">University Not Found</h2>
              <p className="text-muted-foreground mb-6">
                The university you're looking for doesn't exist or has been removed.
              </p>
              <Link to="/universities">
                <Button>Browse Universities</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollegeOrUniversity",
    "name": university.name,
    "url": university.website,
    "address": {
      "@type": "PostalAddress",
      "addressLocality": university.city,
      "addressCountry": "DE"
    },
    "logo": university.logo_url
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5">
      <SEOHead 
        title={`${university.name} - ${university.city} | University Assist`}
        description={`Study at ${university.name} in ${university.city}, Germany. Explore ${programs.length} available programs and start your application process.`}
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
            <span>{university.name}</span>
          </nav>
          
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
            <div className="flex gap-6">
              {university.logo_url && (
                <div className="flex-shrink-0">
                  <img 
                    src={university.logo_url} 
                    alt={`${university.name} logo`}
                    className="w-20 h-20 object-contain rounded-lg bg-white p-2"
                    width="80"
                    height="80"
                    loading="lazy"
                    decoding="async"
                  />
                </div>
              )}
              <div>
                <h1 className="text-4xl font-bold mb-4">{university.name}</h1>
                <div className="flex flex-wrap items-center gap-4 text-muted-foreground mb-4">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    <span>{university.city}, Germany</span>
                  </div>
                  {university.website && (
                    <a 
                      href={university.website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 hover:text-primary"
                    >
                      <Globe className="h-5 w-5" />
                      <span>Official Website</span>
                    </a>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  <InstitutionTypeBadge type={university.type} />
                  {university.ranking && (
                    <Badge variant="outline" className="flex items-center gap-1">
                      <Trophy className="h-3 w-3" />
                      Rank #{university.ranking}
                    </Badge>
                  )}
                  <Badge variant="outline" className="flex items-center gap-1">
                    <GraduationCap className="h-3 w-3" />
                    {programs.length} Programs
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </div>

        <Tabs defaultValue="programs" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="programs">Programs</TabsTrigger>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="admissions">Admissions</TabsTrigger>
          </TabsList>
          
          <TabsContent value="programs" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Available Programs</h2>
              <p className="text-muted-foreground">{programs.length} programs found</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {programs.map((program) => (
                <Card key={program.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg mb-2">{program.name}</CardTitle>
                        <div className="flex flex-wrap gap-2 mb-3">
                          <Badge variant="outline">{program.degree_type}</Badge>
                          <Badge variant="secondary">{program.degree_level}</Badge>
                          {program.uni_assist_required && (
                            <Badge variant="destructive">Uni-Assist</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span>{program.duration_semesters} semesters</span>
                      </div>
                      
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Euro className="h-4 w-4" />
                        <span>
                          {program.tuition_fees > 0 
                            ? `€${program.tuition_fees.toLocaleString()} per semester`
                            : 'Free'
                          }
                        </span>
                      </div>
                      
                      {program.program_deadlines?.length > 0 && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          <span>
                            Next deadline: {new Date(program.program_deadlines[0].application_deadline).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                      
                      <div className="pt-3">
                        <Link to={`/universities/${uni}/programs/${program.slug}`}>
                          <Button className="w-full">View Details</Button>
                        </Link>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            
            {programs.length === 0 && (
              <Card>
                <CardContent className="p-8 text-center">
                  <GraduationCap className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">No Programs Available</h3>
                  <p className="text-muted-foreground">
                    This university doesn't have any published programs at the moment.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
          
          <TabsContent value="overview" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>About {university.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed mb-6">
                  {university.name} is a prestigious {university.type.toLowerCase()} located in {university.city}, Germany. 
                  The university offers a wide range of academic programs and is known for its excellent research facilities 
                  and international student community.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="flex items-center gap-3">
                    <MapPin className="h-8 w-8 text-primary" />
                    <div>
                      <p className="font-semibold">Location</p>
                      <p className="text-sm text-muted-foreground">{university.city}, Germany</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <GraduationCap className="h-8 w-8 text-primary" />
                    <div>
                      <p className="font-semibold">Institution Type</p>
                      <p className="text-sm text-muted-foreground">{university.type}</p>
                    </div>
                  </div>
                  
                  {university.ranking && (
                    <div className="flex items-center gap-3">
                      <Trophy className="h-8 w-8 text-primary" />
                      <div>
                        <p className="font-semibold">Ranking</p>
                        <p className="text-sm text-muted-foreground">#{university.ranking} in Germany</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="admissions" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Admission Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <h4 className="font-semibold mb-3">General Requirements</h4>
                    <ul className="space-y-2 text-muted-foreground">
                      <li>• Valid secondary school diploma or equivalent</li>
                      <li>• Proof of German language proficiency (for German-taught programs)</li>
                      <li>• Academic transcripts and certificates</li>
                      <li>• Letter of motivation</li>
                      <li>• CV/Resume</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-3">Application Process</h4>
                    <ol className="space-y-2 text-muted-foreground">
                      <li>1. Choose your desired program</li>
                      <li>2. Check specific admission requirements</li>
                      <li>3. Prepare required documents</li>
                      <li>4. Submit application before deadline</li>
                      <li>5. Wait for admission decision</li>
                    </ol>
                  </div>
                  
                  <div className="pt-4 border-t">
                    <Button size="lg" className="w-full md:w-auto">
                      Start Your Application
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}