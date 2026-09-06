import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export interface DynamicAtelier {
  id: string;
  slug: string;
  name: string;
  location: string;
  focus: string;
  desc: string;
  images: string[];
  tag: string;
  heroPieces: string;
  rating: string;
  productCount: number;
}

export async function GET() {
  try {
    const supabase = await createClient();

    // 1. Fetch all vendors from Supabase
    const { data: dbVendors, error: vendorErr } = await supabase
      .from('vendors')
      .select('*')
      .order('created_at', { ascending: false });

    if (vendorErr) {
      return NextResponse.json({ error: vendorErr.message }, { status: 500 });
    }

    // 2. Fetch all published products from Supabase
    const { data: dbProducts, error: prodErr } = await supabase
      .from('products')
      .select('id, vendor_id, name, price, description, category, image_url, is_published')
      .eq('is_published', true)
      .order('created_at', { ascending: false });

    if (prodErr) {
      return NextResponse.json({ error: prodErr.message }, { status: 500 });
    }

    // 3. Group products by vendor
    const productsByVendor = new Map<string, any[]>();
    (dbProducts || []).forEach((p: any) => {
      const vId = (p.vendor_id || '').toLowerCase().trim();
      if (!vId) return;
      if (!productsByVendor.has(vId)) {
        productsByVendor.set(vId, []);
      }
      productsByVendor.get(vId)!.push(p);
    });

    // 4. Transform vendors that have published products
    const activeVendors: DynamicAtelier[] = [];

    (dbVendors || []).forEach((v: any) => {
      const vId = (v.id || '').toLowerCase().trim();
      const vendorProducts = productsByVendor.get(vId) || [];

      // Only showcase vendors with real published inventory
      if (vendorProducts.length === 0) return;

      // Parse bio and location from JSON bio if applicable
      let bioText = v.bio || '';
      let city = '';
      let state = '';

      if (bioText.startsWith('{') && bioText.endsWith('}')) {
        try {
          const parsed = JSON.parse(bioText);
          bioText = parsed.bio || '';
          city = parsed.city || '';
          state = parsed.state || '';
        } catch (e) {}
      }

      const locationDisplay = v.location || (city && state ? `${city}, ${state}` : city || state || 'Nigeria');

      // Extract distinct real product images (up to 4)
      const images: string[] = [];
      vendorProducts.forEach((p: any) => {
        if (p.image_url && !images.includes(p.image_url) && images.length < 4) {
          images.push(p.image_url);
        }
      });

      // If no images found on products, use safe fallback
      if (images.length === 0) {
        images.push('/images/products/BlackTrapStarHoodie.jpg');
      }

      // Determine focus and craft tag based on dominant product category
      const catCounts: Record<string, number> = {};
      vendorProducts.forEach((p: any) => {
        const cat = (p.category || 'tops').toLowerCase();
        catCounts[cat] = (catCounts[cat] || 0) + 1;
      });
      const topCat = Object.entries(catCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'tops';
      const allNames = vendorProducts.map((p: any) => (p.name || '').toLowerCase()).join(' ');

      let focus = 'Contemporary Ready-to-Wear & Urban Drops';
      let tag = v.vendor_type === 'boutique_seller' || v.vendor_type === 'boutique_merchant' ? 'Verified Boutique' : 'Designer Atelier';

      if (allNames.includes('senator') || allNames.includes('agbada') || allNames.includes('kaftan') || allNames.includes('native')) {
        focus = 'Bespoke Senator Suits & Ceremonial Agbada';
        tag = 'Bespoke Tailoring';
      } else if (topCat === 'accessories' || (allNames.includes('chain') && !allNames.includes('hoodie'))) {
        focus = 'Fine Chains, Necklaces & Luxury Accents';
        tag = 'Artisanal Jewelry';
      } else if (topCat === 'outerwear' || topCat === 'tops' || allNames.includes('hoodie') || allNames.includes('trapstar') || allNames.includes('waistcoat')) {
        focus = 'Afro-Streetwear & Heavyweight Drops';
        tag = 'Ready-to-Wear Street';
      } else if (topCat === 'footwear' || allNames.includes('slide') || allNames.includes('shoe')) {
        focus = 'Handcrafted Footwear & Slides';
        tag = 'Handmade Footwear';
      } else if (topCat === 'bottoms' || allNames.includes('jean') || allNames.includes('cargo')) {
        focus = 'Street Denim & Tailored Cargo Fits';
        tag = 'Ready-to-Wear Denim';
      }

      // Signature hero pieces
      const heroPieces = vendorProducts
        .slice(0, 3)
        .map((p: any) => p.name)
        .join(' · ');

      // Clean description
      const desc = typeof bioText === 'string' && bioText.trim().length > 0
        ? bioText.trim()
        : `Verified Nigerian merchant specializing in ${focus.toLowerCase()} crafted for immediate dispatch.`;

      const rating = `5.0 ★ (${vendorProducts.length} ${vendorProducts.length === 1 ? 'Live Piece' : 'Live Pieces'})`;

      activeVendors.push({
        id: v.id,
        slug: v.id,
        name: v.brand_name || 'Verified Atelier',
        location: locationDisplay,
        focus,
        desc,
        images,
        tag,
        heroPieces: heroPieces || 'Curated Ready-to-Wear',
        rating,
        productCount: vendorProducts.length
      });
    });

    // Sort by product count descending (vendors with largest catalogs first)
    activeVendors.sort((a, b) => b.productCount - a.productCount);

    return NextResponse.json({
      success: true,
      count: activeVendors.length,
      ateliers: activeVendors
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=10, stale-while-revalidate=30'
      }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
