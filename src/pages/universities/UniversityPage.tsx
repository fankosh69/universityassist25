import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import Navigation from '@/components/Navigation';
import SEOHead from '@/components/SEOHead';
import { ExternalLink, MapPin } from 'lucide-react';

export default function UniversityPage() {
  const { uni } = useParams();
  const [university, setUniversity] = useState<any>(null);
  const [programs, setPrograms] = useState<any[]>([]);
  const [ambassadors, setAmbassadors] = useState<any[]>([]);

  useEffect(() => {
    async function fetchData() {
      if (!uni) return;

      // Fetch university
      const { data: uniData } = await supabase
        .from('universities')
        .select('*')
        .or(`slug.eq.${uni},id.eq.${uni}`)
        .single();
      
      setUniversity(uniData);

      if (uniData?.id) {
        // Fetch programs
        const { data: programsData } = await supabase
          .from('programs')
          .select('*')
          .eq('university_id', uniData.id)
          .eq('published', true);
        
        setPrograms(programsData || []);

        // Fetch ambassadors
        const { data: ambassadorsData } = await supabase
          .from('ambassadors')
          .select('*')
          .eq('university_id', uniData.id)
          .eq('is_published', true);
        
        setAmbassadors(ambassadorsData || []);
      }
    }

    fetchData();
  }, [uni]);

  if (!university) return <div>Loading...</div>;

  return (
    <div className="min-h-screen bg-background">
      <SEOHead 
        title={`${university.name} | University Assist`}
        description={`Explore programs and opportunities at ${university.name}. Connect with student ambassadors and find your perfect program.`}
      />
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold mb-2">{university.name}</h1>
              <div className="flex items-center gap-2 text-muted-foreground mb-4">
                <MapPin className="h-4 w-4" />
                <span>{university.city}</span>
              </div>
              <div className="flex gap-2">
                <Badge variant="outline">{university.type || 'Public University'}</Badge>
                {university.ranking && (
                  <Badge variant="secondary">Ranked #{university.ranking}</Badge>
                )}
              </div>
            </div>
            {university.website && (
              <a 
                href={university.website}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-primary hover:underline"
              >
                Visit Website
                <ExternalLink className="h-4 w-4" />
              </a>
            )}
          </div>
        </div>

        <Tabs defaultValue="programs" className="space-y-6">
          <TabsList>
            <TabsTrigger value="programs">Programs ({programs.length})</TabsTrigger>
            <TabsTrigger value="ambassadors">Student Ambassadors ({ambassadors.length})</TabsTrigger>
            <TabsTrigger value="about">About</TabsTrigger>
          </TabsList>

          <TabsContent value="programs" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {programs.map(program => (
                <Card key={program.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="text-lg">{program.name}</CardTitle>
                    <div className="flex gap-2">
                      <Badge variant="outline">{program.degree_type}</Badge>
                      {program.uni_assist_required && (
                        <Badge variant="destructive" className="text-xs">Uni-Assist</Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm text-muted-foreground mb-4">
                      <p>Field: {program.field_of_study}</p>
                      <p>Duration: {program.duration_semesters} semesters</p>
                      <p>Language: {program.language_requirements?.join(', ') || 'German'}</p>
                      {program.tuition_fees > 0 && (
                        <p>Tuition: €{program.tuition_fees}/semester</p>
                      )}
                    </div>
                    <a 
                      href={`/universities/${uni}/programs/${program.slug || program.id}`}
                      className="text-primary hover:underline text-sm font-medium"
                    >
                      View Details →
                    </a>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="ambassadors" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {ambassadors.map(ambassador => (
                <Card key={ambassador.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="pt-6">
                    <div className="text-center">
                      {ambassador.photo_url && (
                        <img 
                          src={ambassador.photo_url}
                          alt={ambassador.full_name}
                          className="w-20 h-20 rounded-full mx-auto mb-4 object-cover"
                        />
                      )}
                      <h3 className="font-semibold text-lg mb-2">{ambassador.full_name}</h3>
                      <div className="flex flex-wrap gap-1 justify-center mb-3">
                        {ambassador.languages?.map((lang: string) => (
                          <Badge key={lang} variant="secondary" className="text-xs">
                            {lang.toUpperCase()}
                          </Badge>
                        ))}
                      </div>
                      <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                        {ambassador.testimonial}
                      </p>
                      <div className="flex gap-2 justify-center">
                        <a 
                          href={`/ambassadors/${ambassador.slug}`}
                          className="text-primary hover:underline text-sm"
                        >
                          Read Story
                        </a>
                        {ambassador.linkedin_url && (
                          <a 
                            href={ambassador.linkedin_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline text-sm"
                          >
                            LinkedIn
                          </a>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="about">
            <Card>
              <CardHeader>
                <CardTitle>About {university.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold mb-2">Basic Information</h3>
                    <div className="space-y-2 text-sm">
                      <p><span className="font-medium">Location:</span> {university.city}</p>
                      <p><span className="font-medium">Type:</span> {university.type || 'Public University'}</p>
                      {university.ranking && (
                        <p><span className="font-medium">Ranking:</span> #{university.ranking}</p>
                      )}
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Programs Offered</h3>
                    <div className="space-y-2 text-sm">
                      <p><span className="font-medium">Total Programs:</span> {programs.length}</p>
                      <p><span className="font-medium">Bachelor's:</span> {programs.filter(p => p.degree_type === 'bachelor').length}</p>
                      <p><span className="font-medium">Master's:</span> {programs.filter(p => p.degree_type === 'master').length}</p>
                    </div>
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