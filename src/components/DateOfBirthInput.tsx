import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  const [calendarMonth, setCalendarMonth] = useState<Date>(() => {
    if (value) {
      return new Date(value);
    }
    // Default to a reasonable birth year (25 years ago)
    const defaultYear = new Date().getFullYear() - 25;
    return new Date(defaultYear, 0, 1);
  });

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
    // Remove any non-digit characters for processing
    const digitsOnly = newValue.replace(/\D/g, '');
    
    let formattedValue = '';
    let shouldUpdateCursor = false;
    
    // Format based on number of digits entered
    if (digitsOnly.length <= 4) {
      // Year part (YYYY)
      formattedValue = digitsOnly;
    } else if (digitsOnly.length <= 6) {
      // Year + Month part (YYYY-MM)
      formattedValue = `${digitsOnly.slice(0, 4)}-${digitsOnly.slice(4)}`;
      // If they just completed the year (4 digits), move cursor past the dash
      if (digitsOnly.length === 4 && inputValue.length === 3) {
        shouldUpdateCursor = true;
      }
    } else if (digitsOnly.length <= 8) {
      // Full date (YYYY-MM-DD)
      formattedValue = `${digitsOnly.slice(0, 4)}-${digitsOnly.slice(4, 6)}-${digitsOnly.slice(6)}`;
      // If they just completed the month (6 digits), move cursor past the second dash
      if (digitsOnly.length === 6 && inputValue.length === 6) {
        shouldUpdateCursor = true;
      }
    } else {
      // Limit to 8 digits max (YYYY-MM-DD)
      formattedValue = `${digitsOnly.slice(0, 4)}-${digitsOnly.slice(4, 6)}-${digitsOnly.slice(6, 8)}`;
    }
    
    setInputValue(formattedValue);
    
    // Only validate and update parent if it's a complete date
    if (formattedValue.length === 10 && formattedValue.includes('-')) {
      onChange(formattedValue);
      if (isTouched) {
        const result = validateDOB(formattedValue);
        setValidation(result);
        onValidationChange?.(result);
      }
    } else if (formattedValue === '') {
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

  const handleYearChange = (year: string) => {
    const newDate = new Date(parseInt(year), calendarMonth.getMonth(), 1);
    setCalendarMonth(newDate);
  };

  const handleMonthChange = (month: string) => {
    const newDate = new Date(calendarMonth.getFullYear(), parseInt(month), 1);
    setCalendarMonth(newDate);
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
      /^[0-9]$/.test(e.key) // Only allow digits, no dashes since we auto-format
    ) {
      return;
    }
    e.preventDefault();
  };

  const formatDisplayValue = (val: string): string => {
    // This function is no longer needed since we handle formatting in handleInputChange
    return val;
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

  // Generate year options (from 1900 to current year)
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: currentYear - 1899 }, (_, i) => currentYear - i);
  
  // Month options
  const monthOptions = [
    { value: "0", label: "January" },
    { value: "1", label: "February" },
    { value: "2", label: "March" },
    { value: "3", label: "April" },
    { value: "4", label: "May" },
    { value: "5", label: "June" },
    { value: "6", label: "July" },
    { value: "7", label: "August" },
    { value: "8", label: "September" },
    { value: "9", label: "October" },
    { value: "10", label: "November" },
    { value: "11", label: "December" },
  ];

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
            onChange={(e) => handleInputChange(e.target.value)}
            onBlur={handleInputBlur}
            onKeyDown={handleInputKeyDown}
            required={required}
            maxLength={10}
          />
          {/* Format helper */}
          <div className="absolute right-3 top-3 text-xs text-muted-foreground pointer-events-none">
            YYYY/MM/DD
          </div>
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
            <div className="p-3 border-b">
              <div className="flex gap-2 items-center justify-between">
                {/* Year Selector */}
                <Select
                  value={calendarMonth.getFullYear().toString()}
                  onValueChange={handleYearChange}
                >
                  <SelectTrigger className="w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="h-[200px]">
                    {yearOptions.map((year) => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Month Selector */}
                <Select
                  value={calendarMonth.getMonth().toString()}
                  onValueChange={handleMonthChange}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {monthOptions.map((month) => (
                      <SelectItem key={month.value} value={month.value}>
                        {month.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <CalendarComponent
              mode="single"
              selected={currentDate}
              onSelect={handleCalendarSelect}
              disabled={(date) => date > maxDate || date < new Date("1900-01-01")}
              month={calendarMonth}
              onMonthChange={setCalendarMonth}
              initialFocus
              className="pointer-events-auto"
            />
          </PopoverContent>
        </Popover>
      </div>
      
      {/* Format instruction helper */}
      {!isTouched && !inputValue && (
        <p className="text-xs text-muted-foreground">
          💡 Type your birth date: Year, then month, then day (e.g., 19951207 becomes 1995-12-07)
        </p>
      )}
      
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