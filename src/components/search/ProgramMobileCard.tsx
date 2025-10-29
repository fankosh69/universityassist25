import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Heart, MapPin, Clock, Euro, Globe, ChevronDown, ChevronUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatProgramTitle } from '@/lib/degree-formatting';
import { InstitutionTypeBadge } from '@/components/InstitutionTypeBadge';
import { ControlTypeBadge } from '@/components/ControlTypeBadge';
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
  const tuitionDisplay = program.semester_fees === 0 ? 'Free' : `€${program.semester_fees.toLocaleString()}/sem`;

  return (
    <Card className="hover:shadow-sm transition-shadow border border-border bg-background">
      <CardContent className="p-3">
        {/* Compact header */}
        <div className="flex items-start gap-3 mb-2">
          <div className="flex-1 min-w-0">
            <Link 
              to={`/universities/${program.universities.slug}/programs/${program.slug}`}
              className="block"
            >
              <h3 className="font-semibold text-sm leading-tight mb-1 hover:text-primary transition-colors line-clamp-2">
                {formattedTitle}
              </h3>
            </Link>
            <Link 
              to={`/universities/${program.universities.slug}`}
              className="text-xs text-muted-foreground hover:text-primary transition-colors truncate block"
            >
              {program.universities.name}
            </Link>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onSave(program.id)}
            className="h-9 w-9 shrink-0 -mt-1"
          >
            <Heart className={`h-4 w-4 ${isSaved ? 'fill-primary text-primary' : ''}`} />
          </Button>
        </div>

        {/* Essential info - always visible */}
        <div className="flex flex-wrap gap-1.5 mb-2">
          <Badge variant="secondary" className="text-xs px-2 py-0.5">
            {program.degree_level.charAt(0).toUpperCase() + program.degree_level.slice(1)}
          </Badge>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3" />
            <span>{program.universities.city}</span>
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Euro className="h-3 w-3" />
            <span>{tuitionDisplay}</span>
          </div>
        </div>

        {/* Expandable details */}
        {isExpanded && (
          <div className="space-y-2 pt-2 border-t border-border mt-2">
            <div className="flex items-center gap-2">
              <Clock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <span className="text-xs text-muted-foreground">{program.duration_semesters} semesters</span>
            </div>

            <div className="flex items-center gap-2">
              <Globe className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <LanguageFlags languages={program.language_of_instruction} size="sm" />
            </div>

            <div className="flex flex-wrap gap-1.5">
              <InstitutionTypeBadge type={program.universities.type} className="text-xs" />
              <ControlTypeBadge type={program.universities.control_type} className="text-xs" />
              {program.uni_assist_required && (
                <Badge variant="outline" className="text-xs">
                  Uni-Assist
                </Badge>
              )}
            </div>

            <Link to={`/universities/${program.universities.slug}/programs/${program.slug}`}>
              <Button variant="outline" size="sm" className="w-full mt-2">
                View Full Details
              </Button>
            </Link>
          </div>
        )}

        {/* Expand/Collapse toggle */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full mt-2 h-8 text-xs"
        >
          {isExpanded ? (
            <>
              <ChevronUp className="h-3 w-3 mr-1" />
              Show Less
            </>
          ) : (
            <>
              <ChevronDown className="h-3 w-3 mr-1" />
              Show More
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
