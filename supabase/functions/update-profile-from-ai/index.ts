import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.55.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Dedicated edge function for AI to update user profile and academic data
 * Provides granular field mapping and validation
 */
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const authHeader = req.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    const supabaseAdmin = createClient(supabaseUrl, supabaseKey);
    const supabaseClient = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: `Bearer ${token}` } }
    });

    // Verify user authentication
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    const { profileData, academicData } = await req.json();
    
    console.log('Update profile request:', { 
      userId: user.id, 
      hasProfileData: !!profileData,
      hasAcademicData: !!academicData 
    });

    const results = {
      success: true,
      updates: [] as string[],
      errors: [] as string[]
    };

    // Update profile data (public and private fields)
    if (profileData && Object.keys(profileData).length > 0) {
      try {
        const publicData: Record<string, any> = {};
        const privateData: Record<string, any> = {};
        const academicPrefs: Record<string, any> = {};

        // Map profile fields to appropriate tables
        if (profileData.full_name) privateData.full_name = profileData.full_name;
        if (profileData.nationality) privateData.nationality = profileData.nationality;
        if (profileData.date_of_birth) privateData.date_of_birth = profileData.date_of_birth;
        if (profileData.phone) privateData.phone = profileData.phone;
        if (profileData.gender) privateData.gender = profileData.gender;
        
        if (profileData.current_education_level) publicData.education_level = profileData.current_education_level;
        if (profileData.current_field_of_study) publicData.field_of_study = profileData.current_field_of_study;
        if (profileData.current_institution) publicData.institution_name = profileData.current_institution;
        
        if (profileData.preferred_fields) academicPrefs.preferred_fields = profileData.preferred_fields;
        if (profileData.preferred_degree_type) academicPrefs.preferred_degree_type = profileData.preferred_degree_type;
        if (profileData.preferred_cities) academicPrefs.preferred_cities = profileData.preferred_cities;
        if (profileData.career_goals) academicPrefs.career_goals = profileData.career_goals;

        // Use secure profile update function
        const { data: updateResult, error: profileError } = await supabaseAdmin.rpc(
          'secure_update_separated_profile',
          {
            profile_uuid: user.id,
            public_data: Object.keys(publicData).length > 0 ? publicData : null,
            private_data: Object.keys(privateData).length > 0 ? privateData : null,
            academic_data: Object.keys(academicPrefs).length > 0 ? academicPrefs : null
          }
        );

        if (profileError) {
          console.error('Profile update error:', profileError);
          results.errors.push(`Profile update failed: ${profileError.message}`);
        } else {
          const fieldCount = Object.keys(publicData).length + 
                           Object.keys(privateData).length + 
                           Object.keys(academicPrefs).length;
          results.updates.push(`Updated ${fieldCount} profile fields`);
        }
      } catch (error: any) {
        console.error('Profile update exception:', error);
        results.errors.push(`Profile update exception: ${error.message}`);
      }
    }

    // Update academic data
    if (academicData && Object.keys(academicData).length > 0) {
      try {
        const { data: updateResult, error: academicError } = await supabaseAdmin.rpc(
          'secure_update_academic_data',
          {
            target_profile_id: user.id,
            update_data: academicData
          }
        );

        if (academicError) {
          console.error('Academic update error:', academicError);
          results.errors.push(`Academic update failed: ${academicError.message}`);
        } else {
          const fieldCount = Object.keys(academicData).length;
          results.updates.push(`Updated ${fieldCount} academic fields`);
        }
      } catch (error: any) {
        console.error('Academic update exception:', error);
        results.errors.push(`Academic update exception: ${error.message}`);
      }
    }

    // If we had any errors, mark as partial success
    if (results.errors.length > 0) {
      results.success = results.updates.length > 0;
    }

    return new Response(
      JSON.stringify(results),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Update profile from AI error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        updates: [],
        errors: [error.message]
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
