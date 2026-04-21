import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format, parseISO, isValid } from 'date-fns';
import { SearchLayout } from './SearchLayout';
import { FilterSidebar, type CityOption } from './FilterSidebar';
import { ResultsPanel } from './ResultsPanel';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { normalizeInstitutionType, normalizeControlType } from '@/lib/institution-types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Filter, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { DeadlineRange } from './DeadlineRangeFilter';

interface Program {
  id: string;
  name: string;
  degree_type: string;
  degree_level: string;
  field_of_study: string;
  field_of_study_id?: string; // New hierarchical field reference
  duration_semesters: number;
  semester_fees: number;
  uni_assist_required: boolean;
  application_method: string;
  language_of_instruction: string[];
  slug: string;
  winter_intake: boolean;
  summer_intake: boolean;
  winter_deadline: string | null;
  summer_deadline: string | null;
  winter_application_open_date: string | null;
  summer_application_open_date: string | null;
  has_application_fee?: boolean | null;
  application_fee_amount?: number | null;
  universities: {
    name: string;
    city: string;
    type: string;
    control_type: string;
    slug: string;
  };
}

interface SearchFilters {
  degreeLevel: string;
  fieldOfStudy: string;
  fieldOfStudyIds?: string[]; // New hierarchical field selection
  city: string;
  maxTuitionFees: string;
  uniAssistRequired: string;
  duration: string;
  institutionType: string;
  controlType: string;
  intake: string[];
  deadlineRange: DeadlineRange;
  acceptsMOI: boolean;
  acceptsIELTS: boolean;
  acceptsTOEFL: boolean;
  acceptsPTE: boolean;
  applicationFee: string; // 'all' | 'no-fee' | 'has-fee'
}

