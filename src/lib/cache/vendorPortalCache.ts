// Instant Stale-While-Revalidate client cache for Vendor Portal
// Keeps in-memory cache hot across all in-app tab transitions (0ms instant switch, zero SSR hydration mismatch)
// and backs up to sessionStorage so hard refreshes recover immediately after mount.

const memoryCache = new Map<string, { data: any; ts: number }>();

function buildKey(vendorKey: string, scope: string): string {
  const cleanVid = (vendorKey || 'default').toLowerCase().trim();
  return `irisi_vp_cache:${cleanVid}:${scope}`;
}

/**
 * Call once in VendorPortalLayout client mount effect to pre-warm memoryCache from sessionStorage
 * without ever causing an SSR/client initial hydration mismatch.
 */
export function hydrateVendorCacheFromSession(): void {
  if (typeof window === 'undefined') return;
  try {
    for (let i = 0; i < sessionStorage.length; i++) {
      const k = sessionStorage.key(i);
      if (k && k.startsWith('irisi_vp_cache:') && !memoryCache.has(k)) {
        const raw = sessionStorage.getItem(k);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && typeof parsed.ts === 'number') {
            memoryCache.set(k, parsed);
          }
        }
      }
    }
  } catch {}
}

export function getVendorCache<T = any>(
  vendorKey: string,
  scope: string,
  maxAgeMs: number = 15 * 60 * 1000
): T | null {
  const key = buildKey(vendorKey, scope);
  const mem = memoryCache.get(key);
  if (mem && Date.now() - mem.ts <= maxAgeMs) {
    return mem.data as T;
  }
  return null;
}

export function getVendorCacheAgeMs(vendorKey: string, scope: string): number {
  const key = buildKey(vendorKey, scope);
  const mem = memoryCache.get(key);
  if (mem) return Date.now() - mem.ts;
  return Infinity;
}

export function setVendorCache<T = any>(vendorKey: string, scope: string, data: T): void {
  const key = buildKey(vendorKey, scope);
  const entry = { data, ts: Date.now() };
  memoryCache.set(key, entry);

  if (typeof window !== 'undefined') {
    try {
      sessionStorage.setItem(key, JSON.stringify(entry));
    } catch {
      // Ignore quota errors cleanly
    }
  }
}

export function clearVendorCache(): void {
  memoryCache.clear();
  if (typeof window !== 'undefined') {
    try {
      const toRemove: string[] = [];
      for (let i = 0; i < sessionStorage.length; i++) {
        const k = sessionStorage.key(i);
        if (k && k.startsWith('irisi_vp_cache:')) {
          toRemove.push(k);
        }
      }
      toRemove.forEach((k) => sessionStorage.removeItem(k));
    } catch {}
  }
}
