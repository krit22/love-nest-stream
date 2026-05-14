import { supabase } from "@/integrations/supabase/client";

/**
 * Uploads to the private `media` bucket and returns the storage PATH
 * (e.g. "<userId>/<file>"). Use getSignedMediaUrl() to render it.
 * Path format MUST start with the uploader's user id (storage RLS depends on it).
 */
export async function uploadToMedia(file: File, userId: string): Promise<string> {
  const ext = file.name.split(".").pop() || "bin";
  const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await supabase.storage.from("media").upload(path, file, {
    cacheControl: "3600",
    contentType: file.type,
    upsert: false,
  });
  if (error) throw error;
  return path;
}
