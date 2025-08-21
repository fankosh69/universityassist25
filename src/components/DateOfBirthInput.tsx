import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar, AlertTriangle, CheckCircle, Info } from "lucide-react";
import { validateDOB, type DOBValidationResult } from "@/lib/dob-validation";

interface DateOfBirthInputProps {
  value: string;
  onChange: (value: string) => void;
  onValidationChange?: (result: DOBValidationResult) => void;
  label?: string;
  required?: boolean;
  className?: string;
  id?: string;
}

export function DateOfBirthInput({
  value,
  onChange,
  onValidationChange,
  label = "Date of Birth",
  required = false,
  className = "",
  id = "date-of-birth"
}: DateOfBirthInputProps) {
  const [validation, setValidation] = useState<DOBValidationResult | null>(null);
  const [isTouched, setIsTouched] = useState(false);

  // Validate on value change
  useEffect(() => {
    if (value && isTouched) {
      const result = validateDOB(value);
      setValidation(result);
      onValidationChange?.(result);
    } else if (!value) {
      setValidation(null);
      onValidationChange?.({ valid: true });
    }
  }, [value, isTouched, onValidationChange]);

  const handleBlur = () => {
    setIsTouched(true);
    if (value) {
      const result = validateDOB(value);
      setValidation(result);
      onValidationChange?.(result);
    }
  };

  const getInputClassName = () => {
    let baseClass = `pl-10 ${className}`;
    
    if (validation && isTouched) {
      if (!validation.valid) {
        baseClass += ' border-destructive';
      } else if (validation.isUnderage) {
        baseClass += ' border-yellow-500';
      } else {
        baseClass += ' border-green-500';
      }
    }
    
    return baseClass;
  };

  const getMessageIcon = () => {
    if (!validation || !isTouched) return null;
    
    if (!validation.valid) {
      return <AlertTriangle className="h-4 w-4 text-destructive" />;
    } else if (validation.isUnderage) {
      return <Info className="h-4 w-4 text-yellow-500" />;
    } else {
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    }
  };

  const getMaxDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          id={id}
          type="date"
          className={getInputClassName()}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={handleBlur}
          max={getMaxDate()}
          required={required}
        />
      </div>
      
      {validation && validation.message && isTouched && (
        <div 
          className="flex items-start gap-2 text-sm" 
          role="alert"
          aria-live="polite"
        >
          {getMessageIcon()}
          <p className={`${
            !validation.valid ? 'text-destructive' :
            validation.isUnderage ? 'text-yellow-600' :
            'text-green-600'
          }`}>
            {validation.message}
          </p>
        </div>
      )}
    </div>
  );
}