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
    const operation = url.searchParams.get('operation');
    
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

    switch (operation) {
      case 'get_users':
        return await handleGetUsers(supabase);
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

async function handleGetUsers(supabase: any) {
  try {
    // Get all users through secure function calls only
    const { data: userRoles, error } = await supabase
      .from('user_roles')
      .select('profile_id, role');

    if (error) throw error;

    const users = [];
    const processedIds = new Set();

    for (const userRole of userRoles) {
      if (processedIds.has(userRole.profile_id)) continue;
      
      // Use the secure masked profile data function
      const { data: profileData, error: profileError } = await supabase
        .rpc('get_masked_profile_data', { profile_uuid: userRole.profile_id });

      if (!profileError && profileData && profileData.length > 0) {
        const profile = profileData[0];
        const allRoles = userRoles
          .filter(ur => ur.profile_id === userRole.profile_id)
          .map(ur => ({ role: ur.role }));

        users.push({
          id: profile.id,
          full_name: profile.display_name,
          email: profile.masked_email,
          created_at: profile.created_at,
          nationality: profile.nationality,
          current_education_level: profile.education_level,
          user_roles: allRoles
        });

        processedIds.add(userRole.profile_id);
      }
    }

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
    const { id, ...updateData } = await req.json();
    
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
    const cityData = await req.json();
    
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