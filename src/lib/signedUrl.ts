import { supabase } from "@/integrations/supabase/client";

const BUCKET = "media";
const EXPIRES_IN = 60 * 60; // 1 hour

const cache = new Map<string, { url: string; expiresAt: number }>();

/** Accepts either a storage path ("userId/file.jpg") or a legacy public URL. */
export function extractMediaPath(urlOrPath: string): string | null {
  if (!urlOrPath) return null;
  // Legacy public URL: .../storage/v1/object/public/media/<path>
  const pub = urlOrPath.match(/\/storage\/v1\/object\/(?:public|sign)\/media\/([^?]+)/);
  if (pub) return decodeURIComponent(pub[1]);
  // Already a path
  if (!urlOrPath.startsWith("http")) return urlOrPath.replace(/^\/+/, "");
  return null;
}

export async function getSignedMediaUrl(urlOrPath: string): Promise<string | null> {
  const path = extractMediaPath(urlOrPath);
  if (!path) return null;
  const now = Date.now();
  const hit = cache.get(path);
  if (hit && hit.expiresAt > now + 30_000) return hit.url;
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, EXPIRES_IN);
  if (error || !data) return null;
  cache.set(path, { url: data.signedUrl, expiresAt: now + EXPIRES_IN * 1000 });
  return data.signedUrl;
}
