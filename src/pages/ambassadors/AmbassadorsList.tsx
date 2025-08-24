import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import Navigation from '@/components/Navigation';
import SEOHead from '@/components/SEOHead';
import { Search, ExternalLink } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function AmbassadorsList() {
  const { t } = useTranslation();
  const [ambassadors, setAmbassadors] = useState<any[]>([]);
  const [filteredAmbassadors, setFilteredAmbassadors] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('all');
  const [selectedCity, setSelectedCity] = useState('all');

  useEffect(() => {
    async function fetchAmbassadors() {
      const { data } = await supabase
        .from('ambassadors')
        .select(`
          *,
          cities(name),
          universities(name)
        `)
        .eq('is_published', true)
        .order('created_at', { ascending: false });
      
      setAmbassadors(data || []);
      setFilteredAmbassadors(data || []);
    }

    fetchAmbassadors();
  }, []);

  useEffect(() => {
    let filtered = ambassadors;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(ambassador =>
        ambassador.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ambassador.testimonial?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ambassador.study_programs?.some((program: string) => 
          program.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }

    // Language filter
    if (selectedLanguage !== 'all') {
      filtered = filtered.filter(ambassador =>
        ambassador.languages?.includes(selectedLanguage)
      );
    }

    // City filter
    if (selectedCity !== 'all') {
      filtered = filtered.filter(ambassador =>
        ambassador.cities?.name === selectedCity
      );
    }

    setFilteredAmbassadors(filtered);
  }, [ambassadors, searchTerm, selectedLanguage, selectedCity]);

  const uniqueLanguages = [...new Set(
    ambassadors.flatMap(a => a.languages || [])
  )].sort();

  const uniqueCities = [...new Set(
    ambassadors.map(a => a.cities?.name).filter(Boolean)
  )].sort();

  return (
    <div className="min-h-screen bg-background">
      <SEOHead 
        title={`Student Ambassadors | University Assist`}
        description="Connect with student ambassadors who can guide you through your journey to study in Germany. Real experiences, helpful insights."
      />
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold mb-4">{t('nav.ambassadors')}</h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Connect with students who've walked the path before you. Get insights, advice, and support for your German university journey.
          </p>
        </div>

        {/* Filters */}
        <div className="mb-8 space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search ambassadors, programs, or experiences..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value)}
                className="px-3 py-2 border rounded-md bg-background"
              >
                <option value="all">All Languages</option>
                {uniqueLanguages.map(lang => (
                  <option key={lang} value={lang}>{lang.toUpperCase()}</option>
                ))}
              </select>
              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="px-3 py-2 border rounded-md bg-background"
              >
                <option value="all">All Cities</option>
                {uniqueCities.map(city => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Ambassadors Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAmbassadors.map(ambassador => (
            <Card key={ambassador.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="text-center">
                  {ambassador.photo_url && (
                    <img 
                      src={ambassador.photo_url}
                      alt={ambassador.full_name}
                      className="w-24 h-24 rounded-full mx-auto mb-4 object-cover border-4 border-primary/10"
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

                  <div className="text-sm text-muted-foreground mb-3">
                    <p>{ambassador.cities?.name}</p>
                    <p>{ambassador.universities?.name}</p>
                  </div>

                  {ambassador.study_programs && (
                    <div className="flex flex-wrap gap-1 justify-center mb-4">
                      {ambassador.study_programs.slice(0, 2).map((program: string) => (
                        <Badge key={program} variant="outline" className="text-xs">
                          {program}
                        </Badge>
                      ))}
                      {ambassador.study_programs.length > 2 && (
                        <Badge variant="outline" className="text-xs">
                          +{ambassador.study_programs.length - 2} more
                        </Badge>
                      )}
                    </div>
                  )}
                  
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                    {ambassador.testimonial}
                  </p>
                  
                  <div className="flex gap-2 justify-center">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => window.location.href = `/ambassadors/${ambassador.slug}`}
                    >
                      Read Full Story
                    </Button>
                    {ambassador.linkedin_url && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => window.open(ambassador.linkedin_url, '_blank')}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredAmbassadors.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              No ambassadors found matching your criteria. Try adjusting your filters.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}