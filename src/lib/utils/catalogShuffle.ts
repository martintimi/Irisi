import { Product } from '@/types';

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
    const cat = (p.category || '').toLowerCase();
    const sub = ((p as any).subCategory || (p as any).subcategory || '').toLowerCase();
    const name = (p.name || '').toLowerCase();
    const desc = (p.description || '').toLowerCase();
    const tags = Array.isArray(p.tags) ? p.tags.join(' ').toLowerCase() : '';
    const fullText = `${name} ${cat} ${sub} ${desc} ${tags}`;
    
    let poolKey = 'tops';

    if (
      fullText.includes('senator') ||
      fullText.includes('kaftan') ||
      fullText.includes('agbada') ||
      fullText.includes('boubou') ||
      fullText.includes('bubu') ||
      fullText.includes('lace') ||
      fullText.includes('jalabiya') ||
      fullText.includes('ankara') ||
      fullText.includes('dashiki') ||
      fullText.includes('aso-oke') ||
      cat === 'native'
    ) {
      poolKey = 'native';
    } else if (
      cat === 'footwear' ||
      fullText.includes('slide') ||
      fullText.includes('shoe') ||
      fullText.includes('sneaker') ||
      fullText.includes('clog') ||
      fullText.includes('croc') ||
      fullText.includes('loafer') ||
      fullText.includes('heel') ||
      fullText.includes('mule') ||
      fullText.includes('slipper') ||
      fullText.includes('pump')
    ) {
      poolKey = 'footwear';
    } else if (
      cat === 'outerwear' ||
      fullText.includes('hoodie') ||
      fullText.includes('jacket') ||
      fullText.includes('sweatshirt') ||
      fullText.includes('pullover') ||
      fullText.includes('windbreaker') ||
      fullText.includes('coat')
    ) {
      poolKey = 'outerwear';
    } else if (
      cat === 'bottoms' ||
      fullText.includes('jean') ||
      fullText.includes('denim') ||
      fullText.includes('cargo') ||
      fullText.includes('trouser') ||
      fullText.includes('pant') ||
      fullText.includes('jogger') ||
      fullText.includes('short') ||
      fullText.includes('skirt')
    ) {
      poolKey = 'bottoms';
    } else if (
      fullText.includes('bag') ||
      fullText.includes('backpack') ||
      fullText.includes('tote') ||
      fullText.includes('crossbody') ||
      fullText.includes('clutch') ||
      fullText.includes('duffel') ||
      fullText.includes('purse')
    ) {
      poolKey = 'bags';
    } else if (
      cat === 'accessories' ||
      fullText.includes('watch') ||
      fullText.includes('chain') ||
      fullText.includes('cap') ||
      fullText.includes('fila') ||
      fullText.includes('jewelry') ||
      fullText.includes('sunglass') ||
      fullText.includes('glasses') ||
      fullText.includes('necklace') ||
      fullText.includes('bangle') ||
      fullText.includes('ring') ||
      fullText.includes('hat') ||
      fullText.includes('beanie')
    ) {
      poolKey = 'accessories';
    } else if (
      fullText.includes('dress') ||
      fullText.includes('gown') ||
      fullText.includes('maxi') ||
      fullText.includes('two-piece') ||
      fullText.includes('two piece') ||
      fullText.includes('coord')
    ) {
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

