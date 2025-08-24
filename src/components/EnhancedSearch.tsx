import React, { useState, useEffect, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { supabase } from '@/integrations/supabase/client';
import { Search, Filter, ChevronDown, MapPin, Clock, Euro, GraduationCap, Heart, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

interface Program {
  id: string;
  name: string;
  degree_type: string;
  degree_level: string;
  field_of_study: string;
  duration_semesters: number;
  tuition_fees: number;
  uni_assist_required: boolean;
  slug: string;
  universities: {
    name: string;
    city: string;
    slug: string;
  };
}

interface SearchFilters {
  degreeLevel: string;
  fieldOfStudy: string;
  city: string;
  maxTuitionFees: string;
  uniAssistRequired: boolean | null;
  duration: string;
}

const EnhancedSearch: React.FC = () => {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [programs, setPrograms] = useState<Program[]>([]);
  const [allPrograms, setAllPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [savedPrograms, setSavedPrograms] = useState<Set<string>>(new Set());
  const [showFilters, setShowFilters] = useState(false);
  
  const [filters, setFilters] = useState<SearchFilters>({
    degreeLevel: '',
    fieldOfStudy: '',
    city: '',
    maxTuitionFees: '',
    uniAssistRequired: null,
    duration: ''
  });

  // Get unique filter options
  const filterOptions = useMemo(() => {
    const degreeLevels = [...new Set(allPrograms.map(p => p.degree_level))].filter(Boolean);
    const fieldsOfStudy = [...new Set(allPrograms.map(p => p.field_of_study))].filter(Boolean);
    const cities = [...new Set(allPrograms.map(p => p.universities?.city))].filter(Boolean);
    const durations = [...new Set(allPrograms.map(p => p.duration_semesters))].filter(Boolean).sort((a, b) => a - b);
    
    return { degreeLevels, fieldsOfStudy, cities, durations };
  }, [allPrograms]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });
  }, []);

  useEffect(() => {
    const fetchPrograms = async () => {
      try {
        const { data, error } = await supabase
          .from('programs')
          .select(`
            *,
            universities!inner(name, city, slug)
          `)
          .eq('published', true)
          .order('name');

        if (error) throw error;
        setAllPrograms(data || []);
        setPrograms(data || []);
      } catch (error) {
        console.error('Error fetching programs:', error);
        toast.error('Failed to load programs');
      } finally {
        setLoading(false);
      }
    };

    fetchPrograms();
  }, []);

  useEffect(() => {
    const fetchSavedPrograms = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from('saved_programs')
          .select('program_id')
          .eq('profile_id', user.id);

        if (error) throw error;
        setSavedPrograms(new Set(data?.map(sp => sp.program_id) || []));
      } catch (error) {
        console.error('Error fetching saved programs:', error);
      }
    };

    fetchSavedPrograms();
  }, [user]);

  // Filter and search programs
  useEffect(() => {
    let filtered = [...allPrograms];

    // Text search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(program =>
        program.name.toLowerCase().includes(query) ||
        program.field_of_study.toLowerCase().includes(query) ||
        program.degree_type.toLowerCase().includes(query) ||
        program.universities?.name.toLowerCase().includes(query) ||
        program.universities?.city.toLowerCase().includes(query)
      );
    }

    // Apply filters
    if (filters.degreeLevel) {
      filtered = filtered.filter(p => p.degree_level === filters.degreeLevel);
    }
    if (filters.fieldOfStudy) {
      filtered = filtered.filter(p => p.field_of_study === filters.fieldOfStudy);
    }
    if (filters.city) {
      filtered = filtered.filter(p => p.universities?.city === filters.city);
    }
    if (filters.maxTuitionFees) {
      const maxFees = parseInt(filters.maxTuitionFees);
      filtered = filtered.filter(p => (p.tuition_fees || 0) <= maxFees);
    }
    if (filters.uniAssistRequired !== null) {
      filtered = filtered.filter(p => p.uni_assist_required === filters.uniAssistRequired);
    }
    if (filters.duration) {
      filtered = filtered.filter(p => p.duration_semesters === parseInt(filters.duration));
    }

    setPrograms(filtered);
  }, [searchQuery, filters, allPrograms]);

  const handleSaveProgram = async (programId: string) => {
    if (!user) {
      toast.error('Please sign in to save programs');
      return;
    }

    try {
      const isCurrentlySaved = savedPrograms.has(programId);
      
      if (isCurrentlySaved) {
        const { error } = await supabase
          .from('saved_programs')
          .delete()
          .eq('profile_id', user.id)
          .eq('program_id', programId);

        if (error) throw error;
        setSavedPrograms(prev => {
          const newSet = new Set(prev);
          newSet.delete(programId);
          return newSet;
        });
        toast.success('Program removed from saved list');
      } else {
        const { error } = await supabase
          .from('saved_programs')
          .insert({
            profile_id: user.id,
            program_id: programId
          });

        if (error) throw error;
        setSavedPrograms(prev => new Set([...prev, programId]));
        toast.success('Program saved successfully');
      }
    } catch (error) {
      console.error('Error saving program:', error);
      toast.error('Failed to save program');
    }
  };

  const clearFilters = () => {
    setFilters({
      degreeLevel: '',
      fieldOfStudy: '',
      city: '',
      maxTuitionFees: '',
      uniAssistRequired: null,
      duration: ''
    });
    setSearchQuery('');
  };

  const hasActiveFilters = Object.values(filters).some(value => 
    value !== '' && value !== null
  ) || searchQuery.trim() !== '';

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="h-10 bg-muted animate-pulse rounded-md flex-1"></div>
          <div className="h-10 w-20 bg-muted animate-pulse rounded-md"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-64 bg-muted animate-pulse rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search and Filter Header */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t('programs.searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2"
          >
            <Filter className="h-4 w-4" />
            {t('common.filter')}
            <ChevronDown className={`h-4 w-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          </Button>
        </div>

        {/* Active filters summary */}
        {hasActiveFilters && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm text-muted-foreground">Active filters:</span>
            {searchQuery && (
              <Badge variant="secondary" className="flex items-center gap-1">
                Search: "{searchQuery}"
                <X className="h-3 w-3 cursor-pointer" onClick={() => setSearchQuery('')} />
              </Badge>
            )}
            {Object.entries(filters).map(([key, value]) => {
              if (!value && value !== false) return null;
              return (
                <Badge key={key} variant="secondary" className="flex items-center gap-1">
                  {key}: {value.toString()}
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => setFilters(prev => ({ ...prev, [key]: key === 'uniAssistRequired' ? null : '' }))} 
                  />
                </Badge>
              );
            })}
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              Clear all
            </Button>
          </div>
        )}

        {/* Filters */}
        <Collapsible open={showFilters} onOpenChange={setShowFilters}>
          <CollapsibleContent className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Search Filters</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Degree Level</label>
                  <Select value={filters.degreeLevel} onValueChange={(value) => setFilters(prev => ({ ...prev, degreeLevel: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Any level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Any level</SelectItem>
                      {filterOptions.degreeLevels.map(level => (
                        <SelectItem key={level} value={level}>{level}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Field of Study</label>
                  <Select value={filters.fieldOfStudy} onValueChange={(value) => setFilters(prev => ({ ...prev, fieldOfStudy: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Any field" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Any field</SelectItem>
                      {filterOptions.fieldsOfStudy.map(field => (
                        <SelectItem key={field} value={field}>{field}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">City</label>
                  <Select value={filters.city} onValueChange={(value) => setFilters(prev => ({ ...prev, city: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Any city" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Any city</SelectItem>
                      {filterOptions.cities.map(city => (
                        <SelectItem key={city} value={city}>{city}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Max Tuition (€/semester)</label>
                  <Select value={filters.maxTuitionFees} onValueChange={(value) => setFilters(prev => ({ ...prev, maxTuitionFees: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Any amount" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Any amount</SelectItem>
                      <SelectItem value="0">Free only</SelectItem>
                      <SelectItem value="1000">Up to €1,000</SelectItem>
                      <SelectItem value="5000">Up to €5,000</SelectItem>
                      <SelectItem value="10000">Up to €10,000</SelectItem>
                      <SelectItem value="20000">Up to €20,000</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Duration (semesters)</label>
                  <Select value={filters.duration} onValueChange={(value) => setFilters(prev => ({ ...prev, duration: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Any duration" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Any duration</SelectItem>
                      {filterOptions.durations.map(duration => (
                        <SelectItem key={duration} value={duration.toString()}>{duration} semesters</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex flex-col space-y-2">
                  <label className="text-sm font-medium">Uni-Assist</label>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="uni-assist-required"
                      checked={filters.uniAssistRequired === true}
                      onCheckedChange={(checked) => 
                        setFilters(prev => ({ 
                          ...prev, 
                          uniAssistRequired: checked ? true : null 
                        }))
                      }
                    />
                    <label htmlFor="uni-assist-required" className="text-sm">
                      Required only
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="uni-assist-not-required"
                      checked={filters.uniAssistRequired === false}
                      onCheckedChange={(checked) => 
                        setFilters(prev => ({ 
                          ...prev, 
                          uniAssistRequired: checked ? false : null 
                        }))
                      }
                    />
                    <label htmlFor="uni-assist-not-required" className="text-sm">
                      Not required only
                    </label>
                  </div>
                </div>
              </CardContent>
            </Card>
          </CollapsibleContent>
        </Collapsible>

        {/* Results count */}
        <div className="flex items-center justify-between">
          <p className="text-muted-foreground">
            {programs.length} {programs.length === 1 ? 'program' : 'programs'} found
          </p>
        </div>
      </div>

      {/* Results */}
      {programs.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {programs.map((program) => (
            <Card key={program.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg mb-2 line-clamp-2">{program.name}</CardTitle>
                    <div className="flex flex-wrap gap-2 mb-3">
                      <Badge variant="outline">{program.degree_type}</Badge>
                      <Badge variant="secondary">{program.degree_level}</Badge>
                      <Badge variant="outline">{program.field_of_study}</Badge>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSaveProgram(program.id)}
                    className="ml-2"
                  >
                    <Heart className={`h-4 w-4 ${savedPrograms.has(program.id) ? 'fill-current text-red-500' : ''}`} />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <GraduationCap className="h-4 w-4" />
                    <span>{program.universities?.name}</span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span>{program.universities?.city}</span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>{program.duration_semesters} semesters</span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Euro className="h-4 w-4" />
                    <span>
                      {program.tuition_fees > 0 
                        ? `€${program.tuition_fees.toLocaleString()}/semester`
                        : 'Free'
                      }
                    </span>
                  </div>

                  {program.uni_assist_required && (
                    <Badge variant="destructive" className="text-xs">
                      Uni-Assist Required
                    </Badge>
                  )}
                  
                  <div className="pt-3">
                    <Link to={`/universities/${program.universities?.slug}/programs/${program.slug}`}>
                      <Button className="w-full">View Details</Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-8 text-center">
            <Search className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">{t('programs.noResults')}</h3>
            <p className="text-muted-foreground mb-4">
              Try adjusting your filters or search terms to find more programs.
            </p>
            {hasActiveFilters && (
              <Button onClick={clearFilters}>Clear All Filters</Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default EnhancedSearch;