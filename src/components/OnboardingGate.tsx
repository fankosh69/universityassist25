import { useOnboardingStatus } from '@/hooks/useOnboardingStatus';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Lock, UserCheck } from 'lucide-react';
import { Link } from 'react-router-dom';

interface OnboardingGateProps {
  children: React.ReactNode;
  feature?: string;
  className?: string;
}

export function OnboardingGate({ children, feature = 'this feature', className }: OnboardingGateProps) {
  const { isComplete, isLoading, isLoggedIn } = useOnboardingStatus();

  if (isLoading) {
    return <>{children}</>;
  }

  if (isComplete) {
    return <>{children}</>;
  }

  return (
    <Card className={`border-dashed border-2 border-muted ${className ?? ''}`}>
      <CardHeader className="text-center pb-2">
        <div className="mx-auto mb-3 h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
          <Lock className="h-6 w-6 text-primary" />
        </div>
        <CardTitle className="text-lg">Complete Your Profile</CardTitle>
      </CardHeader>
      <CardContent className="text-center space-y-3">
        <p className="text-sm text-muted-foreground">
          Complete your profile to unlock {feature} and get personalized recommendations.
        </p>
        <Button asChild variant="default" size="sm">
          <Link to={isLoggedIn ? '/onboarding' : '/auth'}>
            <UserCheck className="h-4 w-4 mr-2" />
            {isLoggedIn ? 'Complete Profile' : 'Sign Up to Get Started'}
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
