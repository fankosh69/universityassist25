import { supabase } from "@/integrations/supabase/client";

/**
 * Secure Academic Data API Layer
 * Uses security-hardened functions instead of direct table access
 */

export interface SecureAcademicData {
  profile_id: string;
  curriculum?: string;
  prev_major?: string;
  gpa_raw?: number;
  gpa_scale_max?: number;
  gpa_min_pass?: number;
  gpa_de?: number;
  ects_total?: number;
  target_level?: string;
  target_intake?: string;
  language_certificates?: any[];
  extras?: any;
  created_at: string;
  updated_at: string;
}

export interface AcademicUpdateResult {
  success: boolean;
  message: string;
  fields_updated: number;
  timestamp: string;
}

/**
 * Safely get academic data using enhanced security-hardened function
 */
export const getSecureAcademicData = async (profileId: string): Promise<SecureAcademicData | null> => {
  try {
    const { data, error } = await supabase.rpc('get_secure_academic_data', {
      target_profile_id: profileId
    });

    if (error) {
      console.error('Error fetching secure academic data:', error);
      throw error;
    }

    return (data as unknown as SecureAcademicData) || null;
  } catch (error) {
    console.error('Failed to fetch secure academic data:', error);
    return null;
  }
};

/**
 * Securely update academic data with comprehensive validation
 */
export const secureUpdateAcademicData = async (
  profileId: string, 
  updateData: Record<string, any>
): Promise<AcademicUpdateResult | null> => {
  try {
    const { data, error } = await supabase.rpc('secure_update_academic_data', {
      target_profile_id: profileId,
      update_data: updateData
    });

    if (error) {
      console.error('Error updating academic data securely:', error);
      throw error;
    }

    return data as unknown as AcademicUpdateResult;
  } catch (error) {
    console.error('Failed to update academic data securely:', error);
    return null;
  }
};

/**
 * Get masked academic summary for admin views
 */
export const getMaskedAcademicSummary = async (profileId: string): Promise<any> => {
  try {
    const { data, error } = await supabase.rpc('get_masked_academic_summary', {
      target_profile_id: profileId
    });

    if (error) {
      console.error('Error fetching masked academic summary:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Failed to fetch masked academic summary:', error);
    return null;
  }
};

/**
 * Get current user's academic data (convenience function)
 */
export const getCurrentUserAcademicData = async (): Promise<SecureAcademicData | null> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    return await getSecureAcademicData(user.id);
  } catch (error) {
    console.error('Failed to get current user academic data:', error);
    return null;
  }
};

/**
 * Legacy function for backwards compatibility - now uses secure functions
 * @deprecated Use getSecureAcademicData instead
 */
export const getAcademicData = async (profileId: string) => {
  console.warn('getAcademicData is deprecated. Use getSecureAcademicData instead.');
  return await getSecureAcademicData(profileId);
};

/**
 * Legacy function for backwards compatibility - now uses secure functions  
 * @deprecated Use secureUpdateAcademicData instead
 */
export const updateAcademicData = async (profileId: string, updateData: Record<string, any>) => {
  console.warn('updateAcademicData is deprecated. Use secureUpdateAcademicData instead.');
  return await secureUpdateAcademicData(profileId, updateData);
};

/**
 * Security Guidelines for Academic Data Access
 * 
 * IMPORTANT SECURITY MEASURES:
 * 1. All academic data access goes through secure RPC functions with audit logging
 * 2. Rate limiting prevents abuse (5 updates per minute, 10 accesses per minute)
 * 3. Data validation and sanitization applied automatically
 * 4. No direct table access - always use these API functions
 * 5. All access attempts are logged for security monitoring
 * 6. Only profile owners can access/update their own academic data
 * 
 * ACCESS CONTROL:
 * - Owner: Full access to their own academic data
 * - Admin: Can view masked summaries only
 * - Others: No access permitted
 * 
 * BEST PRACTICES:
 * - Use getCurrentUserAcademicData() for profile pages
 * - Use getMaskedAcademicSummary() for admin views
 * - Always handle errors gracefully
 * - Never cache sensitive academic data in client storage
 * - Validate numeric inputs before submission
 */
export const ACADEMIC_SECURITY_GUIDELINES = {
  RATE_LIMITS: {
    DATA_ACCESS: '10 requests per minute',
    DATA_UPDATE: '5 requests per minute'
  },
  DATA_PROTECTION: {
    VALIDATION: 'Automatic input validation and sanitization',
    AUDIT_LOGGING: 'All access attempts logged',
    ACCESS_CONTROL: 'Owner-only access enforced'
  },
  ALLOWED_FIELDS: [
    'curriculum', 'prev_major', 'gpa_raw', 'gpa_scale_max', 'gpa_min_pass',
    'ects_total', 'target_level', 'target_intake', 'language_certificates', 'extras'
  ]
} as const;