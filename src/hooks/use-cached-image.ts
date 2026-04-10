import { useState, useEffect } from "react";
import { getCachedImageUrl } from "@/lib/image-cache";

/**
 * Hook that returns a cached object URL for an image.
 * Falls back to the original URL while loading or on error.
 */
export function useCachedImage(src: string): string {
  const [cachedSrc, setCachedSrc] = useState(src);

  useEffect(() => {
    let revoke: string | null = null;
    let cancelled = false;

    getCachedImageUrl(src).then((url) => {
      if (cancelled) {
        if (url !== src) URL.revokeObjectURL(url);
        return;
      }
      setCachedSrc(url);
      if (url !== src) revoke = url;
    });

    return () => {
      cancelled = true;
      if (revoke) URL.revokeObjectURL(revoke);
    };
  }, [src]);

  return cachedSrc;
}
