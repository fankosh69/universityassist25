import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Heart, MapPin, Clock, Euro, ArrowRight, CheckCircle, GraduationCap, Building2, Globe } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatProgramTitle } from '@/lib/degree-formatting';
import { InstitutionTypeBadge } from '@/components/InstitutionTypeBadge';
import { ControlTypeBadge } from '@/components/ControlTypeBadge';
import { LanguageFlags } from '@/components/LanguageFlags';
import { formatTuitionDisplay, type TuitionStructure } from '@/lib/tuition-calculator';
import type { EnglishLanguageRequirements } from '@/types/language-requirements';

interface Program {
  id: string;
  name: string;
  degree_type: string;
  degree_level: string;
  field_of_study: string;
  duration_semesters: number;
  semester_fees: number;
  tuition_amount?: number;
  tuition_fee_structure?: TuitionStructure;
  uni_assist_required: boolean;
  application_method: string;
  language_of_instruction: string[];
  slug: string;
  english_language_requirements?: EnglishLanguageRequirements;
  universities: {
    name: string;
    city: string;
    type: string;
    control_type: string;
    slug: string;
  };
}

interface ProgramListItemProps {
  program: Program;
  isSaved: boolean;
  onSave: (programId: string) => void;
}

export function ProgramListItem({ program, isSaved, onSave }: ProgramListItemProps) {
  const formattedTitle = formatProgramTitle(program.degree_type, program.name);
  const tuitionDisplay = program.tuition_amount !== undefined && program.tuition_amount !== null
    ? formatTuitionDisplay(program.tuition_amount, program.tuition_fee_structure || 'semester')
    : program.semester_fees === 0 
    ? 'Free' 
    : `€${program.semester_fees.toLocaleString()}/semester`;

  const isEnglishTaught = program.language_of_instruction?.includes('en');
  const englishReqs = program.english_language_requirements;
  const isFree = program.semester_fees === 0 && (program.tuition_amount === undefined || program.tuition_amount === null || program.tuition_amount === 0);
  const levelLabel = program.degree_level.charAt(0).toUpperCase() + program.degree_level.slice(1);

  return (
    <div className="group relative overflow-hidden rounded-xl bg-card border border-border hover:shadow-[var(--shadow-medium)] hover:-translate-y-0.5 transition-all duration-300">
      {/* Left gradient accent */}
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-[image:var(--gradient-hero)]" aria-hidden="true" />

      <div className="flex items-stretch gap-4 p-4 pl-5">
        {/* Left: degree icon block */}
        <div className="hidden sm:flex flex-col items-center justify-center shrink-0 w-20 rounded-lg bg-primary/5 border border-primary/10 p-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-[image:var(--gradient-hero)] text-primary-foreground shadow-sm">
            <GraduationCap className="h-4 w-4" />
          </div>
          <span className="mt-1.5 text-[10px] font-bold uppercase tracking-wider text-primary text-center leading-tight">
            {levelLabel}
          </span>
        </div>

        {/* Center: main content */}
        <div className="flex-1 min-w-0">
          {/* Top badges row */}
          <div className="flex flex-wrap items-center gap-1.5 mb-1.5 sm:hidden">
            <Badge className="text-[10px] uppercase tracking-wider font-semibold bg-primary/10 text-primary hover:bg-primary/15 border-0">
              <GraduationCap className="h-3 w-3 mr-1" />
              {levelLabel}
            </Badge>
          </div>

          <Link
            to={`/universities/${program.universities.slug}/programs/${program.slug}`}
            className="block"
          >
            <h3 className="font-[var(--font-heading)] font-bold text-base sm:text-lg leading-snug text-foreground group-hover:text-primary transition-colors line-clamp-1">
              {formattedTitle}
            </h3>
          </Link>

          {/* University + city row */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5 text-sm">
            <Link
              to={`/universities/${program.universities.slug}`}
              className="flex items-center gap-1.5 text-foreground/80 hover:text-primary transition-colors min-w-0"
            >
              <Building2 className="h-3.5 w-3.5 text-secondary shrink-0" />
              <span className="truncate font-medium">{program.universities.name}</span>
            </Link>
            <Link
              to={`/cities/${program.universities.city.toLowerCase().replace(/\s+/g, '-')}`}
              className="flex items-center gap-1.5 text-muted-foreground hover:text-primary transition-colors"
            >
              <MapPin className="h-3.5 w-3.5 text-accent shrink-0" />
              <span>{program.universities.city}</span>
            </Link>
          </div>

          {/* Inline stat chips */}
          <div className="flex flex-wrap items-center gap-2 mt-2.5">
            <span className="inline-flex items-center gap-1.5 rounded-md bg-muted/60 px-2 py-1 text-xs font-medium text-foreground">
              <Clock className="h-3 w-3 text-muted-foreground" />
              {program.duration_semesters} sem
            </span>
            <span className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-semibold ${isFree ? 'bg-success/10 text-success' : 'bg-muted/60 text-foreground'}`}>
              <Euro className="h-3 w-3" />
              {isFree ? 'Free' : tuitionDisplay.replace('/semester', '/sem')}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-md bg-muted/60 px-2 py-1 text-xs">
              <Globe className="h-3 w-3 text-muted-foreground" />
              <LanguageFlags languages={program.language_of_instruction} size="sm" />
            </span>
            <ControlTypeBadge type={program.universities.control_type} className="text-[10px]" />
            <InstitutionTypeBadge type={program.universities.type} className="text-[10px]" />
            {program.uni_assist_required && (
              <Badge variant="outline" className="text-[10px]">Uni-Assist</Badge>
            )}
            {isEnglishTaught && englishReqs?.accepts_moi && (
              <Badge variant="secondary" className="text-[10px]">
                <CheckCircle className="h-3 w-3 mr-1" />MOI
              </Badge>
            )}
            {isEnglishTaught && englishReqs?.ielts_academic?.required && (
              <Badge variant="secondary" className="text-[10px]">
                <CheckCircle className="h-3 w-3 mr-1" />IELTS {englishReqs.ielts_academic.overall_min}+
              </Badge>
            )}
            {isEnglishTaught && englishReqs?.toefl_ibt?.required && (
              <Badge variant="secondary" className="text-[10px]">
                <CheckCircle className="h-3 w-3 mr-1" />TOEFL {englishReqs.toefl_ibt.overall_min}+
              </Badge>
            )}
          </div>
        </div>

        {/* Right: actions */}
        <div className="flex flex-col items-end justify-between gap-2 shrink-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onSave(program.id)}
            className="h-8 w-8 rounded-full bg-background border border-border hover:bg-muted"
            aria-label={isSaved ? 'Remove from saved' : 'Save program'}
          >
            <Heart className={`h-4 w-4 ${isSaved ? 'fill-primary text-primary' : 'text-muted-foreground'}`} />
          </Button>
          <Link to={`/universities/${program.universities.slug}/programs/${program.slug}`}>
            <Button
              size="sm"
              className="bg-[image:var(--gradient-hero)] hover:opacity-95 text-primary-foreground border-0 shadow-sm group/btn"
            >
              View
              <ArrowRight className="h-3.5 w-3.5 ml-1 transition-transform group-hover/btn:translate-x-0.5" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
