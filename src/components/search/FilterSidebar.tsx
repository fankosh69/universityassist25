import React, { useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Accordion } from '@/components/ui/accordion';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { FilterGroup } from './FilterGroup';
import { HierarchicalFieldSelect } from './HierarchicalFieldSelect';
import { Search, GraduationCap, MapPin, Euro, Clock, Building2, X, Calendar, Languages, Receipt, Award, ListChecks } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { InfoHint } from '@/components/ui/info-hint';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { DeadlineRangeFilter, type DeadlineRange } from './DeadlineRangeFilter';
import { INSTITUTION_TYPES, CONTROL_TYPES } from '@/lib/institution-types';

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
  myGpa?: number | null; // user's German GPA (1.0 best – 4.0 worst); filters programs they qualify for
  hidePrerequisites?: boolean; // hide programs that list special prerequisites
}

export interface CityOption {
  name: string;
  region?: string | null;
  programCount: number;
}

interface FilterOptions {
  degreeLevels: string[];
  fieldsOfStudy: string[];
  cities: CityOption[];
  durations: number[];
  institutionTypes: string[];
  controlTypes: string[];
}

interface FilterSidebarProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  filters: SearchFilters;
  onFiltersChange: (filters: SearchFilters) => void;
  filterOptions: FilterOptions;
  onClearFilters: () => void;
  hasActiveFilters: boolean;
}

