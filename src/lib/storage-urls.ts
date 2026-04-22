import { supabase } from '@/integrations/supabase/client';

/**
 * Resolve a Supabase Storage URL into a short-lived signed URL.
 *
 * Accepts either a full public URL (e.g. .../object/public/program-documents/foo.pdf)
 * or a path like "program-documents/foo.pdf". Returns the original value if it
 * isn't a Supabase Storage URL (e.g. an external link).
 */
export async function getSignedDocumentUrl(
  urlOrPath: string,
  expiresInSeconds = 60 * 10
): Promise<string | null> {
  if (!urlOrPath) return null;

  // External (non-Supabase) URLs: return as-is.
  const isSupabaseObject =
    urlOrPath.includes('/storage/v1/object/') ||
    !urlOrPath.startsWith('http');

  if (!isSupabaseObject) return urlOrPath;

  // Try to parse "<bucket>/<path>" out of the URL.
  let bucket: string | null = null;
  let objectPath: string | null = null;

  try {
    if (urlOrPath.startsWith('http')) {
      const url = new URL(urlOrPath);
      // .../storage/v1/object/(public|sign)/<bucket>/<path>
      const match = url.pathname.match(/\/storage\/v1\/object\/(?:public|sign|authenticated)\/([^/]+)\/(.+)$/);
      if (match) {
        bucket = match[1];
        objectPath = decodeURIComponent(match[2]);
      }
    } else {
      const idx = urlOrPath.indexOf('/');
      if (idx > 0) {
        bucket = urlOrPath.slice(0, idx);
        objectPath = urlOrPath.slice(idx + 1);
      }
    }
  } catch {
    return urlOrPath;
  }

  if (!bucket || !objectPath) return urlOrPath;

  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(objectPath, expiresInSeconds);

  if (error || !data?.signedUrl) {
    console.error('Failed to sign document URL:', error);
    return null;
  }
  return data.signedUrl;
}
