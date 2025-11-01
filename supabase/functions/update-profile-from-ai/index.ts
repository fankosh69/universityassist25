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
      hasAcademicData: !!academicData,
      profileFields: profileData ? Object.keys(profileData) : [],
      academicFields: academicData ? Object.keys(academicData) : []
    });

    const results = {
      success: true,
      updates: [] as string[],
      errors: [] as string[]
    };

    // Update profile data directly to profiles table
    if (profileData && Object.keys(profileData).length > 0) {
      try {
        const updateFields: Record<string, any> = {};
        
        // Map all profile fields directly to profiles table
        if (profileData.full_name) updateFields.full_name = profileData.full_name;
        if (profileData.nationality) updateFields.nationality = profileData.nationality;
        if (profileData.phone) updateFields.phone = profileData.phone;
        if (profileData.gender) updateFields.gender = profileData.gender;
        if (profileData.date_of_birth) updateFields.date_of_birth = profileData.date_of_birth;
        if (profileData.country_code) updateFields.country_code = profileData.country_code;
        if (profileData.current_education_level) updateFields.current_education_level = profileData.current_education_level;
        if (profileData.current_field_of_study) updateFields.current_field_of_study = profileData.current_field_of_study;
        if (profileData.current_institution) updateFields.current_institution = profileData.current_institution;
        if (profileData.preferred_fields) updateFields.preferred_fields = profileData.preferred_fields;
        if (profileData.preferred_degree_type) updateFields.preferred_degree_type = profileData.preferred_degree_type;
        if (profileData.preferred_cities) updateFields.preferred_cities = profileData.preferred_cities;
        if (profileData.career_goals) updateFields.career_goals = profileData.career_goals;
        if (profileData.language_certificates) updateFields.language_certificates = profileData.language_certificates;
        
        updateFields.updated_at = new Date().toISOString();

        // Direct update to profiles table
        const { error: profileError } = await supabaseClient
          .from('profiles')
          .update(updateFields)
          .eq('id', user.id);

        if (profileError) {
          console.error('Profile update error:', profileError);
          results.errors.push(`Profile update failed: ${profileError.message}`);
        } else {
          const fieldCount = Object.keys(updateFields).length;
          console.log('✓ Profile updated successfully:', Object.keys(updateFields));
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
        const { data: updateResult, error: academicError } = await supabaseClient.rpc(
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
          console.log('✓ Academic data updated successfully:', { 
            fields: Object.keys(academicData) 
          });
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
