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
import { Search, GraduationCap, MapPin, Euro, Clock, Building2, X, Calendar, Info, Languages } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { INSTITUTION_TYPES, CONTROL_TYPES } from '@/lib/institution-types';
import { format, addMonths, startOfMonth } from 'date-fns';

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
  applicationStatus: string[];
  acceptsMOI: boolean;
  acceptsIELTS: boolean;
  acceptsTOEFL: boolean;
  acceptsPTE: boolean;
}

interface FilterOptions {
  degreeLevels: string[];
  fieldsOfStudy: string[];
  cities: string[];
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
      if (key === 'fieldOfStudyIds' || key === 'intake' || key === 'applicationStatus') {
        return Array.isArray(value) && value.length > 0;
      }
      if (key === 'acceptsMOI' || key === 'acceptsIELTS' || key === 'acceptsTOEFL' || key === 'acceptsPTE') {
        return value === true;
      }
      return value !== 'all' && value !== null && value !== '';
    }).length;
  };

  // Generate next 12 months for deadline filter
  const availableMonths = useMemo(() => {
    const months = [];
    const now = startOfMonth(new Date());
    for (let i = 0; i < 12; i++) {
      const month = addMonths(now, i);
      months.push({
        value: format(month, 'yyyy-MM'),
        label: format(month, 'MMMM yyyy')
      });
    }
    return months;
  }, []);

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
            <Select value={filters.city} onValueChange={(value) => updateFilter('city', value)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select city..." />
              </SelectTrigger>
              <SelectContent className="max-h-[300px]">
                <SelectItem value="all">All Cities</SelectItem>
                {filterOptions.cities.sort().map(city => (
                  <SelectItem key={city} value={city}>
                    {city.charAt(0).toUpperCase() + city.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-[280px] text-xs">
                        <p>
                          Most German public universities charge only semester contributions (€100-€350) 
                          for administration and student services, not actual tuition. Programs up to 
                          €1,500/semester are considered "free" in this filter.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
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

          {/* Intake Period */}
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

          {/* Application Deadline Month */}
          <FilterGroup 
            value="deadline" 
            title="Application Deadline" 
            icon={<Calendar className="h-4 w-4" />}
            activeCount={filters.applicationStatus?.length || 0}
          >
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {availableMonths.map(month => (
                <div key={month.value} className="flex items-center space-x-2">
                  <Checkbox 
                    id={`month-${month.value}`}
                    checked={filters.applicationStatus?.includes(month.value)}
                    onCheckedChange={(checked) => {
                      const currentStatus = filters.applicationStatus || [];
                      const newStatus = checked 
                        ? [...currentStatus, month.value]
                        : currentStatus.filter(s => s !== month.value);
                      updateFilter('applicationStatus', newStatus);
                    }}
                  />
                  <Label htmlFor={`month-${month.value}`} className="text-sm font-normal cursor-pointer">
                    {month.label}
                  </Label>
                </div>
              ))}
            </div>
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
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs">
                          <p>Medium of Instruction (MOI) Certificate proves your degree was taught entirely in English. Often accepted as proof of English proficiency without IELTS/TOEFL scores.</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
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
