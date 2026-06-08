// Shared auth helpers for edge functions.
// Supports two auth modes:
//   1) `x-cron-secret` header equal to the CRON_SECRET env var (used by pg_cron
//      and internal service-to-service calls).
//   2) A Supabase JWT in the Authorization header belonging to an admin user.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.55.0";

export function checkCronSecret(req: Request): boolean {
  const expected = Deno.env.get("CRON_SECRET");
  if (!expected) return false;
  const provided = req.headers.get("x-cron-secret");
  return !!provided && provided === expected;
}

export async function isAdminRequest(req: Request): Promise<boolean> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return false;
  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error } = await supabase.auth.getClaims(token);
    if (error || !claimsData?.claims) return false;
    const userId = claimsData.claims.sub as string;
    const { data: roleRow } = await supabase
      .from("user_roles")
      .select("role")
      .eq("profile_id", userId)
      .eq("role", "admin")
      .maybeSingle();
    return !!roleRow;
  } catch (_e) {
    return false;
  }
}

export async function requireCronOrAdmin(req: Request): Promise<Response | null> {
  if (checkCronSecret(req)) return null;
  if (await isAdminRequest(req)) return null;
  return new Response(
    JSON.stringify({ success: false, error: "Unauthorized" }),
    {
      status: 401,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json",
      },
    }
  );
}

export async function requireAdmin(req: Request): Promise<Response | null> {
  if (await isAdminRequest(req)) return null;
  return new Response(
    JSON.stringify({ success: false, error: "Unauthorized" }),
    {
      status: 401,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json",
      },
    }
  );
}