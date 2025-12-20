import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, GraduationCap, Target, FileCheck, BookOpen, AlertCircle } from 'lucide-react';
import { SubjectRequirementsBuilder, SubjectRequirements } from './SubjectRequirementsBuilder';
import { ProgramDocumentUpload } from './ProgramDocumentUpload';
import { supabase } from '@/integrations/supabase/client';

interface ProgramRequirementsData {
  // GPA
  gpa_minimum: number | null;
  gpa_competitive: number | null;
  gpa_notes: string;
  // Tests
  gmat_required: boolean;
  gmat_minimum: number | null;
  gre_required: boolean;
  gre_minimum_verbal: number | null;
  gre_minimum_quant: number | null;
  gre_minimum_total: number | null;
  // Degrees
  accepted_degrees: string[];
  // Subject requirements
  subject_requirements: SubjectRequirements;
  // Documents
  admission_regulations_url: string | null;
  program_flyer_url: string | null;
  module_description_url: string | null;
}

interface ProgramRequirementsEditorProps {
  value: ProgramRequirementsData;
  onChange: (value: ProgramRequirementsData) => void;
  programId?: string;
  degreeLevel: 'bachelor' | 'master';
}

interface FieldOfStudy {
  id: string;
  name: string;
  slug: string;
  level: number;
}

