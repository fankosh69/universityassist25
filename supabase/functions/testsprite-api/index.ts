import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TestSpriteRequest {
  action: 'list' | 'create' | 'run' | 'delete' | 'results';
  testId?: string;
  testData?: {
    name: string;
    description?: string;
    url: string;
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get user from JWT
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    // Check if user is admin
    const { data: roleData, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('profile_id', user.id)
      .eq('role', 'admin')
      .single();

    if (roleError || !roleData) {
      throw new Error('Admin access required');
    }

    const request: TestSpriteRequest = await req.json();
    const testSpriteApiKey = Deno.env.get('TESTSPRITE_API_KEY');
    
    if (!testSpriteApiKey) {
      throw new Error('TestSprite API key not configured');
    }

    const baseUrl = 'https://api.testsprite.com';
    
    let response;
    switch (request.action) {
      case 'list':
        response = await fetch(`${baseUrl}/api/v1/tests`, {
          headers: {
            'Authorization': `Bearer ${testSpriteApiKey}`,
            'Content-Type': 'application/json',
          },
        });
        break;
        
      case 'create':
        if (!request.testData) {
          throw new Error('Test data required for creation');
        }
        
        response = await fetch(`${baseUrl}/api/v1/tests`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${testSpriteApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(request.testData),
        });
        
        if (response.ok) {
          const testResult = await response.json();
          // Store in our database
          await supabase.from('testsprite_tests').insert({
            testsprite_id: testResult.id,
            name: request.testData.name,
            description: request.testData.description,
            url: request.testData.url,
            status: testResult.status || 'pending',
          });
        }
        break;
        
      case 'run':
        if (!request.testId) {
          throw new Error('Test ID required');
        }
        
        response = await fetch(`${baseUrl}/api/v1/tests/${request.testId}/run`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${testSpriteApiKey}`,
            'Content-Type': 'application/json',
          },
        });
        
        if (response.ok) {
          const result = await response.json();
          // Update local record
          await supabase
            .from('testsprite_tests')
            .update({
              status: result.status,
              last_run: new Date().toISOString(),
              duration: result.duration,
            })
            .eq('testsprite_id', request.testId);
        }
        break;
        
      case 'delete':
        if (!request.testId) {
          throw new Error('Test ID required');
        }
        
        response = await fetch(`${baseUrl}/api/v1/tests/${request.testId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${testSpriteApiKey}`,
          },
        });
        
        if (response.ok) {
          // Remove from our database
          await supabase
            .from('testsprite_tests')
            .delete()
            .eq('testsprite_id', request.testId);
        }
        break;
        
      case 'results':
        if (!request.testId) {
          throw new Error('Test ID required');
        }
        
        response = await fetch(`${baseUrl}/api/v1/tests/${request.testId}/results`, {
          headers: {
            'Authorization': `Bearer ${testSpriteApiKey}`,
            'Content-Type': 'application/json',
          },
        });
        break;
        
      default:
        throw new Error('Invalid action');
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`TestSprite API error: ${response.status} ${errorText}`);
      throw new Error(`TestSprite API error: ${response.status}`);
    }

    const data = await response.json();
    
    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
    
  } catch (error) {
    console.error('Error in testsprite-api function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});