export function EnhancedSearchContainer() {
  const [searchQuery, setSearchQuery] = useState('');
  const [programs, setPrograms] = useState<Program[]>([]);
  const [allPrograms, setAllPrograms] = useState<Program[]>([]);
  const [allCities, setAllCities] = useState<Array<{ name: string; region: string | null }>>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [savedPrograms, setSavedPrograms] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState('relevance');
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  
  const [filters, setFilters] = useState<SearchFilters>({
    degreeLevel: 'all',
    fieldOfStudy: 'all',
    fieldOfStudyIds: [],
    city: 'all',
    maxTuitionFees: 'all',
    uniAssistRequired: 'all',
    duration: 'all',
    institutionType: 'all',
    controlType: 'all',
    intake: [],
    deadlineRange: { from: null, to: null },
    acceptsMOI: false,
    acceptsIELTS: false,
    acceptsTOEFL: false,
    acceptsPTE: false,
    applicationFee: 'all'
  });

  // Get unique filter options
  const filterOptions = useMemo(() => {
    const degreeLevels = [...new Set(allPrograms.map(p => p.degree_level))].filter(Boolean);
    const fieldsOfStudy = [...new Set(allPrograms.map(p => p.field_of_study))].filter(Boolean);
    const durations = [...new Set(allPrograms.map(p => p.duration_semesters))].filter(Boolean).sort((a, b) => a - b);
    const institutionTypes = [...new Set(allPrograms.map(p => p.universities?.type))].filter(Boolean);
    const controlTypes = [...new Set(allPrograms.map(p => p.universities?.control_type))].filter(Boolean);

    // Program-count map keyed by lowercased city name
    const countByCity = new Map<string, number>();
    allPrograms.forEach((p) => {
      const c = p.universities?.city?.trim();
      if (!c) return;
      const key = c.toLowerCase();
      countByCity.set(key, (countByCity.get(key) || 0) + 1);
    });

    // Merge cities from `cities` table with program counts; include cities that
    // currently have no programs so users can still see/select them.
    const cityMap = new Map<string, CityOption>();
    allCities.forEach((c) => {
      const key = c.name.toLowerCase();
      cityMap.set(key, {
        name: c.name,
        region: c.region,
        programCount: countByCity.get(key) || 0,
      });
    });
    // Also include any program city not present in the cities table (defensive)
    allPrograms.forEach((p) => {
      const c = p.universities?.city?.trim();
      if (!c) return;
      const key = c.toLowerCase();
      if (!cityMap.has(key)) {
        cityMap.set(key, { name: c, region: null, programCount: countByCity.get(key) || 0 });
      }
    });
    const cities: CityOption[] = Array.from(cityMap.values());

    return { degreeLevels, fieldsOfStudy, cities, durations, institutionTypes, controlTypes };
  }, [allPrograms, allCities]);

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
            universities!inner(name, city, type, control_type, slug)
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

  // Fetch full city list for the location filter (independent of programs).
  useEffect(() => {
    const fetchCities = async () => {
      try {
        const { data, error } = await supabase
          .from('cities')
          .select('id, name, slug, region')
          .order('name');
        if (error) throw error;
        setAllCities(
          (data || []).map((c: any) => ({ name: c.name, region: c.region ?? null }))
        );
      } catch (e) {
        console.error('Error fetching cities:', e);
      }
    };
    fetchCities();
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
    if (filters.degreeLevel && filters.degreeLevel !== 'all') {
      filtered = filtered.filter(p => p.degree_level === filters.degreeLevel);
    }
    
    // Use hierarchical field filter if available, otherwise fall back to flat field
    if (filters.fieldOfStudyIds && filters.fieldOfStudyIds.length > 0) {
      filtered = filtered.filter(p => {
        // Check if program has field_of_study_id that matches any selected field
        return p.field_of_study_id && filters.fieldOfStudyIds!.includes(p.field_of_study_id);
      });
    } else if (filters.fieldOfStudy && filters.fieldOfStudy !== 'all') {
      filtered = filtered.filter(p => p.field_of_study === filters.fieldOfStudy);
    }
    
    if (filters.city && filters.city !== 'all') {
      filtered = filtered.filter(p => p.universities?.city === filters.city);
    }
    if (filters.maxTuitionFees && filters.maxTuitionFees !== 'all') {
      const maxFees = parseInt(filters.maxTuitionFees);
      filtered = filtered.filter(p => (p.semester_fees || 0) <= maxFees);
    }
    if (filters.uniAssistRequired && filters.uniAssistRequired !== 'all') {
      if (filters.uniAssistRequired === 'direct') {
        filtered = filtered.filter(p => p.application_method === 'direct');
      } else if (filters.uniAssistRequired === 'uni-assist') {
        filtered = filtered.filter(p => p.uni_assist_required === true && p.application_method !== 'vpd');
      } else if (filters.uniAssistRequired === 'vpd') {
        filtered = filtered.filter(p => p.application_method === 'vpd' || (p.uni_assist_required === true && p.application_method === 'vpd'));
      }
    }
    if (filters.duration && filters.duration !== 'all') {
      filtered = filtered.filter(p => p.duration_semesters === parseInt(filters.duration));
    }
    if (filters.institutionType && filters.institutionType !== 'all') {
      filtered = filtered.filter(p => {
        const normalizedType = normalizeInstitutionType(p.universities?.type || '');
        return normalizedType === filters.institutionType;
      });
    }
    if (filters.controlType && filters.controlType !== 'all') {
      filtered = filtered.filter(p => {
        const normalizedControlType = normalizeControlType(p.universities?.control_type || '');
        return normalizedControlType === filters.controlType;
      });
    }

    // Filter by English Language Proof
    if (filters.acceptsMOI || filters.acceptsIELTS || filters.acceptsTOEFL || filters.acceptsPTE) {
      filtered = filtered.filter(program => {
        const englishReqs = (program as any).english_language_requirements;
        if (!englishReqs || !program.language_of_instruction?.includes('en')) return false;
        
        return (
          (filters.acceptsMOI && englishReqs.accepts_moi) ||
          (filters.acceptsIELTS && englishReqs.ielts_academic?.required) ||
          (filters.acceptsTOEFL && englishReqs.toefl_ibt?.required) ||
          (filters.acceptsPTE && englishReqs.pte_academic?.required)
        );
      });
    }

    // Filter by intake
    if (filters.intake && filters.intake.length > 0) {
      filtered = filtered.filter(program => {
        return filters.intake.some(intakeOption => {
          if (intakeOption === 'both') {
            return program.winter_intake && program.summer_intake;
          } else if (intakeOption === 'winter-only') {
            return program.winter_intake && !program.summer_intake;
          } else if (intakeOption === 'summer-only') {
            return !program.winter_intake && program.summer_intake;
          }
          return false;
        });
      });
    }

    // Filter by application deadline range — winter OR summer deadline within [from, to]
    const dr = filters.deadlineRange;
    if (dr && (dr.from || dr.to)) {
      const fromTs = dr.from ? parseISO(dr.from).getTime() : -Infinity;
      const toTs = dr.to ? parseISO(dr.to).getTime() : Infinity;
      filtered = filtered.filter((program) => {
        const checkDeadline = (raw: string | null) => {
          if (!raw) return false;
          const d = parseISO(raw);
          if (!isValid(d)) return false;
          const ts = d.getTime();
          return ts >= fromTs && ts <= toTs;
        };
        return checkDeadline(program.winter_deadline) || checkDeadline(program.summer_deadline);
      });
    }

    // Filter by application fee
    if (filters.applicationFee && filters.applicationFee !== 'all') {
      filtered = filtered.filter(program => {
        const isUniAssist = program.application_method === 'uni_assist_direct' || 
                           program.application_method === 'uni_assist_vpd';
        const hasAppFee = (program as any).has_application_fee;
        
        if (filters.applicationFee === 'no-fee') {
          // Only direct application programs with explicitly no fee
          return program.application_method === 'direct' && hasAppFee === false;
        } else if (filters.applicationFee === 'has-fee') {
          // Uni-assist programs always have fees, or direct with explicit fee
          return isUniAssist || (program.application_method === 'direct' && hasAppFee === true);
        }
        return true;
      });
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
      degreeLevel: 'all',
      fieldOfStudy: 'all',
      fieldOfStudyIds: [],
      city: 'all',
      maxTuitionFees: 'all',
      uniAssistRequired: 'all',
      duration: 'all',
      institutionType: 'all',
      controlType: 'all',
      intake: [],
      deadlineRange: { from: null, to: null },
      acceptsMOI: false,
      acceptsIELTS: false,
      acceptsTOEFL: false,
      acceptsPTE: false,
      applicationFee: 'all'
    });
    setSearchQuery('');
  };

  const hasActiveFilters = Object.entries(filters).some(([key, value]) => {
    if (key === 'fieldOfStudyIds' || key === 'intake') {
      return Array.isArray(value) && value.length > 0;
    }
    if (key === 'deadlineRange') {
      const v = value as DeadlineRange;
      return !!(v?.from || v?.to);
    }
    if (key === 'acceptsMOI' || key === 'acceptsIELTS' || key === 'acceptsTOEFL' || key === 'acceptsPTE') {
      return value === true;
    }
    if (key === 'applicationFee') {
      return value !== 'all';
    }
    return value !== 'all' && value !== null && value !== '';
  }) || searchQuery.trim() !== '';

  const getActiveFilterCount = () => {
    return Object.entries(filters).filter(([key, value]) => {
      if (key === 'fieldOfStudyIds' || key === 'intake') {
        return Array.isArray(value) && value.length > 0;
      }
      if (key === 'deadlineRange') {
        const v = value as DeadlineRange;
        return !!(v?.from || v?.to);
      }
      if (key === 'acceptsMOI' || key === 'acceptsIELTS' || key === 'acceptsTOEFL' || key === 'acceptsPTE') {
        return value === true;
      }
      if (key === 'applicationFee') {
        return value !== 'all';
      }
      return value !== 'all' && value !== null && value !== '';
    }).length;
  };

  const removeFilter = (key: keyof SearchFilters, value?: string) => {
    if (value && (key === 'intake' || key === 'fieldOfStudyIds')) {
      // Remove specific value from array filter
      setFilters(prev => ({
        ...prev,
        [key]: (prev[key] as string[]).filter(v => v !== value)
      }));
    } else {
      // Clear entire filter
      if (key === 'acceptsMOI' || key === 'acceptsIELTS' || key === 'acceptsTOEFL' || key === 'acceptsPTE') {
        setFilters(prev => ({ ...prev, [key]: false }));
      } else if (key === 'deadlineRange') {
        setFilters(prev => ({ ...prev, deadlineRange: { from: null, to: null } }));
      } else {
        setFilters(prev => ({
          ...prev,
          [key]: (key === 'fieldOfStudyIds' || key === 'intake') ? [] : 'all'
        }));
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="h-64 bg-muted animate-pulse rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  const sidebarContent = (
    <FilterSidebar
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
      filters={filters}
      onFiltersChange={setFilters}
      filterOptions={filterOptions}
      onClearFilters={clearFilters}
      hasActiveFilters={hasActiveFilters}
    />
  );

  return (
    <>
      <SearchLayout
        sidebar={sidebarContent}
        results={
          <>
            {/* Mobile-only search bar and filters - sticky at top */}
            <div className="lg:hidden sticky top-0 z-20 bg-background border-b shadow-sm">
              <div className="p-3 space-y-2">
                {/* Search input */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search programs..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 h-11"
                  />
                </div>

                {/* Filter button */}
                <Button
                  variant="outline"
                  onClick={() => setMobileFiltersOpen(true)}
                  className="w-full h-11"
                >
                  <Filter className="h-4 w-4 mr-2" />
                  Filters
                  {getActiveFilterCount() > 0 && (
                    <Badge variant="secondary" className="ml-2 px-1.5 min-w-[20px] h-5">
                      {getActiveFilterCount()}
                    </Badge>
                  )}
                </Button>
              </div>

              {/* Active filter chips */}
              {hasActiveFilters && (
                <div className="px-3 pb-3 flex flex-wrap gap-1.5">
                  {searchQuery && (
                    <Badge variant="secondary" className="text-xs">
                      Search: {searchQuery}
                      <X
                        className="h-3 w-3 ml-1 cursor-pointer"
                        onClick={() => setSearchQuery('')}
                      />
                    </Badge>
                  )}
                  {filters.degreeLevel !== 'all' && (
                    <Badge variant="secondary" className="text-xs">
                      {filters.degreeLevel}
                      <X
                        className="h-3 w-3 ml-1 cursor-pointer"
                        onClick={() => removeFilter('degreeLevel')}
                      />
                    </Badge>
                  )}
                  {filters.city !== 'all' && (
                    <Badge variant="secondary" className="text-xs">
                      {filters.city}
                      <X
                        className="h-3 w-3 ml-1 cursor-pointer"
                        onClick={() => removeFilter('city')}
                      />
                    </Badge>
                  )}
                  {filters.maxTuitionFees !== 'all' && (
                    <Badge variant="secondary" className="text-xs">
                      ≤€{filters.maxTuitionFees}
                      <X
                        className="h-3 w-3 ml-1 cursor-pointer"
                        onClick={() => removeFilter('maxTuitionFees')}
                      />
                    </Badge>
                  )}
                  {filters.fieldOfStudy !== 'all' && (
                    <Badge variant="secondary" className="text-xs">
                      {filters.fieldOfStudy}
                      <X
                        className="h-3 w-3 ml-1 cursor-pointer"
                        onClick={() => removeFilter('fieldOfStudy')}
                      />
                    </Badge>
                  )}
                  {filters.intake?.map(intake => (
                    <Badge key={intake} variant="secondary" className="text-xs">
                      {intake === 'both' ? 'Both Intakes' : intake === 'winter-only' ? 'Winter Only' : 'Summer Only'}
                      <X
                        className="h-3 w-3 ml-1 cursor-pointer"
                        onClick={() => removeFilter('intake', intake)}
                      />
                    </Badge>
                  ))}
                  {(filters.deadlineRange?.from || filters.deadlineRange?.to) && (() => {
                    const fmt = (iso: string | null, fallback: string) => {
                      if (!iso) return fallback;
                      try {
                        const d = parseISO(iso);
                        return isValid(d) ? format(d, 'MMM d, yyyy') : fallback;
                      } catch {
                        return fallback;
                      }
                    };
                    const label = `Deadline ${fmt(filters.deadlineRange.from, 'today')} – ${fmt(filters.deadlineRange.to, '+18 mo')}`;
                    return (
                      <Badge variant="secondary" className="text-xs">
                        {label}
                        <X
                          className="h-3 w-3 ml-1 cursor-pointer"
                          onClick={() => removeFilter('deadlineRange')}
                        />
                      </Badge>
                    );
                  })()}
                  {filters.acceptsMOI && (
                    <Badge variant="secondary" className="text-xs">
                      Accepts MOI
                      <X
                        className="h-3 w-3 ml-1 cursor-pointer"
                        onClick={() => removeFilter('acceptsMOI')}
                      />
                    </Badge>
                  )}
                  {filters.acceptsIELTS && (
                    <Badge variant="secondary" className="text-xs">
                      Accepts IELTS
                      <X
                        className="h-3 w-3 ml-1 cursor-pointer"
                        onClick={() => removeFilter('acceptsIELTS')}
                      />
                    </Badge>
                  )}
                  {filters.acceptsTOEFL && (
                    <Badge variant="secondary" className="text-xs">
                      Accepts TOEFL
                      <X
                        className="h-3 w-3 ml-1 cursor-pointer"
                        onClick={() => removeFilter('acceptsTOEFL')}
                      />
                    </Badge>
                  )}
                  {filters.acceptsPTE && (
                    <Badge variant="secondary" className="text-xs">
                      Accepts PTE
                      <X
                        className="h-3 w-3 ml-1 cursor-pointer"
                        onClick={() => removeFilter('acceptsPTE')}
                      />
                    </Badge>
                  )}
                </div>
              )}
            </div>

            <ResultsPanel
              programs={programs}
              savedPrograms={savedPrograms}
              onSaveProgram={handleSaveProgram}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
              sortBy={sortBy}
              onSortChange={setSortBy}
              onFilterToggle={() => setMobileFiltersOpen(true)}
            />
          </>
        }
      />

      {/* Mobile filter drawer */}
      <Sheet open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
        <SheetContent side="left" className="w-80 p-0">
          <SheetHeader className="px-4 py-3 border-b">
            <SheetTitle>Filters</SheetTitle>
          </SheetHeader>
          {sidebarContent}
        </SheetContent>
      </Sheet>
    </>
  );
}
