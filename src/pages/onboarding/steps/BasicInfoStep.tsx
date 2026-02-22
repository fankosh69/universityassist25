import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DateOfBirthInput } from "@/components/DateOfBirthInput";
import { CountryCodeSelect } from "@/components/CountryCodeSelect";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Info } from "lucide-react";

interface BasicInfoStepProps {
  data: Record<string, any>;
  onUpdate: (data: Record<string, any>) => void;
  errors?: Record<string, string>;
}

const NATIONALITY_OPTIONS = [
  { value: "Egyptian", label: "Egyptian" },
  { value: "Saudi", label: "Saudi" },
  { value: "Emirati", label: "Emirati" },
  { value: "Jordanian", label: "Jordanian" },
  { value: "Lebanese", label: "Lebanese" },
  { value: "Iraqi", label: "Iraqi" },
  { value: "Syrian", label: "Syrian" },
  { value: "Palestinian", label: "Palestinian" },
  { value: "Kuwaiti", label: "Kuwaiti" },
  { value: "Bahraini", label: "Bahraini" },
  { value: "Omani", label: "Omani" },
  { value: "Qatari", label: "Qatari" },
  { value: "Tunisian", label: "Tunisian" },
  { value: "Moroccan", label: "Moroccan" },
  { value: "Algerian", label: "Algerian" },
  { value: "Libyan", label: "Libyan" },
  { value: "Sudanese", label: "Sudanese" },
  { value: "Yemeni", label: "Yemeni" },
  { value: "Turkish", label: "Turkish" },
  { value: "Iranian", label: "Iranian" },
  { value: "Pakistani", label: "Pakistani" },
  { value: "Indian", label: "Indian" },
  { value: "Nigerian", label: "Nigerian" },
  { value: "Kenyan", label: "Kenyan" },
  { value: "Ethiopian", label: "Ethiopian" },
  { value: "German", label: "German" },
  { value: "American", label: "American" },
  { value: "British", label: "British" },
  { value: "Canadian", label: "Canadian" },
  { value: "French", label: "French" },
  { value: "Other", label: "Other" },
];

function PrefilledHint({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground ml-2">
      <Info className="w-3 h-3" />
      From your signup
    </span>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-xs text-destructive mt-1">{message}</p>;
}

export function BasicInfoStep({ data, onUpdate, errors = {} }: BasicInfoStepProps) {
  const handleChange = (field: string, value: any) => {
    onUpdate({ [field]: value });
  };

  // Detect pre-filled fields (they had values when the component first mounted from signup)
  const isPrefilled = (field: string) => !!data[field] && data[`_prefilled_${field}`] !== false;

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="fullName">
          Full Name *
          <PrefilledHint show={!!data.fullName && !errors.fullName} />
        </Label>
        <Input
          id="fullName"
          value={data.fullName || ''}
          onChange={(e) => handleChange('fullName', e.target.value)}
          placeholder="Enter your full name"
          className={errors.fullName ? 'border-destructive' : ''}
        />
        <FieldError message={errors.fullName} />
      </div>

      <div>
        <Label>
          Date of Birth *
          <PrefilledHint show={!!data.dateOfBirth && !errors.dateOfBirth} />
        </Label>
        <DateOfBirthInput
          value={data.dateOfBirth || ''}
          onChange={(value) => handleChange('dateOfBirth', value)}
        />
        <FieldError message={errors.dateOfBirth} />
      </div>

      <div>
        <Label>Nationality *</Label>
        <SearchableSelect
          value={data.nationality || ''}
          onValueChange={(value) => handleChange('nationality', value)}
          options={NATIONALITY_OPTIONS}
          placeholder="Select nationality..."
          emptyText="No nationality found."
          className={`w-full ${errors.nationality ? 'border-destructive' : ''}`}
          maxDisplayOptions={10}
        />
        <FieldError message={errors.nationality} />
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
          <Label htmlFor="phone">
            Phone Number
            <PrefilledHint show={!!data.phone} />
          </Label>
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
