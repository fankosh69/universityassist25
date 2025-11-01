import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface AcademicInfoStepProps {
  data: Record<string, any>;
  onUpdate: (data: Record<string, any>) => void;
}

export function AcademicInfoStep({ data, onUpdate }: AcademicInfoStepProps) {
  const handleChange = (field: string, value: any) => {
    onUpdate({ [field]: value });
  };

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="curriculum">Current Curriculum *</Label>
        <Select
          value={data.curriculum || ''}
          onValueChange={(value) => handleChange('curriculum', value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select curriculum" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="high_school">High School</SelectItem>
            <SelectItem value="bachelors">Bachelor's Degree</SelectItem>
            <SelectItem value="masters">Master's Degree</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="previousMajor">Previous Major / Field of Study</Label>
        <Input
          id="previousMajor"
          value={data.previousMajor || ''}
          onChange={(e) => handleChange('previousMajor', e.target.value)}
          placeholder="e.g., Computer Science, Business, etc."
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label htmlFor="gpaRaw">GPA *</Label>
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
          <Label htmlFor="gpaScale">Scale *</Label>
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
          <Label htmlFor="gpaMinPass">Min Pass *</Label>
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
