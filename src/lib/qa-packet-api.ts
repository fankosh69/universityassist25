import { supabase } from '@/integrations/supabase/client';

export interface QAPacketResponse {
  success: boolean;
  packet?: string;
  summary?: {
    apiKey: string;
    studentAccount: string;
    counselorAccount: string;
    adminAccount: string;
    qaMode: string;
    emailSandbox: string;
    dataCounts: {
      cities: number;
      universities: number;
      programs: number;
    };
  };
  error?: string;
  timestamp: string;
}

export async function getQAPacket(): Promise<QAPacketResponse> {
  try {
    const { data, error } = await supabase.functions.invoke('generate-test-packet');
    
    if (error) {
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
    
    // Ensure API key is properly masked
    const maskedData = {
      ...data,
      packet: data.packet ? maskApiKeyInPacket(data.packet) : undefined
    };
    
    return {
      success: true,
      ...maskedData,
      timestamp: new Date().toISOString()
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to generate QA packet',
      timestamp: new Date().toISOString()
    };
  }
}

function maskApiKeyInPacket(packet: string): string {
  // Replace any full API keys with masked versions
  return packet.replace(/ts_[a-zA-Z0-9]{20,}/g, 'ts_1234567890…');
}

// Create API endpoint handler for /api/qa/packet
export function createQAPacketApiHandler() {
  return async (request: Request): Promise<Response> => {
    // Set CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Cache-Control': 'public, max-age=300'
    };
    
    // Handle preflight request
    if (request.method === 'OPTIONS') {
      return new Response(null, { 
        status: 200, 
        headers: corsHeaders 
      });
    }
    
    // Only allow GET requests
    if (request.method !== 'GET') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }), 
        { 
          status: 405, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
    
    try {
      const packetData = await getQAPacket();
      
      return new Response(
        JSON.stringify(packetData, null, 2),
        {
          status: packetData.success ? 200 : 500,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        }
      );
    } catch (error) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Internal server error',
          timestamp: new Date().toISOString()
        }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        }
      );
    }
  };
}