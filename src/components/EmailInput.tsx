import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Mail, AlertTriangle, CheckCircle, Info } from "lucide-react";
import { validateEmailClient, validateEmail, type EmailValidationResult } from "@/lib/email-validation";
import { EmailInstructions } from "@/components/EmailInstructions";

interface EmailInputProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  required?: boolean;
  className?: string;
  id?: string;
}

export function EmailInput({ 
  value, 
  onChange, 
  label = "Email", 
  placeholder = "Enter your email", 
  required = false,
  className = "",
  id = "email"
}: EmailInputProps) {
  const [validation, setValidation] = useState<EmailValidationResult | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null);
  const [showInstructions, setShowInstructions] = useState(false);

  // Client-side validation on input change
  useEffect(() => {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    if (!value) {
      setValidation(null);
      return;
    }

    // Immediate client-side validation
    const clientResult = validateEmailClient(value);
    setValidation(clientResult);

    // Debounce server-side validation
    if (clientResult.valid && clientResult.needsDomainCheck) {
      setDebounceTimer(setTimeout(() => {
        performServerValidation(value);
      }, 400));
    }
  }, [value]);

  const performServerValidation = async (email: string) => {
    setIsValidating(true);
    try {
      const result = await validateEmail(email);
      setValidation(result);
    } catch (error) {
      console.error('Email validation error:', error);
      setValidation({
        valid: true,
        level: 'warn',
        message: 'Could not verify domain - please ensure it\'s correct'
      });
    } finally {
      setIsValidating(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    onChange(suggestion);
  };

  const getDomain = () => {
    if (!value || !value.includes('@')) return null;
    return value.split('@')[1];
  };

  const isSchoolOrCompanyEmail = () => {
    return validation?.level === 'warn' && 
           (validation.message?.includes('school/university') || validation.message?.includes('company'));
  };

  const getInputClassName = () => {
    let baseClass = `pl-10 ${className}`;
    
    if (validation) {
      if (validation.level === 'error') {
        baseClass += ' border-destructive';
      } else if (validation.level === 'warn') {
        baseClass += ' border-yellow-500';
      } else if (validation.level === 'ok') {
        baseClass += ' border-green-500';
      }
    }
    
    return baseClass;
  };

  const getMessageIcon = () => {
    if (!validation) return null;
    
    switch (validation.level) {
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-destructive" />;
      case 'warn':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'ok':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          id={id}
          type="email"
          placeholder={placeholder}
          className={getInputClassName()}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={required}
        />
        {isValidating && (
          <div className="absolute right-3 top-3">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
          </div>
        )}
      </div>
      
      {validation && validation.message && (
        <div 
          className="flex items-start gap-2 text-sm" 
          role="alert"
          aria-live="polite"
        >
          {getMessageIcon()}
          <div className="flex-1">
            <p className={`${
              validation.level === 'error' ? 'text-destructive' :
              validation.level === 'warn' ? 'text-yellow-600' :
              'text-green-600'
            }`}>
              {validation.message}
            </p>
            
            {validation.suggestion && (
              <Button
                type="button"
                variant="link"
                size="sm"
                className="h-auto p-0 text-primary underline"
                onClick={() => handleSuggestionClick(validation.suggestion!)}
              >
                Click to use: {validation.suggestion}
              </Button>
            )}

            {isSchoolOrCompanyEmail() && (
              <Button
                type="button"
                variant="link"
                size="sm"
                className="h-auto p-0 mt-1 text-blue-600 underline flex items-center gap-1"
                onClick={() => setShowInstructions(!showInstructions)}
              >
                <Info className="h-3 w-3" />
                {showInstructions ? 'Hide' : 'Show'} email delivery instructions
              </Button>
            )}
          </div>
        </div>
      )}
      
      {showInstructions && isSchoolOrCompanyEmail() && getDomain() && (
        <div className="mt-2">
          <EmailInstructions 
            domain={getDomain()!} 
            organizationType={validation?.message?.includes('school/university') ? 'school' : 'company'} 
          />
        </div>
      )}
    </div>
  );
}