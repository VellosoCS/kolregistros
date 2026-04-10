import { useState, useEffect } from "react";
import { getSignedImageUrls } from "@/lib/storage-utils";

/**
 * Hook that resolves an array of storage paths/URLs to signed URLs.
 * Returns the resolved URLs, falling back to originals while loading.
 */
export function useSignedUrls(urls: string[]): string[] {
  const [signed, setSigned] = useState<string[]>(urls);

  useEffect(() => {
    let cancelled = false;

    if (urls.length === 0) {
      setSigned([]);
      return;
    }

    getSignedImageUrls(urls).then((resolved) => {
      if (!cancelled) setSigned(resolved);
    });

    return () => { cancelled = true; };
  }, [urls.join(",")]);

  return signed;
}
