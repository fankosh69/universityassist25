import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { CurriculumFields } from "./CurriculumFields";

interface AcademicInfoStepProps {
  data: Record<string, any>;
  onUpdate: (data: Record<string, any>) => void;
  errors?: Record<string, string>;
}

const CURRICULUM_OPTIONS = [
  { value: 'American Diploma', label: 'American Diploma' },
  { value: 'German Abitur', label: 'German Abitur' },
  { value: 'IGCSE', label: 'IGCSE / GCE A-Levels' },
  { value: 'IB', label: 'International Baccalaureate (IB)' },
  { value: 'NATIONAL DIPLOMA', label: 'National Diploma (Thānawiyya ʻĀmma)' },
  { value: 'French BAC', label: 'French BAC' },
  { value: 'Canadian Diploma', label: 'Canadian Diploma' },
  { value: 'Other', label: 'Other' },
];

const EDUCATION_LEVEL_OPTIONS = [
  { value: 'foundation_year', label: 'Foundation Year' },
  { value: 'bachelors', label: "Bachelor's" },
  { value: 'masters', label: "Master's" },
];

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-xs text-destructive mt-1">{message}</p>;
}

export function AcademicInfoStep({ data, onUpdate, errors = {} }: AcademicInfoStepProps) {
  const handleChange = (field: string, value: any) => {
    onUpdate({ [field]: value });
  };

  const isBachelorOrFoundation = data.desiredEducationLevel === 'bachelors' || data.desiredEducationLevel === 'foundation_year';
  const isMasters = data.desiredEducationLevel === 'masters';
  const showCurriculumFields = isBachelorOrFoundation && data.curriculum && data.curriculum !== 'Other';

  return (
    <div className="space-y-4">
      {/* Desired Education Level - ask first */}
      <div>
        <Label htmlFor="desiredEducationLevel">Desired Education Level *</Label>
        <Select
          value={data.desiredEducationLevel || ''}
          onValueChange={(value) => handleChange('desiredEducationLevel', value)}
        >
          <SelectTrigger className={errors.desiredEducationLevel ? 'border-destructive' : ''}>
            <SelectValue placeholder="Select education level" />
          </SelectTrigger>
          <SelectContent>
            {EDUCATION_LEVEL_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <FieldError message={errors.desiredEducationLevel} />
      </div>

      {/* Curriculum - always shown */}
      <div>
        <Label htmlFor="curriculum">
          {isBachelorOrFoundation ? 'High School Curriculum *' : 'Previous Education Curriculum *'}
        </Label>
        <Select
          value={data.curriculum || ''}
          onValueChange={(value) => handleChange('curriculum', value)}
        >
          <SelectTrigger className={errors.curriculum ? 'border-destructive' : ''}>
            <SelectValue placeholder="Select curriculum" />
          </SelectTrigger>
          <SelectContent>
            {CURRICULUM_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <FieldError message={errors.curriculum} />
      </div>

      {/* Desired Major */}
      <div>
        <Label htmlFor="desiredMajor">Desired Major</Label>
        <Input
          id="desiredMajor"
          value={data.desiredMajor || ''}
          onChange={(e) => handleChange('desiredMajor', e.target.value)}
          placeholder="e.g., Computer Science, Engineering, Business"
        />
      </div>

      {/* School Name */}
      <div>
        <Label htmlFor="schoolName">Your Current or Previous School Name</Label>
        <Input
          id="schoolName"
          value={data.schoolName || ''}
          onChange={(e) => handleChange('schoolName', e.target.value)}
          placeholder="e.g., Cairo American College, AIS"
        />
      </div>

      {/* ─── Bachelor/Foundation path: Curriculum-specific fields ─── */}
      {showCurriculumFields && (
        <div className="mt-2 pt-4 border-t border-border">
          <h3 className="text-sm font-semibold mb-3 text-primary">
            {data.curriculum} — Eligibility Details
          </h3>
          <CurriculumFields
            curriculum={data.curriculum}
            data={data}
            onUpdate={(d) => onUpdate(d)}
          />
        </div>
      )}

      {/* ─── Master's path: GPA + enrollment status ─── */}
      {isMasters && (
        <div className="mt-2 pt-4 border-t border-border space-y-4">
          <h3 className="text-sm font-semibold mb-3 text-primary">
            University Academic Details
          </h3>

          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Are you still enrolled at university?</Label>
            <Switch
              checked={data.stillEnrolled || false}
              onCheckedChange={(v) => handleChange('stillEnrolled', v)}
            />
          </div>

          {data.stillEnrolled && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Credits Completed So Far</Label>
                <Input
                  type="number"
                  value={data.creditsCompletedSoFar || ''}
                  onChange={(e) => handleChange('creditsCompletedSoFar', parseInt(e.target.value))}
                  placeholder="120"
                />
              </div>
              <div>
                <Label>Total Credits Required</Label>
                <Input
                  type="number"
                  value={data.totalCreditsRequired || ''}
                  onChange={(e) => handleChange('totalCreditsRequired', parseInt(e.target.value))}
                  placeholder="180"
                />
              </div>
            </div>
          )}

          {data.stillEnrolled && (
            <div>
              <Label>Expected Graduation</Label>
              <Input
                type="month"
                value={data.expectedGraduation || ''}
                onChange={(e) => handleChange('expectedGraduation', e.target.value)}
              />
            </div>
          )}

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="gpaRaw">GPA</Label>
              <Input
                id="gpaRaw"
                type="number"
                step="0.01"
                value={data.gpaRaw || ''}
                onChange={(e) => handleChange('gpaRaw', parseFloat(e.target.value))}
                placeholder="3.5"
              />
            </div>
            <div>
              <Label htmlFor="gpaScale">Scale</Label>
              <Input
                id="gpaScale"
                type="number"
                step="0.1"
                value={data.gpaScale || ''}
                onChange={(e) => handleChange('gpaScale', parseFloat(e.target.value))}
                placeholder="4.0"
              />
            </div>
            <div>
              <Label htmlFor="gpaMinPass">Min Pass</Label>
              <Input
                id="gpaMinPass"
                type="number"
                step="0.1"
                value={data.gpaMinPass || ''}
                onChange={(e) => handleChange('gpaMinPass', parseFloat(e.target.value))}
                placeholder="2.0"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="totalECTS">Total ECTS Credits (if applicable)</Label>
            <Input
              id="totalECTS"
              type="number"
              value={data.totalECTS || ''}
              onChange={(e) => handleChange('totalECTS', parseInt(e.target.value))}
              placeholder="180"
            />
          </div>
        </div>
      )}

      {/* ─── Blocked bank account awareness ─── */}
      <div>
        <Label className="text-sm font-medium">
          Are you aware of the mandatory blocked bank account to study in Germany totalling €11,992 for a year?
        </Label>
        <RadioGroup
          value={data.blockedBankAccountAware || ''}
          onValueChange={(value) => handleChange('blockedBankAccountAware', value)}
          className="mt-2 space-y-2"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="yes" id="bba-yes" />
            <Label htmlFor="bba-yes" className="font-normal">Yes</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="no" id="bba-no" />
            <Label htmlFor="bba-no" className="font-normal">No</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="not_sure" id="bba-not-sure" />
            <Label htmlFor="bba-not-sure" className="font-normal">Not sure</Label>
          </div>
        </RadioGroup>
      </div>
    </div>
  );
}
