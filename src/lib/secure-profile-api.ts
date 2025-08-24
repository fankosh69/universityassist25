import { supabase } from "@/integrations/supabase/client";

/**
 * Secure Profile API Layer
 * Uses security-hardened functions instead of direct table access
 */

export interface SecureProfileData {
  id: string;
  full_name?: string;
  email?: string;
  phone?: string;
  date_of_birth?: string;
  nationality?: string;
  gender?: string;
  current_institution?: string;
  current_field_of_study?: string;
  current_education_level?: string;
  current_gpa?: number;
  credits_taken?: number;
  thesis_topic?: string;
  language_certificates?: string[];
  preferred_fields?: string[];
  preferred_degree_type?: string;
  preferred_cities?: string[];
  career_goals?: string;
  created_at: string;
  updated_at: string;
}

export interface ProfileUpdateResult {
  success: boolean;
  message: string;
  fields_updated: number;
  access_level: string;
  timestamp: string;
}

export interface AccessRights {
  access_allowed: boolean;
  access_level: 'owner' | 'admin' | 'none';
  is_owner: boolean;
  is_admin: boolean;
  user_id: string;
  reason?: string;
}

/**
 * Safely get profile data using security-hardened function
 */
export const getSecureProfileData = async (profileId: string): Promise<SecureProfileData | null> => {
  try {
    const { data, error } = await supabase.rpc('get_safe_profile_data', {
      profile_uuid: profileId
    });

    if (error) {
      console.error('Error fetching secure profile data:', error);
      throw error;
    }

    return data?.[0] || null;
  } catch (error) {
    console.error('Failed to fetch secure profile data:', error);
    return null;
  }
};

/**
 * Check what access rights a user has to a profile
 */
export const checkProfileAccessRights = async (profileId: string): Promise<AccessRights | null> => {
  try {
    const { data, error } = await supabase.rpc('check_profile_access_rights', {
      profile_uuid: profileId
    });

    if (error) {
      console.error('Error checking profile access rights:', error);
      throw error;
    }

    return data as unknown as AccessRights;
  } catch (error) {
    console.error('Failed to check profile access rights:', error);
    return null;
  }
};

/**
 * Securely update profile data with comprehensive validation
 */
export const secureUpdateProfile = async (
  profileId: string, 
  updateData: Record<string, any>
): Promise<ProfileUpdateResult | null> => {
  try {
    const { data, error } = await supabase.rpc('ultra_secure_profile_update', {
      target_profile_id: profileId,
      update_data: updateData
    });

    if (error) {
      console.error('Error updating profile securely:', error);
      throw error;
    }

    return data as unknown as ProfileUpdateResult;
  } catch (error) {
    console.error('Failed to update profile securely:', error);
    return null;
  }
};

/**
 * Get current user's profile data (convenience function)
 */
export const getCurrentUserProfile = async (): Promise<SecureProfileData | null> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    return await getSecureProfileData(user.id);
  } catch (error) {
    console.error('Failed to get current user profile:', error);
    return null;
  }
};

/**
 * Legacy function for backwards compatibility - now uses secure functions
 * @deprecated Use getSecureProfileData instead
 */
export const getProfileData = async (profileId: string) => {
  console.warn('getProfileData is deprecated. Use getSecureProfileData instead.');
  return await getSecureProfileData(profileId);
};

/**
 * Legacy function for backwards compatibility - now uses secure functions  
 * @deprecated Use secureUpdateProfile instead
 */
export const updateProfileData = async (profileId: string, updateData: Record<string, any>) => {
  console.warn('updateProfileData is deprecated. Use secureUpdateProfile instead.');
  return await secureUpdateProfile(profileId, updateData);
};