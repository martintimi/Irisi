export type FulfillmentType = 'ready_to_ship' | 'made_to_order';

export interface ParsedProductMeta {
  fulfillmentType: FulfillmentType;
  productionLeadTime: string;
  cleanTags: string[];
}

const MTO_PREFIX = '__mto:';
const LEAD_PREFIX = '__lead:';

/**
 * Extracts Made-to-Order & Production Lead Time metadata from product tags
 * without requiring schema migrations, while returning clean user-visible tags.
 */
export function parseProductMetaFromTags(rawTags?: string[] | null): ParsedProductMeta {
  const tags = Array.isArray(rawTags) ? rawTags : [];
  let fulfillmentType: FulfillmentType = 'ready_to_ship';
  let productionLeadTime = '';
  const cleanTags: string[] = [];

  for (const raw of tags) {
    const t = String(raw || '').trim();
    if (!t) continue;
    if (t.startsWith(MTO_PREFIX)) {
      if (t.slice(MTO_PREFIX.length).toLowerCase() === 'true') {
        fulfillmentType = 'made_to_order';
      }
      continue;
    }
    if (t.startsWith(LEAD_PREFIX)) {
      productionLeadTime = t.slice(LEAD_PREFIX.length).trim();
      continue;
    }
    if (t.startsWith('__')) {
      continue;
    }
    cleanTags.push(t);
  }

  return {
    fulfillmentType,
    productionLeadTime: productionLeadTime || (fulfillmentType === 'made_to_order' ? '5-7 business days' : '1-2 business days'),
    cleanTags,
  };
}

/**
 * Encodes Made-to-Order metadata cleanly into the product tags array alongside user tags.
 */
export function encodeProductMetaIntoTags(
  userTags: string[] | undefined | null,
  fulfillmentType?: FulfillmentType,
  productionLeadTime?: string
): string[] {
  const base = (Array.isArray(userTags) ? userTags : [])
    .map((t) => String(t || '').trim())
    .filter((t) => t && !t.startsWith(MTO_PREFIX) && !t.startsWith(LEAD_PREFIX));

  if (fulfillmentType === 'made_to_order') {
    base.push(`${MTO_PREFIX}true`);
    if (productionLeadTime && productionLeadTime.trim()) {
      base.push(`${LEAD_PREFIX}${productionLeadTime.trim()}`);
    }
  }
  return base;
}
