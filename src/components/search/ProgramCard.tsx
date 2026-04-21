import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Heart, MapPin, Clock, Euro, Globe, CheckCircle, GraduationCap, ArrowRight, Building2 } from 'lucide-react';
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

interface ProgramCardProps {
  program: Program;
  isSaved: boolean;
  onSave: (programId: string) => void;
}

export function ProgramCard({ program, isSaved, onSave }: ProgramCardProps) {
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
    <Card className="group relative overflow-hidden border border-border bg-card hover:shadow-[var(--shadow-medium)] hover:-translate-y-0.5 transition-all duration-300 flex flex-col">
      {/* Gradient top accent */}
      <div className="h-1.5 w-full bg-[image:var(--gradient-hero)]" aria-hidden="true" />

      {/* Save button - floating */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => onSave(program.id)}
        className="absolute top-3 right-3 z-10 h-8 w-8 rounded-full bg-background/80 backdrop-blur border border-border hover:bg-background"
        aria-label={isSaved ? 'Remove from saved' : 'Save program'}
      >
        <Heart className={`h-4 w-4 ${isSaved ? 'fill-primary text-primary' : 'text-muted-foreground'}`} />
      </Button>

      <CardContent className="p-5 flex flex-col flex-1">
        {/* Degree level pill + control type */}
        <div className="flex flex-wrap items-center gap-1.5 mb-3 pr-10">
          <Badge className="text-[10px] uppercase tracking-wider font-semibold bg-primary/10 text-primary hover:bg-primary/15 border-0">
            <GraduationCap className="h-3 w-3 mr-1" />
            {levelLabel}
          </Badge>
          <ControlTypeBadge type={program.universities.control_type} className="text-[10px]" />
          <InstitutionTypeBadge type={program.universities.type} className="text-[10px]" />
        </div>

        {/* Title */}
        <Link
          to={`/universities/${program.universities.slug}/programs/${program.slug}`}
          className="block mb-3"
        >
          <h3 className="font-[var(--font-heading)] font-bold text-lg leading-snug text-foreground group-hover:text-primary transition-colors line-clamp-2 min-h-[3.5rem]">
            {formattedTitle}
          </h3>
        </Link>

        {/* University + city row */}
        <div className="space-y-1.5 mb-4">
          <Link
            to={`/universities/${program.universities.slug}`}
            className="flex items-center gap-2 text-sm text-foreground/80 hover:text-primary transition-colors group/uni"
          >
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-secondary/15 text-secondary">
              <Building2 className="h-3.5 w-3.5" />
            </span>
            <span className="truncate font-medium">{program.universities.name}</span>
          </Link>
          <Link
            to={`/cities/${program.universities.city.toLowerCase().replace(/\s+/g, '-')}`}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-accent/15 text-accent">
              <MapPin className="h-3.5 w-3.5" />
            </span>
            <span className="truncate">{program.universities.city}, Germany</span>
          </Link>
        </div>

        {/* Stat tiles */}
        <div className="grid grid-cols-3 gap-2 mb-4 rounded-lg bg-muted/50 p-2">
          <StatTile icon={<Clock className="h-3.5 w-3.5" />} label="Duration" value={`${program.duration_semesters} sem`} />
          <StatTile
            icon={<Euro className="h-3.5 w-3.5" />}
            label="Tuition"
            value={isFree ? 'Free' : tuitionDisplay.replace('/semester', '/sem')}
            highlight={isFree}
          />
          <StatTile
            icon={<Globe className="h-3.5 w-3.5" />}
            label="Language"
            value={<LanguageFlags languages={program.language_of_instruction} size="sm" />}
          />
        </div>

        {/* Application + English proof badges */}
        <div className="flex flex-wrap gap-1.5 mb-4 min-h-[1.5rem]">
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
          {isEnglishTaught && englishReqs?.pte_academic?.required && (
            <Badge variant="secondary" className="text-[10px]">
              <CheckCircle className="h-3 w-3 mr-1" />PTE {englishReqs.pte_academic.overall_min}+
            </Badge>
          )}
        </div>

        {/* CTA */}
        <Link
          to={`/universities/${program.universities.slug}/programs/${program.slug}`}
          className="mt-auto"
        >
          <Button
            size="sm"
            className="w-full bg-[image:var(--gradient-hero)] hover:opacity-95 text-primary-foreground border-0 shadow-sm group/btn"
          >
            View Program
            <ArrowRight className="h-3.5 w-3.5 ml-1 transition-transform group-hover/btn:translate-x-0.5" />
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}

function StatTile({
  icon,
  label,
  value,
  highlight = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  highlight?: boolean;
}) {
  return (
    <div className="flex flex-col items-center justify-center text-center px-1 py-1.5">
      <div className={`flex items-center gap-1 text-[10px] uppercase tracking-wide ${highlight ? 'text-success' : 'text-muted-foreground'}`}>
        {icon}
        <span>{label}</span>
      </div>
      <div className={`mt-0.5 text-xs font-semibold leading-tight ${highlight ? 'text-success' : 'text-foreground'}`}>
        {value}
      </div>
    </div>
  );
}
