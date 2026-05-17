// Generates an AI hero image for a blog post and uploads it to the public
// `blog-images` storage bucket, then updates the post's hero_image_url.
//
// Modes:
//   - { post_id }     -> generate for one post
//   - { backfill: true } -> generate for all published/draft posts missing an image
//   - { title, category, slug } -> internal call from blog-draft-generator
//   - { legacy_slug, title, category } -> generate for a legacy (code-defined) post
//     and upsert into the `legacy_blog_hero_images` table.
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
  // Rotate through several distinct visual treatments so hero images don't
  // feel repetitive. Pick deterministically per title so the same post is
  // stable on regenerate-by-design, but varies across posts.
  const styles = [
    "cinematic editorial photography, 35mm film grain, golden-hour light, shallow depth of field, Kinfolk magazine aesthetic",
    "vibrant modern illustration, flat-but-textured vector art, bold geometric shapes, brand blue #2E57F6 and teal accents, Behance editorial illustration style",
    "isometric 3D render, soft pastel palette with brand blue accent, clean studio lighting, Blender octane look, playful but premium",
    "double-exposure artistic composition blending German architecture with abstract gradients, painterly, museum-quality",
    "minimal collage / cut-paper art with torn-edge textures, risograph print feel, limited palette with brand blue, indie magazine cover energy",
    "dreamy cinematic photo with bokeh, warm sunlight rays, lifestyle moment, Unsplash trending aesthetic",
    "abstract conceptual artwork using metaphors related to the article topic, gradient mesh, glassmorphism, contemporary digital art",
  ];
  let h = 0;
  for (let i = 0; i < title.length; i++) h = (h * 31 + title.charCodeAt(i)) >>> 0;
  const style = styles[h % styles.length];

  let subject = "a creative metaphor for international students discovering Germany";
  if (cat.includes("city") || cat.includes("cities"))
    subject = "an evocative interpretation of a German cityscape — rooftops, bridges, trams or iconic silhouettes — atmospheric and artistic, not a generic stock photo";
  else if (cat.includes("cost"))
    subject = "a creative still-life metaphor for student budgeting in Germany: coins, plants, a notebook, a coffee cup, arranged artfully";
  else if (cat.includes("visa"))
    subject = "an artistic conceptual scene about travel and paperwork — paper planes, abstract stamps, a stylized passport silhouette — symbolic rather than literal";
  else if (cat.includes("language"))
    subject = "a poetic visual metaphor for learning German — speech bubbles, abstract letterforms (non-readable), open books with light spilling out";
  else if (cat.includes("career"))
    subject = "a hopeful conceptual scene about a young professional's path — staircase, open doors, city skyline at dawn — symbolic, cinematic";
  else if (cat.includes("universit"))
    subject = "a striking artistic view of a German university — dramatic architecture angle, light and shadow play, lone student silhouette";
  else if (cat.includes("study"))
    subject = "a warm, creative study scene — books, plants, a window with soft light, a laptop — lifestyle editorial mood";

  return [
    `Hero image for an article titled "${title}".`,
    `Subject: ${subject}.`,
    `Visual style: ${style}.`,
    "Composition: wide 16:9 cinematic framing, strong focal point, generous negative space, premium magazine-cover quality.",
    "Mood: inspiring, optimistic, warm, premium — an image people want to share.",
    "Strict: absolutely no text, no letters, no words, no numbers, no logos, no watermarks, no readable signage of any kind.",
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

  let body: {
    post_id?: string;
    backfill?: boolean;
    legacy_slug?: string;
    title?: string;
    category?: string | null;
  } = {};
  try {
    body = (await req.json()) ?? {};
  } catch {
    body = {};
  }

  try {
    if (body.legacy_slug) {
      if (!body.title) return json({ error: "title required for legacy_slug" }, 400);
      const prompt = buildPrompt(body.title, body.category ?? null);
      const bytes = await generateImage(lovableKey, prompt);
      const path = `legacy/${body.legacy_slug}-${Date.now()}.png`;
      const { error: upErr } = await sb.storage
        .from(BUCKET)
        .upload(path, bytes, { contentType: "image/png", upsert: true });
      if (upErr) throw new Error(`upload: ${upErr.message}`);
      const { data: pub } = sb.storage.from(BUCKET).getPublicUrl(path);
      const url = pub.publicUrl;
      const { error: dbErr } = await sb
        .from("legacy_blog_hero_images")
        .upsert(
          {
            slug: body.legacy_slug,
            hero_image_url: url,
            hero_image_alt: body.title,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "slug" },
        );
      if (dbErr) throw new Error(`upsert: ${dbErr.message}`);
      return json({ success: true, url });
    }

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
