export interface ProductsCacheEntry {
  data: any;
  timestamp: number;
}

export const apiProductsCache = new Map<string, ProductsCacheEntry>();
export const PRODUCTS_CACHE_TTL_MS = 60000;

export function invalidateProductsCache() {
  apiProductsCache.clear();
}
