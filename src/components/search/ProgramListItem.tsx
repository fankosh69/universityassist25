import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Heart, MapPin, Clock, Euro, ArrowRight, CheckCircle } from 'lucide-react';
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

  return (
    <div className="group p-4 bg-background border border-border hover:shadow-sm transition-shadow">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <Link 
            to={`/universities/${program.universities.slug}/programs/${program.slug}`}
            className="block mb-2"
          >
            <h3 className="font-semibold text-base leading-tight group-hover:text-primary transition-colors truncate">
              {formattedTitle}
            </h3>
          </Link>

          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground mb-2">
            <InstitutionTypeBadge type={program.universities.type} className="text-xs" />
            <Link 
              to={`/universities/${program.universities.slug}`}
              className="truncate hover:text-primary transition-colors"
            >
              {program.universities.name}
            </Link>
            <span>•</span>
            <div className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" />
              <Link 
                to={`/cities/${program.universities.city.toLowerCase().replace(/\s+/g, '-')}`}
                className="hover:text-primary transition-colors"
              >
                {program.universities.city}
              </Link>
            </div>
            <span>•</span>
            <div className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {program.duration_semesters} sem
            </div>
            <span>•</span>
            <div className="flex items-center gap-1">
              <Euro className="h-3.5 w-3.5" />
              {tuitionDisplay}
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5">
            <Badge variant="secondary" className="text-xs">
              {program.degree_level.charAt(0).toUpperCase() + program.degree_level.slice(1)}
            </Badge>
            <ControlTypeBadge type={program.universities.control_type} className="text-xs" />
            <LanguageFlags languages={program.language_of_instruction} size="sm" />
            {program.uni_assist_required && (
              <Badge variant="outline" className="text-xs">
                Uni-Assist
              </Badge>
            )}
            {isEnglishTaught && englishReqs && (
              <>
                {englishReqs.accepts_moi && (
                  <Badge variant="secondary" className="text-xs">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    MOI
                  </Badge>
                )}
                {englishReqs.ielts_academic?.required && (
                  <Badge variant="secondary" className="text-xs">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    IELTS {englishReqs.ielts_academic.overall_min}+
                  </Badge>
                )}
                {englishReqs.toefl_ibt?.required && (
                  <Badge variant="secondary" className="text-xs">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    TOEFL {englishReqs.toefl_ibt.overall_min}+
                  </Badge>
                )}
                {englishReqs.pte_academic?.required && (
                  <Badge variant="secondary" className="text-xs">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    PTE {englishReqs.pte_academic.overall_min}+
                  </Badge>
                )}
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onSave(program.id)}
            className="h-9 w-9"
          >
            <Heart className={`h-4 w-4 ${isSaved ? 'fill-primary text-primary' : ''}`} />
          </Button>
          <Link to={`/universities/${program.universities.slug}/programs/${program.slug}`}>
            <Button variant="outline" size="sm">
              View Details
              <ArrowRight className="h-3.5 w-3.5 ml-1" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
