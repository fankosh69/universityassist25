import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Heart, MapPin, Clock, Euro, Globe } from 'lucide-react';
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

interface ProgramCardProps {
  program: Program;
  isSaved: boolean;
  onSave: (programId: string) => void;
}

export function ProgramCard({ program, isSaved, onSave }: ProgramCardProps) {
  const formattedTitle = formatProgramTitle(program.degree_type, program.name);
  const tuitionDisplay = program.semester_fees === 0 ? 'Free' : `€${program.semester_fees.toLocaleString()}/sem`;

  return (
    <Card className="group hover:shadow-md transition-shadow border border-border bg-background">
      <CardContent className="p-4">
        {/* Header with title and save button */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <Link 
            to={`/universities/${program.universities.slug}/programs/${program.slug}`}
            className="flex-1"
          >
            <h3 className="font-semibold text-base leading-tight group-hover:text-primary transition-colors">
              {formattedTitle}
            </h3>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onSave(program.id)}
            className="h-8 w-8 shrink-0"
          >
            <Heart className={`h-4 w-4 ${isSaved ? 'fill-primary text-primary' : ''}`} />
          </Button>
        </div>

        {/* Badges */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          <Badge variant="secondary" className="text-xs">
            {program.degree_level}
          </Badge>
        </div>

        {/* Info rows */}
        <div className="space-y-1.5 text-sm text-muted-foreground mb-4">
          <div className="flex items-center gap-2">
            <InstitutionTypeBadge type={program.universities.type} className="text-xs" />
            <span className="truncate text-xs">{program.universities.name}</span>
          </div>
          
          <div className="flex items-center gap-2">
            <MapPin className="h-3.5 w-3.5 shrink-0" />
            <span className="text-xs">{program.universities.city}</span>
          </div>

          <div className="flex items-center gap-2">
            <Clock className="h-3.5 w-3.5 shrink-0" />
            <span className="text-xs">{program.duration_semesters} semesters</span>
          </div>

          <div className="flex items-center gap-2">
            <Euro className="h-3.5 w-3.5 shrink-0" />
            <span className="text-xs">{tuitionDisplay}</span>
          </div>

          <div className="flex items-center gap-2">
            <Globe className="h-3.5 w-3.5 shrink-0" />
            <LanguageFlags languages={program.language_of_instruction} size="sm" />
          </div>

          {program.uni_assist_required && (
            <Badge variant="outline" className="text-xs">
              Uni-Assist
            </Badge>
          )}
        </div>

        {/* View details button */}
        <Link to={`/universities/${program.universities.slug}/programs/${program.slug}`}>
          <Button variant="outline" size="sm" className="w-full">
            View Details
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
