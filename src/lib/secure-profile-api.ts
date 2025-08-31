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
 * Safely get profile data using enhanced security-hardened function
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
 * Get profile summary with automatic data masking based on access level
 */
export const getProfileSummary = async (profileId: string): Promise<any> => {
  try {
    const { data, error } = await supabase.rpc('get_profile_summary', {
      profile_uuid: profileId
    });

    if (error) {
      console.error('Error fetching profile summary:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Failed to fetch profile summary:', error);
    return null;
  }
};

/**
 * Get masked profile data for display purposes
 */
export const getMaskedProfileData = async (profileId?: string): Promise<any[]> => {
  try {
    const { data, error } = await supabase.rpc('get_masked_profile_data', {
      profile_uuid: profileId || null
    });

    if (error) {
      console.error('Error fetching masked profile data:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Failed to fetch masked profile data:', error);
    return [];
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

/**
 * Export user's own profile data (GDPR compliance)
 */
export const exportMyProfileData = async (): Promise<any> => {
  try {
    const { data, error } = await supabase.rpc('export_my_profile_data');

    if (error) {
      console.error('Error exporting profile data:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Failed to export profile data:', error);
    return null;
  }
};

/**
 * Security Guidelines for Profile Data Access
 * 
 * IMPORTANT SECURITY MEASURES:
 * 1. All profile access goes through secure RPC functions with audit logging
 * 2. Rate limiting prevents abuse (10 accesses per minute, 1 export per hour)
 * 3. Data masking automatically applied based on access level
 * 4. No direct table access - always use these API functions
 * 5. All access attempts are logged for security monitoring
 * 
 * ACCESS LEVELS:
 * - Owner: Full access to their own data
 * - Admin: Controlled access with some data masking
 * - Public: Minimal anonymized data only
 * 
 * BEST PRACTICES:
 * - Use getMaskedProfileData() for public displays
 * - Use getProfileSummary() for user interfaces
 * - Use getSecureProfileData() only when full data is needed
 * - Always handle errors gracefully
 * - Never cache sensitive profile data in client storage
 */
export const SECURITY_GUIDELINES = {
  RATE_LIMITS: {
    PROFILE_ACCESS: '10 requests per minute',
    DATA_EXPORT: '1 request per hour'
  },
  DATA_PROTECTION: {
    MASKING: 'Automatic based on access level',
    AUDIT_LOGGING: 'All access attempts logged',
    ENCRYPTION: 'Sensitive data encrypted at rest'
  }
} as const;