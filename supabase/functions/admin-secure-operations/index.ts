import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get the authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: corsHeaders }
      );
    }

    // Verify the user is authenticated and is admin
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: corsHeaders }
      );
    }

    // Check if user has admin role
    const { data: adminRole } = await supabase
      .from('user_roles')
      .select('role')
      .eq('profile_id', user.id)
      .eq('role', 'admin')
      .single();

    if (!adminRole) {
      return new Response(
        JSON.stringify({ error: 'Admin access required' }),
        { status: 403, headers: corsHeaders }
      );
    }

    const url = new URL(req.url);
    let operation = url.searchParams.get('operation');
    
    // For POST requests, try to get operation from request body if not in URL
    if (!operation && req.method === 'POST') {
      try {
        const bodyText = await req.text();
        const body = JSON.parse(bodyText);
        operation = body.operation;
        // Re-create the request with the body for handlers to read
        req = new Request(req.url, {
          method: req.method,
          headers: req.headers,
          body: bodyText,
        });
      } catch (e) {
        console.error('Error parsing request body:', e);
      }
    }
    
    // Trim operation to remove any whitespace
    operation = operation?.trim();
    
    console.log('Operation received:', operation, 'Method:', req.method);
    
    if (!operation) {
      return new Response(
        JSON.stringify({ error: 'Operation parameter required' }),
        { status: 400, headers: corsHeaders }
      );
    }

    // Log admin operation for security audit
    await supabase
      .from('audit_logs')
      .insert({
        table_name: 'admin_operations',
        operation: operation,
        user_id: user.id,
        new_data: { operation, timestamp: new Date().toISOString() }
      });

    console.log('About to switch on operation:', operation, 'Type:', typeof operation);

    switch (operation) {
      case 'get_students_for_assignment':
        return await handleGetStudentsForAssignment(req, supabaseAdmin);
      
      case 'update_student_assignments':
        return await handleUpdateStudentAssignments(req, supabaseAdmin);
      
      case 'get_users':
        return await handleGetUsers(supabase);
      case 'get_user_details':
        return await handleGetUserDetails(url, supabase);
      case 'update_user':
        return await handleUpdateUser(req, supabase, user.id);
      case 'update_user_roles':
        return await handleUpdateUserRoles(req, supabase, user.id);
      case 'get_cities':
        return await handleGetCities(supabase);
      case 'update_city':
        return await handleUpdateCity(req, supabase);
      case 'create_city':
        return await handleCreateCity(req, supabase);
      case 'delete_city':
        return await handleDeleteCity(req, supabase);
      default:
        return new Response(
          JSON.stringify({ error: 'Unknown operation' }),
          { status: 400, headers: corsHeaders }
        );
    }

  } catch (error) {
    console.error('Admin operation error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: corsHeaders }
    );
  }
});

async function handleUpdateUser(req: Request, supabase: any, adminUserId: string) {
  try {
    const body = await req.json();
    const { userId, updates } = body;

    if (!userId || !updates) {
      return new Response(
        JSON.stringify({ error: 'Invalid request data' }),
        { status: 400, headers: corsHeaders }
      );
    }

    // Update user profile
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error updating user:', error);
      throw error;
    }

    // Log the action
    await supabase.from('audit_logs').insert({
      user_id: adminUserId,
      table_name: 'profiles',
      operation: 'UPDATE',
      new_data: { userId, updates },
    });

    return new Response(
      JSON.stringify({ success: true, user: data }),
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error('Error in handleUpdateUser:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to update user' }),
      { status: 500, headers: corsHeaders }
    );
  }
}

