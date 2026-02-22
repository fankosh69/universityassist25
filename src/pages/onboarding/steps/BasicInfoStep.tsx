import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DateOfBirthInput } from "@/components/DateOfBirthInput";
import { CountryCodeSelect } from "@/components/CountryCodeSelect";

interface BasicInfoStepProps {
  data: Record<string, any>;
  onUpdate: (data: Record<string, any>) => void;
}

export function BasicInfoStep({ data, onUpdate }: BasicInfoStepProps) {
  const handleChange = (field: string, value: any) => {
    onUpdate({ [field]: value });
  };

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="fullName">Full Name *</Label>
        <Input
          id="fullName"
          value={data.fullName || ''}
          onChange={(e) => handleChange('fullName', e.target.value)}
          placeholder="Enter your full name"
        />
      </div>

      <div>
        <Label>Date of Birth *</Label>
        <DateOfBirthInput
          value={data.dateOfBirth || ''}
          onChange={(value) => handleChange('dateOfBirth', value)}
        />
      </div>

      <div>
        <Label htmlFor="nationality">Nationality *</Label>
        <Input
          id="nationality"
          value={data.nationality || ''}
          onChange={(e) => handleChange('nationality', e.target.value)}
          placeholder="e.g., Egyptian, Saudi, etc."
        />
      </div>

      <div>
        <Label htmlFor="countryOfResidence">Country of Residence *</Label>
        <Input
          id="countryOfResidence"
          value={data.countryOfResidence || ''}
          onChange={(e) => handleChange('countryOfResidence', e.target.value)}
          placeholder="e.g., Egypt, Saudi Arabia, UAE"
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-1">
          <Label>Country Code</Label>
          <CountryCodeSelect
            value={data.countryCode || '+20'}
            onValueChange={(value) => handleChange('countryCode', value)}
          />
        </div>
        <div className="col-span-2">
          <Label htmlFor="phone">Phone Number</Label>
          <Input
            id="phone"
            type="tel"
            value={data.phone || ''}
            onChange={(e) => handleChange('phone', e.target.value)}
            placeholder="Enter your phone number"
          />
        </div>
      </div>
    </div>
  );
}
