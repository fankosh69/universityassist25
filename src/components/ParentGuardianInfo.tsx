import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User, Phone, AlertTriangle } from "lucide-react";
import { EmailInput } from "@/components/EmailInput";
import { CountryCodeSelect } from "@/components/CountryCodeSelect";
import { validateParentName, type ParentInfo } from "@/lib/dob-validation";

interface ParentGuardianInfoProps {
  parentInfo: ParentInfo;
  onChange: (parentInfo: ParentInfo) => void;
  errors?: string[];
}

export function ParentGuardianInfo({ parentInfo, onChange, errors = [] }: ParentGuardianInfoProps) {
  const [nameError, setNameError] = useState("");

  const handleNameChange = (name: string) => {
    onChange({ ...parentInfo, fullName: name });
    
    // Validate name on change
    if (name) {
      const validation = validateParentName(name);
      setNameError(validation.valid ? "" : validation.message || "");
    } else {
      setNameError("");
    }
  };

  const handleEmailChange = (email: string) => {
    onChange({ ...parentInfo, email });
  };

  const handlePhoneChange = (phone: string) => {
    onChange({ ...parentInfo, phone });
  };

  const handleCountryCodeChange = (countryCode: string) => {
    onChange({ ...parentInfo, countryCode });
  };

  return (
    <Card className="border-yellow-200 bg-yellow-50/50">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg flex items-center gap-2 text-yellow-800">
          <User className="h-5 w-5" />
          Parent/Guardian Information
        </CardTitle>
        <p className="text-sm text-yellow-700">
          Since you're under 18, we need your parent or guardian's contact information to proceed.
        </p>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Parent Full Name */}
        <div className="space-y-2">
          <Label htmlFor="parent-name">Parent/Guardian Full Name</Label>
          <div className="relative">
            <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="parent-name"
              type="text"
              placeholder="Enter parent's full name"
              className={`pl-10 ${nameError ? "border-destructive" : ""}`}
              value={parentInfo.fullName}
              onChange={(e) => handleNameChange(e.target.value)}
              required
            />
          </div>
          {nameError && (
            <p className="text-sm text-destructive flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              {nameError}
            </p>
          )}
        </div>

        {/* Parent Email */}
        <EmailInput
          id="parent-email"
          label="Parent/Guardian Email"
          value={parentInfo.email}
          onChange={handleEmailChange}
          placeholder="Enter parent's email address"
          required
        />

        {/* Parent Phone */}
        <div className="space-y-2">
          <Label htmlFor="parent-phone">Parent/Guardian Phone Number</Label>
          <div className="flex space-x-2">
            <CountryCodeSelect
              value={parentInfo.countryCode}
              onValueChange={handleCountryCodeChange}
              className="w-36"
            />
            <div className="relative flex-1">
              <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="parent-phone"
                type="tel"
                placeholder="Enter parent's phone number"
                className="pl-10"
                value={parentInfo.phone}
                onChange={(e) => handlePhoneChange(e.target.value)}
                required
              />
            </div>
          </div>
        </div>

        {/* Display validation errors */}
        {errors.length > 0 && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-md p-3">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-destructive flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-destructive">
                  Please correct the following issues:
                </p>
                <ul className="text-sm text-destructive space-y-1">
                  {errors.map((error, index) => (
                    <li key={index} className="list-disc list-inside ml-2">
                      {error}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}