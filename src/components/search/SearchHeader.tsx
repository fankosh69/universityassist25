import React from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Grid3x3, List, Filter } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useIsMobile } from '@/hooks/use-mobile';

interface SearchHeaderProps {
  resultCount: number;
  viewMode: 'grid' | 'list';
  onViewModeChange: (mode: 'grid' | 'list') => void;
  sortBy: string;
  onSortChange: (value: string) => void;
  onFilterToggle?: () => void;
  showMobileFilter?: boolean;
}

export function SearchHeader({
  resultCount,
  viewMode,
  onViewModeChange,
  sortBy,
  onSortChange,
  onFilterToggle,
  showMobileFilter = false
}: SearchHeaderProps) {
  const isMobile = useIsMobile();

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-background border-b border-border">
      <div className="flex items-center gap-3">
        <Badge variant="secondary" className="text-sm px-3 py-1">
          {resultCount.toLocaleString()} {resultCount === 1 ? 'Program' : 'Programs'}
        </Badge>
      </div>

      <div className="flex items-center gap-2">
        {/* View toggle - desktop only */}
        {!isMobile && (
          <div className="flex items-center border border-border rounded-md">
            <Button
              variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => onViewModeChange('grid')}
              className="rounded-r-none border-r"
            >
              <Grid3x3 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => onViewModeChange('list')}
              className="rounded-l-none"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Sort dropdown */}
        <Select value={sortBy} onValueChange={onSortChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Sort by..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="relevance">Relevance</SelectItem>
            <SelectItem value="name-asc">Name (A-Z)</SelectItem>
            <SelectItem value="name-desc">Name (Z-A)</SelectItem>
            <SelectItem value="university">University</SelectItem>
            <SelectItem value="city">City</SelectItem>
            <SelectItem value="tuition-asc">Tuition (Low to High)</SelectItem>
            <SelectItem value="tuition-desc">Tuition (High to Low)</SelectItem>
            <SelectItem value="duration-asc">Duration (Shortest)</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
