import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, X, Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  AL_SUBJECTS,
  AP_SUBJECTS_LIST,
  IB_HL_SUBJECTS,
  IB_SL_SUBJECTS,
  NATIONAL_DIPLOMA_FOCUS_OPTIONS,
} from "@/lib/curriculum-eligibility";
import type { SubjectEntry } from "@/lib/curriculum-eligibility";

interface CurriculumFieldsProps {
  curriculum: string;
  data: Record<string, any>;
  onUpdate: (data: Record<string, any>) => void;
}

const AL_GRADES = ['A*', 'A', 'B', 'C', 'D', 'E', 'U'];
const IB_GRADES = ['7', '6', '5', '4', '3', '2', '1'];
const BC_GRADES = ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D', 'F'];

// ─── Shared: University Study Follow-up ─────────────────────────────────────

function UniversityStudyFields({ data, onUpdate }: { data: Record<string, any>; onUpdate: (d: Record<string, any>) => void }) {
  if (!data.has_university_study) return null;
  return (
    <div className="space-y-3 pl-4 border-l-2 border-primary/20 mt-2">
      <div>
        <Label>University Name</Label>
        <Input
          value={data.university_name || ''}
          onChange={e => onUpdate({ university_name: e.target.value })}
          placeholder="e.g., Cairo University"
        />
      </div>
      <div>
        <Label>Current Major</Label>
        <Input
          value={data.university_major || ''}
          onChange={e => onUpdate({ university_major: e.target.value })}
          placeholder="e.g., Computer Science"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Semesters Completed</Label>
          <Input
            type="number"
            min={0}
            value={data.semesters_completed || ''}
            onChange={e => onUpdate({ semesters_completed: parseInt(e.target.value) || 0 })}
            placeholder="0"
          />
        </div>
        <div>
          <Label>Current CGPA</Label>
          <Input
            type="number"
            step="0.01"
            value={data.current_cgpa || ''}
            onChange={e => onUpdate({ current_cgpa: parseFloat(e.target.value) || 0 })}
            placeholder="3.5"
          />
        </div>
      </div>
    </div>
  );
}

// ─── Shared: Graduated + University Question ────────────────────────────────

