import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Heart, MapPin, Clock, Euro, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatProgramTitle } from '@/lib/degree-formatting';
import { InstitutionTypeBadge } from '@/components/InstitutionTypeBadge';
import { LanguageFlags } from '@/components/LanguageFlags';

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
  const tuitionDisplay = program.semester_fees === 0 ? 'Free' : `€${program.semester_fees.toLocaleString()}`;

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
            <span className="truncate">{program.universities.name}</span>
            <span>•</span>
            <div className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" />
              {program.universities.city}
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
              {program.degree_level}
            </Badge>
            <Badge variant="outline" className="text-xs">
              {program.field_of_study}
            </Badge>
            <LanguageFlags languages={program.language_of_instruction} size="sm" />
            {program.uni_assist_required && (
              <Badge variant="outline" className="text-xs">
                Uni-Assist
              </Badge>
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
