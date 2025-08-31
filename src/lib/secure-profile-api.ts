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
 * Safely get profile data using security-hardened function with separated data structure
 */
export const getSecureProfileData = async (profileId: string): Promise<SecureProfileData | null> => {
  try {
    const { data, error } = await supabase.rpc('get_secure_complete_profile', {
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
 * Securely update profile data with enhanced data separation and validation
 */
export const secureUpdateProfile = async (
  profileId: string, 
  updateData: Record<string, any>
): Promise<ProfileUpdateResult | null> => {
  try {
    // Categorize update data into public, private, and academic data
    const publicFields = ['display_name', 'education_level', 'field_of_study', 'institution_name', 'bio'];
    const privateFields = ['full_name', 'email', 'phone', 'nationality', 'gender', 'date_of_birth'];
    const academicFields = ['preferred_fields', 'preferred_degree_type', 'preferred_cities', 'career_goals'];
    
    const publicData: Record<string, any> = {};
    const privateData: Record<string, any> = {};
    const academicData: Record<string, any> = {};
    
    // Categorize the update data based on field type
    Object.entries(updateData).forEach(([key, value]) => {
      if (publicFields.includes(key)) {
        publicData[key] = value;
      } else if (privateFields.includes(key)) {
        privateData[key] = value;
      } else if (academicFields.includes(key)) {
        academicData[key] = value;
      }
      // Legacy fields mapping for backward compatibility
      else if (key === 'current_education_level') {
        publicData['education_level'] = value;
      } else if (key === 'current_field_of_study') {
        publicData['field_of_study'] = value;
      } else if (key === 'current_institution') {
        publicData['institution_name'] = value;
      }
    });

    const { data, error } = await supabase.rpc('secure_update_separated_profile', {
      profile_uuid: profileId,
      public_data: Object.keys(publicData).length > 0 ? publicData : null,
      private_data: Object.keys(privateData).length > 0 ? privateData : null,
      academic_data: Object.keys(academicData).length > 0 ? academicData : null
    });

    if (error) {
      console.error('Error updating profile with enhanced security:', error);
      throw error;
    }

    return {
      success: (data as any)?.success || false,
      message: (data as any)?.message || 'Profile updated with enhanced security',
      fields_updated: Object.keys(updateData).length,
      access_level: 'owner',
      timestamp: (data as any)?.timestamp || new Date().toISOString()
    };
  } catch (error) {
    console.error('Failed to update profile with enhanced security:', error);
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