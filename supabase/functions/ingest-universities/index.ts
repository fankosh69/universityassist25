import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { parse } from "https://deno.land/std@0.224.0/csv/parse.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const BUCKET = Deno.env.get("INGEST_BUCKET") ?? "ingest";
const OBJECT = Deno.env.get("INGEST_OBJECT") ?? "Universities_with_Logos.csv";

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { persistSession: false } });

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type Row = {
  name?: string; city?: string; website?: string;
  lat?: string; lng?: string; logo_url?: string;
  [k: string]: string | undefined;
};

function pick(h: Record<string,string>, keys: string[]) {
  for (const k of keys) {
    if (h[k] && String(h[k]).trim()) return String(h[k]).trim();
  }
  return undefined;
}

function createSlug(text: string): string {
  return text
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[^a-z0-9]+/gi, "-")
    .replace(/(^-|-$)/g, "");
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", { 
      status: 405, 
      headers: corsHeaders 
    });
  }

  try {
    console.log(`Attempting to download CSV from bucket: ${BUCKET}, object: ${OBJECT}`);
    
    // 1) Download CSV from Storage
    const dl = await supabase.storage.from(BUCKET).download(OBJECT);
    if (dl.error) {
      console.error("Storage download error:", dl.error);
      return new Response("Storage download error: " + dl.error.message, { 
        status: 500,
        headers: corsHeaders 
      });
    }
    
    const text = await dl.data.text();
    console.log(`Downloaded CSV, size: ${text.length} characters`);

    // 2) Parse CSV
    const records = [...await parse(text, { skipFirstRow: true, columns: true })] as Row[];
    console.log(`Parsed ${records.length} records from CSV`);
    
    let upsertedCities = 0;
    let upsertedUnis = 0;
    const errors: string[] = [];

    for (let i = 0; i < records.length; i++) {
      const r = records[i];
      
      try {
        const name = pick(r as any, ["name","Name","university","University"]);
        const cityName = pick(r as any, ["city","City","town","Town"]);
        
        if (!name || !cityName) {
          console.log(`Skipping row ${i}: missing name or city`);
          continue;
        }

        const website = pick(r as any, ["website","Website","url","URL"]);
        const logo_url = pick(r as any, ["logo_url","logo","Logo"]);
        const latStr = pick(r as any, ["lat","latitude","Lat","Latitude"]);
        const lngStr = pick(r as any, ["lng","lon","longitude","Lng","Long","Longitude"]);
        const lat = latStr ? Number(latStr) : null;
        const lng = lngStr ? Number(lngStr) : null;

        console.log(`Processing: ${name} in ${cityName}`);

        // 3) Upsert city
        const slugCity = createSlug(cityName);
        const cityRes = await supabase
          .from("cities")
          .upsert({ 
            name: cityName, 
            country_code: "DE", 
            slug: slugCity 
          }, { onConflict: "slug" })
          .select("id")
          .single();
          
        if (cityRes.error) {
          const errorMsg = `City upsert error for ${cityName}: ${cityRes.error.message}`;
          console.error(errorMsg);
          errors.push(errorMsg);
          continue;
        }
        upsertedCities++;

        // 4) Upsert university
        const slugUni = createSlug(name);
        const uniRow: any = {
          name,
          city: cityName,
          city_id: cityRes.data.id,
          slug: slugUni,
          website,
          logo_url
        };
        
        if (typeof lat === "number" && !Number.isNaN(lat) && typeof lng === "number" && !Number.isNaN(lng)) {
          uniRow.lat = lat;
          uniRow.lng = lng;
        }

        const uniRes = await supabase
          .from("universities")
          .upsert(uniRow, { onConflict: "slug" })
          .select("id")
          .single();
          
        if (uniRes.error) {
          const errorMsg = `University upsert error for ${name}: ${uniRes.error.message}`;
          console.error(errorMsg);
          errors.push(errorMsg);
          continue;
        }
        upsertedUnis++;

      } catch (error) {
        const errorMsg = `Error processing row ${i}: ${error.message}`;
        console.error(errorMsg);
        errors.push(errorMsg);
      }
    }

    console.log(`Completed: ${upsertedCities} cities, ${uniUnis} universities`);

    return new Response(JSON.stringify({ 
      success: true,
      upsertedCities, 
      upsertedUnis,
      totalRecords: records.length,
      errors: errors.length > 0 ? errors : undefined
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (error) {
    console.error("Function error:", error);
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});