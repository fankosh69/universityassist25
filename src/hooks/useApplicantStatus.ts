import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface ApplicantStatus {
  isApplicant: boolean;
  isLoading: boolean;
  leadStatus: string | null;
}

export function useApplicantStatus(userId: string | null): ApplicantStatus {
  const [isApplicant, setIsApplicant] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [leadStatus, setLeadStatus] = useState<string | null>(null);

  useEffect(() => {
    async function checkApplicantStatus() {
      if (!userId) {
        setIsLoading(false);
        return;
      }

      try {
        // Check if user has a sales lead with "Won (Applicant)" status
        const { data, error } = await supabase
          .from('sales_leads')
          .select(`
            current_stage_id,
            sales_pipeline_stages!inner(name)
          `)
          .eq('profile_id', userId)
          .maybeSingle();

        if (error) {
          console.error('Error checking applicant status:', error);
          setIsLoading(false);
          return;
        }

        if (data) {
          const stageName = (data.sales_pipeline_stages as any)?.name || '';
          setLeadStatus(stageName);
          // User is an applicant if their stage is "Won (Applicant)" or similar
          setIsApplicant(
            stageName.toLowerCase().includes('applicant') ||
            stageName.toLowerCase().includes('won')
          );
        }
      } catch (err) {
        console.error('Error in applicant status check:', err);
      } finally {
        setIsLoading(false);
      }
    }

    checkApplicantStatus();
  }, [userId]);

  return { isApplicant, isLoading, leadStatus };
}
