const CACHE_NAME = "incident-images-v1";

let cacheSupported: boolean | null = null;

function isCacheSupported(): boolean {
  if (cacheSupported === null) {
    cacheSupported = "caches" in window;
  }
  return cacheSupported;
}

/**
 * Fetches an image URL using the Cache API for offline support.
 * Returns an object URL from cache if available, otherwise fetches and caches it.
 * Falls back to the original URL if Cache API is not supported.
 */
export async function getCachedImageUrl(url: string): Promise<string> {
  if (!isCacheSupported() || !url) return url;

  try {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(url);

    if (cached) {
      const blob = await cached.blob();
      return URL.createObjectURL(blob);
    }

    // Fetch and cache in background
    const response = await fetch(url, { mode: "cors" });
    if (response.ok) {
      // Clone before consuming
      await cache.put(url, response.clone());
      const blob = await response.blob();
      return URL.createObjectURL(blob);
    }
  } catch {
    // Silently fall back to original URL
  }

  return url;
}

/**
 * Preloads and caches an array of image URLs in background.
 */
export function preloadImages(urls: string[]): void {
  if (!isCacheSupported()) return;

  urls.forEach(async (url) => {
    if (!url) return;
    try {
      const cache = await caches.open(CACHE_NAME);
      const existing = await cache.match(url);
      if (!existing) {
        const response = await fetch(url, { mode: "cors" });
        if (response.ok) {
          await cache.put(url, response);
        }
      }
    } catch {
      // ignore
    }
  });
}