export function ProgramRequirementsEditor({
  value,
  onChange,
  programId,
  degreeLevel,
}: ProgramRequirementsEditorProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [fieldsOfStudy, setFieldsOfStudy] = useState<FieldOfStudy[]>([]);

  useEffect(() => {
    fetchFieldsOfStudy();
  }, []);

  const fetchFieldsOfStudy = async () => {
    const { data } = await supabase
      .from('fields_of_study')
      .select('id, name, slug, level')
      .eq('is_active', true)
      .order('name');
    
    if (data) {
      setFieldsOfStudy(data);
    }
  };

  const updateField = <K extends keyof ProgramRequirementsData>(
    field: K,
    newValue: ProgramRequirementsData[K]
  ) => {
    onChange({ ...value, [field]: newValue });
  };

  const toggleDegree = (slug: string) => {
    const current = value.accepted_degrees || [];
    if (current.includes(slug)) {
      updateField('accepted_degrees', current.filter(d => d !== slug));
    } else {
      updateField('accepted_degrees', [...current, slug]);
    }
  };

  // Get specific majors (level 2) instead of broad categories (level 1)
  const specificMajors = fieldsOfStudy.filter(f => f.level === 2);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className="border-2 border-primary/20">
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5 text-primary" />
                Academic Requirements
              </div>
              <ChevronDown className={`h-5 w-5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </CardTitle>
          </CardHeader>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <CardContent className="space-y-6">
            {/* Accepted Prior Degrees */}
            <div className="space-y-3">
              <Label className="text-base font-semibold flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                Accepted Prior Degrees
                <span className="text-destructive">*</span>
              </Label>
              <p className="text-sm text-muted-foreground">
                Select the specific degree programs (majors) that are considered relevant for admission.
              </p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-72 overflow-y-auto p-2 border rounded-lg">
                {specificMajors.map((field) => (
                  <div key={field.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`degree-${field.slug}`}
                      checked={(value.accepted_degrees || []).includes(field.slug)}
                      onCheckedChange={() => toggleDegree(field.slug)}
                    />
                    <label
                      htmlFor={`degree-${field.slug}`}
                      className="text-sm cursor-pointer"
                    >
                      {field.name}
                    </label>
                  </div>
                ))}
              </div>
              {(value.accepted_degrees || []).length === 0 && (
                <p className="text-sm text-destructive flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  Please select at least one accepted degree
                </p>
              )}
            </div>

            {/* GPA Requirements */}
            <div className="space-y-3">
              <Label className="text-base font-semibold flex items-center gap-2">
                <Target className="h-4 w-4" />
                GPA Requirements (German Scale)
                <span className="text-destructive">*</span>
              </Label>
              <p className="text-sm text-muted-foreground">
                On the German scale, 1.0 is excellent and 4.0 is passing.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="gpa_minimum">Minimum Required GPA</Label>
                  <Input
                    id="gpa_minimum"
                    type="number"
                    step="0.1"
                    min="1.0"
                    max="4.0"
                    placeholder="e.g., 2.5"
                    value={value.gpa_minimum || ''}
                    onChange={(e) => updateField('gpa_minimum', e.target.value ? parseFloat(e.target.value) : null)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gpa_competitive">Competitive GPA (for best chances)</Label>
                  <Input
                    id="gpa_competitive"
                    type="number"
                    step="0.1"
                    min="1.0"
                    max="4.0"
                    placeholder="e.g., 1.5"
                    value={value.gpa_competitive || ''}
                    onChange={(e) => updateField('gpa_competitive', e.target.value ? parseFloat(e.target.value) : null)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="gpa_notes">Additional GPA Notes</Label>
                <Textarea
                  id="gpa_notes"
                  placeholder="E.g., 'Conditional admission possible with GPA up to 3.0 with additional requirements...'"
                  value={value.gpa_notes || ''}
                  onChange={(e) => updateField('gpa_notes', e.target.value)}
                  className="h-20"
                />
              </div>
            </div>

            {/* Standardized Tests (mainly for Master's) */}
            {degreeLevel === 'master' && (
              <div className="space-y-3">
                <Label className="text-base font-semibold flex items-center gap-2">
                  <FileCheck className="h-4 w-4" />
                  Standardized Tests
                </Label>
                
                {/* GMAT */}
                <div className="p-4 border rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="font-medium">GMAT Required</Label>
                      <p className="text-sm text-muted-foreground">Graduate Management Admission Test</p>
                    </div>
                    <Switch
                      checked={value.gmat_required}
                      onCheckedChange={(checked) => updateField('gmat_required', checked)}
                    />
                  </div>
                  {value.gmat_required && (
                    <div className="pt-2">
                      <Label htmlFor="gmat_minimum">Minimum GMAT Score</Label>
                      <Input
                        id="gmat_minimum"
                        type="number"
                        min="200"
                        max="800"
                        placeholder="e.g., 600"
                        value={value.gmat_minimum || ''}
                        onChange={(e) => updateField('gmat_minimum', e.target.value ? parseInt(e.target.value) : null)}
                        className="w-32 mt-1"
                      />
                    </div>
                  )}
                </div>

                {/* GRE */}
                <div className="p-4 border rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="font-medium">GRE Required</Label>
                      <p className="text-sm text-muted-foreground">Graduate Record Examination</p>
                    </div>
                    <Switch
                      checked={value.gre_required}
                      onCheckedChange={(checked) => updateField('gre_required', checked)}
                    />
                  </div>
                  {value.gre_required && (
                    <div className="grid grid-cols-3 gap-3 pt-2">
                      <div className="space-y-1">
                        <Label htmlFor="gre_verbal">Verbal Min</Label>
                        <Input
                          id="gre_verbal"
                          type="number"
                          min="130"
                          max="170"
                          placeholder="155"
                          value={value.gre_minimum_verbal || ''}
                          onChange={(e) => updateField('gre_minimum_verbal', e.target.value ? parseInt(e.target.value) : null)}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="gre_quant">Quant Min</Label>
                        <Input
                          id="gre_quant"
                          type="number"
                          min="130"
                          max="170"
                          placeholder="160"
                          value={value.gre_minimum_quant || ''}
                          onChange={(e) => updateField('gre_minimum_quant', e.target.value ? parseInt(e.target.value) : null)}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="gre_total">Total Min</Label>
                        <Input
                          id="gre_total"
                          type="number"
                          min="260"
                          max="340"
                          placeholder="310"
                          value={value.gre_minimum_total || ''}
                          onChange={(e) => updateField('gre_minimum_total', e.target.value ? parseInt(e.target.value) : null)}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Subject-Specific Prerequisites */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">Subject-Specific Prerequisites (ECTS)</Label>
              <p className="text-sm text-muted-foreground">
                Define specific subject requirements (e.g., "20 ECTS in Mathematics including Linear Algebra or Calculus").
              </p>
              <SubjectRequirementsBuilder
                value={value.subject_requirements || { total_ects: 180, subject_areas: [] }}
                onChange={(v) => updateField('subject_requirements', v)}
              />
            </div>

            {/* Document Uploads */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">Program Documents</Label>
              <div className="space-y-3">
                <ProgramDocumentUpload
                  label="Admission Regulations"
                  description="Official admission regulations document (Zulassungssatzung)"
                  value={value.admission_regulations_url}
                  onChange={(url) => updateField('admission_regulations_url', url)}
                  programId={programId}
                  documentType="admission_regulations"
                  required
                />
                <ProgramDocumentUpload
                  label="Program Flyer"
                  description="Program information flyer or brochure"
                  value={value.program_flyer_url}
                  onChange={(url) => updateField('program_flyer_url', url)}
                  programId={programId}
                  documentType="program_flyer"
                />
                <ProgramDocumentUpload
                  label="Module Description"
                  description="Complete module handbook with course descriptions"
                  value={value.module_description_url}
                  onChange={(url) => updateField('module_description_url', url)}
                  programId={programId}
                  documentType="module_description"
                />
              </div>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}

// Default empty requirements data
export const getDefaultRequirementsData = (): ProgramRequirementsData => ({
  gpa_minimum: null,
  gpa_competitive: null,
  gpa_notes: '',
  gmat_required: false,
  gmat_minimum: null,
  gre_required: false,
  gre_minimum_verbal: null,
  gre_minimum_quant: null,
  gre_minimum_total: null,
  accepted_degrees: [],
  subject_requirements: { total_ects: 180, subject_areas: [] },
  admission_regulations_url: null,
  program_flyer_url: null,
  module_description_url: null,
});
