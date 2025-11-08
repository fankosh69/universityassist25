import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Calendar, Euro, Globe, Clock, GraduationCap, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/enhanced-button';
import { Link } from 'react-router-dom';

interface ProgramQuickViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  program: any;
  universitySlug: string;
}

export function ProgramQuickViewModal({ isOpen, onClose, program, universitySlug }: ProgramQuickViewModalProps) {
  if (!program) return null;

  // Parse requirements if they exist
  const requirements = program.requirements_json ? 
    (typeof program.requirements_json === 'string' ? JSON.parse(program.requirements_json) : program.requirements_json)
    : null;

  // Parse deadlines if they exist
  const deadlines = program.deadlines_json ?
    (typeof program.deadlines_json === 'string' ? JSON.parse(program.deadlines_json) : program.deadlines_json)
    : null;

  const languages = program.language_requirements || ['German'];
  const isFree = !program.semester_fees || program.semester_fees === 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">{program.name}</DialogTitle>
          <div className="flex items-center gap-2 flex-wrap mt-2">
            <Badge variant="secondary">{program.degree_type}</Badge>
            <Badge variant="outline">{program.duration_semesters} semesters</Badge>
            {program.uni_assist_required && (
              <Badge variant="default" className="bg-orange-500 hover:bg-orange-600">
                Uni-Assist Required
              </Badge>
            )}
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Quick Facts */}
          <Card className="p-4">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <GraduationCap className="h-5 w-5" />
              Quick Facts
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <Globe className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <div className="text-sm font-medium">Language</div>
                  <div className="text-sm text-muted-foreground">
                    {languages.join(', ')}
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <div className="text-sm font-medium">Duration</div>
                  <div className="text-sm text-muted-foreground">
                    {program.duration_semesters} semesters ({program.duration_semesters / 2} years)
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Euro className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <div className="text-sm font-medium">Tuition</div>
                  <div className="text-sm text-muted-foreground">
                    {isFree ? 'Free (public university)' : `€${program.semester_fees}/semester`}
                  </div>
                </div>
              </div>
              {program.ects_credits && (
                <div className="flex items-start gap-3">
                  <GraduationCap className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <div className="text-sm font-medium">Credits</div>
                    <div className="text-sm text-muted-foreground">
                      {program.ects_credits} ECTS
                    </div>
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Deadlines */}
          {(deadlines || program.winter_deadline || program.summer_deadline) && (
            <Card className="p-4">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Application Deadlines
              </h3>
              <div className="space-y-2">
                {(deadlines?.winter || program.winter_deadline) && (
                  <div className="flex justify-between items-center p-2 bg-muted/50 rounded">
                    <span className="text-sm font-medium">Winter Semester</span>
                    <span className="text-sm text-muted-foreground">
                      {deadlines?.winter || program.winter_deadline}
                    </span>
                  </div>
                )}
                {(deadlines?.summer || program.summer_deadline) && (
                  <div className="flex justify-between items-center p-2 bg-muted/50 rounded">
                    <span className="text-sm font-medium">Summer Semester</span>
                    <span className="text-sm text-muted-foreground">
                      {deadlines?.summer || program.summer_deadline}
                    </span>
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* Eligibility Requirements */}
          {requirements && (
            <Card className="p-4">
              <h3 className="font-semibold mb-3">Eligibility Requirements</h3>
              <div className="space-y-3">
                {requirements.min_gpa && (
                  <div>
                    <div className="text-sm font-medium">Minimum GPA</div>
                    <div className="text-sm text-muted-foreground">{requirements.min_gpa}</div>
                  </div>
                )}
                {requirements.language && (
                  <div>
                    <div className="text-sm font-medium">Language Requirements</div>
                    <div className="text-sm text-muted-foreground">{requirements.language}</div>
                  </div>
                )}
                {requirements.prerequisites && (
                  <div>
                    <div className="text-sm font-medium">Prerequisites</div>
                    <div className="text-sm text-muted-foreground">{requirements.prerequisites}</div>
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* Description */}
          {program.description && (
            <div>
              <h3 className="font-semibold mb-2">About the Program</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {program.description}
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t">
            <Button asChild className="flex-1">
              <Link to={`/universities/${universitySlug}/programs/${program.slug || program.id}`}>
                <ExternalLink className="h-4 w-4 mr-2" />
                View Full Details
              </Link>
            </Button>
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