async function handleUpdateUserRoles(req: Request, supabase: any, adminUserId: string) {
  try {
    const { userId, roles } = await req.json();

    if (!userId || !Array.isArray(roles)) {
      return new Response(
        JSON.stringify({ error: 'Invalid request data' }),
        { status: 400, headers: corsHeaders }
      );
    }

    // Delete existing roles
    const { error: deleteError } = await supabase
      .from('user_roles')
      .delete()
      .eq('profile_id', userId);

    if (deleteError) {
      console.error('Error deleting roles:', deleteError);
      throw deleteError;
    }

    // Insert new roles
    if (roles.length > 0) {
      const { error: insertError } = await supabase
        .from('user_roles')
        .insert(roles.map((role: string) => ({ profile_id: userId, role })));

      if (insertError) {
        console.error('Error inserting roles:', insertError);
        throw insertError;
      }
    }

    // Log the action
    await supabase.from('audit_logs').insert({
      user_id: adminUserId,
      table_name: 'user_roles',
      operation: 'UPDATE',
      new_data: { userId, roles },
    });

    return new Response(
      JSON.stringify({ success: true }),
      { headers: corsHeaders }
    );
  } catch (error: any) {
    console.error('Error in handleUpdateUserRoles:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to update roles' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

async function handleGetStudentsForAssignment(req: Request, supabaseAdmin: SupabaseClient) {
  const url = new URL(req.url);
  const userId = url.searchParams.get('user_id');

  if (!userId) {
    return new Response(
      JSON.stringify({ error: 'Missing user_id parameter' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Get all profiles (students)
  const { data: studentsData, error: studentsError } = await supabaseAdmin
    .from('profiles')
    .select('id, full_name, email')
    .order('full_name');

  if (studentsError) {
    console.error('Error fetching students:', studentsError);
    return new Response(
      JSON.stringify({ error: studentsError.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Get currently assigned students for this user
  const { data: assignmentsData, error: assignmentsError } = await supabaseAdmin
    .from('user_student_assignments')
    .select('student_id')
    .eq('user_id', userId);

  if (assignmentsError) {
    console.error('Error fetching assignments:', assignmentsError);
    return new Response(
      JSON.stringify({ error: assignmentsError.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const assignedIds = new Set(assignmentsData?.map(a => a.student_id) || []);
  
  const students = studentsData?.map(student => ({
    ...student,
    assigned: assignedIds.has(student.id)
  })) || [];

  return new Response(
    JSON.stringify({ students }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function handleUpdateStudentAssignments(req: Request, supabaseAdmin: SupabaseClient) {
  const { userId, studentIds } = await req.json();

  if (!userId || !Array.isArray(studentIds)) {
    return new Response(
      JSON.stringify({ error: 'Missing userId or studentIds' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Get current admin user ID
  const authHeader = req.headers.get('Authorization');
  let adminUserId = null;
  if (authHeader) {
    try {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user } } = await supabaseAdmin.auth.getUser(token);
      adminUserId = user?.id;
    } catch (e) {
      console.error('Error getting admin user:', e);
    }
  }

  // Delete all existing assignments for this user
  const { error: deleteError } = await supabaseAdmin
    .from('user_student_assignments')
    .delete()
    .eq('user_id', userId);

  if (deleteError) {
    console.error('Error deleting existing assignments:', deleteError);
    return new Response(
      JSON.stringify({ error: deleteError.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Insert new assignments
  if (studentIds.length > 0) {
    const assignments = studentIds.map(studentId => ({
      user_id: userId,
      student_id: studentId,
      assigned_by: adminUserId,
    }));

    const { error: insertError } = await supabaseAdmin
      .from('user_student_assignments')
      .insert(assignments);

    if (insertError) {
      console.error('Error inserting assignments:', insertError);
      return new Response(
        JSON.stringify({ error: insertError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  }

  return new Response(
    JSON.stringify({ success: true, count: studentIds.length }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function handleGetUserDetails(url: URL, supabase: any) {
  try {
    const userId = url.searchParams.get('user_id');
    
    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'user_id parameter required' }),
        { status: 400, headers: corsHeaders }
      );
    }

    console.log('Fetching detailed user data for:', userId);
    
    // Get profile with full data using service role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (profileError) {
      console.error('Error fetching profile:', profileError);
      throw profileError;
    }

    // Get user roles
    const { data: userRoles, error: rolesError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('profile_id', userId);

    if (rolesError) {
      console.error('Error fetching user roles:', rolesError);
    }

    // Get applications
    const { data: applications, error: appsError } = await supabase
      .from('applications')
      .select(`
        id,
        status,
        submitted_at,
        created_at,
        program_id
      `)
      .eq('profile_id', userId)
      .order('created_at', { ascending: false });

    if (appsError) {
      console.error('Error fetching applications:', appsError);
    }

    // Get program details for applications
    let applicationsWithPrograms = [];
    if (applications && applications.length > 0) {
      const programIds = applications.map((app: any) => app.program_id);
      const { data: programs, error: programsError } = await supabase
        .from('programs')
        .select(`
          id,
          name,
          degree_level,
          institution_id
        `)
        .in('id', programIds);

      if (programsError) {
        console.error('Error fetching programs:', programsError);
      } else {
        const institutionIds = programs.map((p: any) => p.institution_id);
        const { data: institutions } = await supabase
          .from('institutions')
          .select('id, name')
          .in('id', institutionIds);

        applicationsWithPrograms = applications.map((app: any) => {
          const program = programs.find((p: any) => p.id === app.program_id);
          const institution = institutions?.find((i: any) => i.id === program?.institution_id);
          return {
            ...app,
            program: program ? {
              name: program.name,
              degree_level: program.degree_level,
              institution: institution ? { name: institution.name } : null
            } : null
          };
        });
      }
    }

    // Get matches
    const { data: matches, error: matchesError } = await supabase
      .from('matches')
      .select(`
        id,
        compatibility_score,
        created_at,
        program_id
      `)
      .eq('profile_id', userId)
      .order('compatibility_score', { ascending: false })
      .limit(10);

    if (matchesError) {
      console.error('Error fetching matches:', matchesError);
    }

    // Get program details for matches
    let matchesWithPrograms = [];
    if (matches && matches.length > 0) {
      const programIds = matches.map((m: any) => m.program_id);
      const { data: programs, error: programsError } = await supabase
        .from('programs')
        .select(`
          id,
          name,
          institution_id
        `)
        .in('id', programIds);

      if (programsError) {
        console.error('Error fetching programs for matches:', programsError);
      } else {
        const institutionIds = programs.map((p: any) => p.institution_id);
        const { data: institutions } = await supabase
          .from('institutions')
          .select('id, name')
          .in('id', institutionIds);

        matchesWithPrograms = matches.map((match: any) => {
          const program = programs.find((p: any) => p.id === match.program_id);
          const institution = institutions?.find((i: any) => i.id === program?.institution_id);
          return {
            ...match,
            program: program ? {
              name: program.name,
              institution: institution ? { name: institution.name } : null
            } : null
          };
        });
      }
    }

    const user = {
      ...profile,
      user_roles: userRoles || [],
      applications: applicationsWithPrograms,
      matches: matchesWithPrograms
    };

    console.log('Returning detailed user data');

    return new Response(
      JSON.stringify({ user }),
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error('Error in handleGetUserDetails:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to fetch user details' }),
      { status: 500, headers: corsHeaders }
    );
  }
}

async function handleGetUsers(supabase: any) {
  try {
    console.log('Fetching all users with full data for admin...');
    
    // Query profiles table directly with service role to get full, unmasked data
    // Service role bypasses RLS, allowing admin to see all user data
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select(`
        id,
        full_name,
        email,
        phone,
        country_code,
        date_of_birth,
        nationality,
        current_education_level,
        created_at
      `)
      .order('created_at', { ascending: false });

    if (profilesError) {
      console.error('Error fetching profiles:', profilesError);
      throw profilesError;
    }

    console.log(`Fetched ${profiles?.length || 0} profiles`);

    // Get all user roles
    const { data: userRoles, error: rolesError } = await supabase
      .from('user_roles')
      .select('profile_id, role');

    if (rolesError) {
      console.error('Error fetching user roles:', rolesError);
      throw rolesError;
    }

    // Combine profiles with their roles
    const users = profiles?.map((profile: any) => ({
      ...profile,
      user_roles: userRoles
        ?.filter((ur: any) => ur.profile_id === profile.id)
        .map((ur: any) => ({ role: ur.role })) || []
    })) || [];

    console.log(`Returning ${users.length} users with full, unmasked data`);

    return new Response(
      JSON.stringify({ users }),
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error('Error in handleGetUsers:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to fetch users' }),
      { status: 500, headers: corsHeaders }
    );
  }
}

async function handleGetCities(supabase: any) {
  try {
    const { data: cities, error } = await supabase
      .from('cities')
      .select('*')
      .order('name');

    if (error) throw error;

    return new Response(
      JSON.stringify({ cities }),
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error('Error in handleGetCities:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to fetch cities' }),
      { status: 500, headers: corsHeaders }
    );
  }
}

async function handleUpdateCity(req: Request, supabase: any) {
  try {
    const { id, website, ...updateData } = await req.json();
    
    // Handle website separately in metadata
    if (website !== undefined) {
      updateData.metadata = {
        ...updateData.metadata,
        website: website || null
      };
    }
    
    const { data, error } = await supabase
      .from('cities')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return new Response(
      JSON.stringify({ city: data }),
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error('Error in handleUpdateCity:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to update city' }),
      { status: 500, headers: corsHeaders }
    );
  }
}

async function handleCreateCity(req: Request, supabase: any) {
  try {
    const { website, ...cityData } = await req.json();
    
    // Handle website in metadata
    if (website !== undefined) {
      cityData.metadata = {
        ...cityData.metadata,
        website: website || null
      };
    }
    
    const { data, error } = await supabase
      .from('cities')
      .insert(cityData)
      .select()
      .single();

    if (error) throw error;

    return new Response(
      JSON.stringify({ city: data }),
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error('Error in handleCreateCity:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to create city' }),
      { status: 500, headers: corsHeaders }
    );
  }
}

async function handleDeleteCity(req: Request, supabase: any) {
  try {
    const { id } = await req.json();
    
    const { error } = await supabase
      .from('cities')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return new Response(
      JSON.stringify({ success: true }),
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error('Error in handleDeleteCity:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to delete city' }),
      { status: 500, headers: corsHeaders }
    );
  }
}