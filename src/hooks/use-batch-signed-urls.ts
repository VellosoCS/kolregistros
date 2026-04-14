import { useState, useEffect, useMemo } from "react";
import { getSignedImageUrls } from "@/lib/storage-utils";

/**
 * Batch-resolve signed URLs for all incidents on a page.
 * Returns a Map from incident ID to its signed URLs array.
 */
export function useBatchSignedUrls(
  incidents: { id: string; imageUrls: string[] }[]
): Map<string, string[]> {
  const [signedMap, setSignedMap] = useState<Map<string, string[]>>(new Map());

  // Build a stable key from all incident IDs + image counts to detect changes
  const cacheKey = useMemo(
    () => incidents.map((i) => `${i.id}:${i.imageUrls.length}`).join("|"),
    [incidents]
  );

  useEffect(() => {
    let cancelled = false;

    // Collect all unique URLs across all incidents
    const allUrls: string[] = [];
    const indexMap: { incidentId: string; startIdx: number; count: number }[] = [];

    for (const inc of incidents) {
      if (inc.imageUrls.length > 0) {
        indexMap.push({ incidentId: inc.id, startIdx: allUrls.length, count: inc.imageUrls.length });
        allUrls.push(...inc.imageUrls);
      }
    }

    if (allUrls.length === 0) {
      setSignedMap(new Map());
      return;
    }

    getSignedImageUrls(allUrls).then((signedUrls) => {
      if (cancelled) return;
      const map = new Map<string, string[]>();
      for (const entry of indexMap) {
        map.set(entry.incidentId, signedUrls.slice(entry.startIdx, entry.startIdx + entry.count));
      }
      setSignedMap(map);
    });

    return () => { cancelled = true; };
  }, [cacheKey]);

  return signedMap;
}
