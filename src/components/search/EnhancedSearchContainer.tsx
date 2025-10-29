import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { SearchLayout } from './SearchLayout';
import { FilterSidebar } from './FilterSidebar';
import { ResultsPanel } from './ResultsPanel';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { normalizeInstitutionType, normalizeControlType } from '@/lib/institution-types';

interface Program {
  id: string;
  name: string;
  degree_type: string;
  degree_level: string;
  field_of_study: string;
  duration_semesters: number;
  semester_fees: number;
  uni_assist_required: boolean;
  application_method: string;
  language_of_instruction: string[];
  slug: string;
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
  city: string;
  maxTuitionFees: string;
  uniAssistRequired: string;
  duration: string;
  institutionType: string;
  controlType: string;
}

export function EnhancedSearchContainer() {
  const [searchQuery, setSearchQuery] = useState('');
  const [programs, setPrograms] = useState<Program[]>([]);
  const [allPrograms, setAllPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [savedPrograms, setSavedPrograms] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState('relevance');
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  
  const [filters, setFilters] = useState<SearchFilters>({
    degreeLevel: 'all',
    fieldOfStudy: 'all',
    city: 'all',
    maxTuitionFees: 'all',
    uniAssistRequired: 'all',
    duration: 'all',
    institutionType: 'all',
    controlType: 'all'
  });

  // Get unique filter options
  const filterOptions = useMemo(() => {
    const degreeLevels = [...new Set(allPrograms.map(p => p.degree_level))].filter(Boolean);
    const fieldsOfStudy = [...new Set(allPrograms.map(p => p.field_of_study))].filter(Boolean);
    const cities = [...new Set(allPrograms.map(p => p.universities?.city))].filter(Boolean);
    const durations = [...new Set(allPrograms.map(p => p.duration_semesters))].filter(Boolean).sort((a, b) => a - b);
    const institutionTypes = [...new Set(allPrograms.map(p => p.universities?.type))].filter(Boolean);
    const controlTypes = [...new Set(allPrograms.map(p => p.universities?.control_type))].filter(Boolean);
    
    return { degreeLevels, fieldsOfStudy, cities, durations, institutionTypes, controlTypes };
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
    if (filters.fieldOfStudy && filters.fieldOfStudy !== 'all') {
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
      city: 'all',
      maxTuitionFees: 'all',
      uniAssistRequired: 'all',
      duration: 'all',
      institutionType: 'all',
      controlType: 'all'
    });
    setSearchQuery('');
  };

  const hasActiveFilters = Object.values(filters).some(value => 
    value !== 'all' && value !== null && value !== ''
  ) || searchQuery.trim() !== '';

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
