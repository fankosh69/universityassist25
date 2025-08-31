import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.55.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase admin client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get QA user credentials from secrets
    const qaUsers = [
      {
        email: Deno.env.get('TESTSPRITE_STUDENT_EMAIL')!,
        password: Deno.env.get('TESTSPRITE_STUDENT_PASSWORD')!,
        role: 'student',
        fullName: 'QA Student User'
      },
      {
        email: Deno.env.get('TESTSPRITE_COUNSELOR_EMAIL')!,
        password: Deno.env.get('TESTSPRITE_COUNSELOR_PASSWORD')!,
        role: 'school_counselor',
        fullName: 'QA Counselor User'
      },
      {
        email: Deno.env.get('TESTSPRITE_ADMIN_EMAIL')!,
        password: Deno.env.get('TESTSPRITE_ADMIN_PASSWORD')!,
        role: 'admin',
        fullName: 'QA Admin User'
      }
    ];

    const results = [];

    for (const user of qaUsers) {
      console.log(`Processing QA user: ${user.email}`);
      
      // Check if user already exists
      const { data: existingUsers } = await supabase.auth.admin.listUsers();
      const existingUser = existingUsers?.users?.find(u => u.email === user.email);
      
      let userId: string;
      
      if (existingUser) {
        console.log(`User ${user.email} already exists`);
        userId = existingUser.id;
        results.push({
          email: user.email,
          action: 'existing',
          userId: userId
        });
      } else {
        // Create new user
        console.log(`Creating user ${user.email}`);
        const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
          email: user.email,
          password: user.password,
          email_confirm: true, // Auto-confirm email for QA users
          user_metadata: {
            full_name: user.fullName,
            qa_user: true
          }
        });

        if (createError) {
          console.error(`Error creating user ${user.email}:`, createError);
          results.push({
            email: user.email,
            action: 'error',
            error: createError.message
          });
          continue;
        }

        userId = newUser.user!.id;
        results.push({
          email: user.email,
          action: 'created',
          userId: userId
        });
      }

      // Ensure profile exists
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: userId,
          email: user.email,
          full_name: user.fullName
        }, {
          onConflict: 'id'
        });

      if (profileError) {
        console.error(`Error creating profile for ${user.email}:`, profileError);
      }

      // Assign role
      const { error: roleError } = await supabase
        .from('user_roles')
        .upsert({
          profile_id: userId,
          role: user.role
        }, {
          onConflict: 'profile_id'
        });

      if (roleError) {
        console.error(`Error assigning role to ${user.email}:`, roleError);
        results[results.length - 1].roleError = roleError.message;
      } else {
        results[results.length - 1].role = user.role;
        console.log(`Assigned role ${user.role} to ${user.email}`);
      }
    }

    // Verify setup by checking roles
    const { data: roleCheck } = await supabase.rpc('check_qa_users_setup');
    
    return new Response(JSON.stringify({
      success: true,
      message: 'QA users setup completed',
      results: results,
      verification: roleCheck
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });

  } catch (error) {
    console.error('Error in setup-qa-users function:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });
  }
});