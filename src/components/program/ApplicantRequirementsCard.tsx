import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  GraduationCap, 
  Target, 
  FileCheck, 
  BookOpen, 
  Download, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle,
  Lock,
  ExternalLink,
  ClipboardCheck,
  Users
} from 'lucide-react';

interface SubjectArea {
  area: string;
  min_ects: number;
  sub_requirements?: {
    topics: string[];
    min_ects: number;
    logic: 'AND' | 'OR';
  }[];
}

interface ProgramRequirementsData {
  gpa_minimum: number | null;
  gpa_competitive: number | null;
  gpa_notes: string | null;
  gmat_required: boolean;
  gmat_minimum: number | null;
  gre_required: boolean;
  gre_minimum_verbal: number | null;
  gre_minimum_quant: number | null;
  gre_minimum_total: number | null;
  accepted_degrees: string[];
  subject_requirements: {
    total_ects: number;
    subject_areas: SubjectArea[];
  } | null;
  admission_regulations_url: string | null;
  program_flyer_url: string | null;
  module_description_url: string | null;
  admission_test_required?: boolean;
  admission_test_details?: string | null;
  interview_required?: boolean;
  interview_details?: string | null;
}

interface ApplicantRequirementsCardProps {
  requirements: ProgramRequirementsData;
  isApplicant: boolean;
  isAdmin?: boolean;
  isLoading?: boolean;
  studentGpa?: number | null;
  studentEcts?: number | null;
}

