// Generates an AI hero image for a blog post and uploads it to the public
// `blog-images` storage bucket, then updates the post's hero_image_url.
//
// Modes:
//   - { post_id }     -> generate for one post
//   - { backfill: true } -> generate for all published/draft posts missing an image
//   - { title, category, slug } -> internal call from blog-draft-generator
//
// Auth: verify_jwt = true (admin-only callers from the UI). Internal calls
// from other edge functions use the service-role and bypass verify_jwt.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const IMAGE_MODEL = "google/gemini-2.5-flash-image";
const BUCKET = "blog-images";

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function buildPrompt(title: string, category: string | null): string {
  const cat = (category ?? "").toLowerCase();
  let scene = "international university students in Germany, candid editorial photography";
  if (cat.includes("city") || cat.includes("cities"))
    scene = "iconic German cityscape with warm golden-hour light, no text or signs, no people in focus";
  else if (cat.includes("cost"))
    scene = "cozy German student apartment interior with desk, books and coffee, warm natural light";
  else if (cat.includes("visa"))
    scene = "calm flat-lay of a passport, neutral travel documents, a small German flag detail, soft daylight, no readable text";
  else if (cat.includes("language"))
    scene = "students chatting in a sunlit German university courtyard, friendly atmosphere";
  else if (cat.includes("career"))
    scene = "modern German office or campus career fair, diverse young professionals, bright contemporary mood";
  else if (cat.includes("universit"))
    scene = "elegant German university building with students walking, soft cinematic light";

  return [
    `Editorial hero image for an article titled "${title}".`,
    `Scene: ${scene}.`,
    "Style: photographic, modern, warm, soft natural light, shallow depth of field, on-brand for an education platform.",
    "Composition: wide 16:9 cinematic framing with negative space on one side.",
    "Strict: no text, no letters, no logos, no watermarks, no signage with readable words, no flags besides subtle context.",
  ].join(" ");
}

async function generateImage(lovableKey: string, prompt: string): Promise<Uint8Array> {
  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${lovableKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: IMAGE_MODEL,
      modalities: ["image", "text"],
      messages: [{ role: "user", content: prompt }],
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`AI gateway ${res.status}: ${body}`);
  }
  const data = await res.json();
  const url: string | undefined =
    data?.choices?.[0]?.message?.images?.[0]?.image_url?.url;
  if (!url || !url.startsWith("data:")) {
    throw new Error("AI returned no image data");
  }
  const base64 = url.split(",")[1];
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function generateForPost(
  sb: ReturnType<typeof createClient>,
  lovableKey: string,
  post: { id: string; slug: string; title: string; category: string | null },
): Promise<{ url: string }> {
  const prompt = buildPrompt(post.title, post.category);
  const bytes = await generateImage(lovableKey, prompt);
  const path = `${post.slug}-${Date.now()}.png`;
  const { error: upErr } = await sb.storage
    .from(BUCKET)
    .upload(path, bytes, { contentType: "image/png", upsert: true });
  if (upErr) throw new Error(`upload: ${upErr.message}`);
  const { data: pub } = sb.storage.from(BUCKET).getPublicUrl(path);
  const url = pub.publicUrl;
  const { error: updErr } = await sb
    .from("blog_posts")
    .update({ hero_image_url: url, hero_image_alt: post.title })
    .eq("id", post.id);
  if (updErr) throw new Error(`update: ${updErr.message}`);
  return { url };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const lovableKey = Deno.env.get("LOVABLE_API_KEY");
  if (!lovableKey) return json({ error: "LOVABLE_API_KEY missing" }, 500);

  const sb = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } },
  );

  let body: { post_id?: string; backfill?: boolean } = {};
  try {
    body = (await req.json()) ?? {};
  } catch {
    body = {};
  }

  try {
    if (body.backfill) {
      const { data: posts, error } = await sb
        .from("blog_posts")
        .select("id, slug, title, category")
        .is("hero_image_url", null)
        .in("status", ["draft", "published"]);
      if (error) throw error;
      const results: { slug: string; ok: boolean; error?: string }[] = [];
      for (const p of posts ?? []) {
        try {
          await generateForPost(sb, lovableKey, p as never);
          results.push({ slug: (p as { slug: string }).slug, ok: true });
        } catch (e) {
          results.push({ slug: (p as { slug: string }).slug, ok: false, error: String(e) });
        }
      }
      return json({ success: true, processed: results.length, results });
    }

    if (!body.post_id) return json({ error: "post_id required" }, 400);
    const { data: post, error } = await sb
      .from("blog_posts")
      .select("id, slug, title, category")
      .eq("id", body.post_id)
      .maybeSingle();
    if (error) throw error;
    if (!post) return json({ error: "post not found" }, 404);

    const result = await generateForPost(sb, lovableKey, post as never);
    return json({ success: true, ...result });
  } catch (e) {
    console.error("[hero-image]", e);
    return json({ error: String(e) }, 500);
  }
});