function GraduatedSection({ data, onUpdate, gradeOptions, hideUniversitySection }: {
  data: Record<string, any>;
  onUpdate: (d: Record<string, any>) => void;
  gradeOptions?: string[];
  hideUniversitySection?: boolean;
}) {
  return (
    <div className="space-y-3">
      <div>
        <Label className="text-sm font-medium">Have you graduated high school? *</Label>
        <RadioGroup
          value={data.graduated === true ? 'yes' : data.graduated === false ? 'no' : ''}
          onValueChange={v => onUpdate({ graduated: v === 'yes' })}
          className="mt-2 flex gap-4"
        >
          <div className="flex items-center gap-2">
            <RadioGroupItem value="yes" id="grad-yes" />
            <Label htmlFor="grad-yes" className="font-normal">Yes</Label>
          </div>
          <div className="flex items-center gap-2">
            <RadioGroupItem value="no" id="grad-no" />
            <Label htmlFor="grad-no" className="font-normal">Not yet</Label>
          </div>
        </RadioGroup>
      </div>

      {data.graduated === false && gradeOptions && (
        <div>
          <Label>Which grade are you currently in?</Label>
          <Select value={data.current_grade || ''} onValueChange={v => onUpdate({ current_grade: v })}>
            <SelectTrigger><SelectValue placeholder="Select grade" /></SelectTrigger>
            <SelectContent>
              {gradeOptions.map(g => <SelectItem key={g} value={g}>Grade {g}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      )}

      {data.graduated === true && !hideUniversitySection && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Have you started university studies?</Label>
            <Switch
              checked={data.has_university_study || false}
              onCheckedChange={v => onUpdate({ has_university_study: v })}
            />
          </div>
          <UniversityStudyFields data={data} onUpdate={onUpdate} />
        </div>
      )}
    </div>
  );
}

// ─── Subject List Manager ───────────────────────────────────────────────────

function SubjectListManager({ label, subjects, onSubjectsChange, availableSubjects, gradeOptions, showUpgradeToAL }: {
  label: string;
  subjects: SubjectEntry[];
  onSubjectsChange: (s: SubjectEntry[]) => void;
  availableSubjects: string[];
  gradeOptions?: string[];
  showUpgradeToAL?: boolean;
}) {
  const addSubject = () => {
    onSubjectsChange([...subjects, { name: '', grade: undefined }]);
  };

  const removeSubject = (i: number) => {
    onSubjectsChange(subjects.filter((_, idx) => idx !== i));
  };

  const updateSubject = (i: number, field: string, value: any) => {
    const updated = [...subjects];
    updated[i] = { ...updated[i], [field]: value };
    onSubjectsChange(updated);
  };

  const usedNames = subjects.map(s => s.name);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">{label}</Label>
        <Button type="button" variant="outline" size="sm" onClick={addSubject} className="h-7 text-xs">
          <Plus className="w-3 h-3 mr-1" /> Add
        </Button>
      </div>
      {subjects.map((s, i) => (
        <div key={i} className="flex items-center gap-2">
          <Select value={s.name} onValueChange={v => updateSubject(i, 'name', v)}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Select subject" />
            </SelectTrigger>
            <SelectContent>
              {availableSubjects
                .filter(sub => !usedNames.includes(sub) || sub === s.name)
                .map(sub => <SelectItem key={sub} value={sub}>{sub}</SelectItem>)}
            </SelectContent>
          </Select>
          {gradeOptions && (
            <Select value={s.grade?.toString() || ''} onValueChange={v => updateSubject(i, 'grade', v)}>
              <SelectTrigger className="w-20">
                <SelectValue placeholder="Grade" />
              </SelectTrigger>
              <SelectContent>
                {gradeOptions.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
              </SelectContent>
            </Select>
          )}
          {showUpgradeToAL && (
            <div className="flex items-center gap-1">
              <Switch
                checked={s.upgrading_to_al || false}
                onCheckedChange={v => updateSubject(i, 'upgrading_to_al', v)}
              />
              <span className="text-xs text-muted-foreground whitespace-nowrap">→ AL</span>
            </div>
          )}
          <Button type="button" variant="ghost" size="sm" onClick={() => removeSubject(i)} className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive">
            <X className="w-4 h-4" />
          </Button>
        </div>
      ))}
      {subjects.length === 0 && (
        <p className="text-xs text-muted-foreground italic">No subjects added yet. Click "Add" to start.</p>
      )}
    </div>
  );
}

// ─── AP Subject Manager with Score ──────────────────────────────────────────

function APSubjectListManager({ label, subjects, onSubjectsChange, tooltip }: {
  label: string;
  subjects: SubjectEntry[];
  onSubjectsChange: (s: SubjectEntry[]) => void;
  tooltip?: string;
}) {
  const addSubject = () => {
    onSubjectsChange([...subjects, { name: '', score: undefined }]);
  };

  const removeSubject = (i: number) => {
    onSubjectsChange(subjects.filter((_, idx) => idx !== i));
  };

  const updateSubject = (i: number, field: string, value: any) => {
    const updated = [...subjects];
    updated[i] = { ...updated[i], [field]: value };
    onSubjectsChange(updated);
  };

  const usedNames = subjects.map(s => s.name);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          <Label className="text-sm font-medium">{label}</Label>
          {tooltip && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="w-3.5 h-3.5 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs text-xs">{tooltip}</TooltipContent>
            </Tooltip>
          )}
        </div>
        <Button type="button" variant="outline" size="sm" onClick={addSubject} className="h-7 text-xs">
          <Plus className="w-3 h-3 mr-1" /> Add
        </Button>
      </div>
      {subjects.map((s, i) => (
        <div key={i} className="flex items-center gap-2">
          <Select value={s.name} onValueChange={v => updateSubject(i, 'name', v)}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Select AP subject" />
            </SelectTrigger>
            <SelectContent>
              {AP_SUBJECTS_LIST
                .filter(sub => !usedNames.includes(sub) || sub === s.name)
                .map(sub => <SelectItem key={sub} value={sub}>{sub}</SelectItem>)}
            </SelectContent>
          </Select>
          <Input
            type="number"
            min={1}
            max={5}
            className="w-20"
            value={s.score || ''}
            onChange={e => updateSubject(i, 'score', parseInt(e.target.value) || undefined)}
            placeholder="Score"
          />
          <Button type="button" variant="ghost" size="sm" onClick={() => removeSubject(i)} className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive">
            <X className="w-4 h-4" />
          </Button>
        </div>
      ))}
      {subjects.length === 0 && (
        <p className="text-xs text-muted-foreground italic">No subjects added yet.</p>
      )}
    </div>
  );
}

