import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Heart, MapPin, Clock, Euro, Globe, ChevronDown, ChevronUp, CheckCircle, GraduationCap, Building2, ArrowRight } from 'lucide-react';
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

interface ProgramMobileCardProps {
  program: Program;
  isSaved: boolean;
  onSave: (programId: string) => void;
}

export function ProgramMobileCard({ program, isSaved, onSave }: ProgramMobileCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const formattedTitle = formatProgramTitle(program.degree_type, program.name);
  const tuitionDisplay = program.tuition_amount !== undefined && program.tuition_amount !== null
    ? formatTuitionDisplay(program.tuition_amount, program.tuition_fee_structure || 'semester').replace('/semester', '/sem').replace('/month', '/mo').replace('/year', '/yr')
    : program.semester_fees === 0 
    ? 'Free' 
    : `€${program.semester_fees.toLocaleString()}/sem`;

  const isEnglishTaught = program.language_of_instruction?.includes('en');
  const englishReqs = program.english_language_requirements;
  const isFree = program.semester_fees === 0 && (program.tuition_amount === undefined || program.tuition_amount === null || program.tuition_amount === 0);
  const levelLabel = program.degree_level.charAt(0).toUpperCase() + program.degree_level.slice(1);

  return (
    <Card className="group relative overflow-hidden border border-border bg-card hover:shadow-[var(--shadow-medium)] transition-all duration-300">
      {/* Gradient top accent */}
      <div className="h-1 w-full bg-[image:var(--gradient-hero)]" aria-hidden="true" />

      {/* Floating save */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => onSave(program.id)}
        className="absolute top-2.5 right-2.5 z-10 h-8 w-8 rounded-full bg-background/80 backdrop-blur border border-border hover:bg-background"
        aria-label={isSaved ? 'Remove from saved' : 'Save program'}
      >
        <Heart className={`h-4 w-4 ${isSaved ? 'fill-primary text-primary' : 'text-muted-foreground'}`} />
      </Button>

      <CardContent className="p-3.5">
        {/* Header: degree pill + title */}
        <div className="flex flex-wrap items-center gap-1.5 mb-2 pr-9">
          <Badge className="text-[10px] uppercase tracking-wider font-semibold bg-primary/10 text-primary hover:bg-primary/15 border-0">
            <GraduationCap className="h-3 w-3 mr-1" />
            {levelLabel}
          </Badge>
          <ControlTypeBadge type={program.universities.control_type} className="text-[10px]" />
        </div>

        <Link
          to={`/universities/${program.universities.slug}/programs/${program.slug}`}
          className="block mb-2.5 pr-2"
        >
          <h3 className="font-[var(--font-heading)] font-bold text-[15px] leading-snug text-foreground group-hover:text-primary transition-colors line-clamp-2">
            {formattedTitle}
          </h3>
        </Link>

        {/* University + city */}
        <div className="space-y-1 mb-3">
          <Link
            to={`/universities/${program.universities.slug}`}
            className="flex items-center gap-1.5 text-xs text-foreground/80 hover:text-primary transition-colors"
          >
            <Building2 className="h-3.5 w-3.5 text-secondary shrink-0" />
            <span className="truncate font-medium">{program.universities.name}</span>
          </Link>
          <Link
            to={`/cities/${program.universities.city.toLowerCase().replace(/\s+/g, '-')}`}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors"
          >
            <MapPin className="h-3.5 w-3.5 text-accent shrink-0" />
            <span>{program.universities.city}</span>
          </Link>
        </div>

        {/* Stat tiles row */}
        <div className="grid grid-cols-3 gap-1.5 rounded-lg bg-muted/50 p-2">
          <div className="flex flex-col items-center text-center">
            <Clock className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="mt-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">Duration</span>
            <span className="text-xs font-semibold text-foreground">{program.duration_semesters} sem</span>
          </div>
          <div className="flex flex-col items-center text-center">
            <Euro className={`h-3.5 w-3.5 ${isFree ? 'text-success' : 'text-muted-foreground'}`} />
            <span className={`mt-0.5 text-[10px] uppercase tracking-wide ${isFree ? 'text-success' : 'text-muted-foreground'}`}>Tuition</span>
            <span className={`text-xs font-semibold leading-tight ${isFree ? 'text-success' : 'text-foreground'}`}>{isFree ? 'Free' : tuitionDisplay}</span>
          </div>
          <div className="flex flex-col items-center text-center">
            <Globe className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="mt-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">Lang</span>
            <div className="mt-0.5">
              <LanguageFlags languages={program.language_of_instruction} size="sm" />
            </div>
          </div>
        </div>

        {/* Expandable details */}
        {isExpanded && (
          <div className="space-y-2 pt-3 border-t border-border mt-3">
            <div className="flex flex-wrap gap-1.5">
              <InstitutionTypeBadge type={program.universities.type} className="text-xs" />
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

            <Link to={`/universities/${program.universities.slug}/programs/${program.slug}`}>
              <Button
                size="sm"
                className="w-full mt-1 bg-[image:var(--gradient-hero)] hover:opacity-95 text-primary-foreground border-0 shadow-sm"
              >
                View Full Details
                <ArrowRight className="h-3.5 w-3.5 ml-1" />
              </Button>
            </Link>
          </div>
        )}

        {/* Expand/Collapse toggle */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full mt-2 h-8 text-xs text-muted-foreground hover:text-foreground"
        >
          {isExpanded ? (
            <>
              <ChevronUp className="h-3 w-3 mr-1" />
              Show Less
            </>
          ) : (
            <>
              <ChevronDown className="h-3 w-3 mr-1" />
              More details
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
