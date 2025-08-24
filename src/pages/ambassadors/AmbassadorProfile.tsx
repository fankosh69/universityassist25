import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Navigation from '@/components/Navigation';
import SEOHead from '@/components/SEOHead';
import { ExternalLink, MapPin, GraduationCap, Play } from 'lucide-react';

export default function AmbassadorProfile() {
  const { slug } = useParams();
  const [ambassador, setAmbassador] = useState<any>(null);

  useEffect(() => {
    async function fetchAmbassador() {
      if (!slug) return;

      const { data } = await supabase
        .from('ambassadors')
        .select(`
          *,
          cities(name),
          universities(name, website)
        `)
        .eq('slug', slug)
        .eq('is_published', true)
        .single();
      
      setAmbassador(data);
    }

    fetchAmbassador();
  }, [slug]);

  if (!ambassador) return <div>Loading...</div>;

  return (
    <div className="min-h-screen bg-background">
      <SEOHead 
        title={`${ambassador.full_name} - Student Ambassador | University Assist`}
        description={`Learn from ${ambassador.full_name}'s journey studying in Germany. ${ambassador.testimonial?.substring(0, 150)}...`}
      />
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header Section */}
          <Card className="mb-8">
            <CardContent className="pt-8">
              <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
                {ambassador.photo_url && (
                  <img 
                    src={ambassador.photo_url}
                    alt={ambassador.full_name}
                    className="w-32 h-32 rounded-full object-cover border-4 border-primary/10"
                    width="128"
                    height="128"
                    loading="lazy"
                    decoding="async"
                  />
                )}
                
                <div className="flex-1 text-center md:text-left">
                  <h1 className="text-3xl font-bold mb-2">{ambassador.full_name}</h1>
                  
                  <div className="flex flex-col md:flex-row gap-4 text-muted-foreground mb-4">
                    {ambassador.cities && (
                      <div className="flex items-center gap-1 justify-center md:justify-start">
                        <MapPin className="h-4 w-4" />
                        <span>{ambassador.cities.name}</span>
                      </div>
                    )}
                    {ambassador.universities && (
                      <div className="flex items-center gap-1 justify-center md:justify-start">
                        <GraduationCap className="h-4 w-4" />
                        <span>{ambassador.universities.name}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2 justify-center md:justify-start mb-4">
                    {ambassador.languages?.map((lang: string) => (
                      <Badge key={lang} variant="secondary">
                        {lang.toUpperCase()}
                      </Badge>
                    ))}
                  </div>

                  {ambassador.study_programs && (
                    <div className="flex flex-wrap gap-2 justify-center md:justify-start mb-6">
                      {ambassador.study_programs.map((program: string) => (
                        <Badge key={program} variant="outline">
                          {program}
                        </Badge>
                      ))}
                    </div>
                  )}

                  <div className="flex gap-2 justify-center md:justify-start">
                    {ambassador.linkedin_url && (
                      <Button 
                        variant="outline"
                        onClick={() => window.open(ambassador.linkedin_url, '_blank')}
                        className="gap-2"
                      >
                        <ExternalLink className="h-4 w-4" />
                        LinkedIn
                      </Button>
                    )}
                    {ambassador.universities?.website && (
                      <Button 
                        variant="outline"
                        onClick={() => window.open(ambassador.universities.website, '_blank')}
                        className="gap-2"
                      >
                        <ExternalLink className="h-4 w-4" />
                        University Website
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Video Section */}
          {ambassador.video_url && (
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Play className="h-5 w-5" />
                  Video Testimonial
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                  <video 
                    controls 
                    className="w-full h-full rounded-lg"
                    poster={ambassador.photo_url}
                  >
                    <source src={ambassador.video_url} type="video/mp4" />
                    Your browser does not support the video tag.
                  </video>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Story Section */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>My Journey to Germany</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose max-w-none">
                <p className="text-lg leading-relaxed">
                  {ambassador.testimonial}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Additional Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Study Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <span className="font-medium">University:</span>
                    <p className="text-muted-foreground">{ambassador.universities?.name}</p>
                  </div>
                  <div>
                    <span className="font-medium">Location:</span>
                    <p className="text-muted-foreground">{ambassador.cities?.name}</p>
                  </div>
                  <div>
                    <span className="font-medium">Programs:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {ambassador.study_programs?.map((program: string) => (
                        <Badge key={program} variant="outline" className="text-xs">
                          {program}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Languages</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground mb-3">
                    I can help you in these languages:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {ambassador.languages?.map((lang: string) => (
                      <Badge key={lang} variant="secondary">
                        {lang.toUpperCase()}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* CTA Section */}
          <Card className="mt-8 bg-primary/5 border-primary/20">
            <CardContent className="pt-6 text-center">
              <h3 className="text-xl font-semibold mb-2">
                Ready to start your journey?
              </h3>
              <p className="text-muted-foreground mb-4">
                Explore programs and universities in Germany
              </p>
              <div className="flex gap-2 justify-center">
                <Button onClick={() => window.location.href = '/search'}>
                  Search Programs
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => window.location.href = `/cities/${ambassador.cities?.name?.toLowerCase()}`}
                >
                  Explore {ambassador.cities?.name}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}