export function FilterSidebar({
  searchQuery,
  onSearchChange,
  filters,
  onFiltersChange,
  filterOptions,
  onClearFilters,
  hasActiveFilters
}: FilterSidebarProps) {
  const updateFilter = (key: keyof SearchFilters, value: any) => {
    onFiltersChange({ ...filters, [key]: value });
  };

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

  // Build city options for searchable combobox
  const cityOptions = useMemo(() => {
    const opts = [{ value: 'all', label: 'All Cities' }];
    const sorted = [...filterOptions.cities].sort((a, b) =>
      a.name.localeCompare(b.name)
    );
    sorted.forEach((c) => {
      const label = c.region
        ? `${c.name} — ${c.region}${c.programCount > 0 ? ` (${c.programCount})` : ' · no programs yet'}`
        : `${c.name}${c.programCount > 0 ? ` (${c.programCount})` : ' · no programs yet'}`;
      opts.push({ value: c.name, label });
    });
    return opts;
  }, [filterOptions.cities]);

  const deadlineActive = !!(filters.deadlineRange?.from || filters.deadlineRange?.to);

  return (
    <div className="h-full flex flex-col">
      {/* Search at top */}
      <div className="p-4 border-b border-border bg-background">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search programs..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Scrollable filters */}
      <div className="flex-1 overflow-y-auto">
        <Accordion type="multiple" defaultValue={[]} className="w-full">
          {/* Degree Level */}
          <FilterGroup 
            value="degree" 
            title="Degree Type" 
            icon={<GraduationCap className="h-4 w-4" />}
            activeCount={filters.degreeLevel !== 'all' ? 1 : 0}
          >
            <RadioGroup value={filters.degreeLevel} onValueChange={(value) => updateFilter('degreeLevel', value)}>
              <div className="flex items-center space-x-2 mb-2">
                <RadioGroupItem value="all" id="degree-all" />
                <Label htmlFor="degree-all" className="text-sm cursor-pointer">All Programs</Label>
              </div>
              {filterOptions.degreeLevels.map(level => (
                <div key={level} className="flex items-center space-x-2 mb-2">
                  <RadioGroupItem value={level} id={`degree-${level}`} />
                  <Label htmlFor={`degree-${level}`} className="text-sm cursor-pointer">
                    {level.charAt(0).toUpperCase() + level.slice(1)}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </FilterGroup>

          {/* Course of Study - Hierarchical */}
          <FilterGroup 
            value="field" 
            title="Course of Study"
            activeCount={(filters.fieldOfStudyIds?.length || 0) > 0 ? filters.fieldOfStudyIds!.length : 0}
          >
            <HierarchicalFieldSelect
              selectedFieldIds={filters.fieldOfStudyIds || []}
              onSelectionChange={(fieldIds) => updateFilter('fieldOfStudyIds', fieldIds.length > 0 ? fieldIds : [])}
            />
          </FilterGroup>

          {/* Location */}
          <FilterGroup 
            value="location" 
            title="Location" 
            icon={<MapPin className="h-4 w-4" />}
            activeCount={filters.city !== 'all' ? 1 : 0}
          >
            <SearchableSelect
              value={filters.city}
              onValueChange={(v) => updateFilter('city', v || 'all')}
              options={cityOptions}
              placeholder="All cities"
              emptyText="No matching city"
              className="w-full"
              maxDisplayOptions={50}
            />
            {filters.city !== 'all' && (
              <button
                type="button"
                onClick={() => updateFilter('city', 'all')}
                className="mt-2 text-xs text-muted-foreground hover:text-foreground underline-offset-2 hover:underline"
              >
                Clear selection
              </button>
            )}
          </FilterGroup>

          {/* Tuition */}
          <FilterGroup 
            value="tuition" 
            title="Tuition Fees" 
            icon={<Euro className="h-4 w-4" />}
            activeCount={filters.maxTuitionFees !== 'all' ? 1 : 0}
          >
            <RadioGroup value={filters.maxTuitionFees} onValueChange={(value) => updateFilter('maxTuitionFees', value)}>
              <div className="flex items-center space-x-2 mb-2">
                <RadioGroupItem value="all" id="tuition-all" />
                <Label htmlFor="tuition-all" className="text-sm cursor-pointer">Any Amount</Label>
              </div>
              <div className="flex items-center space-x-2 mb-2">
                <RadioGroupItem value="1500" id="tuition-free" />
                <Label htmlFor="tuition-free" className="text-sm cursor-pointer flex items-center gap-1.5">
                  Free (incl. semester contribution)
                  <InfoHint
                    content={
                      <p>
                        Most German public universities charge only semester contributions (€100-€350)
                        for administration and student services, not actual tuition. Programs up to
                        €1,500/semester are considered "free" in this filter.
                      </p>
                    }
                  />
                </Label>
              </div>
              <div className="flex items-center space-x-2 mb-2">
                <RadioGroupItem value="1000" id="tuition-1k" />
                <Label htmlFor="tuition-1k" className="text-sm cursor-pointer">Up to €1,000</Label>
              </div>
              <div className="flex items-center space-x-2 mb-2">
                <RadioGroupItem value="5000" id="tuition-5k" />
                <Label htmlFor="tuition-5k" className="text-sm cursor-pointer">Up to €5,000</Label>
              </div>
              <div className="flex items-center space-x-2 mb-2">
                <RadioGroupItem value="10000" id="tuition-10k" />
                <Label htmlFor="tuition-10k" className="text-sm cursor-pointer">Up to €10,000</Label>
              </div>
            </RadioGroup>
          </FilterGroup>

          {/* Institution Type */}
          <FilterGroup 
            value="institution" 
            title="Institution Type" 
            icon={<Building2 className="h-4 w-4" />}
            activeCount={filters.institutionType !== 'all' ? 1 : 0}
          >
            <Select value={filters.institutionType} onValueChange={(value) => updateFilter('institutionType', value)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select type..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {INSTITUTION_TYPES.map(type => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.labelEn}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FilterGroup>

          {/* Control Type Filter */}
          <FilterGroup 
            value="controlType" 
            title="Institution Ownership" 
            icon={<Building2 className="h-4 w-4" />}
            activeCount={filters.controlType !== 'all' ? 1 : 0}
          >
            <Select value={filters.controlType} onValueChange={(value) => updateFilter('controlType', value)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select ownership..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {CONTROL_TYPES.map(type => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.labelEn}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FilterGroup>

          {/* Duration */}
          <FilterGroup 
            value="duration" 
            title="Duration" 
            icon={<Clock className="h-4 w-4" />}
            activeCount={filters.duration !== 'all' ? 1 : 0}
          >
            <Select value={filters.duration} onValueChange={(value) => updateFilter('duration', value)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select duration..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Any Duration</SelectItem>
                {filterOptions.durations.map(duration => (
                  <SelectItem key={duration} value={duration.toString()}>
                    {duration} Semesters
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FilterGroup>

          {/* Uni-Assist */}
          <FilterGroup 
            value="uniassist" 
            title="Application Method"
            activeCount={filters.uniAssistRequired !== 'all' ? 1 : 0}
          >
            <RadioGroup value={filters.uniAssistRequired} onValueChange={(value) => updateFilter('uniAssistRequired', value)}>
              <div className="flex items-center space-x-2 mb-2">
                <RadioGroupItem value="all" id="uniassist-all" />
                <Label htmlFor="uniassist-all" className="text-sm cursor-pointer">All Methods</Label>
              </div>
              <div className="flex items-center space-x-2 mb-2">
                <RadioGroupItem value="direct" id="uniassist-direct" />
                <Label htmlFor="uniassist-direct" className="text-sm cursor-pointer">Direct Application</Label>
              </div>
              <div className="flex items-center space-x-2 mb-2">
                <RadioGroupItem value="uni-assist" id="uniassist-required" />
                <Label htmlFor="uniassist-required" className="text-sm cursor-pointer">Uni-Assist Required</Label>
              </div>
              <div className="flex items-center space-x-2 mb-2">
                <RadioGroupItem value="vpd" id="uniassist-vpd" />
                <Label htmlFor="uniassist-vpd" className="text-sm cursor-pointer">Uni-Assist VPD Required</Label>
              </div>
            </RadioGroup>
          </FilterGroup>

          {/* Application Fee */}
          <FilterGroup 
            value="applicationFee" 
            title="Application Fee" 
            icon={<Receipt className="h-4 w-4" />}
            activeCount={filters.applicationFee !== 'all' ? 1 : 0}
          >
            <RadioGroup value={filters.applicationFee || 'all'} onValueChange={(value) => updateFilter('applicationFee', value)}>
              <div className="flex items-center space-x-2 mb-2">
                <RadioGroupItem value="all" id="appfee-all" />
                <Label htmlFor="appfee-all" className="text-sm cursor-pointer">All Programs</Label>
              </div>
              <div className="flex items-center space-x-2 mb-2">
                <RadioGroupItem value="no-fee" id="appfee-no" />
                <Label htmlFor="appfee-no" className="text-sm cursor-pointer flex items-center gap-1.5">
                  No Application Fee
                  <InfoHint
                    content={
                      <p>
                        Shows only programs with direct application that don't charge an application fee.
                        Uni-Assist programs always have fees (€75 first, €30 additional).
                      </p>
                    }
                  />
                </Label>
              </div>
              <div className="flex items-center space-x-2 mb-2">
                <RadioGroupItem value="has-fee" id="appfee-yes" />
                <Label htmlFor="appfee-yes" className="text-sm cursor-pointer">Has Application Fee</Label>
              </div>
            </RadioGroup>
          </FilterGroup>

          <FilterGroup 
            value="intake" 
            title="Intake Period" 
            icon={<Calendar className="h-4 w-4" />}
            activeCount={filters.intake?.length || 0}
          >
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="intake-both"
                  checked={filters.intake?.includes('both')}
                  onCheckedChange={(checked) => {
                    const currentIntake = filters.intake || [];
                    const newIntake = checked 
                      ? [...currentIntake, 'both']
                      : currentIntake.filter(i => i !== 'both');
                    updateFilter('intake', newIntake);
                  }}
                />
                <Label htmlFor="intake-both" className="text-sm font-normal cursor-pointer">Both Intakes</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="intake-winter"
                  checked={filters.intake?.includes('winter-only')}
                  onCheckedChange={(checked) => {
                    const currentIntake = filters.intake || [];
                    const newIntake = checked 
                      ? [...currentIntake, 'winter-only']
                      : currentIntake.filter(i => i !== 'winter-only');
                    updateFilter('intake', newIntake);
                  }}
                />
                <Label htmlFor="intake-winter" className="text-sm font-normal cursor-pointer">Winter Only</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="intake-summer"
                  checked={filters.intake?.includes('summer-only')}
                  onCheckedChange={(checked) => {
                    const currentIntake = filters.intake || [];
                    const newIntake = checked 
                      ? [...currentIntake, 'summer-only']
                      : currentIntake.filter(i => i !== 'summer-only');
                    updateFilter('intake', newIntake);
                  }}
                />
                <Label htmlFor="intake-summer" className="text-sm font-normal cursor-pointer">Summer Only</Label>
              </div>
            </div>
          </FilterGroup>

          {/* Application Deadline — date range */}
          <FilterGroup 
            value="deadline" 
            title="Application Deadline" 
            icon={<Calendar className="h-4 w-4" />}
            activeCount={deadlineActive ? 1 : 0}
          >
            <DeadlineRangeFilter
              value={filters.deadlineRange || { from: null, to: null }}
              onChange={(v) => updateFilter('deadlineRange', v)}
            />
          </FilterGroup>

          {/* English Language Proof */}
          <FilterGroup 
            value="language-proof" 
            title="English Language Proof" 
            icon={<Languages className="h-4 w-4" />}
            activeCount={
              (filters.acceptsMOI ? 1 : 0) +
              (filters.acceptsIELTS ? 1 : 0) +
              (filters.acceptsTOEFL ? 1 : 0) +
              (filters.acceptsPTE ? 1 : 0)
            }
          >
            <div className="space-y-3">
              {/* MOI Checkbox with Tooltip */}
              <div className="flex items-start space-x-2">
                <Checkbox
                  id="accepts-moi"
                  checked={filters.acceptsMOI}
                  onCheckedChange={(checked) => updateFilter('acceptsMOI', checked)}
                />
                <div className="flex-1">
                  <Label htmlFor="accepts-moi" className="text-sm font-medium flex items-center gap-1.5 cursor-pointer">
                    Accepts MOI Certificate
                    <InfoHint
                      content={
                        <p>
                          Medium of Instruction (MOI) Certificate proves your degree was taught entirely
                          in English. Often accepted as proof of English proficiency without IELTS/TOEFL scores.
                        </p>
                      }
                    />
                  </Label>
                </div>
              </div>
              
              {/* IELTS Checkbox */}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="accepts-ielts"
                  checked={filters.acceptsIELTS}
                  onCheckedChange={(checked) => updateFilter('acceptsIELTS', checked)}
                />
                <Label htmlFor="accepts-ielts" className="text-sm cursor-pointer">
                  Accepts IELTS Academic
                </Label>
              </div>
              
              {/* TOEFL Checkbox */}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="accepts-toefl"
                  checked={filters.acceptsTOEFL}
                  onCheckedChange={(checked) => updateFilter('acceptsTOEFL', checked)}
                />
                <Label htmlFor="accepts-toefl" className="text-sm cursor-pointer">
                  Accepts TOEFL iBT
                </Label>
              </div>
              
              {/* PTE Checkbox */}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="accepts-pte"
                  checked={filters.acceptsPTE}
                  onCheckedChange={(checked) => updateFilter('acceptsPTE', checked)}
                />
                <Label htmlFor="accepts-pte" className="text-sm cursor-pointer">
                  Accepts PTE Academic
                </Label>
              </div>
            </div>
          </FilterGroup>

          {/* Minimum GPA — match against the user's German GPA (1.0 best – 4.0 worst) */}
          <FilterGroup
            value="min-gpa"
            title="My German GPA"
            icon={<Award className="h-4 w-4" />}
            activeCount={typeof filters.myGpa === 'number' ? 1 : 0}
          >
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground">
                Show programs you qualify for. We hide programs whose minimum GPA is stricter than yours.
                <span className="block mt-1">German scale: 1.0 = best · 4.0 = pass.</span>
              </p>
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">
                  {typeof filters.myGpa === 'number' ? filters.myGpa.toFixed(1) : 'Any'}
                </span>
                {typeof filters.myGpa === 'number' && (
                  <button
                    type="button"
                    className="text-xs text-muted-foreground hover:text-foreground underline"
                    onClick={() => updateFilter('myGpa', null)}
                  >
                    Clear
                  </button>
                )}
              </div>
              <Slider
                min={1}
                max={4}
                step={0.1}
                value={[typeof filters.myGpa === 'number' ? filters.myGpa : 2.5]}
                onValueChange={(v) => updateFilter('myGpa', Number(v[0].toFixed(1)))}
              />
              <div className="flex justify-between text-[10px] text-muted-foreground">
                <span>1.0</span><span>2.0</span><span>3.0</span><span>4.0</span>
              </div>
            </div>
          </FilterGroup>

          {/* Prerequisites */}
          <FilterGroup
            value="prerequisites"
            title="Prerequisites"
            icon={<ListChecks className="h-4 w-4" />}
            activeCount={filters.hidePrerequisites ? 1 : 0}
          >
            <div className="flex items-start space-x-2">
              <Checkbox
                id="hide-prereq"
                checked={!!filters.hidePrerequisites}
                onCheckedChange={(checked) => updateFilter('hidePrerequisites', !!checked)}
              />
              <Label htmlFor="hide-prereq" className="text-sm cursor-pointer">
                Hide programs with extra prerequisites
                <span className="block text-xs text-muted-foreground font-normal mt-0.5">
                  Excludes programs that list specific prior coursework or subject requirements.
                </span>
              </Label>
            </div>
          </FilterGroup>
        </Accordion>
      </div>

      {/* Clear filters button at bottom */}
      {hasActiveFilters && (
        <div className="p-4 border-t border-border bg-background">
          <Button 
            variant="outline" 
            className="w-full" 
            onClick={onClearFilters}
          >
            <X className="h-4 w-4 mr-2" />
            Clear All Filters
          </Button>
        </div>
      )}
    </div>
  );
}
