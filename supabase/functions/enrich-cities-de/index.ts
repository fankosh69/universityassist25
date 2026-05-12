import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WikidataResult {
  item: { value: string };
  itemLabel: { value: string };
  qid: { value: string };
  stateLabel?: { value: string };
  population?: { value: string };
  date?: { value: string };
}

interface WikidataResponse {
  results: {
    bindings: WikidataResult[];
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Require authenticated admin caller — this function uses service role and
    // calls expensive external APIs, so it must not be open to the internet.
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const token = authHeader.replace('Bearer ', '');
    const { data: userData, error: userErr } = await supabase.auth.getUser(token);
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const { data: roles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('profile_id', userData.user.id)
      .eq('role', 'admin');
    if (!roles || roles.length === 0) {
      return new Response(JSON.stringify({ error: 'Forbidden: admin only' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const rebuildAll = Deno.env.get('REBUILD_ALL') === 'true';
    console.log('Starting city enrichment process, rebuild_all:', rebuildAll);

    // Fetch German cities that need enrichment
    let query = supabase
      .from('cities')
      .select('id, name, lat, lng, population_total, region, wikidata_qid')
      .eq('country_code', 'DE');

    if (!rebuildAll) {
      query = query.or('population_total.is.null,region.is.null');
    }

    const { data: cities, error: fetchError } = await query;
    
    if (fetchError) {
      console.error('Error fetching cities:', fetchError);
      throw fetchError;
    }

    console.log(`Found ${cities?.length || 0} cities to process`);

    let updated = 0;
    let skipped = 0;

    // Process cities in batches of 50
    const batchSize = 50;
    for (let i = 0; i < (cities?.length || 0); i += batchSize) {
      const batch = cities!.slice(i, i + batchSize);
      
      // Build SPARQL query for this batch
      const nameValues = batch
        .map(city => `"${city.name}"@de "${city.name}"@en`)
        .join(' ');

      const sparqlQuery = `
        SELECT ?item ?itemLabel ?qid ?stateLabel ?population ?date WHERE {
          VALUES ?name { ${nameValues} }
          ?item rdfs:label ?name ;
                wdt:P17 wd:Q183 .
          BIND(STRAFTER(STR(?item), "entity/") AS ?qid)
          OPTIONAL { ?item wdt:P131 ?state . }
          OPTIONAL {
            ?item p:P1082 ?popStmt .
            ?popStmt ps:P1082 ?population .
            OPTIONAL { ?popStmt pq:P585 ?date . }
          }
          SERVICE wikibase:label { bd:serviceParam wikibase:language "de,en". }
        }
      `;

      try {
        console.log(`Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil((cities?.length || 0)/batchSize)}`);
        
        const wikidataResponse = await fetch('https://query.wikidata.org/sparql', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'User-Agent': 'UniversityAssist/1.0 (https://universityassist.net/)',
          },
          body: `query=${encodeURIComponent(sparqlQuery)}`,
        });

        if (!wikidataResponse.ok) {
          console.error(`Wikidata API error: ${wikidataResponse.status}`);
          await new Promise(resolve => setTimeout(resolve, 2000)); // Rate limit backoff
          continue;
        }

        const wikidataData: WikidataResponse = await wikidataResponse.json();
        
        // Process results for each city in the batch
        for (const city of batch) {
          const cityResults = wikidataData.results.bindings.filter(result => 
            result.itemLabel.value.toLowerCase() === city.name.toLowerCase()
          );

          if (cityResults.length === 0) {
            console.log(`No Wikidata results found for ${city.name}`);
            skipped++;
            continue;
          }

          // Find the result with the most recent population data
          const bestResult = cityResults.reduce((best, current) => {
            if (!best.population && current.population) return current;
            if (!current.population) return best;
            
            const bestDate = best.date ? new Date(best.date.value) : new Date('1900-01-01');
            const currentDate = current.date ? new Date(current.date.value) : new Date('1900-01-01');
            
            return currentDate > bestDate ? current : best;
          });

          // Update the city with enriched data
          const updateData: any = {
            wikidata_qid: bestResult.qid.value,
          };

          if (bestResult.stateLabel?.value) {
            updateData.region = bestResult.stateLabel.value;
          }

          if (bestResult.population?.value) {
            updateData.population_total = parseInt(bestResult.population.value);
            
            if (bestResult.date?.value) {
              updateData.population_asof = new Date(bestResult.date.value).toISOString().split('T')[0];
            }
          }

          const { error: updateError } = await supabase
            .from('cities')
            .update(updateData)
            .eq('id', city.id);

          if (updateError) {
            console.error(`Error updating city ${city.name}:`, updateError);
            skipped++;
          } else {
            console.log(`Updated ${city.name} with population: ${updateData.population_total}, region: ${updateData.region}`);
            updated++;
          }
        }

        // Rate limiting - wait between batches
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (error) {
        console.error(`Error processing batch:`, error);
        skipped += batch.length;
      }
    }

    const summary = { updated, skipped };
    console.log('Enrichment complete:', summary);

    return new Response(JSON.stringify(summary), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in enrich-cities-de function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});