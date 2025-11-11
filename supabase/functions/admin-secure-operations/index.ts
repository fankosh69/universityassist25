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