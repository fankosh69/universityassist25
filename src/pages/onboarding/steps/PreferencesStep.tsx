import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface PreferencesStepProps {
  data: Record<string, any>;
  onUpdate: (data: Record<string, any>) => void;
}

export function PreferencesStep({ data, onUpdate }: PreferencesStepProps) {
  const handleChange = (field: string, value: any) => {
    onUpdate({ [field]: value });
  };

  const handleArrayChange = (field: string, value: string) => {
    const array = value.split(',').map(v => v.trim()).filter(v => v);
    onUpdate({ [field]: array });
  };

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="preferredFields">Preferred Fields of Study</Label>
        <Input
          id="preferredFields"
          value={(data.preferredFields || []).join(', ')}
          onChange={(e) => handleArrayChange('preferredFields', e.target.value)}
          placeholder="e.g., Computer Science, Engineering, Business"
        />
        <p className="text-xs text-muted-foreground mt-1">Separate multiple fields with commas</p>
      </div>

      <div>
        <Label htmlFor="preferredDegreeType">Preferred Degree Type</Label>
        <Select
          value={data.preferredDegreeType || ''}
          onValueChange={(value) => handleChange('preferredDegreeType', value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select degree type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="bachelors">Bachelor's</SelectItem>
            <SelectItem value="masters">Master's</SelectItem>
            <SelectItem value="phd">PhD</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="preferredCities">Preferred Cities in Germany</Label>
        <Input
          id="preferredCities"
          value={(data.preferredCities || []).join(', ')}
          onChange={(e) => handleArrayChange('preferredCities', e.target.value)}
          placeholder="e.g., Munich, Berlin, Hamburg"
        />
        <p className="text-xs text-muted-foreground mt-1">Separate multiple cities with commas</p>
      </div>

      <div>
        <Label htmlFor="careerGoals">Career Goals</Label>
        <Textarea
          id="careerGoals"
          value={data.careerGoals || ''}
          onChange={(e) => handleChange('careerGoals', e.target.value)}
          placeholder="Tell us about your career aspirations..."
          rows={4}
        />
      </div>
    </div>
  );
}
