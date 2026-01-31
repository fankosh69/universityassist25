import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Clock, ChevronDown, LogIn, Wifi, Mail } from "lucide-react";
import { useState } from "react";

interface RateLimitAlertProps {
  cooldownSeconds: number;
  attemptCount: number;
  onSignInClick: () => void;
}

export const RateLimitAlert = ({ 
  cooldownSeconds, 
  attemptCount,
  onSignInClick 
}: RateLimitAlertProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const formatTime = (seconds: number): string => {
    if (seconds >= 60) {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return secs > 0 ? `${mins}m ${secs}s` : `${mins} minute${mins > 1 ? 's' : ''}`;
    }
    return `${seconds} second${seconds !== 1 ? 's' : ''}`;
  };

  return (
    <Alert className="mb-4 border-primary/20 bg-primary/5">
      <Clock className="h-4 w-4 text-primary" />
      <AlertTitle className="text-sm font-medium">Please wait before trying again</AlertTitle>
      <AlertDescription className="text-sm space-y-3">
        <p>
          We've hit an email safety limit after {attemptCount} attempt{attemptCount !== 1 ? 's' : ''}. 
          Please wait <strong>{formatTime(cooldownSeconds)}</strong> before trying again.
        </p>
        
        <div className="flex flex-wrap gap-2">
          <Button 
            type="button" 
            variant="outline" 
            size="sm"
            onClick={onSignInClick}
            className="gap-1"
          >
            <LogIn className="h-3 w-3" />
            Already have an account? Sign In
          </Button>
        </div>

        <div className="bg-muted/30 rounded p-2 space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Quick workarounds:</p>
          <div className="flex flex-wrap gap-2 text-xs">
            <div className="flex items-center gap-1 text-muted-foreground">
              <Wifi className="h-3 w-3" />
              <span>Switch to mobile data or different Wi-Fi</span>
            </div>
            <div className="flex items-center gap-1 text-muted-foreground">
              <Mail className="h-3 w-3" />
              <span>Check spam for previous emails</span>
            </div>
          </div>
        </div>

        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <CollapsibleTrigger className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
            <ChevronDown className={`h-3 w-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            Why am I seeing this?
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-2 text-xs text-muted-foreground bg-muted/50 p-2 rounded">
            <p className="mb-1">
              To protect against spam and abuse, we limit how many signup emails can be sent in a short period. 
              This limit applies across all users from the same network.
            </p>
            <p className="mb-1">
              <strong>Tips:</strong>
            </p>
            <ul className="list-disc list-inside space-y-0.5">
              <li>Wait the full cooldown period before retrying</li>
              <li>Switch networks (mobile data instead of Wi-Fi)</li>
              <li>Try using a completely different email address</li>
              <li>If you already signed up, use "Sign In" instead</li>
              <li>Check your spam folder for previous confirmation emails</li>
            </ul>
          </CollapsibleContent>
        </Collapsible>
      </AlertDescription>
    </Alert>
  );
};
