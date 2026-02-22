import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface OnboardingStatus {
  isComplete: boolean;
  isLoading: boolean;
  isLoggedIn: boolean;
}

export function useOnboardingStatus(): OnboardingStatus {
  const [status, setStatus] = useState<OnboardingStatus>({
    isComplete: false,
    isLoading: true,
    isLoggedIn: false,
  });

  useEffect(() => {
    let cancelled = false;

    async function check() {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        if (!cancelled) {
          setStatus({ isComplete: false, isLoading: false, isLoggedIn: false });
        }
        return;
      }

      const { data } = await supabase
        .from('student_academics')
        .select('curriculum, target_level')
        .eq('profile_id', user.id)
        .maybeSingle();

      if (!cancelled) {
        const isComplete = !!(data?.curriculum && data?.target_level);
        setStatus({ isComplete, isLoading: false, isLoggedIn: true });
      }
    }

    check();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      check();
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  return status;
}
