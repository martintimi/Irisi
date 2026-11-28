import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export interface VendorLookupItem {
  id: string;
  slug: string;
  brandName: string;
  logoUrl: string;
  fallbackImage: string;
  city: string;
  state: string;
  isVerified: boolean;
  hasPaidPlus: boolean;
}

function normalizeKey(value: string): string {
  return (value || '').toLowerCase().trim().replace(/[^a-z0-9]/g, '');
}

/**
 * Batch vendor lookup by slug / id / brand name.
 * GET /api/vendors/lookup?ids=roman,moji-wears
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const rawIds = (searchParams.get('ids') || '').trim();

    if (!rawIds) {
      return NextResponse.json({ success: true, vendors: {} });
    }

    const requestedIds = Array.from(
      new Set(
        rawIds
          .split(',')
          .map((s) => decodeURIComponent(s).trim())
          .filter(Boolean)
      )
    ).slice(0, 50);

    if (requestedIds.length === 0) {
      return NextResponse.json({ success: true, vendors: {} });
    }

    const adminClient = createAdminClient();

    const [{ data: allVendors }, { data: recentProducts }] = await Promise.all([
      adminClient.from('vendors').select('*'),
      adminClient
        .from('products')
        .select('vendor_id, image_url')
        .eq('is_published', true)
        .not('image_url', 'is', null)
        .order('created_at', { ascending: false })
        .limit(400),
    ]);

    const firstProductImageByNormVendor = new Map<string, string>();
    (recentProducts || []).forEach((p: any) => {
      const norm = normalizeKey(p.vendor_id || '');
      if (norm && p.image_url && !firstProductImageByNormVendor.has(norm)) {
        firstProductImageByNormVendor.set(norm, p.image_url);
      }
    });

    const parsedVendors = (allVendors || []).map((v: any) => {
      let logoUrl = v.logo_url || v.logo || '';
      let city = '';
      let state = '';
      let hasPaidPlus = false;
      const rawBio = typeof v.bio === 'string' ? v.bio.trim() : '';
      if (rawBio.startsWith('{') && rawBio.endsWith('}')) {
        try {
          const parsed = JSON.parse(rawBio);
          logoUrl = parsed.logoUrl || parsed.logo || logoUrl || '';
          city = parsed.city || '';
          state = parsed.state || '';
          const nowMs = Date.now();
          hasPaidPlus =
            parsed?.plusLifetimeFree === true ||
            (parsed?.subscriptionPlan === 'plus' &&
              (!parsed?.plusExpiresAt || new Date(parsed.plusExpiresAt).getTime() > nowMs));
        } catch {}
      }

      if (!city && v.location) {
        const parts = String(v.location).split(',');
        city = (parts[0] || '').trim();
        state = (parts[1] || '').trim();
      }

      const normId = normalizeKey(v.id || '');
      const normName = normalizeKey(v.brand_name || '');
      const fallbackImage =
        firstProductImageByNormVendor.get(normId) ||
        firstProductImageByNormVendor.get(normName) ||
        '';

      return {
        raw: v,
        normId,
        normName,
        item: {
          id: v.id,
          slug: v.id,
          brandName: v.brand_name || String(v.id || '').replace(/-/g, ' '),
          logoUrl: typeof logoUrl === 'string' ? logoUrl.trim() : '',
          fallbackImage,
          city,
          state,
          isVerified: Boolean(v.is_verified),
          hasPaidPlus,
        } as VendorLookupItem,
      };
    });

    const result: Record<string, VendorLookupItem> = {};

    for (const reqId of requestedIds) {
      const lower = reqId.toLowerCase().trim();
      const normReq = normalizeKey(reqId);

      const matched =
        parsedVendors.find((pv) => (pv.raw.id || '').toLowerCase() === lower) ||
        parsedVendors.find((pv) => pv.normId === normReq || pv.normName === normReq) ||
        parsedVendors.find(
          (pv) =>
            normReq.length >= 3 &&
            ((pv.normId && (pv.normId.includes(normReq) || normReq.includes(pv.normId))) ||
              (pv.normName && (pv.normName.includes(normReq) || normReq.includes(pv.normName))))
        );

      if (matched) {
        result[reqId] = matched.item;
        result[lower] = matched.item;
      } else {
        const fallbackImg = firstProductImageByNormVendor.get(normReq) || '';
        const prettyName = reqId
          .replace(/[-_]+/g, ' ')
          .replace(/\b\w/g, (ch) => ch.toUpperCase());
        const fallbackItem: VendorLookupItem = {
          id: reqId,
          slug: reqId,
          brandName: prettyName,
          logoUrl: '',
          fallbackImage: fallbackImg,
          city: '',
          state: '',
          isVerified: true,
          hasPaidPlus: false,
        };
        result[reqId] = fallbackItem;
        result[lower] = fallbackItem;
      }
    }

    return NextResponse.json({ success: true, vendors: result });
  } catch (error: any) {
    console.error('API /api/vendors/lookup GET error:', error);
    return NextResponse.json({ success: false, vendors: {} }, { status: 500 });
  }
}
