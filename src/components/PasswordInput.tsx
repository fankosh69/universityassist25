import React, { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff, Lock, AlertTriangle, CheckCircle, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { validatePassword, type PersonalInfo, type PasswordCheck } from "@/lib/password-validation";

interface PasswordInputProps {
  id: string;
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  personalInfo?: PersonalInfo;
  confirmPassword?: string;
  onValidationChange?: (validation: PasswordCheck) => void;
  required?: boolean;
  className?: string;
  showConfirmation?: boolean;
  confirmValue?: string;
  onConfirmChange?: (value: string) => void;
  confirmLabel?: string;
  confirmPlaceholder?: string;
}

export const PasswordInput: React.FC<PasswordInputProps> = ({
  id,
  label,
  placeholder,
  value,
  onChange,
  personalInfo = {},
  confirmPassword,
  onValidationChange,
  required = false,
  className,
  showConfirmation = false,
  confirmValue = "",
  onConfirmChange,
  confirmLabel = "Confirm Password",
  confirmPlaceholder = "Confirm your password"
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [validation, setValidation] = useState<PasswordCheck | null>(null);
  const [confirmValidation, setConfirmValidation] = useState<PasswordCheck | null>(null);
  const [isTouched, setIsTouched] = useState(false);
  const [isConfirmTouched, setIsConfirmTouched] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const confirmInputRef = useRef<HTMLInputElement>(null);

  // Validate password whenever value or personal info changes (without confirm password check)
  useEffect(() => {
    if (value || isTouched) {
      const result = validatePassword(value, personalInfo); // Don't include confirm password in main validation
      setValidation(result);
      onValidationChange?.(result);
    }
  }, [value, personalInfo, isTouched, onValidationChange]);

  // Validate confirmation separately
  useEffect(() => {
    if (showConfirmation && (confirmValue || isConfirmTouched)) {
      const result = validatePassword("", {}, value); // Just check if they match
      result.valid = confirmValue === value;
      result.errors = confirmValue === value ? [] : ["Passwords don't match."];
      setConfirmValidation(result);
    }
  }, [confirmValue, value, isConfirmTouched, showConfirmation]);

  const togglePasswordVisibility = () => {
    const input = inputRef.current;
    if (!input) return;

    const start = input.selectionStart;
    const end = input.selectionEnd;
    
    setShowPassword(!showPassword);
    
    // Restore cursor position after state update
    requestAnimationFrame(() => {
      if (input) {
        input.setSelectionRange(start, end);
      }
    });
  };

  const toggleConfirmPasswordVisibility = () => {
    const input = confirmInputRef.current;
    if (!input) return;

    const start = input.selectionStart;
    const end = input.selectionEnd;
    
    setShowConfirmPassword(!showConfirmPassword);
    
    // Restore cursor position after state update
    requestAnimationFrame(() => {
      if (input) {
        input.setSelectionRange(start, end);
      }
    });
  };

  const getInputClassName = (hasError: boolean) => {
    return cn(
      "pl-10 pr-12",
      hasError && isTouched ? "border-destructive focus-visible:ring-destructive" : "",
      className
    );
  };

  const getConfirmInputClassName = () => {
    const hasError = confirmValidation && !confirmValidation.valid && isConfirmTouched;
    return cn(
      "pl-10 pr-12",
      hasError ? "border-destructive focus-visible:ring-destructive" : ""
    );
  };

  const getStrengthColor = (strength?: string, valid?: boolean) => {
    if (!valid) return 'text-red-600'; // Show red for invalid passwords
    switch (strength) {
      case 'strong': return 'text-green-600';
      case 'okay': return 'text-orange-500';
      case 'weak': return 'text-red-600';
      default: return 'text-muted-foreground';
    }
  };

  const getStrengthLabel = (strength?: string) => {
    switch (strength) {
      case 'strong': return 'Strong';
      case 'okay': return 'Okay';
      case 'weak': return 'Weak';
      default: return '';
    }
  };

  return (
    <div className="space-y-4">
      {/* Main Password Field */}
      <div className="space-y-2">
        <Label htmlFor={id}>{label}</Label>
        <div className="relative">
          <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground z-10" />
          <Input
            ref={inputRef}
            id={id}
            type={showPassword ? "text" : "password"}
            placeholder={placeholder}
            className={getInputClassName(validation && !validation.valid)}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onBlur={() => setIsTouched(true)}
            required={required}
            autoComplete="new-password"
            inputMode="text"
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-1 top-1 h-8 w-8 p-0 hover:bg-transparent"
            onClick={togglePasswordVisibility}
            aria-label={showPassword ? "Hide password" : "Show password"}
            aria-pressed={showPassword}
            tabIndex={0}
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4 text-muted-foreground" />
            ) : (
              <Eye className="h-4 w-4 text-muted-foreground" />
            )}
          </Button>
        </div>

        {/* Password Strength Indicator */}
        {value && validation && (
          <div className="flex items-center gap-2 text-sm">
            <div className="flex items-center gap-1">
              {validation.valid ? (
                <CheckCircle className={`h-4 w-4 ${getStrengthColor(validation.strength, validation.valid)}`} />
              ) : (
                <AlertTriangle className="h-4 w-4 text-red-600" />
              )}
              <span className={getStrengthColor(validation.strength, validation.valid)}>
                Strength: {getStrengthLabel(validation.strength)}
              </span>
            </div>
          </div>
        )}

        {/* Error Messages */}
        {validation && validation.errors.length > 0 && isTouched && (
          <div className="space-y-1">
            {validation.errors.map((error, index) => (
              <div key={index} className="flex items-start gap-2 text-sm text-destructive">
                <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            ))}
          </div>
        )}

        {/* Password Requirements Helper */}
        {!isTouched && !value && (
          <div className="text-xs text-muted-foreground space-y-1">
            <p>💡 Password requirements:</p>
            <ul className="list-disc list-inside ml-4 space-y-0.5">
              <li>At least 8 characters</li>
              <li>Include letters, numbers, and special characters</li>
              <li>No spaces allowed</li>
              <li>Don't use personal information (name, email, birthdate)</li>
            </ul>
          </div>
        )}
      </div>

      {/* Confirm Password Field */}
      {showConfirmation && (
        <div className="space-y-2">
          <Label htmlFor={`${id}-confirm`}>{confirmLabel}</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground z-10" />
            <Input
              ref={confirmInputRef}
              id={`${id}-confirm`}
              type={showConfirmPassword ? "text" : "password"}
              placeholder={confirmPlaceholder}
              className={getConfirmInputClassName()}
              value={confirmValue}
              onChange={(e) => onConfirmChange?.(e.target.value)}
              onBlur={() => setIsConfirmTouched(true)}
              required={required}
              autoComplete="new-password"
              inputMode="text"
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1 h-8 w-8 p-0 hover:bg-transparent"
              onClick={toggleConfirmPasswordVisibility}
              aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
              aria-pressed={showConfirmPassword}
              tabIndex={0}
            >
              {showConfirmPassword ? (
                <EyeOff className="h-4 w-4 text-muted-foreground" />
              ) : (
                <Eye className="h-4 w-4 text-muted-foreground" />
              )}
            </Button>
          </div>

          {/* Confirmation Match Status */}
          {confirmValue && isConfirmTouched && (
            <div className="flex items-center gap-2 text-sm">
              {confirmValidation?.valid ? (
                <div className="flex items-center gap-1 text-green-600">
                  <CheckCircle className="h-4 w-4" />
                  <span>Passwords match</span>
                </div>
              ) : (
                <div className="flex items-start gap-2 text-sm text-destructive">
                  <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span>Passwords don't match</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};