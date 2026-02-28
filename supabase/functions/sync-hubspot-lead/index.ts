import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const HUBSPOT_API_BASE = "https://api.hubapi.com";

interface LeadData {
  sync_type?: "signup" | "onboarding_complete" | "eligibility_check";
  eligibility_status?: string;
  curriculum_details?: string;
  platform_user_id?: string;
  email: string;
  full_name: string;
  phone?: string;
  gender?: string;
  date_of_birth?: string;
  country_code?: string;
  is_underage?: boolean;
  parent_email?: string;
  parent_consent_given?: boolean;
  nationality?: string;
  country_of_residence?: string;
  curriculum?: string;
  desired_education_level?: string;
  desired_major?: string;
  school_name?: string;
  blocked_bank_account_aware?: string;
  gpa_raw?: number;
  gpa_scale?: number;
  gpa_min_pass?: number;
  german_gpa?: number;
  total_ects?: number;
  // New language fields
  intended_study_language?: string;
  english_level?: string;
  has_english_test?: string;
  english_test_type?: string;
  english_test_score?: string;
  studied_fully_in_english?: string;
  planned_english_test_month?: string;
  german_knowledge?: string;
  has_german_cert?: string;
  german_cert_type?: string;
  german_cert_level?: string;
  planned_german_test_month?: string;
  // Legacy
  languages?: Array<{
    language: string;
    cefr_level?: string;
    test_type?: string;
    test_score?: string;
  }>;
  preferred_fields?: string[];
  preferred_cities?: string[];
  career_goals?: string;
  xp_points?: number;
  profile_completion_pct?: number;
}

// --- HubSpot API helpers ---

