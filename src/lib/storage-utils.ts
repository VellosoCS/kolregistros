import { supabase } from "@/integrations/supabase/client";

const SIGNED_URL_EXPIRY = 3600; // 1 hour

/**
 * Extracts the storage path from either a full public URL or a bare path.
 * Legacy data stores full URLs; new data stores just the path.
 */
export function extractStoragePath(urlOrPath: string): string {
  const match = urlOrPath.match(/incident-images\/(.+)$/);
  return match ? match[1] : urlOrPath;
}

/**
 * Returns a signed URL for a stored image path or legacy public URL.
 * Signed URLs expire after 1 hour.
 */
export async function getSignedImageUrl(urlOrPath: string): Promise<string> {
  const path = extractStoragePath(urlOrPath);

  const { data, error } = await supabase.storage
    .from("incident-images")
    .createSignedUrl(path, SIGNED_URL_EXPIRY);

  if (error || !data?.signedUrl) {
    console.error("Failed to create signed URL:", error);
    return urlOrPath; // fallback to original
  }

  return data.signedUrl;
}

/**
 * Batch-resolve signed URLs for multiple paths/URLs.
 */
export async function getSignedImageUrls(urlsOrPaths: string[], expirySeconds = SIGNED_URL_EXPIRY): Promise<string[]> {
  if (urlsOrPaths.length === 0) return [];

  const paths = urlsOrPaths.map(extractStoragePath);

  const { data, error } = await supabase.storage
    .from("incident-images")
    .createSignedUrls(paths, expirySeconds);

  if (error || !data) {
    console.error("Failed to create signed URLs:", error);
    return urlsOrPaths;
  }

  return data.map((item, i) => item.signedUrl || urlsOrPaths[i]);
}
