import React from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ProgramCard } from './ProgramCard';
import { ProgramListItem } from './ProgramListItem';
import { ProgramMobileCard } from './ProgramMobileCard';
import { SearchHeader } from './SearchHeader';
import { useIsMobile } from '@/hooks/use-mobile';
import { StaggerGroup, StaggerItem } from '@/components/Reveal';
import { useMotionGuard } from '@/hooks/useMotionGuard';

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
  const isMobile = useIsMobile();
  const prefersReduce = useReducedMotion();
  const lowEnd = useMotionGuard();
  const reduce = prefersReduce || lowEnd;

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

  // Signature changes whenever the filtered/sorted result set changes,
  // driving AnimatePresence to crossfade between result sets.
  const resultsKey = React.useMemo(
    () =>
      `${viewMode}:${sortBy}:${sortedPrograms.length}:${sortedPrograms
        .slice(0, 12)
        .map((p) => p.id)
        .join(',')}`,
    [sortedPrograms, viewMode, sortBy]
  );

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
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={resultsKey}
            initial={{ opacity: 0, y: reduce ? 0 : 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: reduce ? 0 : -8 }}
            transition={{ duration: reduce ? 0.15 : 0.3, ease: [0.22, 1, 0.36, 1] }}
          >
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
            ) : isMobile ? (
              <StaggerGroup className="space-y-3" stagger={0.05}>
                {sortedPrograms.map((program) => (
                  <StaggerItem key={program.id} y={12}>
                    <ProgramMobileCard
                      program={program}
                      isSaved={savedPrograms.has(program.id)}
                      onSave={onSaveProgram}
                    />
                  </StaggerItem>
                ))}
              </StaggerGroup>
            ) : viewMode === 'grid' ? (
              <StaggerGroup className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4" stagger={0.05}>
                {sortedPrograms.map((program) => (
                  <StaggerItem key={program.id} y={12}>
                    <ProgramCard
                      program={program}
                      isSaved={savedPrograms.has(program.id)}
                      onSave={onSaveProgram}
                    />
                  </StaggerItem>
                ))}
              </StaggerGroup>
            ) : (
              <StaggerGroup className="space-y-3" stagger={0.04}>
                {sortedPrograms.map((program) => (
                  <StaggerItem key={program.id} y={12}>
                    <ProgramListItem
                      program={program}
                      isSaved={savedPrograms.has(program.id)}
                      onSave={onSaveProgram}
                    />
                  </StaggerItem>
                ))}
              </StaggerGroup>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
