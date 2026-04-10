import { useState, useEffect } from "react";
import { getCachedImageUrl } from "@/lib/image-cache";
import { getSignedImageUrl } from "@/lib/storage-utils";

/**
 * Hook that returns a displayable URL for an image.
 * Resolves signed URLs for private storage, then caches via Cache API.
 * Falls back to the original URL while loading or on error.
 */
export function useCachedImage(src: string): string {
  const [cachedSrc, setCachedSrc] = useState(src);

  useEffect(() => {
    let revoke: string | null = null;
    let cancelled = false;

    (async () => {
      // If it's an incident-images path/URL, resolve to a signed URL first
      const isStoragePath =
        src.includes("incident-images") || !src.startsWith("http");
      const resolvedUrl = isStoragePath ? await getSignedImageUrl(src) : src;

      if (cancelled) return;

      const cached = await getCachedImageUrl(resolvedUrl);
      if (cancelled) {
        if (cached !== resolvedUrl) URL.revokeObjectURL(cached);
        return;
      }
      setCachedSrc(cached);
      if (cached !== resolvedUrl) revoke = cached;
    })();

    return () => {
      cancelled = true;
      if (revoke) URL.revokeObjectURL(revoke);
    };
  }, [src]);

  return cachedSrc;
}