// ─── IGCSE Fields ───────────────────────────────────────────────────────────

function IGCSEFields({ data, onUpdate }: { data: Record<string, any>; onUpdate: (d: Record<string, any>) => void }) {
  const cd = data.curriculumDetails || {};
  const update = (d: Record<string, any>) => onUpdate({ curriculumDetails: { ...cd, ...d } });

  return (
    <div className="space-y-4">
      <GraduatedSection data={cd} onUpdate={update} gradeOptions={['10', '11', '12']} />

      <div>
        <Label className="text-sm font-medium">Have you taken AS/AL subjects? *</Label>
        <RadioGroup
          value={cd.has_taken_as_al === true ? 'yes' : cd.has_taken_as_al === false ? 'no' : ''}
          onValueChange={v => update({ has_taken_as_al: v === 'yes' })}
          className="mt-2 flex gap-4"
        >
          <div className="flex items-center gap-2">
            <RadioGroupItem value="yes" id="asal-yes" />
            <Label htmlFor="asal-yes" className="font-normal">Yes</Label>
          </div>
          <div className="flex items-center gap-2">
            <RadioGroupItem value="no" id="asal-no" />
            <Label htmlFor="asal-no" className="font-normal">No</Label>
          </div>
        </RadioGroup>
      </div>

      {cd.has_taken_as_al === false && (
        <div>
          <Label className="text-sm font-medium">Are you planning to take any AS/AL subjects?</Label>
          <RadioGroup
            value={cd.planning_as_al === true ? 'yes' : cd.planning_as_al === false ? 'no' : ''}
            onValueChange={v => update({ planning_as_al: v === 'yes' })}
            className="mt-2 flex gap-4"
          >
            <div className="flex items-center gap-2">
              <RadioGroupItem value="yes" id="plan-yes" />
              <Label htmlFor="plan-yes" className="font-normal">Yes</Label>
            </div>
            <div className="flex items-center gap-2">
              <RadioGroupItem value="no" id="plan-no" />
              <Label htmlFor="plan-no" className="font-normal">No</Label>
            </div>
          </RadioGroup>
        </div>
      )}

      {(cd.has_taken_as_al === true || cd.planning_as_al === true) && (
        <>
          <SubjectListManager
            label="AS (Advanced Subsidiary) Subjects"
            subjects={cd.as_subjects || []}
            onSubjectsChange={s => update({ as_subjects: s, as_subjects_count: s.length })}
            availableSubjects={AL_SUBJECTS}
            gradeOptions={AL_GRADES}
            showUpgradeToAL
          />

          <SubjectListManager
            label="AL (Advanced Level) Subjects"
            subjects={cd.al_subjects || []}
            onSubjectsChange={s => update({ al_subjects: s, al_subjects_count: s.length })}
            availableSubjects={AL_SUBJECTS}
            gradeOptions={AL_GRADES}
          />

          {(cd.al_subjects_count || 0) < 3 && (
            <div className="rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 p-3 text-sm">
              <p className="font-medium text-amber-800 dark:text-amber-200">⚠ Important</p>
              <p className="text-amber-700 dark:text-amber-300 text-xs mt-1">
                At least 3 A-Level subjects (grade C or better) are required for admission to German public universities.
                With fewer than 3, only private universities may be accessible.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─── American Diploma Fields ────────────────────────────────────────────────

function AmericanDiplomaFields({ data, onUpdate }: { data: Record<string, any>; onUpdate: (d: Record<string, any>) => void }) {
  const cd = data.curriculumDetails || {};
  const update = (d: Record<string, any>) => onUpdate({ curriculumDetails: { ...cd, ...d, gpa_scale: 4 } });

  return (
    <div className="space-y-4">
      {/* Graduation status (without university section - moved to bottom) */}
      <GraduatedSection data={cd} onUpdate={update} gradeOptions={['9', '10', '11', '12']} hideUniversitySection />

      {/* High School GPA */}
      <div>
        <Label>{cd.graduated === true ? 'Final High School GPA (out of 4.0)' : 'Unweighted CGPA (Grade 9–12, out of 4.0)'}</Label>
        <Input
          type="number"
          step="0.01"
          min={0}
          max={4}
          value={cd.gpa_unweighted || ''}
          onChange={e => update({ gpa_unweighted: parseFloat(e.target.value) || undefined })}
          placeholder="3.5"
        />
      </div>

      {/* AP Exams */}
      <div>
        <div className="flex items-center gap-2">
          <Label className="text-sm font-medium">Have you taken any AP (Advanced Placement) exams? *</Label>
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="w-3.5 h-3.5 text-muted-foreground cursor-help" />
            </TooltipTrigger>
            <TooltipContent className="max-w-xs text-xs">
              AP (Advanced Placement) exams are college-level exams administered by the College Board in the US.
              They are scored 1–5 and are required by German public universities to determine eligibility
              for American Diploma holders. Each AP subject must be scored at least 3 to count.
            </TooltipContent>
          </Tooltip>
        </div>
        <RadioGroup
          value={cd.ap_exams_taken === true ? 'yes' : cd.ap_exams_taken === false ? 'no' : ''}
          onValueChange={v => update({ ap_exams_taken: v === 'yes' })}
          className="mt-2 flex gap-4"
        >
          <div className="flex items-center gap-2">
            <RadioGroupItem value="yes" id="ap-yes" />
            <Label htmlFor="ap-yes" className="font-normal">Yes</Label>
          </div>
          <div className="flex items-center gap-2">
            <RadioGroupItem value="no" id="ap-no" />
            <Label htmlFor="ap-no" className="font-normal">No</Label>
          </div>
        </RadioGroup>
      </div>

      {cd.ap_exams_taken === true && (
        <APSubjectListManager
          label="AP Subjects Taken (with scores)"
          subjects={cd.ap_subjects || []}
          onSubjectsChange={s => update({ ap_subjects: s })}
          tooltip="Add each AP exam you've taken with its score (1-5). A minimum score of 3 is required for each to count toward German university admission."
        />
      )}

      {cd.ap_exams_taken === false && (
        <div className="rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 p-3 text-sm">
          <p className="font-medium text-amber-800 dark:text-amber-200">⚠ Important</p>
          <p className="text-amber-700 dark:text-amber-300 text-xs mt-1">
            Without AP exams, direct admission to German public universities is not possible.
            However, you may still qualify if you complete university semesters, or apply to private universities.
          </p>
        </div>
      )}

      {/* SAT / ACT — stacked vertically with clear grouping */}
      <div className="space-y-3">
        <div className="rounded-lg border p-3 space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">SAT</Label>
            <Switch
              checked={cd.has_sat || false}
              onCheckedChange={v => update({ has_sat: v })}
            />
          </div>
          {cd.has_sat && (
            <Input
              type="number"
              min={400}
              max={1600}
              value={cd.sat_score || ''}
              onChange={e => update({ sat_score: parseInt(e.target.value) || undefined })}
              placeholder="Total score (400–1600)"
            />
          )}
        </div>
        <div className="rounded-lg border p-3 space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">ACT</Label>
            <Switch
              checked={cd.has_act || false}
              onCheckedChange={v => update({ has_act: v })}
            />
          </div>
          {cd.has_act && (
            <Input
              type="number"
              min={1}
              max={36}
              value={cd.act_score || ''}
              onChange={e => update({ act_score: parseInt(e.target.value) || undefined })}
              placeholder="Composite score (1–36)"
            />
          )}
        </div>
      </div>

      {/* University study — shown at the bottom for graduates */}
      {cd.graduated === true && (
        <div className="space-y-3 pt-2 border-t">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Have you started university studies?</Label>
            <Switch
              checked={cd.has_university_study || false}
              onCheckedChange={v => update({ has_university_study: v })}
            />
          </div>
          <UniversityStudyFields data={cd} onUpdate={update} />
        </div>
      )}
    </div>
  );
}

// ─── IB Fields ──────────────────────────────────────────────────────────────

function IBFields({ data, onUpdate }: { data: Record<string, any>; onUpdate: (d: Record<string, any>) => void }) {
  const cd = data.curriculumDetails || {};
  const update = (d: Record<string, any>) => onUpdate({ curriculumDetails: { ...cd, ...d } });

  return (
    <div className="space-y-4">
      <GraduatedSection data={cd} onUpdate={update} gradeOptions={['11', '12']} />

      <div>
        <Label>Predicted / Final Total Points (out of 45)</Label>
        <Input
          type="number"
          min={0}
          max={45}
          value={cd.predicted_total || ''}
          onChange={e => update({ predicted_total: parseInt(e.target.value) || undefined })}
          placeholder="36"
        />
        {cd.predicted_total != null && cd.predicted_total < 24 && (
          <p className="text-xs text-destructive mt-1">Minimum 24 points required for German university admission.</p>
        )}
      </div>

      <div>
        <Label>Mathematics Level *</Label>
        <Select value={cd.math_level || ''} onValueChange={v => update({ math_level: v })}>
          <SelectTrigger><SelectValue placeholder="Select math level" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="AA_HL">Analysis & Approaches – HL</SelectItem>
            <SelectItem value="AA_SL">Analysis & Approaches – SL</SelectItem>
            <SelectItem value="AI_HL">Applications & Interpretation – HL</SelectItem>
            <SelectItem value="AI_SL">Applications & Interpretation – SL</SelectItem>
          </SelectContent>
        </Select>
        {(cd.math_level === 'AA_SL' || cd.math_level === 'AI_SL') && (
          <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
            With Mathematics at SL, you may be restricted from STEM-related subjects unless you have a science or language at HL.
          </p>
        )}
      </div>

      <SubjectListManager
        label="Higher Level (HL) Subjects"
        subjects={cd.hl_subjects || []}
        onSubjectsChange={s => update({ hl_subjects: s })}
        availableSubjects={IB_HL_SUBJECTS}
        gradeOptions={IB_GRADES}
      />

      <SubjectListManager
        label="Standard Level (SL) Subjects"
        subjects={cd.sl_subjects || []}
        onSubjectsChange={s => update({ sl_subjects: s })}
        availableSubjects={IB_SL_SUBJECTS}
        gradeOptions={IB_GRADES}
      />
    </div>
  );
}

// ─── National Diploma Fields ────────────────────────────────────────────────

function NationalDiplomaFields({ data, onUpdate }: { data: Record<string, any>; onUpdate: (d: Record<string, any>) => void }) {
  const cd = data.curriculumDetails || {};
  const update = (d: Record<string, any>) => onUpdate({ curriculumDetails: { ...cd, ...d } });

  return (
    <div className="space-y-4">
      <GraduatedSection data={cd} onUpdate={update} gradeOptions={['11', '12']} />

      <div>
        <Label>Subject Focus *</Label>
        <Select value={cd.subject_focus || ''} onValueChange={v => update({ subject_focus: v })}>
          <SelectTrigger><SelectValue placeholder="Select your section" /></SelectTrigger>
          <SelectContent>
            {NATIONAL_DIPLOMA_FOCUS_OPTIONS.map(opt => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Grade 10 Percentage</Label>
          <Input
            type="number"
            min={0}
            max={100}
            value={cd.grade_10_percentage || ''}
            onChange={e => update({ grade_10_percentage: parseFloat(e.target.value) || undefined })}
            placeholder="85"
          />
        </div>
        <div>
          <Label>Grade 11 Percentage</Label>
          <Input
            type="number"
            min={0}
            max={100}
            value={cd.grade_11_percentage || ''}
            onChange={e => update({ grade_11_percentage: parseFloat(e.target.value) || undefined })}
            placeholder="88"
          />
        </div>
      </div>

      <div className="rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 p-3 text-sm">
        <p className="text-blue-700 dark:text-blue-300 text-xs">
          National Diploma (Thānawiyya ʻĀmma) holders typically need to complete a Studienkolleg (foundation year) in Germany.
          With 2+ university semesters, you may qualify for Studienkolleg directly; with 4+ semesters, direct admission is possible.
        </p>
      </div>
    </div>
  );
}

// ─── Canadian Diploma Fields ────────────────────────────────────────────────

function CanadianDiplomaFields({ data, onUpdate }: { data: Record<string, any>; onUpdate: (d: Record<string, any>) => void }) {
  const cd = data.curriculumDetails || {};
  const update = (d: Record<string, any>) => onUpdate({ curriculumDetails: { ...cd, ...d } });

  return (
    <div className="space-y-4">
      <GraduatedSection data={cd} onUpdate={update} gradeOptions={['10', '11', '12']} />

      <div>
        <Label>Which territory is your diploma affiliated to? *</Label>
        <Select value={cd.territory || ''} onValueChange={v => update({ territory: v })}>
          <SelectTrigger><SelectValue placeholder="Select territory" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ontario">Ontario</SelectItem>
            <SelectItem value="british_columbia">British Columbia</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {cd.territory === 'ontario' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm">At least 12 general education courses in grade 11 & 12?</Label>
            <Switch checked={cd.has_12_general_courses || false} onCheckedChange={v => update({ has_12_general_courses: v })} />
          </div>
          {cd.has_12_general_courses && (
            <>
              <div className="flex items-center justify-between">
                <Label className="text-sm">At least 6 University Preparation Courses (UPCs) in grade 12?</Label>
                <Switch checked={cd.has_6_upcs || false} onCheckedChange={v => update({ has_6_upcs: v })} />
              </div>
              {cd.has_6_upcs && (
                <>
                  <div className="flex items-center justify-between">
                    <Label className="text-sm flex-1 mr-2">
                      Do UPCs include: 2 languages, mathematics (Advanced Functions + Calculus & Vectors), and a natural science?
                    </Label>
                    <Switch checked={cd.upcs_include_required || false} onCheckedChange={v => update({ upcs_include_required: v })} />
                  </div>
                  <div>
                    <Label>Average grade across the 6 UPCs (%)</Label>
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      value={cd.upc_average || ''}
                      onChange={e => update({ upc_average: parseFloat(e.target.value) || undefined })}
                      placeholder="75"
                    />
                    {cd.upc_average != null && cd.upc_average < 65 && (
                      <p className="text-xs text-destructive mt-1">Minimum average of 65% required.</p>
                    )}
                  </div>
                </>
              )}
            </>
          )}
        </div>
      )}

      {cd.territory === 'british_columbia' && (
        <div className="space-y-3">
          <div className="rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 p-3 text-sm">
            <p className="text-blue-700 dark:text-blue-300 text-xs">
              British Columbia diploma holders cannot directly access German public universities without at least one academic year at a university.
              However, you can attend a Studienkolleg or apply to a private university.
            </p>
          </div>
          <div className="flex items-center justify-between">
            <Label className="text-sm">13 courses in grade XI & XII (at least 5 in grade XII)?</Label>
            <Switch checked={cd.has_13_courses || false} onCheckedChange={v => update({ has_13_courses: v })} />
          </div>
          <div className="flex items-center justify-between">
            <Label className="text-sm flex-1 mr-2">
              Includes 2 languages + math + natural science (at least 1 with course number 12)?
            </Label>
            <Switch checked={cd.bc_includes_required || false} onCheckedChange={v => update({ bc_includes_required: v })} />
          </div>
          <div>
            <Label>Average Total Grade</Label>
            <Select value={cd.bc_average_grade || ''} onValueChange={v => update({ bc_average_grade: v })}>
              <SelectTrigger><SelectValue placeholder="Select grade" /></SelectTrigger>
              <SelectContent>
                {BC_GRADES.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── French BAC Fields (placeholder) ────────────────────────────────────────

function FrenchBACFields({ data, onUpdate }: { data: Record<string, any>; onUpdate: (d: Record<string, any>) => void }) {
  const cd = data.curriculumDetails || {};
  const update = (d: Record<string, any>) => onUpdate({ curriculumDetails: { ...cd, ...d } });

  return (
    <div className="space-y-4">
      <GraduatedSection data={cd} onUpdate={update} gradeOptions={['11', '12']} />
      <div className="rounded-lg bg-muted p-3 text-sm text-muted-foreground">
        Detailed eligibility criteria for French BAC will be available soon. Please complete the basic information for now.
      </div>
    </div>
  );
}

// ─── German Abitur Fields ───────────────────────────────────────────────────

function GermanAbiturFields({ data, onUpdate }: { data: Record<string, any>; onUpdate: (d: Record<string, any>) => void }) {
  const cd = data.curriculumDetails || {};
  const update = (d: Record<string, any>) => onUpdate({ curriculumDetails: { ...cd, ...d } });

  return (
    <div className="space-y-4">
      <GraduatedSection data={cd} onUpdate={update} gradeOptions={['11', '12', '13']} />
      <div className="rounded-lg bg-accent/10 border border-accent/30 p-3 text-sm">
        <p className="font-medium text-accent-foreground">✓ Direct Admission</p>
        <p className="text-xs mt-1 text-muted-foreground">
          The German Abitur provides direct admission to all German universities and all subject areas.
        </p>
      </div>
    </div>
  );
}

// ─── Main Export ─────────────────────────────────────────────────────────────

export function CurriculumFields({ curriculum, data, onUpdate }: CurriculumFieldsProps) {
  switch (curriculum) {
    case 'IGCSE':
      return <IGCSEFields data={data} onUpdate={onUpdate} />;
    case 'American Diploma':
      return <AmericanDiplomaFields data={data} onUpdate={onUpdate} />;
    case 'IB':
      return <IBFields data={data} onUpdate={onUpdate} />;
    case 'NATIONAL DIPLOMA':
      return <NationalDiplomaFields data={data} onUpdate={onUpdate} />;
    case 'Canadian Diploma':
      return <CanadianDiplomaFields data={data} onUpdate={onUpdate} />;
    case 'French BAC':
      return <FrenchBACFields data={data} onUpdate={onUpdate} />;
    case 'German Abitur':
      return <GermanAbiturFields data={data} onUpdate={onUpdate} />;
    default:
      return (
        <div className="space-y-4">
          <GraduatedSection
            data={data.curriculumDetails || {}}
            onUpdate={d => onUpdate({ curriculumDetails: { ...(data.curriculumDetails || {}), ...d } })}
            gradeOptions={['10', '11', '12']}
          />
          <div className="rounded-lg bg-muted p-3 text-sm text-muted-foreground">
            Detailed eligibility criteria for your curriculum type will be available soon.
          </div>
        </div>
      );
  }
}
