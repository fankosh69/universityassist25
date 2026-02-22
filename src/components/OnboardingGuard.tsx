import { Navigate } from 'react-router-dom';
import { useOnboardingStatus } from '@/hooks/useOnboardingStatus';
import LoadingSpinner from '@/components/LoadingSpinner';

interface OnboardingGuardProps {
  children: React.ReactNode;
}

export function OnboardingGuard({ children }: OnboardingGuardProps) {
  const { isComplete, isLoading } = useOnboardingStatus();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!isComplete) {
    return <Navigate to="/onboarding" replace />;
  }

  return <>{children}</>;
}
