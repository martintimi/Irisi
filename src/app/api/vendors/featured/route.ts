import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { fetchLivePlatformBillingConfig } from '@/lib/config/platformBillingServer';
import { isVendorPlusActive } from '@/lib/config/platformBilling';

export const dynamic = 'force-dynamic';

export interface DynamicAtelier {
  id: string;
  slug: string;
  name: string;
  logoUrl: string;
  location: string;
  city: string;
  state: string;
  focus: string;
  desc: string;
  images: string[];
  tag: string;
  categoryKey: 'streetwear' | 'native' | 'jewelry' | 'footwear' | 'all';
  heroPieces: string;
  rating: string;
  productCount: number;
  minPrice: number;
  isPlus: boolean;
  hasPaidPlus: boolean;
}

export async function GET() {
  try {
    const supabase = createAdminClient();
    const billing = await fetchLivePlatformBillingConfig();

    // 1. Fetch all real vendors & published products in parallel
    const [{ data: dbVendors, error: vendorErr }, { data: dbProducts, error: prodErr }] =
      await Promise.all([
        supabase.from('vendors').select('*').order('created_at', { ascending: false }),
        supabase
          .from('products')
          .select('id, vendor_id, name, price, description, category, image_url, is_published')
          .eq('is_published', true)
          .order('created_at', { ascending: false }),
      ]);

    if (vendorErr) {
      return NextResponse.json({ error: vendorErr.message }, { status: 500 });
    }
    if (prodErr) {
      return NextResponse.json({ error: prodErr.message }, { status: 500 });
    }

    // 2. Group published products by normalized vendor ID
    const productsByVendor = new Map<string, any[]>();
    (dbProducts || []).forEach((p: any) => {
      const vId = (p.vendor_id || '').toLowerCase().trim();
      if (!vId) return;
      if (!productsByVendor.has(vId)) {
        productsByVendor.set(vId, []);
      }
      productsByVendor.get(vId)!.push(p);
    });

    // 3. Transform real verified vendors with live inventory
    const activeVendors: DynamicAtelier[] = [];

    (dbVendors || []).forEach((v: any) => {
      const vId = (v.id || '').toLowerCase().trim();
      if (!vId || vId.startsWith('admin-')) return;
      if (!v.is_verified) return;

      const vendorProducts = productsByVendor.get(vId) || [];
      if (vendorProducts.length === 0) return;

      let bioText = v.bio || '';
      let parsedBio: Record<string, any> = {};
      let logoUrl = v.logo_url || v.logo || '';
      let city = '';
      let state = '';

      if (typeof bioText === 'string' && bioText.trim().startsWith('{') && bioText.trim().endsWith('}')) {
        try {
          parsedBio = JSON.parse(bioText);
          if (parsedBio.approvalStatus === 'suspended') return;
          bioText = parsedBio.bio || '';
          logoUrl = parsedBio.logoUrl || parsedBio.logo || logoUrl || '';
          city = parsedBio.city || '';
          state = parsedBio.state || '';
        } catch {}
      }

      const locationParts = (v.location || '').split(',');
      if (!city && locationParts[0]) city = locationParts[0].trim();
      if (!state && locationParts[1]) state = locationParts[1].trim();

      const locationDisplay =
        [city, state].filter(Boolean).join(', ') || v.location || 'Verified Brand';

      // Explicit paid/lifetime ÌRÍSÍ Plus membership check (independent of global free launch promo)
      const now = Date.now();
      const hasPaidPlus =
        parsedBio?.plusLifetimeFree === true ||
        (parsedBio?.subscriptionPlan === 'plus' &&
          (!parsedBio?.plusExpiresAt || new Date(parsedBio.plusExpiresAt).getTime() > now));

      const isPlus = isVendorPlusActive(parsedBio, billing);

      // Extract up to 4 real product photos
      const images: string[] = [];
      vendorProducts.forEach((p: any) => {
        if (p.image_url && !images.includes(p.image_url) && images.length < 4) {
          images.push(p.image_url);
        }
      });
      if (images.length === 0) {
        images.push('/images/no-product.svg');
      }

      // Focus & category metadata
      const catCounts: Record<string, number> = {};
      vendorProducts.forEach((p: any) => {
        const cat = (p.category || 'tops').toLowerCase();
        catCounts[cat] = (catCounts[cat] || 0) + 1;
      });
      const topCat = Object.entries(catCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'tops';
      const allNames = vendorProducts.map((p: any) => (p.name || '').toLowerCase()).join(' ');

      let focus = 'Contemporary Ready-to-Wear & Curated Drops';
      let tag = hasPaidPlus ? 'ÌRÍSÍ Plus' : 'Verified Brand';
      let categoryKey: 'streetwear' | 'native' | 'jewelry' | 'footwear' | 'all' = 'streetwear';

      if (allNames.includes('senator') || allNames.includes('agbada') || allNames.includes('kaftan') || allNames.includes('native')) {
        focus = 'Tailored Native Wear & Ceremonial Cuts';
        categoryKey = 'native';
      } else if (topCat === 'accessories' || (allNames.includes('chain') && !allNames.includes('hoodie'))) {
        focus = 'Fine Chains, Jewelry & Statement Accents';
        categoryKey = 'jewelry';
      } else if (topCat === 'outerwear' || topCat === 'tops' || allNames.includes('hoodie') || allNames.includes('jacket')) {
        focus = 'Streetwear & Heavyweight Ready-to-Wear';
        categoryKey = 'streetwear';
      } else if (topCat === 'footwear' || allNames.includes('slide') || allNames.includes('shoe') || allNames.includes('sneaker')) {
        focus = 'Handcrafted Footwear, Slides & Sneakers';
        categoryKey = 'footwear';
      } else if (topCat === 'bottoms' || allNames.includes('jean') || allNames.includes('cargo')) {
        focus = 'Tailored Denim & Street Cargo Silhouettes';
        categoryKey = 'streetwear';
      }

      const validPrices = vendorProducts
        .map((p: any) => Number(p.price))
        .filter((n: number) => !isNaN(n) && n > 0);
      const minPrice = validPrices.length > 0 ? Math.min(...validPrices) : 0;

      const heroPieces = vendorProducts
        .slice(0, 3)
        .map((p: any) => p.name)
        .join(' · ');

      const desc =
        typeof bioText === 'string' && bioText.trim().length > 0
          ? bioText.trim()
          : `Verified independent brand specializing in ${focus.toLowerCase()} with escrow-protected delivery.`;

      const rating = v.rating ? Number(v.rating).toFixed(1) : '5.0';

      activeVendors.push({
        id: v.id,
        slug: v.id,
        name: v.brand_name || v.id.replace(/-/g, ' '),
        logoUrl: typeof logoUrl === 'string' ? logoUrl.trim() : '',
        location: locationDisplay,
        city,
        state,
        focus,
        desc,
        images,
        tag,
        categoryKey,
        heroPieces: heroPieces || 'Curated Ready-to-Wear',
        rating,
        productCount: vendorProducts.length,
        minPrice,
        isPlus,
        hasPaidPlus,
      });
    });

    // Priority sort: 1) Active ÌRÍSÍ Plus subscribers first, 2) Largest live catalog descending
    activeVendors.sort((a, b) => {
      if (a.hasPaidPlus !== b.hasPaidPlus) return a.hasPaidPlus ? -1 : 1;
      return b.productCount - a.productCount;
    });

    const plusVendors = activeVendors.filter((v) => v.hasPaidPlus);

    const categoryCounts = {
      all: activeVendors.length,
      streetwear: activeVendors.filter((v) => v.categoryKey === 'streetwear').length,
      native: activeVendors.filter((v) => v.categoryKey === 'native').length,
      jewelry: activeVendors.filter((v) => v.categoryKey === 'jewelry').length,
      footwear: activeVendors.filter((v) => v.categoryKey === 'footwear').length,
    };

    return NextResponse.json(
      {
        success: true,
        count: activeVendors.length,
        plusCount: plusVendors.length,
        freeLaunchMode: billing.freeLaunchMode,
        categories: categoryCounts,
        // Keep `ateliers` key for backwards compatibility with existing consumers
        ateliers: activeVendors,
        // Featured Home subset: shows paid ÌRÍSÍ Plus brands first (or strictly Plus brands when billing is active & Plus brands exist)
        featuredBrands:
          !billing.freeLaunchMode && plusVendors.length > 0
            ? plusVendors.slice(0, 8)
            : activeVendors.slice(0, 8),
      },
      {
        headers: {
          'Cache-Control': 'no-store, max-age=0',
        },
      }
    );
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
