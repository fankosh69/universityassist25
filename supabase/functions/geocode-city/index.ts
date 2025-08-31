import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface MapboxGeocodingResponse {
  features: Array<{
    center: [number, number];
    place_name: string;
    context?: Array<{
      id: string;
      text: string;
    }>;
  }>;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const mapboxServerToken = Deno.env.get('MAPBOX_SERVER_TOKEN');
    
    if (!mapboxServerToken) {
      throw new Error('MAPBOX_SERVER_TOKEN not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const url = new URL(req.url);
    const citySlug = url.searchParams.get('slug');
    const geocodeAll = url.searchParams.get('all') === 'true';

    console.log('Starting geocoding process, slug:', citySlug, 'all:', geocodeAll);

    // Determine which cities to geocode
    let query = supabase
      .from('cities')
      .select('id, name, slug, lat, lng')
      .eq('country_code', 'DE')
      .or('lat.is.null,lng.is.null');

    if (citySlug && !geocodeAll) {
      query = query.eq('slug', citySlug);
    }

    const { data: cities, error: fetchError } = await query;
    
    if (fetchError) {
      console.error('Error fetching cities:', fetchError);
      throw fetchError;
    }

    if (!cities || cities.length === 0) {
      return new Response(JSON.stringify({ message: 'No cities found that need geocoding' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Found ${cities.length} cities to geocode`);

    let updated = 0;
    let skipped = 0;

    for (const city of cities) {
      try {
        // Skip if coordinates already exist and we're not rebuilding all
        if (city.lat && city.lng && !geocodeAll) {
          skipped++;
          continue;
        }

        console.log(`Geocoding ${city.name}...`);

        // Call Mapbox Geocoding API
        const geocodingUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(city.name + ', Germany')}.json?access_token=${mapboxServerToken}&country=DE&types=place&limit=1`;
        
        const geocodingResponse = await fetch(geocodingUrl);
        
        if (!geocodingResponse.ok) {
          console.error(`Mapbox API error for ${city.name}: ${geocodingResponse.status}`);
          skipped++;
          continue;
        }

        const geocodingData: MapboxGeocodingResponse = await geocodingResponse.json();
        
        if (geocodingData.features.length === 0) {
          console.log(`No geocoding results found for ${city.name}`);
          skipped++;
          continue;
        }

        const feature = geocodingData.features[0];
        const [lng, lat] = feature.center;
        
        // Verify this is in Germany by checking context
        const isInGermany = feature.context?.some(ctx => 
          ctx.id.includes('country') && ctx.text.toLowerCase().includes('germany')
        );

        if (!isInGermany) {
          console.log(`Geocoding result for ${city.name} not in Germany, skipping`);
          skipped++;
          continue;
        }

        // Update the city coordinates
        const { error: updateError } = await supabase
          .from('cities')
          .update({ lat, lng })
          .eq('id', city.id);

        if (updateError) {
          console.error(`Error updating coordinates for ${city.name}:`, updateError);
          skipped++;
        } else {
          console.log(`Updated ${city.name} with coordinates: ${lat}, ${lng}`);
          updated++;
        }

        // Rate limiting - wait between requests
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (error) {
        console.error(`Error geocoding ${city.name}:`, error);
        skipped++;
      }
    }

    const summary = { updated, skipped };
    console.log('Geocoding complete:', summary);

    return new Response(JSON.stringify(summary), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in geocode-city function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});