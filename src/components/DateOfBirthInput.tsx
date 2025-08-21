import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Calendar, AlertTriangle, CheckCircle, Info, CalendarIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
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
  const [inputValue, setInputValue] = useState(value);
  const [isOpen, setIsOpen] = useState(false);

  // Update input value when prop changes
  useEffect(() => {
    setInputValue(value);
  }, [value]);

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

  const handleInputChange = (newValue: string) => {
    // Allow partial dates while typing
    setInputValue(newValue);
    
    // Only validate and update parent if it's a complete date
    if (newValue.length === 10 && newValue.includes('-')) {
      onChange(newValue);
      if (isTouched) {
        const result = validateDOB(newValue);
        setValidation(result);
        onValidationChange?.(result);
      }
    } else if (newValue === '') {
      onChange('');
      setValidation(null);
      onValidationChange?.({ valid: true });
    }
  };

  const handleInputBlur = () => {
    setIsTouched(true);
    // On blur, update with current input value and validate
    onChange(inputValue);
    if (inputValue) {
      const result = validateDOB(inputValue);
      setValidation(result);
      onValidationChange?.(result);
    }
  };

  const handleCalendarSelect = (date: Date | undefined) => {
    if (date) {
      const dateString = format(date, 'yyyy-MM-dd');
      setInputValue(dateString);
      onChange(dateString);
      setIsTouched(true);
      
      const result = validateDOB(dateString);
      setValidation(result);
      onValidationChange?.(result);
    }
    setIsOpen(false);
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Allow navigation keys, backspace, delete, and digits
    if (
      e.key === 'ArrowLeft' ||
      e.key === 'ArrowRight' ||
      e.key === 'Backspace' ||
      e.key === 'Delete' ||
      e.key === 'Tab' ||
      e.key === 'Enter' ||
      /^[0-9-]$/.test(e.key)
    ) {
      return;
    }
    e.preventDefault();
  };

  const formatDisplayValue = (val: string): string => {
    // Remove any non-digit characters except hyphens
    const cleaned = val.replace(/[^\d-]/g, '');
    
    // If it looks like a date, format it properly
    if (cleaned.length <= 4) {
      return cleaned;
    } else if (cleaned.length <= 7) {
      return cleaned.replace(/^(\d{4})(\d{1,2})/, '$1-$2');
    } else {
      return cleaned.replace(/^(\d{4})(\d{2})(\d{1,2})/, '$1-$2-$3');
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

  const currentDate = inputValue && inputValue.length === 10 ? new Date(inputValue) : undefined;
  const maxDate = new Date();

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="flex gap-2">
        {/* Text Input for typing */}
        <div className="relative flex-1">
          <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            id={id}
            type="text"
            placeholder="YYYY-MM-DD"
            className={getInputClassName()}
            value={inputValue}
            onChange={(e) => handleInputChange(formatDisplayValue(e.target.value))}
            onBlur={handleInputBlur}
            onKeyDown={handleInputKeyDown}
            required={required}
            maxLength={10}
          />
        </div>
        
        {/* Calendar Picker Button */}
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-10 p-0",
                !currentDate && "text-muted-foreground"
              )}
              type="button"
            >
              <CalendarIcon className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <CalendarComponent
              mode="single"
              selected={currentDate}
              onSelect={handleCalendarSelect}
              disabled={(date) => date > maxDate || date < new Date("1900-01-01")}
              initialFocus
              defaultMonth={currentDate || new Date(2000, 0)}
              className="pointer-events-auto"
            />
          </PopoverContent>
        </Popover>
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