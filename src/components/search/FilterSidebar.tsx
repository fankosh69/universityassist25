import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Accordion } from '@/components/ui/accordion';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FilterGroup } from './FilterGroup';
import { Search, GraduationCap, MapPin, Euro, Clock, Building2, X } from 'lucide-react';
import { INSTITUTION_TYPES, CONTROL_TYPES } from '@/lib/institution-types';

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
    return Object.values(filters).filter(v => v !== 'all' && v !== null && v !== '').length;
  };

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
        <Accordion type="multiple" defaultValue={['degree', 'field', 'location']} className="w-full">
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

          {/* Field of Study */}
          <FilterGroup 
            value="field" 
            title="Field of Study"
            activeCount={filters.fieldOfStudy !== 'all' ? 1 : 0}
          >
            <Select value={filters.fieldOfStudy} onValueChange={(value) => updateFilter('fieldOfStudy', value)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select field..." />
              </SelectTrigger>
              <SelectContent className="max-h-[300px]">
                <SelectItem value="all">All Fields</SelectItem>
                {filterOptions.fieldsOfStudy.map(field => (
                  <SelectItem key={field} value={field}>
                    {field.charAt(0).toUpperCase() + field.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
                <RadioGroupItem value="0" id="tuition-free" />
                <Label htmlFor="tuition-free" className="text-sm cursor-pointer">Free Only</Label>
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
