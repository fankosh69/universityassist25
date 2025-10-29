import React from 'react';
import { ProgramCard } from './ProgramCard';
import { ProgramListItem } from './ProgramListItem';
import { SearchHeader } from './SearchHeader';

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

interface ResultsPanelProps {
  programs: Program[];
  savedPrograms: Set<string>;
  onSaveProgram: (programId: string) => void;
  viewMode: 'grid' | 'list';
  onViewModeChange: (mode: 'grid' | 'list') => void;
  sortBy: string;
  onSortChange: (value: string) => void;
  onFilterToggle?: () => void;
}

export function ResultsPanel({
  programs,
  savedPrograms,
  onSaveProgram,
  viewMode,
  onViewModeChange,
  sortBy,
  onSortChange,
  onFilterToggle
}: ResultsPanelProps) {
  // Sort programs
  const sortedPrograms = React.useMemo(() => {
    const sorted = [...programs];
    
    switch (sortBy) {
      case 'name-asc':
        return sorted.sort((a, b) => a.name.localeCompare(b.name));
      case 'name-desc':
        return sorted.sort((a, b) => b.name.localeCompare(a.name));
      case 'university':
        return sorted.sort((a, b) => a.universities.name.localeCompare(b.universities.name));
      case 'city':
        return sorted.sort((a, b) => a.universities.city.localeCompare(b.universities.city));
      case 'tuition-asc':
        return sorted.sort((a, b) => (a.semester_fees || 0) - (b.semester_fees || 0));
      case 'tuition-desc':
        return sorted.sort((a, b) => (b.semester_fees || 0) - (a.semester_fees || 0));
      case 'duration-asc':
        return sorted.sort((a, b) => a.duration_semesters - b.duration_semesters);
      default: // relevance
        return sorted;
    }
  }, [programs, sortBy]);

  return (
    <div className="min-h-screen bg-neutral-50">
      <SearchHeader
        resultCount={programs.length}
        viewMode={viewMode}
        onViewModeChange={onViewModeChange}
        sortBy={sortBy}
        onSortChange={onSortChange}
        onFilterToggle={onFilterToggle}
        showMobileFilter={true}
      />

      <div className="p-4">
        {sortedPrograms.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold mb-2">No Programs Found</h3>
            <p className="text-muted-foreground max-w-md mb-6">
              Try adjusting your filters or search query to find more programs.
            </p>
            <div className="text-sm text-muted-foreground">
              <p className="mb-1">Suggestions:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Expand your location search</li>
                <li>Remove tuition limit</li>
                <li>Check different fields of study</li>
                <li>Clear all filters and start over</li>
              </ul>
            </div>
          </div>
        ) : (
          <div>
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {sortedPrograms.map(program => (
                  <ProgramCard
                    key={program.id}
                    program={program}
                    isSaved={savedPrograms.has(program.id)}
                    onSave={onSaveProgram}
                  />
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {sortedPrograms.map(program => (
                  <ProgramListItem
                    key={program.id}
                    program={program}
                    isSaved={savedPrograms.has(program.id)}
                    onSave={onSaveProgram}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
