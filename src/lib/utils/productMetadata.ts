export type FulfillmentType = 'ready_to_ship' | 'made_to_order';

export const SOLD_OUT_AUTO_HIDE_HOURS = 48;

export interface ParsedProductMeta {
  fulfillmentType: FulfillmentType;
  productionLeadTime: string;
  soldOutAt: string | null;
  cleanTags: string[];
}

export interface SoldOutVisibility {
  isSoldOut: boolean;
  soldOutAt: string | null;
  hoursUntilAutoHide: number;
  isAutoHiddenSoldOut: boolean;
}

const MTO_PREFIX = '__mto:';
const LEAD_PREFIX = '__lead:';
const SOLD_OUT_AT_PREFIX = '__sold_out_at:';

/**
 * Extracts Made-to-Order, Production Lead Time, and Sold-Out Timestamp metadata
 * from product tags without requiring schema migrations, while returning clean customer-visible tags.
 */
export function parseProductMetaFromTags(rawTags?: string[] | null): ParsedProductMeta {
  const tags = Array.isArray(rawTags) ? rawTags : [];
  let fulfillmentType: FulfillmentType = 'ready_to_ship';
  let productionLeadTime = '';
  let soldOutAt: string | null = null;
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
    if (t.startsWith(SOLD_OUT_AT_PREFIX)) {
      const candidate = t.slice(SOLD_OUT_AT_PREFIX.length).trim();
      if (candidate && !Number.isNaN(new Date(candidate).getTime())) {
        soldOutAt = candidate;
      }
      continue;
    }
    if (t.startsWith('__')) {
      continue;
    }
    cleanTags.push(t);
  }

  return {
    fulfillmentType,
    productionLeadTime:
      productionLeadTime ||
      (fulfillmentType === 'made_to_order' ? '5-7 business days' : '1-2 business days'),
    soldOutAt,
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

/**
 * Keeps `__sold_out_at:<ISO>` synchronized with live stock:
 * - When stock > 0 (restocked): strips `__sold_out_at:` so the item returns live immediately.
 * - When stock <= 0: keeps existing timestamp if already stamped, otherwise stamps current UTC time.
 */
export function syncSoldOutTag(
  rawTags: string[] | null | undefined,
  totalStock: number,
  nowIso: string = new Date().toISOString()
): string[] {
  const tags = Array.isArray(rawTags)
    ? rawTags.map((t) => String(t || '').trim()).filter(Boolean)
    : [];

  const existingSoldOutTag = tags.find((t) => t.startsWith(SOLD_OUT_AT_PREFIX));
  const withoutSoldOut = tags.filter((t) => !t.startsWith(SOLD_OUT_AT_PREFIX));

  if (totalStock > 0) {
    return withoutSoldOut;
  }

  return [...withoutSoldOut, existingSoldOutTag || `${SOLD_OUT_AT_PREFIX}${nowIso}`];
}

/**
 * Fashion Nova / SHEIN / Zara 48-Hour Hype -> Auto-Hide rule:
 * - In stock (> 0): fully live on Home & Shop.
 * - Sold out (< 48h): hidden from Home, pushed to bottom of Shop with crisp "Sold Out" badge.
 * - Sold out (>= 48h): automatically hidden from Shop & Home feeds (remains in Vendor Catalog to restock anytime & direct links still open).
 */
export function computeSoldOutVisibility(
  stockQuantity: number,
  soldOutAt: string | null,
  fallbackTimestamp?: string | null
): SoldOutVisibility {
  if (stockQuantity > 0) {
    return {
      isSoldOut: false,
      soldOutAt: null,
      hoursUntilAutoHide: 0,
      isAutoHiddenSoldOut: false,
    };
  }

  const effectiveIso = soldOutAt || fallbackTimestamp || null;
  const refMs = effectiveIso ? new Date(effectiveIso).getTime() : NaN;
  const windowMs = SOLD_OUT_AUTO_HIDE_HOURS * 60 * 60 * 1000;

  if (Number.isNaN(refMs)) {
    // No timestamp available yet -> give a fresh 48h grace window
    return {
      isSoldOut: true,
      soldOutAt: null,
      hoursUntilAutoHide: SOLD_OUT_AUTO_HIDE_HOURS,
      isAutoHiddenSoldOut: false,
    };
  }

  const elapsedMs = Math.max(0, Date.now() - refMs);
  const isAutoHiddenSoldOut = elapsedMs >= windowMs;
  const hoursUntilAutoHide = isAutoHiddenSoldOut
    ? 0
    : Math.max(1, Math.ceil((windowMs - elapsedMs) / (60 * 60 * 1000)));

  return {
    isSoldOut: true,
    soldOutAt: effectiveIso,
    hoursUntilAutoHide,
    isAutoHiddenSoldOut,
  };
}