async function hubspotRequest(
  token: string,
  method: string,
  path: string,
  body?: Record<string, any>
): Promise<{ ok: boolean; status: number; data: any }> {
  const res = await fetch(`${HUBSPOT_API_BASE}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data };
}

async function searchContactByEmail(token: string, email: string) {
  const res = await hubspotRequest(token, "POST", "/crm/v3/objects/contacts/search", {
    filterGroups: [{
      filters: [{ propertyName: "email", operator: "EQ", value: email }],
    }],
  });
  if (res.ok && res.data.total > 0) {
    return res.data.results[0]; // { id, properties }
  }
  return null;
}

async function createOrUpdateContact(
  token: string,
  email: string,
  properties: Record<string, any>
): Promise<{ ok: boolean; contactId?: string; error?: string }> {
  // Search for existing contact
  const existing = await searchContactByEmail(token, email);

  if (existing) {
    // Update
    const res = await hubspotRequest(
      token, "PATCH",
      `/crm/v3/objects/contacts/${existing.id}`,
      { properties }
    );
    if (res.ok) {
      return { ok: true, contactId: existing.id };
    }
    return { ok: false, error: `Update failed: ${res.status} ${JSON.stringify(res.data)}` };
  } else {
    // Create
    const res = await hubspotRequest(
      token, "POST",
      "/crm/v3/objects/contacts",
      { properties: { ...properties, email } }
    );
    if (res.ok) {
      return { ok: true, contactId: res.data.id };
    }
    return { ok: false, error: `Create failed: ${res.status} ${JSON.stringify(res.data)}` };
  }
}

// --- Build HubSpot properties from lead data ---

function buildSignupProperties(lead: LeadData): Record<string, string> {
  const props: Record<string, string> = {
    firstname: lead.full_name?.split(" ")[0] || "",
    lastname: lead.full_name?.split(" ").slice(1).join(" ") || "",
    platform_user_id: lead.platform_user_id || "",
    phone: lead.country_code && lead.phone
      ? `${lead.country_code}${lead.phone}`
      : lead.phone || "",
    gender: lead.gender || "",
    date_of_birth: lead.date_of_birth || "",
    lead_source: "Platform Signup",
    is_minor: String(lead.is_underage || false),
    parent_email: lead.parent_email || "",
    parent_consent_given: String(lead.parent_consent_given || false),
  };
  return props;
}

function buildOnboardingProperties(lead: LeadData): Record<string, string> {
  // Support both new individual fields and legacy array format
  const englishLang = lead.languages?.find(l => l.language.toLowerCase() === "english");
  const germanLang = lead.languages?.find(l => l.language.toLowerCase() === "german");

  const engCefrMap: Record<string, string> = { beginner: 'A1', intermediate: 'B1', advanced: 'B2', fluent: 'C2' };

  const educationLevelMap: Record<string, string> = {
    foundation_year: "Foundation Course",
    bachelors: "Bachelor Degree",
    masters: "Master's Degree",
  };

  const props: Record<string, string> = {
    firstname: lead.full_name?.split(" ")[0] || "",
    lastname: lead.full_name?.split(" ").slice(1).join(" ") || "",
    platform_user_id: lead.platform_user_id || "",
    nationality: lead.nationality || "",
    country: lead.country_of_residence || "",
    student_high_school_curriculum: lead.curriculum || "",
    desired_education_level: educationLevelMap[lead.desired_education_level || ""] || lead.desired_education_level || "",
    desired_major: lead.desired_major || "",
    high_school_name: lead.school_name || "",
    blocked_bank_account_aware: lead.blocked_bank_account_aware || "",
    // GPA
    gpa_raw: lead.gpa_raw != null ? String(lead.gpa_raw) : "",
    gpa_scale: lead.gpa_scale != null ? String(lead.gpa_scale) : "",
    gpa_min_pass: lead.gpa_min_pass != null ? String(lead.gpa_min_pass) : "",
    german_gpa: lead.german_gpa != null ? String(lead.german_gpa) : "",
    total_credit_points: String(lead.total_ects ?? 0),
    // Language - prefer new individual fields, fall back to legacy array
    intended_study_language: lead.intended_study_language || "",
    english_cefr_level: lead.english_level ? (engCefrMap[lead.english_level] || lead.english_level) : (englishLang?.cefr_level || ""),
    language_test_english_type: lead.english_test_type || englishLang?.test_type || "",
    language_test_english_score: lead.english_test_score || englishLang?.test_score || "",
    german_cefr_level: lead.german_cert_level || lead.german_knowledge || germanLang?.cefr_level || "",
    language_test_german_type: lead.german_cert_type || germanLang?.test_type || "",
    language_test_german_score: germanLang?.test_score || "",
    planned_english_test_month: lead.planned_english_test_month || "",
    planned_german_test_month: lead.planned_german_test_month || "",
    // Preferences
    preferred_fields: (lead.preferred_fields || []).join(", "),
    preferred_cities: (lead.preferred_cities || []).join(", "),
    career_goals: lead.career_goals || "",
    // Gamification
    xp_points: String(lead.xp_points ?? 0),
    profile_completion_pct: String(lead.profile_completion_pct ?? 0),
    // Timestamps
    onboarding_completed_date: new Date().toISOString(),
    lead_source: "Platform Signup",
  };
  return props;
}

function buildEligibilityProperties(lead: LeadData): Record<string, string> {
  return {
    firstname: lead.full_name?.split(" ")[0] || "",
    lastname: lead.full_name?.split(" ").slice(1).join(" ") || "",
    platform_user_id: lead.platform_user_id || "",
    student_high_school_curriculum: lead.curriculum || "",
    eligibility_status: lead.eligibility_status || "",
    curriculum_details: lead.curriculum_details || "",
    lead_source: "Eligibility Checker",
  };
}

// --- Main handler ---

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const HUBSPOT_TOKEN = Deno.env.get("HUBSPOT_ACCESS_TOKEN");

    if (!HUBSPOT_TOKEN) {
      console.error("HUBSPOT_ACCESS_TOKEN is not configured");
      return new Response(
        JSON.stringify({ success: false, error: "HubSpot token not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const leadData: LeadData = await req.json();
    const syncType = leadData.sync_type || "signup";

    console.log(`Received ${syncType} lead for HubSpot sync:`, {
      email: leadData.email,
      name: leadData.full_name,
    });

    if (!leadData.email || !leadData.full_name) {
      return new Response(
        JSON.stringify({ success: false, error: "Email and full_name are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build properties based on sync type
    const properties = syncType === "onboarding_complete"
      ? buildOnboardingProperties(leadData)
      : syncType === "eligibility_check"
      ? buildEligibilityProperties(leadData)
      : buildSignupProperties(leadData);

    // Remove empty string values to avoid overwriting existing data
    const cleanProperties: Record<string, string> = {};
    for (const [k, v] of Object.entries(properties)) {
      if (v !== "") cleanProperties[k] = v;
    }

    // Create or update contact in HubSpot
    const result = await createOrUpdateContact(HUBSPOT_TOKEN, leadData.email, cleanProperties);

    // Log to hubspot_sync_log table
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    await supabase.from("hubspot_sync_log").insert({
      sync_type: syncType,
      sync_status: result.ok ? "success" : "failed",
      hubspot_contact_id: result.contactId || null,
      request_data: cleanProperties,
      response_data: { contactId: result.contactId },
      error_message: result.error || null,
      synced_at: new Date().toISOString(),
    });

    if (result.ok) {
      console.log(`Successfully synced ${syncType} to HubSpot, contactId: ${result.contactId}`);
    } else {
      console.error(`HubSpot sync failed: ${result.error}`);
    }

    return new Response(
      JSON.stringify({
        success: result.ok,
        message: result.ok
          ? `Contact ${syncType} synced to HubSpot (ID: ${result.contactId})`
          : "HubSpot sync failed",
        contactId: result.contactId,
        error: result.error,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in sync-hubspot-lead:", error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