export function ApplicantRequirementsCard({
  requirements,
  isApplicant,
  isAdmin = false,
  isLoading,
  studentGpa,
  studentEcts,
}: ApplicantRequirementsCardProps) {
  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-3/4 mx-auto"></div>
            <div className="h-4 bg-muted rounded w-1/2 mx-auto"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Admins always see full details, and for now all users can see details (restriction removed)
  // Original restriction: if (!isApplicant && !isAdmin) { show teaser }
  // Future: re-enable by uncommenting below and removing the 'true' condition
  const canViewDetails = isAdmin || isApplicant || true; // 'true' removes restriction for all users

  if (!canViewDetails) {
    return (
      <Card className="border-dashed border-2 bg-muted/30">
        <CardContent className="py-8 text-center space-y-4">
          <Lock className="h-12 w-12 mx-auto text-muted-foreground" />
          <div>
            <h3 className="font-semibold text-lg">Detailed Requirements</h3>
            <p className="text-muted-foreground mt-1">
              Become an applicant to see detailed admission requirements, GPA expectations, and download official documents.
            </p>
          </div>
          <Button variant="default">
            Start Application Process
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Calculate GPA status
  const getGpaStatus = () => {
    if (!studentGpa || !requirements.gpa_minimum) return 'unknown';
    if (requirements.gpa_competitive && studentGpa <= requirements.gpa_competitive) return 'excellent';
    if (studentGpa <= requirements.gpa_minimum) return 'meets';
    return 'below';
  };

  const gpaStatus = getGpaStatus();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <GraduationCap className="h-5 w-5 text-primary" />
          Admission Requirements
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Accepted Degrees */}
        {requirements.accepted_degrees && requirements.accepted_degrees.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-semibold flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Accepted Prior Degrees
            </h4>
            <div className="flex flex-wrap gap-2">
              {requirements.accepted_degrees.map((degree) => (
                <Badge key={degree} variant="secondary">
                  {degree.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* GPA Requirements */}
        {requirements.gpa_minimum && (
          <div className="space-y-3">
            <h4 className="font-semibold flex items-center gap-2">
              <Target className="h-4 w-4" />
              GPA Requirements (German Scale)
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-muted rounded-lg">
                <div className="text-sm text-muted-foreground">Minimum Required</div>
                <div className="text-2xl font-bold">{requirements.gpa_minimum}</div>
              </div>
              {requirements.gpa_competitive && (
                <div className="p-3 bg-primary/10 rounded-lg">
                  <div className="text-sm text-muted-foreground">Competitive</div>
                  <div className="text-2xl font-bold text-primary">{requirements.gpa_competitive}</div>
                </div>
              )}
            </div>
            
            {/* Student GPA comparison */}
            {studentGpa != null && studentGpa > 0 && (
              <Alert variant={gpaStatus === 'below' ? 'destructive' : 'default'}>
                <div className="flex items-center gap-2">
                  {gpaStatus === 'excellent' && <CheckCircle2 className="h-4 w-4 text-green-600" />}
                  {gpaStatus === 'meets' && <CheckCircle2 className="h-4 w-4 text-green-600" />}
                  {gpaStatus === 'below' && <XCircle className="h-4 w-4" />}
                  <AlertDescription>
                    Your GPA: <strong>{studentGpa}</strong>
                    {gpaStatus === 'excellent' && ' — Excellent match!'}
                    {gpaStatus === 'meets' && ' — Meets requirements'}
                    {gpaStatus === 'below' && ` — Below minimum (${requirements.gpa_minimum} required)`}
                  </AlertDescription>
                </div>
              </Alert>
            )}

            {requirements.gpa_notes && (
              <p className="text-sm text-muted-foreground">{requirements.gpa_notes}</p>
            )}
          </div>
        )}

        {/* Standardized Tests */}
        {(requirements.gmat_required || requirements.gre_required) && (
          <div className="space-y-3">
            <h4 className="font-semibold flex items-center gap-2">
              <FileCheck className="h-4 w-4" />
              Standardized Tests
            </h4>
            
            {requirements.gmat_required && (
              <div className="p-3 border rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="font-medium">GMAT</span>
                  <Badge>Required</Badge>
                </div>
                {requirements.gmat_minimum && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Minimum score: {requirements.gmat_minimum}
                  </p>
                )}
              </div>
            )}

            {requirements.gre_required && (
              <div className="p-3 border rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="font-medium">GRE</span>
                  <Badge>Required</Badge>
                </div>
                <div className="grid grid-cols-3 gap-2 mt-2 text-sm">
                  {requirements.gre_minimum_verbal && (
                    <div>
                      <span className="text-muted-foreground">Verbal:</span>{' '}
                      <strong>{requirements.gre_minimum_verbal}</strong>
                    </div>
                  )}
                  {requirements.gre_minimum_quant && (
                    <div>
                      <span className="text-muted-foreground">Quant:</span>{' '}
                      <strong>{requirements.gre_minimum_quant}</strong>
                    </div>
                  )}
                  {requirements.gre_minimum_total && (
                    <div>
                      <span className="text-muted-foreground">Total:</span>{' '}
                      <strong>{requirements.gre_minimum_total}</strong>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Subject Requirements */}
        {requirements.subject_requirements && requirements.subject_requirements.subject_areas?.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-semibold">Subject-Specific Prerequisites</h4>
            <div className="space-y-3">
              {requirements.subject_requirements.subject_areas.map((area, index) => (
                <div key={index} className="p-3 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">{area.area}</span>
                    <Badge variant="outline">{area.min_ects} ECTS</Badge>
                  </div>
                  
                  {area.sub_requirements && area.sub_requirements.length > 0 && (
                    <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                      {area.sub_requirements.map((sub, subIndex) => (
                        <li key={subIndex} className="flex items-start gap-2">
                          <span className="text-primary">•</span>
                          <span>
                            {sub.min_ects} ECTS in{' '}
                            {sub.logic === 'OR' 
                              ? sub.topics.join(' or ') 
                              : sub.topics.join(' and ')}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>

            {/* ECTS comparison */}
            {studentEcts != null && studentEcts > 0 && requirements.subject_requirements.total_ects && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Your ECTS</span>
                  <span>{studentEcts} / {requirements.subject_requirements.total_ects}</span>
                </div>
                <Progress 
                  value={(studentEcts / requirements.subject_requirements.total_ects) * 100} 
                  className="h-2"
                />
              </div>
            )}
          </div>
        )}

        {/* Admission Process Steps */}
        {(requirements.admission_test_required || requirements.interview_required) && (
          <div className="space-y-3">
            <h4 className="font-semibold flex items-center gap-2">
              <ClipboardCheck className="h-4 w-4" />
              Admission Process Steps
            </h4>
            
            {requirements.admission_test_required && (
              <div className="p-3 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium flex items-center gap-2">
                    <ClipboardCheck className="h-4 w-4 text-orange-500" />
                    Admission Test
                  </span>
                  <Badge variant="outline" className="text-orange-600 border-orange-300">Required</Badge>
                </div>
                {requirements.admission_test_details && (
                  <p className="text-sm text-muted-foreground">{requirements.admission_test_details}</p>
                )}
              </div>
            )}

            {requirements.interview_required && (
              <div className="p-3 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium flex items-center gap-2">
                    <Users className="h-4 w-4 text-blue-500" />
                    Interview
                  </span>
                  <Badge variant="outline" className="text-blue-600 border-blue-300">Required</Badge>
                </div>
                {requirements.interview_details && (
                  <p className="text-sm text-muted-foreground">{requirements.interview_details}</p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Documents */}
        {(requirements.admission_regulations_url || requirements.program_flyer_url || requirements.module_description_url) && (
          <div className="space-y-3">
            <h4 className="font-semibold">Official Documents</h4>
            <div className="flex flex-wrap gap-2">
              {requirements.admission_regulations_url && (
                <Button variant="outline" size="sm" asChild>
                  <a href={requirements.admission_regulations_url} target="_blank" rel="noopener noreferrer">
                    <Download className="h-3 w-3 mr-1" />
                    Admission Regulations
                  </a>
                </Button>
              )}
              {requirements.program_flyer_url && (
                <Button variant="outline" size="sm" asChild>
                  <a href={requirements.program_flyer_url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-3 w-3 mr-1" />
                    Program Flyer
                  </a>
                </Button>
              )}
              {requirements.module_description_url && (
                <Button variant="outline" size="sm" asChild>
                  <a href={requirements.module_description_url} target="_blank" rel="noopener noreferrer">
                    <Download className="h-3 w-3 mr-1" />
                    Module Handbook
                  </a>
                </Button>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
