import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface AcademicInfoStepProps {
  data: Record<string, any>;
  onUpdate: (data: Record<string, any>) => void;
}

const CURRICULUM_OPTIONS = [
  { value: 'American Diploma', label: 'American Diploma' },
  { value: 'IGCSE', label: 'IGCSE' },
  { value: 'IB', label: 'IB' },
  { value: 'NATIONAL DIPLOMA', label: 'National Diploma' },
  { value: 'French BAC', label: 'French BAC' },
  { value: 'Canadian Diploma', label: 'Canadian Diploma' },
  { value: 'Other', label: 'Other' },
];

const EDUCATION_LEVEL_OPTIONS = [
  { value: 'foundation_year', label: 'Foundation Year' },
  { value: 'bachelors', label: "Bachelor's" },
  { value: 'masters', label: "Master's" },
];

export function AcademicInfoStep({ data, onUpdate }: AcademicInfoStepProps) {
  const handleChange = (field: string, value: any) => {
    onUpdate({ [field]: value });
  };

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="curriculum">Student High School Curriculum *</Label>
        <Select
          value={data.curriculum || ''}
          onValueChange={(value) => handleChange('curriculum', value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select curriculum" />
          </SelectTrigger>
          <SelectContent>
            {CURRICULUM_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="desiredEducationLevel">Desired Education Level *</Label>
        <Select
          value={data.desiredEducationLevel || ''}
          onValueChange={(value) => handleChange('desiredEducationLevel', value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select education level" />
          </SelectTrigger>
          <SelectContent>
            {EDUCATION_LEVEL_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="desiredMajor">Desired Major</Label>
        <Input
          id="desiredMajor"
          value={data.desiredMajor || ''}
          onChange={(e) => handleChange('desiredMajor', e.target.value)}
          placeholder="e.g., Computer Science, Engineering, Business"
        />
      </div>

      <div>
        <Label htmlFor="schoolName">Your Current or Previous School/University Name</Label>
        <Input
          id="schoolName"
          value={data.schoolName || ''}
          onChange={(e) => handleChange('schoolName', e.target.value)}
          placeholder="e.g., Cairo American College, AIS"
        />
      </div>

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
  );
}
