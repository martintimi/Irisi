import { Product } from '@/types';
import {
  isNativeProduct,
  matchesCategoryFilter,
  matchesSpecificCategory
} from '@/lib/utils/categoryMatcher';

/**
 * Smart Catalog Diversification & Shuffle:
 * Interleaves products by category and vendor/brand so that consecutive items
 * in the storefront display a vibrant, balanced mix of fashion categories
 * (native tailoring, footwear, streetwear, tops, denim/cargo, accessories, bags) and designers,
 * rather than a single vendor's consecutive uploads dominating the feed.
 */
export function diversifyCatalog(products: Product[]): Product[] {
  if (!products || products.length <= 2) return products || [];

  // Group products into category/department pools
  const pools: { [key: string]: Product[] } = {};
  
  // Categorize each product into distinct fashion pillars
  products.forEach((p) => {
    let poolKey = 'tops';

    if (isNativeProduct(p)) {
      poolKey = 'native';
    } else if (matchesCategoryFilter(p, 'footwear')) {
      poolKey = 'footwear';
    } else if (matchesSpecificCategory(p, 'hoodies') || matchesCategoryFilter(p, 'outerwear')) {
      poolKey = 'outerwear';
    } else if (matchesCategoryFilter(p, 'bottoms')) {
      poolKey = 'bottoms';
    } else if (matchesSpecificCategory(p, 'bags') || matchesSpecificCategory(p, 'backpacks') || matchesSpecificCategory(p, 'crossbody')) {
      poolKey = 'bags';
    } else if (matchesCategoryFilter(p, 'accessories')) {
      poolKey = 'accessories';
    } else if (matchesSpecificCategory(p, 'dresses') || matchesSpecificCategory(p, 'two-piece')) {
      poolKey = 'dresses';
    } else {
      poolKey = 'tops';
    }

    if (!pools[poolKey]) pools[poolKey] = [];
    pools[poolKey].push(p);
  });

  // Interleave and distribute vendors inside each pool
  const poolKeys = Object.keys(pools);
  poolKeys.forEach((key) => {
    pools[key] = distributeVendors(pools[key]);
  });

  // Round-robin interleave across the different pools
  const result: Product[] = [];
  let added = true;
  let round = 0;

  while (added) {
    added = false;
    // Rotate pool order each cycle for variety
    const rotatedKeys = [
      ...poolKeys.slice(round % poolKeys.length),
      ...poolKeys.slice(0, round % poolKeys.length),
    ];

    for (const key of rotatedKeys) {
      if (pools[key] && pools[key].length > 0) {
        result.push(pools[key].shift()!);
        added = true;
      }
    }
    round++;
  }

  return result;
}

/**
 * Distribute products of the same vendor evenly across a single pool
 */
function distributeVendors(pool: Product[]): Product[] {
  if (pool.length <= 1) return pool;

  const vendorMap: { [vendor: string]: Product[] } = {};
  pool.forEach((p) => {
    const vId = p.vendorId || p.vendorName || 'default';
    if (!vendorMap[vId]) vendorMap[vId] = [];
    vendorMap[vId].push(p);
  });

  const vendors = Object.keys(vendorMap);
  const out: Product[] = [];
  let added = true;

  while (added) {
    added = false;
    for (const v of vendors) {
      if (vendorMap[v] && vendorMap[v].length > 0) {
        out.push(vendorMap[v].shift()!);
        added = true;
      }
    }
  }

  return out;
}

