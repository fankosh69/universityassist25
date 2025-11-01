import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface ProfileCompletionDetails {
  personalInfo: {
    completed: boolean;
    items: {
      fullName: boolean;
      nationality: boolean;
      dateOfBirth: boolean;
      contact: boolean;
    };
  };
  academicBackground: {
    completed: boolean;
    items: {
      educationLevel: boolean;
      institution: boolean;
      fieldOfStudy: boolean;
      gpa: boolean;
    };
  };
  languageSkills: {
    completed: boolean;
    items: {
      germanCertificate: boolean;
      englishCertificate: boolean;
    };
  };
  preferences: {
    completed: boolean;
    items: {
      degreeType: boolean;
      preferredFields: boolean;
      preferredCities: boolean;
      careerGoals: boolean;
    };
  };
  overallProgress: number;
}

export function useProfileCompletion(userId?: string) {
  const [completion, setCompletion] = useState<ProfileCompletionDetails>({
    personalInfo: {
      completed: false,
      items: {
        fullName: false,
        nationality: false,
        dateOfBirth: false,
        contact: false,
      },
    },
    academicBackground: {
      completed: false,
      items: {
        educationLevel: false,
        institution: false,
        fieldOfStudy: false,
        gpa: false,
      },
    },
    languageSkills: {
      completed: false,
      items: {
        germanCertificate: false,
        englishCertificate: false,
      },
    },
    preferences: {
      completed: false,
      items: {
        degreeType: false,
        preferredFields: false,
        preferredCities: false,
        careerGoals: false,
      },
    },
    overallProgress: 0,
  });

  const [isLoading, setIsLoading] = useState(true);

  const checkCompletion = async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const targetUserId = userId || user?.id;
      
      if (!targetUserId) {
        setIsLoading(false);
        return;
      }

      // Fetch profile data from profiles and student_academics tables
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', targetUserId)
        .single();

      const { data: academics } = await supabase
        .from('student_academics')
        .select('*')
        .eq('profile_id', targetUserId)
        .single();

      // Check personal info
      const personalItems = {
        fullName: !!(profile?.full_name),
        nationality: !!(profile?.nationality),
        dateOfBirth: !!(profile?.date_of_birth),
        contact: !!(profile?.email || profile?.phone),
      };

      // Check academic background
      const academicItems = {
        educationLevel: !!(profile?.current_education_level),
        institution: !!(profile?.current_institution),
        fieldOfStudy: !!(profile?.current_field_of_study),
        gpa: !!(academics?.gpa_raw && academics?.gpa_scale_max),
      };

      // Check language skills - handle both array and JSONB properly
      const languageCerts = Array.isArray(academics?.language_certificates) 
        ? academics.language_certificates 
        : [];
      
      const languageItems = {
        germanCertificate: languageCerts.some((cert: any) => 
          cert?.language?.toLowerCase()?.includes('german') || 
          cert?.language?.toLowerCase()?.includes('deutsch')
        ),
        englishCertificate: languageCerts.some((cert: any) => 
          cert?.language?.toLowerCase()?.includes('english')
        ),
      };

      // Check preferences - handle arrays properly
      const preferredFields = Array.isArray(profile?.preferred_fields) 
        ? profile.preferred_fields 
        : [];
      const preferredCities = Array.isArray(profile?.preferred_cities) 
        ? profile.preferred_cities 
        : [];

      const preferenceItems = {
        degreeType: !!(profile?.preferred_degree_type),
        preferredFields: preferredFields.length > 0,
        preferredCities: preferredCities.length > 0,
        careerGoals: !!(profile?.career_goals),
      };

      // Calculate completion for each category
      const personalCompleted = Object.values(personalItems).filter(Boolean).length >= 3;
      const academicCompleted = Object.values(academicItems).filter(Boolean).length >= 3;
      const languageCompleted = Object.values(languageItems).filter(Boolean).length >= 1;
      const prefsCompleted = Object.values(preferenceItems).filter(Boolean).length >= 2;

      // Calculate overall progress
      const totalItems = 
        Object.keys(personalItems).length +
        Object.keys(academicItems).length +
        Object.keys(languageItems).length +
        Object.keys(preferenceItems).length;
      
      const completedItems = 
        Object.values(personalItems).filter(Boolean).length +
        Object.values(academicItems).filter(Boolean).length +
        Object.values(languageItems).filter(Boolean).length +
        Object.values(preferenceItems).filter(Boolean).length;

      const overallProgress = Math.round((completedItems / totalItems) * 100);

      setCompletion({
        personalInfo: {
          completed: personalCompleted,
          items: personalItems,
        },
        academicBackground: {
          completed: academicCompleted,
          items: academicItems,
        },
        languageSkills: {
          completed: languageCompleted,
          items: languageItems,
        },
        preferences: {
          completed: prefsCompleted,
          items: preferenceItems,
        },
        overallProgress,
      });
    } catch (error) {
      console.error('Error checking profile completion:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkCompletion();

    // Set up real-time subscriptions for profile and academic data
    const setupRealtimeSubscriptions = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const targetUserId = userId || user?.id;

      if (!targetUserId) return;

      // Subscribe to profiles table changes
      const profileChannel = supabase
        .channel(`profile_changes_${targetUserId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'profiles',
            filter: `id=eq.${targetUserId}`
          },
          () => {
            console.log('Profile updated via realtime, refreshing completion...');
            checkCompletion();
          }
        )
        .subscribe();

      // Subscribe to student_academics table changes
      const academicsChannel = supabase
        .channel(`academics_changes_${targetUserId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'student_academics',
            filter: `profile_id=eq.${targetUserId}`
          },
          () => {
            console.log('Academic data updated via realtime, refreshing completion...');
            checkCompletion();
          }
        )
        .subscribe();

      return { profileChannel, academicsChannel };
    };

    let channels: { profileChannel: any; academicsChannel: any } | undefined;

    setupRealtimeSubscriptions().then(result => {
      channels = result;
    });

    return () => {
      if (channels) {
        supabase.removeChannel(channels.profileChannel);
        supabase.removeChannel(channels.academicsChannel);
      }
    };
  }, [userId]);

  return { completion, isLoading, refresh: checkCompletion };
}
